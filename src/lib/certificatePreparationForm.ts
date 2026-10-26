import type { CertificateLanguage, CertificatePreparation } from '@/lib/api/cabCertificatesApi'

/** Languages a certificate can be issued in, in the order the select shows them. */
export const CERTIFICATE_LANGUAGES: readonly CertificateLanguage[] = ['en', 'ar']

/** Default validity of a newly prepared certificate (standard three-year cycle). */
export const CERTIFICATE_VALIDITY_YEARS = 3

export interface CertificatePreparationForm {
  issueDate: Date
  effectiveDate: Date
  expiryDate: Date
  templateId: string
  language: CertificateLanguage
  signatoryId: string
  markIds: string[]
  includeQrCode: boolean
}

export type CertificateFormErrorKey = 'expiryNotAfterEffective' | 'templateRequired' | 'signatoryRequired'

export type CertificateFormErrors = Partial <
  Record<'expiryDate' | 'templateId' | 'signatoryId', CertificateFormErrorKey>
>

/** Parses `YYYY-MM-DD` as a *local* calendar day (unlike `new Date('YYYY-MM-DD')`, which is UTC). */
export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** `10 Mar 2025` — day-first, Western digits in every language (matches the app's digit policy). */
export function formatCertificateDate(date: Date, language: string): string {
  const locale = language === 'en' ? 'en-GB' : language
  return new Intl.DateTimeFormat(`${locale}-u-nu-latn`, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/** Same calendar day `years` later, minus one day (10 Mar 2025 + 3y → 09 Mar 2028). */
function addYearsMinusOneDay(date: Date, years: number): Date {
  return new Date(date.getFullYear() + years, date.getMonth(), date.getDate() - 1)
}

export function defaultExpiryDate(effectiveDate: Date): Date {
  return addYearsMinusOneDay(effectiveDate, CERTIFICATE_VALIDITY_YEARS)
}

/** 1st and 2nd surveillance due dates: one and two years into the cycle, minus a day. */
export function getSurveillanceDates(effectiveDate: Date): [Date, Date] {
  return [addYearsMinusOneDay(effectiveDate, 1), addYearsMinusOneDay(effectiveDate, 2)]
}

function englishOrdinal(day: number): string {
  const lastTwo = day % 100
  if (lastTwo >= 11 && lastTwo <= 13) return `${day}th`
  const suffix = { 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] ?? 'th'
  return `${day}${suffix}`
}

/** Printed-certificate date: `13th December 2026` / `13 ديسمبر 2026` (Western digits in both). */
export function formatCertificateLongDate(date: Date, language: CertificateLanguage): string {
  if (language === 'en') {
    const month = new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(date)
    return `${englishOrdinal(date.getDate())} ${month} ${date.getFullYear()}`
  }
  return new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

export function buildInitialCertificateForm(preparation: CertificatePreparation): CertificatePreparationForm {
  const { defaults } = preparation
  return {
    issueDate: parseIsoDate(defaults.issueDate),
    effectiveDate: parseIsoDate(defaults.effectiveDate),
    expiryDate: parseIsoDate(defaults.expiryDate),
    templateId: defaults.templateId,
    language: defaults.language,
    signatoryId: defaults.signatoryId,
    markIds: defaults.markIds,
    includeQrCode: defaults.includeQrCode,
  }
}

/** Comparable YYYYMMDD number — ignores any time-of-day on the picked dates. */
function dayKey(date: Date): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
}

export function getCertificateFormErrors(form: CertificatePreparationForm): CertificateFormErrors {
  const errors: CertificateFormErrors = {}
  if (dayKey(form.expiryDate) <= dayKey(form.effectiveDate)) errors.expiryDate = 'expiryNotAfterEffective'
  if (!form.templateId) errors.templateId = 'templateRequired'
  if (!form.signatoryId) errors.signatoryId = 'signatoryRequired'
  return errors
}

export function isCertificateFormComplete(form: CertificatePreparationForm): boolean {
  return Object.keys(getCertificateFormErrors(form)).length === 0
}