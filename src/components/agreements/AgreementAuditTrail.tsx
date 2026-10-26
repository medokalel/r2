import { useTranslation } from 'react-i18next'
import type { AgreementEvent } from '@/lib/api/agreementsApi'
import { formatDateTime } from '@/lib/format/dates'

/** The agreement's audit trail, newest first (also printed on the last page of the signed PDF). */
export function AgreementAuditTrail({ events }: { events: AgreementEvent[] }) {
  const { t } = useTranslation()
  const rows = [...events].reverse()
  return (
    <section className="min-w-0 rounded-lg border border-neutral-100 bg-white">
      <h2 className="border-b border-neutral-100 px-4 py-3 text-body font-semibold text-neutral-900 sm:px-5">{t('agreements.trail.title')}</h2>
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-body-sm text-neutral-500">{t('agreements.trail.empty')}</p>
      ) : (
        <ol className="flex flex-col">
          {rows.map((e) => (
            <li key={e.id} className="flex gap-3 border-b border-neutral-50 px-4 py-3 last:border-b-0 sm:px-5">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-body-sm font-medium text-neutral-900">{t(`agreements.events.${e.type}`, { defaultValue: e.type })}</p>
                <p className="text-caption text-neutral-600">
                  {[e.actorName ?? t(`agreements.actor.${e.actorType}`), formatDateTime(e.at)].join(' · ')}
                </p>
                {typeof e.details.reason === 'string' && e.details.reason && <p className="mt-1 text-caption text-neutral-700">{e.details.reason}</p>}
                {e.ipAddress && (
                  <p className="text-caption text-neutral-500" dir="ltr">
                    {t('agreements.trail.ip', { ip: e.ipAddress })}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
