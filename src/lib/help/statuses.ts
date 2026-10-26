import { APPLICATION_STATUS_LABEL_KEYS, APPLICATION_STATUS_STYLES } from '@/lib/applicationStatus'
import { CERTIFICATE_STATUS_LABEL_KEYS, CERTIFICATE_STATUS_STYLES } from '@/lib/certificateStatus'
import { NONCONFORMITY_STATUSES } from '@/lib/api/cabNonconformitiesApi'
import { INVOICE_STATUSES, SUBSCRIPTION_STATUSES } from '@/lib/api/platformTypes'
import type { QuotationStatus } from '@/lib/api/cabQuotationApi'
import type { QuotationApprovalStatus } from '@/lib/api/cabApplicationQuotationApi'
import type { OfferStatus } from '@/lib/api/cabOffersApi'
import type { CabInvoiceStatus } from '@/lib/api/cabInvoiceRegisterApi'
import type { CertificationLifecycleStatus, CycleRequestStatus } from '@/lib/api/cabCertificationApi'
import type { ZatcaStatus } from '@/lib/api/zatcaApi'
import { enumLabel } from '@/lib/enumLabel'
import type { HelpStatusDomain } from '@/lib/help/types'

type Translate = (key: string, options?: { defaultValue?: string }) => string

/**
 * Status tables in iHelp are generated from the app's own status enums, labels and chip
 * colours, so a status added to the app shows up in the help center on its own.
 *
 * Every `Record<SomeStatus, …>` below is checked by TypeScript: adding a value to the status
 * type without listing it here fails the type check, which is the reminder to describe it.
 * Domains whose chip is an exported component (nonconformity, lifecycle, quotation,
 * subscription, platform invoice) render with that component (see HelpStatusChip).
 */
export interface StatusDomainDef {
  values: readonly string[]
  label: (t: Translate, value: string) => string
  /** Chip classes, only for domains without an exported badge component. Mirrors the app's chip. */
  tone?: (value: string) => string
}

// Mirrors CabOfferRegisterPage.getStatusBadge.
const OFFER_TONES: Record<OfferStatus, string> = {
  draft: 'bg-neutral-50 text-slate-600',
  pending_approval: 'bg-warning-100 text-warning-700',
  approved: 'bg-success-100 text-success-700',
  issued: 'bg-primary-50 text-primary',
  rejected: 'bg-error-100 text-error-600',
  void: 'bg-error-100 text-error-600',
}

// Mirrors CabInvoiceRegisterPage.getStatusBadge.
const CAB_INVOICE_TONES: Record<CabInvoiceStatus, string> = {
  Draft: 'bg-neutral-50 text-slate-600',
  Issued: 'bg-primary-50 text-primary',
  Unpaid: 'bg-error-100 text-error-600',
  'Partially paid': 'bg-primary-50 text-primary',
  Paid: 'bg-success-100 text-success-700',
}

// Mirrors QuotationApprovalPanel.
const QUOTATION_APPROVAL_TONES: Record<QuotationApprovalStatus, string> = {
  DRAFT: 'bg-neutral-50 text-neutral-800',
  PENDING: 'bg-warning-50 text-warning-700',
  APPROVED: 'bg-success-50 text-success-700',
}

// Mirrors CycleTabPanel (certification cycle requests).
const CYCLE_REQUEST_TONES: Record<CycleRequestStatus, string> = {
  open: 'bg-warning-50 text-warning-700',
  approved: 'bg-primary-50 text-primary',
  completed: 'bg-success-50 text-success-600',
  rejected: 'bg-error-100 text-error-600',
}

// Mirrors ZatcaPanel.
const ZATCA_TONES: Record<ZatcaStatus, string> = {
  NOT_REQUIRED: 'bg-neutral-50 text-neutral-700',
  PENDING: 'bg-orange-50 text-orange-700',
  REPORTED: 'bg-info-50 text-info-700',
  CLEARED: 'bg-success-100 text-success-700',
  REJECTED: 'bg-error-100 text-error-600',
}

// Value lists for types that have no runtime list in the app.
const QUOTATION_VALUES: Record<QuotationStatus, true> = { CREATED: true, DRAFT: true, ISSUED: true, ACCEPTED: true, REJECTED: true, CANCELLED: true }
const LIFECYCLE_VALUES: Record<CertificationLifecycleStatus, true> = { active: true, upcoming: true, suspended: true, expired: true }

export const STATUS_DOMAINS: Record<HelpStatusDomain, StatusDomainDef> = {
  application: {
    values: Object.keys(APPLICATION_STATUS_STYLES),
    label: (t, v) => t(`cab.applicationRegister.status.${APPLICATION_STATUS_LABEL_KEYS[v as keyof typeof APPLICATION_STATUS_LABEL_KEYS]}`, { defaultValue: v }),
    tone: (v) => APPLICATION_STATUS_STYLES[v as keyof typeof APPLICATION_STATUS_STYLES],
  },
  quotation: {
    values: Object.keys(QUOTATION_VALUES),
    label: (t, v) => t(`cab.quotationFlow.status.${v}`, { defaultValue: v }),
  },
  quotationApproval: {
    values: Object.keys(QUOTATION_APPROVAL_TONES),
    label: (t, v) => t(`cab.quotationApproval.status.${v}`, { defaultValue: v }),
    tone: (v) => QUOTATION_APPROVAL_TONES[v as QuotationApprovalStatus],
  },
  offer: {
    values: Object.keys(OFFER_TONES),
    label: (t, v) => t(`cab.offersPage.status.${v}`, { defaultValue: v }),
    tone: (v) => OFFER_TONES[v as OfferStatus],
  },
  cabInvoice: {
    values: Object.keys(CAB_INVOICE_TONES),
    label: (t, v) => t(`invoices.register.${v.toLowerCase().replace(/\s+/g, '')}`, { defaultValue: v }),
    tone: (v) => CAB_INVOICE_TONES[v as CabInvoiceStatus],
  },
  nonconformity: {
    values: NONCONFORMITY_STATUSES,
    label: (t, v) => t(`cab.nonconformities.status.${v}`, { defaultValue: v }),
  },
  certificate: {
    values: Object.keys(CERTIFICATE_STATUS_STYLES),
    label: (t, v) => t(`cab.certificateRegister.status.${CERTIFICATE_STATUS_LABEL_KEYS[v as keyof typeof CERTIFICATE_STATUS_LABEL_KEYS]}`, { defaultValue: v }),
    tone: (v) => CERTIFICATE_STATUS_STYLES[v as keyof typeof CERTIFICATE_STATUS_STYLES],
  },
  lifecycle: {
    values: Object.keys(LIFECYCLE_VALUES),
    label: (t, v) => enumLabel(t, v),
  },
  cycleRequest: {
    values: Object.keys(CYCLE_REQUEST_TONES),
    label: (t, v) => t(`cab.manageCycle.requests.status.${v}`, { defaultValue: v }),
    tone: (v) => CYCLE_REQUEST_TONES[v as CycleRequestStatus],
  },
  zatca: {
    values: Object.keys(ZATCA_TONES),
    label: (t, v) => t(`zatca.status.${v}`, { defaultValue: v }),
    tone: (v) => ZATCA_TONES[v as ZatcaStatus],
  },
  subscription: {
    values: SUBSCRIPTION_STATUSES,
    label: (t, v) => t(`platform.status.${v}`, { defaultValue: v }),
  },
  platformInvoice: {
    values: INVOICE_STATUSES,
    label: (t, v) => t(`platform.invoiceStatus.${v}`, { defaultValue: v }),
  },
}

export interface StatusRow {
  value: string | null
  label: string
  description?: string
}

/**
 * Rows of an article's status table: one per enum value (in the app's order), with the
 * article's description when it has one, then any described rows that are not enum values.
 */
export function statusRows(
  t: Translate,
  domain: HelpStatusDomain | undefined,
  statuses: [string, string][] | undefined,
  statusValues: (string | null)[] | undefined,
): StatusRow[] {
  const described = statuses ?? []
  if (!domain) return described.map(([label, description]) => ({ value: null, label, description }))
  const def = STATUS_DOMAINS[domain]
  const byValue = new Map<string, string>()
  const extra: StatusRow[] = []
  described.forEach(([label, description], index) => {
    const value = statusValues?.[index] ?? null
    if (value && def.values.includes(value)) byValue.set(value, description)
    else extra.push({ value: null, label, description })
  })
  return [
    ...def.values.map((value) => ({ value, label: def.label(t, value), description: byValue.get(value) })),
    ...extra,
  ]
}
