import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TeamCandidate, TeamRole } from '@/lib/api/teamSelectionApi'
import { Avatar, CriterionMark, ScoreBar, SeverityChip } from '@/components/teamSelection/TeamBadges'
import { ROLE_KEY, useLocalized } from '@/components/teamSelection/teamSelectionUi'
import { enumLabel } from '@/lib/enumLabel'
import { cn } from '@/lib/utils'

interface Props {
  candidate: TeamCandidate
  role: TeamRole
  selected: boolean
  disabled?: boolean
  onAdd: () => void
}

/**
 * One recommended person: score bar, eligibility, the two strongest reasons, and (expanded) the
 * ✓ / ✗ list per criterion with the score components. Ineligible people can still be added: the
 * validation then shows why and offers alternatives.
 */
export function CandidateCard({ candidate: c, role, selected, disabled, onAdd }: Props) {
  const { t } = useTranslation()
  const loc = useLocalized()
  const [open, setOpen] = useState(false)
  const blocking = c.issues.filter((i) => i.severity === 'block' && !i.excepted)
  const reasons = [...c.components].sort((a, b) => b.score / b.max - a.score / a.max).slice(0, 2)
  const detailsId = `cand-${role}-${c.personId}`

  return (
    <li className={cn('rounded-md border bg-white', selected ? 'border-primary' : 'border-neutral-100')}>
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Avatar name={c.name} tone={c.eligible ? 'primary' : 'error'} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-caption font-semibold text-neutral-500" dir="ltr">
                #{c.rank}
              </span>
              <p className="truncate text-body-sm font-semibold text-neutral-900">{c.name}</p>
              <span
                className={cn(
                  'rounded-xs px-1.5 py-0.5 text-overline font-semibold',
                  c.eligible ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700',
                )}
              >
                {c.eligible ? t('team.candidate.eligible') : t('team.candidate.ineligible')}
              </span>
            </div>
            <p className="truncate text-caption text-neutral-600">
              {enumLabel(t, c.competenceRole)}
              {c.coveredIafCodes.length > 0 && <span dir="ltr"> · IAF {c.coveredIafCodes.join(', ')}</span>}
            </p>
            {blocking.length > 0 ? (
              <p className="mt-1 text-caption text-error-700">{loc(blocking[0].message)}</p>
            ) : (
              <p className="mt-1 text-caption text-neutral-600">{reasons.map((r) => loc(r.explanation)).join(' · ')}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:w-[280px] sm:justify-end">
          <div className="flex-1 sm:w-28 sm:flex-none">
            <ScoreBar score={c.score} eligible={c.eligible} />
          </div>
          <button
            type="button"
            className="text-caption font-semibold text-primary underline-offset-4 hover:underline"
            aria-expanded={open}
            aria-controls={detailsId}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? t('team.candidate.hide') : t('team.candidate.why')}
          </button>
          <button
            type="button"
            disabled={selected || disabled}
            onClick={onAdd}
            className={cn(
              'h-9 shrink-0 rounded-md px-3 text-caption font-semibold transition-colors',
              selected ? 'bg-neutral-50 text-neutral-500' : 'bg-primary text-white hover:bg-primary-hover disabled:opacity-50',
            )}
          >
            {selected ? t('team.candidate.added') : t(`team.candidate.add.${ROLE_KEY[role]}`)}
          </button>
        </div>
      </div>
      {open && (
        <div id={detailsId} className="grid gap-4 border-t border-neutral-100 p-3 lg:grid-cols-2">
          <ul className="flex flex-col gap-2" aria-label={t('team.candidate.criteria')}>
            {c.criteria.map((cr) => (
              <li key={cr.key} className="flex items-start gap-2">
                <CriterionMark status={cr.status} />
                <div className="min-w-0">
                  <p className="text-caption font-semibold text-neutral-800">{loc(cr.label)}</p>
                  <p className="text-caption text-neutral-600">{loc(cr.message)}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3">
            <table className="w-full text-caption">
              <caption className="pb-1 text-start font-semibold text-neutral-800">{t('team.candidate.scoreTitle', { score: c.score })}</caption>
              <tbody>
                {c.components.map((comp) => (
                  <tr key={comp.key} className="border-t border-neutral-50 align-top">
                    <th scope="row" className="py-1.5 pe-2 text-start font-medium text-neutral-700">
                      {t(`team.components.${comp.key}`)}
                    </th>
                    <td className="py-1.5 pe-2 text-neutral-600">{loc(comp.explanation)}</td>
                    <td className="whitespace-nowrap py-1.5 text-end font-semibold text-neutral-900" dir="ltr">
                      {comp.score} / {comp.max}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {c.issues.filter((i) => i.severity !== 'info').length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {c.issues
                  .filter((i) => i.severity !== 'info')
                  .map((i, index) => (
                    <li key={`${i.code}-${index}`} className="flex items-start gap-2 text-caption text-neutral-700">
                      <SeverityChip issue={i} />
                      <span>{loc(i.message)}</span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </li>
  )
}
