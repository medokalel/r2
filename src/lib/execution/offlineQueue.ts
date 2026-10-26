/**
 * Offline tolerance of the audit execution workspace.
 *
 * - Checklist result edits made while the device is offline (or when the request fails on the
 *   network) are queued per plan in localStorage and replayed in order with POST …/execution/sync
 *   when the connection is back. The server skips a queued change older than the saved one.
 * - The last workspace loaded is cached per plan so the auditor can keep working after a reload
 *   without signal.
 *
 * Every access is wrapped: a blocked or full storage only disables the offline features.
 */

import type { AuditExecutionWorkspace, ItemUpdate, SyncOperation } from '@/lib/api/executionApi'

const QUEUE_PREFIX = 'icasco-exec-queue-'
const CACHE_PREFIX = 'icasco-exec-cache-'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or blocked: the queue only lives in memory for this page
  }
}

export function queuedOperations(planId: string): SyncOperation[] {
  return read<SyncOperation[]>(QUEUE_PREFIX + planId, [])
}

/** Adds a change to the queue; a newer change of the same item replaces the fields it repeats. */
export function enqueueItemChange(planId: string, itemId: string, data: ItemUpdate): SyncOperation[] {
  const at = new Date().toISOString()
  const queue = queuedOperations(planId)
  const last = queue[queue.length - 1]
  if (last && last.itemId === itemId) {
    last.data = { ...last.data, ...data }
    last.at = at
  } else {
    queue.push({ opId: `op-${Date.now()}-${Math.round(Math.random() * 1e6)}`, type: 'item', itemId, data, at })
  }
  write(QUEUE_PREFIX + planId, queue)
  return queue
}

/** Removes the operations the server answered (applied, stale or failed for good). */
export function dropOperations(planId: string, opIds: string[]): SyncOperation[] {
  const done = new Set(opIds)
  const queue = queuedOperations(planId).filter((op) => !done.has(op.opId))
  write(QUEUE_PREFIX + planId, queue.length ? queue : null)
  return queue
}

export function cacheWorkspace(planId: string, workspace: AuditExecutionWorkspace): void {
  // Signatures and photo previews are large; the offline copy keeps the checklist work only.
  const slim: AuditExecutionWorkspace = {
    ...workspace,
    files: workspace.files.map((f) => ({ ...f, url: f.url.startsWith('data:') ? '' : f.url })),
    opening: { ...workspace.opening, attendance: workspace.opening.attendance.map((a) => ({ ...a, signature: null })) },
    closing: { ...workspace.closing, attendance: workspace.closing.attendance.map((a) => ({ ...a, signature: null })) },
  }
  write(CACHE_PREFIX + planId, slim)
}

export function cachedWorkspace(planId: string): AuditExecutionWorkspace | null {
  return read<AuditExecutionWorkspace | null>(CACHE_PREFIX + planId, null)
}

/** The queued changes applied on top of a workspace (what the auditor sees while offline). */
export function applyQueued(workspace: AuditExecutionWorkspace, queue: SyncOperation[]): AuditExecutionWorkspace {
  if (!queue.length) return workspace
  const byItem = new Map<string, ItemUpdate>()
  for (const op of queue) byItem.set(op.itemId, { ...byItem.get(op.itemId), ...op.data })
  return {
    ...workspace,
    checklists: workspace.checklists.map((c) => ({
      ...c,
      items: c.items.map((item) => {
        const change = byItem.get(item.id)
        if (!change) return item
        const { clientUpdatedAt, ...fields } = change
        void clientUpdatedAt
        return { ...item, ...Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined)) }
      }),
    })),
  }
}

/** True for a failure caused by the network rather than by the server's answer. */
export function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError || (typeof navigator !== 'undefined' && navigator.onLine === false)
}
