/**
 * Page feedback ("Was this page helpful?") sent from the end of every page.
 *
 *   POST /feedback  ← PageFeedback
 *
 * In the preview (demo mode) entries are kept in the browser instead.
 */

import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode } from '@/lib/api/demo/demoStore'

export interface PageFeedback {
  /** Route the user was on, e.g. "/cab/contacts" */
  route: string
  rating: 'up' | 'down'
  comment?: string
  language: string
  createdAt: string // ISO 8601
}

const KEY = 'icasco-page-feedback'

export async function sendPageFeedback(feedback: PageFeedback): Promise<void> {
  if (!isDemoMode()) {
    await authorizedRequest('/feedback', { method: 'POST', body: JSON.stringify(feedback) })
    return
  }
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]') as PageFeedback[]
    list.push(feedback)
    localStorage.setItem(KEY, JSON.stringify(list.slice(-500)))
  } catch {
    // Storage unavailable: nothing to keep in the preview.
  }
}
