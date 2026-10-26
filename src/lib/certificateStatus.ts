import type { CertificateStatus } from '@/lib/api/cabCertificatesApi'

/** Single source of truth for certificate-status badge colors — mirrors
 *  APPLICATION_STATUS_STYLES so every register table in the app looks consistent. */
export const CERTIFICATE_STATUS_STYLES: Record<CertificateStatus, string> = {
  DRAFT: 'bg-neutral-50 text-neutral-700',
  ISSUED: 'bg-success-100 text-success-700',
  SUSPENDED: 'bg-warning-50 text-warning-700',
  WITHDRAWN: 'bg-error-100 text-error-600',
  SUPERSEDED: 'bg-neutral-100 text-neutral-600',
}

/** Maps a status to its i18n key under `cab.certificateRegister.status.*`. */
export const CERTIFICATE_STATUS_LABEL_KEYS: Record<CertificateStatus, string> = {
  DRAFT: 'draft',
  ISSUED: 'issued',
  SUSPENDED: 'suspended',
  WITHDRAWN: 'withdrawn',
  SUPERSEDED: 'superseded',
}