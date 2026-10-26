/**
 * CAB quotations and pricing.
 *
 * Real endpoints (CAB admin):
 *   GET/POST/DELETE /cab/pricing-config                       daily rate per currency (+ per standard), default currency
 *   GET   /cab/certification-applications/:id/quotation/audit-time-context   suggested sector classification,
 *         multi-site register from the branches, IAF MD 1 criteria, override permission
 *   POST  /cab/certification-applications/:id/quotation/preview   audit days, fees and breakdown (nothing stored)
 *   POST  /cab/certification-applications/:id/quotation           create (breakdown stored)
 *   GET   /cab/quotations · GET/PATCH /cab/quotations/:id
 *   PATCH /cab/quotations/:id/events/:eventId                  justified day override / reset
 *   POST  /cab/quotations/:id/recalculate                      recalculate an open quotation (current data, logged)
 *   POST  /cab/quotations/:id/{issue|accept|reject|cancel}
 *   GET   /audit-engine/standards
 * Demo mode prices with the same audit-time calculator (src/lib/auditTime) through the demo store.
 */
import { authorizedRequest } from '@/lib/api/authorizedClient'
import { ApiError } from '@/lib/api/client'
import { isDemoMode, wait } from '@/lib/api/demo/demoStore'
import {
  auditStandardsDemo, createQuotationFor, deactivatePricingRecord, overrideQuotationEvent, previewQuotationFor, pricingConfigs,
  recalculateQuotationFor, upsertPricingRecord,
} from '@/lib/api/demo/records'
import { AuditTimeError, type AdjustmentDirection, type AuditTimeBreakdown, type EligibilityAnswers, type SiteInput } from '@/lib/auditTime/calculator'
import type { AuditStage, CycleType, EligibilityCriterion } from '@/lib/auditTime/rules'
import type { ClassificationOverrideRecord, ClassificationSource, ClassificationSuggestion } from '@/lib/auditTime/classification'
import type { ClassificationSource as SectorSource } from '@/lib/auditTime/sectorCategories'
import { auditTimeContextFor } from '@/lib/auditTime/demoContext'

export const QUOTATION_CURRENCIES = ['SAR', 'USD', 'EGP', 'EUR', 'GBP', 'AED'] as const

export type QuotationStatus = 'CREATED' | 'DRAFT' | 'ISSUED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'

export interface CabPricingConfig {
  id: string
  standardId: string | null
  /** Decimal strings, e.g. taxRate "0.1500" = 15%. */
  dailyRate: string
  taxRate: string
  currency: string
  /** The default currency: its global rate prefills new quotations. */
  isDefault?: boolean
  isActive: boolean
  standard: { id: string; code: string; name: string } | null
}

export interface AuditStandardOption { id: string; code: string; name: string; complexityRequired: boolean }

export interface QuotationItem {
  name: string
  cost: number
}

export interface QuotationEvent {
  id: string
  standardCode: string
  auditEventType: AuditStage
  sequenceOrder: number
  auditDays: string
  dailyRate: string
  auditFee: string
  manualOverride: boolean
  policyVerificationStatus: 'VERIFIED' | 'NEEDS_REVIEW' | 'BLOCKED'
  /** Days calculated by the audit-time engine (null on quotations created before it). */
  calculatedDays?: string | null
  overrideReason?: string | null
  overriddenAt?: string | null
}

export interface QuotationDayOverride {
  id: string
  eventId: string
  standardCode: string
  auditEventType: AuditStage
  fromDays: string
  toDays: string
  calculatedDays: string | null
  reason: string
  changedByName: string | null
  createdAt: string
}

/** Inputs the days were calculated from (stored with the quotation). */
export interface QuotationCalculationInputs {
  cycleType: CycleType
  employees: number
  stage1SharePercent: number
  integrationLevelPercent: number
  remoteSharePercent: number
  multiSite: QuotationCalculationPayload['multiSite'] | null
  standards: Array<{
    standardCode: string
    complexity: string | null
    iafCodes?: string[]
    classification?: { suggested: string | null; category: string | null; source: ClassificationSource } | null
    classificationOverride?: ClassificationOverrideRecord | null
    specialCase?: { days: number; justification: string } | null
    food: { category: string; studies: number; fteEmployees?: number | null } | null
    adjustments: Array<{ direction: AdjustmentDirection; percent: number; reason: string }>
  }>
  currency: string
  dailyRate: number | null
  standardRates: Array<{ standardCode: string; dailyRate: number }>
}

/** Justified change of a suggested sector category, logged with the quotation. */
export interface QuotationClassificationOverride {
  id: string
  standardCode: string
  fromCategory: string | null
  toCategory: string
  justification: string
  lowered: boolean
  changedByName: string | null
  changedByRole: string | null
  createdAt: string
}

/** One recalculation of an open quotation (POST …/recalculate). */
export interface QuotationRecalculation {
  id: string
  reason: string
  beforeTotalAuditDays: string
  afterTotalAuditDays: string
  beforeTotalAuditFee: string
  afterTotalAuditFee: string
  beforeTotalAmount: string
  afterTotalAmount: string
  manualOverridesReset: number
  approvalStatusBefore: string | null
  changedByName: string | null
  createdAt: string
}

export interface QuotationCalculation {
  inputs: QuotationCalculationInputs
  breakdown: AuditTimeBreakdown
}

export interface Quotation {
  id: string
  applicationId: string
  quotationNumber: string | null
  status: QuotationStatus
  cabName: string | null
  cycleType?: CycleType
  standardCodesUsed: string[]
  employeeCountUsed: number
  currency: string
  dailyRate: string
  initialAuditDays: string | null
  initialAuditFee: string | null
  totalAuditDays: string
  totalAuditFee: string
  travelExpenses: string
  /** Approved travel estimate behind the travel expenses (travel cost calculator), when one is linked. */
  travelEstimate?: { id: string; estimateNumber: string; status: string; total: string; currency: string; priceConfirmed: boolean; priceLabel: string; validUntil: string | null; stale: boolean } | null
  additionalItems: QuotationItem[]
  additionalItemsTotal: string
  startDate: string
  offerEndDate: string | null
  taxRate: string
  taxAmount: string
  totalAmount: string
  isProvisional: boolean
  provisionalDisclaimer: string | null
  events: QuotationEvent[]
  /** Breakdown of the audit-time engine; absent in lists, null on quotations created before it. */
  calculation?: QuotationCalculation | null
  dayOverrides?: QuotationDayOverride[]
  classificationOverrides?: QuotationClassificationOverride[]
  /** Recalculations with the totals before and after, newest first. */
  recalculations?: QuotationRecalculation[]
  createdAt: string
  updatedAt: string
}

export interface QuotationList {
  items: Quotation[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/** Audit-time and pricing inputs (shared by preview and create). */
export interface QuotationCalculationPayload {
  cycleType?: CycleType
  complexities?: Record<string, string>
  fsmsInputs?: { foodCategory: string; studies: number; fteEmployees?: number | null }
  /** IAF MD 5 factors, reason required; the net reduction is capped at 30 %. */
  adjustments?: Array<{ standardCode: string; direction: AdjustmentDirection; percent: number; reason: string }>
  stage1SharePercent?: number
  /** IAF MD 11 level of integration (0–100). */
  integrationLevelPercent?: number
  /** IAF MD 5 Annex A / B / C: justified change of the suggested category (authorised users). */
  classificationOverrides?: Array<{ standardCode: string; category: string; justification: string }>
  /** ISO 14001 Special category: individual audit time and its justification. */
  specialCases?: Array<{ standardCode: string; days: number; justification: string }>
  /** IAF MD 1: sites default to the application's branches in scope. */
  multiSite?: {
    enabled: boolean
    sampling?: boolean
    siteReductionPercent?: number
    centralReductionPercent?: number
    eligibility?: EligibilityAnswers
    systemEffective?: boolean
    additionalSampleSites?: number
    additionalSampleReason?: string | null
    sites?: SiteInput[]
  }
  /** IAF MD 4 remote share (recorded). */
  remoteSharePercent?: number
  currency?: string
  dailyRate?: number
  standardRates?: Array<{ standardCode: string; dailyRate: number }>
}

export interface CreateQuotationPayload extends QuotationCalculationPayload {
  travelExpenses: number
  additionalItems?: QuotationItem[]
  offerEndDate?: string | null
  notes?: string | null
  internalNotes?: string | null
}

export interface QuotationPreview {
  applicationId: string
  currency: string
  taxRate: string
  employeeCount: number
  standards: Array<{
    standardCode: string
    standardName: string
    dailyRate: string
    rateSource: 'QUOTATION_STANDARD' | 'QUOTATION' | 'CAB_STANDARD' | 'CAB_DEFAULT'
    totalDays: string
    totalFee: string
    stages: Array<{ stage: AuditStage; days: string; fee: string }>
  }>
  totalAuditDays: string
  totalAuditFee: string
  warnings: Array<{ type: string; code?: string; message: string; standardCode?: string }>
  calculation: QuotationCalculation
}

/** What the editor needs before calculating (GET …/quotation/audit-time-context). */
export interface AuditTimeContext {
  applicationId: string
  standards: Array<{ standardCode: string; certificateIafCodes: string[]; classification: ClassificationSuggestion }>
  sites: SiteInput[]
  eligibilityCriteria: EligibilityCriterion[]
  permissions: { canOverrideClassification: boolean; role: string | null; overrideRoles: string[] }
  sources: Record<string, SectorSource>
}

export interface UpdateQuotationPayload {
  travelExpenses?: number
  taxRate?: number
  additionalItems?: QuotationItem[]
  offerEndDate?: string | null
  notes?: string | null
  internalNotes?: string | null
}

/** A justified override ({ appliedDays, reason }) or a reset to the calculated days. */
export type EventDaysChange = { appliedDays: number; reason: string } | { reset: true; reason?: string }

const json = (body: unknown) => ({ method: 'POST', body: JSON.stringify(body) })
const quotationPath = (id: string) => `/cab/quotations/${encodeURIComponent(id)}`

/** Runs a demo-store action like an API call: async, and calculation errors as a 422 ApiError. */
async function demo<T>(action: () => T | null | undefined, notFound = 'Not found.'): Promise<T> {
  await wait(150)
  try {
    const result = action()
    if (result == null) throw new ApiError(notFound, 404)
    return JSON.parse(JSON.stringify(result)) as T
  } catch (failure) {
    if (failure instanceof AuditTimeError) throw new ApiError(failure.message, 422, undefined, failure.code)
    throw failure
  }
}

// --- Pricing configuration (daily rate per currency / tax rate / default currency) ---

export function listPricingConfigs(): Promise<CabPricingConfig[]> {
  if (isDemoMode()) return demo(() => pricingConfigs().filter((config) => config.isActive))
  return authorizedRequest('/cab/pricing-config')
}

/** Upsert by (standardId, currency); global rate when standardId is omitted. taxRate is a decimal (0.15 = 15%). */
export function upsertPricingConfig(payload: {
  dailyRate: number
  currency: string
  taxRate: number
  standardId?: string | null
  isDefault?: boolean
}): Promise<CabPricingConfig> {
  if (isDemoMode()) return demo(() => upsertPricingRecord(payload))
  return authorizedRequest('/cab/pricing-config', json(payload))
}

export function deactivatePricingConfig(configId: string): Promise<{ message: string }> {
  if (isDemoMode()) return demo(() => (deactivatePricingRecord(configId) ? { message: 'Pricing configuration deactivated.' } : null), 'Pricing configuration not found.')
  return authorizedRequest(`/cab/pricing-config/${encodeURIComponent(configId)}`, { method: 'DELETE' })
}

/** Standards with an audit-time rule (per-standard rates on the pricing page). */
export function listAuditStandards(): Promise<AuditStandardOption[]> {
  if (isDemoMode()) return demo(() => auditStandardsDemo())
  return authorizedRequest('/audit-engine/standards')
}

// --- Quotations ---

export function getAuditTimeContext(applicationId: string): Promise<AuditTimeContext> {
  if (isDemoMode()) return demo(() => auditTimeContextFor(applicationId), 'Certification application not found.')
  return authorizedRequest(`/cab/certification-applications/${encodeURIComponent(applicationId)}/quotation/audit-time-context`)
}

export function previewQuotation(applicationId: string, payload: QuotationCalculationPayload): Promise<QuotationPreview> {
  if (isDemoMode()) return demo(() => previewQuotationFor(applicationId, payload), 'Certification application not found.')
  return authorizedRequest(
    `/cab/certification-applications/${encodeURIComponent(applicationId)}/quotation/preview`,
    json(payload),
  )
}

export function createQuotation(applicationId: string, payload: CreateQuotationPayload): Promise<Quotation> {
  if (isDemoMode()) return demo(() => createQuotationFor(applicationId, payload), 'Certification application not found.')
  return authorizedRequest(
    `/cab/certification-applications/${encodeURIComponent(applicationId)}/quotation`,
    json(payload),
  )
}

export function listQuotations(
  params: { applicationId?: string; status?: QuotationStatus; page?: number; limit?: number } = {},
): Promise<QuotationList> {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) if (value !== undefined) query.set(key, String(value))
  const suffix = query.toString()
  return authorizedRequest(`/cab/quotations${suffix ? `?${suffix}` : ''}`)
}

export function getQuotation(quotationId: string): Promise<Quotation> {
  return authorizedRequest(quotationPath(quotationId))
}

export function updateQuotation(quotationId: string, payload: UpdateQuotationPayload): Promise<Quotation> {
  return authorizedRequest(quotationPath(quotationId), { method: 'PATCH', body: JSON.stringify(payload) })
}

export function overrideEventDays(quotationId: string, eventId: string, change: EventDaysChange): Promise<Quotation> {
  if (isDemoMode()) {
    return demo(() => ('reset' in change
      ? overrideQuotationEvent(quotationId, eventId, null, change.reason)
      : overrideQuotationEvent(quotationId, eventId, change.appliedDays, change.reason)), 'Quotation event not found.')
  }
  return authorizedRequest(`${quotationPath(quotationId)}/events/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    body: JSON.stringify(change),
  })
}

/**
 * Recalculate an open quotation with the current application data, sites and classification.
 * Fields not sent keep the stored inputs. 403 without override authority, 409 once issued.
 */
export function recalculateQuotation(quotationId: string, payload: QuotationCalculationPayload & { reason: string }): Promise<Quotation> {
  if (isDemoMode()) return demo(() => recalculateQuotationFor(quotationId, payload), 'Quotation not found.')
  return authorizedRequest(`${quotationPath(quotationId)}/recalculate`, json(payload))
}

export type QuotationTransition = 'issue' | 'accept' | 'reject' | 'cancel'

/** issue: CREATED→ISSUED · accept/reject: ISSUED→ACCEPTED/REJECTED · cancel: CREATED|ISSUED→CANCELLED. */
export function transitionQuotation(
  quotationId: string,
  action: QuotationTransition,
  note?: string,
): Promise<Quotation> {
  return authorizedRequest(`${quotationPath(quotationId)}/${action}`, json({ note: note?.trim() || null }))
}
