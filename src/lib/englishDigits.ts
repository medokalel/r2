import { cn } from '@/lib/utils'

const EASTERN_ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹'

// Invisible Unicode directional/formatting marks (RLM, LRM, ALM, zero-width
// space/joiners, BOM). Browsers and RTL-aware keyboards silently insert
// these around digits typed in an RTL page context. They're invisible and
// can't be deleted with backspace, but they break exact-match validation
// (phone numbers, etc.) and would corrupt the value if ever sent to the
// backend as-is — so they're stripped at the source, not just at validation.
const INVISIBLE_MARKS = /[\u200B-\u200F\u061C\uFEFF]/g

/** Force Western (0-9) numerals for display in Arabic UI. */
export const englishDigitsClassName = 'english-digits'

export const englishDigitsLtrClassName = 'english-digits english-digits-ltr'

export function toEnglishDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (char) => {
      const index = EASTERN_ARABIC_DIGITS.indexOf(char)
      return index >= 0 ? String(index) : char
    })
    .replace(/[۰-۹]/g, (char) => {
      const index = PERSIAN_DIGITS.indexOf(char)
      return index >= 0 ? String(index) : char
    })
    .replace(INVISIBLE_MARKS, '')
}

export function englishDigitsCn(...classes: Array<string | undefined | false>) {
  return cn(englishDigitsClassName, ...classes)
}