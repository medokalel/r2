/**
 * CAB Profile validation, page by page, as clickable issues: reuses the setup wizard's
 * getCabSetupReviewSections (field ids per section) and names each field in plain words.
 */
import type { TFunction } from 'i18next'
import { getCabSetupReviewSections, type CabSetupReviewSectionState } from '@/lib/cabSetupForm'
import type { UnifiedOnboardingForm } from '@/lib/unifiedOnboardingForm'

export type CabProfilePage =
  | 'identity'
  | 'locations'
  | 'accreditationStatus'
  | 'accreditationRecords'
  | 'schemes'
  | 'scope'
  | 'pricing'
  | 'marks'
  | 'certificate'

export interface CabProfileIssue {
  page: CabProfilePage
  fieldId: string
  message: string
}

/** Field id (or id prefix for repeated records) to the i18n key of its label. Longest prefixes first. */
const FIELD_LABELS: Array<[string, string]> = [
  ['cab-setup-legal-name', 'cab.setup.profile.legalName'],
  ['cab-setup-trading-name', 'cab.setup.profile.tradingName'],
  ['cab-setup-registration-number', 'cab.setup.profile.registrationNumber'],
  ['cab-setup-activities', 'cab.setup.profile.activity'],
  ['cab-setup-website', 'cab.setup.profile.website'],
  ['cab-setup-year-established', 'cab.setup.profile.yearEstablished'],
  ['cab-setup-location-name-', 'cab.setup.locations.locationName'],
  ['cab-setup-location-address-', 'cab.setup.locations.address'],
  ['cab-setup-country', 'cab.setup.locations.headOfficeCountry'],
  ['cab-setup-city', 'cab.setup.locations.city'],
  ['cab-setup-address', 'cab.setup.locations.mainOfficeAddress'],
  ['cab-setup-timezone', 'cab.setup.locations.timeZone'],
  ['cab-setup-languages', 'cab.setup.locations.languages'],
  ['cab-setup-accreditation-status', 'cab.companyProfile.pages.accreditationStatus.title'],
  ['cab-setup-record-count', 'cab.setup.accreditationStatus.recordCount'],
  ['cab-setup-acc-body-other-', 'cab.setup.accreditationRecords.bodyOther'],
  ['cab-setup-acc-body-', 'cab.setup.accreditationRecords.body'],
  ['cab-setup-acc-standard-', 'cab.setup.accreditationRecords.standard'],
  ['cab-setup-acc-application-', 'cab.setup.accreditationRecords.applicationReference'],
  ['cab-setup-acc-number-', 'cab.setup.accreditationRecords.number'],
  ['cab-setup-acc-issue-', 'cab.setup.accreditationRecords.issueDate'],
  ['cab-setup-acc-expiry-', 'cab.setup.accreditationRecords.expiryDate'],
  ['cab-setup-schemes', 'cab.setup.schemes.schemesLabel'],
  ['cab-setup-services', 'cab.setup.schemes.servicesLabel'],
  ['cab-setup-custom-scheme-name-', 'cab.setup.schemes.customSchemeName'],
  ['cab-setup-custom-scheme-owner-', 'cab.setup.schemes.customSchemeOwner'],
  ['cab-setup-scheme-owner', 'cab.setup.schemes.schemeOwner'],
  ['cab-setup-scope-scheme-', 'cab.setup.scope.scheme'],
  ['cab-setup-scope-location-', 'cab.setup.scope.location'],
  ['cab-setup-scope-file', 'cab.setup.scope.uploadTitle'],
  ['cab-setup-mark-reference', 'cab.setup.marks.markReference'],
  ['cab-setup-mark-valid-until', 'cab.setup.marks.validUntil'],
  ['cab-setup-document-use', 'cab.setup.marks.allowedUse'],
  ['cab-setup-cert-signatory-name-', 'cab.setup.certificate.signatoryName'],
  ['cab-setup-cert-signatory-title-', 'cab.setup.certificate.signatoryTitle'],
  ['cab-setup-cert-format-', 'cab.setup.certificate.numberFormat'],
]

export function cabFieldLabel(t: TFunction, fieldId: string): string {
  const match = FIELD_LABELS.find(([prefix]) => fieldId === prefix || (prefix.endsWith('-') && fieldId.startsWith(prefix)))
  return match ? t(match[1]) : fieldId
}

function pageOf(section: CabSetupReviewSectionState['key'], fieldId: string): CabProfilePage {
  if (section === 'accreditation') {
    return fieldId === 'cab-setup-accreditation-status' || fieldId === 'cab-setup-record-count'
      ? 'accreditationStatus'
      : 'accreditationRecords'
  }
  return section
}

/** Every issue of the CAB profile form, tagged with the profile page that holds the field. */
export function getCabProfileIssues(t: TFunction, form: UnifiedOnboardingForm): CabProfileIssue[] {
  const sections = getCabSetupReviewSections(form.cabSetup, {
    legalEntityName: form.legalEntityName,
    tradingName: form.tradingName,
    registrationNumber: form.registrationNumber,
    website: form.website,
    country: form.country,
    city: form.city,
    address: form.address,
    languages: form.languages,
  })
  return sections.flatMap((section) =>
    section.issues.map((issue) => {
      const field = cabFieldLabel(t, issue.fieldId)
      return {
        page: pageOf(section.key, issue.fieldId),
        fieldId: issue.fieldId,
        message:
          issue.kind === 'required'
            ? t('ui.errorSummary.required', { field })
            : t('ui.errorSummary.invalid', { field }),
      }
    }),
  )
}
