/**
 * Labels of the audit execution, checklist and stage report screens (keys of the `execution.*`
 * locale fragment) and small display helpers shared by those pages.
 */
import type { TFunction } from 'i18next'
import type { ChecklistResultKey, ExecutionStepKey, StepBlocker } from '@/lib/api/executionApi'
import type { NarrativeSection, ReportReviewStatus, StageReportType } from '@/lib/api/stageReportApi'
import type { ChecklistStageKey } from '@/lib/api/checklistsApi'

export const stepLabel = (t: TFunction, step: ExecutionStepKey) => t(`execution.steps.${step}`)
export const stepHint = (t: TFunction, step: ExecutionStepKey) => t(`execution.stepHints.${step}`)
export const resultLabel = (t: TFunction, result: ChecklistResultKey) => t(`execution.results.${result}`)
export const resultShortLabel = (t: TFunction, result: ChecklistResultKey) => t(`execution.resultsShort.${result}`)
export const stageKeyLabel = (t: TFunction, stage: ChecklistStageKey) => t(`execution.checklists.stages.${stage}`)
export const reportTypeLabel = (t: TFunction, type: StageReportType) => t(`execution.report.types.${type}`)
export const reviewStatusLabel = (t: TFunction, status: ReportReviewStatus | string | null) => (status ? t(`execution.report.reviewStatus.${status}`) : '')
export const sectionLabel = (t: TFunction, section: NarrativeSection) => t(`execution.report.sections.${section}`)
export const sectionHint = (t: TFunction, section: NarrativeSection) => t(`execution.report.sectionHints.${section}`)
export const outcomeLabel = (t: TFunction, outcome: string) => t(`execution.report.outcomes.${outcome}`)

/** A gate the server (or the preview) reported, in the UI language; unknown codes keep the server message. */
export function blockerText(t: TFunction, blocker: StepBlocker): string {
  return t(`execution.blockers.${blocker.code}`, { count: blocker.count ?? 0, defaultValue: blocker.message })
}

/** Tailwind classes of a result chip / selected result button. */
export const RESULT_TONE: Record<ChecklistResultKey, string> = {
  conforming: 'border-success-500 bg-success-50 text-success-700',
  observation: 'border-info-500 bg-info-50 text-info-700',
  ofi: 'border-primary-300 bg-primary-50 text-primary-700',
  minorNc: 'border-warning-500 bg-warning-50 text-warning-700',
  majorNc: 'border-error-500 bg-error-50 text-error-700',
  notAudited: 'border-neutral-300 bg-neutral-50 text-neutral-700',
  notApplicable: 'border-neutral-300 bg-neutral-50 text-neutral-700',
}

/** Review status chip tone. */
export const REVIEW_TONE: Record<ReportReviewStatus, string> = {
  notSubmitted: 'bg-neutral-50 text-neutral-700 border-neutral-200',
  inReview: 'bg-info-50 text-info-700 border-info-500',
  changesRequested: 'bg-warning-50 text-warning-700 border-warning-500',
  approved: 'bg-primary-50 text-primary-700 border-primary-300',
  issued: 'bg-success-50 text-success-700 border-success-500',
  acknowledged: 'bg-success-50 text-success-700 border-success-500',
}

/** Text in the UI language when the record has it (Arabic columns), else the English text. */
export const localized = (language: string, en: string, ar?: string | null) => (language.startsWith('ar') && ar ? ar : en)

/** "1.5" days → "1.5"; whole numbers without decimals. */
export const daysText = (days: number) => (Number.isInteger(days) ? String(days) : days.toFixed(2).replace(/0$/, ''))

/** Minutes → "2 h 30 min" style text in the UI language. */
export function durationText(t: TFunction, minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!h) return t('execution.time.minutes', { count: m })
  if (!m) return t('execution.time.hours', { count: h })
  return `${t('execution.time.hours', { count: h })} ${t('execution.time.minutes', { count: m })}`
}

/** "a, b; c" → ["a", "b", "c"]. */
export const splitList = (value: string) => value.split(/[,;،\n]+/).map((s) => s.trim()).filter(Boolean)
