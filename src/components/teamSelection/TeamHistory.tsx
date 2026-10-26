import { useTranslation } from 'react-i18next'
import type { TeamEvent } from '@/lib/api/teamSelectionApi'
import { formatDateTime } from '@/lib/format/dates'

const DETAIL_KEYS = ['name', 'role', 'from', 'issueCode', 'reason', 'note', 'type', 'clientName', 'startDate', 'endDate'] as const

/** Audit trail of team decisions (confirmations, blocked attempts, member changes, exceptions …). */
export function TeamHistory({ events }: { events: TeamEvent[] }) {
  const { t } = useTranslation()
  if (!events.length) return <p className="text-caption text-neutral-600">{t('team.history.empty')}</p>
  return (
    <ol className="flex flex-col gap-2">
      {events.map((e) => {
        const details = DETAIL_KEYS.filter((k) => typeof e.details[k] === 'string' && e.details[k]).map((k) => {
          const value = String(e.details[k])
          return k === 'role' || k === 'from' ? t(`team.roleCodes.${value}`, { defaultValue: value }) : value
        })
        return (
          <li key={e.id} className="flex flex-col gap-0.5 border-s-2 border-neutral-100 ps-3">
            <p className="text-caption font-semibold text-neutral-900">{t(`team.history.actions.${e.action}`, { defaultValue: e.action })}</p>
            {details.length > 0 && <p className="text-caption text-neutral-700">{details.join(' · ')}</p>}
            <p className="text-overline text-neutral-500">
              {e.actor} · {formatDateTime(e.createdAt)}
            </p>
          </li>
        )
      })}
    </ol>
  )
}
