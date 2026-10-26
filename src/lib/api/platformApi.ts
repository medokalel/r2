/**
 * iCASCO platform console API — `/api/v1/platform/*` (platform staff only; 403 for anyone else).
 *
 *   GET    /platform/dashboard
 *   GET    /platform/plans · POST /platform/plans · PATCH /platform/plans/:id · POST /platform/plans/:id/archive
 *   GET    /platform/tenants?search&status&plan · POST /platform/tenants · GET /platform/tenants/:id
 *   PATCH  /platform/tenants/:id/subscription · PUT /platform/tenants/:id/features
 *   POST   /platform/tenants/:id/status · /impersonate · /deletion/confirm
 *   GET    /platform/invoices?status&tenant · POST /platform/invoices/generate
 *   POST   /platform/invoices/:id/issue · /void · /payments · GET /platform/invoices/export?format=xlsx
 *   GET/POST/PATCH/DELETE /platform/announcements
 *   GET/PATCH /platform/settings · GET /platform/audit-log?actor&target&from&to&page&limit
 *   GET/POST/PATCH /platform/staff
 *
 * In the preview (demo mode) every call is answered by lib/api/demo/platformDemo.ts.
 * The backend sends money as numbers and rates (vatRate, churnRate90d) as fractions (0.15 = 15 %);
 * the normalisers below also accept Decimal strings / percentages so a contract slip never breaks a screen.
 * Errors carry `{ code, ...details }` (see client.ts).
 */
import { authorizedRequest } from '@/lib/api/authorizedClient'
import { ApiError } from '@/lib/api/client'
import { API_BASE_URL } from '@/lib/api/config'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import * as demo from '@/lib/api/demo/platformDemo'
import type {
  Announcement,
  AnnouncementInput,
  AuditRow,
  CreateTenantInput,
  FeatureKey,
  ImpersonationResult,
  Paged,
  PaymentMethod,
  Plan,
  PlanInput,
  PlatformDashboard,
  PlatformInvoice,
  PlatformRole,
  PlatformSettings,
  StaffUser,
  StatusAction,
  SubscriptionPatch,
  TenantDetail,
  TenantRow,
} from '@/lib/api/platformTypes'
import { getAuthToken } from '@/lib/authStorage'

/* ── Normalisers ────────────────────────────────────────────────────── */

const num = (value: unknown, fallback = 0): number => {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN
  return Number.isFinite(n) ? n : fallback
}
const numOrNull = (value: unknown): number | null => (value === null || value === undefined || value === '' ? null : num(value))
/** 15 → 0.15; 0.15 stays. */
export const asFraction = (value: unknown): number => {
  const n = num(value)
  return n > 1 ? n / 100 : n
}

export function normalizePlan(raw: Plan): Plan {
  return {
    ...raw,
    priceMonthly: num(raw.priceMonthly),
    priceYearly: num(raw.priceYearly),
    includedUsers: num(raw.includedUsers),
    maxActiveCertificates: numOrNull(raw.maxActiveCertificates),
    iafApiQuota: numOrNull(raw.iafApiQuota),
    supportHoursMonthly: num(raw.supportHoursMonthly),
    extraUserPriceMonthly: num(raw.extraUserPriceMonthly),
    onboardingFee: num(raw.onboardingFee),
    tenantCount: num(raw.tenantCount),
    features: { ...(raw.features ?? {}) },
  }
}

export function normalizeTenantRow<T extends TenantRow>(raw: T): T {
  return {
    ...raw,
    users: { used: num(raw.users?.used), limit: numOrNull(raw.users?.limit) },
    certificates: { active: num(raw.certificates?.active), limit: numOrNull(raw.certificates?.limit) },
    outstandingUsd: num(raw.outstandingUsd),
  }
}

export function normalizeInvoice(raw: PlatformInvoice): PlatformInvoice {
  const payments = (raw.payments ?? []).map((p) => ({ ...p, amount: num(p.amount) }))
  return {
    ...raw,
    lines: (raw.lines ?? []).map((line) => ({
      ...line,
      quantity: num(line.quantity),
      unitPrice: num(line.unitPrice),
      amount: num(line.amount),
    })),
    subtotal: num(raw.subtotal),
    vatRate: asFraction(raw.vatRate),
    vatAmount: num(raw.vatAmount),
    total: num(raw.total),
    sarRate: num(raw.sarRate),
    totalSar: num(raw.totalSar),
    payments,
    amountPaid: raw.amountPaid !== undefined ? num(raw.amountPaid) : payments.reduce((sum, p) => sum + p.amount, 0),
    balance: raw.balance !== undefined ? num(raw.balance) : undefined,
  }
}

function normalizeTenantDetail(raw: TenantDetail): TenantDetail {
  return {
    ...raw,
    certificates: { active: num(raw.certificates?.active), limit: numOrNull(raw.certificates?.limit) },
    usage: {
      users: { used: num(raw.usage?.users?.used), limit: numOrNull(raw.usage?.users?.limit), warning: raw.usage?.users?.warning === true },
      certificates: {
        active: num(raw.usage?.certificates?.active ?? raw.certificates?.active),
        limit: numOrNull(raw.usage?.certificates?.limit ?? raw.certificates?.limit),
        warning: raw.usage?.certificates?.warning === true,
      },
    },
    readOnly: raw.readOnly === true,
    outstandingUsd: num(raw.outstandingUsd),
    invoices: (raw.invoices ?? []).map(normalizeInvoice),
    featureMatrix: raw.featureMatrix ?? [],
    users: raw.users ?? [],
    history: raw.history ?? [],
    limits: {
      users: {
        plan: num(raw.limits?.users?.plan),
        extra: num(raw.limits?.users?.extra),
        override: numOrNull(raw.limits?.users?.override),
        effective: num(raw.limits?.users?.effective),
      },
      certificates: {
        plan: numOrNull(raw.limits?.certificates?.plan),
        override: numOrNull(raw.limits?.certificates?.override),
        effective: numOrNull(raw.limits?.certificates?.effective),
      },
    },
  }
}

function normalizeDashboard(raw: PlatformDashboard): PlatformDashboard {
  const k = raw.kpis
  return {
    kpis: {
      mrrUsd: num(k?.mrrUsd),
      arrUsd: num(k?.arrUsd),
      activeTenants: num(k?.activeTenants),
      trialTenants: num(k?.trialTenants),
      pastDueTenants: num(k?.pastDueTenants),
      suspendedTenants: num(k?.suspendedTenants),
      newThisMonth: num(k?.newThisMonth),
      churnRate90d: asFraction(k?.churnRate90d),
      outstandingUsd: num(k?.outstandingUsd),
      overdueUsd: num(k?.overdueUsd),
    },
    revenueByPlan: (raw.revenueByPlan ?? []).map((r) => ({ plan: r.plan, planCode: r.planCode, mrrUsd: num(r.mrrUsd), tenants: num(r.tenants) })),
    renewalsNext30: (raw.renewalsNext30 ?? []).map(normalizeTenantRow),
    upgradeCandidates: (raw.upgradeCandidates ?? []).map(normalizeTenantRow),
    usage: {
      seatsUsed: num(raw.usage?.seatsUsed),
      seatsAllowed: num(raw.usage?.seatsAllowed),
      certificatesActive: num(raw.usage?.certificatesActive),
      featureUse: (raw.usage?.featureUse ?? []).map((f) => ({ featureKey: f.featureKey, tenants: num(f.tenants) })),
    },
    recentActivity: raw.recentActivity ?? [],
  }
}

function normalizeSettings(raw: PlatformSettings): PlatformSettings {
  return {
    sarRate: num(raw.sarRate, 3.75),
    vatRate: asFraction(raw.vatRate),
    pastDueGraceDays: num(raw.pastDueGraceDays, 14),
    quarantineMonths: num(raw.quarantineMonths, 3),
    trialDays: num(raw.trialDays, 14),
    paymentTermsDays: num(raw.paymentTermsDays, 14),
    trialPlanCode: raw.trialPlanCode ?? 'BASIC',
  }
}

function query(params: Record<string, string | number | undefined | null>): string {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    qs.set(key, String(value))
  }
  const text = qs.toString()
  return text ? `?${text}` : ''
}

const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) })
const enc = encodeURIComponent

/* ── Dashboard ──────────────────────────────────────────────────────── */

export async function fetchPlatformDashboard(): Promise<PlatformDashboard> {
  if (!isDemoMode()) return normalizeDashboard(await authorizedRequest<PlatformDashboard>('/platform/dashboard'))
  return demo.demoDashboard()
}

/* ── Plans ──────────────────────────────────────────────────────────── */

export async function listPlans(): Promise<Plan[]> {
  if (!isDemoMode()) return (await authorizedRequest<Plan[]>('/platform/plans')).map(normalizePlan)
  return demo.demoListPlans()
}

export async function createPlan(input: PlanInput): Promise<Plan> {
  if (!isDemoMode()) return normalizePlan(await authorizedRequest<Plan>('/platform/plans', json('POST', input)))
  return demo.demoCreatePlan(input)
}

export async function updatePlan(id: string, patch: Partial<PlanInput>): Promise<Plan> {
  if (!isDemoMode()) return normalizePlan(await authorizedRequest<Plan>(`/platform/plans/${enc(id)}`, json('PATCH', patch)))
  return demo.demoUpdatePlan(id, patch)
}

export async function archivePlan(id: string, force = false): Promise<void> {
  if (!isDemoMode()) {
    await authorizedRequest(`/platform/plans/${enc(id)}/archive`, json('POST', { force }))
    return
  }
  await demo.demoArchivePlan(id, force)
}

/* ── Tenants ────────────────────────────────────────────────────────── */

export interface TenantFilters {
  search?: string
  status?: string
  plan?: string
}

export async function listTenants(filters: TenantFilters = {}): Promise<TenantRow[]> {
  if (!isDemoMode()) {
    const rows = await authorizedRequest<TenantRow[]>(`/platform/tenants${query({ ...filters })}`)
    return rows.map(normalizeTenantRow)
  }
  return demo.demoListTenants(filters)
}

export async function getTenant(id: string): Promise<TenantDetail> {
  if (!isDemoMode()) return normalizeTenantDetail(await authorizedRequest<TenantDetail>(`/platform/tenants/${enc(id)}`))
  return demo.demoGetTenant(id)
}

/** Creates the CAB, its subscription and the first CAB admin (who receives an invitation e-mail). Returns the new tenant id. */
export async function createTenant(input: CreateTenantInput): Promise<string> {
  if (!isDemoMode()) {
    const res = await authorizedRequest<{ id?: string; cab?: { id: string }; tenant?: { id: string } }>('/platform/tenants', json('POST', input))
    const id = res.id ?? res.cab?.id ?? res.tenant?.id
    if (!id) throw new ApiError('Tenant created without an id', 500)
    return id
  }
  return (await demo.demoCreateTenant(input)).id
}

export async function patchTenantSubscription(id: string, patch: SubscriptionPatch): Promise<TenantDetail> {
  if (!isDemoMode()) {
    await authorizedRequest(`/platform/tenants/${enc(id)}/subscription`, json('PATCH', patch))
    return getTenant(id)
  }
  return demo.demoPatchSubscription(id, patch)
}

/** `null` = follow the plan. */
export async function putTenantFeatures(id: string, overrides: Partial<Record<FeatureKey, boolean | null>>): Promise<TenantDetail> {
  if (!isDemoMode()) {
    await authorizedRequest(`/platform/tenants/${enc(id)}/features`, json('PUT', { overrides }))
    return getTenant(id)
  }
  return demo.demoPutFeatures(id, overrides)
}

export async function changeTenantStatus(id: string, action: StatusAction, reason: string): Promise<TenantDetail> {
  if (!isDemoMode()) {
    await authorizedRequest(`/platform/tenants/${enc(id)}/status`, json('POST', { action, reason }))
    return getTenant(id)
  }
  return demo.demoTenantStatus(id, action, reason)
}

export async function impersonateTenant(id: string, reason: string, minutes: number): Promise<ImpersonationResult> {
  if (!isDemoMode()) return authorizedRequest<ImpersonationResult>(`/platform/tenants/${enc(id)}/impersonate`, json('POST', { reason, minutes }))
  return demo.demoImpersonate(id, reason, minutes)
}

export async function confirmTenantDeletion(id: string): Promise<void> {
  if (!isDemoMode()) {
    await authorizedRequest(`/platform/tenants/${enc(id)}/deletion/confirm`, json('POST', {}))
    return
  }
  await demo.demoConfirmDeletion(id)
}

/* ── Invoices & payments ────────────────────────────────────────────── */

export interface InvoiceFilters {
  status?: string
  tenant?: string
}

export async function listPlatformInvoices(filters: InvoiceFilters = {}): Promise<PlatformInvoice[]> {
  if (!isDemoMode()) return (await authorizedRequest<PlatformInvoice[]>(`/platform/invoices${query({ ...filters })}`)).map(normalizeInvoice)
  return demo.demoListInvoices(filters)
}

/** Generates the due period invoices (all tenants, or one). Idempotent per period. Returns how many were created. */
export async function generatePlatformInvoices(tenantId?: string): Promise<number> {
  if (!isDemoMode()) {
    const res = await authorizedRequest<{ generated?: PlatformInvoice[] } | PlatformInvoice[]>(
      '/platform/invoices/generate',
      json('POST', tenantId ? { tenantId } : {}),
    )
    return Array.isArray(res) ? res.length : (res.generated?.length ?? 0)
  }
  return (await demo.demoGenerateInvoices(tenantId)).length
}

export async function issuePlatformInvoice(id: string): Promise<void> {
  if (!isDemoMode()) {
    await authorizedRequest(`/platform/invoices/${enc(id)}/issue`, json('POST', {}))
    return
  }
  await demo.demoIssueInvoice(id)
}

export async function voidPlatformInvoice(id: string): Promise<void> {
  if (!isDemoMode()) {
    await authorizedRequest(`/platform/invoices/${enc(id)}/void`, json('POST', {}))
    return
  }
  await demo.demoVoidInvoice(id)
}

export interface PaymentInput {
  amount: number
  method: PaymentMethod
  reference: string
  /** ISO date-time */
  receivedAt: string
}

export async function recordPlatformPayment(invoiceId: string, input: PaymentInput): Promise<void> {
  if (!isDemoMode()) {
    await authorizedRequest(`/platform/invoices/${enc(invoiceId)}/payments`, json('POST', input))
    return
  }
  await demo.demoRecordPayment(invoiceId, input)
}

/** The server's .xlsx export; null in the preview (the page then builds the file from the rows on screen). */
export async function exportPlatformInvoices(filters: InvoiceFilters = {}): Promise<Blob | null> {
  if (isDemoMode()) return null
  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}/platform/invoices/export${query({ format: 'xlsx', ...filters })}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!response.ok) throw new ApiError(response.statusText || 'Export failed', response.status)
  return response.blob()
}

/* ── Announcements ──────────────────────────────────────────────────── */

export async function listAnnouncements(): Promise<Announcement[]> {
  if (!isDemoMode()) return authorizedRequest<Announcement[]>('/platform/announcements')
  return demo.demoListAnnouncements()
}

export async function createAnnouncement(input: AnnouncementInput): Promise<Announcement> {
  if (!isDemoMode()) return authorizedRequest<Announcement>('/platform/announcements', json('POST', input))
  return demo.demoCreateAnnouncement(input)
}

export async function updateAnnouncement(id: string, input: Partial<AnnouncementInput>): Promise<Announcement> {
  if (!isDemoMode()) return authorizedRequest<Announcement>(`/platform/announcements/${enc(id)}`, json('PATCH', input))
  return demo.demoUpdateAnnouncement(id, input)
}

export async function deleteAnnouncement(id: string): Promise<void> {
  if (!isDemoMode()) {
    await authorizedRequest(`/platform/announcements/${enc(id)}`, { method: 'DELETE' })
    return
  }
  await demo.demoDeleteAnnouncement(id)
}

/* ── Settings ───────────────────────────────────────────────────────── */

export async function getPlatformSettings(): Promise<PlatformSettings> {
  if (!isDemoMode()) return normalizeSettings(await authorizedRequest<PlatformSettings>('/platform/settings'))
  return demo.demoGetSettings()
}

export async function patchPlatformSettings(patch: Partial<PlatformSettings>): Promise<PlatformSettings> {
  if (!isDemoMode()) return normalizeSettings(await authorizedRequest<PlatformSettings>('/platform/settings', json('PATCH', patch)))
  return demo.demoPatchSettings(patch)
}

/* ── Audit log ──────────────────────────────────────────────────────── */

export interface AuditFilters {
  actor?: string
  target?: string
  /** YYYY-MM-DD */
  from?: string
  /** YYYY-MM-DD */
  to?: string
  page?: number
  limit?: number
}

export async function getPlatformAuditLog(filters: AuditFilters = {}): Promise<Paged<AuditRow>> {
  if (!isDemoMode()) {
    const res = await authorizedRequest<Paged<AuditRow> | AuditRow[]>(`/platform/audit-log${query({ ...filters })}`)
    if (Array.isArray(res)) return { items: res, total: res.length, page: 1, limit: res.length || 1, totalPages: 1 }
    return res
  }
  return demo.demoAuditLog(filters)
}

/* ── Staff ──────────────────────────────────────────────────────────── */

export async function listStaff(): Promise<StaffUser[]> {
  if (!isDemoMode()) return authorizedRequest<StaffUser[]>('/platform/staff')
  return demo.demoListStaff()
}

export async function inviteStaff(input: { name: string; email: string; role: PlatformRole }): Promise<StaffUser> {
  if (!isDemoMode()) return authorizedRequest<StaffUser>('/platform/staff', json('POST', input))
  return demo.demoInviteStaff(input)
}

export async function updateStaff(id: string, patch: { role?: PlatformRole; status?: StaffUser['status'] }): Promise<StaffUser> {
  if (!isDemoMode()) return authorizedRequest<StaffUser>(`/platform/staff/${enc(id)}`, json('PATCH', patch))
  return demo.demoUpdateStaff(id, patch)
}
