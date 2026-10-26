import { isValidPhoneNumber as isValidPhoneNumberLib } from 'libphonenumber-js'
import type { CountryCode } from '@/lib/countries'

/**
 * Pure format validators — no React, no i18n, no UI concerns.
 * Each function just answers "is this value shaped correctly?".
 * Empty values are treated as valid here; whether a field is *required*
 * is a separate concern handled by applicationValidation.ts.
 */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Format-only check — an empty value is considered valid (not yet typed). */
export function isValidEmailFormat(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  return EMAIL_PATTERN.test(trimmed)
}

/**
 * Accepts URLs with or without a scheme (e.g. "google.com" as well as
 * "https://google.com"), since users commonly omit "https://" when typing.
 * Callers that need a normalized value for submission/display should use
 * `normalizeWebsiteUrl` below.
 */
export function isValidWebsite(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const url = new URL(withScheme)
    // Require at least one dot in the hostname so "https://asdf" isn't accepted.
    return url.hostname.includes('.')
  } catch {
    return false
  }
}

/** Absolute http(s) URL — the API's `uri` format needs a scheme. Empty is valid. */
export function isValidHttpUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  try {
    const url = new URL(trimmed)
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.')
  } catch {
    return false
  }
}

/** Prepends https:// if the user typed a bare domain, for storage/display. */
export function normalizeWebsiteUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

// Same invisible marks stripped at input time in englishDigits.ts — kept
// here too so values loaded from an existing draft (saved before that fix
// existed) still validate correctly instead of failing on invisible junk.
const INVISIBLE_MARKS = /[\u200B-\u200F\u061C\uFEFF]/g

export function isValidPhoneNumber(value: string, countryCode: CountryCode): boolean {
  const trimmed = value.replace(INVISIBLE_MARKS, '').trim()
  if (!trimmed) return true
  return isValidPhoneNumberLib(trimmed, countryCode)
}

export type FieldValueKind = 'number' | 'text' | 'mixed'

const NUMBER_ONLY = /^\d+$/
const TEXT_ONLY = /^[\p{L}\p{M}\s.'’&-]+$/u
const MIXED_VALUE = /^[\p{L}\p{M}\p{N}\s.,/#&()+\-_'’:@{}]+$/u

/** Empty is valid; required-ness is checked separately. */
export function isValidFieldKind(value: string, kind: FieldValueKind): boolean {
  const trimmed = value.replace(INVISIBLE_MARKS, '').trim()
  if (!trimmed) return true
  if (kind === 'number') return NUMBER_ONLY.test(trimmed)
  if (kind === 'text') return TEXT_ONLY.test(trimmed)
  return MIXED_VALUE.test(trimmed)
}

export function sanitizeFieldKind(value: string, kind: FieldValueKind): string {
  const cleaned = value.replace(INVISIBLE_MARKS, '')
  if (kind === 'number') return cleaned.replace(/\D/g, '')
  if (kind === 'text') return cleaned.replace(/[^\p{L}\p{M}\s.'’&-]/gu, '')
  return cleaned.replace(/[^\p{L}\p{M}\p{N}\s.,/#&()+\-_'’:@{}]/gu, '')
}