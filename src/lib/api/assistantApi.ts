/**
 * In-app assistant. Order: the AI bridge (preview), then the backend
 * POST /assistant/ask { question, history, context } → { answer } (Anthropic Messages API on the
 * server; 503 when it has no API key), then the offline page guide — so there is always an answer.
 */
import { API_BASE_URL } from '@/lib/api/config'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { getAuthToken } from '@/lib/authStorage'
import { GLOBAL_ISSUES, assistantDestinations, type PageHelp } from '@/lib/assistant/knowledge'

export interface AssistantTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface AssistantContext {
  lang: 'en' | 'ar'
  path: string
  pageTitle: string
  help: PageHelp
  /** Error messages and invalid fields currently on screen. */
  problems: string[]
}

export interface AssistantAnswer {
  text: string
  /** Pages the answer suggests opening. */
  links: Array<{ route: string; name: string }>
  source: 'ai' | 'guide'
}

/** Optional AI bridge (installed by the preview); production calls the backend endpoint below. */
type AiBridge = (prompt: string, onText?: (text: string) => void) => Promise<string>
const bridge = () => (globalThis as { __icascoAssistantAsk?: AiBridge }).__icascoAssistantAsk

const STOPWORDS = new Set(['what', 'how', 'the', 'and', 'this', 'that', 'here', 'page', 'can', 'does', 'why', 'stuck', "i'm", 'help', 'ايه', 'إيه', 'اعمل', 'أعمل', 'واقف', 'انا', 'أنا', 'الصفحة', 'دي', 'ازاي', 'إزاي', 'ليه', 'ماذا', 'كيف', 'لماذا', 'هذه', 'هذا', 'أفعل', 'افعل', 'هنا'])

const LINK_LINE = /^\s*→\s*(\/\S+)\s*$/

/** Splits "→ /route" lines out of an answer and keeps only routes the app knows. */
export function splitAnswer(raw: string, lang: 'en' | 'ar'): { text: string; links: AssistantAnswer['links'] } {
  const known = assistantDestinations(lang)
  const links: AssistantAnswer['links'] = []
  const text = raw
    .split('\n')
    .filter((line) => {
      const m = line.match(LINK_LINE)
      if (!m) return true
      const hit = known.find((k) => k.route === m[1])
      if (hit && !links.some((l) => l.route === hit.route)) links.push(hit)
      return false
    })
    .join('\n')
    .trim()
  return { text, links }
}

function buildPrompt(question: string, ctx: AssistantContext, history: AssistantTurn[]): string {
  const L = ctx.lang
  const help = ctx.help
  const lines = [
    'You are the in-app assistant of iCASCO, a system that runs a certification body under ISO/IEC 17021-1 (application, review, quotation, audit planning, audit, nonconformities, decision, certificate, surveillance, recertification).',
    `Answer in ${L === 'ar' ? 'clear Modern Standard Arabic for a Saudi audience, simple and friendly, keeping technical terms like ISO or IAF in English' : 'plain English'}.`,
    'Be short: at most 5 short lines or 4 numbered steps. Say exactly which button or field to use. Never invent features, data or numbers that are not in the context.',
    'If a page would help, end with one or two lines of the form "→ /route" using ONLY routes from the list below.',
    '',
    `Current page: ${ctx.pageTitle} (${ctx.path})`,
    `What this page is for: ${help.purpose[L]}`,
    help.steps.length ? `Steps here: ${help.steps.map((s, i) => `${i + 1}. ${s[L]}`).join(' ')}` : '',
    help.issues.length ? `Known problems here: ${help.issues.map((i) => `${i.q[L]} → ${i.a[L]}`).join(' | ')}` : '',
    help.next ? `Next step after this page: ${help.next.label[L]} (${help.next.route})` : '',
    ctx.problems.length ? `Problems shown on screen right now: ${ctx.problems.join(' | ')}` : 'No error is shown on screen.',
    `Routes you may link: ${assistantDestinations(L).map((d) => `${d.route} = ${d.name}`).join('; ')}`,
    '',
    ...history.slice(-6).map((turn) => `${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.content}`),
    `User: ${question}`,
    'Assistant:',
  ]
  return lines.filter((line) => line !== '').join('\n')
}

/** Offline answer from the page guide: best-matching known problem, else the page steps. */
export function guideAnswer(question: string, ctx: AssistantContext): AssistantAnswer {
  const L = ctx.lang
  const words = question
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  const pool = [...ctx.help.issues, ...GLOBAL_ISSUES]
  const scored = pool
    .map((issue) => ({ issue, score: words.filter((w) => issue.q[L].toLowerCase().includes(w)).length * 2 + words.filter((w) => issue.a[L].toLowerCase().includes(w)).length }))
    .sort((a, b) => b.score - a.score)
  const best = scored[0] && scored[0].score >= 2 ? scored[0].issue : null
  const links = assistantDestinations(L)
  const link = (route?: string) => (route ? links.filter((d) => d.route === route) : [])
  if (best) return { text: best.a[L], links: link(best.route), source: 'guide' }
  const steps = ctx.help.steps.map((s, i) => `${i + 1}. ${s[L]}`).join('\n')
  const intro = ctx.help.purpose[L]
  const next = ctx.help.next ? (L === 'ar' ? `\nبعدها: ${ctx.help.next.label.ar}.` : `\nThen: ${ctx.help.next.label.en}.`) : ''
  const problem = ctx.problems[0] ? (L === 'ar' ? `\nالرسالة الظاهرة: "${ctx.problems[0]}". صحّح الحقل أو البيان المذكور فيها ثم حاول مرة أخرى.` : `\nThe message on screen: "${ctx.problems[0]}". Fix the field or data it names and try again.`) : ''
  return { text: `${intro}${steps ? `\n${steps}` : ''}${next}${problem}`, links: link(ctx.help.next?.route), source: 'guide' }
}

/**
 * Context sent to POST /assistant/ask: the page guide and the linkable routes in the user's
 * language, so the server prompt matches buildPrompt above.
 */
function backendContext(ctx: AssistantContext) {
  const L = ctx.lang
  const help = ctx.help
  return {
    lang: L,
    path: ctx.path,
    pageTitle: ctx.pageTitle,
    problems: ctx.problems.slice(0, 10).map((p) => p.slice(0, 500)),
    guide: {
      purpose: help.purpose[L],
      steps: help.steps.map((s) => s[L]),
      issues: help.issues.map((i) => ({ q: i.q[L], a: i.a[L] })),
      ...(help.next ? { next: { route: help.next.route, label: help.next.label[L] } } : {}),
    },
    routes: assistantDestinations(L),
  }
}

/**
 * Ask the assistant. Order: the AI bridge (preview), then the backend
 * (POST /assistant/ask; any failure, including 503 "not configured", falls through),
 * then the page guide, so there is always an answer.
 */
export async function askAssistant(
  question: string,
  ctx: AssistantContext,
  history: AssistantTurn[],
  onText?: (partial: string) => void,
): Promise<AssistantAnswer> {
  const prompt = buildPrompt(question, ctx, history)
  const ai = bridge()
  if (ai) {
    try {
      const raw = await ai(prompt, (partial) => onText?.(splitAnswer(partial, ctx.lang).text))
      const { text, links } = splitAnswer(raw, ctx.lang)
      if (text) return { text, links, source: 'ai' }
    } catch {
      // fall through to the backend / guide
    }
  }
  const token = getAuthToken()
  if (token && !ai && !isDemoMode()) {
    try {
      const response = await fetch(`${API_BASE_URL}/assistant/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          question: question.slice(0, 1000),
          history: history.slice(-6).map((turn) => ({ role: turn.role, content: turn.content.slice(0, 4000) })),
          context: backendContext(ctx),
        }),
      })
      if (response.ok) {
        const body = (await response.json()) as { data?: { answer?: string } }
        const { text, links } = splitAnswer(body.data?.answer ?? '', ctx.lang)
        if (text) return { text, links, source: 'ai' }
      }
    } catch {
      // backend unreachable — use the page guide
    }
  }
  return guideAnswer(question, ctx)
}
