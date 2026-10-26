/**
 * Tiny global toast store (same idea as react-hot-toast, without a new dependency).
 *
 *   toast.success('Saved')
 *   toast.error(getUserErrorMessage(error, t))
 *   toast.info('Draft restored', { description: 'We kept what you typed last time.' })
 *
 * Works from anywhere (components, hooks, plain functions). Render <Toaster /> once at the app root.
 * A message with line breaks shows its first line as the title and the rest as the details.
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastOptions {
  /** Extra line(s) under the title. */
  description?: string
  /** Override how long the toast stays, in ms. */
  duration?: number
}

export interface ToastItem {
  id: number
  type: ToastType
  /** Title line. */
  message: string
  /** Optional details under the title. */
  description?: string
  /** How long the toast stays, in ms (also drives the progress bar). */
  duration: number
}

const BASE_MS: Record<ToastType, number> = { success: 3500, info: 4500, warning: 6000, error: 6000 }
const EXTRA_MS_PER_LINE = 1500
const MAX_MS = 12000
const MAX_VISIBLE = 4

let items: ToastItem[] = []
let nextId = 1
const timers = new Map<number, ReturnType<typeof setTimeout>>()
/** Time left before each toast closes, and when its current countdown started. */
const clocks = new Map<number, { remaining: number; startedAt: number }>()
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getToasts(): ToastItem[] {
  return items
}

function dismiss(id: number) {
  const timer = timers.get(id)
  if (timer) clearTimeout(timer)
  timers.delete(id)
  clocks.delete(id)
  items = items.filter((item) => item.id !== id)
  emit()
}

/** Pauses the auto-dismiss while the pointer or focus is on a toast. */
function hold(id: number) {
  const timer = timers.get(id)
  const clock = clocks.get(id)
  if (!timer || !clock) return
  clearTimeout(timer)
  timers.delete(id)
  clock.remaining = Math.max(clock.remaining - (Date.now() - clock.startedAt), 0)
}

function start(id: number, ms: number) {
  clocks.set(id, { remaining: ms, startedAt: Date.now() })
  timers.set(id, setTimeout(() => dismiss(id), ms))
}

/** Restarts the auto-dismiss after a hold. */
function release(id: number) {
  const clock = clocks.get(id)
  if (!clock || timers.has(id)) return
  start(id, Math.max(clock.remaining, 1200))
}

function push(type: ToastType, message: string, options: ToastOptions = {}) {
  const [title = '', ...rest] = message.trim().split('\n')
  const text = title.trim()
  if (!text) return
  const description = [rest.join('\n').trim(), options.description?.trim() ?? ''].filter(Boolean).join('\n') || undefined

  // The same message shown again replaces the old one instead of piling up.
  const duplicate = items.find((item) => item.type === type && item.message === text && item.description === description)
  if (duplicate) dismiss(duplicate.id)

  const lines = 1 + (description ? description.split('\n').length : 0)
  const duration = options.duration ?? Math.min(BASE_MS[type] + (lines - 1) * EXTRA_MS_PER_LINE, MAX_MS)

  const id = nextId++
  items = [...items, { id, type, message: text, description, duration }].slice(-MAX_VISIBLE)
  emit()
  start(id, duration)
}

export const toast = {
  success: (message: string, options?: ToastOptions) => push('success', message, options),
  error: (message: string, options?: ToastOptions) => push('error', message, options),
  info: (message: string, options?: ToastOptions) => push('info', message, options),
  warning: (message: string, options?: ToastOptions) => push('warning', message, options),
  dismiss,
  hold,
  release,
}
