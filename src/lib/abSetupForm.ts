import type { CountryCode } from '@/lib/countries'
import { isValidRequiredEmail } from '@/lib/authValidation'
import { requiresMandateReference } from '@/lib/api/abSetupApi'

/**
 * State for the 10-screen AB setup wizard (see the AB onboarding deck).
 * Dates are ISO `yyyy-mm-dd` strings so the form survives the JSON round-trip
 * through the onboarding draft storage.
 */

export interface AbOfficeRecord {
  id: string
  name: string
  type: string
  country: CountryCode | ''
  city: string
  address: string
  activities: string[]
}

export interface AbRecognitionRecord {
  id: string
  cooperationBody: string
  cooperationBodyOther: string
  arrangement: string
  reference: string
  signatorySince: string
  nextPeerEvaluation: string
  status: string
  fileName: string
  /** Captured instead of the signatory date while peer evaluation is running. */
  applicationReference: string
  displayOnPublicProfile: boolean
  peerEvaluationReminders: boolean
}

export interface AbProgrammeScope {
  id: string
  programme: string
  recognitionRecordId: string
  officeId: string
  classifications: string[]
}

export interface AbCustomProgramme {
  id: string
  name: string
  normativeDocument: string
  version: string
  owner: string
}

export interface AbRoleInvite {
  role: string
  email: string
  status: 'ACTIVE' | 'INVITE' | 'ADD_LATER'
}

export interface AbSetupForm {
  // Screen 1 — profile
  shortName: string
  abModel: string
  abModelOther: string
  mandateReference: string
  primaryContactEmail: string
  primaryContactPhone: string
  yearEstablished: string

  // Screen 2 — locations
  timeZone: string
  jurisdiction: string
  hasAdditionalOffices: boolean
  offices: AbOfficeRecord[]

  // Screen 3 — recognition position
  recognitionStatuses: string[]
  recognitionRecordCount: number

  // Screen 4 — recognition arrangements
  recognitionRecords: AbRecognitionRecord[]

  // Screen 5 — programmes
  programmes: string[]
  customProgrammes: AbCustomProgramme[]
  lifecycle: string[]
  marketJurisdiction: string
  regulator: string

  // Screen 6 — programme scope
  scopes: AbProgrammeScope[]
  scopeFileName: string
  acceptOnlyActiveProgrammes: boolean
  requireApprovalForExtensions: boolean

  // Screen 7 — symbols
  accreditationSymbolUrl: string | null
  recognitionMarkUrl: string | null
  symbolReference: string
  symbolValidFrom: string
  symbolValidUntil: string
  permittedUse: string[]
  issueOnlyForGrantedScopes: boolean
  blockAfterSuspension: boolean
  keepSymbolAuditTrail: boolean

  // Screen 8 — certificates and decisions
  numberFormat: string
  accreditationCycle: string
  documentLanguage: string
  decisionSignatory: string
  template: string
  showAbLogo: boolean
  showRecognitionMark: boolean
  showQrCode: boolean

  // Screen 9 — key roles
  roleInvites: AbRoleInvite[]
  sendInvitationsOnComplete: boolean
  useRoleBasedAccess: boolean
}

export const emptyAbSetupForm: AbSetupForm = {
  shortName: '',
  abModel: '',
  abModelOther: '',
  mandateReference: '',
  primaryContactEmail: '',
  primaryContactPhone: '',
  yearEstablished: '',

  timeZone: '',
  jurisdiction: '',
  hasAdditionalOffices: false,
  offices: [],

  recognitionStatuses: [],
  recognitionRecordCount: 1,

  recognitionRecords: [],

  programmes: [],
  customProgrammes: [],
  lifecycle: [],
  marketJurisdiction: '',
  regulator: '',

  scopes: [],
  scopeFileName: '',
  acceptOnlyActiveProgrammes: true,
  requireApprovalForExtensions: true,

  accreditationSymbolUrl: null,
  recognitionMarkUrl: null,
  symbolReference: '',
  symbolValidFrom: '',
  symbolValidUntil: '',
  permittedUse: ['CAB_CERTIFICATE', 'REPORT', 'WEBSITE'],
  issueOnlyForGrantedScopes: true,
  blockAfterSuspension: true,
  keepSymbolAuditTrail: true,

  numberFormat: '{AB}-{PROGRAMME}-{YEAR}-{SEQ}',
  accreditationCycle: '4',
  documentLanguage: 'EN_AR',
  decisionSignatory: '',
  template: 'ICASCO_DEFAULT',
  showAbLogo: true,
  showRecognitionMark: true,
  showQrCode: true,

  roleInvites: [],
  sendInvitationsOnComplete: true,
  useRoleBasedAccess: true,
}

let recordCounter = 0

export function createAbRecordId(prefix: string): string {
  recordCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${recordCounter}`
}

export function createAbOffice(): AbOfficeRecord {
  return {
    id: createAbRecordId('office'),
    name: '',
    type: 'REGIONAL_OFFICE',
    country: '',
    city: '',
    address: '',
    activities: [],
  }
}

export function createAbRecognitionRecord(): AbRecognitionRecord {
  return {
    id: createAbRecordId('rec'),
    cooperationBody: '',
    cooperationBodyOther: '',
    arrangement: '',
    reference: '',
    signatorySince: '',
    nextPeerEvaluation: '',
    status: 'ACTIVE',
    fileName: '',
    applicationReference: '',
    displayOnPublicProfile: true,
    peerEvaluationReminders: true,
  }
}

export function createAbProgrammeScope(): AbProgrammeScope {
  return {
    id: createAbRecordId('scope'),
    programme: '',
    recognitionRecordId: '',
    officeId: '',
    classifications: [],
  }
}

export function createAbCustomProgramme(): AbCustomProgramme {
  return { id: createAbRecordId('prog'), name: '', normativeDocument: '', version: '', owner: '' }
}

export function isAbApplicantRecord(record: AbRecognitionRecord): boolean {
  return record.status === 'APPLICANT'
}

export function isAbRecognitionRecordComplete(record: AbRecognitionRecord): boolean {
  if (!record.cooperationBody || !record.arrangement) return false
  if (record.cooperationBody === 'OTHER' && !record.cooperationBodyOther.trim()) return false

  if (isAbApplicantRecord(record)) {
    return Boolean(record.applicationReference.trim())
  }

  if (!record.signatorySince) return false
  // Next peer evaluation, when given, must fall after the signatory date.
  if (record.nextPeerEvaluation && record.nextPeerEvaluation <= record.signatorySince) return false
  return true
}

// ---------------------------------------------------------------------------
// Per-screen completeness — only the deck's starred fields may block Next.
// ---------------------------------------------------------------------------

export function isAbProfileStepComplete(form: AbSetupForm, legalName: string): boolean {
  if (!legalName.trim() || !form.abModel) return false
  if (form.abModel === 'OTHER' && !form.abModelOther.trim()) return false
  // National/government mandates and private registrations both land here.
  if (!form.mandateReference.trim()) return false
  const year = Number(form.yearEstablished)
  const yearValid =
    !form.yearEstablished ||
    (/^\d{4}$/.test(form.yearEstablished) &&
      year >= 1800 &&
      year <= new Date().getFullYear())
  return yearValid
}

/** Surfaced so the profile screen can relabel the mandate field. */
export { requiresMandateReference }

export function isAbLocationsStepComplete(
  form: AbSetupForm,
  country: string,
  city: string,
  address: string,
  languages: string[]
): boolean {
  if (!country || !city.trim() || !address.trim() || !form.timeZone || languages.length === 0) {
    return false
  }
  if (!form.hasAdditionalOffices) return true

  const seen = new Set<string>()
  return form.offices.every((office) => {
    if (!office.name.trim() || !office.type || !office.country || !office.city.trim()) return false
    const key = `${office.name.trim().toLowerCase()}|${office.address.trim().toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function requiresRecognitionRecords(form: AbSetupForm): boolean {
  return form.recognitionStatuses.some((status) => status === 'SIGNATORY' || status === 'APPLICANT')
}

export function isAbRecognitionStatusStepComplete(form: AbSetupForm): boolean {
  if (form.recognitionStatuses.length === 0) return false
  if (requiresRecognitionRecords(form)) return form.recognitionRecordCount >= 1
  return true
}

export function isAbRecognitionRecordsStepComplete(form: AbSetupForm): boolean {
  if (!requiresRecognitionRecords(form)) return true
  if (form.recognitionRecords.length === 0) return false

  // Prevent duplicate cooperation body + arrangement level.
  const seen = new Set<string>()
  return form.recognitionRecords.every((record) => {
    if (!isAbRecognitionRecordComplete(record)) return false
    const key = `${record.cooperationBody}|${record.arrangement}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function isAbProgrammesStepComplete(form: AbSetupForm): boolean {
  const hasProgramme =
    form.programmes.length > 0 || form.customProgrammes.some((programme) => programme.name.trim())
  return hasProgramme && form.lifecycle.length > 0
}

export function isAbScopeStepComplete(form: AbSetupForm): boolean {
  if (form.scopes.length === 0) return false
  return form.scopes.every((scope) => Boolean(scope.programme && scope.officeId))
}

export function isAbSymbolsStepComplete(form: AbSetupForm): boolean {
  if (form.symbolValidFrom && form.symbolValidUntil && form.symbolValidUntil <= form.symbolValidFrom) {
    return false
  }
  return form.permittedUse.length > 0
}

export function isAbCertificateStepComplete(form: AbSetupForm): boolean {
  return Boolean(
    form.numberFormat.includes('{SEQ}') &&
      form.accreditationCycle &&
      form.documentLanguage &&
      form.template
  )
}

export function isAbKeyRolesStepComplete(form: AbSetupForm): boolean {
  // Roles never block activation; only a typed-but-malformed address does.
  return form.roleInvites.every(
    (invite) => !invite.email.trim() || isValidRequiredEmail(invite.email)
  )
}

/** Renders the accreditation-number example under the format field. */
export function buildAbNumberExample(format: string, abName: string, programme: string): string {
  const words = (abName.trim() || 'AB').split(/\s+/).filter(Boolean)
  // A single-token name ("NAA") keeps its own letters; multi-word names initialise.
  const abbreviation = (
    words.length === 1 ? words[0] : words.map((word) => word[0]).join('')
  )
    .slice(0, 3)
    .toUpperCase()

  return format
    .replace(/\{AB\}/g, abbreviation || 'AB')
    .replace(/\{PROGRAMME\}/g, programme || 'CB')
    .replace(/\{YEAR\}/g, String(new Date().getFullYear()))
    .replace(/\{COUNTRY\}/g, 'SA')
    .replace(/\{SEQ\}/g, '0001')
}
