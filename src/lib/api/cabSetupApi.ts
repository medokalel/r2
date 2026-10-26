/**
 * Controlled lists for the 10-screen CAB setup wizard.
 *
 * Everything here is a frontend-only mock catalog — the backend does not expose
 * lookup endpoints for these yet. Values are stored as IDs (never display
 * labels) so the labels stay localizable, per the deck's implementation rules.
 *
 * TODO: replace each catalog with a real lookup once the backend ships it; the
 * step components read through these helpers and need no changes.
 */
import { catalogForActivities } from '@/lib/standardsCatalog'
import { ACCREDITATION_BODY_OTHER_VALUE, accreditationBodyLabel, sortedAccreditationBodies } from '@/lib/accreditationBodies'

export interface CabSetupOption {
  value: string
  labelKey: string
}

/** Slide 1 — CAB activity. Mirrors the CONFORMITY_ASSESSMENT_BODY sub-options plus Biobank. */
export const CAB_ACTIVITY_OPTIONS: CabSetupOption[] = [
  { value: 'MS_CERTIFICATION_BODY', labelKey: 'cab.setup.activities.msCertificationBody' },
  { value: 'PRODUCT_PROCESS_SERVICE_CERTIFICATION_BODY', labelKey: 'cab.setup.activities.productCertificationBody' },
  { value: 'PERSONNEL_CERTIFICATION_BODY', labelKey: 'cab.setup.activities.personnelCertificationBody' },
  { value: 'INSPECTION_BODY', labelKey: 'cab.setup.activities.inspectionBody' },
  { value: 'TESTING_LABORATORY', labelKey: 'cab.setup.activities.testingLaboratory' },
  { value: 'CALIBRATION_LABORATORY', labelKey: 'cab.setup.activities.calibrationLaboratory' },
  { value: 'MEDICAL_LABORATORY', labelKey: 'cab.setup.activities.medicalLaboratory' },
  { value: 'VALIDATION_VERIFICATION_BODY', labelKey: 'cab.setup.activities.validationVerificationBody' },
  { value: 'PROFICIENCY_TESTING_PROVIDER', labelKey: 'cab.setup.activities.proficiencyTestingProvider' },
  { value: 'REFERENCE_MATERIAL_PRODUCER', labelKey: 'cab.setup.activities.referenceMaterialProducer' },
  { value: 'BIOBANK', labelKey: 'cab.setup.activities.biobank' },
]

/** Slide 1 — year established: current year back to 1900. */
export function getYearEstablishedOptions(): { value: string; label: string }[] {
  const currentYear = new Date().getFullYear()
  const years: { value: string; label: string }[] = []
  for (let year = currentYear; year >= 1900; year -= 1) {
    years.push({ value: String(year), label: String(year) })
  }
  return years
}

/** Slide 2 — location type. */
export const LOCATION_TYPE_OPTIONS: CabSetupOption[] = [
  { value: 'HEAD_OFFICE', labelKey: 'cab.setup.locationTypes.headOffice' },
  { value: 'BRANCH', labelKey: 'cab.setup.locationTypes.branch' },
  { value: 'CRITICAL_LOCATION', labelKey: 'cab.setup.locationTypes.criticalLocation' },
  { value: 'LABORATORY', labelKey: 'cab.setup.locationTypes.laboratory' },
  { value: 'INSPECTION_OFFICE', labelKey: 'cab.setup.locationTypes.inspectionOffice' },
  { value: 'REMOTE_OFFICE', labelKey: 'cab.setup.locationTypes.remoteOffice' },
]

/** Slide 3 — overall accreditation status. */
export const ACCREDITATION_STATUS_OPTIONS: CabSetupOption[] = [
  { value: 'ACCREDITED', labelKey: 'cab.setup.accreditationStatus.options.accredited' },
  { value: 'APPLICANT', labelKey: 'cab.setup.accreditationStatus.options.applicant' },
  { value: 'UNACCREDITED', labelKey: 'cab.setup.accreditationStatus.options.unaccredited' },
]

/** Slide 4 — accreditation bodies: the global catalog (src/lib/accreditationBodies.ts) plus Other. */
export const ACCREDITATION_BODY_OPTIONS: { value: string; label: string }[] = [
  ...sortedAccreditationBodies().map((body) => ({ value: body.value, label: accreditationBodyLabel(body) })),
  { value: ACCREDITATION_BODY_OTHER_VALUE, label: 'Other' },
]

/**
 * Slide 4 — accreditation standard. The applicable standard depends on the CAB
 * activity; anything not listed falls back to the full set.
 */
const ACCREDITATION_STANDARDS_BY_ACTIVITY: Record<string, string[]> = {
  MS_CERTIFICATION_BODY: ['ISO/IEC 17021-1'],
  PRODUCT_PROCESS_SERVICE_CERTIFICATION_BODY: ['ISO/IEC 17065'],
  PERSONNEL_CERTIFICATION_BODY: ['ISO/IEC 17024'],
  INSPECTION_BODY: ['ISO/IEC 17020'],
  TESTING_LABORATORY: ['ISO/IEC 17025'],
  CALIBRATION_LABORATORY: ['ISO/IEC 17025'],
  MEDICAL_LABORATORY: ['ISO 15189'],
  VALIDATION_VERIFICATION_BODY: ['ISO/IEC 17029'],
  PROFICIENCY_TESTING_PROVIDER: ['ISO/IEC 17043'],
  REFERENCE_MATERIAL_PRODUCER: ['ISO 17034'],
  BIOBANK: ['ISO 20387'],
}

const ALL_ACCREDITATION_STANDARDS = [
  'ISO/IEC 17021-1',
  'ISO/IEC 17065',
  'ISO/IEC 17024',
  'ISO/IEC 17020',
  'ISO/IEC 17025',
  'ISO 15189',
  'ISO/IEC 17029',
  'ISO/IEC 17043',
  'ISO 17034',
  'ISO 20387',
]

/** Standards relevant to the chosen CAB activities, widest-first, de-duplicated. */
export function getAccreditationStandardOptions(activities: string[]): { value: string; label: string }[] {
  const matched = activities.flatMap((activity) => ACCREDITATION_STANDARDS_BY_ACTIVITY[activity] ?? [])
  const relevant = matched.length > 0 ? matched : ALL_ACCREDITATION_STANDARDS
  const ordered = [...new Set([...relevant, ...ALL_ACCREDITATION_STANDARDS])]
  return ordered.map((standard) => ({ value: standard, label: standard }))
}

/** Slide 4 — per-record status. */
export const ACCREDITATION_RECORD_STATUS_OPTIONS: CabSetupOption[] = [
  { value: 'ACTIVE', labelKey: 'cab.setup.recordStatus.active' },
  { value: 'SUSPENDED', labelKey: 'cab.setup.recordStatus.suspended' },
  { value: 'WITHDRAWN', labelKey: 'cab.setup.recordStatus.withdrawn' },
  { value: 'EXPIRED', labelKey: 'cab.setup.recordStatus.expired' },
  { value: 'APPLICANT', labelKey: 'cab.setup.recordStatus.applicant' },
]

/**
 * Slide 5: schemes offered, filtered by CAB activity. The catalog (full titles and the
 * certification-body requirement standard of each scheme) lives in src/lib/standardsCatalog.ts.
 * `label` is the persisted scheme name, a published identifier that is not translated.
 */
export function getSchemeOptions(activities: string[]): { value: string; label: string }[] {
  return catalogForActivities(activities).map((entry) => ({ value: entry.id, label: entry.name }))
}

/** Slide 5 — service lifecycle options. */
export const SERVICE_OPTIONS: CabSetupOption[] = [
  { value: 'INITIAL_CERTIFICATION', labelKey: 'cab.setup.services.initial' },
  { value: 'SURVEILLANCE', labelKey: 'cab.setup.services.surveillance' },
  { value: 'RECERTIFICATION', labelKey: 'cab.setup.services.recertification' },
  { value: 'TRANSFER', labelKey: 'cab.setup.services.transfer' },
  { value: 'SCOPE_EXTENSION', labelKey: 'cab.setup.services.extension' },
  { value: 'SPECIAL_AUDIT', labelKey: 'cab.setup.services.specialAudit' },
  { value: 'SUSPENSION_WITHDRAWAL', labelKey: 'cab.setup.services.suspensionWithdrawal' },
]

/** Slide 5 — primary service market. */
export const SERVICE_MARKET_OPTIONS: CabSetupOption[] = [
  { value: 'LOCAL', labelKey: 'cab.setup.markets.local' },
  { value: 'INTERNATIONAL', labelKey: 'cab.setup.markets.international' },
  { value: 'LOCAL_AND_INTERNATIONAL', labelKey: 'cab.setup.markets.both' },
]

import { IAF_CODES_LIST, getIafCodeOptions } from '@/lib/iafCodes'

/** Slide 6 — IAF/EA scope codes. */
export const SCOPE_CODE_OPTIONS: { value: string; label: string }[] = IAF_CODES_LIST.map((item) => ({
  value: item.value,
  label: `IAF ${item.code} • ${item.en}`,
}))

export { getIafCodeOptions }


/** Slide 7 — where a mark may be used. */
export const ALLOWED_DOCUMENT_USE_OPTIONS: CabSetupOption[] = [
  { value: 'CERTIFICATE', labelKey: 'cab.setup.documentUse.certificate' },
  { value: 'REPORT', labelKey: 'cab.setup.documentUse.report' },
  { value: 'PORTAL', labelKey: 'cab.setup.documentUse.portal' },
  { value: 'EMAIL', labelKey: 'cab.setup.documentUse.email' },
  { value: 'WEBSITE', labelKey: 'cab.setup.documentUse.website' },
]

/** Slide 8 — certificate number tokens available to the format builder. */
export const CERTIFICATE_NUMBER_TOKENS = ['{CAB}', '{SCHEME}', '{YEAR}', '{COUNTRY}', '{SEQ}', '{BRANCH}'] as const

export const CERTIFICATE_VALIDITY_OPTIONS: CabSetupOption[] = [
  { value: '1', labelKey: 'cab.setup.validity.oneYear' },
  { value: '2', labelKey: 'cab.setup.validity.twoYears' },
  { value: '3', labelKey: 'cab.setup.validity.threeYears' },
  { value: '4', labelKey: 'cab.setup.validity.fourYears' },
  { value: '5', labelKey: 'cab.setup.validity.fiveYears' },
  { value: 'CUSTOM', labelKey: 'cab.setup.validity.custom' },
]

export const CERTIFICATE_LANGUAGE_OPTIONS: CabSetupOption[] = [
  { value: 'EN', labelKey: 'cab.setup.certificateLanguages.english' },
  { value: 'AR', labelKey: 'cab.setup.certificateLanguages.arabic' },
  { value: 'EN_AR', labelKey: 'cab.setup.certificateLanguages.bilingual' },
]

export const CERTIFICATE_TEMPLATE_OPTIONS: CabSetupOption[] = [
  { value: 'ICASCO_DEFAULT', labelKey: 'cab.setup.certificateTemplates.default' },
  { value: 'UPLOADED', labelKey: 'cab.setup.certificateTemplates.uploaded' },
  { value: 'DESIGN_LATER', labelKey: 'cab.setup.certificateTemplates.designLater' },
]

/** Slide 9 — the roles offered during setup, with how strongly each is needed. */
export type RoleRequirement = 'OWNER' | 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL'

export interface CabRoleOption {
  value: string
  labelKey: string
  requirement: RoleRequirement
}

export const CAB_ROLE_INVITE_OPTIONS: CabRoleOption[] = [
  { value: 'WORKSPACE_OWNER', labelKey: 'cab.setup.roles.workspaceOwner', requirement: 'OWNER' },
  { value: 'CERTIFICATION_MANAGER', labelKey: 'cab.setup.roles.certificationManager', requirement: 'REQUIRED' },
  { value: 'QUALITY_MANAGER', labelKey: 'cab.setup.roles.qualityManager', requirement: 'RECOMMENDED' },
  { value: 'TECHNICAL_REVIEWER', labelKey: 'cab.setup.roles.technicalReviewer', requirement: 'OPTIONAL' },
]

/** Extra roles a CAB may add beyond the four shown by default. */
export const CAB_ADDITIONAL_ROLE_OPTIONS: CabSetupOption[] = [
  { value: 'GENERAL_MANAGER', labelKey: 'cab.setup.roles.generalManager' },
  { value: 'TECHNICAL_MANAGER', labelKey: 'cab.setup.roles.technicalManager' },
  { value: 'DECISION_MAKER', labelKey: 'cab.setup.roles.decisionMaker' },
  { value: 'AUDITOR', labelKey: 'cab.setup.roles.auditor' },
  { value: 'FINANCE', labelKey: 'cab.setup.roles.finance' },
  { value: 'CLIENT_SUPPORT', labelKey: 'cab.setup.roles.clientSupport' },
]
