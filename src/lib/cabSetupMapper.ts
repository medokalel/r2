import { getSchemeOptions } from '@/lib/api/cabSetupApi'
import { getCatalogEntry, isSameScheme, matchCatalogScheme } from '@/lib/standardsCatalog'
import { resolveAccreditationBodyValue } from '@/lib/accreditationBodies'
import type {
  CabAccreditationRecord as ApiAccreditation,
  CabBranchRecord as ApiBranch,
  CabMarkRecord as ApiMark,
  CabOrganizationType,
  CabProfile,
  CabSchemeRecord as ApiScheme,
  CabSetupDraftPayload,
} from '@/lib/api/cabApi'
import type { CabAccreditationRecord, CabCertificateBasic, CabCustomScheme, CabLocationRecord } from '@/lib/cabSetupForm'
import {
  DEFAULT_CERTIFICATE_LANGUAGE,
  DEFAULT_CERTIFICATE_NUMBER_FORMAT,
  DEFAULT_CERTIFICATE_TEMPLATE,
  DEFAULT_CERTIFICATE_VALIDITY,
  createRecordId,
  hydratePrimaryContactPhoneFields,
} from '@/lib/cabSetupForm'
import type { UnifiedOnboardingForm } from '@/lib/unifiedOnboardingForm'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function asUuid(id: string | undefined): string | undefined {
  return id && UUID_RE.test(id) ? id : undefined
}

function nullIfEmpty(value: string | undefined | null): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function asDraftAssetUri(value: string | undefined | null): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('/') && typeof window !== 'undefined') {
    return `${window.location.origin}${trimmed}`
  }
  return asAbsoluteUri(trimmed)
}

function asAbsoluteUri(value: string | undefined | null): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const parsed = new URL(withProtocol)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed.toString()
  } catch {
    return null
  }
}

function nullIfInvalidUri(value: string | undefined | null): string | null {
  return asAbsoluteUri(value)
}

function nullIfInvalidHexColor(value: string | undefined | null): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return /^#[0-9A-Fa-f]{6}$/.test(trimmed) ? trimmed : null
}

function mapActivityToOrganizationType(activities: string[]): CabOrganizationType {
  const primary = activities[0]
  if (primary === 'INSPECTION_BODY') return 'INSPECTION_BODY'
  if (primary === 'TESTING_LABORATORY' || primary === 'MEDICAL_LABORATORY') {
    return 'TESTING_LABORATORY'
  }
  if (primary === 'CALIBRATION_LABORATORY') return 'CALIBRATION_LABORATORY'
  return 'CERTIFICATION_BODY'
}

function resolveAccreditationBody(record: CabAccreditationRecord): string | null {
  if (record.body === 'OTHER') return nullIfEmpty(record.bodyOther)
  return nullIfEmpty(record.body)
}

function mapAccreditationToApi(record: CabAccreditationRecord): ApiAccreditation {
  const body = resolveAccreditationBody(record)
  const payload: ApiAccreditation = {
    accreditationBody: body,
    accreditationStandard: nullIfEmpty(record.standard),
    status: nullIfEmpty(record.status),
    certificateFileUrl: asDraftAssetUri(record.fileName),
    coveredByMla: record.coveredByMla,
    setExpiryReminders: record.expiryReminders,
  }

  const id = asUuid(record.id)
  if (id) payload.id = id

  if (record.status === 'APPLICANT') {
    payload.accreditationNumber = nullIfEmpty(record.applicationReference)
  } else {
    payload.accreditationNumber = nullIfEmpty(record.number)
    payload.issueDate = nullIfEmpty(record.issueDate)
    payload.expiryDate = nullIfEmpty(record.expiryDate)
  }

  return payload
}

function mapLocationToBranch(location: CabLocationRecord): ApiBranch {
  const branch: ApiBranch = {
    name: location.name.trim(),
    country: nullIfEmpty(location.country),
    city: location.city.trim() || location.name.trim(),
    locationType: nullIfEmpty(location.type),
    activities: location.activities.length > 0 ? location.activities.join(', ') : null,
  }
  const id = asUuid(location.id)
  if (id) branch.id = id
  return branch
}

/**
 * Persisted name of a catalog scheme. When the saved profile already holds the same standard
 * under another name (an older label, or "ISO 9001" without the edition), that name is kept so
 * people and records that reference it keep matching.
 */
function schemeLabel(schemeId: string, activities: string[], existing?: CabProfile | null): string {
  const match = getSchemeOptions(activities).find((option) => option.value === schemeId)
  const catalog = getCatalogEntry(schemeId)
  const saved = catalog
    ? existing?.schemes.find((scheme) => matchCatalogScheme(scheme.schemeName) === catalog)?.schemeName
    : undefined
  return saved ?? match?.label ?? catalog?.name ?? schemeId.replace(/_/g, ' ')
}

function resolveSchemeName(
  schemeId: string,
  activities: string[],
  customSchemes: UnifiedOnboardingForm['cabSetup']['customSchemes'],
  existing?: CabProfile | null
): string {
  const custom = customSchemes.find((scheme) => scheme.id === schemeId)
  if (custom?.name.trim()) return custom.name.trim()
  return schemeLabel(schemeId, activities, existing)
}

function upsertScheme(schemes: Map<string, ApiScheme>, next: ApiScheme) {
  const current = schemes.get(next.schemeName)
  if (!current) {
    schemes.set(next.schemeName, next)
    return
  }

  schemes.set(next.schemeName, {
    ...current,
    ...next,
    id: next.id ?? current.id,
    accreditationRecordId: next.accreditationRecordId ?? current.accreditationRecordId,
    location: next.location ?? current.location,
    approvedScopeCodes: next.approvedScopeCodes ?? current.approvedScopeCodes,
    scopeListFileUrl: next.scopeListFileUrl ?? current.scopeListFileUrl,
    allowApplicationsOnlyWithinScope:
      next.allowApplicationsOnlyWithinScope ?? current.allowApplicationsOnlyWithinScope,
    requireTechnicalReviewForExceptions:
      next.requireTechnicalReviewForExceptions ?? current.requireTechnicalReviewForExceptions,
    certificateNumberFormat: next.certificateNumberFormat ?? current.certificateNumberFormat,
  })
}

function buildSchemes(form: UnifiedOnboardingForm, existing?: CabProfile | null): ApiScheme[] {
  const setup = form.cabSetup
  const schemes = new Map<string, ApiScheme>()
  const scopeListFileUrl = asDraftAssetUri(setup.scopeFileName)

  for (const schemeId of setup.schemes) {
    const schemeName = schemeLabel(schemeId, setup.activities, existing)
    upsertScheme(schemes, {
      schemeName,
      scopeListFileUrl,
      id: findExistingSchemeId(existing, schemeName),
    })
  }

  for (const custom of setup.customSchemes) {
    if (!custom.name.trim()) continue
    const schemeName = custom.name.trim()
    upsertScheme(schemes, {
      schemeName,
      scopeListFileUrl,
      id: asUuid(custom.id) ?? findExistingSchemeId(existing, schemeName),
    })
  }

  for (const scope of setup.scopes) {
    if (!scope.scheme) continue
    const schemeName = resolveSchemeName(scope.scheme, setup.activities, setup.customSchemes, existing)
    upsertScheme(schemes, {
      schemeName,
      accreditationRecordId: asUuid(scope.accreditationRecordId) ?? null,
      location: scope.locationId ? scope.locationId : null,
      approvedScopeCodes: scope.codes,
      scopeListFileUrl,
      allowApplicationsOnlyWithinScope: setup.restrictApplicationsToScope,
      requireTechnicalReviewForExceptions: setup.requireTechnicalReviewForExceptions,
      id: asUuid(scope.id) ?? findExistingSchemeId(existing, schemeName),
    })
  }

  for (const basic of setup.certificateBasics) {
    if (!basic.schemeId) continue
    const schemeName = resolveSchemeName(basic.schemeId, setup.activities, setup.customSchemes, existing)
    const format = nullIfEmpty(basic.certificateNumberFormat)
    if (!format) continue
    upsertScheme(schemes, {
      schemeName,
      certificateNumberFormat: format,
      id: findExistingSchemeId(existing, schemeName),
    })
  }

  return [...schemes.values()].map((scheme) => {
    const { id, ...rest } = scheme
    return id ? { ...rest, id } : rest
  })
}

function customSchemeDetails(form: UnifiedOnboardingForm) {
  return form.cabSetup.customSchemes
    .filter((scheme) => scheme.name.trim())
    .map((scheme) => ({
      schemeName: scheme.name.trim(),
      owner: nullIfEmpty(scheme.owner),
      normativeDocument: nullIfEmpty(scheme.normativeDocument),
      version: nullIfEmpty(scheme.version),
    }))
}

function attachExistingId<T extends { id?: string }>(
  item: T,
  existingId: string | undefined
): T {
  const id = asUuid(item.id) ?? asUuid(existingId)
  return id ? { ...item, id } : item
}

function findExistingSchemeId(existing: CabProfile | null | undefined, schemeName: string): string | undefined {
  return (
    existing?.schemes.find((scheme) => scheme.schemeName === schemeName)?.id ??
    existing?.schemes.find((scheme) => isSameScheme(scheme.schemeName, schemeName))?.id
  )
}

function findExistingAccreditationId(
  existing: CabProfile | null | undefined,
  record: ApiAccreditation
): string | undefined {
  return existing?.accreditations.find((accreditation) => {
    if (record.id && accreditation.id === record.id) return true
    return (
      (accreditation.accreditationBody ?? null) === (record.accreditationBody ?? null) &&
      (accreditation.accreditationStandard ?? null) === (record.accreditationStandard ?? null) &&
      (accreditation.accreditationNumber ?? null) === (record.accreditationNumber ?? null)
    )
  })?.id
}

function findExistingBranchId(existing: CabProfile | null | undefined, branch: ApiBranch): string | undefined {
  return existing?.branches.find((item) => {
    if (branch.id && item.id === branch.id) return true
    return item.name === branch.name && item.city === branch.city
  })?.id
}

function findExistingMarkId(existing: CabProfile | null | undefined, mark: ApiMark): string | undefined {
  return existing?.marks.find((item) => item.markType === mark.markType)?.id
}

function buildMarks(form: UnifiedOnboardingForm, existing?: CabProfile | null): ApiMark[] {
  const setup = form.cabSetup
  const marks: ApiMark[] = []

  const logoUrl = asDraftAssetUri(form.logoUrl)
  if (logoUrl) {
    const logoMark: ApiMark = {
      markType: 'CAB_LOGO',
      fileUrl: logoUrl,
      allowedDocumentUse: setup.allowedDocumentUse,
    }
    marks.push(attachExistingId(logoMark, findExistingMarkId(existing, logoMark)))
  }

  const accreditationMarkUrl = asDraftAssetUri(setup.accreditationMarkUrl)
  if (accreditationMarkUrl) {
    const mark: ApiMark = {
      markType: 'ACCREDITATION_MARK',
      fileUrl: accreditationMarkUrl,
      markReference: nullIfEmpty(setup.markReference),
      validFrom: nullIfEmpty(setup.markValidFrom),
      validUntil: nullIfEmpty(setup.markValidUntil),
      allowedDocumentUse: setup.allowedDocumentUse,
    }
    marks.push(attachExistingId(mark, findExistingMarkId(existing, mark)))
  }

  const schemeMarkUrl = asDraftAssetUri(setup.schemeMarkUrl)
  if (schemeMarkUrl) {
    const mark: ApiMark = {
      markType: 'SCHEME_MARK',
      fileUrl: schemeMarkUrl,
      markReference: nullIfEmpty(setup.markReference),
      validFrom: nullIfEmpty(setup.markValidFrom),
      validUntil: nullIfEmpty(setup.markValidUntil),
      allowedDocumentUse: setup.allowedDocumentUse,
    }
    marks.push(attachExistingId(mark, findExistingMarkId(existing, mark)))
  }

  return marks
}

function primarySignatory(form: UnifiedOnboardingForm): CabCertificateBasic | undefined {
  return (
    form.cabSetup.certificateBasics.find(
      (basic) => basic.signatoryTitle.trim() && basic.signatoryImageUrl
    ) ?? form.cabSetup.certificateBasics.find((basic) => basic.schemeId)
  )
}

export function mapFormToCabSetupDraft(
  form: UnifiedOnboardingForm,
  existing?: CabProfile | null
): CabSetupDraftPayload {
  const setup = form.cabSetup
  const primaryAccreditationBody =
    setup.accreditationRecords.map(resolveAccreditationBody).find(Boolean) ??
    (setup.accreditationStatuses.includes('UNACCREDITED') ? 'UNACCREDITED' : null)

  const year = setup.yearEstablished.trim()
  const parsedYear = year ? Number.parseInt(year, 10) : NaN
  const signatory = primarySignatory(form)

  const accreditations = setup.accreditationRecords
    .filter(
      (record) =>
        record.body.trim() ||
        record.standard.trim() ||
        record.number.trim() ||
        record.fileName.trim() ||
        record.applicationReference.trim()
    )
    .map((record) => {
      const mapped = mapAccreditationToApi(record)
      return attachExistingId(mapped, findExistingAccreditationId(existing, mapped))
    })

  const branches = (setup.hasAdditionalLocations ? setup.locations : [])
    .filter((location) => location.name.trim())
    .map((location) => {
      const mapped = mapLocationToBranch(location)
      return attachExistingId(mapped, findExistingBranchId(existing, mapped))
    })

  return {
    legalEntityName: nullIfEmpty(form.legalEntityName),
    tradingBrandName: nullIfEmpty(form.tradingName) ?? nullIfEmpty(form.legalEntityName),
    organizationType: setup.activities.length > 0 ? mapActivityToOrganizationType(setup.activities) : null,
    registrationNumber: nullIfEmpty(form.registrationNumber),
    website: nullIfInvalidUri(form.website),
    yearEstablished: Number.isFinite(parsedYear) ? parsedYear : null,
    country: nullIfEmpty(form.country),
    city: nullIfEmpty(form.city),
    mainOfficeAddress: nullIfEmpty(form.address),
    timeZone: nullIfEmpty(setup.timeZone),
    operatingLanguages: form.languages,
    branches,
    logoUrl: form.logoUrl?.trim() || null,
    showLogoInEmailHeaders: form.includeLogoInEmails,
    showLogoOnCertificates: form.displayLogoOnCertificates,
    primaryColor: nullIfInvalidHexColor(form.customColor),
    secondaryColor: null,
    accreditationStatus:
      setup.accreditationStatuses.length > 0 ? setup.accreditationStatuses.join(',') : null,
    numberOfAccreditationRecords: setup.accreditationRecordCount,
    accreditationBody: primaryAccreditationBody,
    accreditations,
    primaryServiceMarket: nullIfEmpty(setup.primaryServiceMarket),
    schemeOwner: nullIfEmpty(setup.schemeOwner),
    selectedServices: setup.services,
    schemes: buildSchemes(form, existing),
    applyAccreditationMarkOnlyToAccreditedSchemes: setup.applyMarkOnlyToAccredited,
    blockMarkUseAfterExpiry: setup.blockMarkAfterExpiry,
    keepMarkUseAuditTrail: setup.keepMarkAuditTrail,
    marks: buildMarks(form, existing),
    certificateSettings: {
      ...existing?.certificateSettings,
      certificateNumberFormat: nullIfEmpty(
        setup.certificateBasics.find((basic) => basic.schemeId)?.certificateNumberFormat
      ),
      certificateValidity: nullIfEmpty(
        setup.certificateBasics.find((basic) => basic.schemeId)?.certificateValidity
      ),
      certificateLanguage: nullIfEmpty(
        setup.certificateBasics.find((basic) => basic.schemeId)?.certificateLanguage
      ),
      authorisedSignatory:
        nullIfEmpty(setup.certificateBasics.find((basic) => basic.schemeId)?.signatoryName) ??
        undefined,
      signatories: setup.certificateBasics
        .filter((basic) => basic.schemeId)
        .map((basic) => ({
          schemeId: basic.schemeId,
          schemeName: nullIfEmpty(basic.schemeName),
          certificateNumberFormat: nullIfEmpty(basic.certificateNumberFormat),
          certificateValidity: nullIfEmpty(basic.certificateValidity),
          certificateLanguage: nullIfEmpty(basic.certificateLanguage),
          certificateTemplate: nullIfEmpty(basic.certificateTemplate),
          signatoryName: nullIfEmpty(basic.signatoryName),
          signatoryTitle: nullIfEmpty(basic.signatoryTitle),
          signatoryImageUrl: basic.signatoryImageUrl,
        })),
      certificateTemplate: nullIfEmpty(
        setup.certificateBasics.find((basic) => basic.schemeId)?.certificateTemplate
      ),
      showCabLogo: setup.showCabLogo,
      showAccreditationMark: setup.showAccreditationMark,
      showQrCode: setup.showQrCode,
      customSchemes: customSchemeDetails(form),
    },
    cabActivity: setup.activities,
    signatoryTitle: nullIfEmpty(signatory?.signatoryTitle),
    signatorySignatureUrl: signatory?.signatoryImageUrl?.trim() || null,
  }
}

function mapAccreditationFromApi(record: ApiAccreditation): CabAccreditationRecord {
  const body = record.accreditationBody ?? ''
  const known = resolveAccreditationBodyValue(body)
  const isOther = body !== '' && !known

  return {
    id: record.id ?? createRecordId('acc'),
    body: isOther ? 'OTHER' : known ?? '',
    bodyOther: isOther ? body : '',
    standard: record.accreditationStandard ?? '',
    number: record.accreditationNumber ?? '',
    issueDate: record.issueDate?.slice(0, 10) ?? '',
    expiryDate: record.expiryDate?.slice(0, 10) ?? '',
    status: record.status ?? 'ACTIVE',
    fileName: record.certificateFileUrl ?? '',
    applicationReference: record.status === 'APPLICANT' ? record.accreditationNumber ?? '' : '',
    coveredByMla: record.coveredByMla ?? true,
    expiryReminders: record.setExpiryReminders ?? true,
  }
}

function mapCertificateBasicFromApi(
  signatory: {
    schemeId?: string
    schemeName?: string | null
    certificateNumberFormat?: string | null
    certificateValidity?: string | null
    certificateLanguage?: string | null
    certificateTemplate?: string | null
    signatoryName?: string | null
    signatoryTitle?: string | null
    signatoryImageUrl?: string | null
  },
  globalDefaults?: {
    certificateNumberFormat?: string | null
    certificateValidity?: string | null
    certificateLanguage?: string | null
    certificateTemplate?: string | null
  }
): CabCertificateBasic {
  return {
    id: createRecordId('cert'),
    schemeId: signatory.schemeId ?? '',
    schemeName: signatory.schemeName?.trim() ?? '',
    certificateNumberFormat:
      signatory.certificateNumberFormat ??
      globalDefaults?.certificateNumberFormat ??
      DEFAULT_CERTIFICATE_NUMBER_FORMAT,
    certificateValidity:
      signatory.certificateValidity ??
      globalDefaults?.certificateValidity ??
      DEFAULT_CERTIFICATE_VALIDITY,
    certificateLanguage:
      signatory.certificateLanguage ??
      globalDefaults?.certificateLanguage ??
      DEFAULT_CERTIFICATE_LANGUAGE,
    certificateTemplate:
      signatory.certificateTemplate ??
      globalDefaults?.certificateTemplate ??
      DEFAULT_CERTIFICATE_TEMPLATE,
    signatoryName: signatory.signatoryName?.trim() ?? '',
    signatoryTitle: signatory.signatoryTitle?.trim() ?? '',
    signatoryImageUrl: signatory.signatoryImageUrl ?? null,
  }
}

function mapBranchToLocation(branch: ApiBranch): CabLocationRecord {
  return {
    id: branch.id ?? createRecordId('loc'),
    name: branch.name,
    type: branch.locationType ?? 'BRANCH',
    country: (branch.country as CabLocationRecord['country']) || '',
    city: branch.city,
    address: branch.name,
    activities: branch.activities ? branch.activities.split(',').map((item) => item.trim()) : [],
  }
}

export function mergeCabProfileIntoForm(form: UnifiedOnboardingForm, cab: CabProfile): UnifiedOnboardingForm {
  const certificate = cab.certificateSettings ?? {}
  const accreditationMark = cab.marks.find((mark) => mark.markType === 'ACCREDITATION_MARK')
  const schemeMark = cab.marks.find((mark) => mark.markType === 'SCHEME_MARK')
  const logoMark = cab.marks.find((mark) => mark.markType === 'CAB_LOGO')

  const accreditationStatuses = cab.accreditationStatus
    ? cab.accreditationStatus.split(',').map((item) => item.trim()).filter(Boolean)
    : form.cabSetup.accreditationStatuses

  const accreditationRecords =
    cab.accreditations.length > 0
      ? cab.accreditations.map(mapAccreditationFromApi)
      : form.cabSetup.accreditationRecords

  const activities =
    cab.cabActivity && cab.cabActivity.length > 0
      ? cab.cabActivity
      : form.cabSetup.activities.length > 0
        ? form.cabSetup.activities
        : form.scopeAreas

  const catalogValues = new Set(getSchemeOptions(activities).map((option) => option.value))
  const savedCustomDetails = Array.isArray(
    (certificate as { customSchemes?: Array<{
      schemeName?: string
      owner?: string | null
      normativeDocument?: string | null
      version?: string | null
    }> }).customSchemes
  )
    ? (certificate as { customSchemes: Array<{
        schemeName?: string
        owner?: string | null
        normativeDocument?: string | null
        version?: string | null
      }> }).customSchemes
    : []

  // A saved scheme is a catalog scheme when it names a catalog standard (current or older label,
  // with or without the edition) and carries no custom details of its own.
  const hasCustomDetails = (schemeName: string) =>
    savedCustomDetails.some(
      (item) => item.schemeName === schemeName && Boolean(item.owner?.trim() || item.normativeDocument?.trim() || item.version?.trim())
    )
  const catalogIdFor = (schemeName: string): string | undefined => {
    if (catalogValues.has(schemeName)) return schemeName
    const entry = matchCatalogScheme(schemeName)
    return entry && catalogValues.has(entry.id) && !hasCustomDetails(schemeName) ? entry.id : undefined
  }

  const restoredCustomSchemes: CabCustomScheme[] = cab.schemes
    .filter((scheme) => scheme.schemeName && !catalogIdFor(scheme.schemeName))
    .map((scheme) => {
      const previous = form.cabSetup.customSchemes.find(
        (item) => item.name.trim() === scheme.schemeName || item.id === scheme.id
      )
      const extra = savedCustomDetails.find((item) => item.schemeName === scheme.schemeName)
      return {
        id: scheme.id ?? previous?.id ?? createRecordId('scheme'),
        name: scheme.schemeName,
        owner: extra?.owner?.trim() || previous?.owner || '',
        normativeDocument: extra?.normativeDocument?.trim() || previous?.normativeDocument || '',
        version: extra?.version?.trim() || previous?.version || '',
      }
    })

  const restoredCatalogSchemes = [
    ...new Set(
      cab.schemes
        .map((scheme) => catalogIdFor(scheme.schemeName))
        .filter((value): value is string => Boolean(value))
    ),
  ]

  const schemeIdForName = (schemeName: string) =>
    catalogIdFor(schemeName) ??
    restoredCustomSchemes.find((item) => item.name === schemeName)?.id ??
    ''

  const customIdByPreviousId = new Map(
    form.cabSetup.customSchemes.map((previous) => {
      const restored = restoredCustomSchemes.find((item) => item.name === previous.name.trim())
      return [previous.id, restored?.id ?? previous.id] as const
    })
  )

  const scopes =
    cab.schemes.length > 0
      ? cab.schemes.map((scheme) => ({
          id: scheme.id ?? createRecordId('scope'),
          scheme: schemeIdForName(scheme.schemeName),
          accreditationRecordId: scheme.accreditationRecordId ?? '',
          locationId: scheme.location ?? '',
          codes: scheme.approvedScopeCodes ?? [],
        }))
      : form.cabSetup.scopes.map((scope) => {
          const previousIndex = form.cabSetup.accreditationRecords.findIndex(
            (record) => record.id === scope.accreditationRecordId
          )
          const mapped = previousIndex >= 0 ? accreditationRecords[previousIndex] : undefined
          const nextScheme = customIdByPreviousId.get(scope.scheme) ?? scope.scheme
          return {
            ...scope,
            scheme: nextScheme,
            accreditationRecordId: mapped?.id ?? scope.accreditationRecordId,
          }
        })

  const firstScheme = cab.schemes[0]
  const restoredCertificateBasics =
    Array.isArray(certificate.signatories) && certificate.signatories.length > 0
      ? certificate.signatories.map((signatory) => {
          const mapped = mapCertificateBasicFromApi(signatory, {
            certificateNumberFormat: certificate.certificateNumberFormat,
            certificateValidity: certificate.certificateValidity,
            certificateLanguage: certificate.certificateLanguage,
            certificateTemplate: certificate.certificateTemplate,
          })
          const nextSchemeId =
            customIdByPreviousId.get(mapped.schemeId) ??
            schemeIdForName(mapped.schemeName) ??
            mapped.schemeId
          return { ...mapped, schemeId: nextSchemeId }
        })
      : cab.schemes.map((scheme) =>
          mapCertificateBasicFromApi(
            {
              schemeId: schemeIdForName(scheme.schemeName),
              schemeName: scheme.schemeName,
              certificateNumberFormat: scheme.certificateNumberFormat,
              signatoryTitle: cab.signatoryTitle,
              signatoryImageUrl: cab.signatorySignatureUrl,
            },
            {
              certificateNumberFormat: certificate.certificateNumberFormat,
              certificateValidity: certificate.certificateValidity,
              certificateLanguage: certificate.certificateLanguage,
              certificateTemplate: certificate.certificateTemplate,
            }
          )
        )

  return {
    ...form,
    legalEntityName: cab.legalEntityName ?? form.legalEntityName,
    tradingName: cab.tradingBrandName ?? form.tradingName,
    registrationNumber: cab.registrationNumber ?? form.registrationNumber,
    website: cab.website ?? form.website,
    country: (cab.country as UnifiedOnboardingForm['country']) || form.country,
    city: cab.city ?? form.city,
    address: cab.mainOfficeAddress ?? form.address,
    languages: cab.operatingLanguages.length > 0 ? cab.operatingLanguages : form.languages,
    logoUrl: cab.logoUrl ?? logoMark?.fileUrl ?? form.logoUrl,
    includeLogoInEmails: cab.showLogoInEmailHeaders,
    displayLogoOnCertificates: cab.showLogoOnCertificates,
    customColor: cab.primaryColor ?? form.customColor,
    cabSetup: hydratePrimaryContactPhoneFields({
      ...form.cabSetup,
      activities,
      primaryContactEmail: form.cabSetup.primaryContactEmail,
      primaryContactPhone: form.cabSetup.primaryContactPhone,
      yearEstablished: cab.yearEstablished ? String(cab.yearEstablished) : form.cabSetup.yearEstablished,
      timeZone: cab.timeZone ?? form.cabSetup.timeZone,
      hasAdditionalLocations: cab.branches.length > 0,
      locations: cab.branches.map(mapBranchToLocation),
      accreditationStatuses,
      accreditationRecordCount: cab.numberOfAccreditationRecords ?? form.cabSetup.accreditationRecordCount,
      accreditationRecords,
      scopes,
      schemes: restoredCatalogSchemes,
      customSchemes:
        restoredCustomSchemes.length > 0 ? restoredCustomSchemes : form.cabSetup.customSchemes,
      scopeFileName: firstScheme?.scopeListFileUrl ?? form.cabSetup.scopeFileName,
      restrictApplicationsToScope:
        firstScheme?.allowApplicationsOnlyWithinScope ?? form.cabSetup.restrictApplicationsToScope,
      requireTechnicalReviewForExceptions:
        firstScheme?.requireTechnicalReviewForExceptions ??
        form.cabSetup.requireTechnicalReviewForExceptions,
      primaryServiceMarket: cab.primaryServiceMarket ?? form.cabSetup.primaryServiceMarket,
      schemeOwner: cab.schemeOwner ?? form.cabSetup.schemeOwner,
      services: cab.selectedServices.length > 0 ? cab.selectedServices : form.cabSetup.services,
      applyMarkOnlyToAccredited: cab.applyAccreditationMarkOnlyToAccreditedSchemes,
      blockMarkAfterExpiry: cab.blockMarkUseAfterExpiry,
      keepMarkAuditTrail: cab.keepMarkUseAuditTrail,
      accreditationMarkUrl: accreditationMark?.fileUrl ?? form.cabSetup.accreditationMarkUrl,
      schemeMarkUrl: schemeMark?.fileUrl ?? form.cabSetup.schemeMarkUrl,
      markReference: accreditationMark?.markReference ?? schemeMark?.markReference ?? form.cabSetup.markReference,
      markValidFrom: accreditationMark?.validFrom?.slice(0, 10) ?? form.cabSetup.markValidFrom,
      markValidUntil: accreditationMark?.validUntil?.slice(0, 10) ?? form.cabSetup.markValidUntil,
      allowedDocumentUse:
        accreditationMark?.allowedDocumentUse ??
        schemeMark?.allowedDocumentUse ??
        form.cabSetup.allowedDocumentUse,
      certificateBasics: restoredCertificateBasics,
      showCabLogo: certificate.showCabLogo ?? form.cabSetup.showCabLogo,
      showAccreditationMark: certificate.showAccreditationMark ?? form.cabSetup.showAccreditationMark,
      showQrCode: certificate.showQrCode ?? form.cabSetup.showQrCode,
    }),
  }
}
