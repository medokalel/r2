import { useTranslation } from 'react-i18next'
import type { CriterionStatus, IssueSeverity, TeamIssue } from '@/lib/api/teamSelectionApi'
import { cn } from '@/lib/utils'
import { initials } from '@/components/teamSelection/teamSelectionUi'

/** Small visual parts of the team selector: severity chip, ✓/✗ mark, score bar, initials avatar. */

const SEVERITY_STYLE: Record<IssueSeverity, string> = {
  block: 'border-error-200 bg-error-50 text-error-700',
  warn: 'border-warning-200 bg-warning-50 text-warning-800',
  info: 'border-neutral-100 bg-neutral-25 text-neutral-700',
}

export function SeverityChip({ issue }: { issue: TeamIssue }) {
  const { t } = useTranslation()
  const label = issue.excepted
    ? t('team.severity.excepted')
    : issue.severity === 'block'
      ? issue.mandatory
        ? t('team.severity.mandatory')
        : t('team.severity.overridable')
      : t(`team.severity.${issue.severity}`)
  return (
    <span className={cn('inline-flex shrink-0 items-center rounded-xs border px-1.5 py-0.5 text-overline font-semibold', issue.excepted ? 'border-success-200 bg-success-50 text-success-700' : SEVERITY_STYLE[issue.severity])}>
      {label}
    </span>
  )
}

const CRITERION_ICON: Record<CriterionStatus, { mark: string; style: string }> = {
  pass: { mark: '✓', style: 'bg-success-50 text-success-700' },
  partial: { mark: '◐', style: 'bg-info-50 text-info-700' },
  warn: { mark: '!', style: 'bg-warning-50 text-warning-800' },
  fail: { mark: '✗', style: 'bg-error-50 text-error-700' },
  na: { mark: '·', style: 'bg-neutral-50 text-neutral-500' },
}

export function CriterionMark({ status }: { status: CriterionStatus }) {
  const { t } = useTranslation()
  const { mark, style } = CRITERION_ICON[status]
  return (
    <span className={cn('inline-flex size-6 shrink-0 items-center justify-center rounded-full text-caption font-bold', style)} aria-label={t(`team.criterion.${status}`)} role="img">
      {mark}
    </span>
  )
}

/** Horizontal 0..100 score bar with the number. */
export function ScoreBar({ score, eligible }: { score: number; eligible: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="flex min-w-[96px] items-center gap-2" title={t('team.score', { score })}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100" aria-hidden>
        <div className={cn('h-full rounded-full', eligible ? 'bg-primary' : 'bg-neutral-400')} style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </div>
      <span className={cn('w-8 text-end text-caption font-semibold', eligible ? 'text-primary' : 'text-neutral-500')} dir="ltr">
        {score}
      </span>
    </div>
  )
}

export function Avatar({ name, tone = 'primary' }: { name: string; tone?: 'primary' | 'muted' | 'error' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-caption font-bold',
        tone === 'primary' && 'bg-primary-50 text-primary',
        tone === 'muted' && 'bg-neutral-100 text-neutral-600',
        tone === 'error' && 'bg-error-50 text-error-700',
      )}
    >
      {initials(name) || '?'}
    </span>
  )
}
