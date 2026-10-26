import i18next from 'i18next'
import { getCountries } from 'libphonenumber-js'
import { countryName } from '@/lib/countries'

let byEnglishName: Map<string, string> | null = null

/**
 * Shows a country the API returns as an English name ("Saudi Arabia") or an ISO code ("SA")
 * in the UI language. Unknown values are returned unchanged.
 */
export function localizeCountry(value: string | null | undefined, language: string): string {
  if (!value) return ''
  const trimmed = value.trim()
  let code = /^[A-Za-z]{2}$/.test(trimmed) ? trimmed.toUpperCase() : null
  if (!code) {
    if (!byEnglishName) {
      byEnglishName = new Map(getCountries().map((c) => [countryName(c, 'en').toLowerCase(), c]))
    }
    code = byEnglishName.get(trimmed.toLowerCase()) ?? null
  }
  if (!code) return value
  const name = countryName(code, language.startsWith('ar') ? 'ar' : 'en')
  return name === code ? value : name
}

/** `localizeCountry` in the current UI language — for read-only country text (lists, details, PDFs). */
export function displayCountry(value: string | null | undefined): string {
  return localizeCountry(value, i18next.language ?? 'en')
}
