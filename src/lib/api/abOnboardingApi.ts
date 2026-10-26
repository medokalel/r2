import {
  getTimezoneForCountry,
  OPERATING_LANGUAGE_OPTIONS,
  CAB_COLOR_PALETTES,
  getAllAccreditationBodyOptions,
} from '@/lib/api/cabOnboardingApi'

export { getTimezoneForCountry, OPERATING_LANGUAGE_OPTIONS, CAB_COLOR_PALETTES as AB_COLOR_PALETTES, getAllAccreditationBodyOptions }

export {
  type OrgScopeCategory as AbScopeCategory,
  ORG_SCOPE_CATEGORY_OPTIONS as AB_SCOPE_CATEGORY_OPTIONS,
  ORG_SCOPE_SUB_OPTIONS as AB_SCOPE_SUB_OPTIONS,
  getOrgScopeSubOptions as getAbScopeSubOptions,
} from '@/lib/api/onboardingOrgScopeApi'

export interface AbOnboardingProfile {
  /** Legacy AB Type values — sourced from applicable areas multiselect. */
  abType: string[]
  /** Selected accreditation body names — legacy registration field. */
  accreditationBodyNames: string[]
  /** Legacy backend organization type selected from the org-scope step. */
  organizationType: string
  /** UI org-scope card the user picked (frontend taxonomy). */
  scopeCategory: string
  scopeAreas: string[]
  modules: string[]
  legalEntityName: string
  tradingName: string
  registrationNumber: string
  website: string
  country: string
  city: string
  address: string
  languages: string[]
  theme: 'light' | 'dark'
  logoUrl: string | null
  includeLogoInEmails: boolean
  displayLogoOnCertificates: boolean
  colorPaletteIndex: number | null
  customColor: string
}

// TODO: replace with a real POST once the backend ships an onboarding-profile
// endpoint — mock-latency only, same convention as cabOnboardingApi.ts.
export const saveAbOnboardingProfile: (profile: AbOnboardingProfile) => Promise<{ message: string }> = () =>
  new Promise((resolve) => setTimeout(() => resolve({ message: 'ok' }), 300))
