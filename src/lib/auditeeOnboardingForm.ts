import type { CountryCode } from '@/lib/countries'
import { isOrgScopeStepComplete, type OrgScopeFormFields } from '@/lib/onboardingOrgScopeForm'
import { type OnboardingModulesFields } from '@/lib/onboardingModulesForm'

export interface AuditeeOnboardingForm extends OrgScopeFormFields, OnboardingModulesFields {
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

export const emptyAuditeeOnboardingForm: AuditeeOnboardingForm = {
  scopeCategory: '',
  scopeAreas: [],
  modules: [],
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

export function isOrgTypeStepComplete(form: AuditeeOnboardingForm): boolean {
  return isOrgScopeStepComplete(form)
}

export { isModulesStepComplete } from '@/lib/onboardingModulesForm'

export function isOrgDetailsStepComplete(form: AuditeeOnboardingForm): boolean {
  return Boolean(form.legalEntityName.trim())
}

export function isLocationStepComplete(form: AuditeeOnboardingForm): boolean {
  return Boolean(form.country && form.city.trim() && form.address.trim())
}

export function isBrandingStepComplete(form: AuditeeOnboardingForm): boolean {
  return form.colorPaletteIndex !== null || /^#[0-9A-F]{6}$/i.test(form.customColor)
}
