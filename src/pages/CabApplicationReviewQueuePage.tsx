import { useState, useEffect, useEffectEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useValuesChanged } from '@/hooks/useValuesChanged'
import { enumLabel } from '@/lib/enumLabel'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useReviewQueueTourSteps } from '@/config/applicationReviewQueueTourSteps'
import {
  getReviewQueueItems,
  type ReviewQueueItem,
} from '@/lib/api/cabApplicationQueueApi'
import { DateRangePicker, type DateRange } from '@/components/ui/DateRangePicker'
import { ROUTES, cabApplicationInformationRequiredPath, cabApplicationReviewPath } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { displayCountry } from '@/lib/localizeCountry'
import { buttonVariants } from '@/components/ui/buttonVariants'

export function CabApplicationReviewQueuePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [items, setItems] = useState<ReviewQueueItem[]>([])
  const [loading, setLoading] = useState(true)

  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [period, setPeriod] = useState<DateRange>({ from: null, to: null })
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Fetch data
  // Requests the queue with the current filters; state is only set once it settles.
  const requestItems = async () => {
    try {
      const data = await getReviewQueueItems({
        searchQuery,
        startDate: period.from ? period.from.toISOString().split('T')[0] : undefined,
        endDate: period.to ? period.to.toISOString().split('T')[0] : undefined,
        country: selectedCountry,
        status: selectedStatus,
        sortBy,
      })
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  const fetchData = () => {
    setLoading(true)
    return requestItems()
  }

  // Changing the sort order refetches: show the loader in that same render,
  // then let the effect run the request.
  const sortChanged = useValuesChanged([sortBy])
  if (sortChanged) {
    setLoading(true)
  }

  // Effect Event: always calls the latest requestItems; the effect re-runs only when sortBy changes.
  const onSortChange = useEffectEvent(() => {
    requestItems()
  })
  useEffect(() => {
    onSortChange()
  }, [sortBy])

  const tourSteps = useReviewQueueTourSteps()

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    fetchData()
  }

  const handleClearAll = () => {
    setSearchQuery('')
    setPeriod({ from: null, to: null })
    setSelectedCountry('all')
    setSelectedStatus('all')
    getReviewQueueItems({}).then(setItems)
  }

  const statusStyles: Record<ReviewQueueItem['status'], { bg: string; text: string }> = {
    ready_for_review: { bg: 'bg-info-50', text: 'text-sky-600' },
    in_progress: { bg: 'bg-primary-50', text: 'text-primary' },
    clarification_requested: { bg: 'bg-orange-50', text: 'text-orange-600' },
    approved: { bg: 'bg-success-50', text: 'text-success-600' },
    rejected: { bg: 'bg-error-50', text: 'text-error-600' },
  }

  return (
    <CabLayout
      sidebarVariant="applicationReview"
      tourId="cab-application-review-queue"
      tourSteps={tourSteps}
    >
      <CabHeader
        title={t('cab.applications.reviewQueue.headerTitle', 'Review queue')}
        subtitle={t('cab.applications.reviewQueue.headerSubtitle', 'Application Review')}
        notificationCount={2}
      />

      <div className="flex flex-1 flex-col gap-6 overflow-auto page-main">
        {/* Top Header with Breadcrumbs & Action Button */}
        <CabTourStep steps={tourSteps} stepId="review-queue-header">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-caption font-medium text-neutral-500">
                <span
                  onClick={() => navigate('/cab/workspace')}
                  className="cursor-pointer hover:text-primary hover:underline"
                >
                  {t('cab.sidebar.workspace', 'Workspace')}
                </span>
                <span>/</span>
                <span className="text-neutral-700">{t('cab.sidebar.applicationReview', 'Application Review')}</span>
              </div>
              <h1 className="text-page-title text-text-primary mt-1">
                {t('cab.applications.reviewQueue.title', 'Review queue')}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(ROUTES.cabApplicationSubmission)}
                className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
              >
                <span>+ {t('cab.applications.reviewQueue.newApplication', 'New application')}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </div>
          </div>
        </CabTourStep>

        {/* Filter Card */}
        <CabTourStep steps={tourSteps} stepId="review-queue-filters">
          <div className="rounded-lg border border-neutral-100 bg-white p-5 shadow-sm">
            <form onSubmit={handleSearch} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Search input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-caption font-semibold text-neutral-800">
                    {t('cab.applications.reviewQueue.filters.searchLabel', 'Search application or client')}
                  </label>
                  <div className="relative">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="absolute start-3 top-1/2 -translate-y-1/2 text-neutral-500"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="APP-0024"
                      className="w-full rounded-md border border-neutral-100 bg-white py-2 pe-8 ps-9 text-body-sm text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute end-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Received period */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-caption font-semibold text-neutral-800">
                    {t('cab.applications.reviewQueue.filters.receivedPeriod', 'Received period')}
                  </label>
                  <DateRangePicker
                    value={period}
                    onChange={(next) => {
                      setPeriod(next)
                    }}
                    placeholder="DD/MM/YYYY - DD/MM/YYYY"
                  />
                </div>

              {/* Country */}
              <div className="flex flex-col gap-1.5">
                <label className="text-caption font-semibold text-neutral-800">
                  {t('cab.applications.reviewQueue.filters.country', 'Country')}
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="rounded-md border border-neutral-100 bg-white px-3 py-2 text-body-sm text-neutral-800 focus:border-primary focus:outline-none"
                >
                  <option value="all">{t('cab.applications.reviewQueue.filters.allCountries', 'All countries')}</option>
                  <option value="Saudi Arabia">{t('ui.country.SA')}</option>
                  <option value="United Arab Emirates">{t('ui.country.AE')}</option>
                  <option value="Egypt">{t('ui.country.EG')}</option>
                  <option value="India">{t('ui.country.IN')}</option>
                </select>
              </div>

              {/* Review status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-caption font-semibold text-neutral-800">
                  {t('cab.applications.reviewQueue.filters.reviewStatus', 'Review status')}
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-md border border-neutral-100 bg-white px-3 py-2 text-body-sm text-neutral-800 focus:border-primary focus:outline-none"
                >
                  <option value="all">{t('cab.applications.reviewQueue.filters.allStatuses', 'All statuses')}</option>
                  <option value="ready_for_review">{t('ui.status.readyForReview')}</option>
                  <option value="in_progress">{t('ui.status.inProgress')}</option>
                  <option value="clarification_requested">{t('ui.status.clarificationRequested')}</option>
                  <option value="approved">{t('ui.status.approved')}</option>
                </select>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
              <button
                type="button"
                className="flex items-center gap-1 text-body-sm font-medium text-primary hover:underline"
              >
                <span>{t('cab.applications.reviewQueue.filters.moreFilters', 'More filters')}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-body-sm font-medium text-neutral-700 hover:text-neutral-900"
                >
                  {t('cab.applications.reviewQueue.filters.clearAll', 'Clear all')}
                </button>
                <button
                  type="submit"
                  className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
                >
                  {t('common.search', 'Search')}
                </button>
              </div>
            </div>
          </form>
        </div>
        </CabTourStep>

        {/* Results Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-body-sm font-bold text-neutral-900">
            {items.length} {items.length === 1 ? t('cab.applications.reviewQueue.singleResult', 'result') : t('cab.applications.reviewQueue.multipleResults', 'results')}
          </p>

          <div className="flex items-center gap-2">
            <span className="text-caption text-neutral-600">{t('common.sortBy', 'Sort by')}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-md border border-neutral-100 bg-white px-3 py-1.5 text-caption font-semibold text-neutral-800 focus:outline-none"
            >
              <option value="newest">{t('cab.applications.reviewQueue.sort.newest', 'Received date (newest first)')}</option>
              <option value="oldest">{t('cab.applications.reviewQueue.sort.oldest', 'Received date (oldest first)')}</option>
              <option value="dueSoonest">{t('cab.applications.reviewQueue.sort.dueSoonest', 'Due date (soonest first)')}</option>
            </select>
          </div>
        </div>

        {/* Table Card */}
        <CabTourStep steps={tourSteps} stepId="review-queue-table">
          <div className="overflow-hidden rounded-lg border border-neutral-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-start">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-25 text-caption font-semibold text-neutral-700">
                    <th className="px-5 py-3.5 text-start">{t('cab.applications.reviewQueue.columns.application', 'Application')}</th>
                    <th className="px-5 py-3.5 text-start">{t('cab.applications.reviewQueue.columns.client', 'Client')}</th>
                    <th className="px-5 py-3.5 text-start">{t('cab.applications.reviewQueue.columns.standard', 'Standard')}</th>
                    <th className="px-5 py-3.5 text-start">{t('cab.applications.reviewQueue.columns.reviewer', 'Reviewer')}</th>
                    <th className="px-5 py-3.5 text-start">
                      <div className="flex items-center gap-1">
                        <span>{t('cab.applications.reviewQueue.columns.due', 'Due')}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </div>
                    </th>
                    <th className="px-5 py-3.5 text-start">{t('cab.applications.reviewQueue.columns.status', 'Status')}</th>
                    <th className="px-5 py-3.5 text-end">{t('cab.applications.reviewQueue.columns.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-body-sm">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="transition-colors hover:bg-neutral-25">
                      {/* Application */}
                      <td className="px-5 py-4">
                        <p className="font-bold text-primary">{item.applicationNumber}</p>
                        <p className="text-caption text-neutral-500">
                          {t('cab.applications.reviewQueue.received', 'Received')} {item.receivedDate}
                        </p>
                      </td>

                      {/* Client */}
                      <td className="px-5 py-4">
                        <p className="font-bold text-neutral-900">{item.clientName}</p>
                        <p className="text-caption text-neutral-600">{item.clientCode}</p>
                        <p className="text-caption text-neutral-500">{displayCountry(item.country)}</p>
                      </td>

                      {/* Standard */}
                      <td className="px-5 py-4">
                        <p className="font-bold text-neutral-800">{item.standard}</p>
                        <p className="max-w-[220px] truncate text-caption text-neutral-600">
                          {item.standardDescription}
                        </p>
                      </td>

                      {/* Reviewer */}
                      <td className="px-5 py-4 font-medium text-neutral-800">
                        {item.reviewer}
                      </td>

                      {/* Due */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-neutral-800">{item.dueDate}</p>
                        <p className="text-caption text-neutral-500">
                          {item.dueDaysLeft} {t('cab.applications.reviewQueue.daysLeft', 'days left')}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {idx === 0 ? (
                          <CabTourStep steps={tourSteps} stepId="review-queue-status">
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-3 py-1 text-caption font-semibold leading-tight',
                                statusStyles[item.status]?.bg || 'bg-neutral-100',
                                statusStyles[item.status]?.text || 'text-neutral-800'
                              )}
                            >
                              {enumLabel(t, item.statusLabel)}
                            </span>
                          </CabTourStep>
                        ) : (
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-3 py-1 text-caption font-semibold leading-tight',
                              statusStyles[item.status]?.bg || 'bg-neutral-100',
                              statusStyles[item.status]?.text || 'text-neutral-800'
                            )}
                          >
                            {enumLabel(t, item.statusLabel)}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-end">
                        {idx === 0 ? (
                          <CabTourStep steps={tourSteps} stepId="review-queue-actions">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(cabApplicationReviewPath(item.id, item.clientId))
                                }
                                className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
                              >
                                {t('cab.applications.reviewQueue.actions.openReview', 'Open review')}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(cabApplicationInformationRequiredPath(item.id, item.clientId))
                                }
                                className="rounded-md border border-primary-100 bg-white px-3 py-1.5 text-caption font-semibold text-primary transition-all hover:bg-primary-25"
                              >
                                {t('cab.applications.reviewQueue.actions.requestClarification', 'Request clarification')}
                              </button>
                              <button
                                type="button"
                                className="flex size-7 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                              >
                                ⋮
                              </button>
                            </div>
                          </CabTourStep>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(cabApplicationReviewPath(item.id, item.clientId))
                              }
                              className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
                            >
                              {t('cab.applications.reviewQueue.actions.openReview', 'Open review')}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                navigate(cabApplicationInformationRequiredPath(item.id, item.clientId))
                              }
                              className="rounded-md border border-primary-100 bg-white px-3 py-1.5 text-caption font-semibold text-primary transition-all hover:bg-primary-25"
                            >
                              {t('cab.applications.reviewQueue.actions.requestClarification', 'Request clarification')}
                            </button>
                            <button
                              type="button"
                              className="flex size-7 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                            >
                              ⋮
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}

                  {items.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-500">
                        {t('cab.applications.reviewQueue.noItemsFound', 'No review items match the current filters')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table Pagination */}
          <div className="flex flex-col gap-3 border-t border-neutral-100 bg-neutral-25 px-5 py-3 sm:flex-row sm:items-center sm:justify-between text-caption text-neutral-700">
            <div>
              {t('cab.applications.reviewQueue.showing', 'Showing')} 1 {t('common.to', 'to')} {items.length} {t('common.of', 'of')} {items.length} {t('cab.applications.reviewQueue.results', 'results')}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span>{t('cab.applications.reviewQueue.rowsPerPage', 'Rows per page')}</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="rounded-sm border border-neutral-100 bg-white px-2 py-1 text-caption font-medium text-neutral-800 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled
                  className="flex size-7 items-center justify-center rounded-lg border border-neutral-100 bg-white text-neutral-500 disabled:opacity-50"
                >
                  &lt;
                </button>
                <button
                  type="button"
                  className="flex size-7 items-center justify-center rounded-lg bg-primary font-semibold text-white"
                >
                  1
                </button>
                <button
                  type="button"
                  disabled
                  className="flex size-7 items-center justify-center rounded-lg border border-neutral-100 bg-white text-neutral-500 disabled:opacity-50"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </CabTourStep>
      </div>
    </CabLayout>
  )
}
