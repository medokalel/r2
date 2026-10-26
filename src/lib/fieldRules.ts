import type { TFunction } from 'i18next'
import type { CountryCode } from '@/lib/countries'
import {
  EMAIL_PATTERN,
  isValidFieldKind,
  isValidHttpUrl,
  isValidPhoneNumber,
  type FieldValueKind,
} from '@/lib/validators'

/**
 * Rule factories shared by every form: each returns `value -> message | undefined`
 * so they plug straight into `useFieldValidation` / `collectErrors`.
 * Limits mirror the backend Joi schemas (e.g. createClientSchema min/max).
 */
const KIND_MESSAGE: Record<FieldValueKind, string> = {
  number: 'validation.numbersOnly',
  text: 'validation.textOnly',
  mixed: 'validation.mixedOnly',
}

interface TextRuleOptions {
  kind?: FieldValueKind
  min?: number
  max?: number
  optional?: boolean
}

export function textRule(t: TFunction, { kind, min, max, optional }: TextRuleOptions = {}) {
  return (value: string): string | undefined => {
    const trimmed = value.trim()
    if (!trimmed) return optional ? undefined : t('validation.required')
    if (kind && !isValidFieldKind(trimmed, kind)) return t(KIND_MESSAGE[kind])
    if (min && trimmed.length < min) return t('validation.minLength', { count: min })
    if (max && trimmed.length > max) return t('validation.maxLength', { count: max })
    return undefined
  }
}

export function emailRule(t: TFunction, optional = false) {
  return (value: string): string | undefined => {
    const trimmed = value.trim()
    if (!trimmed) return optional ? undefined : t('validation.required')
    return EMAIL_PATTERN.test(trimmed) ? undefined : t('validation.invalidEmail')
  }
}

export function phoneRule(t: TFunction, country: CountryCode, optional = false) {
  return (value: string): string | undefined => {
    if (!value.trim()) return optional ? undefined : t('validation.required')
    return isValidPhoneNumber(value, country) ? undefined : t('validation.invalidMobile')
  }
}

/** Whole number ≥ 0 (the API's `integer, min 0`). */
export function wholeNumberRule(t: TFunction, optional = false) {
  return (value: string): string | undefined => {
    const trimmed = value.trim()
    if (!trimmed) return optional ? undefined : t('validation.required')
    return /^\d{1,9}$/.test(trimmed) ? undefined : t('validation.wholeNumber')
  }
}

export function urlRule(t: TFunction, optional = true) {
  return (value: string): string | undefined => {
    const trimmed = value.trim()
    if (!trimmed) return optional ? undefined : t('validation.required')
    return isValidHttpUrl(trimmed) ? undefined : t('validation.invalidUrl')
  }
}
