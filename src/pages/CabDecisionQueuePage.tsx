import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { enumLabel } from '@/lib/enumLabel'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useDecisionsTourSteps } from '@/config/decisionsTourSteps'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { DateRangePicker, type DateRange } from '@/components/ui/DateRangePicker'
import { AppIcon, EyeIcon, SearchIcon, DownloadTrayIcon } from '@/components/icons'
import { decisionsToCsv, downloadCsv, getDecisionQueue } from '@/lib/api/cabDecisionsApi'
import type { DecisionQueueItem } from '@/lib/api/cabDecisionsApi'
import { cn } from '@/lib/utils'
import { displayCountry } from '@/lib/localizeCountry'
import { buttonVariants } from '@/components/ui/buttonVariants'

function toIsoDate(date: Date | null): string | undefined {
  if (!date) return undefined
  return date.toISOString().slice(0, 10)
}

export function CabDecisionQueuePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tourSteps = useDecisionsTourSteps()
  const [items, setItems] = useState<DecisionQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('all')
  const [status, setStatus] = useState('all')
  const [period, setPeriod] = useState<DateRange>(() => ({
    // Data-only: default to the last 12 months so current decisions are listed.
    from: new Date(Date.now() - 365 * 86_400_000),
    to: new Date(),
  }))
  const [sel, setSel] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState(1)

  const selected = useMemo(() => items.find((i) => i.id === sel) ?? null, [items, sel])

  // Requests the queue; state is only set once the request settles.
  const requestQueue = (f = { search, country, status, period }): Promise<void> =>
    getDecisionQueue({
      searchQuery: f.search.trim() || undefined,
      country: f.country,
      status: f.status,
      startDate: toIsoDate(f.period.from),
      endDate: toIsoDate(f.period.to),
    })
      .then((d) => {
        setItems(d)
        setSel((p) => (p && d.some((x) => x.id === p) ? p : null))
      })
      .catch((e) => {
        console.error('Failed to load decisions:', e)
      })
      .finally(() => {
        setLoading(false)
      })

  const load = (f = { search, country, status, period }) => {
    setLoading(true)
    return requestQueue(f)
  }

  // Initial load on mount (`loading` already starts as true).
  const onMount = useEffectEvent(() => {
    requestQueue()
  })
  useEffect(() => {
    onMount()
  }, [])

  const doExport = async () => {
    setBusy(true)
    try {
      const all = await getDecisionQueue({
        searchQuery: search.trim() || undefined,
        country,
        status,
        startDate: toIsoDate(period.from),
        endDate: toIsoDate(period.to),
      })
      downloadCsv('decision-queue.csv', decisionsToCsv(all))
    } finally {
      setBusy(false)
    }
  }

  const doClear = () => {
    const emptyPeriod = { from: null, to: null }
    setSearch('')
    setCountry('all')
    setStatus('all')
    setPeriod(emptyPeriod)
    load({ search: '', country: 'all', status: 'all', period: emptyPeriod })
  }

  const getStatusBadge = (reviewStatus: string, rawLabel: string) => {
    const label = t(`cab.decisions.statuses.${reviewStatus}`, { defaultValue: enumLabel(t, rawLabel) })
    switch (reviewStatus) {
      case 'decided_granted':
        return (
          <span className="inline-flex items-center justify-center rounded-sm bg-success-100 px-3 py-1 text-caption font-medium text-success-700 whitespace-nowrap">
            {label}
          </span>
        )
      case 'ready_for_decision':
        return (
          <span className="inline-flex items-center justify-center rounded-sm bg-primary-50 px-3 py-1 text-caption font-medium text-primary whitespace-nowrap">
            {label}
          </span>
        )
      case 'decided_refused':
        return (
          <span className="inline-flex items-center justify-center rounded-sm bg-error-100 px-3 py-1 text-caption font-medium text-error-600 whitespace-nowrap">
            {label}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center justify-center rounded-sm bg-warning-100 px-3 py-1 text-caption font-medium text-warning-700 whitespace-nowrap">
            {label}
          </span>
        )
    }
  }

  return (
    <CabLayout
      sidebarVariant="decisions"
      tourId="cab-decisions-queue"
      tourSteps={tourSteps}
    >
      <CabTourStep steps={tourSteps} stepId="decisions-header">
        <div>
          <CabHeader
            title={t('cab.decisions.headerTitle', 'Decisions')}
            notificationCount={3}
          />
        </div>
      </CabTourStep>
      <main className="flex flex-1 flex-col gap-5 overflow-auto page-main">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex min-w-0 flex-col gap-5">
            {/* Filter Card */}
            <CabTourStep steps={tourSteps} stepId="decisions-search-filters">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  load()
                }}
                className="rounded-lg border border-neutral-100 bg-white p-5 space-y-4"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {/* Search */}
                  <div className="space-y-1.5">
                    <label className="text-body-sm font-medium text-neutral-800">
                      {t('common.search', 'Search')}
                    </label>
                    <div className="relative">
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('cab.decisions.searchPlaceholder', 'Search ID, client name...')}
                        className="h-11 w-full rounded-md border border-neutral-100 bg-white ps-10 pe-4 text-body-sm text-neutral-900 placeholder:text-neutral-500 focus:border-primary focus:outline-none"
                      />
                      <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-neutral-500">
                        <AppIcon icon={SearchIcon} size={18} />
                      </div>
                    </div>
                  </div>

                  {/* Received Period */}
                  <div className="space-y-1.5">
                    <label className="text-body-sm font-medium text-neutral-800">
                      {t('cab.decisions.receivedPeriod', 'Received period')}
                    </label>
                    <DateRangePicker
                      value={period}
                      onChange={setPeriod}
                      placeholder="DD/MM/YYYY - DD/MM/YYYY"
                    />
                  </div>

                  {/* Country */}
                  <div className="space-y-1.5">
                    <label className="text-body-sm font-medium text-neutral-800">
                      {t('cab.decisions.country', 'Country')}
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-800 focus:border-primary focus:outline-none"
                    >
                      <option value="all">{t('common.all', 'All')}</option>
                      <option value="Saudi Arabia">{t('ui.country.SA')}</option>
                      <option value="United Arab Emirates">{t('ui.country.AE')}</option>
                      <option value="Egypt">{t('ui.country.EG')}</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="text-body-sm font-medium text-neutral-800">
                      {t('cab.decisions.status', 'Status')}
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-800 focus:border-primary focus:outline-none"
                    >
                      <option value="all">{t('common.all', 'All')}</option>
                      <option value="awaiting_technical_review">{t('cab.decisions.statuses.awaiting_technical_review', 'Awaiting technical review')}</option>
                      <option value="ready_for_decision">{t('cab.decisions.statuses.ready_for_decision', 'Ready for decision')}</option>
                      <option value="decided_granted">{t('cab.decisions.statuses.decided_granted', 'Granted')}</option>
                      <option value="decided_refused">{t('cab.decisions.statuses.decided_refused', 'Refused')}</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
                  >
                    <AppIcon icon={SearchIcon} size={16} />
                    <span>{t('common.search', 'Search')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={doClear}
                    className="flex h-11 items-center justify-center rounded-md border border-neutral-100 px-4 text-body-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    {t('common.clear', 'Clear')}
                  </button>
                </div>
              </form>
            </CabTourStep>

            {/* Decision Queue Section */}
            <CabTourStep steps={tourSteps} stepId="decisions-table">
              <section className="flex flex-col rounded-lg border border-neutral-100 bg-white py-5">
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5">
                  <div>
                    <h2 className="text-body-lg font-bold text-neutral-900">{t('cab.decisions.title', 'Decision queue')}</h2>
                    <p className="text-body-sm text-neutral-600">
                      {loading ? t('common.loading', 'Loading…') : `${items.length} ${t('cab.decisions.results', 'results')}`}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={doExport}
                    className="flex h-11 items-center gap-2 rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50 transition-colors disabled:opacity-60"
                  >
                    <AppIcon icon={DownloadTrayIcon} size={18} />
                    <span>{busy ? t('common.exporting', 'Exporting…') : t('common.export', 'Export')}</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-center">
                    <thead>
                      <tr className="bg-primary text-white">
                        <th className="p-5 text-center text-body-sm font-medium">{t('cab.decisions.table.file', 'File')}</th>
                        <th className="p-5 text-center text-body-sm font-medium">{t('cab.decisions.table.client', 'Client')}</th>
                        <th className="p-5 text-center text-body-sm font-medium">{t('cab.decisions.table.scheme', 'Scheme')}</th>
                        <th className="p-5 text-center text-body-sm font-medium">{t('cab.decisions.table.status', 'Review status')}</th>
                        <th className="p-5 text-center text-body-sm font-medium">{t('cab.decisions.table.decisionMaker', 'Decision maker')}</th>
                        <th className="p-5 text-center text-body-sm font-medium">{t('cab.decisions.table.due', 'Due')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="p-5 text-center text-body-sm text-neutral-600">
                            {t('common.loading', 'Loading...')}
                          </td>
                        </tr>
                      ) : items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-5 text-center text-body-sm text-neutral-600">
                            {t('cab.decisions.empty', 'No decisions match the current filters.')}
                          </td>
                        </tr>
                      ) : (
                        items.map((row, index) => (
                          <tr
                            key={row.id}
                            onClick={() => setSel(row.id)}
                            className={cn(
                              'cursor-pointer transition-colors',
                              selected?.id === row.id ? 'bg-primary-50/50' : index % 2 === 1 ? 'bg-neutral-25' : '',
                              'hover:bg-primary-50/50'
                            )}
                          >
                            <td className="p-5 text-center text-body font-semibold text-primary hover:underline">
                              {row.decisionId}
                            </td>
                            <td className="p-5 text-center">
                              <div className="text-body font-semibold text-neutral-900">{row.clientName}</div>
                              <div className="text-body-sm text-neutral-600 font-mono">{row.clientId}</div>
                            </td>
                            <td className="p-5 text-center text-body text-neutral-800">{row.scheme}</td>
                            <td className="p-5 text-center">
                              {index === 0 ? (
                                <CabTourStep steps={tourSteps} stepId="decisions-status-badge">
                                  {getStatusBadge(row.reviewStatus, row.reviewStatusLabel)}
                                </CabTourStep>
                              ) : (
                                getStatusBadge(row.reviewStatus, row.reviewStatusLabel)
                              )}
                            </td>
                            <td className="p-5 text-center text-body text-neutral-800">{row.decisionMakerName}</td>
                            <td className="p-5 text-center text-body text-neutral-800">{row.dueDate}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <TablePagination
                  page={page}
                  totalPages={1}
                  onPageChange={(nextPage) => setPage(nextPage)}
                  className="mt-5 px-5"
                />
              </section>
            </CabTourStep>
          </div>
        </div>

        {/* Selected Decision Slide-over Drawer (appears on row click, not static) */}
        {selected && (
          <div className="fixed inset-0 z-50 flex justify-end bg-surface-overlay/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
            <div
              className="fixed inset-0"
              onClick={() => setSel(null)}
              aria-hidden="true"
            />
            <aside className="relative z-10 flex h-full w-full max-w-[380px] sm:max-w-[420px] flex-col justify-between overflow-y-auto bg-white p-6 shadow-2xl animate-in slide-in-from-end duration-300">
              <CabTourStep steps={tourSteps} stepId="decisions-summary-card">
                <div className="space-y-5">
                  {/* Header with Close Button */}
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary">
                        <AppIcon icon={EyeIcon} size={20} />
                      </div>
                      <div>
                        <h2 className="text-body font-bold text-neutral-900">{t('cab.decisions.selectedTitle', 'Selected decision')}</h2>
                        <p className="text-body-sm font-semibold text-primary font-mono">{selected.decisionId}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSel(null)}
                      className="flex size-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition-colors"
                      aria-label={t('common.close', 'Close')}
                    >
                      <span className="text-[24px] font-bold leading-none">×</span>
                    </button>
                  </div>

                  {/* Details Body matching Image 2 */}
                  <div className="space-y-4 text-body-sm">
                    <div>
                      <p className="text-body-sm font-medium text-neutral-600">{t('cab.decisions.client', 'Client')}</p>
                      <p className="text-body font-bold text-neutral-900">{selected.clientName}</p>
                      <p className="text-body-sm font-mono text-neutral-600">{selected.clientId}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-body-sm font-medium text-neutral-600">{t('cab.decisions.scheme', 'Scheme')}</p>
                        <p className="text-body font-bold text-neutral-900">{selected.scheme}</p>
                      </div>
                      <div>
                        <p className="text-body-sm font-medium text-neutral-600">{t('cab.decisions.country', 'Country')}</p>
                        <p className="text-body font-bold text-neutral-900">{displayCountry(selected.country)}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-body-sm font-medium text-neutral-600 mb-1.5">{t('cab.decisions.status', 'Status')}</p>
                      {getStatusBadge(selected.reviewStatus, selected.reviewStatusLabel)}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-body-sm font-medium text-neutral-600">{t('cab.decisions.received', 'Received')}</p>
                        <p className="text-body font-bold text-neutral-900">{selected.receivedDate}</p>
                      </div>
                      <div>
                        <p className="text-body-sm font-medium text-neutral-600">{t('cab.decisions.due', 'Due')}</p>
                        <p className="text-body font-bold text-neutral-900">{selected.dueDate}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-body-sm font-medium text-neutral-600">{t('cab.decisions.decisionMaker', 'Decision maker')}</p>
                      <p className="text-body font-bold text-neutral-900">{selected.decisionMakerName}</p>
                    </div>
                  </div>
                </div>
              </CabTourStep>

              {/* Action Button at bottom */}
              <div className="pt-6 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => navigate(`/cab/decisions/${selected.id}`)}
                  className={cn(buttonVariants({ variant: 'primary', size: 'default' }), 'w-full justify-center')}
                >
                  <AppIcon icon={EyeIcon} size={18} />
                  <span>{t('cab.decisions.openDecision', 'Open decision')}</span>
                </button>
              </div>
            </aside>
          </div>
        )}
      </main>
    </CabLayout>
  )
}
