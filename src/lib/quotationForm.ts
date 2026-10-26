// Pure input rules for the CAB quotation editor. Days and prices are computed by the API
// (the demo uses the same calculator from src/lib/auditTime).
import type { EligibilityInputKey } from '@/lib/auditTime/rules'
import type { SiteInput } from '@/lib/auditTime/calculator'
import { normaliseIafCode } from '@/lib/auditTime/classification'

export const COMPLEXITY_OPTIONS: Record<string, string[]> = {
  ISO_14001: ['HIGH', 'MEDIUM', 'LOW', 'LIMITED', 'SPECIAL'],
  ISO_45001: ['HIGH', 'MEDIUM', 'LOW'],
  ISO_50001: ['HIGH', 'MEDIUM', 'LOW'],
}
export const FOOD_CATEGORIES = ['AI', 'AII', 'BI', 'BII', 'BIII', 'CO', 'CI', 'CII', 'CIII', 'CIV', 'D', 'E', 'FI', 'FII', 'G', 'H', 'I', 'J', 'K']
export const CYCLE_TYPE_OPTIONS = ['INITIAL', 'RECERTIFICATION', 'TRANSFER'] as const

export interface QuotationChargeInput { name: string; cost: string }

/** Canonical code (ISO_9001 …) of a certificate code or name such as "ISO 9001:2015" or "ISO/IEC 27001". */
export function canonicalStandardCode(value: string | null | undefined): string | null {
  const match = /\b(9001|14001|45001|22000|13485|27001|50001)\b/.exec(value ?? '')
  return match ? `ISO_${match[1]}` : null
}

/** ISO standards present on the application, as canonical codes. */
export function standardCodesOf(application: { certificates?: { certificateName?: string; certificateCode?: string }[] }): string[] {
  const text = (application.certificates ?? []).map((c) => `${c.certificateName ?? ''} ${c.certificateCode ?? ''}`).join(' ')
  return [...new Set([...text.matchAll(/\b(9001|14001|45001|22000|13485|27001|50001)\b/g)].map((match) => `ISO_${match[1]}`))]
}

/** Display form of a canonical code: ISO_9001 → ISO 9001. */
export const standardLabelOf = (code: string) => code.replace('_', ' ')

/** Standards that need a complexity level before quoting. */
export const complexityStandards = (standards: string[]) => standards.filter((code) => code in COMPLEXITY_OPTIONS)

/** An extra charge needs a name and a non-negative amount. */
export const isValidQuotationCharge = (row: QuotationChargeInput) =>
  Boolean(row.name.trim()) && row.cost.trim() !== '' && Number(row.cost) >= 0

/** IAF MD 5 factor row of the editor. */
export interface AdjustmentInput { standardCode: string; direction: 'INCREASE' | 'DECREASE'; percent: string; reason: string }

/** A factor needs a standard, a percentage in (0, 100] and a reason of at least 3 characters. */
export const isValidAdjustment = (row: AdjustmentInput) =>
  Boolean(row.standardCode) && row.percent.trim() !== '' && Number(row.percent) > 0 && Number(row.percent) <= 100 && row.reason.trim().length >= 3

/** A percentage field: empty (= default) or a number in [min, max]. */
export const isValidPercent = (value: string, min = 0, max = 100) =>
  value.trim() === '' || (Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max)

/** An override needs half-day steps from 0 to 365 and a reason of at least 3 characters. */
export const isValidDayOverride = (days: string, reason: string) =>
  days.trim() !== '' && Number(days) >= 0 && Number(days) <= 365 && Number.isInteger(Number(days) * 2) && reason.trim().length >= 3

export interface QuotationFormInput {
  today: string
  offerEnd: string
  rate: string
  auditorCount: number
  travel: string
  charges: QuotationChargeInput[]
  standards: string[]
  complexities: Record<string, string>
  foodCategory: string
  studies: string
  /** Optional audit-time inputs; omitted fields are valid. */
  adjustments?: AdjustmentInput[]
  integrationLevel?: string
  remoteShare?: string
  stage1Share?: string
  siteReduction?: string
  centralReduction?: string
  standardRates?: Record<string, string>
  /** Category suggested from the client's IAF codes, per standard (audit-time context). */
  suggested?: Record<string, string | null>
  classificationOverrides?: Record<string, ClassificationOverrideState>
  specialCases?: Record<string, SpecialCaseState>
  /** Multi-site register rows (null = the application branches). */
  sites?: SiteRow[] | null
  additionalSampleSites?: string
  additionalSampleReason?: string
}

/** Override of a suggested category: a category and its justification (10 characters or more). */
export interface ClassificationOverrideState { category: string; justification: string }
/** ISO 14001 Special case: individual audit days and justification. */
export interface SpecialCaseState { days: string; justification: string }

export const JUSTIFICATION_MIN = 10

/** An override is complete when it has a category and a justification of at least 10 characters. */
export const isValidOverride = (row: ClassificationOverrideState | undefined) =>
  !row?.category || row.justification.trim().length >= JUSTIFICATION_MIN

/** Category the calculation will use: override, else suggestion from the codes, else the manual choice. */
export function effectiveCategory(code: string, input: { complexities: Record<string, string>; suggested?: Record<string, string | null>; classificationOverrides?: Record<string, ClassificationOverrideState> }) {
  return input.classificationOverrides?.[code]?.category || input.suggested?.[code] || input.complexities[code] || null
}

const isValidSpecial = (row: SpecialCaseState | undefined) =>
  Boolean(row) && Number(row!.days) >= 0.5 && Number(row!.days) <= 365 && Number.isInteger(Number(row!.days) * 2) && row!.justification.trim().length >= JUSTIFICATION_MIN

/** Whether each editor step (1: offer, rate & audit time, 2: audit team, 3: expenses) is ready. */
export function quotationStepValidity(input: QuotationFormInput): [boolean, boolean, boolean] {
  const { studies } = input
  const standardsOk =
    complexityStandards(input.standards).every((code) => effectiveCategory(code, input)) &&
    Object.values(input.classificationOverrides ?? {}).every(isValidOverride) &&
    (!input.standards.includes('ISO_14001') || effectiveCategory('ISO_14001', input) !== 'SPECIAL' || isValidSpecial(input.specialCases?.ISO_14001)) &&
    (input.sites ?? []).every(isValidSiteRow) &&
    (Number(input.additionalSampleSites || 0) === 0 || (input.additionalSampleReason ?? '').trim().length >= 3) &&
    (!input.standards.includes('ISO_22000') || (input.foodCategory && Number.isInteger(Number(studies)) && Number(studies) >= 1))
  const stage1Share = (input.stage1Share ?? '').trim()
  const auditTimeOk =
    (input.adjustments ?? []).every(isValidAdjustment) &&
    isValidPercent(input.integrationLevel ?? '') &&
    isValidPercent(input.remoteShare ?? '') &&
    isValidPercent(input.siteReduction ?? '') &&
    isValidPercent(input.centralReduction ?? '') &&
    (stage1Share === '' || (Number(stage1Share) > 0 && Number(stage1Share) < 100))
  const ratesOk = Object.values(input.standardRates ?? {}).every((value) => value.trim() === '' || Number(value) > 0)
  return [
    Boolean(input.offerEnd && input.offerEnd >= input.today && Number(input.rate) > 0 && standardsOk && auditTimeOk && ratesOk),
    input.auditorCount > 0,
    input.travel.trim() !== '' && Number(input.travel) >= 0 && input.charges.every(isValidQuotationCharge),
  ]
}

// ── Audit-time calculation inputs of the editor ─────────────────────────────

export type CycleTypeInput = '' | (typeof CYCLE_TYPE_OPTIONS)[number]

/** Editor state of the audit-time and pricing inputs ('' = API default). */
export interface CalculationFormState {
  cycleType: CycleTypeInput
  currency: string
  rate: string
  standardRates: Record<string, string>
  complexities: Record<string, string>
  foodCategory: string
  studies: string
  fte: string
  integrationLevel: string
  remoteShare: string
  stage1Share: string
  multiSite: boolean
  sampling: boolean
  /** Index (as text) of the central-function branch among the sites. */
  centralSite: string
  siteReduction: string
  centralReduction: string
  adjustments: Array<AdjustmentInput & { id: string }>
  /** Category suggested from the IAF codes per standard (filled from the audit-time context). */
  suggested: Record<string, string | null>
  classificationOverrides: Record<string, ClassificationOverrideState>
  specialCases: Record<string, SpecialCaseState>
  /** IAF MD 1 eligibility answers (true met, false not met, null not confirmed). */
  eligibility: Partial<Record<EligibilityInputKey, boolean | null>>
  /** IAF MD 1 §6.1.3.3: the management system proved effective (recertification sample 0.8√x). */
  systemEffective: boolean
  additionalSampleSites: string
  additionalSampleReason: string
  /** Multi-site register edited in the quotation (null = the application branches). */
  sites: SiteRow[] | null
}

/** One editable row of the multi-site register. */
export interface SiteRow {
  key: string
  id: string | null
  name: string
  location: string
  activities: string
  employees: string
  temporaryEmployees: string
  shifts: string
  iafCodes: string[]
  standards: string[]
  isCentral: boolean
  siteType: 'PERMANENT' | 'TEMPORARY'
  sameProcesses: boolean
  isNew: boolean
  auditIndividually: boolean
  individualReason: string
}

const whole = (value: string, min = 0) => value.trim() === '' || (/^\d{1,6}$/.test(value.trim()) && Number(value) >= min)

/** A site needs a name and a whole number of effective personnel of at least 1. */
export const isValidSiteRow = (row: SiteRow) =>
  row.name.trim().length > 0 && row.employees.trim() !== '' && whole(row.employees, 1) && whole(row.temporaryEmployees) && whole(row.shifts) &&
  (!row.auditIndividually || row.individualReason.trim().length >= 3)

/** Register row from an API / demo site. */
export function siteRowOf(site: SiteInput, index: number): SiteRow {
  return {
    key: site.id ?? `site-${index}-${site.name ?? ''}`,
    id: site.id ?? null,
    name: site.name ?? '',
    location: site.location ?? '',
    activities: site.activities ?? '',
    employees: site.employees ? String(site.employees) : '',
    temporaryEmployees: site.temporaryEmployees != null ? String(site.temporaryEmployees) : '',
    shifts: site.shifts != null ? String(site.shifts) : '',
    iafCodes: [...new Set((site.iafCodes ?? []).map(normaliseIafCode).filter((code): code is string => Boolean(code)))],
    standards: site.standards ?? [],
    isCentral: Boolean(site.isCentral),
    siteType: site.siteType === 'TEMPORARY' ? 'TEMPORARY' : 'PERMANENT',
    sameProcesses: site.sameProcesses !== false,
    isNew: Boolean(site.isNew),
    auditIndividually: Boolean(site.auditIndividually),
    individualReason: site.individualReason ?? '',
  }
}

/** API site of a register row. */
export function siteOfRow(row: SiteRow): SiteInput {
  const count = (value: string) => (value.trim() === '' ? null : Number(value))
  return {
    ...(row.id ? { id: row.id } : {}),
    name: row.name.trim(),
    employees: Number(row.employees),
    isCentral: row.isCentral,
    siteType: row.siteType,
    ...(row.location.trim() ? { location: row.location.trim() } : {}),
    ...(row.activities.trim() ? { activities: row.activities.trim() } : {}),
    iafCodes: row.iafCodes,
    standards: row.standards,
    sameProcesses: row.sameProcesses,
    isNew: row.isNew,
    auditIndividually: row.auditIndividually,
    ...(row.auditIndividually && row.individualReason.trim() ? { individualReason: row.individualReason.trim() } : {}),
    ...(count(row.temporaryEmployees) != null ? { temporaryEmployees: count(row.temporaryEmployees) } : {}),
    ...(count(row.shifts) != null ? { shifts: count(row.shifts) } : {}),
  }
}

export interface CalculationBranch { branchName?: string | null; employeesInScope?: number | null; centralManagement?: boolean | null }

/** Branches with personnel in scope: the sites of a multi-site calculation. */
export const sitesOf = (branches: CalculationBranch[] = []) => branches.filter((b) => (b.employeesInScope ?? 0) > 0)

export function emptyCalculationForm(pricing: { currency: string; dailyRate: string } | null, branches: CalculationBranch[] = []): CalculationFormState {
  const sites = sitesOf(branches)
  const central = Math.max(0, sites.findIndex((b) => b.centralManagement))
  return {
    cycleType: '', currency: pricing?.currency ?? '', rate: pricing && Number(pricing.dailyRate) > 0 ? String(Number(pricing.dailyRate)) : '',
    standardRates: {}, complexities: {}, foodCategory: '', studies: '1', fte: '', integrationLevel: '', remoteShare: '', stage1Share: '',
    multiSite: false, sampling: true, centralSite: String(central), siteReduction: '', centralReduction: '', adjustments: [],
    suggested: {}, classificationOverrides: {}, specialCases: {}, eligibility: {}, systemEffective: true,
    additionalSampleSites: '', additionalSampleReason: '', sites: null,
  }
}

const optionalNumber = (value: string) => (value.trim() === '' ? undefined : Number(value))

/** Request body fields (preview and create) for the editor state. */
export function calculationPayload(state: CalculationFormState, standards: string[], branches: CalculationBranch[] = []) {
  const withComplexity = complexityStandards(standards)
  const sites = sitesOf(branches)
  const overrides = Object.entries(state.classificationOverrides)
    .filter(([code, row]) => standards.includes(code) && row.category && row.category !== state.suggested[code] && row.justification.trim().length >= JUSTIFICATION_MIN)
    .map(([standardCode, row]) => ({ standardCode, category: row.category, justification: row.justification.trim() }))
  const specialCases = standards.includes('ISO_14001') && effectiveCategory('ISO_14001', state) === 'SPECIAL' && state.specialCases.ISO_14001
    ? [{ standardCode: 'ISO_14001', days: Number(state.specialCases.ISO_14001.days), justification: state.specialCases.ISO_14001.justification.trim() }]
    : []
  const rates = Object.entries(state.standardRates)
    .filter(([code, value]) => standards.includes(code) && value.trim() !== '' && Number(value) > 0)
    .map(([standardCode, value]) => ({ standardCode, dailyRate: Number(value) }))
  return {
    ...(state.cycleType ? { cycleType: state.cycleType } : {}),
    ...(state.currency ? { currency: state.currency } : {}),
    ...(Number(state.rate) > 0 ? { dailyRate: Number(state.rate) } : {}),
    ...(rates.length ? { standardRates: rates } : {}),
    ...(withComplexity.some((code) => state.complexities[code] && !state.suggested[code])
      ? { complexities: Object.fromEntries(withComplexity.filter((code) => state.complexities[code] && !state.suggested[code]).map((code) => [code, state.complexities[code]])) }
      : {}),
    ...(overrides.length ? { classificationOverrides: overrides } : {}),
    ...(specialCases.length ? { specialCases } : {}),
    ...(standards.includes('ISO_22000') && state.foodCategory
      ? { fsmsInputs: { foodCategory: state.foodCategory, studies: Number(state.studies), ...(state.fte.trim() ? { fteEmployees: Number(state.fte) } : {}) } }
      : {}),
    ...(standards.length > 1 && optionalNumber(state.integrationLevel) ? { integrationLevelPercent: optionalNumber(state.integrationLevel) } : {}),
    ...(optionalNumber(state.remoteShare) ? { remoteSharePercent: optionalNumber(state.remoteShare) } : {}),
    ...(optionalNumber(state.stage1Share) !== undefined ? { stage1SharePercent: optionalNumber(state.stage1Share) } : {}),
    ...(state.multiSite && (state.sites ? state.sites.length : sites.length) > 1
      ? {
          multiSite: {
            enabled: true,
            sampling: state.sampling,
            siteReductionPercent: optionalNumber(state.siteReduction) ?? 0,
            centralReductionPercent: optionalNumber(state.centralReduction) ?? 0,
            ...(state.eligibility && Object.keys(state.eligibility).length ? { eligibility: state.eligibility } : {}),
            ...(state.systemEffective === false ? { systemEffective: false } : {}),
            ...(Number(state.additionalSampleSites) > 0 ? { additionalSampleSites: Number(state.additionalSampleSites), additionalSampleReason: state.additionalSampleReason.trim() } : {}),
            sites: state.sites
              ? state.sites.map(siteOfRow)
              : sites.map((b, index) => ({ name: b.branchName || `Site ${index + 1}`, employees: b.employeesInScope ?? 0, isCentral: String(index) === state.centralSite })),
          },
        }
      : {}),
    ...(state.adjustments.length
      ? { adjustments: state.adjustments.map((a) => ({ standardCode: a.standardCode, direction: a.direction, percent: Number(a.percent), reason: a.reason.trim() })) }
      : {}),
  }
}

/** Whether the calculation inputs are complete enough to preview / create. */
/** Audit-time fields of the editor state for quotationStepValidity. */
export function calculationStepInput(state: CalculationFormState) {
  return {
    complexities: state.complexities, foodCategory: state.foodCategory, studies: state.studies, adjustments: state.adjustments,
    integrationLevel: state.integrationLevel, remoteShare: state.remoteShare, stage1Share: state.stage1Share,
    siteReduction: state.siteReduction, centralReduction: state.centralReduction, standardRates: state.standardRates,
    suggested: state.suggested, classificationOverrides: state.classificationOverrides, specialCases: state.specialCases,
    sites: state.multiSite ? state.sites : null,
    additionalSampleSites: state.multiSite ? state.additionalSampleSites : '', additionalSampleReason: state.additionalSampleReason,
  }
}

export function calculationReady(state: CalculationFormState, standards: string[]) {
  return quotationStepValidity({
    today: '0000-00-00', offerEnd: '9999-12-31', rate: state.rate, auditorCount: 1, travel: '0', charges: [], standards,
    ...calculationStepInput(state),
  })[0]
}
