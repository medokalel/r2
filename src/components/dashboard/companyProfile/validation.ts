import type { TFunction } from 'i18next'
import { collectErrors, type ValidationRules } from '@/hooks/useFieldValidation'
import { emailRule, phoneRule, textRule, urlRule, wholeNumberRule } from '@/lib/fieldRules'
import type { CountryCode } from '@/lib/countries'
import type { OrgBranch, OrgDocument } from '@/lib/api/organizationProfileApi'
import { REQUIRED_DOC_TYPES } from './constants'
import type {
  BranchFormValues,
  NationalAddressFormValues,
  ProfileFormValues,
  ProfileStepData,
  StepKey,
} from './types'

// Field rules follow the backend profile schemas (employeeCount integer >= 0,
// ISO dates, googleMapUrl uri, email format). `optional` skips "required" so the
// same rules can guard partial draft saves.
const mixed = (t: TFunction, optional: boolean) => textRule(t, { kind: 'mixed', optional })

function startOfTomorrow(): Date {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 1)
  return date
}

interface RuleOptions {
  optional?: boolean
}

export function basicDataRules(
  t: TFunction,
  { optional = false, identityEditable = false }: RuleOptions & { identityEditable?: boolean } = {}
): ValidationRules<ProfileFormValues> {
  return {
    organizationName: mixed(t, optional),
    tradeName: mixed(t, optional),
    commercialRegisterNumber: mixed(t, optional),
    unifiedNumber: mixed(t, true),
    vatNumber: (value) =>
      value.trim() && !/^3\d{13}3$/.test(value.trim())
        ? t('companyProfile.basicDataCard.vatNumberError', 'VAT number must be 15 digits starting and ending with 3.')
        : undefined,
    logoUrl: (value) => urlRule(t)(value ?? ''),
    authorizedPersonName: textRule(t, { kind: identityEditable ? 'text' : undefined, optional }),
    email: emailRule(t, optional),
    phoneNumber: (value, form) =>
      identityEditable
        ? phoneRule(t, form.countryCode, optional)(value)
        : textRule(t, { optional })(value),
    employeeCount: wholeNumberRule(t, optional),
    registrationDate: (date) => {
      if (!date) return optional ? undefined : t('validation.required')
      return date >= startOfTomorrow() ? t('validation.futureDate') : undefined
    },
    inactiveReason: (value, form) =>
      form.allProductionLinesActive ? undefined : textRule(t, { optional })(value),
  }
}

export function addressRules(t: TFunction, { optional = false }: RuleOptions = {}): ValidationRules<ProfileFormValues> {
  return {
    city: mixed(t, optional),
    district: mixed(t, optional),
    street: mixed(t, optional),
    buildingNumber: mixed(t, optional),
    postalCode: mixed(t, optional),
    additionalNumber: mixed(t, true),
    googleMapUrl: urlRule(t),
  }
}

export function nationalAddressRules(
  t: TFunction,
  hasNationalAddress: boolean,
  { optional = false }: RuleOptions = {}
): ValidationRules<NationalAddressFormValues> {
  if (!hasNationalAddress) return {}
  const date = (value: Date | undefined) => (value || optional ? undefined : t('validation.required'))
  return {
    certificateNumber: mixed(t, optional),
    street: mixed(t, optional),
    buildingNumber: mixed(t, optional),
    district: mixed(t, optional),
    postalCode: mixed(t, optional),
    city: mixed(t, optional),
    additionalNumber: mixed(t, true),
    issueDate: date,
    expiryDate: (value, form) =>
      date(value) ??
      (value && form.issueDate && value <= form.issueDate ? t('validation.expiryAfterIssue') : undefined),
  }
}

export function branchRules(
  t: TFunction,
  countryCode: CountryCode,
  { optional = false }: RuleOptions = {}
): ValidationRules<BranchFormValues> {
  return {
    branchName: mixed(t, optional),
    commercialRegisterNumber: mixed(t, optional),
    address: mixed(t, optional),
    googleMapUrl: urlRule(t, optional),
    branchManagerName: textRule(t, { kind: 'text', optional }),
    phoneNumber: phoneRule(t, countryCode, optional),
    employeeCount: wholeNumberRule(t, optional),
  }
}

// Gating needs pass/fail only, so messages are irrelevant — rules get the key as text.
const keyOnly = ((key: string) => key) as unknown as TFunction
const hasErrors = (errors: object) => Object.keys(errors).length > 0

/** Every required basic-data field is present and well-formed (read-only identity fields). */
export function areBasicDataFieldsValid(form: ProfileFormValues): boolean {
  return !hasErrors(collectErrors(form, basicDataRules(keyOnly)))
}

export function isNationalAddressComplete(form: ProfileFormValues): boolean {
  return !hasErrors(
    collectErrors(form.nationalAddress, nationalAddressRules(keyOnly, form.nationalAddress.hasNationalAddress))
  )
}

/** True when any typed value is malformed — empty fields are fine for a draft. */
export function hasProfileFormatErrors(form: ProfileFormValues, identityEditable: boolean): boolean {
  return (
    hasErrors(collectErrors(form, basicDataRules(keyOnly, { optional: true, identityEditable }))) ||
    hasErrors(collectErrors(form, addressRules(keyOnly, { optional: true }))) ||
    hasErrors(
      collectErrors(
        form.nationalAddress,
        nationalAddressRules(keyOnly, form.nationalAddress.hasNationalAddress, { optional: true })
      )
    )
  )
}

export function isBasicDataComplete(form: ProfileFormValues, identityEditable = false): boolean {
  return Boolean(
    form.logoUrl &&
      form.companySummary.trim() &&
      form.industries.length > 0 &&
      form.organizationStatus &&
      !hasErrors(collectErrors(form, basicDataRules(keyOnly, { identityEditable })))
  )
}

export function isAddressComplete(form: ProfileFormValues): boolean {
  return Boolean(
    form.country &&
      !hasErrors(collectErrors(form, addressRules(keyOnly))) &&
      !hasErrors(
        collectErrors(
          form.nationalAddress,
          nationalAddressRules(keyOnly, form.nationalAddress.hasNationalAddress, { optional: true })
        )
      )
  )
}

export function isBranchesComplete(branches: OrgBranch[]): boolean {
  return branches.length > 0
}

export function isDocumentsComplete(documents: OrgDocument[]): boolean {
  return REQUIRED_DOC_TYPES.every((type) =>
    documents.some((doc) => doc.documentType === type)
  )
}

export function isStepComplete(step: StepKey, data: ProfileStepData): boolean {
  switch (step) {
    case 'basicData':
      return isBasicDataComplete(data.form)
    case 'address':
      return isAddressComplete(data.form)
    case 'branches':
      return isBranchesComplete(data.branches)
    case 'officialDocs':
      return isDocumentsComplete(data.documents)
  }
}

export function isBranchFormComplete(form: BranchFormValues, countryCode: CountryCode): boolean {
  return form.sectors.length > 0 && !hasErrors(collectErrors(form, branchRules(keyOnly, countryCode)))
}
