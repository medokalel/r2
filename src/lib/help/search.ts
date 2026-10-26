import type { HelpArticle, HelpTree } from '@/lib/help/registry'
import type { HelpAudience, HelpLang, HelpText } from '@/lib/help/types'

/**
 * Client-side iHelp search: titles, keywords, summaries, body text and sub-sections, in the
 * current language. Arabic is normalised (diacritics, tatweel, alef / ya / ta marbuta forms)
 * so "الشهادة" finds "الشّهادة" and "اعتماد" finds "إعتماد".
 */

const ARABIC_MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/

/** Normalises one character; returns '' for characters that are dropped. */
function normChar(ch: string): string {
  if (ARABIC_MARKS.test(ch)) return ''
  switch (ch) {
    case 'أ':
    case 'إ':
    case 'آ':
    case 'ٱ':
      return 'ا'
    case 'ة':
      return 'ه'
    case 'ى':
      return 'ي'
    case 'ؤ':
      return 'و'
    case 'ئ':
      return 'ي'
    default:
      return ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  }
}

/** Normalised text plus, for each normalised character, its index in the original text. */
function normalizeWithMap(text: string): { norm: string; map: number[] } {
  let norm = ''
  const map: number[] = []
  for (let i = 0; i < text.length; i += 1) {
    const out = normChar(text[i])
    for (const c of out) {
      norm += c
      map.push(i)
    }
  }
  return { norm, map }
}

export function normalizeSearch(text: string): string {
  return normalizeWithMap(text).norm
}

export function searchTokens(query: string): string[] {
  return normalizeSearch(query)
    .split(/[\s,.;:!?،؛()«»"'/\\-]+/)
    .filter((token) => token.length >= 2)
}

/** Ranges [start, end) in `text` that match any token (for <mark> highlighting). */
export function highlightRanges(text: string, tokens: string[]): Array<[number, number]> {
  if (!tokens.length || !text) return []
  const { norm, map } = normalizeWithMap(text)
  const ranges: Array<[number, number]> = []
  for (const token of tokens) {
    let from = 0
    for (;;) {
      const at = norm.indexOf(token, from)
      if (at < 0) break
      ranges.push([map[at], map[at + token.length - 1] + 1])
      from = at + token.length
    }
  }
  ranges.sort((a, b) => a[0] - b[0])
  const merged: Array<[number, number]> = []
  for (const range of ranges) {
    const last = merged[merged.length - 1]
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1])
    else merged.push([...range])
  }
  return merged
}

export interface SearchDoc {
  articleId: string
  sectionId: string
  /** Anchor of a sub-section inside the article. */
  anchor?: string
  title: string
  /** Article title when the doc is a sub-section. */
  parentTitle?: string
  keywords: string
  summary: string
  body: string
  stub?: boolean
  n: { title: string; keywords: string; summary: string; body: string }
}

export interface SearchHit {
  doc: SearchDoc
  score: number
  snippet: string
}

function bodyOf(text: HelpText): string {
  return [
    text.who,
    text.when,
    text.nav,
    ...(text.screen ?? []),
    ...(text.steps ?? []),
    ...(text.fields ?? []).flat(),
    ...(text.rules ?? []),
    ...(text.statuses ?? []).flat(),
    ...(text.after ?? []),
    ...(text.tips ?? []),
    ...(text.warnings ?? []),
    text.handoff,
  ]
    .filter(Boolean)
    .join(' · ')
}

function makeDoc(base: Omit<SearchDoc, 'n'>): SearchDoc {
  return {
    ...base,
    n: {
      title: normalizeSearch(base.title),
      keywords: normalizeSearch(base.keywords),
      summary: normalizeSearch(base.summary),
      body: normalizeSearch(base.body),
    },
  }
}

export function buildSearchIndex(tree: HelpTree, audience: HelpAudience, lang: HelpLang): SearchDoc[] {
  const docs: SearchDoc[] = []
  const seen = new Set<string>()
  for (const section of tree.sections[audience]) {
    for (const article of section.articles as HelpArticle[]) {
      if (seen.has(article.id)) continue
      seen.add(article.id)
      const text = article.text[lang]
      docs.push(
        makeDoc({
          articleId: article.id,
          sectionId: section.id,
          title: text.title,
          keywords: [section.title[lang], ...(text.keywords ?? [])].join(' '),
          summary: text.summary,
          body: bodyOf(text),
          stub: article.stub,
        }),
      )
      for (const sub of text.sections ?? []) {
        docs.push(
          makeDoc({
            articleId: article.id,
            sectionId: section.id,
            anchor: sub.id,
            title: sub.title,
            parentTitle: text.title,
            keywords: '',
            summary: '',
            body: sub.bullets.join(' · '),
          }),
        )
      }
    }
  }
  return docs
}

function snippetFor(doc: SearchDoc, tokens: string[]): string {
  const source = doc.summary && tokens.some((token) => doc.n.summary.includes(token)) ? doc.summary : doc.body || doc.summary
  if (!source) return ''
  const ranges = highlightRanges(source, tokens)
  const at = ranges.length ? ranges[0][0] : 0
  const start = Math.max(0, at - 50)
  const end = Math.min(source.length, start + 170)
  return `${start > 0 ? '… ' : ''}${source.slice(start, end).trim()}${end < source.length ? ' …' : ''}`
}

/** Every token must appear somewhere in the doc; titles weigh most, then keywords, summary, body. */
export function searchHelp(docs: SearchDoc[], query: string, limit = 12): SearchHit[] {
  const tokens = searchTokens(query)
  if (!tokens.length) return []
  const hits: SearchHit[] = []
  for (const doc of docs) {
    let score = 0
    let all = true
    for (const token of tokens) {
      let s = 0
      if (doc.n.title.includes(token)) s += doc.n.title.startsWith(token) ? 14 : 10
      if (doc.n.keywords.includes(token)) s += 6
      if (doc.n.summary.includes(token)) s += 4
      if (doc.n.body.includes(token)) s += 1
      if (!s) {
        all = false
        break
      }
      score += s
    }
    if (!all) continue
    // Whole articles rank above their sub-sections; a title that is the query itself ranks first.
    if (!doc.anchor) score += 8
    if (doc.n.title === tokens.join(' ') || doc.n.title.split(/\s+/).some((word) => word === tokens[0] || word === `${tokens[0]}s`)) score += 6
    if (doc.stub) score -= 1
    hits.push({ doc, score, snippet: snippetFor(doc, tokens) })
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}
