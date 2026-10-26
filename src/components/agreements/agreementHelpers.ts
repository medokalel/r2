/**
 * Shared helpers of the certification agreement screens: status tones, error wording and labels.
 */
import type { TFunction } from 'i18next'
import { ApiError } from '@/lib/api/client'
import type { AgreementListItem, AgreementStatus } from '@/lib/api/agreementsApi'
import { workflowErrorMessage } from '@/lib/workflowErrors'

export const STATUS_TONE: Record<AgreementStatus, string> = {
  draft: 'bg-neutral-50 text-neutral-700',
  sent: 'bg-warning-50 text-warning-700',
  client_signed: 'bg-primary-50 text-primary',
  active: 'bg-success-50 text-success-700',
  superseded: 'bg-neutral-50 text-neutral-500',
  terminated: 'bg-error-50 text-error-600',
}

/** Steps of the signing flow shown as a progress line. */
export const FLOW: AgreementStatus[] = ['draft', 'sent', 'client_signed', 'active']

export const statusLabel = (t: TFunction, status: AgreementStatus) => t(`agreements.status.${status}`)

/** "Certification agreement" / "Amendment to the certification agreement" in the UI language. */
export const kindTitle = (t: TFunction, a: Pick<AgreementListItem, 'kind'>) =>
  a.kind === 'amendment' ? t('agreements.kind.amendment') : t('agreements.kind.original')

const KNOWN_CODES = [
  'AGREEMENT_REQUIRED',
  'AGREEMENT_INVALID_STATUS',
  'SIGNING_ORDER',
  'OTP_REQUIRED',
  'OTP_INVALID',
  'OTP_EXPIRED',
  'OTP_LOCKED',
  'OTP_RATE_LIMIT',
  'DOCUMENT_CHANGED',
  'DOCUMENT_INTEGRITY_FAILED',
  'REMINDER_RATE_LIMIT',
  'AMENDMENT_IN_PROGRESS',
  'UNKNOWN_VARIABLE',
  'NO_EMAIL',
]

/** The business rule in plain words for an agreement error code, else the standard workflow message. */
export function agreementErrorMessage(error: unknown, t: TFunction): string {
  if (error instanceof ApiError && error.code && KNOWN_CODES.includes(error.code)) {
    const details = error.details ?? {}
    return t(`agreements.errors.${error.code}`, {
      attemptsLeft: details.attemptsLeft ?? '',
      seconds: details.retryAfterSeconds ?? '',
      variables: Array.isArray(details.variables) ? details.variables.map((v) => `{{${String(v)}}}`).join(', ') : '',
    })
  }
  return workflowErrorMessage(error, t)
}

/** Short form of a SHA-256 fingerprint for tight spaces: first and last 8 characters. */
export const shortHash = (hash: string | null | undefined) => (hash ? `${hash.slice(0, 8)}…${hash.slice(-8)}` : '')
