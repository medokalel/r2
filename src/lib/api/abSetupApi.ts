/**
 * Controlled lists for the 10-screen AB setup wizard (see the AB onboarding deck).
 *
 * Frontend-only mock catalogs — the backend has no lookup endpoints for these
 * yet. Values are stored as IDs so labels stay localizable.
 *
 * TODO: swap each catalog for a real lookup once the backend ships it.
 */

export interface AbSetupOption {
  value: string
  labelKey: string
}

/** Slide 1 — AB model. */
export const AB_MODEL_OPTIONS: AbSetupOption[] = [
  { value: 'NATIONAL', labelKey: 'ab.setup.models.national' },
  { value: 'GOVERNMENT_AGENCY', labelKey: 'ab.setup.models.governmentAgency' },
  { value: 'REGIONAL', labelKey: 'ab.setup.models.regional' },
  { value: 'PRIVATE', labelKey: 'ab.setup.models.private' },
  { value: 'SECTOR_SPECIFIC', labelKey: 'ab.setup.models.sectorSpecific' },
  { value: 'OTHER', labelKey: 'ab.setup.models.other' },
]

/** National/government ABs derive authority from a decree; private ones from a registration. */
export function requiresMandateReference(model: string): boolean {
  return model === 'NATIONAL' || model === 'GOVERNMENT_AGENCY'
}

export function getYearEstablishedOptions(): { value: string; label: string }[] {
  const currentYear = new Date().getFullYear()
  const years: { value: string; label: string }[] = []
  for (let year = currentYear; year >= 1900; year -= 1) {
    years.push({ value: String(year), label: String(year) })
  }
  return years
}

/** Slide 2 — office type. */
export const AB_OFFICE_TYPE_OPTIONS: AbSetupOption[] = [
  { value: 'HEADQUARTERS', labelKey: 'ab.setup.officeTypes.headquarters' },
  { value: 'APPLICATION_OFFICE', labelKey: 'ab.setup.officeTypes.applicationOffice' },
  { value: 'ASSESSMENT_COORDINATION', labelKey: 'ab.setup.officeTypes.assessmentCoordination' },
  { value: 'DECISION_OFFICE', labelKey: 'ab.setup.officeTypes.decisionOffice' },
  { value: 'REGIONAL_OFFICE', labelKey: 'ab.setup.officeTypes.regionalOffice' },
  { value: 'REMOTE_OFFICE', labelKey: 'ab.setup.officeTypes.remoteOffice' },
]

/** Slide 2 / 5 — jurisdiction. */
export const AB_JURISDICTION_OPTIONS: AbSetupOption[] = [
  { value: 'NATIONAL', labelKey: 'ab.setup.jurisdictions.national' },
  { value: 'REGIONAL', labelKey: 'ab.setup.jurisdictions.regional' },
  { value: 'INTERNATIONAL', labelKey: 'ab.setup.jurisdictions.international' },
  { value: 'NATIONAL_AND_CROSS_BORDER', labelKey: 'ab.setup.jurisdictions.nationalAndCrossBorder' },
  { value: 'SECTOR_SPECIFIC', labelKey: 'ab.setup.jurisdictions.sectorSpecific' },
]

/** Slide 3 — overall recognition position. */
export const AB_RECOGNITION_STATUS_OPTIONS: AbSetupOption[] = [
  { value: 'SIGNATORY', labelKey: 'ab.setup.recognitionStatus.options.signatory' },
  { value: 'APPLICANT', labelKey: 'ab.setup.recognitionStatus.options.applicant' },
  { value: 'NOT_SIGNATORY', labelKey: 'ab.setup.recognitionStatus.options.notSignatory' },
]

/** Slide 4 — cooperation bodies. Names are published identifiers, not translated. */
export const AB_COOPERATION_BODY_OPTIONS: { value: string; label: string }[] = [
  { value: 'IAF', label: 'IAF · International Accreditation Forum' },
  { value: 'ILAC', label: 'ILAC · International Laboratory Accreditation Cooperation' },
  { value: 'APAC', label: 'APAC · Asia Pacific Accreditation Cooperation' },
  { value: 'ARAC', label: 'ARAC · Arab Accreditation Cooperation' },
  { value: 'EA', label: 'EA · European co-operation for Accreditation' },
  { value: 'IAAC', label: 'IAAC · InterAmerican Accreditation Cooperation' },
  { value: 'AFRAC', label: 'AFRAC · African Accreditation Cooperation' },
  { value: 'SADCA', label: 'SADCA · SADC Accreditation Service' },
  { value: 'OTHER', label: 'Other' },
]

/** Slide 4 — arrangement level, filtered by cooperation body. */
const ARRANGEMENTS_BY_BODY: Record<string, { value: string; label: string }[]> = {
  IAF: [
    { value: 'IAF_MLA_MAIN', label: 'IAF MLA · Main Scope' },
    { value: 'IAF_MLA_SUB', label: 'IAF MLA · Sub-scope' },
  ],
  ILAC: [
    { value: 'ILAC_MRA_MAIN', label: 'ILAC MRA · Main Scope' },
    { value: 'ILAC_MRA_SUB', label: 'ILAC MRA · Sub-scope' },
  ],
}

const REGIONAL_ARRANGEMENTS = [
  { value: 'REGIONAL_ARRANGEMENT', label: 'Regional Arrangement' },
  { value: 'BILATERAL', label: 'Bilateral Arrangement' },
]

export function getArrangementOptions(cooperationBody: string): { value: string; label: string }[] {
  return [...(ARRANGEMENTS_BY_BODY[cooperationBody] ?? []), ...REGIONAL_ARRANGEMENTS]
}

/** Slide 4 — per-arrangement status. */
export const AB_ARRANGEMENT_STATUS_OPTIONS: AbSetupOption[] = [
  { value: 'ACTIVE', labelKey: 'ab.setup.arrangementStatus.active' },
  { value: 'APPLICANT', labelKey: 'ab.setup.arrangementStatus.applicant' },
  { value: 'SUSPENDED', labelKey: 'ab.setup.arrangementStatus.suspended' },
  { value: 'WITHDRAWN', labelKey: 'ab.setup.arrangementStatus.withdrawn' },
]

/**
 * Slide 5 — accreditation programmes. Standard names are published, not
 * translated. `shortCode` is what the certificate-number `{PROGRAMME}` token
 * expands to (the deck's example uses "CB" for the 17021-1 programme).
 */
export const AB_PROGRAMME_OPTIONS: { value: string; label: string; shortCode: string }[] = [
  { value: 'ISO_IEC_17021_1', label: 'ISO/IEC 17021-1 · Certification', shortCode: 'CB' },
  { value: 'ISO_IEC_17020', label: 'ISO/IEC 17020 · Inspection', shortCode: 'IB' },
  { value: 'ISO_IEC_17025_TESTING', label: 'ISO/IEC 17025 · Testing laboratories', shortCode: 'TL' },
  { value: 'ISO_IEC_17025_CALIBRATION', label: 'ISO/IEC 17025 · Calibration laboratories', shortCode: 'CL' },
  { value: 'ISO_15189', label: 'ISO 15189 · Medical laboratories', shortCode: 'ML' },
  { value: 'ISO_IEC_17065', label: 'ISO/IEC 17065 · Product certification', shortCode: 'PC' },
  { value: 'ISO_IEC_17024', label: 'ISO/IEC 17024 · Persons', shortCode: 'PER' },
  { value: 'ISO_IEC_17029', label: 'ISO/IEC 17029 · V/V bodies', shortCode: 'VV' },
  { value: 'ISO_IEC_17043', label: 'ISO/IEC 17043 · Proficiency testing', shortCode: 'PT' },
  { value: 'ISO_17034', label: 'ISO 17034 · Reference material producers', shortCode: 'RMP' },
  { value: 'ISO_20387', label: 'ISO 20387 · Biobanking', shortCode: 'BB' },
]

/** Slide 5 — accreditation lifecycle services. */
export const AB_LIFECYCLE_OPTIONS: AbSetupOption[] = [
  { value: 'APPLICATION', labelKey: 'ab.setup.lifecycle.application' },
  { value: 'DOCUMENT_REVIEW', labelKey: 'ab.setup.lifecycle.documentReview' },
  { value: 'ASSESSMENT', labelKey: 'ab.setup.lifecycle.assessment' },
  { value: 'DECISION', labelKey: 'ab.setup.lifecycle.decision' },
  { value: 'SURVEILLANCE', labelKey: 'ab.setup.lifecycle.surveillance' },
  { value: 'REASSESSMENT', labelKey: 'ab.setup.lifecycle.reassessment' },
  { value: 'EXTENSION', labelKey: 'ab.setup.lifecycle.extension' },
  { value: 'SUSPENSION_WITHDRAWAL', labelKey: 'ab.setup.lifecycle.suspensionWithdrawal' },
]

import { IAF_CODES_LIST, getIafCodeOptions } from '@/lib/iafCodes'

/** Slide 6 — scope classifications (IAF/EA codes). */
export const AB_SCOPE_CLASSIFICATION_OPTIONS: { value: string; label: string }[] = IAF_CODES_LIST.map((item) => ({
  value: item.value,
  label: `IAF ${item.code} • ${item.en}`,
}))

export { getIafCodeOptions }


/** Slide 7 — where an accreditation symbol may be used. */
export const AB_PERMITTED_USE_OPTIONS: AbSetupOption[] = [
  { value: 'CAB_CERTIFICATE', labelKey: 'ab.setup.permittedUse.cabCertificate' },
  { value: 'REPORT', labelKey: 'ab.setup.permittedUse.report' },
  { value: 'WEBSITE', labelKey: 'ab.setup.permittedUse.website' },
  { value: 'ADVERTISEMENT', labelKey: 'ab.setup.permittedUse.advertisement' },
  { value: 'DIGITAL_BADGE', labelKey: 'ab.setup.permittedUse.digitalBadge' },
]

/** Slide 8 — accreditation number tokens. */
export const AB_NUMBER_TOKENS = ['{AB}', '{PROGRAMME}', '{YEAR}', '{COUNTRY}', '{SEQ}'] as const

export const AB_CYCLE_OPTIONS: AbSetupOption[] = [
  { value: '1', labelKey: 'ab.setup.cycle.oneYear' },
  { value: '2', labelKey: 'ab.setup.cycle.twoYears' },
  { value: '3', labelKey: 'ab.setup.cycle.threeYears' },
  { value: '4', labelKey: 'ab.setup.cycle.fourYears' },
  { value: '5', labelKey: 'ab.setup.cycle.fiveYears' },
  { value: 'CUSTOM', labelKey: 'ab.setup.cycle.custom' },
]

export const AB_DOCUMENT_LANGUAGE_OPTIONS: AbSetupOption[] = [
  { value: 'EN', labelKey: 'ab.setup.documentLanguages.english' },
  { value: 'AR', labelKey: 'ab.setup.documentLanguages.arabic' },
  { value: 'EN_AR', labelKey: 'ab.setup.documentLanguages.bilingual' },
]

export const AB_TEMPLATE_OPTIONS: AbSetupOption[] = [
  { value: 'ICASCO_DEFAULT', labelKey: 'ab.setup.templates.default' },
  { value: 'UPLOADED', labelKey: 'ab.setup.templates.uploaded' },
  { value: 'DESIGN_LATER', labelKey: 'ab.setup.templates.designLater' },
]

/** Slide 9 — governance roles offered during setup. */
export type AbRoleRequirement = 'OWNER' | 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL'

export interface AbRoleOption {
  value: string
  labelKey: string
  requirement: AbRoleRequirement
}

export const AB_ROLE_INVITE_OPTIONS: AbRoleOption[] = [
  { value: 'WORKSPACE_OWNER', labelKey: 'ab.setup.roles.workspaceOwner', requirement: 'OWNER' },
  { value: 'ACCREDITATION_DIRECTOR', labelKey: 'ab.setup.roles.accreditationDirector', requirement: 'REQUIRED' },
  { value: 'QUALITY_MANAGER', labelKey: 'ab.setup.roles.qualityManager', requirement: 'REQUIRED' },
  { value: 'DECISION_COMMITTEE_SECRETARY', labelKey: 'ab.setup.roles.decisionCommitteeSecretary', requirement: 'RECOMMENDED' },
]
