import { getAuthSession } from '@/lib/authStorage'

const TOUR_STATUS_KEY_PREFIX = 'icasco_tour_status'
const TOUR_PENDING_KEY_PREFIX = 'icasco_pending_tour'

export function getTourPendingKey(tourId: string): string {
  return `${TOUR_PENDING_KEY_PREFIX}_${tourId}`
}

export function getTourUserKey(): string | null {
  const session = getAuthSession()
  return session?.cab?.id ?? session?.organization?.id ?? session?.user?.id ?? null
}

export function getTourStatusKey(tourId: string): string {
  const id = getTourUserKey()
  const base = `${TOUR_STATUS_KEY_PREFIX}_${tourId}`
  return id ? `${base}_${id}` : base
}

export function setTourStatus(tourId: string, status: 'completed' | 'skipped'): void {
  localStorage.setItem(getTourStatusKey(tourId), status)
}

/**
 * Call this from wherever a tour's onboarding flow finishes, so the tour
 * auto-starts the first time the user lands on the page it belongs to.
 * `tourId` must match the `tourId` passed to that page's <TourProvider>.
 */
export function markTourPending(tourId: string): void {
  localStorage.setItem(getTourPendingKey(tourId), 'true')
  const session = getAuthSession()
  const id = session?.cab?.id ?? session?.organization?.id ?? session?.user?.id
  const base = `${TOUR_STATUS_KEY_PREFIX}_${tourId}`
  const statusKey = id ? `${base}_${id}` : base
  localStorage.removeItem(statusKey)
  localStorage.removeItem(base)
}
