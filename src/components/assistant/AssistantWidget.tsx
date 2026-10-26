import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { AppIcon, AssistantIcon, SendIcon } from '@/components/icons'
import { askAssistant, type AssistantAnswer, type AssistantContext, type AssistantTurn } from '@/lib/api/assistantApi'
import { GLOBAL_ISSUES, helpForPath } from '@/lib/assistant/knowledge'
import { cn } from '@/lib/utils'

interface Message {
  id: number
  role: 'user' | 'assistant'
  text: string
  links?: AssistantAnswer['links']
  pending?: boolean
}

const IDLE_MS = 90_000

/** Error texts and invalid fields visible on the page right now. */
function readScreenProblems(): string[] {
  const out = new Set<string>()
  document.querySelectorAll<HTMLElement>('main [role="alert"], main .text-error-500, main .text-error-600').forEach((el) => {
    const text = el.innerText?.trim()
    if (text && text.length < 200) out.add(text)
  })
  document.querySelectorAll<HTMLElement>('main [aria-invalid="true"]').forEach((el) => {
    const id = el.getAttribute('id')
    const label = (id && document.querySelector(`label[for="${id}"]`)?.textContent) || el.getAttribute('aria-label') || el.getAttribute('name')
    if (label) out.add(`invalid field: ${label.trim()}`)
  })
  return [...out].slice(0, 6)
}

/**
 * The in-app assistant: a button on every page that explains where you are,
 * what to do next and how to get past a problem. It offers itself when a
 * request fails, a script error happens, or someone sits on a form for a while.
 */
export function AssistantWidget({ liftOnMobile = false }: { liftOnMobile?: boolean }) {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const lang: 'en' | 'ar' = i18n.language?.startsWith('ar') ? 'ar' : 'en'
  const help = useMemo(() => helpForPath(location.pathname), [location.pathname])

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [nudge, setNudge] = useState<{ kind: 'error' | 'idle'; detail?: string } | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)
  const seq = useRef(0)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const dismissedIdle = useRef(new Set<string>())

  // New page, new conversation (reset while rendering, not in an effect).
  const [chatPath, setChatPath] = useState(location.pathname)
  if (chatPath !== location.pathname) {
    setChatPath(location.pathname)
    setMessages([])
    setLastError(null)
    setNudge(null)
  }

  // Offer help when something fails.
  useEffect(() => {
    const onApiError = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string; status?: number }>).detail
      const message = detail?.message || t('assistant.genericError', 'The request failed')
      setLastError(message)
      if (detail?.status !== 401) setNudge({ kind: 'error', detail: message })
    }
    const onScriptError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const reason = 'reason' in event ? event.reason : event.error
      const message = reason instanceof Error ? reason.message : String(reason ?? '')
      if (!message || /ResizeObserver/i.test(message)) return
      setLastError(message)
      setNudge({ kind: 'error', detail: message })
    }
    window.addEventListener('icasco:api-error', onApiError)
    window.addEventListener('error', onScriptError)
    window.addEventListener('unhandledrejection', onScriptError)
    return () => {
      window.removeEventListener('icasco:api-error', onApiError)
      window.removeEventListener('error', onScriptError)
      window.removeEventListener('unhandledrejection', onScriptError)
    }
  }, [t])

  // Offer help when someone sits on a form without moving forward.
  useEffect(() => {
    if (open) return
    let timer = 0
    const arm = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        const hasForm = document.querySelector('main input, main textarea, main select')
        if (hasForm && !dismissedIdle.current.has(location.pathname)) setNudge((current) => current ?? { kind: 'idle' })
      }, IDLE_MS)
    }
    const events = ['pointerdown', 'keydown', 'scroll'] as const
    events.forEach((name) => window.addEventListener(name, arm, { passive: true }))
    arm()
    return () => {
      window.clearTimeout(timer)
      events.forEach((name) => window.removeEventListener(name, arm))
    }
  }, [open, location.pathname])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const context = useCallback((): AssistantContext => {
    const problems = readScreenProblems()
    if (lastError && !problems.includes(lastError)) problems.unshift(lastError)
    const pageTitle = document.querySelector('header h1')?.textContent?.trim() || help.title[lang]
    return { lang, path: location.pathname, pageTitle, help, problems }
  }, [help, lang, lastError, location.pathname])

  const ask = useCallback(
    async (question: string) => {
      const q = question.trim()
      if (!q || busy) return
      const history: AssistantTurn[] = messages.filter((m) => !m.pending).map((m) => ({ role: m.role, content: m.text }))
      const userMsg: Message = { id: ++seq.current, role: 'user', text: q }
      const replyId = ++seq.current
      setMessages((prev) => [...prev, userMsg, { id: replyId, role: 'assistant', text: '', pending: true }])
      setInput('')
      setBusy(true)
      setNudge(null)
      const update = (patch: Partial<Message>) => setMessages((prev) => prev.map((m) => (m.id === replyId ? { ...m, ...patch } : m)))
      try {
        const answer = await askAssistant(q, context(), history, (partial) => update({ text: partial }))
        update({ text: answer.text, links: answer.links, pending: false })
      } finally {
        setBusy(false)
      }
    },
    [busy, context, messages],
  )

  const openWith = (question?: string) => {
    setOpen(true)
    setNudge(null)
    if (question) void ask(question)
  }

  const chips = [
    ...help.issues.map((issue) => issue.q[lang]),
    t('assistant.chips.stuck', "I'm stuck, what do I do?"),
    GLOBAL_ISSUES[2].q[lang],
  ].slice(0, 5)

  const errorQuestion = (detail?: string) =>
    t('assistant.explainError', { error: detail ?? lastError ?? '', defaultValue: 'I got this message: "{{error}}". What should I do?' })

  return (
    <div
      dir={i18n.dir()}
      className={cn('fixed end-4 z-40 flex flex-col items-end gap-3 sm:end-6', liftOnMobile ? 'bottom-20 md:bottom-6' : 'bottom-4 sm:bottom-6')}
    >
      {open && (
        <section
          role="dialog"
          aria-modal="false"
          aria-label={t('assistant.title', 'Smart assistant')}
          className="flex h-[min(620px,calc(100dvh-120px))] w-[min(400px,calc(100vw-32px))] flex-col overflow-hidden rounded-lg border border-primary-100 bg-white shadow-elevated"
        >
          <header className="flex items-start justify-between gap-3 bg-primary px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                <AppIcon icon={AssistantIcon} size={20} />
              </span>
              <div className="min-w-0">
                <h2 className="text-body font-semibold leading-tight">{t('assistant.title', 'Smart assistant')}</h2>
                <p className="truncate text-caption text-white/80">
                  {t('assistant.youAreOn', { page: help.key === 'generic' ? context().pageTitle : help.title[lang], defaultValue: 'You are on: {{page}}' })}
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={t('common.close', 'Close')} className="flex size-8 items-center justify-center rounded-full text-body-lg leading-none hover:bg-white/15">
              ×
            </button>
          </header>

          <div ref={listRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {lastError && (
              <div role="status" className="rounded-lg border border-error-100 bg-error-50 p-3 text-body-sm">
                <p className="font-semibold text-error-600">{t('assistant.problemTitle', 'Something went wrong')}</p>
                <p className="mt-0.5 break-words text-neutral-800">{lastError}</p>
                <button type="button" disabled={busy} onClick={() => void ask(errorQuestion())} className="mt-2 text-body-sm font-semibold text-primary hover:underline">
                  {t('assistant.explainBtn', 'Explain and help me fix it')}
                </button>
              </div>
            )}

            {messages.length === 0 && (
              <div className="rounded-lg bg-primary-25 p-3 text-body-sm leading-[1.6] text-neutral-800">
                <p className="font-semibold text-primary">{help.key === 'generic' ? t('assistant.hello', 'How can I help?') : help.title[lang]}</p>
                <p className="mt-1">{help.purpose[lang]}</p>
                {help.steps.length > 0 && (
                  <ol className="mt-2 list-decimal space-y-1 ps-5">
                    {help.steps.map((step) => (
                      <li key={step.en}>{step[lang]}</li>
                    ))}
                  </ol>
                )}
                {help.next && (
                  <button type="button" onClick={() => navigate(help.next!.route)} className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-caption font-semibold text-primary shadow-card hover:bg-primary-50">
                    {t('assistant.nextStep', { step: help.next.label[lang], defaultValue: 'Next step: {{step}}' })}
                    <span aria-hidden className="inline-block rtl:-scale-x-100">→</span>
                  </button>
                )}
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={cn('flex flex-col gap-2', message.role === 'user' ? 'items-end' : 'items-start')}>
                <div
                  className={cn(
                    'max-w-[88%] whitespace-pre-line rounded-lg px-3.5 py-2.5 text-body-sm leading-[1.6]',
                    message.role === 'user' ? 'rounded-ee-sm bg-primary text-white' : 'rounded-es-sm bg-neutral-25 text-neutral-900 ring-1 ring-neutral-100',
                  )}
                >
                  {message.text || (message.pending ? <TypingDots label={t('assistant.thinking', 'Thinking…')} /> : '')}
                </div>
                {message.links && message.links.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {message.links.map((link) => (
                      <button key={link.route} type="button" onClick={() => navigate(link.route)} className="inline-flex items-center gap-1 rounded-full border border-primary-100 bg-white px-3 py-1 text-caption font-semibold text-primary hover:bg-primary-25">
                        {t('assistant.open', { page: link.name, defaultValue: 'Open {{page}}' })}
                        <span aria-hidden className="inline-block rtl:-scale-x-100">→</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 border-t border-neutral-100 px-4 pt-3">
              {chips.map((chip) => (
                <button key={chip} type="button" disabled={busy} onClick={() => void ask(chip)} className="rounded-full border border-neutral-100 bg-white px-3 py-1 text-caption text-neutral-800 hover:border-primary-100 hover:bg-primary-25 hover:text-primary">
                  {chip}
                </button>
              ))}
            </div>
          )}

          <form
            className="flex items-end gap-2 p-3"
            onSubmit={(event) => {
              event.preventDefault()
              void ask(input)
            }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void ask(input)
                }
              }}
              placeholder={t('assistant.placeholder', 'Ask anything about this page…')}
              aria-label={t('assistant.placeholder', 'Ask anything about this page…')}
              className="max-h-28 min-h-11 flex-1 resize-none rounded-md border border-neutral-100 px-3 py-2.5 text-body-sm focus:border-focus focus:outline-none"
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label={t('assistant.send', 'Send')} className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-50">
              <AppIcon icon={SendIcon} size={20} className="rtl:-scale-x-100" />
            </button>
          </form>
        </section>
      )}

      {!open && nudge && (
        <div role="status" className="relative w-[min(300px,calc(100vw-32px))] rounded-lg border border-primary-100 bg-white p-3 text-body-sm shadow-elevated">
          <button
            type="button"
            aria-label={t('common.close', 'Close')}
            onClick={() => {
              if (nudge.kind === 'idle') dismissedIdle.current.add(location.pathname)
              setNudge(null)
            }}
            className="absolute end-2 top-1.5 text-body leading-none text-neutral-600 hover:text-neutral-800"
          >
            ×
          </button>
          <p className="pe-4 font-semibold text-neutral-900">
            {nudge.kind === 'error' ? t('assistant.nudgeError', 'Looks like something went wrong.') : t('assistant.nudgeIdle', 'Stuck here? I can help.')}
          </p>
          <button
            type="button"
            onClick={() => openWith(nudge.kind === 'error' ? errorQuestion(nudge.detail) : undefined)}
            className="mt-1.5 font-semibold text-primary hover:underline"
          >
            {nudge.kind === 'error' ? t('assistant.nudgeErrorBtn', 'Help me fix it') : t('assistant.nudgeIdleBtn', 'Show me what to do')}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openWith())}
        aria-expanded={open}
        aria-label={t('assistant.title', 'Smart assistant')}
        title={t('assistant.title', 'Smart assistant')}
        data-assistant-button
        className={cn(
          'relative flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-elevated transition-transform hover:scale-105 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        )}
      >
        {nudge && !open && <span className="absolute -top-0.5 end-0.5 size-3.5 animate-ping rounded-full bg-warning-500" aria-hidden />}
        {nudge && !open && <span className="absolute -top-0.5 end-0.5 size-3.5 rounded-full border-2 border-white bg-warning-500" aria-hidden />}
        {open ? <span className="text-[28px] leading-none">×</span> : <AppIcon icon={AssistantIcon} size={26} />}
      </button>
    </div>
  )
}

function TypingDots({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={label}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${i * 120}ms` }} />
      ))}
    </span>
  )
}
