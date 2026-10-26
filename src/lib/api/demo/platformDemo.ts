/**
 * Demo data + behaviour of the iCASCO platform console and of the CAB
 * subscription endpoint, persisted in the shared demo store like every other
 * mocked module (key `platform`). Eight tenants on the three seeded plans in
 * different lifecycle states, their invoices, payments, announcements, staff
 * and the platform audit log. The CAB of the demo session (CASCO) is one of the
 * tenants, so a change made in the console shows up in its workspace.
 */
import { ApiError } from '@/lib/api/client'
import { DEMO_CAB, addDays, nowIso } from '@/lib/api/demo/dataset'
import { clone, loadState, saveState } from '@/lib/api/demo/demoStore'
import {
  FEATURE_KEYS,
  type Announcement,
  type AnnouncementInput,
  type AuditRow,
  type BillingCycle,
  type CreateTenantInput,
  type FeatureKey,
  type FeatureMap,
  type ImpersonationResult,
  type MySubscription,
  type Paged,
  type PaymentMethod,
  type Plan,
  type PlanInput,
  type PlatformDashboard,
  type PlatformInvoice,
  type PlatformInvoiceStatus,
  type PlatformPayment,
  type PlatformRole,
  type PlatformSettings,
  type StaffUser,
  type StatusAction,
  type Subscription,
  type SubscriptionPatch,
  type SubscriptionStatus,
  type TenantDetail,
  type TenantRow,
  type TenantUser,
  type UpgradeCandidate,
} from '@/lib/api/platformTypes'
import { getAuthSession } from '@/lib/authStorage'
import {
  announcementTargets,
  computeInvoiceTotals,
  effectiveFeatures,
  invoiceStatusAfterPayment,
  isAnnouncementActive,
  isNearLimit,
  monthlyRevenue,
} from '@/lib/subscriptionFeatures'

/* ── Stored shape ───────────────────────────────────────────────────── */

type StoredPlan = Omit<Plan, 'tenantCount'>

interface DemoTenant {
  id: string
  name: string
  slug: string
  country: string
  createdAt: string
  subscription: Subscription
  overrides: Partial<Record<FeatureKey, boolean>>
  certificatesActive: number
  users: TenantUser[]
}

interface UpgradeRequest {
  id: string
  cabId: string
  planCode: string | null
  message: string
  createdAt: string
}

interface PlatformState {
  plans: StoredPlan[]
  tenants: DemoTenant[]
  invoices: PlatformInvoice[]
  audit: AuditRow[]
  announcements: Announcement[]
  staff: StaffUser[]
  settings: PlatformSettings
  upgradeRequests: UpgradeRequest[]
  invoiceSeq: number
}

const KEY = 'platform'

/* ── Seed ───────────────────────────────────────────────────────────── */

const allOn = (except: FeatureKey[] = []): FeatureMap =>
  Object.fromEntries(FEATURE_KEYS.map((key) => [key, !except.includes(key)])) as FeatureMap

const BASIC_OFF: FeatureKey[] = ['certification_cycles', 'competence', 'client_portal', 'wallet', 'assistant', 'dashboard_analytics', 'iaf_api', 'excel_import', 'sso']
const PRO_OFF: FeatureKey[] = ['assistant', 'iaf_api', 'sso']

const FIRST_NAMES = ['Ahmed', 'Sara', 'Omar', 'Layla', 'Khalid', 'Noura', 'Yusuf', 'Mona', 'Hassan', 'Reem', 'Tariq', 'Huda', 'Faisal', 'Dina', 'Kenji', 'Aiko', 'Emre', 'Zeynep']
const LAST_NAMES = ['Al Harbi', 'Mansour', 'Haddad', 'Saleh', 'Nasser', 'Farouk', 'Qasim', 'Tanaka', 'Yilmaz', 'Rahman']

function makeUsers(slug: string, count: number, seed: number): TenantUser[] {
  return Array.from({ length: count }, (_, i) => {
    const first = FIRST_NAMES[(seed + i * 3) % FIRST_NAMES.length]
    const last = LAST_NAMES[(seed + i) % LAST_NAMES.length]
    return {
      id: `${slug}-usr-${i + 1}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase().replace(/\s/g, '')}@${slug}.example`,
      role: i === 0 ? 'CAB_ADMIN' : i % 4 === 1 ? 'AUDITOR' : 'CAB_STAFF',
      status: i === count - 1 && count > 3 ? 'PENDING' : 'ACTIVE',
      lastLoginAt: i === count - 1 && count > 3 ? null : addDays(nowIso(), -((seed + i) % 9)),
    }
  })
}

function seedState(): PlatformState {
  const now = nowIso()
  const created = (days: number) => addDays(now, -days)
  const plans: StoredPlan[] = [
    {
      id: 'plan-basic', code: 'BASIC', name: 'Basic', description: 'Core certification workflow for small certification bodies.',
      priceMonthly: 299, priceYearly: 2990, currency: 'USD', includedUsers: 5, maxActiveCertificates: 100, iafApiQuota: 50,
      supportHoursMonthly: 3, extraUserPriceMonthly: 10, onboardingFee: 1000, isActive: true, sortOrder: 1, features: allOn(BASIC_OFF),
      createdAt: created(400), updatedAt: created(30),
    },
    {
      id: 'plan-professional', code: 'PROFESSIONAL', name: 'Professional', description: 'Full certification lifecycle with competence, cycles and the client portal.',
      priceMonthly: 699, priceYearly: 6990, currency: 'USD', includedUsers: 15, maxActiveCertificates: 500, iafApiQuota: 250,
      supportHoursMonthly: 6, extraUserPriceMonthly: 10, onboardingFee: 1000, isActive: true, sortOrder: 2, features: allOn(PRO_OFF),
      createdAt: created(400), updatedAt: created(30),
    },
    {
      id: 'plan-enterprise', code: 'ENTERPRISE', name: 'Enterprise', description: 'Every module, unlimited certificates and the IAF API.',
      priceMonthly: 1499, priceYearly: 14990, currency: 'USD', includedUsers: 50, maxActiveCertificates: null, iafApiQuota: null,
      supportHoursMonthly: 12, extraUserPriceMonthly: 10, onboardingFee: 1000, isActive: true, sortOrder: 3, features: allOn(),
      createdAt: created(400), updatedAt: created(30),
    },
  ]

  const sub = (
    id: string, cabId: string, planId: string, status: SubscriptionStatus, billingCycle: BillingCycle,
    startDaysAgo: number, periodEndInDays: number, extra: Partial<Subscription> = {},
  ): Subscription => ({
    id, cabId, planId, status, billingCycle, startDate: created(startDaysAgo), currentPeriodEnd: addDays(now, periodEndInDays),
    trialEndsAt: null, extraUsers: 0, onboardingFeeWaived: false, waiverReason: null, cancelledAt: null, quarantineUntil: null,
    deletionDueAt: null, userLimitOverride: null, certificateLimitOverride: null, notes: null,
    createdAt: created(startDaysAgo), updatedAt: created(Math.min(startDaysAgo, 20)), ...extra,
  })

  const tenants: DemoTenant[] = [
    {
      id: DEMO_CAB.id, name: 'CASCO For Assessment Services', slug: 'casco', country: 'SA', createdAt: created(380),
      subscription: sub('sub-casco', DEMO_CAB.id, 'plan-professional', 'ACTIVE', 'YEARLY', 380, 48, { extraUsers: 2, notes: 'Founding customer.' }),
      // Single sign-on added on top of the Professional plan (shows a per-tenant override in the console).
      overrides: { sso: true }, certificatesActive: 412, users: makeUsers('casco', 14, 1),
    },
    {
      id: 'cab-gulfqc', name: 'Gulf Quality Certification', slug: 'gulf-qc', country: 'AE', createdAt: created(300),
      subscription: sub('sub-gulfqc', 'cab-gulfqc', 'plan-enterprise', 'ACTIVE', 'MONTHLY', 300, 9),
      overrides: {}, certificatesActive: 1240, users: makeUsers('gulf-qc', 38, 4),
    },
    {
      id: 'cab-nile', name: 'Nile Assessment Services', slug: 'nile-as', country: 'EG', createdAt: created(150),
      subscription: sub('sub-nile', 'cab-nile', 'plan-basic', 'ACTIVE', 'MONTHLY', 150, 12),
      overrides: { excel_import: true }, certificatesActive: 92, users: makeUsers('nile-as', 5, 7),
    },
    {
      id: 'cab-riyadh', name: 'Riyadh Inspection & Certification', slug: 'riyadh-ic', country: 'SA', createdAt: created(210),
      subscription: sub('sub-riyadh', 'cab-riyadh', 'plan-professional', 'PAST_DUE', 'MONTHLY', 210, 3, { notes: 'Bank transfer promised by end of month.' }),
      overrides: {}, certificatesActive: 210, users: makeUsers('riyadh-ic', 9, 2),
    },
    {
      id: 'cab-albayan', name: 'Al Bayan Conformity', slug: 'al-bayan', country: 'SA', createdAt: created(8),
      subscription: sub('sub-albayan', 'cab-albayan', 'plan-basic', 'TRIAL', 'MONTHLY', 8, 6, { trialEndsAt: addDays(now, 6), onboardingFeeWaived: true, waiverReason: 'Launch promotion' }),
      overrides: {}, certificatesActive: 14, users: makeUsers('al-bayan', 2, 9),
    },
    {
      id: 'cab-tokyo', name: 'Tokyo Standards Assessment', slug: 'tokyo-sa', country: 'JP', createdAt: created(340),
      subscription: sub('sub-tokyo', 'cab-tokyo', 'plan-enterprise', 'ACTIVE', 'YEARLY', 340, 25, { userLimitOverride: 60 }),
      overrides: {}, certificatesActive: 860, users: makeUsers('tokyo-sa', 41, 14),
    },
    {
      id: 'cab-bosphorus', name: 'Bosphorus Certification', slug: 'bosphorus', country: 'TR', createdAt: created(260),
      subscription: sub('sub-bosphorus', 'cab-bosphorus', 'plan-basic', 'SUSPENDED', 'MONTHLY', 260, -20, { notes: 'Suspended after 14 days past due.' }),
      overrides: {}, certificatesActive: 64, users: makeUsers('bosphorus', 4, 16),
    },
    {
      id: 'cab-levant', name: 'Levant Certification Body', slug: 'levant-cb', country: 'JO', createdAt: created(420),
      subscription: sub('sub-levant', 'cab-levant', 'plan-professional', 'CANCELLED', 'YEARLY', 420, -30, {
        cancelledAt: created(30), quarantineUntil: addDays(now, 60), deletionDueAt: addDays(now, 60),
      }),
      overrides: {}, certificatesActive: 0, users: makeUsers('levant-cb', 6, 5),
    },
  ]

  const settings: PlatformSettings = { sarRate: 3.75, vatRate: 0.15, pastDueGraceDays: 14, quarantineMonths: 3, trialDays: 14, paymentTermsDays: 14, trialPlanCode: 'BASIC' }
  const year = new Date().getFullYear()
  let seq = 0
  const invoice = (
    tenant: DemoTenant, status: PlatformInvoiceStatus, periodStartDaysAgo: number, months: number,
    dueInDays: number, paidShare = 0,
  ): PlatformInvoice => {
    seq += 1
    const plan = plans.find((p) => p.id === tenant.subscription.planId)!
    const yearly = tenant.subscription.billingCycle === 'YEARLY'
    const lines = [
      { description: `${plan.name} plan, ${yearly ? 'yearly' : 'monthly'} subscription`, quantity: 1, unitPrice: yearly ? plan.priceYearly : plan.priceMonthly, amount: 0 },
      ...(tenant.subscription.extraUsers > 0
        ? [{ description: 'Extra named users', quantity: tenant.subscription.extraUsers * months, unitPrice: plan.extraUserPriceMonthly, amount: 0 }]
        : []),
    ].map((line) => ({ ...line, amount: Math.round(line.quantity * line.unitPrice * 100) / 100 }))
    const totals = computeInvoiceTotals(lines, settings.vatRate, settings.sarRate)
    const periodStart = addDays(now, -periodStartDaysAgo)
    const issuedAt = status === 'DRAFT' ? null : addDays(periodStart, -7)
    const id = `pinv-${seq}`
    const payments: PlatformPayment[] = paidShare > 0
      ? [{
          id: `ppay-${seq}`, invoiceId: id, amount: Math.round(totals.total * paidShare * 100) / 100, currency: 'USD', method: 'BANK_TRANSFER',
          paymentProvider: 'manual', reference: `TRF-${year}-${1000 + seq}`, receivedAt: addDays(periodStart, 2), recordedBy: 'Mohamed El Manawahly',
          createdAt: addDays(periodStart, 2),
        }]
      : []
    return {
      id, number: `ICS-INV-${year}-${String(seq).padStart(4, '0')}`, cabId: tenant.id, tenantName: tenant.name, subscriptionId: tenant.subscription.id,
      periodStart, periodEnd: addDays(periodStart, months * 30), currency: 'USD', lines, ...totals, vatRate: settings.vatRate, sarRate: settings.sarRate,
      status, issuedAt, dueDate: addDays(now, dueInDays), paidAt: status === 'PAID' ? addDays(periodStart, 2) : null,
      amountPaid: payments.reduce((sum, p) => sum + p.amount, 0), payments, createdAt: issuedAt ?? now, updatedAt: now,
    }
  }
  const byId = (id: string) => tenants.find((t) => t.id === id)!
  const invoices: PlatformInvoice[] = [
    invoice(byId(DEMO_CAB.id), 'PAID', 317, 12, -300, 1),
    invoice(byId('cab-gulfqc'), 'PAID', 51, 1, -45, 1),
    invoice(byId('cab-gulfqc'), 'PARTIALLY_PAID', 21, 1, 4, 0.5),
    invoice(byId('cab-nile'), 'PAID', 48, 1, -40, 1),
    invoice(byId('cab-nile'), 'ISSUED', 18, 1, 10),
    invoice(byId('cab-riyadh'), 'OVERDUE', 27, 1, -9),
    invoice(byId('cab-tokyo'), 'PAID', 340, 12, -330, 1),
    invoice(byId('cab-bosphorus'), 'OVERDUE', 50, 1, -36),
    invoice(byId('cab-levant'), 'PAID', 395, 12, -385, 1),
    invoice(byId('cab-gulfqc'), 'DRAFT', -9, 1, 23),
  ]

  const audit: AuditRow[] = [
    ['tenant.create', 'TENANT', 'cab-albayan', 'Al Bayan Conformity', 'Trial requested on the website', 8],
    ['subscription.update', 'TENANT', 'cab-bosphorus', 'Bosphorus Certification', 'Unpaid for more than 14 days', 6],
    ['invoice.payment', 'INVOICE', invoices[2].id, invoices[2].number, null, 5],
    ['tenant.impersonate', 'TENANT', 'cab-nile', 'Nile Assessment Services', 'Help with certificate template', 4],
    ['tenant.features', 'TENANT', 'cab-nile', 'Nile Assessment Services', 'Pilot of Excel import', 3],
    ['plan.update', 'PLAN', 'plan-professional', 'Professional', 'Price review 2026', 2],
    ['subscription.update', 'TENANT', 'cab-riyadh', 'Riyadh Inspection & Certification', 'Invoice past due date', 1],
  ].map(([action, targetType, targetId, targetName, reason, daysAgo], i) => ({
    id: `paud-${i + 1}`, actorUserId: 'plt-admin', actorName: i % 3 === 1 ? 'Platform job' : 'Mohamed El Manawahly',
    action: String(action), targetType: String(targetType), targetId: String(targetId), targetName: String(targetName),
    before: null, after: null, reason: reason as string | null, ip: '10.0.0.12', createdAt: addDays(now, -Number(daysAgo)),
  }))

  return {
    plans,
    tenants,
    invoices,
    audit: audit.reverse(),
    announcements: [
      {
        id: 'pann-1', title: 'Scheduled maintenance', body: 'iCASCO will be unavailable on Friday from 01:00 to 02:00 (KSA time) for planned maintenance.',
        audience: 'ALL', severity: 'INFO', startsAt: addDays(now, -1), endsAt: addDays(now, 5), createdBy: 'Mohamed El Manawahly', createdAt: addDays(now, -1), updatedAt: addDays(now, -1),
      },
      {
        id: 'pann-2', title: 'New: certification cycles', body: 'Professional and Enterprise plans now include certification cycle management.',
        audience: 'PLAN:BASIC', severity: 'INFO', startsAt: addDays(now, -3), endsAt: addDays(now, 20), createdBy: 'Mohamed El Manawahly', createdAt: addDays(now, -3), updatedAt: addDays(now, -3),
      },
      {
        id: 'pann-3', title: 'VAT invoices', body: 'From next month iCASCO invoices show the SAR amount and 15 % VAT separately.',
        audience: 'ALL', severity: 'WARNING', startsAt: addDays(now, 10), endsAt: addDays(now, 40), createdBy: 'Finance team', createdAt: addDays(now, -2), updatedAt: addDays(now, -2),
      },
    ],
    staff: [
      { id: 'plt-admin', name: 'Mohamed El Manawahly', email: 'admin@icasco.io', role: 'PLATFORM_ADMIN', status: 'ACTIVE', lastLoginAt: now, createdAt: created(400) },
      { id: 'plt-support', name: 'Reem Saleh', email: 'support@icasco.io', role: 'PLATFORM_SUPPORT', status: 'ACTIVE', lastLoginAt: created(1), createdAt: created(200) },
      { id: 'plt-finance', name: 'Tariq Mansour', email: 'finance@icasco.io', role: 'PLATFORM_FINANCE', status: 'ACTIVE', lastLoginAt: created(2), createdAt: created(180) },
      { id: 'plt-support-2', name: 'Aiko Tanaka', email: 'aiko@icasco.io', role: 'PLATFORM_SUPPORT', status: 'PENDING', lastLoginAt: null, createdAt: created(3) },
    ],
    settings,
    upgradeRequests: [],
    invoiceSeq: seq,
  }
}

/* ── Store helpers ──────────────────────────────────────────────────── */

const state = () => loadState<PlatformState>(KEY, seedState)
const save = () => saveState(KEY, state())
const delay = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms))
const uid = (prefix: string) =>
  `${prefix}-${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)}`
const round2 = (value: number) => Math.round(value * 100) / 100

function fail(status: number, message: string, code?: string): never {
  throw new ApiError(message, status, undefined, code)
}

function actor() {
  const session = getAuthSession()
  const email = session?.user?.email ?? 'admin@icasco.io'
  const staff = state().staff.find((s) => s.email.toLowerCase() === email.toLowerCase())
  return { id: staff?.id ?? session?.user?.id ?? 'plt-admin', name: staff?.name ?? email }
}

function log(action: string, targetType: string, targetId: string, targetName: string, extra: Partial<AuditRow> = {}) {
  const who = actor()
  state().audit.unshift({
    id: uid('paud'), actorUserId: who.id, actorName: who.name, action, targetType, targetId, targetName,
    before: null, after: null, reason: null, ip: '127.0.0.1', createdAt: nowIso(), ...extra,
  })
}

function planOf(tenant: DemoTenant): StoredPlan {
  const plans = state().plans
  return plans.find((p) => p.id === tenant.subscription.planId) ?? plans[plans.length - 1]
}

function findTenant(id: string): DemoTenant {
  const tenant = state().tenants.find((t) => t.id === id)
  if (!tenant) fail(404, 'Tenant not found.')
  return tenant
}

function userLimit(tenant: DemoTenant): number {
  const sub = tenant.subscription
  return sub.userLimitOverride ?? planOf(tenant).includedUsers + sub.extraUsers
}

function certificateLimit(tenant: DemoTenant): number | null {
  return tenant.subscription.certificateLimitOverride ?? planOf(tenant).maxActiveCertificates
}

function tenantFeatures(tenant: DemoTenant): FeatureMap {
  return effectiveFeatures(planOf(tenant).features, tenant.overrides, FEATURE_KEYS)
}

const OPEN_INVOICE: PlatformInvoiceStatus[] = ['ISSUED', 'OVERDUE', 'PARTIALLY_PAID']
const openAmount = (inv: PlatformInvoice) => round2(inv.total - (inv.amountPaid ?? 0))

function outstandingOf(cabId: string): number {
  return round2(state().invoices.filter((i) => i.cabId === cabId && OPEN_INVOICE.includes(i.status)).reduce((sum, i) => sum + openAmount(i), 0))
}

function toRow(tenant: DemoTenant): TenantRow {
  const plan = planOf(tenant)
  return {
    id: tenant.id, name: tenant.name, slug: tenant.slug, country: tenant.country,
    plan: { id: plan.id, code: plan.code, name: plan.name },
    status: tenant.subscription.status, billingCycle: tenant.subscription.billingCycle, currentPeriodEnd: tenant.subscription.currentPeriodEnd,
    users: { used: tenant.users.filter((u) => u.status !== 'SUSPENDED').length, limit: userLimit(tenant) },
    certificates: { active: tenant.certificatesActive, limit: certificateLimit(tenant) },
    outstandingUsd: outstandingOf(tenant.id), createdAt: tenant.createdAt,
  }
}

/** Marks issued invoices past their due date as overdue (what the daily job does). */
function refreshOverdue() {
  const now = Date.now()
  let changed = false
  for (const inv of state().invoices) {
    if (inv.status === 'ISSUED' && new Date(inv.dueDate).getTime() < now) {
      inv.status = 'OVERDUE'
      changed = true
    }
  }
  if (changed) save()
}

/* ── Dashboard ──────────────────────────────────────────────────────── */

export async function demoDashboard(): Promise<PlatformDashboard> {
  await delay()
  refreshOverdue()
  const { tenants, invoices, plans } = state()
  const now = new Date()
  const billable = tenants.filter((t) => t.subscription.status === 'ACTIVE' || t.subscription.status === 'PAST_DUE')
  const mrrOf = (t: DemoTenant) => monthlyRevenue(planOf(t), t.subscription.billingCycle, t.subscription.extraUsers)
  const mrrUsd = round2(billable.reduce((sum, t) => sum + mrrOf(t), 0))
  const count = (status: SubscriptionStatus) => tenants.filter((t) => t.subscription.status === status).length
  const cancelled90 = tenants.filter((t) => t.subscription.cancelledAt && now.getTime() - new Date(t.subscription.cancelledAt).getTime() <= 90 * 86_400_000).length
  const live = tenants.filter((t) => !['CANCELLED', 'EXPIRED'].includes(t.subscription.status))
  const in30 = (iso: string) => {
    const diff = new Date(iso).getTime() - now.getTime()
    return diff >= 0 && diff <= 30 * 86_400_000
  }
  const candidates: UpgradeCandidate[] = live.flatMap((t) => {
    const row = toRow(t)
    if (isNearLimit(row.certificates.active, row.certificates.limit)) return [{ ...row, reason: 'CERTIFICATES_NEAR_LIMIT' }]
    if (isNearLimit(row.users.used, row.users.limit)) return [{ ...row, reason: 'USERS_NEAR_LIMIT' }]
    return []
  })
  return {
    kpis: {
      mrrUsd,
      arrUsd: round2(mrrUsd * 12),
      activeTenants: count('ACTIVE'),
      trialTenants: count('TRIAL'),
      pastDueTenants: count('PAST_DUE'),
      suspendedTenants: count('SUSPENDED'),
      newThisMonth: tenants.filter((t) => {
        const d = new Date(t.createdAt)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }).length,
      churnRate90d: tenants.length ? Math.round((cancelled90 / tenants.length) * 10000) / 10000 : 0,
      outstandingUsd: round2(invoices.filter((i) => OPEN_INVOICE.includes(i.status)).reduce((s, i) => s + openAmount(i), 0)),
      overdueUsd: round2(invoices.filter((i) => i.status === 'OVERDUE').reduce((s, i) => s + openAmount(i), 0)),
    },
    revenueByPlan: plans.map((plan) => {
      const onPlan = billable.filter((t) => t.subscription.planId === plan.id)
      return { plan: plan.name, planCode: plan.code, mrrUsd: round2(onPlan.reduce((s, t) => s + mrrOf(t), 0)), tenants: tenants.filter((t) => t.subscription.planId === plan.id).length }
    }),
    renewalsNext30: live.filter((t) => in30(t.subscription.currentPeriodEnd)).map(toRow).sort((a, b) => a.currentPeriodEnd.localeCompare(b.currentPeriodEnd)),
    upgradeCandidates: candidates,
    usage: {
      seatsUsed: live.reduce((s, t) => s + toRow(t).users.used, 0),
      seatsAllowed: live.reduce((s, t) => s + userLimit(t), 0),
      certificatesActive: live.reduce((s, t) => s + t.certificatesActive, 0),
      featureUse: FEATURE_KEYS.map((featureKey) => ({ featureKey, tenants: live.filter((t) => tenantFeatures(t)[featureKey]).length })),
    },
    recentActivity: clone(state().audit.slice(0, 8)),
  }
}

/* ── Plans ──────────────────────────────────────────────────────────── */

export async function demoListPlans(): Promise<Plan[]> {
  await delay()
  const { plans, tenants } = state()
  return clone(plans)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((plan) => ({ ...plan, tenantCount: tenants.filter((t) => t.subscription.planId === plan.id).length }))
}

export async function demoCreatePlan(input: PlanInput): Promise<Plan> {
  await delay()
  const code = input.code.trim().toUpperCase()
  if (state().plans.some((p) => p.code === code)) fail(409, `A plan with the code ${code} already exists.`)
  const now = nowIso()
  const plan: StoredPlan = { ...input, code, isActive: input.isActive ?? true, id: uid('plan'), createdAt: now, updatedAt: now }
  state().plans.push(plan)
  log('plan.create', 'PLAN', plan.id, plan.name, { after: plan })
  save()
  return { ...clone(plan), tenantCount: 0 }
}

export async function demoUpdatePlan(id: string, patch: Partial<PlanInput>): Promise<Plan> {
  await delay()
  const plan = state().plans.find((p) => p.id === id)
  if (!plan) fail(404, 'Plan not found.')
  const before = clone(plan)
  Object.assign(plan, patch, { features: { ...plan.features, ...(patch.features ?? {}) }, code: (patch.code ?? plan.code).toUpperCase(), updatedAt: nowIso() })
  log('plan.update', 'PLAN', plan.id, plan.name, { before, after: clone(plan) })
  save()
  return { ...clone(plan), tenantCount: state().tenants.filter((t) => t.subscription.planId === id).length }
}

export async function demoArchivePlan(id: string, force = false): Promise<Plan> {
  await delay()
  const plan = state().plans.find((p) => p.id === id)
  if (!plan) fail(404, 'Plan not found.')
  const tenantCount = state().tenants.filter((t) => t.subscription.planId === id).length
  if (tenantCount > 0 && !force) fail(409, `${tenantCount} tenants are on this plan. Move them first or archive anyway.`)
  plan.isActive = false
  plan.updatedAt = nowIso()
  log('plan.archive', 'PLAN', plan.id, plan.name)
  save()
  return { ...clone(plan), tenantCount }
}

/* ── Tenants ────────────────────────────────────────────────────────── */

export async function demoListTenants(filters: { search?: string; status?: string; plan?: string } = {}): Promise<TenantRow[]> {
  await delay()
  refreshOverdue()
  const q = (filters.search ?? '').trim().toLowerCase()
  return state()
    .tenants.map(toRow)
    .filter((row) => !q || [row.name, row.slug, row.country].some((v) => v.toLowerCase().includes(q)))
    .filter((row) => !filters.status || row.status === filters.status)
    .filter((row) => !filters.plan || row.plan.code === filters.plan || row.plan.id === filters.plan)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function demoGetTenant(id: string): Promise<TenantDetail> {
  await delay()
  refreshOverdue()
  const tenant = findTenant(id)
  const plan = planOf(tenant)
  const features = tenantFeatures(tenant)
  // The detail's `users` is the user list, not the row's used/limit counter.
  const row: Omit<TenantRow, 'users'> & Partial<Pick<TenantRow, 'users'>> = toRow(tenant)
  delete row.users
  const sub = tenant.subscription
  return {
    ...row,
    usage: {
      users: { ...toRow(tenant).users, warning: isNearLimit(toRow(tenant).users.used, userLimit(tenant)) },
      certificates: { ...row.certificates, warning: isNearLimit(row.certificates.active, row.certificates.limit) },
    },
    readOnly: sub.status === 'SUSPENDED' || ((sub.status === 'CANCELLED' || sub.status === 'EXPIRED') && Boolean(sub.quarantineUntil)),
    subscription: clone(tenant.subscription),
    featureMatrix: FEATURE_KEYS.map((featureKey) => ({
      featureKey, plan: plan.features[featureKey] === true, override: tenant.overrides[featureKey] ?? null, effective: features[featureKey],
    })),
    limits: {
      users: { plan: plan.includedUsers, extra: tenant.subscription.extraUsers, override: tenant.subscription.userLimitOverride, effective: userLimit(tenant) },
      certificates: { plan: plan.maxActiveCertificates, override: tenant.subscription.certificateLimitOverride, effective: certificateLimit(tenant) },
    },
    invoices: clone(state().invoices.filter((i) => i.cabId === id)).sort((a, b) => b.periodStart.localeCompare(a.periodStart)),
    users: clone(tenant.users),
    history: clone(state().audit.filter((a) => a.targetId === id || (a.targetType === 'INVOICE' && state().invoices.some((i) => i.id === a.targetId && i.cabId === id)))),
  }
}

export async function demoCreateTenant(input: CreateTenantInput): Promise<TenantDetail> {
  await delay(350)
  const s = state()
  const plan = s.plans.find((p) => p.id === input.planId && p.isActive)
  if (!plan) fail(400, '"planId" must be an active plan')
  if (s.tenants.some((t) => t.users.some((u) => u.email.toLowerCase() === input.adminEmail.toLowerCase()))) fail(409, 'Email already registered')
  const name = input.tradingName?.trim() || input.legalEntityName.trim()
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tenant'
  let slug = baseSlug
  for (let n = 2; s.tenants.some((t) => t.slug === slug); n += 1) slug = `${baseSlug}-${n}`
  const now = nowIso()
  const id = uid('cab')
  const trialDays = input.trialDays ?? 0
  const subscription: Subscription = {
    id: uid('sub'), cabId: id, planId: plan.id, status: trialDays > 0 ? 'TRIAL' : 'ACTIVE', billingCycle: input.billingCycle,
    startDate: now, currentPeriodEnd: addDays(now, trialDays > 0 ? trialDays : input.billingCycle === 'YEARLY' ? 365 : 30),
    trialEndsAt: trialDays > 0 ? addDays(now, trialDays) : null, extraUsers: input.extraUsers ?? 0,
    onboardingFeeWaived: Boolean(input.onboardingFeeWaived), waiverReason: input.onboardingFeeWaived ? input.waiverReason?.trim() || null : null,
    cancelledAt: null, quarantineUntil: null, deletionDueAt: null, userLimitOverride: null, certificateLimitOverride: null, notes: null,
    createdAt: now, updatedAt: now,
  }
  const tenant: DemoTenant = {
    id, name, slug, country: input.country, createdAt: now, subscription, overrides: {}, certificatesActive: 0,
    users: [{ id: uid('usr'), name: input.adminName.trim(), email: input.adminEmail.trim(), role: 'CAB_ADMIN', status: 'PENDING', lastLoginAt: null }],
  }
  s.tenants.push(tenant)
  log('tenant.create', 'TENANT', id, name, { after: { plan: plan.code, billingCycle: input.billingCycle, trialDays } })
  save()
  return demoGetTenant(id)
}

export async function demoPatchSubscription(id: string, patch: SubscriptionPatch): Promise<TenantDetail> {
  await delay()
  const tenant = findTenant(id)
  const sub = tenant.subscription
  const before = clone(sub)
  if (patch.planId && !state().plans.some((p) => p.id === patch.planId)) fail(400, '"planId" must be a valid plan')
  if (patch.planId !== undefined) sub.planId = patch.planId
  if (patch.billingCycle !== undefined) sub.billingCycle = patch.billingCycle
  if (patch.extraUsers !== undefined) sub.extraUsers = Math.max(0, Math.floor(patch.extraUsers))
  if (patch.userLimitOverride !== undefined) sub.userLimitOverride = patch.userLimitOverride
  if (patch.certificateLimitOverride !== undefined) sub.certificateLimitOverride = patch.certificateLimitOverride
  if (patch.notes !== undefined) sub.notes = patch.notes || null
  sub.updatedAt = nowIso()
  log('subscription.update', 'TENANT', id, tenant.name, { before, after: clone(sub), reason: patch.reason })
  save()
  return demoGetTenant(id)
}

export async function demoPutFeatures(id: string, overrides: Partial<Record<FeatureKey, boolean | null>>): Promise<TenantDetail> {
  await delay()
  const tenant = findTenant(id)
  const before = clone(tenant.overrides)
  for (const [key, value] of Object.entries(overrides) as Array<[FeatureKey, boolean | null]>) {
    if (value === null) delete tenant.overrides[key]
    else tenant.overrides[key] = value
  }
  log('tenant.features', 'TENANT', id, tenant.name, { before, after: clone(tenant.overrides) })
  save()
  return demoGetTenant(id)
}

export async function demoTenantStatus(id: string, action: StatusAction, reason: string): Promise<TenantDetail> {
  await delay()
  const tenant = findTenant(id)
  const sub = tenant.subscription
  const before = sub.status
  const now = nowIso()
  if (action === 'activate' || action === 'reactivate') {
    if (action === 'activate' && sub.status !== 'TRIAL' && sub.status !== 'EXPIRED') fail(409, 'Only a trial or expired subscription can be activated.')
    if (action === 'reactivate' && !['SUSPENDED', 'PAST_DUE', 'CANCELLED', 'EXPIRED'].includes(sub.status)) fail(409, 'This subscription is already active.')
    sub.status = 'ACTIVE'
    sub.trialEndsAt = null
    sub.cancelledAt = null
    sub.quarantineUntil = null
    sub.deletionDueAt = null
    if (new Date(sub.currentPeriodEnd).getTime() < Date.now()) sub.currentPeriodEnd = addDays(now, sub.billingCycle === 'YEARLY' ? 365 : 30)
  } else if (action === 'suspend') {
    if (['SUSPENDED', 'CANCELLED', 'EXPIRED'].includes(sub.status)) fail(409, 'This subscription cannot be suspended in its current status.')
    sub.status = 'SUSPENDED'
  } else {
    if (sub.status === 'CANCELLED') fail(409, 'This subscription is already cancelled.')
    const months = state().settings.quarantineMonths
    sub.status = 'CANCELLED'
    sub.cancelledAt = now
    sub.quarantineUntil = addDays(now, months * 30)
    sub.deletionDueAt = sub.quarantineUntil
  }
  sub.updatedAt = now
  log('subscription.update', 'TENANT', id, tenant.name, { before: { status: before }, after: { status: sub.status }, reason })
  save()
  return demoGetTenant(id)
}

export async function demoImpersonate(id: string, reason: string, minutes: number): Promise<ImpersonationResult> {
  await delay()
  const tenant = findTenant(id)
  if (minutes < 1 || minutes > 60) fail(400, '"minutes" must be less than or equal to 60')
  log('tenant.impersonate', 'TENANT', id, tenant.name, { reason, after: { minutes } })
  save()
  // The preview signs in to the demo CAB workspace whatever tenant is chosen.
  return { token: 'preview-demo', expiresAt: addDays(nowIso(), minutes / 1440), tenant: { id: tenant.id, name: tenant.name } }
}

export async function demoConfirmDeletion(id: string): Promise<{ message: string }> {
  await delay()
  const tenant = findTenant(id)
  const due = tenant.subscription.deletionDueAt
  if (!due || new Date(due).getTime() > Date.now()) fail(409, 'The quarantine period has not ended yet; the tenant cannot be deleted.')
  const s = state()
  s.tenants = s.tenants.filter((t) => t.id !== id)
  log('tenant.delete', 'TENANT', id, tenant.name)
  save()
  return { message: 'Tenant deleted' }
}

/* ── Invoices & payments ────────────────────────────────────────────── */

export async function demoListInvoices(filters: { status?: string; tenant?: string } = {}): Promise<PlatformInvoice[]> {
  await delay()
  refreshOverdue()
  return clone(state().invoices)
    .filter((i) => !filters.status || i.status === filters.status)
    .filter((i) => !filters.tenant || i.cabId === filters.tenant)
    .sort((a, b) => b.number.localeCompare(a.number))
}

function nextInvoiceNumber(): string {
  const s = state()
  s.invoiceSeq += 1
  return `ICS-INV-${new Date().getFullYear()}-${String(s.invoiceSeq).padStart(4, '0')}`
}

/** Builds the invoice of the next period for every tenant whose period ends within 7 days (idempotent per period). */
export async function demoGenerateInvoices(tenantId?: string): Promise<PlatformInvoice[]> {
  await delay(350)
  const s = state()
  const created: PlatformInvoice[] = []
  const horizon = Date.now() + 7 * 86_400_000
  for (const tenant of s.tenants) {
    if (tenantId && tenant.id !== tenantId) continue
    const sub = tenant.subscription
    if (!['ACTIVE', 'PAST_DUE', 'TRIAL'].includes(sub.status)) continue
    // A specific tenant can be invoiced on demand; the batch run only picks periods ending within 7 days.
    if (!tenantId && new Date(sub.currentPeriodEnd).getTime() > horizon) continue
    const periodStart = sub.currentPeriodEnd
    if (s.invoices.some((i) => i.cabId === tenant.id && i.periodStart.slice(0, 10) === periodStart.slice(0, 10) && i.status !== 'VOID')) continue
    const plan = planOf(tenant)
    const yearly = sub.billingCycle === 'YEARLY'
    const months = yearly ? 12 : 1
    const firstInvoice = !s.invoices.some((i) => i.cabId === tenant.id && i.status !== 'VOID')
    const lines = [
      { description: `${plan.name} plan, ${yearly ? 'yearly' : 'monthly'} subscription`, quantity: 1, unitPrice: yearly ? plan.priceYearly : plan.priceMonthly },
      ...(sub.extraUsers > 0 ? [{ description: 'Extra named users', quantity: sub.extraUsers * months, unitPrice: plan.extraUserPriceMonthly }] : []),
      ...(firstInvoice && !sub.onboardingFeeWaived && plan.onboardingFee > 0 ? [{ description: 'Onboarding fee', quantity: 1, unitPrice: plan.onboardingFee }] : []),
    ].map((line) => ({ ...line, amount: round2(line.quantity * line.unitPrice) }))
    const totals = computeInvoiceTotals(lines, s.settings.vatRate, s.settings.sarRate)
    const now = nowIso()
    const invoice: PlatformInvoice = {
      id: uid('pinv'), number: nextInvoiceNumber(), cabId: tenant.id, tenantName: tenant.name, subscriptionId: sub.id,
      periodStart, periodEnd: addDays(periodStart, yearly ? 365 : 30), currency: 'USD', lines, ...totals,
      vatRate: s.settings.vatRate, sarRate: s.settings.sarRate, status: 'DRAFT', issuedAt: null, dueDate: periodStart,
      paidAt: null, amountPaid: 0, payments: [], createdAt: now, updatedAt: now,
    }
    s.invoices.push(invoice)
    created.push(invoice)
    log('invoice.generate', 'INVOICE', invoice.id, invoice.number)
  }
  save()
  return clone(created)
}

function findInvoice(id: string): PlatformInvoice {
  const invoice = state().invoices.find((i) => i.id === id)
  if (!invoice) fail(404, 'Invoice not found.')
  return invoice
}

export async function demoIssueInvoice(id: string): Promise<PlatformInvoice> {
  await delay()
  const invoice = findInvoice(id)
  if (invoice.status !== 'DRAFT') fail(409, 'Only a draft invoice can be issued.')
  invoice.status = 'ISSUED'
  invoice.issuedAt = nowIso()
  const graceDays = state().settings.pastDueGraceDays
  if (new Date(invoice.dueDate).getTime() < Date.now()) invoice.dueDate = addDays(nowIso(), graceDays)
  invoice.updatedAt = nowIso()
  log('invoice.issue', 'INVOICE', invoice.id, invoice.number)
  save()
  return clone(invoice)
}

export async function demoVoidInvoice(id: string): Promise<PlatformInvoice> {
  await delay()
  const invoice = findInvoice(id)
  if (invoice.status === 'PAID' || invoice.status === 'VOID' || (invoice.amountPaid ?? 0) > 0) fail(409, 'An invoice with payments cannot be voided.')
  invoice.status = 'VOID'
  invoice.updatedAt = nowIso()
  log('invoice.void', 'INVOICE', invoice.id, invoice.number)
  save()
  return clone(invoice)
}

export async function demoRecordPayment(
  id: string,
  input: { amount: number; method: PaymentMethod; reference: string; receivedAt: string },
): Promise<PlatformInvoice> {
  await delay()
  const invoice = findInvoice(id)
  if (!OPEN_INVOICE.includes(invoice.status)) fail(409, 'Payments can only be recorded on issued invoices.')
  if (!(input.amount > 0)) fail(400, '"amount" must be a positive number')
  if (input.amount > openAmount(invoice) + 0.001) fail(400, '"amount" must be less than or equal to the open amount')
  const who = actor()
  const payment: PlatformPayment = {
    id: uid('ppay'), invoiceId: id, amount: round2(input.amount), currency: invoice.currency, method: input.method,
    paymentProvider: 'manual', reference: input.reference, receivedAt: input.receivedAt, recordedBy: who.name, createdAt: nowIso(),
  }
  invoice.payments = [...(invoice.payments ?? []), payment]
  invoice.amountPaid = round2((invoice.amountPaid ?? 0) + payment.amount)
  invoice.status = invoiceStatusAfterPayment(invoice.total, invoice.amountPaid)
  if (invoice.status === 'PAID') invoice.paidAt = nowIso()
  invoice.updatedAt = nowIso()
  log('invoice.payment', 'INVOICE', invoice.id, invoice.number, { after: { amount: payment.amount, reference: payment.reference } })
  // A past-due subscription becomes active again once nothing is left unpaid.
  const tenant = state().tenants.find((t) => t.id === invoice.cabId)
  if (tenant && invoice.status === 'PAID' && tenant.subscription.status === 'PAST_DUE' && outstandingOf(tenant.id) === 0) {
    tenant.subscription.status = 'ACTIVE'
    tenant.subscription.updatedAt = nowIso()
    log('subscription.reactivated_by_payment', 'TENANT', tenant.id, tenant.name, { before: { status: 'PAST_DUE' }, after: { status: 'ACTIVE' }, reason: 'Invoice paid in full' })
  }
  save()
  return clone(invoice)
}

/* ── Announcements ──────────────────────────────────────────────────── */

export async function demoListAnnouncements(): Promise<Announcement[]> {
  await delay()
  return clone(state().announcements).sort((a, b) => b.startsAt.localeCompare(a.startsAt))
}

export async function demoCreateAnnouncement(input: AnnouncementInput): Promise<Announcement> {
  await delay()
  const now = nowIso()
  const announcement: Announcement = { ...input, id: uid('pann'), createdBy: actor().name, createdAt: now, updatedAt: now }
  state().announcements.push(announcement)
  log('announcement.create', 'ANNOUNCEMENT', announcement.id, announcement.title)
  save()
  return clone(announcement)
}

export async function demoUpdateAnnouncement(id: string, input: Partial<AnnouncementInput>): Promise<Announcement> {
  await delay()
  const announcement = state().announcements.find((a) => a.id === id)
  if (!announcement) fail(404, 'Announcement not found.')
  Object.assign(announcement, input, { updatedAt: nowIso() })
  log('announcement.update', 'ANNOUNCEMENT', id, announcement.title)
  save()
  return clone(announcement)
}

export async function demoDeleteAnnouncement(id: string): Promise<void> {
  await delay()
  const s = state()
  const announcement = s.announcements.find((a) => a.id === id)
  if (!announcement) fail(404, 'Announcement not found.')
  s.announcements = s.announcements.filter((a) => a.id !== id)
  log('announcement.delete', 'ANNOUNCEMENT', id, announcement.title)
  save()
}

/* ── Settings, audit log, staff ─────────────────────────────────────── */

export async function demoGetSettings(): Promise<PlatformSettings> {
  await delay()
  return clone(state().settings)
}

export async function demoPatchSettings(patch: Partial<PlatformSettings>): Promise<PlatformSettings> {
  await delay()
  const s = state()
  const before = clone(s.settings)
  s.settings = { ...s.settings, ...patch }
  log('settings.update', 'SETTINGS', 'platform', 'Platform settings', { before, after: clone(s.settings) })
  save()
  return clone(s.settings)
}

export async function demoAuditLog(filters: { actor?: string; target?: string; from?: string; to?: string; page?: number; limit?: number }): Promise<Paged<AuditRow>> {
  await delay()
  const actorQ = (filters.actor ?? '').trim().toLowerCase()
  const targetQ = (filters.target ?? '').trim().toLowerCase()
  const from = filters.from ? new Date(filters.from).getTime() : null
  const to = filters.to ? new Date(filters.to).getTime() + 86_400_000 - 1 : null
  const rows = state().audit.filter((row) => {
    const at = new Date(row.createdAt).getTime()
    return (
      (!actorQ || (row.actorName ?? row.actorUserId).toLowerCase().includes(actorQ) || row.actorUserId.toLowerCase() === actorQ) &&
      (!targetQ || [row.targetType, row.targetId, row.targetName ?? ''].some((v) => v.toLowerCase().includes(targetQ))) &&
      (from == null || at >= from) &&
      (to == null || at <= to)
    )
  })
  const page = Math.max(1, filters.page ?? 1)
  const limit = Math.max(1, filters.limit ?? 20)
  return { items: clone(rows.slice((page - 1) * limit, page * limit)), total: rows.length, page, limit, totalPages: Math.max(1, Math.ceil(rows.length / limit)) }
}

export async function demoListStaff(): Promise<StaffUser[]> {
  await delay()
  return clone(state().staff)
}

export async function demoInviteStaff(input: { name: string; email: string; role: PlatformRole }): Promise<StaffUser> {
  await delay()
  const s = state()
  if (s.staff.some((u) => u.email.toLowerCase() === input.email.trim().toLowerCase())) fail(409, 'Email already registered')
  const user: StaffUser = { id: uid('plt'), name: input.name.trim(), email: input.email.trim(), role: input.role, status: 'PENDING', lastLoginAt: null, createdAt: nowIso() }
  s.staff.push(user)
  log('staff.create', 'STAFF', user.id, user.name, { after: { role: user.role } })
  save()
  return clone(user)
}

export async function demoUpdateStaff(id: string, patch: { role?: PlatformRole; status?: StaffUser['status'] }): Promise<StaffUser> {
  await delay()
  const user = state().staff.find((u) => u.id === id)
  if (!user) fail(404, 'User not found.')
  if (user.id === actor().id && (patch.status === 'SUSPENDED' || (patch.role && patch.role !== 'PLATFORM_ADMIN'))) {
    fail(409, 'You cannot deactivate or demote your own account.')
  }
  const before = { role: user.role, status: user.status }
  Object.assign(user, patch)
  log('staff.update', 'STAFF', user.id, user.name, { before, after: { role: user.role, status: user.status } })
  save()
  return clone(user)
}

/* ── CAB side: GET /subscription, POST /subscription/upgrade-request ── */

/** The subscription of the CAB of the demo session; a CAB without one is treated as Enterprise ACTIVE. */
export async function demoMySubscription(cabId: string = DEMO_CAB.id): Promise<MySubscription> {
  await delay(120)
  refreshOverdue()
  const s = state()
  const tenant = s.tenants.find((t) => t.id === cabId)
  if (!tenant) {
    const plan = s.plans.find((p) => p.code === 'ENTERPRISE') ?? s.plans[s.plans.length - 1]
    return {
      plan: { id: plan.id, code: plan.code, name: plan.name, includedUsers: plan.includedUsers, maxActiveCertificates: plan.maxActiveCertificates },
      status: 'ACTIVE', billingCycle: 'YEARLY', currentPeriodEnd: addDays(nowIso(), 365), features: allOn(),
      limits: { users: { used: 1, limit: plan.includedUsers }, certificates: { active: 0, limit: plan.maxActiveCertificates } },
      readOnly: false, announcements: [], invoices: [],
    }
  }
  const plan = planOf(tenant)
  const row = toRow(tenant)
  const sub = tenant.subscription
  const readOnly = sub.status === 'SUSPENDED' || ((sub.status === 'CANCELLED' || sub.status === 'EXPIRED') && Boolean(sub.quarantineUntil))
  return {
    plan: {
      id: plan.id, code: plan.code, name: plan.name, includedUsers: plan.includedUsers, maxActiveCertificates: plan.maxActiveCertificates,
      priceMonthly: plan.priceMonthly, priceYearly: plan.priceYearly, currency: plan.currency, supportHoursMonthly: plan.supportHoursMonthly,
    },
    status: sub.status,
    billingCycle: sub.billingCycle,
    currentPeriodEnd: sub.currentPeriodEnd,
    trialEndsAt: sub.trialEndsAt,
    ended: false,
    impersonation: null,
    features: tenantFeatures(tenant),
    limits: { users: row.users, certificates: row.certificates },
    readOnly,
    warnings: { certificates: isNearLimit(row.certificates.active, row.certificates.limit), users: isNearLimit(row.users.used, row.users.limit) },
    announcements: clone(s.announcements.filter((a) => isAnnouncementActive(a) && announcementTargets(a.audience, { id: tenant.id, planCode: plan.code }))),
    invoices: clone(s.invoices.filter((i) => i.cabId === tenant.id && i.status !== 'DRAFT')).sort((a, b) => b.periodStart.localeCompare(a.periodStart)),
  }
}

export async function demoRequestUpgrade(input: { planCode?: string; message: string }, cabId: string = DEMO_CAB.id): Promise<{ message: string }> {
  await delay()
  const s = state()
  const tenant = s.tenants.find((t) => t.id === cabId)
  s.upgradeRequests.push({ id: uid('pupg'), cabId, planCode: input.planCode ?? null, message: input.message, createdAt: nowIso() })
  const who = getAuthSession()
  s.audit.unshift({
    id: uid('paud'), actorUserId: who?.user?.id ?? 'cab-admin', actorName: who?.user?.email ?? 'CAB admin', action: 'tenant.upgrade_request',
    targetType: 'TENANT', targetId: cabId, targetName: tenant?.name ?? cabId, before: null, after: { planCode: input.planCode ?? null },
    reason: input.message, ip: null, createdAt: nowIso(),
  })
  save()
  return { message: 'Upgrade request sent' }
}

/** Preview helper (`#/…?as=cab&plan=basic`): moves the demo CAB to another plan / status (a new plan drops the tenant's overrides, so the plan's own features show). */
export function setDemoCabSubscription(planCode?: string | null, status?: string | null): void {
  const s = state()
  const tenant = s.tenants.find((t) => t.id === DEMO_CAB.id)
  if (!tenant) return
  const plan = planCode ? s.plans.find((p) => p.code === planCode.toUpperCase()) : undefined
  if (plan) {
    tenant.subscription.planId = plan.id
    tenant.overrides = {}
  }
  const upper = status?.toUpperCase()
  if (upper && (['TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED', 'EXPIRED'] as string[]).includes(upper)) {
    tenant.subscription.status = upper as SubscriptionStatus
  }
  save()
}
