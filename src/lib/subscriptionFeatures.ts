/**
 * Pure rules shared by the platform console and the CAB subscription gating:
 * which CAB route belongs to which sellable feature, usage thresholds, invoice
 * arithmetic and what each platform role may do. No React, no I/O (unit tested
 * in tests/platform.test.mjs).
 */
import type { FeatureKey, FeatureMap, InvoiceLine, PlatformRole } from '@/lib/api/platformTypes'

/** Share of a limit at which the UI starts warning (spec: 80 %). */
export const USAGE_WARNING_RATIO = 0.8

/** CAB routes per feature. Longest/most specific prefixes first is not needed: prefixes do not overlap. */
const FEATURE_ROUTES: Array<{ feature: FeatureKey; match: (path: string) => boolean }> = [
  { feature: 'quotations', match: (p) => p.startsWith('/cab/quotations') || p === '/cab/applications/quotation' || /^\/cab\/applications\/[^/]+\/quotation$/.test(p) },
  { feature: 'offers', match: (p) => p === '/cab/offers' || p.startsWith('/cab/offers/') },
  { feature: 'invoices', match: (p) => p === '/cab/invoices' || p.startsWith('/cab/invoices/') },
  { feature: 'audit_planning', match: (p) => p === '/cab/audit-planning' || p.startsWith('/cab/audit-planning/') },
  { feature: 'audit_reporting', match: (p) => p === '/cab/audit-reporting' || p.startsWith('/cab/audit-reporting/') },
  { feature: 'nonconformities', match: (p) => p === '/cab/nonconformities' || p.startsWith('/cab/nonconformities/') },
  { feature: 'decisions', match: (p) => p === '/cab/decisions' || p.startsWith('/cab/decisions/') },
  { feature: 'certificates', match: (p) => p === '/cab/certificates' || p.startsWith('/cab/certificates/') },
  { feature: 'certification_cycles', match: (p) => p === '/cab/certification' || p.startsWith('/cab/certification/') },
  { feature: 'competence', match: (p) => p === '/cab/competence' || p.startsWith('/cab/competence/') },
  { feature: 'contacts', match: (p) => p === '/cab/contacts' || p.startsWith('/cab/contacts/') },
  { feature: 'dashboard_analytics', match: (p) => p === '/cab/dashboard' },
  { feature: 'client_portal', match: (p) => p === '/portal' || p.startsWith('/portal/') },
  { feature: 'excel_import', match: (p) => p === '/cab/migration' },
  { feature: 'sso', match: (p) => p === '/cab/settings/sso' },
]

/** The sellable feature a CAB route needs, or null for core routes (always available). */
export function featureForPath(pathname: string): FeatureKey | null {
  const path = pathname.replace(/\/+$/, '') || '/'
  return FEATURE_ROUTES.find((entry) => entry.match(path))?.feature ?? null
}

/** Whether a route is available with the given features (core routes always are; unknown features = allowed). */
export function isPathAllowed(pathname: string, features: Partial<FeatureMap> | null | undefined): boolean {
  const feature = featureForPath(pathname)
  if (!feature || !features) return true
  return features[feature] !== false
}

/** Plan defaults with tenant overrides on top (null/undefined override = follow the plan). */
export function effectiveFeatures(
  plan: Partial<FeatureMap>,
  overrides: Partial<Record<FeatureKey, boolean | null>> = {},
  keys: readonly FeatureKey[],
): FeatureMap {
  return Object.fromEntries(
    keys.map((key) => {
      const override = overrides[key]
      return [key, override === true || override === false ? override : plan[key] === true]
    }),
  ) as FeatureMap
}

/** 0–100 (may exceed 100), or null when the limit is unlimited / not set. */
export function usagePercent(used: number, limit: number | null | undefined): number | null {
  if (limit == null) return null
  if (limit <= 0) return used > 0 ? 100 : 0
  return Math.round((used / limit) * 100)
}

export function isNearLimit(used: number, limit: number | null | undefined, ratio = USAGE_WARNING_RATIO): boolean {
  if (limit == null) return false
  return limit <= 0 ? used > 0 : used / limit >= ratio
}

export function isAtLimit(used: number, limit: number | null | undefined): boolean {
  return limit != null && used >= limit
}

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

/** Invoice totals: subtotal, VAT (rate as a fraction, e.g. 0.15) and the SAR equivalent of the total. */
export function computeInvoiceTotals(lines: Array<Pick<InvoiceLine, 'quantity' | 'unitPrice'>>, vatRate: number, sarRate: number) {
  const subtotal = round2(lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0))
  const vatAmount = round2(subtotal * vatRate)
  const total = round2(subtotal + vatAmount)
  return { subtotal, vatAmount, total, totalSar: round2(total * sarRate) }
}

/** Status after a payment: fully paid → PAID, something paid → PARTIALLY_PAID. */
export function invoiceStatusAfterPayment(total: number, paid: number): 'PAID' | 'PARTIALLY_PAID' {
  return round2(paid) >= round2(total) ? 'PAID' : 'PARTIALLY_PAID'
}

/** Monthly recurring revenue of one subscription in USD. */
export function monthlyRevenue(plan: { priceMonthly: number; priceYearly: number; extraUserPriceMonthly: number }, cycle: 'MONTHLY' | 'YEARLY', extraUsers: number): number {
  const base = cycle === 'YEARLY' ? plan.priceYearly / 12 : plan.priceMonthly
  return round2(base + extraUsers * plan.extraUserPriceMonthly)
}

/* ── Platform roles ─────────────────────────────────────────────────── */

export type PlatformAbility =
  | 'viewTenants'
  | 'manageTenants'
  | 'impersonate'
  | 'viewPlans'
  | 'editPlans'
  | 'money'
  | 'announcements'
  | 'settings'
  | 'auditLog'
  | 'staff'

const ABILITIES: Record<PlatformRole, readonly PlatformAbility[]> = {
  PLATFORM_ADMIN: ['viewTenants', 'manageTenants', 'impersonate', 'viewPlans', 'editPlans', 'money', 'announcements', 'settings', 'auditLog', 'staff'],
  // Support: read tenants, impersonate, announcements — never money.
  PLATFORM_SUPPORT: ['viewTenants', 'impersonate', 'viewPlans', 'announcements'],
  // Finance: plans read, invoices / payments, dashboards — never plan editing.
  PLATFORM_FINANCE: ['viewTenants', 'viewPlans', 'money'],
}

export function isPlatformRole(role: string | null | undefined): role is PlatformRole {
  return role === 'PLATFORM_ADMIN' || role === 'PLATFORM_SUPPORT' || role === 'PLATFORM_FINANCE'
}

export function platformCan(role: string | null | undefined, ability: PlatformAbility): boolean {
  return isPlatformRole(role) && ABILITIES[role].includes(ability)
}

/** Ability needed to open a console page (path below /platform). */
export function abilityForPlatformPath(pathname: string): PlatformAbility | null {
  const path = pathname.replace(/^\/platform/, '') || '/'
  if (path === '/tenants/new') return 'manageTenants'
  if (path.startsWith('/tenants')) return 'viewTenants'
  if (path === '/plans/new' || /^\/plans\/[^/]+$/.test(path)) return 'editPlans'
  if (path.startsWith('/plans')) return 'viewPlans'
  if (path.startsWith('/invoices')) return 'money'
  if (path.startsWith('/announcements')) return 'announcements'
  if (path.startsWith('/staff')) return 'staff'
  if (path.startsWith('/audit-log')) return 'auditLog'
  if (path.startsWith('/settings')) return 'settings'
  return null
}

/** Announcement audience check for one CAB. */
export function announcementTargets(audience: string, cab: { id: string; planCode: string }): boolean {
  if (audience === 'ALL') return true
  if (audience.startsWith('PLAN:')) return audience.slice(5).toUpperCase() === cab.planCode.toUpperCase()
  if (audience.startsWith('CAB:')) return audience.slice(4) === cab.id
  return false
}

/** Whether an announcement is live at `now`. */
export function isAnnouncementActive(a: { startsAt: string; endsAt: string | null }, now = new Date()): boolean {
  const start = new Date(a.startsAt).getTime()
  const end = a.endsAt ? new Date(a.endsAt).getTime() : Number.POSITIVE_INFINITY
  const t = now.getTime()
  return start <= t && t <= end
}
