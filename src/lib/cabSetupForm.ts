import type { CountryCode } from '@/lib/countries'
import { isValidRequiredEmail } from '@/lib/authValidation'
import { formatPhoneNumber } from '@/lib/api/authApi'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { isValidFieldKind, isValidWebsite } from '@/lib/validators'

/**
 * State for the 10-screen CAB setup wizard (see the CAB onboarding deck).
 *
 * Dates are held as ISO `yyyy-mm-dd` strings, not `Date` objects, so the whole
 * form survives the JSON round-trip through the onboarding draft storage.
 */

export interface CabLocationRecord {
  id: string
  name: string
  type: string
  country: CountryCode | ''
  city: string
  address: string
  activities: string[]
}

export interface CabAccreditationRecord {
  id: string
  body: string
  bodyOther: string
  standard: string
  number: string
  issueDate: string
  expiryDate: string
  status: string
  fileName: string
  /** Set instead of number/expiry while the record is still an application. */
  applicationReference: string
  coveredByMla: boolean
  expiryReminders: boolean
}

export interface CabScopeRecord {
  id: string
  scheme: string
  accreditationRecordId: string
  locationId: string
  codes: string[]
}

export interface CabCustomScheme {
  id: string
  name: string
  owner: string
  normativeDocument: string
  version: string
}

export interface CabCertificateBasic {
  id: string
  schemeId: string
  schemeName: string
  certificateNumberFormat: string
  certificateValidity: string
  certificateLanguage: string
  certificateTemplate: string
  signatoryName: string
  signatoryTitle: string
  signatoryImageUrl: string | null
}

export interface CabRoleInvite {
  role: string
  email: string
  /** 'ADD_LATER' stores an incomplete status rather than fake data. */
  status: 'ACTIVE' | 'INVITE' | 'ADD_LATER'
}

export interface CabSetupForm {
  // Screen 1 — profile
  activities: string[]
  primaryContactEmail: string
  primaryContactPhoneCountryCode: CountryCode
  primaryContactPhoneNumber: string
  /** Full E.164-style number kept in sync for drafts and display fallbacks. */
  primaryContactPhone: string
  yearEstablished: string

  // Screen 2 — locations
  timeZone: string
  hasAdditionalLocations: boolean
  locations: CabLocationRecord[]

  // Screen 3 — accreditation status
  accreditationStatuses: string[]
  accreditationRecordCount: number

  // Screen 4 — accreditation records
  accreditationRecords: CabAccreditationRecord[]

  // Screen 5 — schemes and services
  schemes: string[]
  customSchemes: CabCustomScheme[]
  services: string[]
  primaryServiceMarket: string
  schemeOwner: string

  // Screen 6 — scope
  scopes: CabScopeRecord[]
  scopeFileName: string
  restrictApplicationsToScope: boolean
  requireTechnicalReviewForExceptions: boolean

  // Screen 7 — marks
  accreditationMarkUrl: string | null
  schemeMarkUrl: string | null
  markReference: string
  markValidFrom: string
  markValidUntil: string
  allowedDocumentUse: string[]
  applyMarkOnlyToAccredited: boolean
  blockMarkAfterExpiry: boolean
  keepMarkAuditTrail: boolean

  // Screen 8 — certificate basics (one card per selected scheme)
  certificateBasics: CabCertificateBasic[]
  showCabLogo: boolean
  showAccreditationMark: boolean
  showQrCode: boolean

  // Screen 9 — key roles
  roleInvites: CabRoleInvite[]
  sendInvitationsOnComplete: boolean
  useRoleBasedAccess: boolean
}

export const emptyCabSetupForm: CabSetupForm = {
  activities: [],
  primaryContactEmail: '',
  primaryContactPhoneCountryCode: 'EG',
  primaryContactPhoneNumber: '',
  primaryContactPhone: '',
  yearEstablished: '',

  timeZone: '',
  hasAdditionalLocations: false,
  locations: [],

  accreditationStatuses: [],
  accreditationRecordCount: 1,

  accreditationRecords: [],

  schemes: [],
  customSchemes: [],
  services: [],
  primaryServiceMarket: '',
  schemeOwner: '',

  scopes: [],
  scopeFileName: '',
  restrictApplicationsToScope: true,
  requireTechnicalReviewForExceptions: true,

  accreditationMarkUrl: null,
  schemeMarkUrl: null,
  markReference: '',
  markValidFrom: '',
  markValidUntil: '',
  allowedDocumentUse: ['CERTIFICATE', 'REPORT', 'PORTAL'],
  applyMarkOnlyToAccredited: true,
  blockMarkAfterExpiry: true,
  keepMarkAuditTrail: true,

  certificateBasics: [],
  showCabLogo: true,
  showAccreditationMark: true,
  showQrCode: true,

  roleInvites: [],
  sendInvitationsOnComplete: true,
  useRoleBasedAccess: true,
}

let recordCounter = 0

export function parsePrimaryContactPhone(phone: string): {
  countryCode: CountryCode
  number: string
} {
  const trimmed = phone.trim()
  if (!trimmed) return { countryCode: 'EG', number: '' }

  const parsed = parsePhoneNumberFromString(trimmed)
  if (parsed?.country) {
    return {
      countryCode: parsed.country as CountryCode,
      number: parsed.nationalNumber,
    }
  }

  return { countryCode: 'EG', number: trimmed.replace(/\D/g, '') }
}

export function buildPrimaryContactPhone(countryCode: CountryCode, number: string): string {
  const digits = number.replace(/\D/g, '')
  if (!digits) return ''
  return formatPhoneNumber(countryCode, digits)
}

export function applyPrimaryContactPhoneFields(
  setup: CabSetupForm,
  fields: {
    primaryContactPhoneCountryCode?: CountryCode
    primaryContactPhoneNumber?: string
  }
): Pick<CabSetupForm, 'primaryContactPhoneCountryCode' | 'primaryContactPhoneNumber' | 'primaryContactPhone'> {
  const countryCode = fields.primaryContactPhoneCountryCode ?? setup.primaryContactPhoneCountryCode
  const number = fields.primaryContactPhoneNumber ?? setup.primaryContactPhoneNumber
  return {
    primaryContactPhoneCountryCode: countryCode,
    primaryContactPhoneNumber: number,
    primaryContactPhone: buildPrimaryContactPhone(countryCode, number),
  }
}

export function hydratePrimaryContactPhoneFields(setup: CabSetupForm): CabSetupForm {
  if (setup.primaryContactPhoneNumber.trim()) {
    return {
      ...setup,
      primaryContactPhone: buildPrimaryContactPhone(
        setup.primaryContactPhoneCountryCode,
        setup.primaryContactPhoneNumber
      ),
    }
  }

  if (!setup.primaryContactPhone.trim()) return setup

  const parsed = parsePrimaryContactPhone(setup.primaryContactPhone)
  return {
    ...setup,
    primaryContactPhoneCountryCode: parsed.countryCode,
    primaryContactPhoneNumber: parsed.number,
  }
}

/** Older drafts stored certificate format/validity/language/template once for all schemes. */
type LegacyCabSetupForm = CabSetupForm & {
  certificateNumberFormat?: string
  certificateValidity?: string
  certificateLanguage?: string
  certificateTemplate?: string
}

export function normalizeCabSetupForm(setup: LegacyCabSetupForm): CabSetupForm {
  const legacyFormat = setup.certificateNumberFormat
  const legacyValidity = setup.certificateValidity
  const legacyLanguage = setup.certificateLanguage
  const legacyTemplate = setup.certificateTemplate

  const certificateBasics = setup.certificateBasics.map((record) => {
    const schemeId = record.schemeId ?? ''
    const schemeName = record.schemeName ?? ''
    const defaults = createCertificateBasicRecord()
    return {
      ...defaults,
      ...record,
      id: record.id ?? createRecordId('cert'),
      schemeId,
      schemeName,
      certificateNumberFormat:
        record.certificateNumberFormat || legacyFormat || defaults.certificateNumberFormat,
      certificateValidity:
        record.certificateValidity || legacyValidity || defaults.certificateValidity,
      certificateLanguage:
        record.certificateLanguage || legacyLanguage || defaults.certificateLanguage,
      certificateTemplate:
        record.certificateTemplate || legacyTemplate || defaults.certificateTemplate,
    }
  })

  const rest = { ...setup }
  delete rest.certificateNumberFormat
  delete rest.certificateValidity
  delete rest.certificateLanguage
  delete rest.certificateTemplate

  return { ...rest, certificateBasics }
}

/** Stable-enough local id for repeatable rows; never sent to the backend. */
export function createRecordId(prefix: string): string {
  recordCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${recordCounter}`
}

/** Default per-record status follows the CAB-level accreditation choice. */
export function getDefaultAccreditationRecordStatus(form: CabSetupForm): string {
  if (form.accreditationStatuses.includes('APPLICANT')) return 'APPLICANT'
  return 'ACTIVE'
}

export function createAccreditationRecord(status = 'ACTIVE'): CabAccreditationRecord {
  return {
    id: createRecordId('acc'),
    body: '',
    bodyOther: '',
    standard: '',
    number: '',
    issueDate: '',
    expiryDate: '',
    status,
    fileName: '',
    applicationReference: '',
    coveredByMla: true,
    expiryReminders: true,
  }
}

/** Grow or trim the record list to match the requested count (1–20). */
export function ensureAccreditationRecords(
  count: number,
  existing: CabAccreditationRecord[] = [],
  defaultStatus = 'ACTIVE'
): CabAccreditationRecord[] {
  const target = Math.min(Math.max(count, 1), 20)
  const records = [...existing]
  while (records.length < target) records.push(createAccreditationRecord(defaultStatus))
  records.length = target
  return records
}

export function createLocationRecord(): CabLocationRecord {
  return {
    id: createRecordId('loc'),
    name: '',
    type: 'BRANCH',
    country: '',
    city: '',
    address: '',
    activities: [],
  }
}

export function createScopeRecord(): CabScopeRecord {
  return {
    id: createRecordId('scope'),
    scheme: '',
    accreditationRecordId: '',
    locationId: '',
    codes: [],
  }
}

/** Grow or trim the scope list to match the requested count (1–20). */
export function ensureScopeRecords(
  count: number,
  existing: CabScopeRecord[] = []
): CabScopeRecord[] {
  const target = Math.min(Math.max(count, 1), 20)
  const records = [...existing]
  while (records.length < target) records.push(createScopeRecord())
  records.length = target
  return records
}

export function createCustomScheme(): CabCustomScheme {
  return { id: createRecordId('scheme'), name: '', owner: '', normativeDocument: '', version: '' }
}

export const DEFAULT_CERTIFICATE_NUMBER_FORMAT = '{CAB}-{SCHEME}-{YEAR}-{SEQ}'
export const DEFAULT_CERTIFICATE_VALIDITY = '3'
export const DEFAULT_CERTIFICATE_LANGUAGE = 'EN_AR'
export const DEFAULT_CERTIFICATE_TEMPLATE = 'ICASCO_DEFAULT'

export function createCertificateBasicRecord(): CabCertificateBasic {
  return {
    id: createRecordId('cert'),
    schemeId: '',
    schemeName: '',
    certificateNumberFormat: DEFAULT_CERTIFICATE_NUMBER_FORMAT,
    certificateValidity: DEFAULT_CERTIFICATE_VALIDITY,
    certificateLanguage: DEFAULT_CERTIFICATE_LANGUAGE,
    certificateTemplate: DEFAULT_CERTIFICATE_TEMPLATE,
    signatoryName: '',
    signatoryTitle: '',
    signatoryImageUrl: null,
  }
}

/** Grow or trim certificate cards; always keeps at least one row ready. */
export function ensureCertificateBasicRecords(
  count: number,
  existing: CabCertificateBasic[] = []
): CabCertificateBasic[] {
  const target = Math.min(Math.max(count, 1), 20)
  const records = [...existing]
  while (records.length < target) records.push(createCertificateBasicRecord())
  records.length = target
  return records
}

export function getSelectedSchemeEntries(
  setup: CabSetupForm,
  schemeOptions: { value: string; label: string }[]
): { id: string; label: string }[] {
  const standard = schemeOptions
    .filter((scheme) => setup.schemes.includes(scheme.value))
    .map((scheme) => ({ id: scheme.value, label: scheme.label }))
  const custom = setup.customSchemes
    .filter((scheme) => scheme.name.trim())
    .map((scheme) => ({ id: scheme.id, label: scheme.name.trim() }))
  return [...standard, ...custom]
}

/** Schemes the user can still assign to a certificate card. */
export function getAvailableCertificateSchemeOptions(
  selectedSchemes: { id: string; label: string }[],
  records: CabCertificateBasic[],
  currentRecordId: string
): { value: string; label: string }[] {
  const usedSchemeIds = new Set(
    records
      .filter((record) => record.id !== currentRecordId && record.schemeId)
      .map((record) => record.schemeId)
  )
  return selectedSchemes
    .filter((scheme) => !usedSchemeIds.has(scheme.id))
    .map((scheme) => ({ value: scheme.id, label: scheme.label }))
}

export function isCertificateBasicStarted(record: CabCertificateBasic): boolean {
  return Boolean(
    record.signatoryName.trim() ||
      record.signatoryTitle.trim() ||
      record.signatoryImageUrl ||
      record.certificateNumberFormat !== DEFAULT_CERTIFICATE_NUMBER_FORMAT ||
      record.certificateValidity !== DEFAULT_CERTIFICATE_VALIDITY ||
      record.certificateLanguage !== DEFAULT_CERTIFICATE_LANGUAGE ||
      record.certificateTemplate !== DEFAULT_CERTIFICATE_TEMPLATE
  )
}

/** An applicant record captures an application reference instead of a certificate. */
export function isApplicantRecord(record: CabAccreditationRecord): boolean {
  return record.status === 'APPLICANT'
}

export type AccreditationRecordMissingField =
  | 'body'
  | 'bodyOther'
  | 'standard'
  | 'applicationReference'
  | 'number'
  | 'issueDate'
  | 'expiryDate'
  | 'expiryAfterIssue'

export function getAccreditationRecordMissingFields(
  record: CabAccreditationRecord
): AccreditationRecordMissingField[] {
  const missing: AccreditationRecordMissingField[] = []
  if (!record.body) missing.push('body')
  if (record.body === 'OTHER' && !record.bodyOther.trim()) missing.push('bodyOther')
  if (!record.standard) missing.push('standard')

  if (isApplicantRecord(record)) {
    if (!record.applicationReference.trim()) missing.push('applicationReference')
    return missing
  }

  if (!record.number.trim()) missing.push('number')
  if (!record.issueDate) missing.push('issueDate')
  if (!record.expiryDate) missing.push('expiryDate')
  else if (record.issueDate && record.expiryDate <= record.issueDate) missing.push('expiryAfterIssue')
  return missing
}

export function isAccreditationRecordComplete(record: CabAccreditationRecord): boolean {
  if (getAccreditationRecordMissingFields(record).length > 0) return false
  return (
    isValidFieldKind(record.bodyOther, 'text') &&
    isValidFieldKind(record.number, 'mixed') &&
    isValidFieldKind(record.applicationReference, 'mixed')
  )
}

// ---------------------------------------------------------------------------
// Per-screen completeness. Only what the deck marks required (*) may block Next.
// ---------------------------------------------------------------------------

export function isProfileStepComplete(
  form: CabSetupForm,
  legalEntityName: string,
  registrationNumber?: string,
  tradingName?: string
): boolean {
  const year = Number(form.yearEstablished)
  const yearValid =
    !form.yearEstablished ||
    (/^\d{4}$/.test(form.yearEstablished) &&
      year >= 1800 &&
      year <= new Date().getFullYear())
  const hasRegNumber = registrationNumber !== undefined ? Boolean(registrationNumber.trim()) : true
  return Boolean(
    legalEntityName.trim() &&
      isValidFieldKind(legalEntityName, 'text') &&
      isValidFieldKind(tradingName ?? '', 'text') &&
      hasRegNumber &&
      isValidFieldKind(registrationNumber ?? '', 'mixed') &&
      form.activities.length > 0 &&
      yearValid
  )
}

export function isLocationsStepComplete(
  form: CabSetupForm,
  country: string,
  city: string,
  address: string,
  languages: string[]
): boolean {
  if (!country || !city.trim() || !address.trim() || !form.timeZone || languages.length === 0) {
    return false
  }
  if (!isValidFieldKind(address, 'mixed') || !isValidFieldKind(form.timeZone, 'mixed')) return false

  if (!form.hasAdditionalLocations) return true

  // Address is required for every active location, and no two may share a name+address.
  const seen = new Set<string>()
  return form.locations.every((location) => {
    if (!location.name.trim() || !location.address.trim() || !location.type) return false
    if (!isValidFieldKind(location.name, 'text') || !isValidFieldKind(location.address, 'mixed')) return false
    const key = `${location.name.trim().toLowerCase()}|${location.address.trim().toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function isAccreditationStatusStepComplete(form: CabSetupForm): boolean {
  if (form.accreditationStatuses.length === 0) return false
  // Only an accredited/applicant CAB needs to say how many records follow.
  if (requiresAccreditationRecords(form)) return form.accreditationRecordCount >= 1
  return true
}

/** Unaccredited-only CABs skip the records screen entirely. */
export function requiresAccreditationRecords(form: CabSetupForm): boolean {
  return form.accreditationStatuses.some((status) => status === 'ACCREDITED' || status === 'APPLICANT')
}

export function isAccreditationRecordsStepComplete(form: CabSetupForm): boolean {
  if (!requiresAccreditationRecords(form)) return true
  const expectedCount = Math.max(form.accreditationRecordCount, 1)
  if (form.accreditationRecords.length < expectedCount) return false
  return form.accreditationRecords
    .slice(0, expectedCount)
    .every(isAccreditationRecordComplete)
}

export function isSchemesStepComplete(form: CabSetupForm): boolean {
  // At least one scheme/service is required.
  const hasScheme = form.schemes.length > 0 || form.customSchemes.some((scheme) => scheme.name.trim())
  const customValid = form.customSchemes.every(
    (scheme) =>
      isValidFieldKind(scheme.name, 'text') &&
      isValidFieldKind(scheme.owner, 'text') &&
      isValidFieldKind(scheme.normativeDocument, 'mixed') &&
      isValidFieldKind(scheme.version, 'mixed')
  )
  return hasScheme && form.services.length > 0 && customValid && isValidFieldKind(form.schemeOwner, 'text')
}

export function isScopeStepComplete(form: CabSetupForm): boolean {
  if (form.scopes.length === 0) return false
  return form.scopes.every((scope) => Boolean(scope.scheme && scope.locationId))
}

export function isMarksStepComplete(form: CabSetupForm): boolean {
  if (form.markValidFrom && form.markValidUntil && form.markValidUntil <= form.markValidFrom) {
    return false
  }
  return form.allowedDocumentUse.length > 0 && isValidFieldKind(form.markReference, 'mixed')
}

export function isCertificateBasicComplete(record: CabCertificateBasic): boolean {
  if (!record.schemeId) return false
  return Boolean(
    record.certificateNumberFormat.includes('{SEQ}') &&
      record.certificateValidity &&
      record.certificateLanguage &&
      record.certificateTemplate &&
      record.signatoryName.trim() &&
      record.signatoryTitle.trim() &&
      record.signatoryImageUrl
  )
}

/** Certificate setup is optional, but any typed values must be the right type. */
export function isCertificateStepComplete(form: CabSetupForm): boolean {
  return form.certificateBasics.every(
    (record) =>
      isValidFieldKind(record.signatoryName, 'text') &&
      isValidFieldKind(record.signatoryTitle, 'text') &&
      isValidFieldKind(record.certificateNumberFormat, 'mixed')
  )
}

/** Used on the review screen: touched schemes must be fully complete. */
export function isCertificateConfigurationReady(form: CabSetupForm): boolean {
  const touched = form.certificateBasics.filter(isCertificateBasicStarted)
  if (touched.length === 0) return true
  return touched.every(isCertificateBasicComplete)
}

export interface CabSetupFieldIssue {
  fieldId: string
  kind: 'required' | 'invalid'
}

export interface CabSetupReviewSectionState {
  key: 'identity' | 'locations' | 'accreditation' | 'schemes' | 'scope' | 'marks' | 'certificate'
  step: number
  issues: CabSetupFieldIssue[]
  blocking: boolean
}

export function getCabSetupReviewSections(
  setup: CabSetupForm,
  shared: {
    legalEntityName: string
    tradingName: string
    registrationNumber: string
    website: string
    country: string
    city: string
    address: string
    languages: string[]
  },
): CabSetupReviewSectionState[] {
  const identity: CabSetupFieldIssue[] = []
  if (!shared.legalEntityName.trim()) identity.push({ fieldId: 'cab-setup-legal-name', kind: 'required' })
  else if (!isValidFieldKind(shared.legalEntityName, 'text')) identity.push({ fieldId: 'cab-setup-legal-name', kind: 'invalid' })
  if (shared.tradingName && !isValidFieldKind(shared.tradingName, 'text')) {
    identity.push({ fieldId: 'cab-setup-trading-name', kind: 'invalid' })
  }
  if (!shared.registrationNumber.trim()) identity.push({ fieldId: 'cab-setup-registration-number', kind: 'required' })
  else if (!isValidFieldKind(shared.registrationNumber, 'mixed')) {
    identity.push({ fieldId: 'cab-setup-registration-number', kind: 'invalid' })
  }
  if (setup.activities.length === 0) identity.push({ fieldId: 'cab-setup-activities', kind: 'required' })
  if (shared.website.trim() && !isValidWebsite(shared.website)) {
    identity.push({ fieldId: 'cab-setup-website', kind: 'invalid' })
  }
  if (setup.yearEstablished) {
    const year = Number(setup.yearEstablished)
    const yearValid = /^\d{4}$/.test(setup.yearEstablished) && year >= 1800 && year <= new Date().getFullYear()
    if (!yearValid) identity.push({ fieldId: 'cab-setup-year-established', kind: 'invalid' })
  }

  const locations: CabSetupFieldIssue[] = []
  if (!shared.country) locations.push({ fieldId: 'cab-setup-country', kind: 'required' })
  if (!shared.city.trim()) locations.push({ fieldId: 'cab-setup-city', kind: 'required' })
  if (!shared.address.trim()) locations.push({ fieldId: 'cab-setup-address', kind: 'required' })
  else if (!isValidFieldKind(shared.address, 'mixed')) locations.push({ fieldId: 'cab-setup-address', kind: 'invalid' })
  if (!setup.timeZone.trim()) locations.push({ fieldId: 'cab-setup-timezone', kind: 'required' })
  else if (!isValidFieldKind(setup.timeZone, 'mixed')) locations.push({ fieldId: 'cab-setup-timezone', kind: 'invalid' })
  if (shared.languages.length === 0) locations.push({ fieldId: 'cab-setup-languages', kind: 'required' })
  if (setup.hasAdditionalLocations) {
    const seen = new Set<string>()
    for (const location of setup.locations) {
      if (!location.name.trim() || !isValidFieldKind(location.name, 'text')) {
        locations.push({
          fieldId: `cab-setup-location-name-${location.id}`,
          kind: location.name.trim() ? 'invalid' : 'required',
        })
        break
      }
      if (!location.address.trim() || !isValidFieldKind(location.address, 'mixed')) {
        locations.push({
          fieldId: `cab-setup-location-address-${location.id}`,
          kind: location.address.trim() ? 'invalid' : 'required',
        })
        break
      }
      const key = `${location.name.trim().toLowerCase()}|${location.address.trim().toLowerCase()}`
      if (seen.has(key)) {
        locations.push({ fieldId: `cab-setup-location-name-${location.id}`, kind: 'invalid' })
        break
      }
      seen.add(key)
    }
  }

  const accreditation: CabSetupFieldIssue[] = []
  if (setup.accreditationStatuses.length === 0) {
    accreditation.push({ fieldId: 'cab-setup-accreditation-status', kind: 'required' })
  } else if (requiresAccreditationRecords(setup)) {
    const expectedCount = Math.max(setup.accreditationRecordCount, 1)
    if (setup.accreditationRecords.length < expectedCount) {
      accreditation.push({ fieldId: 'cab-setup-record-count', kind: 'required' })
    } else {
      const incomplete = setup.accreditationRecords.slice(0, expectedCount).find((record) => !isAccreditationRecordComplete(record))
      if (incomplete) {
        const missing = getAccreditationRecordMissingFields(incomplete)
        const fieldByMissing: Record<AccreditationRecordMissingField, string> = {
          body: `cab-setup-acc-body-${incomplete.id}`,
          bodyOther: `cab-setup-acc-body-other-${incomplete.id}`,
          standard: `cab-setup-acc-standard-${incomplete.id}`,
          applicationReference: `cab-setup-acc-application-${incomplete.id}`,
          number: `cab-setup-acc-number-${incomplete.id}`,
          issueDate: `cab-setup-acc-issue-${incomplete.id}`,
          expiryDate: `cab-setup-acc-expiry-${incomplete.id}`,
          expiryAfterIssue: `cab-setup-acc-expiry-${incomplete.id}`,
        }
        const first = missing[0]
        accreditation.push({
          fieldId: first ? fieldByMissing[first] : `cab-setup-acc-body-${incomplete.id}`,
          kind: first === 'expiryAfterIssue' ? 'invalid' : 'required',
        })
      }
    }
  }

  const schemes: CabSetupFieldIssue[] = []
  const hasScheme = setup.schemes.length > 0 || setup.customSchemes.some((scheme) => scheme.name.trim())
  if (!hasScheme) schemes.push({ fieldId: 'cab-setup-schemes', kind: 'required' })
  if (setup.services.length === 0) schemes.push({ fieldId: 'cab-setup-services', kind: 'required' })
  const invalidCustom = setup.customSchemes.find(
    (scheme) =>
      (scheme.name && !isValidFieldKind(scheme.name, 'text')) ||
      (scheme.owner && !isValidFieldKind(scheme.owner, 'text')) ||
      (scheme.normativeDocument && !isValidFieldKind(scheme.normativeDocument, 'mixed')) ||
      (scheme.version && !isValidFieldKind(scheme.version, 'mixed')),
  )
  if (invalidCustom) {
    const fieldId = !isValidFieldKind(invalidCustom.name, 'text')
      ? `cab-setup-custom-scheme-name-${invalidCustom.id}`
      : !isValidFieldKind(invalidCustom.owner, 'text')
        ? `cab-setup-custom-scheme-owner-${invalidCustom.id}`
        : `cab-setup-custom-scheme-name-${invalidCustom.id}`
    schemes.push({ fieldId, kind: 'invalid' })
  }
  if (setup.schemeOwner && !isValidFieldKind(setup.schemeOwner, 'text')) {
    schemes.push({ fieldId: 'cab-setup-scheme-owner', kind: 'invalid' })
  }

  const scope: CabSetupFieldIssue[] = []
  if (setup.scopes.length === 0) scope.push({ fieldId: 'cab-setup-scope-file', kind: 'required' })
  else {
    const incomplete = setup.scopes.find((item) => !item.scheme || !item.locationId)
    if (incomplete) {
      scope.push({
        fieldId: incomplete.scheme ? `cab-setup-scope-location-${incomplete.id}` : `cab-setup-scope-scheme-${incomplete.id}`,
        kind: 'required',
      })
    }
  }

  const marks: CabSetupFieldIssue[] = []
  if (setup.markReference && !isValidFieldKind(setup.markReference, 'mixed')) {
    marks.push({ fieldId: 'cab-setup-mark-reference', kind: 'invalid' })
  }
  if (setup.markValidFrom && setup.markValidUntil && setup.markValidUntil <= setup.markValidFrom) {
    marks.push({ fieldId: 'cab-setup-mark-valid-until', kind: 'invalid' })
  }
  if (setup.allowedDocumentUse.length === 0) marks.push({ fieldId: 'cab-setup-document-use', kind: 'required' })

  const certificate: CabSetupFieldIssue[] = []
  const invalidCert = setup.certificateBasics.find(
    (record) =>
      !isValidFieldKind(record.signatoryName, 'text') ||
      !isValidFieldKind(record.signatoryTitle, 'text') ||
      !isValidFieldKind(record.certificateNumberFormat, 'mixed'),
  )
  if (invalidCert) {
    certificate.push({
      fieldId: !isValidFieldKind(invalidCert.signatoryName, 'text')
        ? `cab-setup-cert-signatory-name-${invalidCert.schemeId}`
        : `cab-setup-cert-signatory-title-${invalidCert.schemeId}`,
      kind: 'invalid',
    })
  } else {
    const started = setup.certificateBasics.find((record) => isCertificateBasicStarted(record) && !isCertificateBasicComplete(record))
    if (started) {
      certificate.push({
        fieldId: started.schemeId
          ? `cab-setup-cert-signatory-name-${started.schemeId}`
          : `cab-setup-cert-format-${started.schemeId}`,
        kind: 'required',
      })
    }
  }

  return [
    { key: 'identity', step: 2, issues: identity, blocking: identity.length > 0 },
    { key: 'locations', step: 3, issues: locations, blocking: locations.length > 0 },
    {
      key: 'accreditation',
      step: setup.accreditationStatuses.length === 0 ? 4 : 5,
      issues: accreditation,
      blocking: accreditation.length > 0,
    },
    { key: 'schemes', step: 6, issues: schemes, blocking: schemes.length > 0 },
    { key: 'scope', step: 7, issues: scope, blocking: scope.length > 0 },
    { key: 'marks', step: 8, issues: marks, blocking: marks.length > 0 },
    { key: 'certificate', step: 9, issues: certificate, blocking: certificate.length > 0 },
  ]
}

export function isCabSetupReadyToActivate(
  setup: CabSetupForm,
  shared: Parameters<typeof getCabSetupReviewSections>[1],
): boolean {
  return getCabSetupReviewSections(setup, shared).every((section) => !section.blocking)
}

export function isKeyRolesStepComplete(form: CabSetupForm): boolean {
  // Roles are never mandatory to activate — an un-filled invite just stays
  // pending. Only a typed-but-malformed address blocks the step.
  return form.roleInvites.every(
    (invite) => !invite.email.trim() || isValidRequiredEmail(invite.email)
  )
}

/** Renders the certificate-number example shown under the format field. */
export function buildCertificateNumberExample(format: string, cabName: string, scheme: string): string {
  const words = (cabName.trim() || 'CAB').split(/\s+/).filter(Boolean)
  // A single-token name ("NAA") keeps its own letters; multi-word names initialise.
  const abbreviation = (
    words.length === 1 ? words[0] : words.map((word) => word[0]).join('')
  )
    .slice(0, 3)
    .toUpperCase()

  return format
    .replace(/\{CAB\}/g, abbreviation || 'CAB')
    .replace(/\{SCHEME\}/g, scheme || 'QMS')
    .replace(/\{YEAR\}/g, String(new Date().getFullYear()))
    .replace(/\{COUNTRY\}/g, 'SA')
    .replace(/\{BRANCH\}/g, 'HQ')
    .replace(/\{SEQ\}/g, '0001')
}
