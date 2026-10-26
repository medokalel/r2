/**
 * CAB seller identity for tax invoices (ZATCA): VAT number + national address.
 * Real endpoints: GET /cab-profile (→ { cab }), PATCH /cab-profile { vatNumber, addressStreet,
 * addressBuildingNumber, addressAdditionalNumber, addressDistrict, addressPostalCode }.
 * A CAB in Saudi Arabia needs a VAT number before it can issue invoices (VAT_NUMBER_REQUIRED).
 * In the preview (demo mode) CASCO (Jeddah) has a sample VAT number and address in the demo store.
 */
import type { TFunction } from 'i18next'
import { authorizedRequest } from '@/lib/api/authorizedClient'
import { DEMO_CAB } from '@/lib/api/demo/dataset'
import { isDemoMode, loadState, saveState } from '@/lib/api/demo/demoStore'

export interface CabTaxProfile {
  vatNumber: string
  addressStreet: string
  addressBuildingNumber: string
  addressAdditionalNumber: string
  addressDistrict: string
  addressPostalCode: string
}

export type CabTaxField = keyof CabTaxProfile

export const EMPTY_CAB_TAX_PROFILE: CabTaxProfile = {
  vatNumber: '',
  addressStreet: '',
  addressBuildingNumber: '',
  addressAdditionalNumber: '',
  addressDistrict: '',
  addressPostalCode: '',
}

/** Sample seller identity of the demo CAB (CASCO, Jeddah). */
export const DEMO_CAB_TAX_PROFILE: CabTaxProfile = {
  vatNumber: '310122393500003',
  addressStreet: 'Prince Sultan Road',
  addressBuildingNumber: '2322',
  addressAdditionalNumber: '8040',
  addressDistrict: 'Al Zahraa',
  addressPostalCode: '23425',
}

const DEMO_KEY = 'cab-tax-profile'
/** Demo store copy (used by the e-invoice preview too). */
export const demoCabTaxProfile = () => loadState<CabTaxProfile>(DEMO_KEY, () => ({ ...DEMO_CAB_TAX_PROFILE }))

const FIELDS = Object.keys(EMPTY_CAB_TAX_PROFILE) as CabTaxField[]
const pick = (source: Partial<Record<CabTaxField, string | null>>): CabTaxProfile => {
  const out: CabTaxProfile = { ...EMPTY_CAB_TAX_PROFILE }
  for (const key of FIELDS) out[key] = source[key] ?? ''
  return out
}

/** Same rules as the backend (cab.validation.js). Empty values are allowed. */
export function validateCabTaxProfile(t: TFunction, value: CabTaxProfile): Partial<Record<CabTaxField, string>> {
  const errors: Partial<Record<CabTaxField, string>> = {}
  const check = (field: CabTaxField, ok: boolean, message: string) => {
    if (value[field].trim() && !ok) errors[field] = message
  }
  check('vatNumber', /^3\d{13}3$/.test(value.vatNumber.trim()), t('cab.companyProfile.tax.errors.vat', 'VAT number must be 15 digits starting and ending with 3.'))
  check('addressBuildingNumber', /^\d{4}$/.test(value.addressBuildingNumber.trim()), t('cab.companyProfile.tax.errors.building', 'Building number must be 4 digits.'))
  check('addressAdditionalNumber', /^\d{4}$/.test(value.addressAdditionalNumber.trim()), t('cab.companyProfile.tax.errors.additional', 'Additional number must be 4 digits.'))
  check('addressPostalCode', /^\d{5}$/.test(value.addressPostalCode.trim()), t('cab.companyProfile.tax.errors.postal', 'Postal code must be 5 digits.'))
  check('addressStreet', value.addressStreet.trim().length <= 200, t('cab.companyProfile.tax.errors.tooLong', 'This value is too long.'))
  check('addressDistrict', value.addressDistrict.trim().length <= 120, t('cab.companyProfile.tax.errors.tooLong', 'This value is too long.'))
  return errors
}

/** The seller identity plus the CAB country (a Saudi CAB needs the VAT number to issue invoices). */
export async function getCabTaxProfile(): Promise<{ value: CabTaxProfile; country: string }> {
  if (isDemoMode()) return { value: { ...demoCabTaxProfile() }, country: DEMO_CAB.country }
  const { cab } = await authorizedRequest<{ cab: Partial<Record<CabTaxField | 'country', string | null>> }>('/cab-profile')
  return { value: pick(cab ?? {}), country: cab?.country ?? '' }
}

export async function saveCabTaxProfile(value: CabTaxProfile): Promise<CabTaxProfile> {
  const body = pick(Object.fromEntries(FIELDS.map((k) => [k, value[k].trim()])) as Partial<Record<CabTaxField, string>>)
  if (isDemoMode()) {
    saveState(DEMO_KEY, body)
    return { ...body }
  }
  const { cab } = await authorizedRequest<{ cab: Partial<Record<CabTaxField, string | null>> }>('/cab-profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return pick(cab ?? body)
}

/** True when the demo / real CAB is in Saudi Arabia (VAT number required to issue invoices). */
export const isSaudiCountry = (country: string | null | undefined) =>
  /^(sa|ksa|saudi arabia|kingdom of saudi arabia|السعودية|المملكة العربية السعودية)$/i.test((country ?? '').trim())
