/**
 * Shared store for the mocked data layers.
 *
 * Every module that still serves mock data (offers, invoices, decisions …)
 * keeps its records here so that one entity — a client, an application, an
 * audit — carries the same ids and references across every screen.
 *
 * Persistence: in the preview build (`window.__ICASCO_DEMO__ === true`, set by
 * the preview bootstrap) collections are saved to localStorage under the
 * `icasco-demo-` prefix so additions and edits survive a reload. Everywhere
 * else the store is in-memory only, exactly like the previous module-level
 * mock arrays. When a real endpoint lands, the module stops using the store.
 */

const PREFIX = 'icasco-demo-'
/** Bump to discard previously saved demo data after a seed change. */
export const DEMO_SEED_VERSION = 3

type Envelope<T> = { v: number; d: T }

const memory = new Map<string, unknown>()
const listeners = new Set<(key: string) => void>()

export function isDemoMode(): boolean {
  return (globalThis as { __ICASCO_DEMO__?: boolean }).__ICASCO_DEMO__ === true
}

function readPersisted<T>(key: string): T | undefined {
  if (!isDemoMode()) return undefined
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as Envelope<T>
    return parsed && parsed.v === DEMO_SEED_VERSION ? parsed.d : undefined
  } catch {
    return undefined
  }
}

/** Returns the live value for `key`, seeding it on first use. Mutate it, then call `saveState`. */
export function loadState<T>(key: string, seed: () => T): T {
  if (memory.has(key)) return memory.get(key) as T
  const value = readPersisted<T>(key) ?? seed()
  memory.set(key, value)
  return value
}

export function saveState<T>(key: string, value: T): void {
  memory.set(key, value)
  if (isDemoMode()) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify({ v: DEMO_SEED_VERSION, d: value } satisfies Envelope<T>))
    } catch {
      // storage full or blocked — the in-memory copy still works for this session
    }
  }
  listeners.forEach((listener) => listener(key))
}

/** Convenience: load, mutate in place via `fn`, save, return the result of `fn`. */
export function updateState<T, R>(key: string, seed: () => T, fn: (state: T) => R): R {
  const state = loadState(key, seed)
  const result = fn(state)
  saveState(key, state)
  return result
}

export function onStateChange(listener: (key: string) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Drops every saved demo collection; the next read re-seeds from the dataset. */
export function resetDemoState(): void {
  memory.clear()
  try {
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i)
      if (key?.startsWith(PREFIX)) localStorage.removeItem(key)
    }
  } catch {
    // ignore
  }
}

export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export const wait = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))
