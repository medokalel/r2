/**
 * Audit-time (man-day) calculator: TypeScript copy of the backend's pure calculator
 * (src/modules/audit-engine/audit-time.calculator.js). The demo store prices quotations with it,
 * so preview figures match the API. Same algorithm, same rounding, same breakdown shape; the
 * worked examples of the backend's docs/AUDIT_TIME.md are pinned by tests/audit-time.test.mjs.
 *
 * Order per standard: classification (IAF MD 5 Annex A / B / C, highest category of the IAF codes
 * or a justified override) → base time (table row, extrapolated above 10,700; ISO 22003-1 formula
 * for ISO 22000; individual time for an ISO 14001 Special case) → IAF MD 1:2023 multi-site
 * (eligibility per criterion, sampled group ⌈c·√x⌉ with mandatory new sites, individually audited
 * sites with 30 % per surveillance, central function at every audit, per-site time from each
 * site's personnel) → IAF MD 5 factors (net reduction ≤ 30 %) → IAF MD 11 integration reduction
 * (20 % × level) → stages (Stage 1 / Stage 2 split, surveillance 1/3, recertification 2/3,
 * minimum 1 day, rounded to 0.5) → on-site ≥ 80 % and remote share per stage.
 */
import {
  EMS_1, FOOD_CATEGORIES_TABLE, FOOD_TFTE, ISO27006_C1, ISO50003_A3, ISO50003_A4, MD9_D1, OHSMS_1, QMS_1,
  type BandRow, type CycleRow,
} from '@/lib/auditTime/tables'
import {
  ACCREDITATION_FRAMEWORK_NOTE, AUDIT_TIME_REFERENCES, AUDIT_TIME_RULES, CYCLE_EVENTS, CYCLE_TYPES, MD1_ELIGIBILITY_CRITERIA,
  type AuditStage, type AuditTimeReference, type AuditTimeRules, type CycleType, type EligibilityInputKey,
} from '@/lib/auditTime/rules'
import { CATEGORY_RANK, type MappingConfirmation, type SectorCategory } from '@/lib/auditTime/sectorCategories'
import {
  CLASSIFICATION_STANDARDS, ClassificationError, JUSTIFICATION_MIN_LENGTH, classificationEffect, classifyStandard, normaliseIafCode, resolveClassification,
  type ClassificationBasis, type ClassificationEffect, type ClassificationOverrideInput, type ClassificationOverrideRecord,
  type ClassificationRule, type ClassificationSource, type ClassifiedCode,
} from '@/lib/auditTime/classification'

// ── Types (also the API's breakdown contract) ───────────────────────────────

export type AdjustmentDirection = 'INCREASE' | 'DECREASE'
export interface AuditTimeAdjustment { direction: AdjustmentDirection; percent: number; reason: string }
export interface FoodInputs { category: string; studies: number; fteEmployees?: number | null }
export type SiteType = 'PERMANENT' | 'TEMPORARY'
export interface SiteInput {
  id?: string | null
  name?: string | null
  employees: number
  isCentral?: boolean
  siteType?: SiteType
  location?: string | null
  activities?: string | null
  iafCodes?: string[]
  /** Standards that apply at the site (empty = all). */
  standards?: string[]
  /** false = different processes / activities: audited individually. */
  sameProcesses?: boolean
  isNew?: boolean
  auditIndividually?: boolean
  individualReason?: string | null
  permanentEmployees?: number | null
  temporaryEmployees?: number | null
  shifts?: number | null
}
export type EligibilityAnswers = Partial<Record<EligibilityInputKey, boolean | null>>
export interface MultiSiteInput {
  enabled?: boolean
  sampling?: boolean
  siteReductionPercent?: number
  centralReductionPercent?: number
  eligibility?: EligibilityAnswers | null
  systemEffective?: boolean
  additionalSampleSites?: number
  additionalSampleReason?: string | null
  sites?: SiteInput[]
}
export interface SpecialCaseInput { days: number; justification: string }
export interface StandardInput {
  standardCode: string
  complexity?: string | null
  iafCodes?: string[]
  classificationOverride?: ClassificationOverrideInput | null
  specialCase?: SpecialCaseInput | null
  food?: FoodInputs
  adjustments?: AuditTimeAdjustment[]
}
export interface AuditTimeInput {
  cycleType?: CycleType
  employees: number
  standards: StandardInput[]
  stage1SharePercent?: number
  integrationLevelPercent?: number
  multiSite?: MultiSiteInput | null
  remoteSharePercent?: number
}

export type AuditTimeStepCode =
  | 'CLASSIFICATION' | 'TABLE' | 'TABLE_EXTRAPOLATED' | 'SPECIAL_CASE' | 'FOOD_FORMULA' | 'MULTI_SITE' | 'SAMPLE_INCREASE'
  | 'SITE_REDUCTION' | 'CENTRAL_REDUCTION' | 'ADJUSTMENT' | 'REDUCTION_CAP' | 'ADJUSTED' | 'IMS_REDUCTION' | 'ROUNDED_INITIAL'
  | 'STAGE_SPLIT' | 'RATIO' | 'CYCLE_TABLE' | 'SITES_VISITED' | 'ON_SITE' | 'REMOTE'
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- step params differ per step code
export type StepParams = Record<string, any>
export interface AuditTimeStep { code: AuditTimeStepCode; reference: string; params: StepParams; text: string; site?: string | null }

export interface AuditTimeStageBreakdown {
  stage: AuditStage
  days: number
  rawDays: number
  ratio: number | null
  minimumApplied: boolean
  sitesVisited: number | null
  /** Names of the sites visited (multi-site only). */
  siteNames?: string[] | null
  onSiteMinDays: number
  offSiteMaxDays: number
  remoteDays: number
  steps: AuditTimeStep[]
}

export type VisitKind = 'INITIAL' | 'SURVEILLANCE_1' | 'SURVEILLANCE_2' | 'RECERTIFICATION'
export type SiteGroup = 'CENTRAL' | 'SAMPLED' | 'INDIVIDUAL'
export type SiteGroupReason = 'CENTRAL_FUNCTION' | 'NOT_ELIGIBLE' | 'SAMPLING_NOT_REQUESTED' | 'DIFFERENT_PROCESSES' | 'INDIVIDUAL_REQUESTED' | 'HIGHER_RISK'

export interface MultiSiteUnit {
  id?: string | null
  name: string
  employees: number
  isCentral: boolean
  siteType?: SiteType
  location?: string | null
  iafCodes?: string[]
  category?: string | null
  isNew?: boolean
  group?: SiteGroup
  reasons?: SiteGroupReason[]
  mandatory?: VisitKind[]
  tableDays: number
  reductionPercent: number
  initialDays: number
  surveillanceDays?: number
  recertificationDays?: number
  visited: { INITIAL: boolean; SURVEILLANCE: boolean; RECERTIFICATION: boolean; SURVEILLANCE_1?: boolean; SURVEILLANCE_2?: boolean }
}
export interface MultiSiteSummary {
  sites: number
  centralFunction: boolean
  sampling: boolean
  sampleSizes: { INITIAL: number; SURVEILLANCE: number; RECERTIFICATION: number } | null
  /** ⌈c·√x⌉ before mandatory sites were added (IAF MD 1 §6.1.3.3). */
  sampleBase?: { INITIAL: number; SURVEILLANCE: number; RECERTIFICATION: number } | null
  /** x: sites under sampling, central function included. */
  sampledGroup?: number
  individualGroup?: number
  individualSurveillanceSites?: number
  groupCategory?: string | null
  additionalSampleSites?: number
  systemEffective?: boolean
  siteReductionPercent: number
  centralReductionPercent: number
  units: MultiSiteUnit[]
}

export interface StandardClassification {
  basis: ClassificationBasis
  table: { document: string; edition: string; clause: string } | null
  rule: ClassificationRule
  suggested: string | null
  category: string | null
  source: ClassificationSource
  override: ClassificationOverrideRecord | null
  codes: ClassifiedCode[]
  unknownCodes: string[]
  unmappedCodes: string[]
  unverifiedCodes: string[]
  /** Owner confirmation of the IAF code to MD 5 mapping (25 October 2026); absent in older snapshots. */
  confirmation?: MappingConfirmation | null
  categories: string[] | null
  effect: ClassificationEffect | null
}

export interface AuditTimeStandardBreakdown {
  standardCode: string
  complexity: string | null
  /** Absent on quotations calculated before the classification existed. */
  classification?: StandardClassification | null
  specialCase?: SpecialCaseInput | null
  method: 'TABLE' | 'TABLE_EXTRAPOLATED' | 'FOOD_FORMULA' | 'MULTI_SITE' | 'SPECIAL_CASE'
  baseDays: number
  adjustments: AuditTimeAdjustment[]
  requestedAdjustmentPercent: number
  adjustmentPercent: number
  reductionCapApplied: boolean
  imsReductionPercent: number
  multiSite: MultiSiteSummary | null
  initialAuditDays: number
  surveillanceDays: number
  surveillance2Days?: number
  recertificationDays: number
  nextCycleRecertificationDays: number | null
  steps: AuditTimeStep[]
  stages: AuditTimeStageBreakdown[]
  totalDays: number
}

export interface AuditTimeWarning { code: string; message: string; standardCode?: string; codes?: string[]; criteria?: string[] }

export type EligibilityStatus = 'MET' | 'NOT_MET' | 'NOT_CONFIRMED' | 'DECLARED'
export interface MultiSiteEligibility {
  eligible: boolean
  samplingRequested: boolean
  samplingApplied: boolean
  criteria: Array<{ key: string; clause: string; status: EligibilityStatus }>
  blocking: string[]
}

export interface ThreeYearCycle { stage1: number; stage2: number; surveillance1: number; surveillance2: number; recertification: number; total: number }

export interface AuditTimeBreakdown {
  cycleType: CycleType
  employees: number
  stage1SharePercent: number
  remoteSharePercent: number
  ims: { applied: boolean; standardsCount: number; integrationLevelPercent: number; reductionPercent: number; maxReductionPercent: number }
  multiSite: { enabled: boolean; sampling: boolean; sites: number; centralFunction: boolean; eligibility?: MultiSiteEligibility } | null
  standards: AuditTimeStandardBreakdown[]
  totals: { days: number; byStage: Partial<Record<AuditStage, number>>; threeYearCycle?: ThreeYearCycle }
  rules: Record<string, unknown>
  references: Record<string, AuditTimeReference>
  warnings: AuditTimeWarning[]
  frameworkNote: string
}

// ── Errors and number helpers ────────────────────────────────────────────────

export class AuditTimeError extends Error {
  code: string
  params: Record<string, unknown>
  constructor(code: string, message: string, params: Record<string, unknown> = {}) {
    super(message)
    this.name = 'AuditTimeError'
    this.code = code
    this.params = params
  }
}

const EPS = 1e-9
/** Nearest half day, halves rounded up (1.25 → 1.5, 1.24 → 1.0). */
export const roundHalf = (value: number) => Math.round((value + EPS) * 2) / 2
/** Half day at or below the value. */
export const floorHalf = (value: number) => Math.floor((value + EPS) * 2) / 2
/** Two decimals, for display of unrounded intermediate values. */
export const round2 = (value: number) => Math.round((value + EPS) * 100) / 100

const isNum = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

// ── Standards ────────────────────────────────────────────────────────────────

interface StandardDef {
  table?: BandRow[]
  complexities: string[] | null
  reference: string
  cycleTable?: CycleRow[]
  food?: boolean
}

export const AUDIT_TIME_STANDARDS: Record<string, StandardDef> = {
  ISO_9001: { table: QMS_1, complexities: null, reference: 'MD5_QMS' },
  ISO_14001: { table: EMS_1, complexities: ['HIGH', 'MEDIUM', 'LOW', 'LIMITED', 'SPECIAL'], reference: 'MD5_EMS' },
  ISO_45001: { table: OHSMS_1, complexities: ['HIGH', 'MEDIUM', 'LOW'], reference: 'MD5_OHSMS' },
  ISO_13485: { table: MD9_D1, complexities: null, reference: 'MD9_TABLE' },
  ISO_27001: { table: ISO27006_C1, complexities: null, reference: 'ISO27006_TABLE' },
  ISO_50001: { table: ISO50003_A3, complexities: ['HIGH', 'MEDIUM', 'LOW'], reference: 'ISO50003_TABLE', cycleTable: ISO50003_A4 },
  ISO_22000: { food: true, complexities: null, reference: 'ISO22003_FOOD' },
}

/** Reference key of the sector table each IAF-code classification comes from. */
const CLASSIFICATION_REFERENCE: Record<string, string> = { QMS: 'MD5_QMS_RISK', EMS: 'MD5_EMS_COMPLEXITY', OHS: 'MD5_OHS_RISK' }

interface Extrapolation { lastRowMax: number; lastRowDays: number; bandWidth: number; stepDays: number; blocks: number }

/** Row of a banded table for `employees`, extrapolated above the last row. */
export function lookupBand<R extends BandRow>(rows: R[], employees: number, pick: (row: R) => number) {
  const row = rows.find((r) => employees >= r.minEmployees && employees <= r.maxEmployees)
  if (row) return { days: pick(row), band: { min: row.minEmployees, max: row.maxEmployees as number | null }, extrapolation: null as Extrapolation | null }
  const last = rows[rows.length - 1]
  const previous = rows[rows.length - 2]
  const width = last.maxEmployees - last.minEmployees + 1
  const step = pick(last) - pick(previous)
  const blocks = Math.ceil((employees - last.maxEmployees) / width)
  return {
    days: pick(last) + blocks * step,
    band: { min: last.maxEmployees + 1, max: null as number | null },
    extrapolation: { lastRowMax: last.maxEmployees, lastRowDays: pick(last), bandWidth: width, stepDays: step, blocks } as Extrapolation | null,
  }
}

/** ISO 22003-1 Annex B: Ds = TD + TH × (studies − 1) + TFTE. */
export function foodBaseDays({ category, studies, fteEmployees }: { category?: string; studies?: number; fteEmployees?: number | null }) {
  const key = typeof category === 'string' ? category.trim().toUpperCase() : ''
  const row = FOOD_CATEGORIES_TABLE[key]
  if (!row) throw new AuditTimeError('FOOD_CATEGORY_INVALID', `Food category "${category ?? ''}" is not an ISO 22003-1 category.`, { category: category ?? null })
  if (!Number.isInteger(studies) || (studies as number) < 1) {
    throw new AuditTimeError('HACCP_STUDIES_INVALID', 'The number of HACCP studies must be a whole number of at least 1.', { studies: studies ?? null })
  }
  if (!isNum(fteEmployees) || fteEmployees < 1) {
    throw new AuditTimeError('FTE_INVALID', 'FTE employees must be a number of at least 1.', { fteEmployees: fteEmployees ?? null })
  }
  const tfte = FOOD_TFTE.find((b) => fteEmployees >= b.minFTE && (b.maxFTE === null || fteEmployees <= b.maxFTE))!.tfte
  const n = studies as number
  return { category: key, td: row.td, th: row.th, studies: n, fteEmployees, tfte, days: row.td + row.th * (n - 1) + tfte }
}

// ── Input normalisation ──────────────────────────────────────────────────────

const percentIn = (value: number | undefined | null, code: string, label: string, max = 100) => {
  const n = value == null ? 0 : value
  if (!isNum(n) || n < 0 || n > max) throw new AuditTimeError(code, `${label} must be between 0 and ${max} %.`, { value: value ?? null })
  return n
}

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
const optionalCount = (value: unknown) => (Number.isInteger(value) && (value as number) >= 0 ? (value as number) : null)

interface NormalisedSite {
  index: number
  id: string | null
  name: string
  employees: number
  isCentral: boolean
  siteType: SiteType
  location: string | null
  activities: string | null
  iafCodes: string[]
  standards: string[]
  sameProcesses: boolean
  isNew: boolean
  auditIndividually: boolean
  individualReason: string | null
  permanentEmployees: number | null
  temporaryEmployees: number | null
  shifts: number | null
}
interface NormalisedMultiSite {
  sites: NormalisedSite[]
  sampling: boolean
  eligibilityInput: EligibilityAnswers | null
  systemEffective: boolean
  additionalSampleSites: number
  additionalSampleReason: string | null
  siteReductionRequested: number
  centralReductionRequested: number
}

function normaliseSites(multiSite: MultiSiteInput | null | undefined): NormalisedMultiSite | null {
  if (!multiSite || multiSite.enabled === false) return null
  const sites: NormalisedSite[] = (multiSite.sites ?? []).map((site, index) => {
    if (!isNum(site.employees) || site.employees < 1 || !Number.isInteger(site.employees)) {
      throw new AuditTimeError('SITE_EMPLOYEES_INVALID', `Site ${index + 1} needs a whole number of personnel of at least 1.`, { site: index + 1 })
    }
    const siteType: SiteType = site.siteType === 'TEMPORARY' ? 'TEMPORARY' : 'PERMANENT'
    return {
      index,
      id: site.id ?? null,
      name: site.name || `Site ${index + 1}`,
      employees: site.employees,
      isCentral: Boolean(site.isCentral) && siteType !== 'TEMPORARY',
      siteType,
      location: text(site.location) || null,
      activities: text(site.activities) || null,
      iafCodes: [...new Set((site.iafCodes ?? []).map(normaliseIafCode).filter((c): c is string => Boolean(c)))],
      standards: Array.isArray(site.standards) ? site.standards.filter(Boolean) : [],
      sameProcesses: site.sameProcesses !== false,
      isNew: Boolean(site.isNew),
      auditIndividually: Boolean(site.auditIndividually),
      individualReason: text(site.individualReason) || null,
      permanentEmployees: optionalCount(site.permanentEmployees),
      temporaryEmployees: optionalCount(site.temporaryEmployees),
      shifts: optionalCount(site.shifts),
    }
  })
  if (sites.length < 2) return null
  let centralSeen = false
  for (const site of sites) {
    if (site.isCentral && centralSeen) site.isCentral = false
    if (site.isCentral) centralSeen = true
  }
  const additionalSampleSites = multiSite.additionalSampleSites ?? 0
  if (!Number.isInteger(additionalSampleSites) || additionalSampleSites < 0) {
    throw new AuditTimeError('SAMPLE_INCREASE_INVALID', 'The risk-based sample increase must be a whole number of sites (0 or more).', { value: additionalSampleSites })
  }
  const additionalSampleReason = text(multiSite.additionalSampleReason)
  if (additionalSampleSites > 0 && additionalSampleReason.length < 3) {
    throw new AuditTimeError('SAMPLE_INCREASE_REASON_REQUIRED', 'A risk-based sample increase needs a reason (IAF MD 1 §6.1.3.5).')
  }
  return {
    sites,
    sampling: multiSite.sampling !== false,
    eligibilityInput: multiSite.eligibility && typeof multiSite.eligibility === 'object' ? multiSite.eligibility : null,
    systemEffective: multiSite.systemEffective !== false,
    additionalSampleSites,
    additionalSampleReason: additionalSampleReason || null,
    siteReductionRequested: percentIn(multiSite.siteReductionPercent, 'SITE_REDUCTION_INVALID', 'The per-site reduction'),
    centralReductionRequested: percentIn(multiSite.centralReductionPercent, 'CENTRAL_REDUCTION_INVALID', 'The central-function reduction'),
  }
}

function normaliseAdjustments(list: AuditTimeAdjustment[] = []): AuditTimeAdjustment[] {
  return list.map((item, index) => {
    if (item.direction !== 'INCREASE' && item.direction !== 'DECREASE') {
      throw new AuditTimeError('ADJUSTMENT_DIRECTION_INVALID', `Adjustment ${index + 1} must be INCREASE or DECREASE.`, { index: index + 1 })
    }
    if (!isNum(item.percent) || item.percent <= 0 || item.percent > 100) {
      throw new AuditTimeError('ADJUSTMENT_PERCENT_INVALID', `Adjustment ${index + 1} must be more than 0 and at most 100 %.`, { index: index + 1 })
    }
    const reason = typeof item.reason === 'string' ? item.reason.trim() : ''
    if (!reason) throw new AuditTimeError('ADJUSTMENT_REASON_REQUIRED', `Adjustment ${index + 1} needs a reason.`, { index: index + 1 })
    return { direction: item.direction, percent: item.percent, reason }
  })
}

// ── IAF MD 1 eligibility ─────────────────────────────────────────────────────

/** Evaluate the IAF MD 1 criteria; without answers, enabling sampling counts as DECLARED. */
export function evaluateMultiSiteEligibility(multiSite: Pick<NormalisedMultiSite, 'sites' | 'sampling' | 'eligibilityInput'>): MultiSiteEligibility {
  const hasCentral = multiSite.sites.some((s) => s.isCentral)
  const declared = !multiSite.eligibilityInput && multiSite.sampling
  const criteria = MD1_ELIGIBILITY_CRITERIA.map(({ key, input, clause }) => {
    let status: EligibilityStatus
    if (!input) status = hasCentral ? 'MET' : 'NOT_MET'
    else if (multiSite.eligibilityInput) {
      const value = multiSite.eligibilityInput[input]
      status = value === true ? 'MET' : value === false ? 'NOT_MET' : 'NOT_CONFIRMED'
    } else status = declared ? 'DECLARED' : 'NOT_CONFIRMED'
    return { key, clause, status }
  })
  const blocking = criteria.filter((c) => c.status !== 'MET' && c.status !== 'DECLARED').map((c) => c.key)
  const eligible = blocking.length === 0
  return { eligible, samplingRequested: multiSite.sampling, samplingApplied: eligible && multiSite.sampling, criteria, blocking }
}

// ── Explanation steps ────────────────────────────────────────────────────────

const fmt = (n: number) => String(round2(n))
const STEP_TEXT: Record<AuditTimeStepCode, (p: StepParams) => string> = {
  CLASSIFICATION: (p) =>
    `Category ${p.category ?? 'not set'}${p.source === 'OVERRIDE' ? ` (override of the suggested ${p.suggested ?? 'none'}: ${p.justification})` : p.source === 'SUGGESTED' ? ` (suggested from IAF codes ${p.codes || 'none'})` : p.source === 'SELECTED' ? ' (chosen by the CAB)' : ''}`,
  TABLE: (p) => `Table time for ${p.employees} personnel (band ${p.bandMin} to ${p.bandMax}${p.complexity ? `, ${p.complexity} complexity` : ''}): ${fmt(p.days)} days`,
  TABLE_EXTRAPOLATED: (p) =>
    `${p.employees} personnel is above the last table row (${p.lastRowMax}): ${fmt(p.lastRowDays)} + ${p.blocks} × ${fmt(p.stepDays)} days per ${p.bandWidth} further personnel = ${fmt(p.days)} days`,
  SPECIAL_CASE: (p) => `Special category, individual time ${fmt(p.days)} days: ${p.justification}`,
  FOOD_FORMULA: (p) =>
    `Ds = TD ${fmt(p.td)} + TH ${fmt(p.th)} × (${p.studies} − 1) + TFTE ${fmt(p.tfte)} (${p.fteEmployees} FTE, category ${p.category}) = ${fmt(p.days)} days`,
  MULTI_SITE: (p) =>
    `${p.sites} sites${p.centralFunction ? ' with a central function' : ''}${p.sampling ? `, sampling x = ${p.sampledGroup} sites (central function included, IAF MD 1 §6.1.3.3): ${p.sampleInitial} initial / ${p.sampleSurveillance} surveillance / ${p.sampleRecertification} recertification sites` : ', no sampling'}${p.individualGroup ? `; ${p.individualGroup} sites audited individually (${p.individualSurveillance} per surveillance)` : ''}: ${fmt(p.days)} days`,
  SAMPLE_INCREASE: (p) => `Sample increased by ${p.sites} site(s) for risk: ${p.reason}`,
  SITE_REDUCTION: (p) => `Per-site reduction ${fmt(p.appliedPercent)} %${p.capped ? ` (requested ${fmt(p.requestedPercent)} %, capped at ${fmt(p.capPercent)} %)` : ''}`,
  CENTRAL_REDUCTION: (p) => `Central-function reduction ${fmt(p.appliedPercent)} %${p.capped ? ` (requested ${fmt(p.requestedPercent)} %, capped at ${fmt(p.capPercent)} %)` : ''}`,
  ADJUSTMENT: (p) => `${p.direction === 'INCREASE' ? '+' : '−'}${fmt(p.percent)} %: ${p.reason}`,
  REDUCTION_CAP: (p) => `Net reduction ${fmt(p.requestedPercent)} % exceeds the ${fmt(p.capPercent)} % cap; ${fmt(p.capPercent)} % applied`,
  ADJUSTED: (p) => `After factors (${p.netPercent >= 0 ? '+' : '−'}${fmt(Math.abs(p.netPercent))} %): ${fmt(p.days)} days`,
  IMS_REDUCTION: (p) => `Integrated system, integration level ${fmt(p.integrationLevelPercent)} % → −${fmt(p.reductionPercent)} %: ${fmt(p.days)} days`,
  ROUNDED_INITIAL: (p) => `Initial audit ${fmt(p.rawDays)} days${p.minimumApplied ? ` (minimum ${fmt(p.minimumDays)} day)` : ''} → ${fmt(p.days)} days`,
  STAGE_SPLIT: (p) => `Stage 1 = max(${fmt(p.minDays)}, ${fmt(p.sharePercent)} % × ${fmt(p.initialDays)}) = ${fmt(p.stage1Days)}; Stage 2 = ${fmt(p.initialDays)} − ${fmt(p.stage1Days)} = ${fmt(p.stage2Days)} days`,
  RATIO: (p) => `${p.ratioLabel} × ${fmt(p.basisDays)} days of the sites visited = ${fmt(p.rawDays)}${p.minimumApplied ? ` → minimum ${fmt(p.minimumDays)} day` : ''} → ${fmt(p.days)} days`,
  CYCLE_TABLE: (p) => `ISO 50003 Table A.4 value ${fmt(p.tableDays)} days${p.factor !== 1 ? ` × ${fmt(p.factor)}` : ''} = ${fmt(p.rawDays)}${p.minimumApplied ? ` → minimum ${fmt(p.minimumDays)} day` : ''} → ${fmt(p.days)} days`,
  SITES_VISITED: (p) => `Sites visited: ${p.names}`,
  ON_SITE: (p) => `On-site at least ${fmt(p.onSiteMinDays)} days (${fmt(p.minOnSitePercent)} %); planning and reporting at most ${fmt(p.offSiteMaxDays)} days`,
  REMOTE: (p) => `Remote (ICT) share ${fmt(p.remoteSharePercent)} % recorded: ${fmt(p.remoteDays)} days`,
}

const step = (code: AuditTimeStepCode, reference: string, params: StepParams): AuditTimeStep => ({ code, reference, params, text: STEP_TEXT[code](params) })

const ratioLabel = (ratio: number) => {
  if (Math.abs(ratio - 1 / 3) < 1e-6) return '1/3'
  if (Math.abs(ratio - 2 / 3) < 1e-6) return '2/3'
  return String(round2(ratio))
}

// ── Classification ───────────────────────────────────────────────────────────

function classify(item: StandardInput, code: string, sites: NormalisedSite[]): StandardClassification | null {
  const def = CLASSIFICATION_STANDARDS[code]
  if (def?.basis !== 'IAF_CODE' && def?.basis !== 'ENERGY_COMPLEXITY') return null
  const suggestion = classifyStandard(code, [...(item.iafCodes ?? []), ...sites.flatMap((s) => s.iafCodes)])
  let resolved: ReturnType<typeof resolveClassification>
  try {
    resolved = resolveClassification(suggestion, { selected: item.complexity ?? null, override: item.classificationOverride ?? null })
  } catch (error) {
    if (error instanceof ClassificationError) throw new AuditTimeError(error.code, error.message, error.params)
    throw error
  }
  return {
    basis: suggestion.basis,
    table: suggestion.table,
    rule: suggestion.rule,
    suggested: suggestion.suggested,
    category: resolved.category,
    source: resolved.source,
    override: resolved.override,
    codes: suggestion.codes,
    unknownCodes: suggestion.unknownCodes,
    unmappedCodes: suggestion.unmappedCodes,
    unverifiedCodes: suggestion.unverifiedCodes,
    confirmation: suggestion.confirmation,
    categories: suggestion.categories,
    effect: resolved.category
      ? classificationEffect(code, resolved.category) ??
        (def.basis === 'ENERGY_COMPLEXITY'
          ? { kind: 'TABLE_COLUMN', column: resolved.category, direction: null, text: `Selects the ${resolved.category} column of ISO 50003 Table A.3.`, reference: { document: 'ISO 50003:2021', clause: 'Annex A, Table A.3' } }
          : null)
      : null,
  }
}

// ── Multi-site visit plan ────────────────────────────────────────────────────

interface Unit extends NormalisedSite {
  category: string | null
  group?: SiteGroup
  reasons?: SiteGroupReason[]
  mandatory?: VisitKind[]
  baseStep?: AuditTimeStep
  reductionPercent?: number
  initial: number
  surveillance: number
  recertification: number
  cycleSurveillanceTable: number | null
  cycleRecertificationTable: number | null
}

const VISIT_KINDS: VisitKind[] = ['INITIAL', 'SURVEILLANCE_1', 'SURVEILLANCE_2', 'RECERTIFICATION']
const KIND_OF_STAGE: Record<AuditStage, VisitKind> = { STAGE_1: 'INITIAL', STAGE_2: 'INITIAL', SURVEILLANCE_1: 'SURVEILLANCE_1', SURVEILLANCE_2: 'SURVEILLANCE_2', RECERTIFICATION: 'RECERTIFICATION' }
/** First audit of each cycle type: where new sites are mandatory. */
const FIRST_VISIT: Record<CycleType, VisitKind> = { INITIAL: 'INITIAL', RECERTIFICATION: 'RECERTIFICATION', TRANSFER: 'SURVEILLANCE_1' }

const bySize = (a: Unit, b: Unit) => b.employees - a.employees || a.index - b.index
const rankOf = (category: string) => CATEGORY_RANK[category as SectorCategory] ?? 0

/** Most frequent category of the sites (ties → lower rank), or null. */
function groupCategory(units: Unit[]): string | null {
  const counts = new Map<string, number>()
  for (const unit of units) if (unit.category) counts.set(unit.category, (counts.get(unit.category) ?? 0) + 1)
  let best: string | null = null
  for (const [category, count] of counts) {
    const bestCount = best ? counts.get(best)! : -1
    if (count > bestCount || (count === bestCount && best && rankOf(category) < rankOf(best))) best = category
  }
  return best
}

interface VisitPlan {
  visits: Record<VisitKind, Unit[]>
  sampleSizes: { INITIAL: number; SURVEILLANCE: number; RECERTIFICATION: number } | null
  sampleBase: { INITIAL: number; SURVEILLANCE: number; RECERTIFICATION: number } | null
  sampledGroup: number
  individualGroup: number
  individualSurveillance: number
  groupCategory: string | null
}

function visitPlan(units: Unit[], multiSite: NormalisedMultiSite | null, eligibility: MultiSiteEligibility | null, cycleType: CycleType, rules: AuditTimeRules): VisitPlan {
  if (!multiSite || !eligibility) {
    return { visits: { INITIAL: units, SURVEILLANCE_1: units, SURVEILLANCE_2: units, RECERTIFICATION: units }, sampleSizes: null, sampleBase: null, sampledGroup: 0, individualGroup: 0, individualSurveillance: 0, groupCategory: null }
  }
  const central = units.find((u) => u.isCentral) ?? null
  const others = units.filter((u) => !u.isCentral)
  const baseline = groupCategory(others)
  const first = FIRST_VISIT[cycleType]

  for (const unit of others) {
    const reasons: SiteGroupReason[] = []
    if (!eligibility.samplingApplied) reasons.push(eligibility.eligible ? 'SAMPLING_NOT_REQUESTED' : 'NOT_ELIGIBLE')
    if (!unit.sameProcesses) reasons.push('DIFFERENT_PROCESSES')
    if (unit.auditIndividually) reasons.push('INDIVIDUAL_REQUESTED')
    if (unit.category && baseline && rankOf(unit.category) > rankOf(baseline)) reasons.push('HIGHER_RISK')
    unit.group = reasons.length ? 'INDIVIDUAL' : 'SAMPLED'
    unit.reasons = reasons
  }
  if (central) {
    central.group = 'CENTRAL'
    central.reasons = ['CENTRAL_FUNCTION']
  }
  const sampled = others.filter((u) => u.group === 'SAMPLED').sort(bySize)
  const individual = others.filter((u) => u.group === 'INDIVIDUAL').sort(bySize)

  // Sampling (IAF MD 1 §6.1.3.3): y = ⌈c·√x⌉ with x = the total number of sites under sampling,
  // central function included (§6.3: individually audited sites follow §6.2 instead). The central
  // function (§6.1.3.4) and, at the first audit of the cycle, new sites (§6.1.4) are counted inside
  // the sample; when they outnumber y the sample grows to hold them.
  const scope: Unit[] = sampled.length ? [...(central ? [central] : []), ...sampled] : []
  const x = scope.length
  const coefficient: Record<VisitKind, number> = {
    INITIAL: rules.sampleCoefficients.INITIAL,
    SURVEILLANCE_1: rules.sampleCoefficients.SURVEILLANCE,
    SURVEILLANCE_2: rules.sampleCoefficients.SURVEILLANCE,
    RECERTIFICATION: multiSite.systemEffective ? rules.sampleCoefficients.RECERTIFICATION : rules.recertificationCoefficientNotEffective,
  }
  const mandatorySampled = sampled.filter((u) => u.isNew)
  const baseSize = (kind: VisitKind) => (x ? Math.min(x, Math.ceil(coefficient[kind] * Math.sqrt(x) - EPS) + multiSite.additionalSampleSites) : 0)
  const sampleOf = (kind: VisitKind): Unit[] => {
    if (!x) return []
    const mandatory = [...(central ? [central] : []), ...(kind === first ? mandatorySampled : [])]
    const size = Math.max(baseSize(kind), mandatory.length)
    return [...mandatory, ...sampled.filter((u) => !mandatory.includes(u))].slice(0, size)
  }

  const n = individual.length
  const perSurveillance = n ? Math.min(n, Math.ceil(n * rules.individualSurveillanceShare - EPS)) : 0
  const mandatoryIndividual = individual.filter((u) => u.isNew)
  const surveillanceIndividual = (kind: VisitKind, exclude: Unit[] = []) => {
    if (!n) return []
    const mandatory = kind === first ? mandatoryIndividual : []
    const size = Math.max(perSurveillance, mandatory.length)
    const fresh = individual.filter((u) => !mandatory.includes(u) && !exclude.includes(u))
    const reused = individual.filter((u) => !mandatory.includes(u) && exclude.includes(u))
    return [...mandatory, ...fresh, ...reused].slice(0, size)
  }
  const s1Individual = surveillanceIndividual('SURVEILLANCE_1')
  const s2Individual = surveillanceIndividual('SURVEILLANCE_2', s1Individual)

  const ordered = (list: Unit[]) => units.filter((u) => list.includes(u))
  const head = central ? [central] : []
  const sampleOrHead = (kind: VisitKind) => (x ? sampleOf(kind) : head)
  const visits: Record<VisitKind, Unit[]> = {
    INITIAL: ordered([...sampleOrHead('INITIAL'), ...individual]),
    SURVEILLANCE_1: ordered([...sampleOrHead('SURVEILLANCE_1'), ...s1Individual]),
    SURVEILLANCE_2: ordered([...sampleOrHead('SURVEILLANCE_2'), ...s2Individual]),
    RECERTIFICATION: ordered([...sampleOrHead('RECERTIFICATION'), ...individual]),
  }
  for (const unit of units) unit.mandatory = unit.group === 'CENTRAL' ? [...VISIT_KINDS] : unit.isNew ? [first] : []
  return {
    visits,
    sampleSizes: x ? { INITIAL: sampleOf('INITIAL').length, SURVEILLANCE: sampleOf('SURVEILLANCE_1').length, RECERTIFICATION: sampleOf('RECERTIFICATION').length } : null,
    sampleBase: x ? { INITIAL: baseSize('INITIAL'), SURVEILLANCE: baseSize('SURVEILLANCE_1'), RECERTIFICATION: baseSize('RECERTIFICATION') } : null,
    sampledGroup: x,
    individualGroup: n,
    individualSurveillance: perSurveillance,
    groupCategory: baseline,
  }
}

function stageExtras(days: number, remoteSharePercent: number, rules: AuditTimeRules) {
  const offSiteMaxDays = floorHalf(days * (1 - rules.minOnSitePercent / 100))
  const onSiteMinDays = days - offSiteMaxDays
  const remoteDays = Math.min(days, roundHalf((days * remoteSharePercent) / 100))
  return { onSiteMinDays, offSiteMaxDays, remoteDays }
}

// ── Calculation ──────────────────────────────────────────────────────────────

interface StandardContext {
  employees: number
  multiSite: NormalisedMultiSite | null
  eligibility: MultiSiteEligibility | null
  rules: AuditTimeRules
  imsReductionPercent: number
  imsIntegration: number
  cycleType: CycleType
  stage1SharePercent: number
  remoteSharePercent: number
  warnings: AuditTimeWarning[]
}

interface StageRow { days: number; rawDays: number; ratio: number | null; minimumApplied: boolean; steps: AuditTimeStep[] }

type SumKey = 'initial' | 'surveillance' | 'recertification' | 'cycleSurveillanceTable' | 'cycleRecertificationTable'

function calculateStandard(item: StandardInput, ctx: StandardContext) {
  const { employees, multiSite, eligibility, rules, imsReductionPercent, imsIntegration, cycleType, stage1SharePercent, remoteSharePercent, warnings } = ctx
  const code = item.standardCode
  const def = AUDIT_TIME_STANDARDS[code]
  if (!def) {
    throw new AuditTimeError('STANDARD_UNSUPPORTED', `Standard "${code}" has no audit-time rule. Supported: ${Object.keys(AUDIT_TIME_STANDARDS).join(', ')}.`, { standardCode: code })
  }
  const steps: AuditTimeStep[] = []
  const references = new Set<string>([def.reference])

  // Sites of this standard: the central function and every site without a standards list or listing it.
  const standardSites = multiSite && !def.food ? multiSite.sites.filter((s) => s.isCentral || !s.standards.length || s.standards.includes(code)) : []

  // 0. Classification.
  const classification = classify(item, code, standardSites)
  const complexity = def.complexities ? classification?.category ?? null : null
  if (def.complexities) {
    if (!complexity) throw new AuditTimeError('COMPLEXITY_REQUIRED', `Complexity is required for ${code} (${def.complexities.join(', ')}).`, { standardCode: code, allowed: def.complexities })
    if (!def.complexities.includes(complexity)) {
      throw new AuditTimeError('COMPLEXITY_INVALID', `Complexity "${complexity}" is not valid for ${code} (${def.complexities.join(', ')}).`, { standardCode: code, allowed: def.complexities })
    }
  }
  // The step is listed when IAF codes or a CAB choice exist (ISO 9001 without codes = Table QMS 1 time).
  const classificationShown = classification && classification.basis === 'IAF_CODE' && (classification.codes.length > 0 || classification.source === 'OVERRIDE' || classification.source === 'SELECTED')
  if (classification && classificationShown) {
    const tableKey = CLASSIFICATION_STANDARDS[code].table!
    references.add(CLASSIFICATION_REFERENCE[tableKey])
    if (classification.source === 'OVERRIDE') references.add('CLASSIFICATION_OVERRIDE')
    steps.push(step('CLASSIFICATION', CLASSIFICATION_REFERENCE[tableKey], {
      category: classification.category, suggested: classification.suggested, source: classification.source,
      codes: classification.codes.map((c) => c.code).join(', '), justification: classification.override?.justification ?? null,
    }))
    // No CLASSIFICATION_UNVERIFIED warning: the IAF code to MD 5 mapping was confirmed by the
    // product owner (25 October 2026); codes without a category are reported as unmapped.
    if (classification.unmappedCodes.length) {
      warnings.push({ code: 'CLASSIFICATION_UNMAPPED', standardCode: code, codes: classification.unmappedCodes, message: `${code}: IAF code(s) ${classification.unmappedCodes.join(', ')} have no MD 5 category; ${code === 'ISO_9001' ? 'the table time is used' : 'they do not set the category'}.` })
    }
    if (code === 'ISO_9001' && classification.category === 'HIGH' && !(item.adjustments ?? []).some((a) => a.direction === 'INCREASE')) {
      warnings.push({ code: 'QMS_HIGH_RISK_NO_INCREASE', standardCode: code, message: `${code}: high-risk activities need more time than Table QMS 1 (IAF MD 5 Table QMS 2 Note 1); add an increase factor.` })
    }
  }

  const adjustments = normaliseAdjustments(item.adjustments)

  // Special category (ISO 14001): an individual, justified time for the organisation.
  let special: SpecialCaseInput | null = null
  if (complexity === 'SPECIAL') {
    const days = item.specialCase?.days
    const justification = text(item.specialCase?.justification)
    if (!isNum(days) || days <= 0 || days > 365) {
      throw new AuditTimeError('SPECIAL_CASE_TIME_REQUIRED', `${code}: the Special category is not covered by Table EMS 1; enter the individual audit time (days) with its justification.`, { standardCode: code })
    }
    if (justification.length < JUSTIFICATION_MIN_LENGTH) {
      throw new AuditTimeError('SPECIAL_CASE_JUSTIFICATION_REQUIRED', `${code}: the individual time of a Special case needs a justification of at least ${JUSTIFICATION_MIN_LENGTH} characters.`, { standardCode: code })
    }
    special = { days, justification }
    references.add('MD5_SPECIAL')
  }

  // 1–2. Base time per site (or for the whole organisation).
  const useMultiSite = Boolean(multiSite) && !def.food && !special && standardSites.length > 1
  if (multiSite && def.food) {
    warnings.push({ code: 'MULTI_SITE_NOT_APPLIED_FOOD', standardCode: code, message: `${code}: IAF MD 1 sampling is not applied; ISO 22003-1 audit time is calculated for the organisation as a whole.` })
  }
  if (multiSite && special) {
    warnings.push({ code: 'MULTI_SITE_NOT_APPLIED_SPECIAL', standardCode: code, message: `${code}: Special category; the individual time covers the organisation as a whole (no per-site table time).` })
  }
  const pick = (row: BandRow) => {
    const r = row as unknown as Record<string, number>
    return complexity ? r[complexity] : r.initialAuditDays
  }
  const unitBase = (unitEmployees: number) => {
    if (special) return { days: special.days, step: step('SPECIAL_CASE', 'MD5_SPECIAL', { days: special.days, justification: special.justification }) }
    if (def.food) {
      const food = item.food ?? ({} as Partial<FoodInputs>)
      const result = foodBaseDays({ category: food.category, studies: food.studies, fteEmployees: food.fteEmployees ?? unitEmployees })
      return { days: result.days, step: step('FOOD_FORMULA', def.reference, { ...result }) }
    }
    const found = lookupBand(def.table!, unitEmployees, pick)
    if (found.extrapolation) {
      references.add('MD5_EXTRAPOLATION')
      return { days: found.days, step: step('TABLE_EXTRAPOLATED', 'MD5_EXTRAPOLATION', { employees: unitEmployees, complexity, days: found.days, ...found.extrapolation }) }
    }
    return { days: found.days, step: step('TABLE', def.reference, { employees: unitEmployees, complexity, days: found.days, bandMin: found.band.min, bandMax: found.band.max }) }
  }
  const cycleValue = (unitEmployees: number, kind: 'surveillance' | 'recertification') =>
    lookupBand(def.cycleTable!, unitEmployees, (row) => row[complexity as 'HIGH' | 'MEDIUM' | 'LOW'][kind]).days

  const ms = useMultiSite ? multiSite! : null
  // A standard that applies to one site only is timed from that site's personnel.
  const singleEmployees = standardSites.length === 1 ? standardSites[0].employees : employees
  const blankSite: NormalisedSite = {
    index: 0, id: null, name: '', employees: singleEmployees, isCentral: false, siteType: 'PERMANENT', location: null, activities: null, iafCodes: [], standards: [],
    sameProcesses: true, isNew: false, auditIndividually: false, individualReason: null, permanentEmployees: null, temporaryEmployees: null, shifts: null,
  }
  const sites: NormalisedSite[] = ms ? standardSites : [blankSite]
  const siteReductionPercent = ms ? Math.min(ms.siteReductionRequested, rules.maxSiteReductionPercent) : 0
  const centralReductionPercent = ms ? Math.min(ms.centralReductionRequested, rules.maxCentralReductionPercent) : 0
  const siteCategory = (site: NormalisedSite) => {
    if (!ms || !site.iafCodes.length || CLASSIFICATION_STANDARDS[code]?.basis !== 'IAF_CODE') return null
    const own = classifyStandard(code, site.iafCodes)
    return own.rule === 'HIGHEST_OF_CODES' ? own.suggested : null
  }
  const units: Unit[] = sites.map((site) => ({ ...site, category: siteCategory(site), initial: 0, surveillance: 0, recertification: 0, cycleSurveillanceTable: null, cycleRecertificationTable: null }))
  const plan = visitPlan(units, ms, eligibility, cycleType, rules)
  for (const unit of units) {
    const base = unitBase(unit.employees)
    // IAF MD 1 §7.3: the per-site reduction applies to sampled sites; the central function has its own.
    const reductionPercent = !ms ? 0 : unit.isCentral ? centralReductionPercent : unit.group === 'SAMPLED' ? siteReductionPercent : 0
    const factor = 1 - reductionPercent / 100
    Object.assign(unit, {
      baseStep: base.step,
      reductionPercent,
      initial: base.days * factor,
      surveillance: (def.cycleTable ? cycleValue(unit.employees, 'surveillance') : base.days * rules.surveillanceRatio) * factor,
      recertification: (def.cycleTable ? cycleValue(unit.employees, 'recertification') : base.days * rules.recertificationRatio) * factor,
      cycleSurveillanceTable: def.cycleTable ? cycleValue(unit.employees, 'surveillance') : null,
      cycleRecertificationTable: def.cycleTable ? cycleValue(unit.employees, 'recertification') : null,
    })
  }
  const sum = (list: Unit[], key: SumKey) => list.reduce((total, unit) => total + (unit[key] ?? 0), 0)
  const initialBase = sum(plan.visits.INITIAL, 'initial')
  const kindBase: Record<VisitKind, number> = {
    INITIAL: initialBase,
    SURVEILLANCE_1: sum(plan.visits.SURVEILLANCE_1, 'surveillance'),
    SURVEILLANCE_2: sum(plan.visits.SURVEILLANCE_2, 'surveillance'),
    RECERTIFICATION: sum(plan.visits.RECERTIFICATION, 'recertification'),
  }

  let multiSiteSummary: MultiSiteSummary | null = null
  let baseStep: AuditTimeStep | null = null
  if (ms) {
    for (const unit of units) steps.push({ ...unit.baseStep!, site: unit.name, text: `${unit.name}${unit.isCentral ? ' (central function)' : ''}: ${unit.baseStep!.text}` })
    references.add('MD1_ELIGIBILITY')
    references.add('MD1_SAMPLING')
    const central = units.find((u) => u.isCentral)
    if (central) references.add('MD1_CENTRAL_FUNCTION')
    if (plan.individualGroup) references.add('MD1_NOT_SAMPLED')
    if (units.some((u) => u.isNew)) references.add('MD1_NEW_SITES')
    if (units.some((u) => u.siteType === 'TEMPORARY')) references.add('MD1_TEMPORARY_SITES')
    if (ms.siteReductionRequested > 0 && plan.sampledGroup) {
      references.add('MD1_SITE_REDUCTION')
      steps.push(step('SITE_REDUCTION', 'MD1_SITE_REDUCTION', {
        requestedPercent: ms.siteReductionRequested, appliedPercent: siteReductionPercent,
        capPercent: rules.maxSiteReductionPercent, capped: ms.siteReductionRequested > rules.maxSiteReductionPercent,
      }))
    }
    if (ms.centralReductionRequested > 0 && central) {
      references.add('MD1_SITE_REDUCTION')
      steps.push(step('CENTRAL_REDUCTION', 'MD1_SITE_REDUCTION', {
        requestedPercent: ms.centralReductionRequested, appliedPercent: centralReductionPercent,
        capPercent: rules.maxCentralReductionPercent, capped: ms.centralReductionRequested > rules.maxCentralReductionPercent,
      }))
    }
    if (ms.additionalSampleSites > 0 && plan.sampledGroup) {
      references.add('MD1_SAMPLE_INCREASE')
      steps.push(step('SAMPLE_INCREASE', 'MD1_SAMPLE_INCREASE', { sites: ms.additionalSampleSites, reason: ms.additionalSampleReason }))
    }
    steps.push(step('MULTI_SITE', 'MD1_SAMPLING', {
      sites: units.length,
      centralFunction: Boolean(central),
      sampling: Boolean(plan.sampleSizes),
      sampledGroup: plan.sampledGroup,
      sampleInitial: plan.sampleSizes?.INITIAL ?? null,
      sampleSurveillance: plan.sampleSizes?.SURVEILLANCE ?? null,
      sampleRecertification: plan.sampleSizes?.RECERTIFICATION ?? null,
      individualGroup: plan.individualGroup,
      individualSurveillance: plan.individualSurveillance,
      days: round2(initialBase),
    }))
    multiSiteSummary = {
      sites: units.length,
      centralFunction: Boolean(central),
      sampling: Boolean(plan.sampleSizes),
      sampleSizes: plan.sampleSizes,
      sampleBase: plan.sampleBase,
      sampledGroup: plan.sampledGroup,
      individualGroup: plan.individualGroup,
      individualSurveillanceSites: plan.individualSurveillance,
      groupCategory: plan.groupCategory,
      additionalSampleSites: ms.additionalSampleSites,
      systemEffective: ms.systemEffective,
      siteReductionPercent,
      centralReductionPercent,
      units: units.map((unit) => ({
        id: unit.id,
        name: unit.name,
        employees: unit.employees,
        isCentral: unit.isCentral,
        siteType: unit.siteType,
        location: unit.location,
        iafCodes: unit.iafCodes,
        category: unit.category,
        isNew: unit.isNew,
        group: unit.group,
        reasons: unit.reasons,
        mandatory: unit.mandatory,
        tableDays: unit.baseStep!.params.days,
        reductionPercent: unit.reductionPercent ?? 0,
        initialDays: round2(unit.initial),
        surveillanceDays: round2(unit.surveillance),
        recertificationDays: round2(unit.recertification),
        visited: {
          INITIAL: plan.visits.INITIAL.includes(unit),
          SURVEILLANCE: plan.visits.SURVEILLANCE_1.includes(unit),
          SURVEILLANCE_1: plan.visits.SURVEILLANCE_1.includes(unit),
          SURVEILLANCE_2: plan.visits.SURVEILLANCE_2.includes(unit),
          RECERTIFICATION: plan.visits.RECERTIFICATION.includes(unit),
        },
      })),
    }
  } else {
    baseStep = units[0].baseStep!
    steps.push(baseStep)
  }

  // 3. IAF MD 5 factors with the 30 % reduction cap.
  let increase = 0
  let decrease = 0
  for (const adjustment of adjustments) {
    if (adjustment.direction === 'INCREASE') increase += adjustment.percent
    else decrease += adjustment.percent
    steps.push(step('ADJUSTMENT', 'MD5_ADJUSTMENT', { ...adjustment }))
  }
  const requestedNet = increase - decrease
  const reductionCapApplied = requestedNet < -rules.maxReductionPercent
  const netPercent = reductionCapApplied ? -rules.maxReductionPercent : requestedNet
  if (adjustments.length) references.add('MD5_ADJUSTMENT')
  if (reductionCapApplied) {
    references.add('MD5_REDUCTION_CAP')
    steps.push(step('REDUCTION_CAP', 'MD5_REDUCTION_CAP', { requestedPercent: -requestedNet, capPercent: rules.maxReductionPercent }))
  }
  const factor = 1 + netPercent / 100
  if (adjustments.length) steps.push(step('ADJUSTED', 'MD5_ADJUSTMENT', { netPercent, days: round2(initialBase * factor) }))

  // 4. IAF MD 11 integration reduction.
  const imsFactor = 1 - imsReductionPercent / 100
  if (imsReductionPercent > 0) {
    references.add('MD11_IMS')
    steps.push(step('IMS_REDUCTION', 'MD11_IMS', { integrationLevelPercent: imsIntegration, reductionPercent: imsReductionPercent, days: round2(initialBase * factor * imsFactor) }))
  }

  // 5. Stages.
  const initialRaw = initialBase * factor * imsFactor
  const minimumInitialApplied = initialRaw < rules.minimumInitialDays
  const initialDays = roundHalf(Math.max(rules.minimumInitialDays, initialRaw))
  steps.push(step('ROUNDED_INITIAL', 'ROUNDING', { rawDays: round2(initialRaw), days: initialDays, minimumApplied: minimumInitialApplied, minimumDays: rules.minimumInitialDays }))

  const ratioStage = (kind: VisitKind, ratio: number, minDays: number, tableKey: 'cycleSurveillanceTable' | 'cycleRecertificationTable', reference: string): StageRow => {
    const raw = kindBase[kind] * factor * imsFactor
    const minimumApplied = raw < minDays
    const days = roundHalf(Math.max(minDays, raw))
    references.add(reference)
    const basisDays = round2(sum(plan.visits[kind], 'initial') * factor * imsFactor)
    const s = def.cycleTable
      ? step('CYCLE_TABLE', 'ISO50003_TABLE', { tableDays: round2(sum(plan.visits[kind], tableKey)), factor: round2(factor * imsFactor), rawDays: round2(raw), minimumApplied, minimumDays: minDays, days })
      : step('RATIO', reference, { ratio, ratioLabel: ratioLabel(ratio), basisDays, rawDays: round2(raw), minimumApplied, minimumDays: minDays, days })
    return { days, rawDays: round2(raw), ratio: def.cycleTable ? null : ratio, minimumApplied, steps: [s] }
  }

  const surveillance1 = ratioStage('SURVEILLANCE_1', rules.surveillanceRatio, rules.surveillanceMinDays, 'cycleSurveillanceTable', 'MD5_SURVEILLANCE')
  const surveillance2 = ratioStage('SURVEILLANCE_2', rules.surveillanceRatio, rules.surveillanceMinDays, 'cycleSurveillanceTable', 'MD5_SURVEILLANCE')
  const recertification = ratioStage('RECERTIFICATION', rules.recertificationRatio, rules.recertificationMinDays, 'cycleRecertificationTable', 'MD5_RECERTIFICATION')

  let stage1Days = roundHalf(Math.max(rules.stage1MinDays, (initialDays * stage1SharePercent) / 100))
  stage1Days = Math.max(rules.stage1MinDays, Math.min(stage1Days, initialDays - rules.roundingStep))
  const stage2Days = initialDays - stage1Days
  const splitStep = step('STAGE_SPLIT', 'STAGE_SPLIT', { minDays: rules.stage1MinDays, sharePercent: stage1SharePercent, initialDays, stage1Days, stage2Days })

  const stageRows: Record<AuditStage, StageRow> = {
    STAGE_1: { days: stage1Days, rawDays: round2((initialRaw * stage1Days) / initialDays), ratio: null, minimumApplied: (initialDays * stage1SharePercent) / 100 < rules.stage1MinDays, steps: [splitStep] },
    STAGE_2: { days: stage2Days, rawDays: round2((initialRaw * stage2Days) / initialDays), ratio: null, minimumApplied: false, steps: [splitStep] },
    SURVEILLANCE_1: surveillance1,
    SURVEILLANCE_2: surveillance2,
    RECERTIFICATION: recertification,
  }
  if (cycleType === 'INITIAL') references.add('STAGE_SPLIT')
  if (cycleType === 'TRANSFER') references.add('MD2_TRANSFER')

  const stages: AuditTimeStageBreakdown[] = CYCLE_EVENTS[cycleType].map((stage) => {
    const row = stageRows[stage]
    const extras = stageExtras(row.days, remoteSharePercent, rules)
    const visited = ms ? plan.visits[KIND_OF_STAGE[stage]] : null
    const visitSteps = visited ? [step('SITES_VISITED', 'MD1_SAMPLING', { names: visited.map((u) => u.name).join(', ') })] : []
    const extraSteps = [step('ON_SITE', 'MD5_ON_SITE', { ...extras, minOnSitePercent: rules.minOnSitePercent })]
    if (remoteSharePercent > 0) extraSteps.push(step('REMOTE', 'MD4_REMOTE', { remoteSharePercent, remoteDays: extras.remoteDays }))
    return {
      stage,
      days: row.days,
      rawDays: row.rawDays,
      ratio: row.ratio,
      minimumApplied: row.minimumApplied,
      sitesVisited: visited ? visited.length : null,
      siteNames: visited ? visited.map((u) => u.name) : null,
      ...extras,
      steps: [...row.steps, ...visitSteps, ...extraSteps],
    }
  })
  references.add('MD5_ON_SITE')
  if (remoteSharePercent > 0) references.add('MD4_REMOTE')
  references.add('ROUNDING')

  const breakdown: AuditTimeStandardBreakdown = {
    standardCode: code,
    complexity,
    classification,
    specialCase: special,
    method: def.food ? 'FOOD_FORMULA' : special ? 'SPECIAL_CASE' : ms ? 'MULTI_SITE' : (baseStep!.code as 'TABLE' | 'TABLE_EXTRAPOLATED'),
    baseDays: round2(initialBase),
    adjustments,
    requestedAdjustmentPercent: requestedNet,
    adjustmentPercent: netPercent,
    reductionCapApplied,
    imsReductionPercent,
    multiSite: multiSiteSummary,
    initialAuditDays: initialDays,
    surveillanceDays: surveillance1.days,
    surveillance2Days: surveillance2.days,
    recertificationDays: recertification.days,
    nextCycleRecertificationDays: cycleType === 'RECERTIFICATION' ? null : recertification.days,
    steps,
    stages,
    totalDays: stages.reduce((total, s) => total + s.days, 0),
  }
  return { breakdown, references }
}

export type AuditTimeRulesOverride = Partial<Omit<AuditTimeRules, 'sampleCoefficients'>> & {
  sampleCoefficients?: Partial<AuditTimeRules['sampleCoefficients']>
  references?: Record<string, AuditTimeReference>
}

/** Calculate the audit days of one certification cycle (see the module header). */
export function calculateAuditTime(input: AuditTimeInput, rulesOverride: AuditTimeRulesOverride = {}): AuditTimeBreakdown {
  const { references: referenceOverrides = {}, sampleCoefficients, ...overrides } = rulesOverride
  const rules: AuditTimeRules = { ...AUDIT_TIME_RULES, ...overrides, sampleCoefficients: { ...AUDIT_TIME_RULES.sampleCoefficients, ...(sampleCoefficients ?? {}) } }
  const cycleType = input.cycleType ?? 'INITIAL'
  if (!CYCLE_TYPES.includes(cycleType)) throw new AuditTimeError('CYCLE_TYPE_INVALID', `Cycle type must be one of ${CYCLE_TYPES.join(', ')}.`, { cycleType })
  const employees = input.employees
  if (!Number.isInteger(employees) || employees < 1) {
    throw new AuditTimeError('EMPLOYEES_INVALID', 'The number of personnel must be a whole number of at least 1.', { employees: employees ?? null })
  }
  const standards = input.standards ?? []
  if (!standards.length) throw new AuditTimeError('STANDARDS_REQUIRED', 'At least one standard is required.')
  const codes = standards.map((s) => s.standardCode)
  if (new Set(codes).size !== codes.length) throw new AuditTimeError('STANDARD_DUPLICATE', 'Each standard can be listed once.')

  const stage1SharePercent = input.stage1SharePercent ?? rules.stage1SharePercent
  if (!isNum(stage1SharePercent) || stage1SharePercent <= 0 || stage1SharePercent >= 100) {
    throw new AuditTimeError('STAGE1_SHARE_INVALID', 'The Stage 1 share must be more than 0 and less than 100 %.', { value: stage1SharePercent })
  }
  const integrationLevelPercent = percentIn(input.integrationLevelPercent, 'INTEGRATION_LEVEL_INVALID', 'The integration level')
  const remoteSharePercent = percentIn(input.remoteSharePercent, 'REMOTE_SHARE_INVALID', 'The remote share')
  const multiSite = normaliseSites(input.multiSite)
  const eligibility = multiSite ? evaluateMultiSiteEligibility(multiSite) : null

  const imsApplied = standards.length > 1 && integrationLevelPercent > 0
  const imsReductionPercent = imsApplied ? round2((rules.imsMaxReductionPercent * integrationLevelPercent) / 100) : 0

  const warnings: AuditTimeWarning[] = []
  if (eligibility && eligibility.samplingRequested && !eligibility.eligible) {
    if (eligibility.blocking.includes('CENTRAL_FUNCTION')) {
      warnings.push({ code: 'SAMPLING_NEEDS_CENTRAL_FUNCTION', message: 'Sampling needs a central function; every site is audited individually (IAF MD 1 §6.2).' })
    }
    warnings.push({ code: 'SAMPLING_NOT_ELIGIBLE', criteria: eligibility.blocking, message: `IAF MD 1 criteria not met or not confirmed (${eligibility.blocking.join(', ')}): sites are audited individually (§6.2).` })
  }
  const references = new Set<string>()
  const ctx: StandardContext = { employees, multiSite, eligibility, rules, imsReductionPercent, imsIntegration: integrationLevelPercent, cycleType, stage1SharePercent, remoteSharePercent, warnings }
  const results = standards.map((item) => {
    const { breakdown, references: used } = calculateStandard(item, ctx)
    used.forEach((key) => references.add(key))
    return breakdown
  })
  if (standards.length > 1 && integrationLevelPercent === 0) {
    warnings.push({ code: 'IMS_NOT_INTEGRATED', message: 'Several standards without an integration level: each standard is timed independently (no IAF MD 11 reduction).' })
  }

  const byStage: Partial<Record<AuditStage, number>> = {}
  for (const standard of results) {
    for (const s of standard.stages) byStage[s.stage] = (byStage[s.stage] ?? 0) + s.days
  }
  const stageDays = (s: AuditTimeStandardBreakdown, stage: AuditStage) => s.stages.find((x) => x.stage === stage)?.days ?? 0
  const cycle = {
    stage1: results.reduce((t, s) => t + stageDays(s, 'STAGE_1'), 0),
    stage2: results.reduce((t, s) => t + stageDays(s, 'STAGE_2'), 0),
    surveillance1: results.reduce((t, s) => t + s.surveillanceDays, 0),
    surveillance2: results.reduce((t, s) => t + (s.surveillance2Days ?? s.surveillanceDays), 0),
    recertification: results.reduce((t, s) => t + s.recertificationDays, 0),
  }
  return {
    cycleType,
    employees,
    stage1SharePercent,
    remoteSharePercent,
    ims: { applied: imsApplied, standardsCount: standards.length, integrationLevelPercent, reductionPercent: imsReductionPercent, maxReductionPercent: rules.imsMaxReductionPercent },
    multiSite: multiSite && eligibility
      ? { enabled: true, sampling: eligibility.samplingApplied, sites: multiSite.sites.length, centralFunction: multiSite.sites.some((s) => s.isCentral), eligibility }
      : null,
    standards: results,
    totals: {
      days: results.reduce((total, s) => total + s.totalDays, 0),
      byStage,
      // Three-year programme: initial (Stage 1 + 2) or recertification, then two surveillances;
      // the recertification of an initial cycle is shown as information for the next cycle.
      threeYearCycle: { ...cycle, total: (cycleType === 'INITIAL' ? cycle.stage1 + cycle.stage2 : cycleType === 'RECERTIFICATION' ? cycle.recertification : 0) + cycle.surveillance1 + cycle.surveillance2 },
    },
    rules: {
      surveillanceRatio: rules.surveillanceRatio,
      surveillanceMinDays: rules.surveillanceMinDays,
      recertificationRatio: rules.recertificationRatio,
      recertificationMinDays: rules.recertificationMinDays,
      stage1MinDays: rules.stage1MinDays,
      maxReductionPercent: rules.maxReductionPercent,
      minOnSitePercent: rules.minOnSitePercent,
      imsMaxReductionPercent: rules.imsMaxReductionPercent,
      maxSiteReductionPercent: rules.maxSiteReductionPercent,
      maxCentralReductionPercent: rules.maxCentralReductionPercent,
      sampleCoefficients: rules.sampleCoefficients,
      recertificationCoefficientNotEffective: rules.recertificationCoefficientNotEffective,
      individualSurveillanceShare: rules.individualSurveillanceShare,
      roundingStep: rules.roundingStep,
    },
    references: Object.fromEntries([...references].map((key) => [key, referenceOverrides[key] ?? AUDIT_TIME_REFERENCES[key]])),
    warnings,
    frameworkNote: ACCREDITATION_FRAMEWORK_NOTE,
  }
}
