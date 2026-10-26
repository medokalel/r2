/**
 * Types of the iCASCO platform admin API (`/api/v1/platform/*`) and of the CAB
 * subscription endpoint (`/api/v1/subscription`). They follow PLATFORM_SPEC.md
 * field for field; money arrives as a number (strings from Prisma `Decimal` are
 * converted in platformApi.ts / subscriptionApi.ts before they reach a screen).
 */

/** One key per sellable module. Core modules (profile, clients, applications, account, notifications) are always on. */
export const FEATURE_KEYS = [
  'quotations',
  'offers',
  'invoices',
  'audit_planning',
  'audit_reporting',
  'nonconformities',
  'decisions',
  'certificates',
  'certification_cycles',
  'competence',
  'contacts',
  'client_portal',
  'wallet',
  'assistant',
  'dashboard_analytics',
  'iaf_api',
  'excel_import',
  'sso',
] as const

export type FeatureKey = (typeof FEATURE_KEYS)[number]
export type FeatureMap = Record<FeatureKey, boolean>

export const PLATFORM_ROLES = ['PLATFORM_ADMIN', 'PLATFORM_SUPPORT', 'PLATFORM_FINANCE'] as const
export type PlatformRole = (typeof PLATFORM_ROLES)[number]

export const SUBSCRIPTION_STATUSES = ['TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED', 'EXPIRED'] as const
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]

export const BILLING_CYCLES = ['MONTHLY', 'YEARLY'] as const
export type BillingCycle = (typeof BILLING_CYCLES)[number]

export const INVOICE_STATUSES = ['DRAFT', 'ISSUED', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'VOID'] as const
export type PlatformInvoiceStatus = (typeof INVOICE_STATUSES)[number]

export const PAYMENT_METHODS = ['BANK_TRANSFER', 'CARD', 'OTHER'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export type AnnouncementSeverity = 'INFO' | 'WARNING'
export type StatusAction = 'activate' | 'suspend' | 'reactivate' | 'cancel'

export interface PlanSummary {
  id: string
  code: string
  name: string
}

export interface Plan extends PlanSummary {
  description: string
  priceMonthly: number
  priceYearly: number
  currency: string
  includedUsers: number
  /** null = unlimited */
  maxActiveCertificates: number | null
  /** null = unlimited */
  iafApiQuota: number | null
  supportHoursMonthly: number
  extraUserPriceMonthly: number
  onboardingFee: number
  isActive: boolean
  sortOrder: number
  features: FeatureMap
  tenantCount: number
  createdAt: string
  updatedAt: string
}

export type PlanInput = Omit<Plan, 'id' | 'tenantCount' | 'createdAt' | 'updatedAt' | 'isActive'> & { isActive?: boolean }

export interface UsageCount {
  used: number
  /** null = unlimited */
  limit: number | null
}

export interface TenantRow {
  id: string
  name: string
  slug: string
  country: string
  plan: PlanSummary
  status: SubscriptionStatus
  billingCycle: BillingCycle
  currentPeriodEnd: string
  users: UsageCount
  certificates: { active: number; limit: number | null }
  outstandingUsd: number
  createdAt: string
}

export interface UpgradeCandidate extends TenantRow {
  /** Why the tenant should upgrade, e.g. "USERS_NEAR_LIMIT" / "CERTIFICATES_NEAR_LIMIT" (or a sentence). */
  reason: string
}

export interface AuditRow {
  id: string
  actorUserId: string
  actorName?: string | null
  action: string
  targetType: string
  targetId: string
  targetName?: string | null
  before: unknown
  after: unknown
  reason: string | null
  ip: string | null
  createdAt: string
}

export interface Subscription {
  id: string
  cabId: string
  planId: string
  status: SubscriptionStatus
  billingCycle: BillingCycle
  startDate: string
  currentPeriodEnd: string
  trialEndsAt: string | null
  extraUsers: number
  onboardingFeeWaived: boolean
  waiverReason: string | null
  cancelledAt: string | null
  quarantineUntil: string | null
  deletionDueAt: string | null
  userLimitOverride: number | null
  certificateLimitOverride: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface FeatureMatrixRow {
  featureKey: FeatureKey
  plan: boolean
  /** null = follows the plan */
  override: boolean | null
  effective: boolean
}

export interface TenantLimits {
  users: { plan: number; extra: number; override: number | null; effective: number }
  certificates: { plan: number | null; override: number | null; effective: number | null }
}

export interface TenantUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  lastLoginAt: string | null
}

export interface InvoiceLine {
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface PlatformPayment {
  id: string
  invoiceId: string
  amount: number
  currency: string
  method: PaymentMethod
  paymentProvider: string
  reference: string
  receivedAt: string
  recordedBy: string
  createdAt: string
}

export interface PlatformInvoice {
  id: string
  number: string
  cabId: string
  /** Tenant display name (list endpoints include it). */
  tenantName?: string
  subscriptionId: string
  periodStart: string
  periodEnd: string
  currency: string
  lines: InvoiceLine[]
  subtotal: number
  vatRate: number
  vatAmount: number
  total: number
  sarRate: number
  totalSar: number
  status: PlatformInvoiceStatus
  issuedAt: string | null
  dueDate: string
  paidAt: string | null
  /** Sum of recorded payments. */
  amountPaid?: number
  /** Open amount (0 when void). */
  balance?: number
  payments?: PlatformPayment[]
  createdAt: string
  updatedAt: string
}

/** Spec: TenantRow + details. `users` is the user list here (not the used/limit counter of the row). */
export interface TenantDetail extends Omit<TenantRow, 'users'> {
  /** Seat and certificate meters (the row's `users` counter moves here because `users` is the list). */
  usage: { users: UsageCount & { warning?: boolean }; certificates: { active: number; limit: number | null; warning?: boolean } }
  readOnly: boolean
  subscription: Subscription
  featureMatrix: FeatureMatrixRow[]
  limits: TenantLimits
  invoices: PlatformInvoice[]
  users: TenantUser[]
  history: AuditRow[]
}

export interface PlatformDashboard {
  kpis: {
    mrrUsd: number
    arrUsd: number
    activeTenants: number
    trialTenants: number
    pastDueTenants: number
    suspendedTenants: number
    newThisMonth: number
    /** Fraction: 0.05 = 5 % */
    churnRate90d: number
    outstandingUsd: number
    overdueUsd: number
  }
  revenueByPlan: Array<{ plan: string; planCode?: string; mrrUsd: number; tenants: number }>
  renewalsNext30: TenantRow[]
  upgradeCandidates: UpgradeCandidate[]
  usage: {
    seatsUsed: number
    seatsAllowed: number
    certificatesActive: number
    featureUse: Array<{ featureKey: FeatureKey; tenants: number }>
  }
  recentActivity: AuditRow[]
}

export interface Announcement {
  id: string
  title: string
  body: string
  /** ALL | PLAN:<code> | CAB:<id> */
  audience: string
  severity: AnnouncementSeverity
  startsAt: string
  endsAt: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type AnnouncementInput = Pick<Announcement, 'title' | 'body' | 'audience' | 'severity' | 'startsAt' | 'endsAt'>

export interface PlatformSettings {
  sarRate: number
  /** Fraction: 0.15 = 15 % */
  vatRate: number
  /** Days between issue and due date of an invoice. */
  paymentTermsDays: number
  /** Plan given to self-service trial sign-ups. */
  trialPlanCode: string
  pastDueGraceDays: number
  quarantineMonths: number
  trialDays: number
}

export interface StaffUser {
  id: string
  name: string
  email: string
  role: PlatformRole
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED'
  lastLoginAt: string | null
  createdAt: string
}

export interface Paged<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateTenantInput {
  legalEntityName: string
  tradingName?: string
  country: string
  adminName: string
  adminEmail: string
  planId: string
  billingCycle: BillingCycle
  trialDays?: number
  extraUsers?: number
  onboardingFeeWaived?: boolean
  waiverReason?: string
}

export interface SubscriptionPatch {
  planId?: string
  billingCycle?: BillingCycle
  extraUsers?: number
  userLimitOverride?: number | null
  certificateLimitOverride?: number | null
  notes?: string
  reason: string
}

export interface ImpersonationResult {
  /** Short-lived CAB_ADMIN token flagged `impersonatedBy`. */
  token: string
  expiresAt: string
  /** Login-shaped session for the tenant (when the backend sends one). */
  session?: unknown
  tenant?: { id: string; name: string }
}

/** GET /subscription — what the CAB workspace needs to gate navigation. */
export interface MySubscription {
  plan: PlanSummary & Partial<Pick<Plan, 'includedUsers' | 'maxActiveCertificates' | 'priceMonthly' | 'priceYearly' | 'currency' | 'supportHoursMonthly'>>
  status: SubscriptionStatus
  billingCycle: BillingCycle
  currentPeriodEnd: string
  features: FeatureMap
  limits: { users: UsageCount; certificates: { active: number; limit: number | null } }
  readOnly: boolean
  /** Quarantine over: everything but /subscription answers SUBSCRIPTION_ENDED. */
  ended?: boolean
  trialEndsAt?: string | null
  /** Server warning flags (≥ 80 % of the limit). */
  warnings?: { certificates?: boolean; users?: boolean }
  /** Set when the caller is iCASCO support signed in to this workspace. */
  impersonation?: { byUserId: string; byName: string; expiresAt: string | null } | null
  announcements: Announcement[]
  invoices: PlatformInvoice[]
}
