import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { SUBSCRIPTION_ERROR_EVENT } from '@/lib/api/client'
import type { FeatureKey, MySubscription } from '@/lib/api/platformTypes'
import { fetchMySubscription } from '@/lib/api/subscriptionApi'
import { getAuthSession, getAuthToken, isAuditClientSession, isPlatformSession } from '@/lib/authStorage'
import { isPathAllowed } from '@/lib/subscriptionFeatures'

/**
 * The CAB's subscription (GET /subscription), fetched once per signed-in session and
 * shared by every component that gates on it (sidebar, bottom bar, application hub,
 * route guard, banners). A subscription error from the API (feature not in plan,
 * read-only …) invalidates the cache so the next render reflects the new state.
 */

interface CacheState {
  key: string | null
  data: MySubscription | null
  loading: boolean
  error: boolean
}

let cache: CacheState = { key: null, data: null, loading: false, error: false }
let inflight: Promise<void> | null = null
const listeners = new Set<() => void>()

function emit(next: Partial<CacheState>) {
  cache = { ...cache, ...next }
  listeners.forEach((listener) => listener())
}

/** Only CAB staff have a subscription; platform staff and audit clients do not. */
function sessionKey(): string | null {
  const token = getAuthToken()
  const session = getAuthSession()
  if (!token || !session || isPlatformSession(session) || isAuditClientSession(session)) return null
  const isCab = Boolean(session.cab) || session.organization?.type === 'CERTIFICATION_BODY'
  return isCab ? `${token}|${session.cab?.id ?? session.organization?.id ?? ''}` : null
}

function load(force = false): void {
  const key = sessionKey()
  if (!key) {
    if (cache.key !== null || cache.data) emit({ key: null, data: null, loading: false, error: false })
    return
  }
  if (!force && cache.key === key && (cache.data || cache.loading || cache.error)) return
  if (inflight && !force && cache.key === key) return
  emit({ key, loading: true, error: false, ...(cache.key === key ? {} : { data: null }) })
  const request = fetchMySubscription()
    .then((data) => {
      if (sessionKey() === key) emit({ data, loading: false, error: false })
    })
    .catch((error: unknown) => {
      console.error('[iCASCO] subscription could not be loaded:', error)
      if (sessionKey() === key) emit({ loading: false, error: true })
    })
    .finally(() => {
      if (inflight === request) inflight = null
    })
  inflight = request
}

/** Drops the cached subscription (e.g. after an upgrade request or a subscription error). */
export function invalidateSubscription(): void {
  load(true)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getSnapshot = () => cache

if (typeof window !== 'undefined') {
  window.addEventListener(SUBSCRIPTION_ERROR_EVENT, () => {
    if (cache.key) load(true)
  })
}

export interface UseSubscriptionResult {
  subscription: MySubscription | null
  loading: boolean
  error: boolean
  /** True while unknown (loading / failed / not a CAB) so nothing is locked by mistake. */
  isFeatureEnabled: (feature: FeatureKey) => boolean
  isPathAllowed: (pathname: string) => boolean
  refresh: () => void
}

export function useSubscription(): UseSubscriptionResult {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  useEffect(() => {
    load()
  }, [])

  const data = state.key && state.key === sessionKey() ? state.data : null
  const isFeatureEnabled = useCallback((feature: FeatureKey) => !data || data.features[feature] !== false, [data])
  const pathAllowed = useCallback((pathname: string) => isPathAllowed(pathname, data?.features), [data])

  return {
    subscription: data,
    loading: state.loading,
    error: state.error,
    isFeatureEnabled,
    isPathAllowed: pathAllowed,
    refresh: invalidateSubscription,
  }
}
