import type { EntityType } from '@/lib/entityTypes'
import type { OrgScopeCategory } from '@/lib/api/onboardingOrgScopeApi'
import type { CountryCode } from '@/lib/countries'
import { mapOrgScopeToBackendType } from '@/lib/orgScopeBackendMapping'
import { isValidWebsite } from '@/lib/validators'
import { isOrgScopeStepComplete, type OrgScopeFormFields } from '@/lib/onboardingOrgScopeForm'
import { type OnboardingModulesFields } from '@/lib/onboardingModulesForm'
import { emptyCabSetupForm, type CabSetupForm } from '@/lib/cabSetupForm'
import { emptyAbSetupForm, type AbSetupForm } from '@/lib/abSetupForm'
import { emptyIaSetupForm, type IaSetupForm } from '@/lib/iaSetupForm'
import { emptySoSetupForm, type SoSetupForm } from '@/lib/soSetupForm'
import { emptySaSetupForm, type SaSetupForm } from '@/lib/saSetupForm'

export interface UnifiedOnboardingForm extends OrgScopeFormFields, OnboardingModulesFields {
  entityType: EntityType | ''
  /** CAB applicable areas — mirrors scopeAreas for certification bodies. */
  cabType: string[]
  /** AB applicable areas — mirrors scopeAreas for accreditation bodies. */
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
  accreditationBody: string
  accreditationBodyOther: string
  logoUrl: string | null
  theme: 'light' | 'dark'
  includeLogoInEmails: boolean
  displayLogoOnCertificates: boolean
  colorPaletteIndex: number | null
  customColor: string
  /** Extra state for the 10-screen CAB setup wizard; unused by other entity types. */
  cabSetup: CabSetupForm
  /** Extra state for the 10-screen AB setup wizard; unused by other entity types. */
  abSetup: AbSetupForm
  /** Extra state for the 10-screen Internal Audit setup wizard. */
  iaSetup: IaSetupForm
  /** Extra state for the 10-screen Scheme Owner setup wizard. */
  soSetup: SoSetupForm
  /** Extra state for the 10-screen Supplier Audit setup wizard. */
  saSetup: SaSetupForm
}

export const emptyUnifiedOnboardingForm: UnifiedOnboardingForm = {
  entityType: '',
  scopeCategory: '',
  scopeAreas: [],
  modules: [],
  cabType: [],
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
  accreditationBody: '',
  accreditationBodyOther: '',
  logoUrl: null,
  theme: 'light',
  includeLogoInEmails: true,
  displayLogoOnCertificates: true,
  colorPaletteIndex: null,
  customColor: '#143DB8',
  cabSetup: emptyCabSetupForm,
  abSetup: emptyAbSetupForm,
  iaSetup: emptyIaSetupForm,
  soSetup: emptySoSetupForm,
  saSetup: emptySaSetupForm,
}

export function isOrgTypeStepComplete(form: UnifiedOnboardingForm): boolean {
  return isOrgScopeStepComplete(form)
}

export function scopeCategoryToEntityType(category: OrgScopeCategory): EntityType {
  return mapOrgScopeToBackendType(category)
}

export function syncCabTypeFromScopeAreas(form: Pick<UnifiedOnboardingForm, 'entityType' | 'scopeAreas'>): string[] {
  return form.entityType === 'CERTIFICATION_BODY' ? [...form.scopeAreas] : []
}

export function syncAbTypeFromScopeAreas(form: Pick<UnifiedOnboardingForm, 'entityType' | 'scopeAreas'>): string[] {
  return form.entityType === 'ACCREDITATION_BODY' ? [...form.scopeAreas] : []
}

export { isModulesStepComplete } from '@/lib/onboardingModulesForm'

export function isSharedWebsiteValid(form: Pick<UnifiedOnboardingForm, 'website'>): boolean {
  return isValidWebsite(form.website)
}

export function isOrgDetailsStepComplete(form: UnifiedOnboardingForm): boolean {
  if (!isSharedWebsiteValid(form)) return false
  if (form.scopeCategory === 'ACCREDITATION_BODY') {
    return form.accreditationBodyNames.length > 0
  }
  return Boolean(form.legalEntityName.trim())
}

export function isLocationStepComplete(form: UnifiedOnboardingForm): boolean {
  return Boolean(form.country && form.city.trim() && form.address.trim())
}

export { isAccreditationBodyStepComplete } from '@/lib/cabOnboardingForm'

export function isBrandingStepComplete(form: UnifiedOnboardingForm): boolean {
  return form.colorPaletteIndex !== null || /^#[0-9A-F]{6}$/i.test(form.customColor)
}
