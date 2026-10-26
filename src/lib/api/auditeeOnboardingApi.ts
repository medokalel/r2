import { getTimezoneForCountry, OPERATING_LANGUAGE_OPTIONS, CAB_COLOR_PALETTES } from '@/lib/api/cabOnboardingApi'

export { getTimezoneForCountry, OPERATING_LANGUAGE_OPTIONS, CAB_COLOR_PALETTES as AUDITEE_COLOR_PALETTES }

export interface AuditeeOnboardingProfile {
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
export const saveAuditeeOnboardingProfile: (profile: AuditeeOnboardingProfile) => Promise<{ message: string }> = () =>
  new Promise((resolve) => setTimeout(() => resolve({ message: 'ok' }), 300))
