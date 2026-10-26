import { EMAIL_PATTERN } from '@/lib/validators'

export const MIN_PASSWORD_LENGTH = 8

/** Required-field check — an empty value is considered invalid. */
export function isValidRequiredEmail(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length > 0 && EMAIL_PATTERN.test(trimmed)
}

/** Login accepts a full email or a local demo username (mapped to @icasco.co). */
export function isValidLoginIdentifier(value: string): boolean {
  const trimmed = value.trim()
  if (isValidRequiredEmail(trimmed)) return true
  return /^[a-zA-Z0-9._-]{3,}$/.test(trimmed)
}

export function normalizeLoginIdentifier(value: string): string {
  const trimmed = value.trim()
  return isValidRequiredEmail(trimmed) ? trimmed : `${trimmed}@icasco.co`
}

export function isValidPassword(value: string): boolean {
  return value.length >= MIN_PASSWORD_LENGTH
}

export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password.length > 0 && password === confirmPassword
}