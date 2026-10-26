/**
 * Translated display text for the audit-reporting domain rules defined in
 * `cabAuditReportingApi.ts` (scheme rules, finding-submission checks, report gates).
 * The rules keep their English text as the fallback; the UI shows the i18n version.
 */

import type { TFunction } from 'i18next'
import { SCHEME_RULES, type SubmissionGate } from '@/lib/api/cabAuditReportingApi'

export function schemeNameText(t: TFunction): string {
  return t('cab.auditReporting.rules.schemeName', { defaultValue: SCHEME_RULES.scheme })
}

export function schemeVersionText(t: TFunction): string {
  return t('cab.auditReporting.rules.version', {
    version: SCHEME_RULES.version.replace(/^\D+/, ''),
    defaultValue: SCHEME_RULES.version,
  })
}

export function schemeNoteText(t: TFunction): string {
  return t('cab.auditReporting.rules.note', { defaultValue: SCHEME_RULES.note })
}

/** Classification label ('' when unclassified). */
export function classificationText(t: TFunction, value: string): string {
  const option = SCHEME_RULES.classifications.find((c) => c.value === value)
  if (!option) return ''
  return t(`cab.auditReporting.rules.classifications.${option.value}`, { defaultValue: option.label })
}

export function dueRuleText(t: TFunction, value: string): string {
  const option = SCHEME_RULES.classifications.find((c) => c.value === value)
  return option ? t('cab.auditReporting.rules.dueRule', { defaultValue: option.dueRule }) : ''
}

const FINDING_ERROR_KEYS: Record<string, string> = {
  'Finding type is required on submission.': 'cab.auditReporting.findingErrors.type',
  'Classification (scheme rules) is required on submission.': 'cab.auditReporting.findingErrors.classification',
  'Requirement reference is required on submission.': 'cab.auditReporting.findingErrors.requirement',
  'Finding statement is required on submission.': 'cab.auditReporting.findingErrors.statement',
  'Objective evidence linked to the audit and requirement is required; generic claims are not accepted.':
    'cab.auditReporting.findingErrors.evidence',
}

/** A finding-submission error from `validateFindingForSubmit`, translated. */
export function findingErrorText(t: TFunction, message: string): string {
  const key = FINDING_ERROR_KEYS[message]
  return key ? t(key, { defaultValue: message }) : message
}

/** Label and hint of a report submission gate (`buildReportGates`), translated. */
export function gateText(
  t: TFunction,
  gate: SubmissionGate,
  ctx: { evidenceLinked: number; findingsClassified: number; findingsTotal: number; frozen: boolean },
): { label: string; hint: string } {
  const label = t(`cab.auditReporting.gates.${gate.id}.label`, { defaultValue: gate.label })
  switch (gate.id) {
    case 'evidence':
      return { label, hint: t('cab.auditReporting.gates.evidence.hint', { count: ctx.evidenceLinked, defaultValue: gate.hint }) }
    case 'classification':
      return {
        label,
        hint: t('cab.auditReporting.gates.classification.hint', {
          classified: ctx.findingsClassified,
          total: ctx.findingsTotal,
          version: schemeVersionText(t),
          defaultValue: gate.hint,
        }),
      }
    case 'recommendation':
      return { label, hint: t('cab.auditReporting.gates.recommendation.hint', { defaultValue: gate.hint }) }
    case 'review':
      return {
        label,
        hint: ctx.frozen
          ? t('cab.auditReporting.gates.review.hintFrozen', { defaultValue: gate.hint })
          : t('cab.auditReporting.gates.review.hintPending', { defaultValue: gate.hint }),
      }
    default:
      return { label, hint: gate.hint }
  }
}
