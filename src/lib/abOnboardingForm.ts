import type { CountryCode } from '@/lib/countries'
import { isOrgScopeStepComplete, type OrgScopeFormFields } from '@/lib/onboardingOrgScopeForm'
import { type OnboardingModulesFields } from '@/lib/onboardingModulesForm'

export interface AbOnboardingForm extends OrgScopeFormFields, OnboardingModulesFields {
  /** Selected applicable areas from onboarding step 1 — stored as legacy AB Type. */
  abType: string[]
  /** Selected accreditation body names when org scope is Accreditation Body. */
  accreditationBodyNames: string[]
  legalEntityName: string
  tradingName: string
  registrationNumber: string
  website: string
  country: CountryCode
  city: string
  address: string
  languages: string[]
  logoUrl: string | null
  theme: 'light' | 'dark'
  includeLogoInEmails: boolean
  displayLogoOnCertificates: boolean
  colorPaletteIndex: number | null
  customColor: string
}

export const emptyAbOnboardingForm: AbOnboardingForm = {
  scopeCategory: '',
  scopeAreas: [],
  modules: [],
  abType: [],
  accreditationBodyNames: [],
  legalEntityName: '',
  tradingName: '',
  registrationNumber: '',
  website: '',
  country: '' as CountryCode,
  city: '',
  address: '',
  languages: [],
  logoUrl: null,
  theme: 'light',
  includeLogoInEmails: true,
  displayLogoOnCertificates: true,
  colorPaletteIndex: null,
  customColor: '#143DB8',
}

export function isOrgTypeStepComplete(form: AbOnboardingForm): boolean {
  return isOrgScopeStepComplete(form)
}

export { isModulesStepComplete } from '@/lib/onboardingModulesForm'

export function isOrgDetailsStepComplete(form: AbOnboardingForm): boolean {
  if (form.scopeCategory === 'ACCREDITATION_BODY') {
    return form.accreditationBodyNames.length > 0
  }
  return Boolean(form.legalEntityName.trim())
}

export function isLocationStepComplete(form: AbOnboardingForm): boolean {
  return Boolean(form.country && form.city.trim() && form.address.trim())
}

export function isBrandingStepComplete(form: AbOnboardingForm): boolean {
  return form.colorPaletteIndex !== null || /^#[0-9A-F]{6}$/i.test(form.customColor)
}
