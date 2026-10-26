/**
 * Controlled lists for the 10-screen Internal Audit setup wizard
 * (see the Internal Audit onboarding deck).
 *
 * Frontend-only mock catalogs — the backend has no lookup endpoints for these
 * yet. Values are stored as IDs so labels stay localizable.
 *
 * TODO: swap each catalog for a real lookup once the backend ships it.
 */

export interface IaSetupOption {
  value: string
  labelKey: string
}

/** Slide 1 — industry sector. */
export const IA_INDUSTRY_OPTIONS: IaSetupOption[] = [
  { value: 'FOOD_MANUFACTURING', labelKey: 'ia.setup.industries.foodManufacturing' },
  { value: 'MANUFACTURING', labelKey: 'ia.setup.industries.manufacturing' },
  { value: 'CONSTRUCTION', labelKey: 'ia.setup.industries.construction' },
  { value: 'HEALTHCARE', labelKey: 'ia.setup.industries.healthcare' },
  { value: 'ENERGY_UTILITIES', labelKey: 'ia.setup.industries.energyUtilities' },
  { value: 'TRANSPORT_LOGISTICS', labelKey: 'ia.setup.industries.transportLogistics' },
  { value: 'INFORMATION_TECHNOLOGY', labelKey: 'ia.setup.industries.informationTechnology' },
  { value: 'FINANCIAL_SERVICES', labelKey: 'ia.setup.industries.financialServices' },
  { value: 'EDUCATION', labelKey: 'ia.setup.industries.education' },
  { value: 'PUBLIC_SECTOR', labelKey: 'ia.setup.industries.publicSector' },
  { value: 'OTHER', labelKey: 'ia.setup.industries.other' },
]

/** Slide 1 — employee range. */
export const IA_EMPLOYEE_RANGE_OPTIONS: { value: string; label: string }[] = [
  { value: '1_9', label: '1 to 9' },
  { value: '10_49', label: '10 to 49' },
  { value: '50_249', label: '50 to 249' },
  { value: '250_499', label: '250 to 499' },
  { value: '500_999', label: '500 to 999' },
  { value: '1000_PLUS', label: '1000+' },
]

/** Slide 2 — location type within the audit universe. */
export const IA_LOCATION_TYPE_OPTIONS: IaSetupOption[] = [
  { value: 'HQ', labelKey: 'ia.setup.locationTypes.hq' },
  { value: 'PLANT', labelKey: 'ia.setup.locationTypes.plant' },
  { value: 'BRANCH', labelKey: 'ia.setup.locationTypes.branch' },
  { value: 'WAREHOUSE', labelKey: 'ia.setup.locationTypes.warehouse' },
  { value: 'PROJECT', labelKey: 'ia.setup.locationTypes.project' },
  { value: 'REMOTE', labelKey: 'ia.setup.locationTypes.remote' },
]

/** Slide 3 — management system standards. Published names, not translated. */
export const IA_STANDARD_OPTIONS: { value: string; label: string }[] = [
  { value: 'ISO_9001', label: 'ISO 9001' },
  { value: 'ISO_14001', label: 'ISO 14001' },
  { value: 'ISO_45001', label: 'ISO 45001' },
  { value: 'ISO_22000', label: 'ISO 22000' },
  { value: 'ISO_27001', label: 'ISO 27001' },
  { value: 'ISO_50001', label: 'ISO 50001' },
  { value: 'ISO_22301', label: 'ISO 22301' },
]

/** Slide 3 — corporate processes / assurance areas. */
export const IA_PROCESS_OPTIONS: IaSetupOption[] = [
  { value: 'LEADERSHIP', labelKey: 'ia.setup.processes.leadership' },
  { value: 'SALES', labelKey: 'ia.setup.processes.sales' },
  { value: 'PROCUREMENT', labelKey: 'ia.setup.processes.procurement' },
  { value: 'HR', labelKey: 'ia.setup.processes.hr' },
  { value: 'IT', labelKey: 'ia.setup.processes.it' },
  { value: 'OPERATIONS', labelKey: 'ia.setup.processes.operations' },
  { value: 'FINANCE', labelKey: 'ia.setup.processes.finance' },
  { value: 'COMPLIANCE', labelKey: 'ia.setup.processes.compliance' },
  { value: 'SUPPORT', labelKey: 'ia.setup.processes.support' },
]

/** Slide 4 — criteria type. */
export const IA_CRITERIA_TYPE_OPTIONS: IaSetupOption[] = [
  { value: 'STANDARD', labelKey: 'ia.setup.criteriaTypes.standard' },
  { value: 'POLICY', labelKey: 'ia.setup.criteriaTypes.policy' },
  { value: 'PROCEDURE', labelKey: 'ia.setup.criteriaTypes.procedure' },
  { value: 'LAW', labelKey: 'ia.setup.criteriaTypes.law' },
  { value: 'CONTRACT', labelKey: 'ia.setup.criteriaTypes.contract' },
  { value: 'CUSTOMER_REQUIREMENT', labelKey: 'ia.setup.criteriaTypes.customerRequirement' },
  { value: 'OTHER', labelKey: 'ia.setup.criteriaTypes.other' },
]

/** Slides 4 & 6 — audit cycle / frequency. */
export const IA_FREQUENCY_OPTIONS: IaSetupOption[] = [
  { value: 'MONTHLY', labelKey: 'ia.setup.frequency.monthly' },
  { value: 'QUARTERLY', labelKey: 'ia.setup.frequency.quarterly' },
  { value: 'SEMIANNUAL', labelKey: 'ia.setup.frequency.semiannual' },
  { value: 'ANNUAL', labelKey: 'ia.setup.frequency.annual' },
  { value: 'BIENNIAL', labelKey: 'ia.setup.frequency.biennial' },
  { value: 'RISK_BASED', labelKey: 'ia.setup.frequency.riskBased' },
]

/** Slide 5 — risk scale. */
export const IA_RISK_SCALE_OPTIONS: IaSetupOption[] = [
  { value: 'LOW_MEDIUM_HIGH', labelKey: 'ia.setup.riskScales.lowMediumHigh' },
  { value: 'LOW_MEDIUM_HIGH_CRITICAL', labelKey: 'ia.setup.riskScales.lowMediumHighCritical' },
  { value: 'NUMERIC_1_5', labelKey: 'ia.setup.riskScales.numeric' },
]

/** Slide 5 — inherent risk factors. */
export const IA_RISK_FACTOR_OPTIONS: IaSetupOption[] = [
  { value: 'IMPACT', labelKey: 'ia.setup.riskFactors.impact' },
  { value: 'CHANGE', labelKey: 'ia.setup.riskFactors.change' },
  { value: 'COMPLEXITY', labelKey: 'ia.setup.riskFactors.complexity' },
  { value: 'PREVIOUS_FINDINGS', labelKey: 'ia.setup.riskFactors.previousFindings' },
  { value: 'KPI_PERFORMANCE', labelKey: 'ia.setup.riskFactors.kpiPerformance' },
  { value: 'REGULATORY_EXPOSURE', labelKey: 'ia.setup.riskFactors.regulatoryExposure' },
]

/** Slide 5 — how previous findings feed the score. */
export const IA_PREVIOUS_FINDINGS_OPTIONS: IaSetupOption[] = [
  { value: 'OPEN_AND_OVERDUE', labelKey: 'ia.setup.previousFindings.openAndOverdue' },
  { value: 'ALL_FINDINGS', labelKey: 'ia.setup.previousFindings.all' },
  { value: 'MAJOR_ONLY', labelKey: 'ia.setup.previousFindings.majorOnly' },
  { value: 'IGNORE', labelKey: 'ia.setup.previousFindings.ignore' },
]

/** Slide 7 — finding classification set. */
export const IA_FINDING_TYPE_OPTIONS: IaSetupOption[] = [
  { value: 'MAJOR_MINOR_OFI', labelKey: 'ia.setup.findingTypes.majorMinorOfi' },
  { value: 'MAJOR_MINOR_OBS_OFI', labelKey: 'ia.setup.findingTypes.majorMinorObsOfi' },
  { value: 'NC_OBSERVATION', labelKey: 'ia.setup.findingTypes.ncObservation' },
]

/** Slide 7 — verification method. */
export const IA_VERIFICATION_OPTIONS: IaSetupOption[] = [
  { value: 'EVIDENCE_AND_FOLLOW_UP', labelKey: 'ia.setup.verification.evidenceAndFollowUp' },
  { value: 'EVIDENCE_ONLY', labelKey: 'ia.setup.verification.evidenceOnly' },
  { value: 'FOLLOW_UP_AUDIT', labelKey: 'ia.setup.verification.followUpAudit' },
]

/** Slide 8 — number format tokens. */
export const IA_NUMBER_TOKENS = ['{YEAR}', '{SITE}', '{PROCESS}', '{SEQ}'] as const
export const IA_FINDING_TOKENS = ['{AUDIT}', '{YEAR}', '{SEQ}'] as const

export const IA_TEMPLATE_OPTIONS: IaSetupOption[] = [
  { value: 'ICASCO_DEFAULT', labelKey: 'ia.setup.templates.default' },
  { value: 'UPLOAD', labelKey: 'ia.setup.templates.upload' },
  { value: 'CREATE_LATER', labelKey: 'ia.setup.templates.createLater' },
]

export const IA_REPORT_LANGUAGE_OPTIONS: IaSetupOption[] = [
  { value: 'EN', labelKey: 'ia.setup.reportLanguages.english' },
  { value: 'AR', labelKey: 'ia.setup.reportLanguages.arabic' },
  { value: 'EN_AR', labelKey: 'ia.setup.reportLanguages.bilingual' },
]

/** Slide 9 — internal audit roles. */
export type IaRoleRequirement = 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL'

export interface IaRoleOption {
  value: string
  labelKey: string
  requirement: IaRoleRequirement
  /** Deferred roles are imported in bulk later rather than invited one by one. */
  bulkImport?: boolean
}

export const IA_ROLE_INVITE_OPTIONS: IaRoleOption[] = [
  { value: 'AUDIT_PROGRAMME_MANAGER', labelKey: 'ia.setup.roles.programmeManager', requirement: 'REQUIRED' },
  { value: 'LEAD_AUDITOR', labelKey: 'ia.setup.roles.leadAuditor', requirement: 'REQUIRED' },
  { value: 'AUDITORS', labelKey: 'ia.setup.roles.auditors', requirement: 'RECOMMENDED' },
  { value: 'TECHNICAL_EXPERTS', labelKey: 'ia.setup.roles.technicalExperts', requirement: 'OPTIONAL' },
  { value: 'AUDIT_COMMITTEE_VIEWER', labelKey: 'ia.setup.roles.committeeViewer', requirement: 'OPTIONAL' },
  { value: 'PROCESS_OWNERS', labelKey: 'ia.setup.roles.processOwners', requirement: 'OPTIONAL', bulkImport: true },
]
