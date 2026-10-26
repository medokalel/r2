import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { activityText } from '@/lib/activityText'
import { enumLabel } from '@/lib/enumLabel'
import { Link, useNavigate } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useNonconformitiesTourSteps } from '@/config/nonconformitiesTourSteps'
import { NonconformityStatusBadge } from '@/components/dashboard/cab/NonconformityStatusBadge'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { Button } from '@/components/ui/Button'
import { ExportMenuButton } from '@/components/ui/ExportMenuButton'
import { ImportMenuButton } from '@/components/imports/ImportMenuButton'
import { SelectField } from '@/components/ui/Select'
import { DateRangePicker, type DateRange } from '@/components/ui/DateRangePicker'
import { AppIcon, AttachIcon, HistoryIcon, SearchIcon } from '@/components/icons'
import {
  getNonconformities,
  getNonconformityCountries,
  NONCONFORMITY_STATUSES,
  type NonconformityItem,
  type NonconformityStatus,
} from '@/lib/api/cabNonconformitiesApi'
import { downloadExcelCsv, downloadPdfFromTable, matchesSearch, type TableColumn } from '@/lib/tableTools'
import { ROUTES, cabNonconformityDetailsPath, cabNonconformityResponsePath } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { displayCountry } from '@/lib/localizeCountry'
import { notSet } from '@/lib/emptyValue'
import { pageTabClassName, pageTabListClassName } from '@/components/ui/pageTabs'

function Chevron() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-neutral-500 rtl-flip"
      aria-hidden
    >
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const DETAIL_TABS = ['details', 'actions', 'attachments', 'history'] as const
type DetailTab = (typeof DETAIL_TABS)[number]

const PAGE_SIZE = 10

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-3">
      <p className="text-body-sm text-neutral-600">{label}</p>
      <div className="text-body-sm font-medium text-neutral-900">{children || notSet()}</div>
    </div>
  )
}

export function CabNonconformitiesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tourSteps = useNonconformitiesTourSteps()

  const [nonconformities, setNonconformities] = useState<NonconformityItem[]>([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState<DateRange>({ from: null, to: null })
  const [countryFilter, setCountryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<DetailTab>('details')
  const [exporting, setExporting] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const countryOptions = useMemo(() => getNonconformityCountries(nonconformities), [nonconformities])

  useEffect(() => {
    let cancelled = false
    getNonconformities()
      .then((data) => {
        if (!cancelled) setNonconformities(data)
      })
      .catch((error) => console.error('Failed to load nonconformities:', error))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const filtered = useMemo(() => {
    return nonconformities.filter((item) => {
      const matchesQuery = matchesSearch(
        [item.ncId, item.findingId, item.clientName, item.clientId],
        query,
      )
      const matchesCountry = countryFilter === 'all' || item.country === countryFilter
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const raisedAt = new Date(item.raisedDateRaw)
      const matchesFrom = !period.from || raisedAt >= period.from
      const matchesTo = !period.to || raisedAt <= period.to
      return matchesQuery && matchesCountry && matchesStatus && matchesFrom && matchesTo
    })
  }, [nonconformities, query, countryFilter, statusFilter, period])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const selected = useMemo(
    () => filtered.find((item) => item.id === selectedId) ?? null,
    [filtered, selectedId],
  )

  const hasActiveFilters = Boolean(
    query || period.from || period.to || countryFilter !== 'all' || statusFilter !== 'all',
  )

  const clearFilters = () => {
    setQuery('')
    setPeriod({ from: null, to: null })
    setCountryFilter('all')
    setStatusFilter('all')
    setPage(1)
  }

  const statusLabel = (status: NonconformityStatus) => t(`cab.nonconformities.status.${status}`)

  const exportColumns: TableColumn<NonconformityItem>[] = [
    { header: t('cab.nonconformities.table.ncId'), value: (row) => row.ncId },
    { header: t('cab.nonconformities.table.finding'), value: (row) => row.findingId },
    { header: t('cab.nonconformities.table.client'), value: (row) => row.clientName },
    { header: t('cab.nonconformities.fields.clientId'), value: (row) => row.clientId },
    { header: t('cab.nonconformities.fields.country'), value: (row) => displayCountry(row.country) },
    { header: t('cab.nonconformities.table.classification'), value: (row) => row.classificationLabel },
    { header: t('cab.nonconformities.fields.raisedDate'), value: (row) => row.raisedDate },
    { header: t('cab.nonconformities.table.due'), value: (row) => row.dueDate },
    { header: t('cab.nonconformities.table.owner'), value: (row) => row.ownerName },
    { header: t('cab.nonconformities.table.status'), value: (row) => statusLabel(row.status) },
  ]

  const handleExportExcel = () => {
    setExporting(true)
    try {
      downloadExcelCsv('nonconformities.xlsx', exportColumns, filtered)
    } finally {
      setExporting(false)
    }
  }
  const handleExportPdf = () => {
    setExporting(true)
    try {
      downloadPdfFromTable('nonconformities.pdf', t('cab.nonconformities.title'), exportColumns, filtered)
    } finally {
      setExporting(false)
    }
  }

  const tabLabels: Record<DetailTab, string> = {
    details: t('cab.nonconformities.tabs.details'),
    actions: t('cab.nonconformities.tabs.actions'),
    attachments: t('cab.nonconformities.tabs.attachments'),
    history: t('cab.nonconformities.tabs.history'),
  }

  return (
    <CabLayout tourId="cab-nonconformities" tourSteps={tourSteps}>
      <CabHeader title={t('cab.nonconformities.title')} notificationCount={3} />
      <main className="flex flex-1 flex-col gap-5 overflow-auto page-main">
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-body-sm" aria-label={t('common.breadcrumb')}>
          <Link to={ROUTES.workspace} className="font-light text-neutral-500 hover:text-primary">
            {t('cab.nonconformities.breadcrumbParent')}
          </Link>
          <Chevron />
          <span className="font-medium text-neutral-800">{t('cab.nonconformities.title')}</span>
        </nav>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <CabTourStep steps={tourSteps} stepId="nonconformities-header">
            <div>
              <h1 className="text-page-title text-text-primary">
                {t('cab.nonconformities.title')}
              </h1>
              <p className="mt-1 text-body-sm text-neutral-600">{t('cab.nonconformities.subtitle')}</p>
            </div>
          </CabTourStep>
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <ImportMenuButton definitionKey="nonconformities" size="default" onImported={() => setReloadKey((k) => k + 1)} />
            <CabTourStep steps={tourSteps} stepId="nonconformities-export">
              <ExportMenuButton
                exporting={exporting}
                disabled={filtered.length === 0}
                onExportExcel={handleExportExcel}
                onExportPdf={handleExportPdf}
                className="w-full sm:w-auto"
              />
            </CabTourStep>
          </div>
        </div>

        {/* Filters */}
        <CabTourStep steps={tourSteps} stepId="nonconformities-filters">
          <section className="rounded-lg border border-neutral-100 bg-white p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.6fr_1fr_1fr_auto] lg:items-end">
              <div className="flex flex-col gap-2">
                <label htmlFor="nonconformity-search" className="text-body-sm font-semibold text-neutral-800">
                  {t('cab.nonconformities.filters.search')}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-500">
                    <AppIcon icon={SearchIcon} size={18} />
                  </span>
                  <input
                    id="nonconformity-search"
                    type="text"
                    value={query}
                    onChange={(event) => {
                      setPage(1)
                      setQuery(event.target.value)
                    }}
                    placeholder={t('cab.nonconformities.filters.searchPlaceholder')}
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white ps-10 pe-3 text-body-sm text-neutral-900 placeholder:text-neutral-500 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-body-sm font-semibold text-neutral-800">
                  {t('cab.nonconformities.filters.raisedPeriod')}
                </span>
                <DateRangePicker
                  value={period}
                  onChange={(next) => {
                    setPage(1)
                    setPeriod(next)
                  }}
                  className="[&_button]:h-11"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-body-sm font-semibold text-neutral-800">
                  {t('cab.nonconformities.fields.country')}
                </span>
                <SelectField
                  value={countryFilter}
                  onChange={(value) => {
                    setPage(1)
                    setCountryFilter(value)
                  }}
                  className="h-11"
                  options={[
                    { value: 'all', label: t('cab.nonconformities.filters.allCountries') },
                    ...countryOptions.map((country) => ({ value: country, label: country })),
                  ]}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-body-sm font-semibold text-neutral-800">
                  {t('cab.nonconformities.table.status')}
                </span>
                <SelectField
                  value={statusFilter}
                  onChange={(value) => {
                    setPage(1)
                    setStatusFilter(value)
                  }}
                  className="h-11"
                  options={[
                    { value: 'all', label: t('cab.nonconformities.filters.allStatuses') },
                    ...NONCONFORMITY_STATUSES.map((status) => ({
                      value: status,
                      label: statusLabel(status),
                    })),
                  ]}
                />
              </div>

              <div className="flex items-end justify-start lg:justify-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="h-11 whitespace-nowrap text-body-sm font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-neutral-400 disabled:no-underline"
                >
                  {t('cab.nonconformities.filters.clear')}
                </button>
              </div>
            </div>
          </section>
        </CabTourStep>

        <div className={cn('grid grid-cols-1 gap-5', selected && 'xl:grid-cols-[minmax(0,1fr)_400px]')}>
          {/* Register table */}
          <CabTourStep steps={tourSteps} stepId="nonconformities-table">
            <section className="flex min-w-0 flex-col rounded-lg border border-neutral-100 bg-white py-5">
              <p className="mb-4 px-5 text-body-sm text-neutral-600">
                {loading
                  ? t('common.loading')
                  : t('cab.nonconformities.resultCount', { count: filtered.length })}
              </p>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-center">
                  <thead>
                    <tr className="bg-primary text-white">
                      <th className="px-4 py-4 text-body-sm font-medium">{t('cab.nonconformities.table.ncId')}</th>
                      <th className="px-4 py-4 text-body-sm font-medium">{t('cab.nonconformities.table.finding')}</th>
                      <th className="px-4 py-4 text-body-sm font-medium">{t('cab.nonconformities.table.client')}</th>
                      <th className="px-4 py-4 text-body-sm font-medium">{t('cab.nonconformities.table.classification')}</th>
                      <th className="px-4 py-4 text-body-sm font-medium">{t('cab.nonconformities.table.due')}</th>
                      <th className="px-4 py-4 text-body-sm font-medium">{t('cab.nonconformities.table.owner')}</th>
                      <th className="px-4 py-4 text-body-sm font-medium">{t('cab.nonconformities.table.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-body text-neutral-600">
                          {t('common.loading')}
                        </td>
                      </tr>
                    ) : paginated.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-body text-neutral-600">
                          {t('cab.nonconformities.empty')}
                        </td>
                      </tr>
                    ) : (
                      paginated.map((row, index) => (
                        <tr
                          key={row.id}
                          onClick={() => {
                            setSelectedId(row.id)
                            setTab('details')
                          }}
                          className={cn(
                            'cursor-pointer transition-colors hover:bg-primary-50/50',
                            selected?.id === row.id
                              ? 'bg-primary-50/50'
                              : index % 2
                                ? 'bg-neutral-25'
                                : '',
                          )}
                        >
                          <td className="px-4 py-4 text-body font-medium text-primary" dir="ltr">
                            <Link
                              to={cabNonconformityDetailsPath(row.id)}
                              onClick={(event) => event.stopPropagation()}
                              className="underline-offset-4 hover:underline"
                              title={t('cab.nonconformities.details.openPage', 'Open full page')}
                            >
                              {row.ncId}
                            </Link>
                          </td>
                          <td className="px-4 py-4 text-body text-neutral-800" dir="ltr">
                            {row.findingId}
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-body font-medium text-neutral-900">{row.clientName}</div>
                            <div className="text-caption text-neutral-600" dir="ltr">{row.clientId}</div>
                          </td>
                          <td className="px-4 py-4 text-body text-neutral-800">{enumLabel(t, row.classificationLabel)}</td>
                          <td
                            className={cn(
                              'px-4 py-4 text-body',
                              row.overdue ? 'font-medium text-error-600' : 'text-neutral-800',
                            )}
                            dir="ltr"
                          >
                            {row.dueDate}
                          </td>
                          <td className="px-4 py-4 text-body text-neutral-800">{row.ownerName}</td>
                          <td className="px-4 py-4">
                            <CabTourStep
                              steps={tourSteps}
                              stepId={index === 0 ? 'nonconformities-status' : undefined}
                            >
                              <NonconformityStatusBadge status={row.status} label={statusLabel(row.status)} />
                            </CabTourStep>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <TablePagination
                page={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
                className="mt-5 px-5"
              />
            </section>
          </CabTourStep>

          {/* Selected nonconformity detail panel */}
          {selected && (
            <aside className="flex min-w-0 flex-col rounded-lg border border-neutral-100 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-[24px] font-bold text-neutral-900">{selected.ncId}</h2>
                    <NonconformityStatusBadge
                      status={selected.status}
                      label={statusLabel(selected.status)}
                    />
                  </div>
                  <p className="mt-1 text-body-sm text-neutral-600">
                    {t('cab.nonconformities.fields.finding')}: {selected.findingId}
                    <span className="mx-2 text-neutral-300">|</span>
                    {t('cab.nonconformities.table.client')}: {selected.clientId}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  aria-label={t('common.close')}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div
                className={cn(pageTabListClassName, 'mt-4')}
                role="tablist"
                aria-label={t('cab.nonconformities.tabsLabel')}
              >
                {DETAIL_TABS.map((tabId) => (
                  <button
                    key={tabId}
                    type="button"
                    role="tab"
                    aria-selected={tab === tabId}
                    onClick={() => setTab(tabId)}
                    className={pageTabClassName(tab === tabId)}
                  >
                    {tabLabels[tabId]}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex-1">
                {tab === 'details' && (
                  <div className="space-y-3">
                    <Field label={t('cab.nonconformities.table.client')}>
                      {selected.clientName} ({selected.clientId})
                    </Field>
                    <Field label={t('cab.nonconformities.fields.country')}>{displayCountry(selected.country)}</Field>
                    <Field label={t('cab.nonconformities.fields.finding')}>
                      <span className="text-primary">{selected.findingId}</span>
                    </Field>
                    <Field label={t('cab.nonconformities.table.classification')}>
                      {enumLabel(t, selected.classificationLabel)}
                    </Field>
                    <Field label={t('cab.nonconformities.fields.description')}>
                      <span className="font-normal">{selected.description}</span>
                    </Field>
                    <Field label={t('cab.nonconformities.fields.raisedDate')}>{selected.raisedDate}</Field>
                    <Field label={t('cab.nonconformities.table.due')}>
                      <span className={cn(selected.overdue && 'text-error-600')}>{selected.dueDate}</span>
                    </Field>
                    <Field label={t('cab.nonconformities.table.owner')}>{selected.ownerName}</Field>
                    <Field label={t('cab.nonconformities.table.status')}>
                      <NonconformityStatusBadge
                        status={selected.status}
                        label={statusLabel(selected.status)}
                      />
                    </Field>
                    <Field label={t('cab.nonconformities.fields.primaryContact')}>
                      {selected.primaryContactName}
                    </Field>
                    <Field label={t('cab.nonconformities.fields.email')}>
                      <a
                        href={`mailto:${selected.primaryContactEmail}`}
                        className="text-primary hover:underline"
                      >
                        {selected.primaryContactEmail}
                      </a>
                    </Field>
                  </div>
                )}

                {tab === 'actions' &&
                  (selected.actions.length === 0 ? (
                    <p className="py-6 text-center text-body-sm text-neutral-500">
                      {t('cab.nonconformities.noActions')}
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {selected.actions.map((action) => (
                        <li
                          key={action.id}
                          className="rounded-md border border-neutral-100 bg-neutral-25 p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-body-sm font-semibold text-neutral-900">
                              {t(`cab.nonconformities.actionStage.${action.stage}`)}
                            </p>
                            <span className="shrink-0 text-caption font-medium text-neutral-600">
                              {t(`cab.nonconformities.actionStatus.${action.status}`)}
                            </span>
                          </div>
                          <p className="mt-1 text-body-sm text-neutral-800">{action.description}</p>
                          <p className="mt-2 text-caption text-neutral-600">
                            {action.ownerName}
                            <span className="mx-2 text-neutral-300">|</span>
                            {t('cab.nonconformities.table.due')}: {action.dueDate}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ))}

                {tab === 'attachments' &&
                  (selected.attachments.length === 0 ? (
                    <p className="py-6 text-center text-body-sm text-neutral-500">
                      {t('cab.nonconformities.noAttachments')}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {selected.attachments.map((attachment) => (
                        <li
                          key={attachment.id}
                          className="flex items-start gap-3 rounded-md border border-neutral-100 p-3"
                        >
                          <AppIcon icon={AttachIcon} size={18} className="mt-0.5 shrink-0 text-primary" />
                          <div className="min-w-0">
                            <p className="truncate text-body-sm font-medium text-neutral-900">
                              {attachment.name}
                            </p>
                            <p className="mt-0.5 text-caption text-neutral-600">
                              {attachment.sizeLabel}
                              <span className="mx-2 text-neutral-300">|</span>
                              {attachment.uploadedBy}
                              <span className="mx-2 text-neutral-300">|</span>
                              {attachment.uploadedAt}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ))}

                {tab === 'history' && (
                  <ul className="space-y-4">
                    {selected.history.map((entry) => (
                      <li key={entry.id} className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary">
                          <AppIcon icon={HistoryIcon} size={16} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-body-sm font-medium text-neutral-900">{activityText(t, entry.text)}</p>
                          <p className="mt-0.5 text-caption text-neutral-600">
                            {entry.by}
                            <span className="mx-2 text-neutral-300">|</span>
                            {entry.at}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-neutral-100 pt-5 sm:flex-row">
                <Button
                  variant="primary"
                  onClick={() => navigate(cabNonconformityDetailsPath(selected.id))}
                  className="h-11 flex-1 text-body-sm"
                >
                  {t('cab.nonconformities.details.openPage', 'Open full page')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(cabNonconformityResponsePath(selected.id))}
                  className="h-11 flex-1 text-body-sm"
                >
                  {t('cab.nonconformities.openResponse')}
                </Button>
              </div>
            </aside>
          )}
        </div>
      </main>
    </CabLayout>
  )
}