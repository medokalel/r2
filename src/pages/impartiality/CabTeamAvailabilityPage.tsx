import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { ErrorBlock, LoadingBlock, PageHeader } from '@/components/platform/PlatformUi'
import { Button } from '@/components/ui/Button'
import { getAvailabilityCalendar, type AvailabilityCalendar, type AvailabilityEntry } from '@/lib/api/teamSelectionApi'
import { formatDate } from '@/lib/format/dates'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

const pad = (n: number) => String(n).padStart(2, '0')
const monthStart = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`
const daysIn = (ym: string) => new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0).getDate()
const shiftMonth = (ym: string, delta: number) => {
  const d = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1 + delta, 1)
  return monthStart(d)
}

/**
 * Availability calendar (/cab/team-availability): auditing staff by day of the month with their
 * leave / unavailable periods and audit assignments (confirmed or not). Double bookings stand out.
 */
export function CabTeamAvailabilityPage() {
  const { t, i18n } = useTranslation()
  const [month, setMonth] = useState(() => monthStart(new Date()))
  const [data, setData] = useState<AvailabilityCalendar | null>(null)
  const [error, setError] = useState(false)
  const [reload, setReload] = useState(0)
  const days = daysIn(month)
  const to = `${month.slice(0, 8)}${pad(days)}`

  useEffect(() => {
    let alive = true
    getAvailabilityCalendar(month, to).then(
      (res) => {
        if (!alive) return
        setData(res)
        setError(false)
      },
      () => alive && setError(true),
    )
    return () => {
      alive = false
    }
  }, [month, to, reload])

  const byPerson = useMemo(() => {
    const map = new Map<string, AvailabilityEntry[]>()
    for (const e of data?.entries ?? []) map.set(e.personId, [...(map.get(e.personId) ?? []), e])
    return map
  }, [data])

  const cellOf = (personId: string, day: number) => {
    const date = `${month.slice(0, 8)}${pad(day)}`
    const hits = (byPerson.get(personId) ?? []).filter((e) => e.startDate <= date && e.endDate >= date)
    const audits = hits.filter((e) => e.kind === 'audit')
    const leave = hits.find((e) => e.kind === 'unavailable')
    if (audits.length > 1 || (audits.length && leave)) return { tone: 'bg-error-500 text-white', label: '!', title: t('team.calendar.conflict', { items: hits.map((h) => h.planNumber ?? t(`team.reasons.${h.reason}`)).join(', ') }) }
    if (leave) return { tone: 'bg-warning-100 text-warning-800', label: 'L', title: `${t(`team.reasons.${leave.reason}`)}${leave.notes ? `: ${leave.notes}` : ''}` }
    if (audits.length) {
      const a = audits[0]
      return { tone: a.confirmed ? 'bg-primary text-white' : 'bg-primary-100 text-primary', label: 'A', title: `${a.planNumber} · ${a.clientName ?? ''}${a.confirmed ? '' : ` (${t('team.calendar.unconfirmed')})`}` }
    }
    return null
  }

  const monthLabel = new Date(`${month}T00:00:00`).toLocaleDateString(i18n.language?.startsWith('ar') ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB', { month: 'long', year: 'numeric' })

  return (
    <CabLayout>
      <CabHeader title={t('team.calendar.title')} />
      <main className="flex min-w-0 flex-1 flex-col gap-5 page-main">
        <PageHeader
          title={t('team.calendar.title')}
          subtitle={t('team.calendar.subtitle')}
          crumbs={[{ label: t('team.common.hub'), to: ROUTES.workspace }, { label: t('team.register.title'), to: ROUTES.cabImpartiality }, { label: t('team.calendar.title') }]}
          actions={
            <div className="flex w-full items-center justify-between gap-2 sm:w-auto">
              <Button variant="outline" size="sm" onClick={() => setMonth(shiftMonth(month, -1))} aria-label={t('team.calendar.previous')}>
                <span className="rtl-flip" aria-hidden>
                  ‹
                </span>
              </Button>
              <span className="min-w-[140px] text-center text-body-sm font-semibold text-neutral-900">{monthLabel}</span>
              <Button variant="outline" size="sm" onClick={() => setMonth(shiftMonth(month, 1))} aria-label={t('team.calendar.next')}>
                <span className="rtl-flip" aria-hidden>
                  ›
                </span>
              </Button>
            </div>
          }
        />

        <div className="flex flex-wrap items-center gap-4 text-caption text-neutral-700">
          {[
            ['bg-primary', t('team.calendar.legend.confirmed')],
            ['bg-primary-100', t('team.calendar.legend.unconfirmed')],
            ['bg-warning-100', t('team.calendar.legend.leave')],
            ['bg-error-500', t('team.calendar.legend.conflict')],
          ].map(([tone, label]) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={cn('size-3 rounded-xs', tone)} aria-hidden />
              {label}
            </span>
          ))}
        </div>

        {error && !data && <ErrorBlock message={t('team.common.loadError')} onRetry={() => setReload((n) => n + 1)} />}
        {!error && !data && <LoadingBlock rows={6} />}

        {data && (
          <>
            <section className="hidden min-w-0 overflow-x-auto rounded-lg border border-neutral-100 bg-white md:block" aria-label={t('team.calendar.title')}>
              <table className="w-full border-collapse text-caption">
                <thead>
                  <tr className="bg-primary text-white">
                    <th scope="col" className="sticky start-0 z-10 bg-primary px-3 py-2 text-start font-semibold">
                      {t('team.calendar.person')}
                    </th>
                    {Array.from({ length: days }, (_, i) => (
                      <th key={i} scope="col" className="w-7 px-0.5 py-2 text-center font-medium" dir="ltr">
                        {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.persons.map((p) => (
                    <tr key={p.personId} className="border-b border-neutral-50">
                      <th scope="row" className="sticky start-0 z-10 whitespace-nowrap bg-white px-3 py-2 text-start font-semibold text-neutral-900">
                        <Link to={`${ROUTES.cabImpartiality}?person=${p.personId}`} className="hover:text-primary hover:underline">
                          {p.name}
                        </Link>
                      </th>
                      {Array.from({ length: days }, (_, i) => {
                        const cell = cellOf(p.personId, i + 1)
                        return (
                          <td key={i} className="px-0.5 py-1 text-center">
                            {cell ? (
                              <span className={cn('inline-flex size-6 items-center justify-center rounded-xs text-overline font-bold', cell.tone)} title={cell.title} aria-label={cell.title}>
                                {cell.label}
                              </span>
                            ) : (
                              <span className="inline-block size-6" aria-hidden />
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="flex flex-col gap-3 md:hidden" aria-label={t('team.calendar.title')}>
              {data.persons.map((p) => {
                const items = (byPerson.get(p.personId) ?? []).sort((a, b) => a.startDate.localeCompare(b.startDate))
                return (
                  <article key={p.personId} className="rounded-lg border border-neutral-100 bg-white p-4">
                    <p className="text-body-sm font-semibold text-neutral-900">{p.name}</p>
                    {items.length === 0 ? (
                      <p className="mt-1 text-caption text-success-700">{t('team.calendar.free')}</p>
                    ) : (
                      <ul className="mt-2 flex flex-col gap-1.5">
                        {items.map((e) => (
                          <li key={e.id} className="flex items-center gap-2 text-caption text-neutral-700">
                            <span className={cn('size-2.5 shrink-0 rounded-full', e.kind === 'unavailable' ? 'bg-warning-500' : e.confirmed ? 'bg-primary' : 'bg-primary-200')} aria-hidden />
                            <span>
                              {formatDate(e.startDate)} / {formatDate(e.endDate)} · {e.kind === 'audit' ? `${e.planNumber} · ${e.clientName ?? ''}` : t(`team.reasons.${e.reason}`)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                )
              })}
            </section>
          </>
        )}
      </main>
    </CabLayout>
  )
}
