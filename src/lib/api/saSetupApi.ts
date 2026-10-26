/**
 * Controlled lists for the 10-screen Supplier Audit setup wizard
 * (see the Supplier Audit onboarding deck).
 *
 * Frontend-only mock catalogs — the backend has no lookup endpoints for these
 * yet. Values are stored as IDs so labels stay localizable.
 *
 * TODO: swap each catalog for a real lookup once the backend ships it.
 */

export interface SaSetupOption {
  value: string
  labelKey: string
}

/** Slide 1 — buying organization industry. */
export const SA_INDUSTRY_OPTIONS: SaSetupOption[] = [
  { value: 'RETAIL_DISTRIBUTION', labelKey: 'sa.setup.industries.retailDistribution' },
  { value: 'FOOD_BEVERAGE', labelKey: 'sa.setup.industries.foodBeverage' },
  { value: 'MANUFACTURING', labelKey: 'sa.setup.industries.manufacturing' },
  { value: 'PHARMACEUTICALS', labelKey: 'sa.setup.industries.pharmaceuticals' },
  { value: 'AUTOMOTIVE', labelKey: 'sa.setup.industries.automotive' },
  { value: 'CONSTRUCTION', labelKey: 'sa.setup.industries.construction' },
  { value: 'ENERGY_UTILITIES', labelKey: 'sa.setup.industries.energyUtilities' },
  { value: 'HEALTHCARE', labelKey: 'sa.setup.industries.healthcare' },
  { value: 'TECHNOLOGY', labelKey: 'sa.setup.industries.technology' },
  { value: 'OTHER', labelKey: 'sa.setup.industries.other' },
]

/** Slide 1 — annual supplier count. */
export const SA_SUPPLIER_COUNT_OPTIONS: { value: string; label: string }[] = [
  { value: '1_49', label: '1 to 49' },
  { value: '50_249', label: '50 to 249' },
  { value: '250_499', label: '250 to 499' },
  { value: '500_999', label: '500 to 999' },
  { value: '1000_PLUS', label: '1000+' },
]

/** Slide 2 — supplier approval model. */
export const SA_APPROVAL_MODEL_OPTIONS: SaSetupOption[] = [
  { value: 'CENTRALIZED', labelKey: 'sa.setup.approvalModels.centralized' },
  { value: 'DECENTRALIZED', labelKey: 'sa.setup.approvalModels.decentralized' },
  { value: 'HYBRID', labelKey: 'sa.setup.approvalModels.hybrid' },
]

/** Site-specific suppliers only make sense outside a fully centralized model. */
export function allowsSiteSpecificSuppliers(model: string): boolean {
  return model === 'DECENTRALIZED' || model === 'HYBRID'
}

/** Slide 3 — supplier categories. */
export const SA_CATEGORY_OPTIONS: SaSetupOption[] = [
  { value: 'RAW_MATERIALS', labelKey: 'sa.setup.categories.rawMaterials' },
  { value: 'PACKAGING', labelKey: 'sa.setup.categories.packaging' },
  { value: 'LOGISTICS', labelKey: 'sa.setup.categories.logistics' },
  { value: 'CLEANING', labelKey: 'sa.setup.categories.cleaning' },
  { value: 'MAINTENANCE', labelKey: 'sa.setup.categories.maintenance' },
  { value: 'IT_SERVICES', labelKey: 'sa.setup.categories.itServices' },
  { value: 'CONTRACTORS', labelKey: 'sa.setup.categories.contractors' },
  { value: 'CRITICAL_EQUIPMENT', labelKey: 'sa.setup.categories.criticalEquipment' },
  { value: 'PROFESSIONAL_SERVICES', labelKey: 'sa.setup.categories.professionalServices' },
  { value: 'UTILITIES', labelKey: 'sa.setup.categories.utilities' },
]

/** Slide 4 — risk level scale. */
export const SA_RISK_LEVEL_OPTIONS: SaSetupOption[] = [
  { value: 'LOW_MEDIUM_HIGH', labelKey: 'sa.setup.riskLevels.lowMediumHigh' },
  { value: 'LOW_MEDIUM_HIGH_CRITICAL', labelKey: 'sa.setup.riskLevels.lowMediumHighCritical' },
  { value: 'NUMERIC_1_5', labelKey: 'sa.setup.riskLevels.numeric' },
]

/** Slide 4 — risk factors. */
export const SA_RISK_FACTOR_OPTIONS: SaSetupOption[] = [
  { value: 'CRITICALITY', labelKey: 'sa.setup.riskFactors.criticality' },
  { value: 'SPEND', labelKey: 'sa.setup.riskFactors.spend' },
  { value: 'COUNTRY', labelKey: 'sa.setup.riskFactors.country' },
  { value: 'REGULATORY', labelKey: 'sa.setup.riskFactors.regulatory' },
  { value: 'PERFORMANCE', labelKey: 'sa.setup.riskFactors.performance' },
  { value: 'SINGLE_SOURCE', labelKey: 'sa.setup.riskFactors.singleSource' },
  { value: 'INCIDENT_HISTORY', labelKey: 'sa.setup.riskFactors.incidentHistory' },
]

/** Slide 5 — qualification route. */
export const SA_QUALIFICATION_ROUTE_OPTIONS: SaSetupOption[] = [
  { value: 'QUESTIONNAIRE', labelKey: 'sa.setup.qualificationRoutes.questionnaire' },
  { value: 'QUESTIONNAIRE_AND_DOCUMENTS', labelKey: 'sa.setup.qualificationRoutes.questionnaireAndDocuments' },
  { value: 'DOCUMENT_REVIEW', labelKey: 'sa.setup.qualificationRoutes.documentReview' },
  { value: 'AUDIT_REQUIRED', labelKey: 'sa.setup.qualificationRoutes.auditRequired' },
]

/** Slide 5 — evidence types collected at qualification. */
export const SA_EVIDENCE_OPTIONS: SaSetupOption[] = [
  { value: 'LICENCE', labelKey: 'sa.setup.evidence.licence' },
  { value: 'ISO_CERTIFICATE', labelKey: 'sa.setup.evidence.isoCertificate' },
  { value: 'INSURANCE', labelKey: 'sa.setup.evidence.insurance' },
  { value: 'FINANCIAL', labelKey: 'sa.setup.evidence.financial' },
  { value: 'PRODUCT_SPECS', labelKey: 'sa.setup.evidence.productSpecs' },
  { value: 'ESG', labelKey: 'sa.setup.evidence.esg' },
  { value: 'OTHER', labelKey: 'sa.setup.evidence.other' },
]

/** Slides 5/7 — approval validity lengths. */
export const SA_VALIDITY_OPTIONS: SaSetupOption[] = [
  { value: '1', labelKey: 'sa.setup.validity.oneYear' },
  { value: '2', labelKey: 'sa.setup.validity.twoYears' },
  { value: '3', labelKey: 'sa.setup.validity.threeYears' },
  { value: 'CUSTOM', labelKey: 'sa.setup.validity.custom' },
]

/** Slide 6 — audit types. */
export const SA_AUDIT_TYPE_OPTIONS: SaSetupOption[] = [
  { value: 'INITIAL_QUALIFICATION', labelKey: 'sa.setup.auditTypes.initialQualification' },
  { value: 'ROUTINE_SURVEILLANCE', labelKey: 'sa.setup.auditTypes.routineSurveillance' },
  { value: 'REAPPROVAL', labelKey: 'sa.setup.auditTypes.reapproval' },
  { value: 'FOR_CAUSE', labelKey: 'sa.setup.auditTypes.forCause' },
  { value: 'INCIDENT', labelKey: 'sa.setup.auditTypes.incident' },
  { value: 'FOLLOW_UP', labelKey: 'sa.setup.auditTypes.followUp' },
]

/** Slide 6 — audit delivery mode. */
export const SA_AUDIT_MODE_OPTIONS: SaSetupOption[] = [
  { value: 'ON_SITE', labelKey: 'sa.setup.auditModes.onSite' },
  { value: 'REMOTE', labelKey: 'sa.setup.auditModes.remote' },
  { value: 'HYBRID', labelKey: 'sa.setup.auditModes.hybrid' },
  { value: 'DESKTOP', labelKey: 'sa.setup.auditModes.desktop' },
]

/** Slide 6 — audit criteria sources. */
export const SA_AUDIT_CRITERIA_OPTIONS: SaSetupOption[] = [
  { value: 'SUPPLIER_CODE', labelKey: 'sa.setup.auditCriteria.supplierCode' },
  { value: 'CONTRACT', labelKey: 'sa.setup.auditCriteria.contract' },
  { value: 'STANDARD', labelKey: 'sa.setup.auditCriteria.standard' },
  { value: 'LEGAL', labelKey: 'sa.setup.auditCriteria.legal' },
  { value: 'CUSTOMER_SPECIFIC', labelKey: 'sa.setup.auditCriteria.customerSpecific' },
]

/** Slide 6 — audit frequency. */
export const SA_AUDIT_FREQUENCY_OPTIONS: SaSetupOption[] = [
  { value: 'ANNUAL', labelKey: 'sa.setup.auditFrequency.annual' },
  { value: 'BIENNIAL', labelKey: 'sa.setup.auditFrequency.biennial' },
  { value: 'RISK_BASED', labelKey: 'sa.setup.auditFrequency.riskBased' },
  { value: 'BY_CATEGORY', labelKey: 'sa.setup.auditFrequency.byCategory' },
]

/** Slide 7 — audit score scale. */
export const SA_SCORE_SCALE_OPTIONS: SaSetupOption[] = [
  { value: 'PERCENTAGE', labelKey: 'sa.setup.scoreScales.percentage' },
  { value: 'ONE_TO_FIVE', labelKey: 'sa.setup.scoreScales.oneToFive' },
  { value: 'PASS_FAIL', labelKey: 'sa.setup.scoreScales.passFail' },
  { value: 'WEIGHTED', labelKey: 'sa.setup.scoreScales.weighted' },
]

/** Slide 7 — what a critical finding does to the score. */
export const SA_CRITICAL_RULE_OPTIONS: SaSetupOption[] = [
  { value: 'AUTOMATIC_HOLD', labelKey: 'sa.setup.criticalRules.automaticHold' },
  { value: 'AUTOMATIC_REJECT', labelKey: 'sa.setup.criticalRules.automaticReject' },
  { value: 'CONDITIONAL_ONLY', labelKey: 'sa.setup.criticalRules.conditionalOnly' },
  { value: 'SCORE_ONLY', labelKey: 'sa.setup.criticalRules.scoreOnly' },
]

/** Slide 8 — finding classification set. */
export const SA_FINDING_CLASS_OPTIONS: SaSetupOption[] = [
  { value: 'CRITICAL_MAJOR_MINOR', labelKey: 'sa.setup.findingClasses.criticalMajorMinor' },
  { value: 'CRITICAL_MAJOR_MINOR_OBS', labelKey: 'sa.setup.findingClasses.criticalMajorMinorObs' },
  { value: 'MAJOR_MINOR', labelKey: 'sa.setup.findingClasses.majorMinor' },
]

/** Slide 8 — when a follow-up audit is triggered. */
export const SA_FOLLOW_UP_TRIGGER_OPTIONS: SaSetupOption[] = [
  { value: 'CRITICAL_OR_REPEATED', labelKey: 'sa.setup.followUpTriggers.criticalOrRepeated' },
  { value: 'CRITICAL_ONLY', labelKey: 'sa.setup.followUpTriggers.criticalOnly' },
  { value: 'ALWAYS', labelKey: 'sa.setup.followUpTriggers.always' },
  { value: 'NEVER', labelKey: 'sa.setup.followUpTriggers.never' },
]

/** Slide 9 — supplier assurance roles. */
export type SaRoleRequirement = 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL'

export interface SaRoleOption {
  value: string
  labelKey: string
  requirement: SaRoleRequirement
}

export const SA_ROLE_INVITE_OPTIONS: SaRoleOption[] = [
  { value: 'ASSURANCE_MANAGER', labelKey: 'sa.setup.roles.assuranceManager', requirement: 'REQUIRED' },
  { value: 'PROCUREMENT_MANAGER', labelKey: 'sa.setup.roles.procurementManager', requirement: 'REQUIRED' },
  { value: 'LEAD_SUPPLIER_AUDITOR', labelKey: 'sa.setup.roles.leadAuditor', requirement: 'RECOMMENDED' },
  { value: 'CATEGORY_MANAGERS', labelKey: 'sa.setup.roles.categoryManagers', requirement: 'OPTIONAL' },
  { value: 'TECHNICAL_EXPERTS', labelKey: 'sa.setup.roles.technicalExperts', requirement: 'OPTIONAL' },
  { value: 'APPROVAL_COMMITTEE', labelKey: 'sa.setup.roles.approvalCommittee', requirement: 'OPTIONAL' },
]
