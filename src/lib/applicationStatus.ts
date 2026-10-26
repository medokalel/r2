import type { ApplicationRegisterStatus } from '@/lib/api/cabApplicationRegisterApi'

export type { ApplicationRegisterStatus }

/** Single source of truth for application-status badge colors — shared by
 *  every table that shows an application status (register, client register). */
export const APPLICATION_STATUS_STYLES: Record<ApplicationRegisterStatus, string> = {
  DRAFT: 'bg-neutral-50 text-neutral-700',
  SUBMITTED: 'bg-primary-50 text-primary',
  UNDER_REVIEW: 'bg-primary-50 text-primary',
  APPROVED: 'bg-success-100 text-success-700',
  REJECTED: 'bg-error-100 text-error-700',
  QUOTATION_CREATED: 'bg-primary-50 text-primary',
  QUOTATION_ISSUED: 'bg-warning-50 text-warning-800',
  QUOTATION_ACCEPTED: 'bg-success-100 text-success-700',
  QUOTATION_REJECTED: 'bg-error-100 text-error-700',
}

/** Maps a status to its i18n key under `cab.applicationRegister.status.*`. */
export const APPLICATION_STATUS_LABEL_KEYS: Record<ApplicationRegisterStatus, string> = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'underReview',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  QUOTATION_CREATED: 'quotationCreated',
  QUOTATION_ISSUED: 'quotationIssued',
  QUOTATION_ACCEPTED: 'quotationAccepted',
  QUOTATION_REJECTED: 'quotationRejected',
}