/**
 * Saudi National Address lookup (SPL / Saudi Post).
 * Real endpoint: GET /lookup/national-address?shortCode=RRRD2929
 *                GET /lookup/national-address?buildingNumber=2929&postalCode=12214[&additionalNumber=7778]
 *                (&lang=ar|en)
 *
 * Errors are rethrown as `Error(code)` so the UI can show its own text:
 *   NATIONAL_ADDRESS_NOT_FOUND · NATIONAL_ADDRESS_UNAVAILABLE (not configured) ·
 *   NATIONAL_ADDRESS_PROVIDER_ERROR (SPL failed / timed out)
 * In the preview (demo mode) a realistic sample is returned for any well-formed code;
 * codes ending in 0000 behave as "not found".
 */
import { ApiError } from '@/lib/api/client'
import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode } from '@/lib/api/demo/demoStore'

export interface NationalAddress {
  shortAddress: string
  buildingNumber: string
  street: string
  district: string
  city: string
  postalCode: string
  additionalNumber: string
  region: string
  unitNumber: string
  country: string
  latitude: number | null
  longitude: number | null
}

export type NationalAddressQuery = { shortCode: string } | { buildingNumber: string; postalCode: string; additionalNumber?: string }

export const SHORT_ADDRESS_PATTERN = /^[A-Za-z]{4}\d{4}$/

const ERROR_CODES = ['NATIONAL_ADDRESS_NOT_FOUND', 'NATIONAL_ADDRESS_UNAVAILABLE', 'NATIONAL_ADDRESS_PROVIDER_ERROR'] as const
export type NationalAddressErrorCode = (typeof ERROR_CODES)[number]

const SAMPLES: Record<string, { en: [string, string, string, string]; ar: [string, string, string, string]; postal: string; lat: number; lng: number }> = {
  R: { en: ['Riyadh', 'Riyadh', 'Al Olaya', 'King Fahd Road'], ar: ['الرياض', 'الرياض', 'العليا', 'طريق الملك فهد'], postal: '12214', lat: 24.7136, lng: 46.6753 },
  M: { en: ['Makkah', 'Jeddah', 'Al Rawdah', 'Prince Sultan Road'], ar: ['مكة المكرمة', 'جدة', 'الروضة', 'طريق الأمير سلطان'], postal: '23435', lat: 21.5433, lng: 39.1728 },
  E: { en: ['Eastern Province', 'Dammam', 'Al Faisaliyah', 'King Saud Street'], ar: ['المنطقة الشرقية', 'الدمام', 'الفيصلية', 'شارع الملك سعود'], postal: '32272', lat: 26.4207, lng: 50.0888 },
}

function demoAddress(query: NationalAddressQuery, lang: 'ar' | 'en'): NationalAddress {
  const short = 'shortCode' in query ? query.shortCode.toUpperCase() : ''
  const building = 'shortCode' in query ? short.slice(4) : query.buildingNumber
  if (building === '0000') throw new Error('NATIONAL_ADDRESS_NOT_FOUND')
  const key = SAMPLES[short[0]] ? short[0] : 'R'
  const sample = SAMPLES[key]
  const [region, city, district, street] = sample[lang]
  return {
    shortAddress: short || `${key}RRD${building}`,
    buildingNumber: building,
    street,
    district,
    city,
    postalCode: 'postalCode' in query ? query.postalCode : sample.postal,
    additionalNumber: 'additionalNumber' in query && query.additionalNumber ? query.additionalNumber : String(7000 + (Number(building) % 1000)),
    region,
    unitNumber: '',
    country: 'SA',
    latitude: sample.lat,
    longitude: sample.lng,
  }
}

export async function lookupNationalAddress(query: NationalAddressQuery, lang: 'ar' | 'en' = 'en'): Promise<NationalAddress> {
  if (isDemoMode()) {
    await new Promise((resolve) => setTimeout(resolve, 450))
    return demoAddress(query, lang)
  }
  const qs = new URLSearchParams({ lang })
  if ('shortCode' in query) qs.set('shortCode', query.shortCode.trim().toUpperCase())
  else {
    qs.set('buildingNumber', query.buildingNumber.trim())
    qs.set('postalCode', query.postalCode.trim())
    if (query.additionalNumber?.trim()) qs.set('additionalNumber', query.additionalNumber.trim())
  }
  try {
    return await authorizedRequest<NationalAddress>(`/lookup/national-address?${qs.toString()}`)
  } catch (err) {
    if (err instanceof ApiError) {
      const code = ERROR_CODES.find((c) => err.message.startsWith(c))
      if (code) throw new Error(code, { cause: err })
    }
    throw err
  }
}
