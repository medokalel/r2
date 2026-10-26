import type { CountryCode } from '@/lib/countries'
import {
  ACCREDITATION_BODY_OTHER,
  getAccreditationBodyOptions,
  type AccreditationBodyOption,
} from '@/lib/api/cabOnboardingApi'
import { isOrgScopeStepComplete, type OrgScopeFormFields } from '@/lib/onboardingOrgScopeForm'
import { isValidFieldKind, isValidWebsite } from '@/lib/validators'
import { type OnboardingModulesFields } from '@/lib/onboardingModulesForm'

export { ACCREDITATION_BODY_OTHER }

export interface CabOnboardingForm extends OrgScopeFormFields, OnboardingModulesFields {
  /** Selected applicable areas from onboarding step 1 — stored as legacy CAB Type. */
  cabType: string[]
  legalEntityName: string
  tradingName: string
  registrationNumber: string
  website: string
  country: CountryCode
  city: string
  address: string
  languages: string[]
  accreditationBody: string
  accreditationBodyOther: string
  logoUrl: string | null
  theme: 'light' | 'dark'
  includeLogoInEmails: boolean
  displayLogoOnCertificates: boolean
  colorPaletteIndex: number | null
  customColor: string
}

export const emptyCabOnboardingForm: CabOnboardingForm = {
  scopeCategory: '',
  scopeAreas: [],
  modules: [],
  cabType: [],
  legalEntityName: '',
  tradingName: '',
  registrationNumber: '',
  website: '',
  country: '' as CountryCode,
  city: '',
  address: '',
  languages: [],
  accreditationBody: '',
  accreditationBodyOther: '',
  logoUrl: null,
  theme: 'light',
  includeLogoInEmails: true,
  displayLogoOnCertificates: true,
  colorPaletteIndex: null,
  customColor: '#143DB8',
}

export function isOrgTypeStepComplete(form: CabOnboardingForm): boolean {
  return isOrgScopeStepComplete(form)
}

export { isModulesStepComplete } from '@/lib/onboardingModulesForm'

export function isOrgDetailsStepComplete(form: CabOnboardingForm): boolean {
  return Boolean(
    form.legalEntityName.trim() &&
      isValidFieldKind(form.legalEntityName, 'text') &&
      isValidFieldKind(form.tradingName, 'text') &&
      isValidFieldKind(form.registrationNumber, 'mixed') &&
      isValidWebsite(form.website)
  )
}

export function isLocationStepComplete(form: CabOnboardingForm): boolean {
  return Boolean(
    form.country &&
      form.city.trim() &&
      form.address.trim() &&
      isValidFieldKind(form.address, 'mixed')
  )
}

export function isAccreditationBodyStepComplete(
  form: Pick<CabOnboardingForm, 'accreditationBody' | 'accreditationBodyOther'>
): boolean {
  if (!form.accreditationBody) return false
  if (form.accreditationBody === ACCREDITATION_BODY_OTHER) {
    return Boolean(form.accreditationBodyOther.trim())
  }
  return true
}

export function getAccreditationBodyDisplayName(
  form: Pick<CabOnboardingForm, 'accreditationBody' | 'accreditationBodyOther' | 'country'>,
  options?: AccreditationBodyOption[]
): string {
  const resolvedOptions = options ?? getAccreditationBodyOptions(form.country)
  if (form.accreditationBody === ACCREDITATION_BODY_OTHER) {
    return form.accreditationBodyOther.trim() || resolvedOptions.find((option) => option.value === ACCREDITATION_BODY_OTHER)?.title || 'Other'
  }
  return resolvedOptions.find((option) => option.value === form.accreditationBody)?.title ?? form.accreditationBody
}

export function isBrandingStepComplete(form: CabOnboardingForm): boolean {
  return form.colorPaletteIndex !== null || /^#[0-9A-F]{6}$/i.test(form.customColor)
}
