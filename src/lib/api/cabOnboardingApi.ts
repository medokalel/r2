import {
  ACCREDITATION_BODY_OTHER_VALUE,
  accreditationBodiesForCountry,
  accreditationBodyLabel,
  sortedAccreditationBodies,
  type AccreditationBody,
  type AccreditationRecognition,
} from '@/lib/accreditationBodies'
import { countryName } from '@/lib/countries'

export interface AccreditationBodyOption {
  value: string
  title: string
  description: string
}

export const ACCREDITATION_BODY_OTHER = ACCREDITATION_BODY_OTHER_VALUE

const RECOGNITION_TEXT: Record<AccreditationRecognition, string> = {
  ILAC_MRA: 'ILAC MRA signatory (Global ACI).',
  ILAC_ASSOCIATE: 'ILAC associate member (Global ACI).',
  IAF_MLA: 'IAF MLA signatory (Global ACI).',
}

function toOnboardingOption(body: AccreditationBody): AccreditationBodyOption {
  const countries = body.countries.map((code) => countryName(code, 'en'))
  const where = countries.length > 1 ? `Regional accreditation body for ${countries.join(', ')}.` : `Accreditation body in ${countries[0]}.`
  return { value: body.value, title: accreditationBodyLabel(body), description: `${where} ${RECOGNITION_TEXT[body.recognition]}` }
}

const OTHER_OPTION: AccreditationBodyOption = {
  value: ACCREDITATION_BODY_OTHER,
  title: 'Other / Not yet accredited',
  description: 'Specify another accreditation body or set up without accreditation.',
}

/** Bodies serving the country (global catalog in src/lib/accreditationBodies.ts), then Other. */
export function getAccreditationBodyOptions(countryCode: string): AccreditationBodyOption[] {
  return [...accreditationBodiesForCountry(countryCode).map(toOnboardingOption), OTHER_OPTION]
}

/** Every body in the global catalog, A–Z (without Other). */
export function getAllAccreditationBodyOptions(): AccreditationBodyOption[] {
  return sortedAccreditationBodies().map(toOnboardingOption)
}

// TODO: replace with a real timezone lookup (e.g. by IANA zone) once the
// backend exposes one — this only covers the countries this app's mock
// country/governorate data already supports well.
const TIMEZONE_BY_COUNTRY: Record<string, string> = {
  EG: 'Africa/Cairo UTC+2',
  SA: 'Asia/Riyadh UTC+3',
  AE: 'Asia/Dubai UTC+4',
  US: 'America/New_York UTC-5',
  GB: 'Europe/London UTC+0',
}

export function getTimezoneForCountry(countryCode: string): string {
  return TIMEZONE_BY_COUNTRY[countryCode] ?? 'UTC+0'
}

export const OPERATING_LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: 'ar', label: 'Arabic' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'es', label: 'Spanish' },
]

/** Each entry is a 5-swatch palette; index is used as the palette's id. */
export const CAB_COLOR_PALETTES: string[][] = [
  ['#d9f2c4', '#8fd9a8', '#3f9d82', '#4c4f9e', '#7c2d80'],
  ['#f0a875', '#e06a6a', '#7a6a9e', '#3c6e91', '#b1637f'],
  ['#f16767', '#fdf6ee', '#6e3352', '#3a1f33', '#a6e8e0'],
  ['#8fc31f', '#345c3f', '#0d3d2a', '#0d1240', '#e619c9'],
  ['#2c3550', '#1f9c86', '#f0923a', '#e3402f', '#f5e642'],
  ['#274472', '#7fa8bd', '#c9b8a3', '#7a5f6c', '#dff2ef'],
]

export interface CabOnboardingProfile {
  /** Legacy CAB Type values — sourced from applicable areas multiselect. */
  cabType: string[]
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
  accreditationBody: string
  accreditationBodyOther: string
  theme: 'light' | 'dark'
  logoUrl: string | null
  includeLogoInEmails: boolean
  displayLogoOnCertificates: boolean
  colorPaletteIndex: number | null
  customColor: string
}

// TODO: replace with a real POST once the backend ships an onboarding-profile
// endpoint — mock-latency only, same convention as applicationDraftApi.ts.
export const saveCabOnboardingProfile: (profile: CabOnboardingProfile) => Promise<{ message: string }> = () =>
  new Promise((resolve) => setTimeout(() => resolve({ message: 'ok' }), 300))
