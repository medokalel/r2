import type { TFunction } from 'i18next'
import { columnLabel, type ImportDefinition } from '@/lib/imports/entities'
import type { ImportPreviewRow, ImportRowIssue, ImportRowStatus } from '@/lib/imports/types'

/** Status colours and issue wording shared by the import wizard and the migration hub. */

export const STATUS_STYLES: Record<ImportRowStatus, { chip: string; bar: string; dot: string }> = {
  ready: { chip: 'bg-success-50 text-success-700 ring-success-200', bar: 'bg-success-500', dot: 'bg-success-500' },
  partial: { chip: 'bg-warning-50 text-warning-800 ring-warning-200', bar: 'bg-warning-400', dot: 'bg-warning-500' },
  invalid: { chip: 'bg-error-50 text-error-700 ring-error-200', bar: 'bg-error-500', dot: 'bg-error-500' },
  duplicate: { chip: 'bg-info-50 text-info-700 ring-info-100', bar: 'bg-info-500', dot: 'bg-info-500' },
}

export const STATUS_ORDER: ImportRowStatus[] = ['ready', 'partial', 'invalid', 'duplicate']

/** One issue in the user's language ("Email: not a valid email address"). */
export function issueText(t: TFunction, exists: (key: string) => boolean, definition: ImportDefinition, lang: string, issue: ImportRowIssue): string {
  const field = columnLabel(definition, issue.field, lang)
  const key = `imports.issues.${issue.code}`
  return exists(key) ? t(key, { field, message: issue.message }) : t('imports.issues.other', { field, message: issue.message })
}

/** All issues of a row in one line (used by the errors file and compact lists). */
export function describeRow(
  t: TFunction,
  exists: (key: string) => boolean,
  definition: ImportDefinition,
  lang: string,
  row: Pick<ImportPreviewRow, 'errors' | 'warnings' | 'missing' | 'status'>,
): string {
  const parts = [...row.errors, ...row.warnings].map((i) => issueText(t, exists, definition, lang, i))
  const laterMissing = row.missing.filter((f) => !row.errors.some((e) => e.field === f))
  if (laterMissing.length) parts.push(t('imports.review.missing', { fields: laterMissing.map((f) => columnLabel(definition, f, lang)).join(', ') }))
  return parts.join(' · ')
}

/** Friendly text for an API error code of the import endpoints (null when the code is not one of them). */
export function importErrorText(t: TFunction, exists: (key: string) => boolean, caught: unknown): string | null {
  const code = caught && typeof caught === 'object' && 'code' in caught ? String((caught as { code?: unknown }).code ?? '') : ''
  const key = `imports.errors.${code}`
  return code && exists(key) ? t(key) : null
}
