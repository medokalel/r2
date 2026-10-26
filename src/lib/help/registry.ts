import { HELP_ARTICLES } from '@/content/help'
import { MORE_SECTION, navItems, sectionSources, type HelpNavItem } from '@/lib/help/navSources'
import { matchRoute, normalizePath, routeSpecificity } from '@/lib/help/routeMatch'
import { TOUR_PREFIXES } from '@/lib/help/tours'
import { HELP_AUDIENCES, HELP_LANGS, type HelpArticleSource, type HelpAudience, type HelpLang, type HelpText } from '@/lib/help/types'

/**
 * iHelp registry: the single place that turns content files + the app's navigation into the
 * help tree. Sections come from the app's navigation configs; every nav item resolves to a
 * written article (by navIds or route) or, failing that, to an auto-generated stub, so a new
 * module is never missing from iHelp.
 */

export type HelpTranslate = (lang: HelpLang, key: string, fallback?: string) => string

export interface HelpArticle extends HelpArticleSource {
  audiences: HelpAudience[]
  /** True for an article generated from a nav item that has no written article yet. */
  stub?: boolean
  /** Nav item the article was reached from (stubs and nav-bound articles). */
  navItem?: HelpNavItem
}

export interface HelpSection {
  /** Unique across audiences: `${audience}-${key}` (used in URLs). */
  id: string
  key: string
  audience: HelpAudience
  title: Record<HelpLang, string>
  description: Record<HelpLang, string>
  articles: HelpArticle[]
}

export interface HelpTree {
  sections: Record<HelpAudience, HelpSection[]>
  articles: Map<string, HelpArticle>
  /** Section of an article inside an audience: `${audience}:${articleId}` → section. */
  sectionOf: Map<string, HelpSection>
}

export const audiencesOf = (article: HelpArticleSource): HelpAudience[] =>
  Array.isArray(article.audience) ? article.audience : [article.audience]

/** Section key of an article for one audience. */
export const sectionKeyOf = (article: HelpArticleSource, audience: HelpAudience): string =>
  typeof article.section === 'string' ? article.section : (article.section[audience] ?? MORE_SECTION)

const samePath = (a: string, b: string) => normalizePath(a) === normalizePath(b)

/** Written article documenting a nav item: an explicit navIds entry wins over a route match. */
export function findArticleForNavItem(articles: HelpArticleSource[], audience: HelpAudience, item: HelpNavItem): HelpArticleSource | undefined {
  const own = articles.filter((article) => audiencesOf(article).includes(audience))
  return own.find((article) => article.navIds?.includes(item.id)) ?? own.find((article) => article.routes.some((route) => samePath(route, item.route)))
}

function stubFor(item: HelpNavItem, audience: HelpAudience, sectionTitle: Record<HelpLang, string>, translate: HelpTranslate): HelpArticle {
  const text = {} as Record<HelpLang, HelpText>
  for (const lang of HELP_LANGS) {
    const name = translate(lang, item.labelKey, item.id)
    const description = item.descriptionKey ? translate(lang, item.descriptionKey, '') : ''
    text[lang] = {
      title: name,
      summary: description || translate(lang, 'help.stub.summary', name).replace('{{name}}', name),
      nav: `${sectionTitle[lang]} → ${name}`,
    }
  }
  return {
    id: `auto-${audience}-${item.id.replace(/[^A-Za-z0-9]+/g, '-').toLowerCase()}`,
    audience,
    audiences: [audience],
    section: item.sectionKey,
    routes: [item.route],
    open: item.route,
    navIds: [item.id],
    tourPrefix: TOUR_PREFIXES[normalizePath(item.route)],
    updated: '',
    stub: true,
    navItem: item,
    text,
  }
}

export function buildHelpTree(translate: HelpTranslate, articles: HelpArticleSource[] = HELP_ARTICLES): HelpTree {
  const all = new Map<string, HelpArticle>()
  const sectionOf = new Map<string, HelpSection>()
  const sections = {} as Record<HelpAudience, HelpSection[]>

  for (const source of articles) {
    all.set(source.id, { ...source, audiences: audiencesOf(source) })
  }

  for (const audience of HELP_AUDIENCES) {
    const list: HelpSection[] = sectionSources(audience).map((src) => ({
      id: `${audience}-${src.key}`,
      key: src.key,
      audience,
      title: { en: translate('en', src.titleKey, src.key), ar: translate('ar', src.titleKey, src.key) },
      description: { en: translate('en', src.descriptionKey, ''), ar: translate('ar', src.descriptionKey, '') },
      articles: [],
    }))
    const byKey = new Map(list.map((section) => [section.key, section]))
    const placed = new Set<string>()
    const place = (article: HelpArticle, key: string) => {
      if (placed.has(article.id)) return
      const section = byKey.get(key) ?? byKey.get(MORE_SECTION)
      if (!section) return
      section.articles.push(article)
      sectionOf.set(`${audience}:${article.id}`, section)
      placed.add(article.id)
    }

    // 1. Nav items, in navigation order: the written article, or a stub.
    for (const item of navItems(audience)) {
      const written = findArticleForNavItem(articles, audience, item)
      if (written) {
        place(all.get(written.id)!, sectionKeyOf(written, audience))
        continue
      }
      const sectionTitle = byKey.get(item.sectionKey)?.title ?? byKey.get(MORE_SECTION)!.title
      const stub = stubFor(item, audience, sectionTitle, translate)
      if (!all.has(stub.id)) all.set(stub.id, stub)
      place(all.get(stub.id)!, item.sectionKey)
    }
    // 2. Every other written article of the audience, in content order.
    for (const source of articles) {
      if (audiencesOf(source).includes(audience)) place(all.get(source.id)!, sectionKeyOf(source, audience))
    }

    sections[audience] = list.filter((section) => section.articles.length > 0)
  }

  return { sections, articles: all, sectionOf }
}

/** The article that documents `pathname` for an audience (most specific route wins). */
export function findArticleForPath(tree: HelpTree, audience: HelpAudience, pathname: string): HelpArticle | undefined {
  let best: { article: HelpArticle; score: number } | undefined
  for (const section of tree.sections[audience]) {
    for (const article of section.articles) {
      for (const route of article.routes) {
        if (!matchRoute(route, pathname)) continue
        const score = routeSpecificity(route)
        if (!best || score > best.score) best = { article, score }
      }
    }
  }
  return best?.article
}

/** Articles of an audience in reading order (for previous / next). */
export function flatArticles(tree: HelpTree, audience: HelpAudience): HelpArticle[] {
  return tree.sections[audience].flatMap((section) => section.articles)
}
