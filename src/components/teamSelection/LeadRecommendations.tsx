import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getTeamRecommendations, type TeamCandidate } from '@/lib/api/teamSelectionApi'
import { ScoreBar } from '@/components/teamSelection/TeamBadges'
import { useLocalized } from '@/components/teamSelection/teamSelectionUi'
import { cn } from '@/lib/utils'

interface Props {
  applicationId: string
  startDate?: string
  endDate?: string
  selectedName: string
  onSelect: (name: string) => void
}

/**
 * Compact team-leader recommendations for a new audit plan (application + dates): the best three
 * eligible people with their score and main reason; the full team is chosen on the build page.
 */
export function LeadRecommendations({ applicationId, startDate, endDate, selectedName, onSelect }: Props) {
  const { t } = useTranslation()
  const loc = useLocalized()
  const [list, setList] = useState<TeamCandidate[] | null>(null)
  const [failed, setFailed] = useState(false)
  const dated = Boolean(startDate && endDate && endDate >= startDate)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const res = await getTeamRecommendations({ applicationId }, 'TEAM_LEADER', dated ? { startDate, endDate } : {})
        if (alive) {
          setList(res.candidates)
          setFailed(false)
        }
      } catch {
        if (alive) setFailed(true)
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [applicationId, startDate, endDate, dated])

  if (failed) return null
  const top = (list ?? []).filter((c) => c.eligible).slice(0, 3)
  const blocked = (list ?? []).filter((c) => !c.eligible && c.name === selectedName)[0]

  return (
    <section className="flex flex-col gap-2 rounded-md border border-primary-100 bg-primary-25 p-3 sm:col-span-2" aria-label={t('team.lead.title')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-body-sm font-semibold text-neutral-900">{t('team.lead.title')}</p>
        <p className="text-caption text-neutral-600">{dated ? t('team.lead.withDates') : t('team.lead.withoutDates')}</p>
      </div>
      {!list && <p className="text-caption text-neutral-600">{t('team.recommended.loading')}</p>}
      {list && top.length === 0 && <p className="text-caption text-neutral-600">{t('team.lead.none')}</p>}
      <ul className="flex flex-col gap-2">
        {top.map((c) => (
          <li key={c.personId} className={cn('flex flex-col gap-2 rounded-md border bg-white p-2.5 sm:flex-row sm:items-center', selectedName === c.name ? 'border-primary' : 'border-neutral-100')}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm font-semibold text-neutral-900">{c.name}</p>
              <p className="truncate text-caption text-neutral-600">{loc(c.components[0]?.explanation)}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-28">
                <ScoreBar score={c.score} eligible />
              </div>
              <button
                type="button"
                disabled={selectedName === c.name}
                onClick={() => onSelect(c.name)}
                className="h-9 rounded-md bg-primary px-3 text-caption font-semibold text-white hover:bg-primary-hover disabled:bg-neutral-50 disabled:text-neutral-500"
              >
                {selectedName === c.name ? t('team.candidate.added') : t('team.lead.use')}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {blocked && (
        <p role="alert" className="text-caption text-error-700">
          {loc(blocked.issues.find((i) => i.severity === 'block')?.message)}
        </p>
      )}
    </section>
  )
}
