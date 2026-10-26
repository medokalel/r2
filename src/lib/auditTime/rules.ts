/**
 * Audit-time rules and normative references — TypeScript copy of the backend's
 * src/modules/audit-engine/audit-time.rules.js. Keep both in step.
 */

export const ACCREDITATION_FRAMEWORK_NOTE =
  'IAF ceased operations on 1 January 2026 and Global ACI succeeds it. IAF mandatory documents ' +
  '(MD 1, MD 2, MD 4, MD 5, MD 11) remain applicable until Global ACI replaces them.'

export interface AuditTimeReference {
  document: string
  clause: string | null
  topic: string
  edition?: string | null
}

export const AUDIT_TIME_REFERENCES: Record<string, AuditTimeReference> = {
  MD5_QMS: { document: 'IAF MD 5:2023', clause: 'Annex A, Table QMS 1', topic: 'Initial audit time by effective personnel (ISO 9001)' },
  MD5_EMS: { document: 'IAF MD 5:2023', clause: 'Annex B, Table EMS 1', topic: 'Initial audit time by personnel and complexity (ISO 14001)' },
  MD5_OHSMS: { document: 'IAF MD 5:2023', clause: 'Annex C, Table OH&SMS 1', topic: 'Initial audit time by personnel and complexity (ISO 45001)' },
  MD9_TABLE: { document: 'IAF MD 9:2023', clause: 'Annex D, Table D.1', topic: 'Initial audit time (ISO 13485)' },
  ISO27006_TABLE: { document: 'ISO/IEC 27006-1:2024', clause: 'Annex C, Table C.1', topic: 'Initial audit time (ISO/IEC 27001)' },
  ISO50003_TABLE: { document: 'ISO 50003:2021', clause: 'Annex A, Tables A.3 and A.4', topic: 'Initial, surveillance and recertification audit time (ISO 50001)' },
  ISO22003_FOOD: { document: 'ISO 22003-1:2022', clause: 'Annex B', topic: 'Food safety audit time: Ds = TD + TH × (HACCP studies − 1) + TFTE (no TMS term)' },
  MD5_EXTRAPOLATION: { document: 'IAF MD 5:2023', clause: 'Annex A (rows above 10,700 personnel)', topic: 'Above the last table row the progression of the table is followed' },
  MD5_ADJUSTMENT: { document: 'IAF MD 5:2023', clause: '§8', topic: 'Factors that increase or reduce the audit time from the table' },
  MD5_REDUCTION_CAP: { document: 'IAF MD 5:2023', clause: '§3.9', topic: 'Total reduction shall not exceed 30 % of the table time' },
  MD5_ON_SITE: { document: 'IAF MD 5:2023', clause: '§2.1.2 and §4.1', topic: 'On-site audit time not less than 80 % of the audit time' },
  MD5_SURVEILLANCE: { document: 'IAF MD 5:2023', clause: '§5', topic: 'Surveillance audit time = 1/3 of the initial audit time (minimum 1 day)' },
  MD5_RECERTIFICATION: { document: 'IAF MD 5:2023', clause: '§6', topic: 'Recertification audit time = 2/3 of the initial audit time recalculated from current data (minimum 1 day)' },
  STAGE_SPLIT: { document: 'ISO/IEC 17021-1:2015', clause: '§9.3.1', topic: 'Initial audit in two stages; Stage 1 share set by CAB policy' },
  MD11_IMS: { document: 'IAF MD 11:2023', clause: null, topic: 'Integrated management systems: sum of single-standard times reduced for the level of integration (max 20 %)' },
  MD1_SAMPLING: { document: 'IAF MD 1:2023', clause: '§6.1.3.3, §6.1.3.4, §6.3', topic: 'Sample y = √x initial, 0.6√x surveillance, 0.8√x recertification when the system proved effective (else √x), rounded up; x = total number of sites under sampling, central function included; the central function and new sites count inside the sample, which grows if they exceed it' },
  MD1_SITE_REDUCTION: { document: 'IAF MD 1:2023', clause: '§7.3', topic: 'Reduction of audit time per sampled site ≤ 50 %; central function and centralised processes ≤ 20 %' },
  MD1_ELIGIBILITY: { document: 'IAF MD 1:2023', clause: '§3.3.1, §5.1 to §5.6, §6.1.1.1, §4.6', topic: 'Eligibility of a multi-site organisation and of sampling' },
  MD1_CENTRAL_FUNCTION: { document: 'IAF MD 1:2023', clause: '§6.1.3.4', topic: 'Central function audited at the initial and every recertification audit and at least once a calendar year in surveillance' },
  MD1_NOT_SAMPLED: { document: 'IAF MD 1:2023', clause: '§6.2, §7.9.2, §7.10.2', topic: 'Sites audited individually: all at initial and recertification, 30 % (rounded up) at each surveillance, normally different sites' },
  MD1_SAMPLE_INCREASE: { document: 'IAF MD 1:2023', clause: '§6.1.3.5', topic: 'Sample size increased for risk (size, complexity, shifts, variations, complaints, results)' },
  MD1_NEW_SITES: { document: 'IAF MD 1:2023', clause: '§6.1.4, §6.2.3', topic: 'New sites: reviewed before inclusion; included in the next audit' },
  MD1_TEMPORARY_SITES: { document: 'IAF MD 1:2023', clause: '§3.2.1', topic: 'Temporary sites are audited on a sample basis' },
  MD5_QMS_RISK: { document: 'IAF MD 5:2023', clause: 'Annex A, Table QMS 2', topic: 'QMS risk categories by business sector (High, Medium, Low); High needs more time, Low may need less (Note 1)' },
  MD5_EMS_COMPLEXITY: { document: 'IAF MD 5:2023', clause: 'Annex B, Table EMS 2', topic: 'EMS complexity categories by business sector (High, Medium, Low, Limited, Special)' },
  MD5_OHS_RISK: { document: 'IAF MD 5:2023', clause: 'Annex C, Table OH&SMS 2', topic: 'OH&S risk categories by business sector (High, Medium, Low)' },
  MD5_SPECIAL: { document: 'IAF MD 5:2023', clause: 'Annex B (Special category)', topic: 'Special cases are not covered by Table EMS 1; the audit time is developed and justified individually' },
  CLASSIFICATION_OVERRIDE: { document: 'IAF MD 5:2023', clause: 'Annex B and Annex C', topic: 'The CAB documents every case where it lowers the category: override with justification, recorded' },
  MD4_REMOTE: { document: 'IAF MD 4', clause: null, topic: 'Remote (ICT) audit time is recorded; no percentage cap' },
  MD2_TRANSFER: { document: 'IAF MD 2', clause: null, topic: 'Transfer of certification: pre-transfer review, then the current cycle continues' },
  ROUNDING: { document: 'CAB policy', clause: null, topic: 'Audit days rounded to the nearest half day (halves up)' },
}

export interface AuditTimeRules {
  roundingStep: number
  minimumInitialDays: number
  stage1SharePercent: number
  stage1MinDays: number
  surveillanceRatio: number
  surveillanceMinDays: number
  recertificationRatio: number
  recertificationMinDays: number
  maxReductionPercent: number
  minOnSitePercent: number
  imsMaxReductionPercent: number
  sampleCoefficients: { INITIAL: number; SURVEILLANCE: number; RECERTIFICATION: number }
  /** IAF MD 1 §6.1.3.3: recertification sample = √x unless the system proved effective (then 0.8√x). */
  recertificationCoefficientNotEffective: number
  /** IAF MD 1 §6.2.1 / §7.9.2: share of individually audited sites covered at each surveillance. */
  individualSurveillanceShare: number
  maxSiteReductionPercent: number
  maxCentralReductionPercent: number
}

export const AUDIT_TIME_RULES: AuditTimeRules = {
  roundingStep: 0.5,
  minimumInitialDays: 1,
  stage1SharePercent: 30,
  stage1MinDays: 0.5,
  surveillanceRatio: 1 / 3,
  surveillanceMinDays: 1,
  recertificationRatio: 2 / 3,
  recertificationMinDays: 1,
  maxReductionPercent: 30,
  minOnSitePercent: 80,
  imsMaxReductionPercent: 20,
  sampleCoefficients: { INITIAL: 1, SURVEILLANCE: 0.6, RECERTIFICATION: 0.8 },
  recertificationCoefficientNotEffective: 1,
  individualSurveillanceShare: 0.3,
  maxSiteReductionPercent: 50,
  maxCentralReductionPercent: 20,
}

export const CYCLE_TYPES = ['INITIAL', 'RECERTIFICATION', 'TRANSFER'] as const
export type CycleType = (typeof CYCLE_TYPES)[number]

export type AuditStage = 'STAGE_1' | 'STAGE_2' | 'SURVEILLANCE_1' | 'SURVEILLANCE_2' | 'RECERTIFICATION'

export const CYCLE_EVENTS: Record<CycleType, AuditStage[]> = {
  INITIAL: ['STAGE_1', 'STAGE_2', 'SURVEILLANCE_1', 'SURVEILLANCE_2'],
  RECERTIFICATION: ['RECERTIFICATION', 'SURVEILLANCE_1', 'SURVEILLANCE_2'],
  TRANSFER: ['SURVEILLANCE_1', 'SURVEILLANCE_2'],
}

/** Answers of the IAF MD 1 eligibility questions (true met, false not met, null not confirmed). */
export type EligibilityInputKey =
  | 'singleManagementSystem' | 'centralAuthority' | 'centralManagementReview' | 'internalAuditAllSites'
  | 'centralDataAnalysis' | 'legalLink' | 'similarProcesses' | 'noSchemeRestriction' | 'clientAcceptsSampling'

export interface EligibilityCriterion { key: string; input: EligibilityInputKey | null; clause: string }

/** IAF MD 1:2023 eligibility criteria in display order; CENTRAL_FUNCTION is derived from the sites. */
export const MD1_ELIGIBILITY_CRITERIA: EligibilityCriterion[] = [
  { key: 'CENTRAL_FUNCTION', input: null, clause: '§5.2' },
  { key: 'SINGLE_MANAGEMENT_SYSTEM', input: 'singleManagementSystem', clause: '§5.1' },
  { key: 'CENTRAL_AUTHORITY', input: 'centralAuthority', clause: '§5.3' },
  { key: 'CENTRAL_MANAGEMENT_REVIEW', input: 'centralManagementReview', clause: '§5.4' },
  { key: 'INTERNAL_AUDIT_ALL_SITES', input: 'internalAuditAllSites', clause: '§5.5' },
  { key: 'CENTRAL_DATA_ANALYSIS', input: 'centralDataAnalysis', clause: '§5.6' },
  { key: 'LEGAL_LINK', input: 'legalLink', clause: '§3.3.1' },
  { key: 'SIMILAR_PROCESSES', input: 'similarProcesses', clause: '§6.1.1.1' },
  { key: 'NO_SCHEME_RESTRICTION', input: 'noSchemeRestriction', clause: '§4.6, §6.1.1.3' },
  { key: 'CLIENT_ACCEPTS_SAMPLING', input: 'clientAcceptsSampling', clause: '§4.6' },
]
