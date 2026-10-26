/**
 * CAB subscription API — what the CAB workspace needs to gate navigation.
 *
 *   GET  /subscription                   → MySubscription (CAB admin and CAB staff)
 *   POST /subscription/upgrade-request   { planCode?, message } → notifies iCASCO platform staff
 *
 * In the preview (demo mode) both are answered by lib/api/demo/platformDemo.ts, so a plan
 * change made in the platform console shows in the demo CAB's workspace.
 */
import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { demoMySubscription, demoRequestUpgrade } from '@/lib/api/demo/platformDemo'
import { asFraction, normalizeInvoice } from '@/lib/api/platformApi'
import { FEATURE_KEYS, type FeatureMap, type MySubscription } from '@/lib/api/platformTypes'
import { getAuthSession } from '@/lib/authStorage'

const num = (value: unknown): number => (typeof value === 'number' ? value : Number(value) || 0)
const numOrNull = (value: unknown): number | null => (value === null || value === undefined || value === '' ? null : num(value))

function normalize(raw: MySubscription): MySubscription {
  // A key the server leaves out counts as included, so a newer frontend never locks a module by accident.
  const features = Object.fromEntries(FEATURE_KEYS.map((key) => [key, raw.features?.[key] !== false])) as FeatureMap
  return {
    ...raw,
    features,
    limits: {
      users: { used: num(raw.limits?.users?.used), limit: numOrNull(raw.limits?.users?.limit) },
      certificates: { active: num(raw.limits?.certificates?.active), limit: numOrNull(raw.limits?.certificates?.limit) },
    },
    readOnly: raw.readOnly === true,
    ended: raw.ended === true,
    impersonation: raw.impersonation ?? null,
    announcements: raw.announcements ?? [],
    invoices: (raw.invoices ?? []).map((invoice) => normalizeInvoice({ ...invoice, vatRate: asFraction(invoice.vatRate) })),
  }
}

export async function fetchMySubscription(): Promise<MySubscription> {
  if (!isDemoMode()) return normalize(await authorizedRequest<MySubscription>('/subscription'))
  return demoMySubscription(getAuthSession()?.cab?.id)
}

export async function requestSubscriptionUpgrade(input: { planCode?: string; message: string }): Promise<void> {
  if (!isDemoMode()) {
    await authorizedRequest('/subscription/upgrade-request', { method: 'POST', body: JSON.stringify(input) })
    return
  }
  await demoRequestUpgrade(input, getAuthSession()?.cab?.id)
}
