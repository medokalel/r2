/**
 * Days and prices of a quotation from the audit-time calculator — the demo store's copy of the
 * backend's quotation.service.js `draftQuotation` (+ cab-pricing-config.service.js
 * `resolveQuotationPricing`). Pure: no store access.
 */
import { AuditTimeError, calculateAuditTime, type AuditTimeBreakdown, type SiteInput } from '@/lib/auditTime/calculator'
import type { AuditStage, CycleType } from '@/lib/auditTime/rules'
import { canonicalStandardCode } from '@/lib/quotationForm'
import type { CabPricingConfig, QuotationCalculationInputs, QuotationCalculationPayload, QuotationPreview } from '@/lib/api/cabQuotationApi'

export interface DraftBranch {
  id?: string | null
  sourceBranchId?: string | null
  branchName?: string | null
  address?: string | null
  employees?: number | null
  employeesInScope?: number | null
  centralManagement?: boolean | null
  activities?: string | null
  shifts?: number | null
  siteDetails?: {
    country?: string
    city?: string
    applicableStandards?: string[]
    siteType?: 'PERMANENT' | 'TEMPORARY'
    iafCodes?: string[]
    temporaryEmployees?: number
    sameProcesses?: boolean
    isNewSite?: boolean
    auditIndividually?: boolean
    individualAuditReason?: string
  } | null
}

export interface DraftCertificate {
  certificateCode?: string
  certificateName?: string
  sectors?: Array<{ iafCodes?: Array<{ code?: string } | string> }> | null
}

/** A classification override recorded with the quotation (QuotationClassificationOverride). */
export interface ClassificationRecord {
  standardCode: string
  fromCategory: string | null
  toCategory: string
  justification: string
  lowered: boolean
  changedByName: string | null
  changedByRole: string | null
}

export interface QuotationDraftEvent {
  standardCode: string
  auditEventType: AuditStage
  sequenceOrder: number
  days: number
  dailyRate: number
  fee: number
}

export interface QuotationDraft {
  breakdown: AuditTimeBreakdown
  inputs: QuotationCalculationInputs
  currency: string
  taxRate: number
  employees: number
  perStandard: QuotationPreview['standards']
  events: QuotationDraftEvent[]
  totalDays: number
  totalFee: number
  warnings: QuotationPreview['warnings']
  classificationRecords: ClassificationRecord[]
}

/** IAF codes of an application certificate (sectors[].iafCodes[].code). */
export function iafCodesOf(certificate: DraftCertificate): string[] {
  return (certificate.sectors ?? []).flatMap((sector) => (sector?.iafCodes ?? []).map((item) => (typeof item === 'string' ? item : item?.code))).filter((code): code is string => Boolean(code))
}

/** A site of the multi-site register from an application branch (same mapping as the API). */
export function siteOfBranch(branch: DraftBranch): Required<Pick<SiteInput, 'name' | 'employees' | 'isCentral' | 'siteType' | 'iafCodes' | 'standards' | 'sameProcesses' | 'isNew' | 'auditIndividually'>> & SiteInput {
  const details = branch.siteDetails ?? {}
  return {
    id: branch.id ?? branch.sourceBranchId ?? null,
    name: branch.branchName ?? '',
    employees: branch.employeesInScope ?? 0,
    isCentral: Boolean(branch.centralManagement),
    siteType: details.siteType === 'TEMPORARY' ? 'TEMPORARY' : 'PERMANENT',
    location: [branch.address, details.city, details.country].filter(Boolean).join(', ') || null,
    activities: branch.activities ?? null,
    iafCodes: details.iafCodes ?? [],
    standards: [...new Set((details.applicableStandards ?? []).map((code) => canonicalStandardCode(code)).filter((code): code is string => Boolean(code)))],
    sameProcesses: details.sameProcesses !== false,
    isNew: Boolean(details.isNewSite),
    auditIndividually: Boolean(details.auditIndividually),
    individualReason: details.individualAuditReason ?? null,
    permanentEmployees: branch.employees ?? null,
    temporaryEmployees: details.temporaryEmployees ?? null,
    shifts: branch.shifts ?? null,
  }
}

const cents = (value: number) => Math.round((value + 1e-9) * 100) / 100

/** Cycle type from the application's request type unless the CAB chose one. */
export function cycleTypeOf(requestType: string | null | undefined, requested?: CycleType): CycleType {
  if (requested) return requested
  if (/transfer/i.test(requestType ?? '')) return 'TRANSFER'
  if (/renew|recert/i.test(requestType ?? '')) return 'RECERTIFICATION'
  return 'INITIAL'
}

/** Currency, tax and the daily rate of each standard (same order of precedence as the API). */
export function resolvePricing(configs: CabPricingConfig[], payload: QuotationCalculationPayload, standards: string[]) {
  const active = configs.filter((config) => config.isActive)
  const globals = active.filter((config) => config.standardId === null)
  const defaultRow = globals.find((config) => config.isDefault) ?? globals[0] ?? active[0] ?? null
  const currency = payload.currency ?? defaultRow?.currency
  if (!currency) {
    throw new AuditTimeError('PRICING_MISSING', 'No pricing configuration found for CAB. Set a default daily rate in CAB Profile → Pricing or enter a currency and daily rate on the quotation.')
  }
  const globalRow = globals.find((config) => config.currency === currency) ?? null
  const taxRate = Number((globalRow ?? defaultRow)?.taxRate ?? 0)
  const entered = Object.fromEntries((payload.standardRates ?? []).map((r) => [canonicalStandardCode(r.standardCode) ?? r.standardCode, r.dailyRate]))
  const rates: Record<string, { dailyRate: number; source: QuotationPreview['standards'][number]['rateSource'] }> = {}
  for (const code of standards) {
    const specific = active.find((config) => config.standard?.code === code && config.currency === currency)
    if (entered[code] != null) rates[code] = { dailyRate: Number(entered[code]), source: 'QUOTATION_STANDARD' }
    else if (payload.dailyRate != null) rates[code] = { dailyRate: Number(payload.dailyRate), source: 'QUOTATION' }
    else if (specific) rates[code] = { dailyRate: Number(specific.dailyRate), source: 'CAB_STANDARD' }
    else if (globalRow) rates[code] = { dailyRate: Number(globalRow.dailyRate), source: 'CAB_DEFAULT' }
    else throw new AuditTimeError('RATE_MISSING', `No daily rate in ${currency} for ${code}. Set it in CAB Profile → Pricing or enter a daily rate on the quotation.`)
  }
  return { currency, taxRate, rates }
}

/** Calculate the days and fees of a quotation. Throws AuditTimeError for input that cannot be priced. */
export function draftQuotation(args: {
  standards: string[]
  branches: DraftBranch[]
  certificates?: DraftCertificate[]
  /** Name and role recorded with a classification override (demo user). */
  actor?: { name: string | null; role: string | null }
  fallbackEmployees: number
  requestType?: string | null
  payload: QuotationCalculationPayload
  pricing: CabPricingConfig[]
}): QuotationDraft {
  const { standards, branches, certificates = [], actor = { name: null, role: null }, fallbackEmployees, requestType, payload, pricing } = args
  const employees = branches.reduce((sum, b) => sum + (b.employeesInScope ?? 0), 0) || fallbackEmployees
  if (standards.includes('ISO_22000') && (!payload.fsmsInputs?.foodCategory || payload.fsmsInputs.studies == null)) {
    throw new AuditTimeError('FOOD_INPUTS_REQUIRED', 'Food category and number of HACCP studies (fsmsInputs.foodCategory, fsmsInputs.studies) are required for standard "ISO_22000".')
  }
  const complexityOf = (code: string) => {
    for (const [key, value] of Object.entries(payload.complexities ?? {})) if ((canonicalStandardCode(key) ?? key) === code) return value
    return null
  }
  const multiSite = payload.multiSite?.enabled
    ? {
        enabled: true,
        sampling: payload.multiSite.sampling !== false,
        siteReductionPercent: payload.multiSite.siteReductionPercent ?? 0,
        centralReductionPercent: payload.multiSite.centralReductionPercent ?? 0,
        ...(payload.multiSite.eligibility ? { eligibility: payload.multiSite.eligibility } : {}),
        systemEffective: payload.multiSite.systemEffective !== false,
        additionalSampleSites: payload.multiSite.additionalSampleSites ?? 0,
        additionalSampleReason: payload.multiSite.additionalSampleReason ?? null,
        sites: (payload.multiSite.sites?.length
          ? payload.multiSite.sites
          : branches.filter((b) => (b.employeesInScope ?? 0) > 0).map(siteOfBranch)
        ).map((s) => ({ ...s, name: s.name ?? null, isCentral: Boolean(s.isCentral), standards: (s.standards ?? []).map((code) => canonicalStandardCode(code) ?? code) })),
      }
    : null
  const sameCode = (code: string) => (value: { standardCode: string }) => (canonicalStandardCode(value.standardCode) ?? value.standardCode) === code
  const certificateCodes = (code: string) =>
    certificates.filter((c) => canonicalStandardCode(`${c.certificateCode ?? ''} ${c.certificateName ?? ''}`) === code).flatMap(iafCodesOf)
  const overrideAt = new Date().toISOString()
  const standardInputs = standards.map((code) => {
    const override = (payload.classificationOverrides ?? []).find(sameCode(code))
    const special = (payload.specialCases ?? []).find(sameCode(code))
    return {
    standardCode: code,
    complexity: complexityOf(code),
    iafCodes: certificateCodes(code),
    classificationOverride: override ? { category: override.category, justification: override.justification, by: { userId: null, name: actor.name, role: actor.role }, at: overrideAt } : null,
    specialCase: special ? { days: Number(special.days), justification: special.justification } : null,
    food: code === 'ISO_22000' && payload.fsmsInputs
      ? { category: payload.fsmsInputs.foodCategory, studies: Number(payload.fsmsInputs.studies), fteEmployees: payload.fsmsInputs.fteEmployees ?? null }
      : undefined,
    adjustments: (payload.adjustments ?? [])
      .filter((a) => (canonicalStandardCode(a.standardCode) ?? a.standardCode) === code)
      .map(({ direction, percent, reason }) => ({ direction, percent, reason })),
    }
  })
  const cycleType = cycleTypeOf(requestType, payload.cycleType)
  const breakdown = calculateAuditTime({
    cycleType,
    employees,
    standards: standardInputs,
    stage1SharePercent: payload.stage1SharePercent,
    integrationLevelPercent: payload.integrationLevelPercent ?? 0,
    multiSite,
    remoteSharePercent: payload.remoteSharePercent ?? 0,
  })
  const { currency, taxRate, rates } = resolvePricing(pricing, payload, standards)

  const events: QuotationDraftEvent[] = []
  const perStandard: QuotationPreview['standards'] = breakdown.standards.map((s) => {
    const rate = rates[s.standardCode]
    s.stages.forEach((stage, index) => {
      events.push({ standardCode: s.standardCode, auditEventType: stage.stage, sequenceOrder: index + 1, days: stage.days, dailyRate: rate.dailyRate, fee: cents(stage.days * rate.dailyRate) })
    })
    const totalFee = s.stages.reduce((sum, stage) => sum + cents(stage.days * rate.dailyRate), 0)
    return {
      standardCode: s.standardCode,
      standardName: s.standardCode.replace('_', ' '),
      dailyRate: rate.dailyRate.toFixed(2),
      rateSource: rate.source,
      totalDays: s.totalDays.toFixed(2),
      totalFee: totalFee.toFixed(2),
      stages: s.stages.map((stage) => ({ stage: stage.stage, days: stage.days.toFixed(2), fee: cents(stage.days * rate.dailyRate).toFixed(2) })),
    }
  })
  const totalDays = events.reduce((sum, e) => sum + e.days, 0)
  const totalFee = cents(events.reduce((sum, e) => sum + e.fee, 0))
  const inputs: QuotationCalculationInputs = {
    cycleType,
    employees,
    stage1SharePercent: breakdown.stage1SharePercent,
    integrationLevelPercent: payload.integrationLevelPercent ?? 0,
    remoteSharePercent: payload.remoteSharePercent ?? 0,
    multiSite,
    standards: breakdown.standards.map((s) => {
      const source = standardInputs.find((i) => i.standardCode === s.standardCode)
      return {
        standardCode: s.standardCode,
        complexity: s.complexity,
        iafCodes: source?.iafCodes ?? [],
        classification: s.classification ? { suggested: s.classification.suggested, category: s.classification.category, source: s.classification.source } : null,
        classificationOverride: s.classification?.override ?? null,
        specialCase: s.specialCase ?? null,
        food: source?.food ?? null,
        adjustments: s.adjustments,
      }
    }),
    currency,
    dailyRate: payload.dailyRate ?? null,
    standardRates: Object.entries(Object.fromEntries((payload.standardRates ?? []).map((r) => [canonicalStandardCode(r.standardCode) ?? r.standardCode, r.dailyRate])))
      .map(([standardCode, dailyRate]) => ({ standardCode, dailyRate })),
  }
  return {
    breakdown,
    inputs,
    currency,
    taxRate,
    employees,
    perStandard,
    events,
    totalDays,
    totalFee,
    warnings: breakdown.warnings.map((w) => ({ type: 'CALCULATION_WARNING', ...w })),
    classificationRecords: breakdown.standards.flatMap((s) => {
      const o = s.classification?.source === 'OVERRIDE' ? s.classification.override : null
      return o ? [{ standardCode: s.standardCode, fromCategory: o.from, toCategory: o.to, justification: o.justification, lowered: o.lowered, changedByName: actor.name, changedByRole: actor.role }] : []
    }),
  }
}

/**
 * Calculation inputs of a stored quotation as a request payload (the backend's
 * quotation.service.js `optionsFromInputs`): a recalculation without new inputs reuses them and
 * reads the sites again from the application.
 */
export function payloadFromInputs(inputs: QuotationCalculationInputs | null | undefined): QuotationCalculationPayload {
  if (!inputs) return {}
  const standards = inputs.standards ?? []
  const food = standards.find((s) => s.food)?.food ?? null
  const complexities = Object.fromEntries(standards.filter((s) => s.complexity && s.classification?.source !== 'SUGGESTED' && s.classification?.source !== 'OVERRIDE').map((s) => [s.standardCode, s.complexity as string]))
  return {
    cycleType: inputs.cycleType,
    stage1SharePercent: inputs.stage1SharePercent,
    integrationLevelPercent: inputs.integrationLevelPercent ?? 0,
    remoteSharePercent: inputs.remoteSharePercent ?? 0,
    ...(inputs.multiSite?.enabled ? { multiSite: { ...inputs.multiSite, sites: undefined } } : {}),
    currency: inputs.currency,
    ...(inputs.dailyRate != null ? { dailyRate: Number(inputs.dailyRate) } : {}),
    standardRates: inputs.standardRates ?? [],
    adjustments: standards.flatMap((s) => (s.adjustments ?? []).map((a) => ({ ...a, standardCode: s.standardCode }))),
    ...(Object.keys(complexities).length ? { complexities } : {}),
    classificationOverrides: standards
      .filter((s) => s.classificationOverride?.to)
      .map((s) => ({ standardCode: s.standardCode, category: s.classificationOverride!.to, justification: s.classificationOverride!.justification })),
    specialCases: standards.filter((s) => s.specialCase).map((s) => ({ standardCode: s.standardCode, ...s.specialCase! })),
    ...(food ? { fsmsInputs: { foodCategory: food.category, studies: food.studies, ...(food.fteEmployees != null ? { fteEmployees: food.fteEmployees } : {}) } } : {}),
  }
}
