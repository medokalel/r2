/**
 * Controlled lists for the 10-screen Scheme Owner setup wizard
 * (see the Scheme Owner onboarding deck).
 *
 * Frontend-only mock catalogs — the backend has no lookup endpoints for these
 * yet. Values are stored as IDs so labels stay localizable.
 *
 * TODO: swap each catalog for a real lookup once the backend ships it.
 */

export interface SoSetupOption {
  value: string
  labelKey: string
}

/** Slide 1 — scheme owner type. */
export const SO_OWNER_TYPE_OPTIONS: SoSetupOption[] = [
  { value: 'REGULATORY', labelKey: 'so.setup.ownerTypes.regulatory' },
  { value: 'GOVERNMENT', labelKey: 'so.setup.ownerTypes.government' },
  { value: 'INDUSTRY_ASSOCIATION', labelKey: 'so.setup.ownerTypes.industryAssociation' },
  { value: 'PRIVATE_CERTIFICATION', labelKey: 'so.setup.ownerTypes.privateCertification' },
  { value: 'SUSTAINABILITY_ESG', labelKey: 'so.setup.ownerTypes.sustainabilityEsg' },
  { value: 'RETAILER_BRAND', labelKey: 'so.setup.ownerTypes.retailerBrand' },
  { value: 'OTHER', labelKey: 'so.setup.ownerTypes.other' },
]

export function getYearEstablishedOptions(): { value: string; label: string }[] {
  const currentYear = new Date().getFullYear()
  const years: { value: string; label: string }[] = []
  for (let year = currentYear; year >= 1900; year -= 1) {
    years.push({ value: String(year), label: String(year) })
  }
  return years
}

/** Slide 2 — scheme coverage. */
export const SO_COVERAGE_OPTIONS: SoSetupOption[] = [
  { value: 'NATIONAL', labelKey: 'so.setup.coverage.national' },
  { value: 'REGIONAL', labelKey: 'so.setup.coverage.regional' },
  { value: 'INTERNATIONAL', labelKey: 'so.setup.coverage.international' },
  { value: 'SECTOR_SPECIFIC', labelKey: 'so.setup.coverage.sectorSpecific' },
]

/** Regional/international coverage opens an eligible-countries multi-select. */
export function coverageNeedsCountries(coverage: string): boolean {
  return coverage === 'REGIONAL' || coverage === 'INTERNATIONAL'
}

/** Slide 3 — scheme families. */
export const SO_SCHEME_FAMILY_OPTIONS: SoSetupOption[] = [
  { value: 'REGULATORY', labelKey: 'so.setup.familyOptions.regulatory' },
  { value: 'GOVERNMENT', labelKey: 'so.setup.familyOptions.government' },
  { value: 'INDUSTRY_ASSOCIATION', labelKey: 'so.setup.familyOptions.industryAssociation' },
  { value: 'PRIVATE_CERTIFICATION', labelKey: 'so.setup.familyOptions.privateCertification' },
  { value: 'SUSTAINABILITY_ESG', labelKey: 'so.setup.familyOptions.sustainabilityEsg' },
  { value: 'PRODUCT_PROCESS', labelKey: 'so.setup.familyOptions.productProcess' },
  { value: 'SERVICE', labelKey: 'so.setup.familyOptions.service' },
  { value: 'PERSONNEL', labelKey: 'so.setup.familyOptions.personnel' },
  { value: 'AUDIT_RATING', labelKey: 'so.setup.familyOptions.auditRating' },
]

/** Slide 4 — scheme record status. */
export const SO_SCHEME_STATUS_OPTIONS: SoSetupOption[] = [
  { value: 'DRAFT', labelKey: 'so.setup.schemeStatus.draft' },
  { value: 'ACTIVE', labelKey: 'so.setup.schemeStatus.active' },
  { value: 'UNDER_REVIEW', labelKey: 'so.setup.schemeStatus.underReview' },
  { value: 'SUSPENDED', labelKey: 'so.setup.schemeStatus.suspended' },
  { value: 'WITHDRAWN', labelKey: 'so.setup.schemeStatus.withdrawn' },
  { value: 'RETIRED', labelKey: 'so.setup.schemeStatus.retired' },
]

/** Only an active scheme must carry an effective date; a draft need not. */
export function schemeStatusNeedsEffectiveDate(status: string): boolean {
  return status !== 'DRAFT'
}

/** Slide 5 — assessment activities. */
export const SO_ASSESSMENT_ACTIVITY_OPTIONS: SoSetupOption[] = [
  { value: 'CERTIFICATION', labelKey: 'so.setup.activities.certification' },
  { value: 'INSPECTION', labelKey: 'so.setup.activities.inspection' },
  { value: 'TESTING', labelKey: 'so.setup.activities.testing' },
  { value: 'VALIDATION_VERIFICATION', labelKey: 'so.setup.activities.validationVerification' },
  { value: 'AUDIT_RATING', labelKey: 'so.setup.activities.auditRating' },
]

/**
 * Slide 5 — the CAB requirement standard depends on the assessment activity.
 * Standard names are published identifiers and are not translated.
 */
const CAB_STANDARDS_BY_ACTIVITY: Record<string, string[]> = {
  CERTIFICATION: ['ISO/IEC 17065', 'ISO/IEC 17021-1', 'ISO/IEC 17024'],
  INSPECTION: ['ISO/IEC 17020'],
  TESTING: ['ISO/IEC 17025'],
  VALIDATION_VERIFICATION: ['ISO/IEC 17029'],
  AUDIT_RATING: ['ISO/IEC 17021-1', 'ISO/IEC 17065'],
}

const ALL_CAB_STANDARDS = [
  'ISO/IEC 17021-1',
  'ISO/IEC 17065',
  'ISO/IEC 17024',
  'ISO/IEC 17020',
  'ISO/IEC 17025',
  'ISO/IEC 17029',
]

export function getCabStandardOptions(activities: string[]): { value: string; label: string }[] {
  const matched = activities.flatMap((activity) => CAB_STANDARDS_BY_ACTIVITY[activity] ?? [])
  const relevant = matched.length > 0 ? matched : ALL_CAB_STANDARDS
  return [...new Set([...relevant, ...ALL_CAB_STANDARDS])].map((standard) => ({
    value: standard,
    label: standard,
  }))
}

/** Slide 5 — what the assessment produces. */
export const SO_OUTCOME_OPTIONS: SoSetupOption[] = [
  { value: 'CERTIFICATE', labelKey: 'so.setup.outcomes.certificate' },
  { value: 'LICENCE', labelKey: 'so.setup.outcomes.licence' },
  { value: 'CERTIFICATE_AND_LICENCE', labelKey: 'so.setup.outcomes.certificateAndLicence' },
  { value: 'MARK', labelKey: 'so.setup.outcomes.mark' },
  { value: 'RATING', labelKey: 'so.setup.outcomes.rating' },
  { value: 'REPORT', labelKey: 'so.setup.outcomes.report' },
]

/** Slides 4/5/7 — shared validity/cycle lengths. */
export const SO_CYCLE_OPTIONS: SoSetupOption[] = [
  { value: '1', labelKey: 'so.setup.cycle.oneYear' },
  { value: '2', labelKey: 'so.setup.cycle.twoYears' },
  { value: '3', labelKey: 'so.setup.cycle.threeYears' },
  { value: '4', labelKey: 'so.setup.cycle.fourYears' },
  { value: '5', labelKey: 'so.setup.cycle.fiveYears' },
  { value: 'CUSTOM', labelKey: 'so.setup.cycle.custom' },
]

/** Slide 6 — eligible applicant types. */
export const SO_APPLICANT_TYPE_OPTIONS: SoSetupOption[] = [
  { value: 'MANUFACTURER', labelKey: 'so.setup.applicants.manufacturer' },
  { value: 'PROCESSOR', labelKey: 'so.setup.applicants.processor' },
  { value: 'SERVICE_PROVIDER', labelKey: 'so.setup.applicants.serviceProvider' },
  { value: 'FARM', labelKey: 'so.setup.applicants.farm' },
  { value: 'ORGANIZATION', labelKey: 'so.setup.applicants.organization' },
  { value: 'PERSON', labelKey: 'so.setup.applicants.person' },
  { value: 'CAB', labelKey: 'so.setup.applicants.cab' },
  { value: 'OTHER', labelKey: 'so.setup.applicants.other' },
]

/** Slide 6 — scope classification families. */
export const SO_SCOPE_CLASSIFICATION_OPTIONS: SoSetupOption[] = [
  { value: 'FOOD_AGRICULTURE', labelKey: 'so.setup.scopeClasses.foodAgriculture' },
  { value: 'MANUFACTURED_GOODS', labelKey: 'so.setup.scopeClasses.manufacturedGoods' },
  { value: 'TEXTILES', labelKey: 'so.setup.scopeClasses.textiles' },
  { value: 'CHEMICALS', labelKey: 'so.setup.scopeClasses.chemicals' },
  { value: 'CONSTRUCTION', labelKey: 'so.setup.scopeClasses.construction' },
  { value: 'ENERGY', labelKey: 'so.setup.scopeClasses.energy' },
  { value: 'SERVICES', labelKey: 'so.setup.scopeClasses.services' },
  { value: 'FORESTRY', labelKey: 'so.setup.scopeClasses.forestry' },
]

/** Slide 6 — geographic limits. */
export const SO_GEOGRAPHY_OPTIONS: SoSetupOption[] = [
  { value: 'GLOBAL', labelKey: 'so.setup.geography.global' },
  { value: 'SELECTED_COUNTRIES', labelKey: 'so.setup.geography.selectedCountries' },
]

/** Slide 7 — how a CAB gets approved to operate the scheme. */
export const SO_APPROVAL_ROUTE_OPTIONS: SoSetupOption[] = [
  { value: 'DOCUMENT_REVIEW', labelKey: 'so.setup.approvalRoutes.documentReview' },
  { value: 'ASSESSMENT', labelKey: 'so.setup.approvalRoutes.assessment' },
  { value: 'APPLICATION_AND_ASSESSMENT', labelKey: 'so.setup.approvalRoutes.applicationAndAssessment' },
  { value: 'RECOGNITION_OF_ACCREDITATION', labelKey: 'so.setup.approvalRoutes.recognitionOfAccreditation' },
  { value: 'WITNESS', labelKey: 'so.setup.approvalRoutes.witness' },
  { value: 'COMBINED', labelKey: 'so.setup.approvalRoutes.combined' },
]

/** The recognition route is only meaningful with accreditation evidence. */
export function approvalRouteNeedsAccreditation(route: string): boolean {
  return route === 'RECOGNITION_OF_ACCREDITATION'
}

/** Slide 7 — surveillance frequency. */
export const SO_SURVEILLANCE_OPTIONS: SoSetupOption[] = [
  { value: 'SEMIANNUAL', labelKey: 'so.setup.surveillance.semiannual' },
  { value: 'ANNUAL', labelKey: 'so.setup.surveillance.annual' },
  { value: 'BIENNIAL', labelKey: 'so.setup.surveillance.biennial' },
  { value: 'RISK_BASED', labelKey: 'so.setup.surveillance.riskBased' },
]

/** Slide 7 — licence number tokens. */
export const SO_LICENCE_TOKENS = ['{SCHEME}', '{CAB}', '{YEAR}', '{SEQ}'] as const

/** Slide 8 — where the scheme mark may be used. */
export const SO_MARK_USE_OPTIONS: SoSetupOption[] = [
  { value: 'PRODUCT', labelKey: 'so.setup.markUse.product' },
  { value: 'PACKAGING', labelKey: 'so.setup.markUse.packaging' },
  { value: 'CERTIFICATE', labelKey: 'so.setup.markUse.certificate' },
  { value: 'WEBSITE', labelKey: 'so.setup.markUse.website' },
  { value: 'MARKETING', labelKey: 'so.setup.markUse.marketing' },
  { value: 'DIGITAL_BADGE', labelKey: 'so.setup.markUse.digitalBadge' },
]

/** Slide 9 — scheme governance roles. */
export type SoRoleRequirement = 'OWNER' | 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL'

export interface SoRoleOption {
  value: string
  labelKey: string
  requirement: SoRoleRequirement
}

export const SO_ROLE_INVITE_OPTIONS: SoRoleOption[] = [
  { value: 'WORKSPACE_OWNER', labelKey: 'so.setup.roles.workspaceOwner', requirement: 'OWNER' },
  { value: 'SCHEME_MANAGER', labelKey: 'so.setup.roles.schemeManager', requirement: 'REQUIRED' },
  { value: 'TECHNICAL_COMMITTEE_LEAD', labelKey: 'so.setup.roles.technicalCommitteeLead', requirement: 'RECOMMENDED' },
  { value: 'LICENSING_ADMINISTRATOR', labelKey: 'so.setup.roles.licensingAdministrator', requirement: 'OPTIONAL' },
  { value: 'COMPLAINTS_MANAGER', labelKey: 'so.setup.roles.complaintsManager', requirement: 'OPTIONAL' },
  { value: 'DOCUMENT_CONTROLLER', labelKey: 'so.setup.roles.documentController', requirement: 'OPTIONAL' },
]
