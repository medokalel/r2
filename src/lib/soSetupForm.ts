import { isValidRequiredEmail } from '@/lib/authValidation'
import {
  approvalRouteNeedsAccreditation,
  coverageNeedsCountries,
  schemeStatusNeedsEffectiveDate,
} from '@/lib/api/soSetupApi'

/**
 * State for the 10-screen Scheme Owner setup wizard
 * (see the Scheme Owner onboarding deck). Dates are ISO `yyyy-mm-dd` strings
 * so the form survives the JSON round-trip through the onboarding draft.
 */

export interface SoSchemeRecord {
  id: string
  name: string
  code: string
  version: string
  effectiveDate: string
  status: string
  documentFileName: string
  reviewReminders: boolean
  keepPreviousVersions: boolean
}

export interface SoRoleInvite {
  role: string
  email: string
  status: 'ACTIVE' | 'INVITE' | 'ADD_LATER'
}

export interface SoSetupForm {
  // Screen 1 — profile
  ownerType: string
  ownerTypeOther: string
  primaryContactEmail: string
  yearEstablished: string

  // Screen 2 — governance location
  coverage: string
  coverageCountries: string[]
  timeZone: string
  hasRegionalOffices: boolean
  offeredCrossBorder: boolean

  // Screen 3 — scheme families
  schemeCount: number
  schemeFamilies: string[]

  // Screen 4 — scheme records
  schemes: SoSchemeRecord[]

  // Screen 5 — assessment activities
  assessmentActivities: string[]
  cabStandard: string
  assessmentOutcome: string
  certificationCycle: string

  // Screen 6 — scope and eligibility
  scopeClassifications: string[]
  eligibleApplicants: string[]
  geographicLimits: string
  geographicCountries: string[]
  excludedActivities: string
  normativeRequirementsFileName: string
  publicScopeList: boolean
  blockOutsideScope: boolean
  requireEligibilityReview: boolean

  // Screen 7 — approval and licensing
  approvalRoute: string
  approvalValidity: string
  surveillanceFrequency: string
  licenceNumberFormat: string
  renewalRule: string
  suspensionRule: string
  requireActiveAccreditation: boolean
  publishApprovedCabDirectory: boolean

  // Screen 8 — marks
  schemeMarkUrl: string | null
  artworkVersion: string
  permittedUse: string[]
  approvalReference: string
  markValidFrom: string
  markValidUntil: string
  usageGuideFileName: string
  blockUseAfterSuspension: boolean
  keepMarkAuditTrail: boolean

  // Screen 9 — roles
  roleInvites: SoRoleInvite[]
  useRoleBasedPermissions: boolean
  sendInvitationsAfterActivation: boolean
}

export const emptySoSetupForm: SoSetupForm = {
  ownerType: '',
  ownerTypeOther: '',
  primaryContactEmail: '',
  yearEstablished: '',

  coverage: '',
  coverageCountries: [],
  timeZone: '',
  hasRegionalOffices: false,
  offeredCrossBorder: false,

  schemeCount: 1,
  schemeFamilies: [],

  schemes: [],

  assessmentActivities: [],
  cabStandard: '',
  assessmentOutcome: '',
  certificationCycle: '3',

  scopeClassifications: [],
  eligibleApplicants: [],
  geographicLimits: 'GLOBAL',
  geographicCountries: [],
  excludedActivities: '',
  normativeRequirementsFileName: '',
  publicScopeList: true,
  blockOutsideScope: true,
  requireEligibilityReview: true,

  approvalRoute: '',
  approvalValidity: '3',
  surveillanceFrequency: 'ANNUAL',
  licenceNumberFormat: '{SCHEME}-CAB-{SEQ}',
  renewalRule: '',
  suspensionRule: '',
  requireActiveAccreditation: true,
  publishApprovedCabDirectory: true,

  schemeMarkUrl: null,
  artworkVersion: '',
  permittedUse: ['PRODUCT', 'CERTIFICATE', 'WEBSITE'],
  approvalReference: '',
  markValidFrom: '',
  markValidUntil: '',
  usageGuideFileName: '',
  blockUseAfterSuspension: true,
  keepMarkAuditTrail: true,

  roleInvites: [],
  useRoleBasedPermissions: true,
  sendInvitationsAfterActivation: true,
}

let recordCounter = 0

export function createSoRecordId(prefix: string): string {
  recordCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${recordCounter}`
}

export function createSoScheme(): SoSchemeRecord {
  return {
    id: createSoRecordId('scheme'),
    name: '',
    code: '',
    version: '',
    effectiveDate: '',
    status: 'ACTIVE',
    documentFileName: '',
    reviewReminders: true,
    keepPreviousVersions: true,
  }
}

export function isSoSchemeComplete(scheme: SoSchemeRecord): boolean {
  if (!scheme.name.trim() || !scheme.code.trim() || !scheme.version.trim() || !scheme.status) {
    return false
  }
  // A draft has no effective date yet; anything active does.
  if (schemeStatusNeedsEffectiveDate(scheme.status) && !scheme.effectiveDate) return false
  return true
}

// ---------------------------------------------------------------------------
// Per-screen completeness — only the deck's starred fields may block Next.
// ---------------------------------------------------------------------------

export function isSoProfileStepComplete(form: SoSetupForm, legalName: string): boolean {
  if (!legalName.trim() || !form.ownerType) return false
  if (form.ownerType === 'OTHER' && !form.ownerTypeOther.trim()) return false
  const year = Number(form.yearEstablished)
  const yearValid =
    !form.yearEstablished ||
    (/^\d{4}$/.test(form.yearEstablished) &&
      year >= 1800 &&
      year <= new Date().getFullYear())
  return yearValid
}

export function isSoLocationStepComplete(
  form: SoSetupForm,
  country: string,
  city: string,
  address: string
): boolean {
  if (!country || !city.trim() || !address.trim() || !form.coverage) return false
  // Regional/international coverage must name the countries it covers.
  if (coverageNeedsCountries(form.coverage) && form.coverageCountries.length === 0) return false
  return true
}

export function isSoFamiliesStepComplete(form: SoSetupForm): boolean {
  return form.schemeFamilies.length > 0 && form.schemeCount >= 1
}

export function isSoSchemesStepComplete(form: SoSetupForm): boolean {
  if (form.schemes.length === 0) return false
  // Scheme code + version must be unique across records.
  const seen = new Set<string>()
  return form.schemes.every((scheme) => {
    if (!isSoSchemeComplete(scheme)) return false
    const key = `${scheme.code.trim().toLowerCase()}|${scheme.version.trim().toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function isSoActivitiesStepComplete(form: SoSetupForm): boolean {
  return Boolean(
    form.assessmentActivities.length > 0 && form.cabStandard && form.assessmentOutcome
  )
}

export function isSoScopeStepComplete(form: SoSetupForm): boolean {
  if (form.scopeClassifications.length === 0 || form.eligibleApplicants.length === 0) return false
  if (form.geographicLimits === 'SELECTED_COUNTRIES' && form.geographicCountries.length === 0) {
    return false
  }
  return true
}

export function isSoApprovalStepComplete(form: SoSetupForm): boolean {
  if (!form.approvalRoute || !form.approvalValidity || !form.surveillanceFrequency) return false
  // A licence format without a sequence token can generate duplicates.
  if (!form.licenceNumberFormat.includes('{SEQ}')) return false
  // Recognising an accreditation only works if accreditation is required.
  if (approvalRouteNeedsAccreditation(form.approvalRoute) && !form.requireActiveAccreditation) {
    return false
  }
  return true
}

export function isSoMarksStepComplete(form: SoSetupForm): boolean {
  if (form.markValidFrom && form.markValidUntil && form.markValidUntil <= form.markValidFrom) {
    return false
  }
  return form.permittedUse.length > 0
}

export function isSoRolesStepComplete(form: SoSetupForm): boolean {
  // Roles never block activation; only a typed-but-malformed address does.
  return form.roleInvites.every(
    (invite) => !invite.email.trim() || isValidRequiredEmail(invite.email)
  )
}

/** Renders the licence-number example shown under the format field. */
export function buildSoLicenceExample(format: string, schemeCode: string): string {
  return format
    .replace(/\{SCHEME\}/g, schemeCode || 'SSS')
    .replace(/\{CAB\}/g, 'CAB01')
    .replace(/\{YEAR\}/g, String(new Date().getFullYear()))
    .replace(/\{SEQ\}/g, '001')
}

export { approvalRouteNeedsAccreditation, coverageNeedsCountries, schemeStatusNeedsEffectiveDate }
