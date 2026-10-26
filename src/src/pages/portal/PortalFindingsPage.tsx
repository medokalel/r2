import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { PortalLayout } from '@/components/layout/PortalLayout'
import { NonconformityStatusBadge } from '@/components/dashboard/cab/NonconformityStatusBadge'
import { TableFilterSelect } from '@/components/dashboard/TableFilterSelect'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { AppIcon, CorrectiveActionIcon, SearchIcon } from '@/components/icons'
import {
  NONCONFORMITY_STATUSES,
  getNonconformities,
  type NonconformityClassification,
  type NonconformityItem,
  type NonconformityStatus,
} from '@/lib/api/cabNonconformitiesApi'
import { enumLabel } from '@/lib/enumLabel'
import { portalFindingResponsePath } from '@/lib/routes'
import { matchesSearch } from '@/lib/tableTools'
import { cn } from '@/lib/utils'
import { notSet, splitClause } from '@/lib/emptyValue'
import { buttonVariants } from '@/components/ui/buttonVariants'

const PAGE_SIZE = 10

const CLASSIFICATION_STYLES: Record<NonconformityClassification, string> = {
  critical: 'bg-error-100 text-error-700',
  major: 'bg-error-100 text-error-600',
  minor: 'bg-warning-50 text-warning-700',
  observation: 'bg-neutral-50 text-slate-600',
}

/** Splits "Clause 6.1.2 — requirement text" into the clause reference and the finding text. */
function splitDescription(description: string): { clause: string; text: string } {
  const { clause, text } = splitClause(description)
  return { clause: clause || notSet(), text }
}

/** Open findings still wait for the client's corrective-action response. */
const awaitsResponse = (status: NonconformityStatus) => status === 'open' || status === 'in_progress' || status === 'overdue'

/** Client portal (/portal/findings): the audit client's nonconformities; each row opens the response form. */
export function PortalFindingsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [findings, setFindings] = useState<NonconformityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    getNonconformities()
      .then((rows) => {
        if (!cancelled) setFindings(rows)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const retry = () => {
    setLoading(true)
    setLoadError(false)
    setReloadKey((key) => key + 1)
  }

  const statusLabel = (status: NonconformityStatus) => t(`cab.nonconformities.status.${status}`)
  const classificationBadge = (item: NonconformityItem) => (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-sm px-3 py-1 text-caption font-medium whitespace-nowrap',
        CLASSIFICATION_STYLES[item.classification],
      )}
    >
      {enumLabel(t, item.classificationLabel)}
    </span>
  )
  const overdueBadge = (item: NonconformityItem) =>
    item.overdue ? (
      <span className="inline-flex items-center rounded-full bg-error-100 px-2 py-0.5 text-caption font-semibold text-error-600">
        {t('portal.findings.overdue', 'Overdue')}
      </span>
    ) : null
  const open = (item: NonconformityItem) => navigate(portalFindingResponsePath(item.id))
  const actionLabel = (item: NonconformityItem) =>
    awaitsResponse(item.status) ? t('portal.findings.respond', 'Respond') : t('portal.findings.view', 'View')

  const filtered = findings.filter((item) => {
    const { clause, text } = splitDescription(item.description)
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesStatus && matchesSearch([item.ncId, item.findingId, item.auditId, clause, text], search)
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const awaiting = findings.filter((item) => awaitsResponse(item.status)).length
  const hasNone = !loading && !loadError && findings.length === 0
  const noMatch = !loading && !loadError && findings.length > 0 && filtered.length === 0

  return (
    <PortalLayout
      title={t('portal.findings.title', 'Findings')}
      subtitle={t('portal.findings.subtitle', 'Nonconformities raised at your audits and your corrective-action responses.')}
    >
      {!loading && !loadError && awaiting > 0 ? (
        <p role="status" className="rounded-lg border border-warning-100 bg-warning-50 px-4 py-3 text-body-sm font-medium text-warning-700">
          {t('portal.findings.awaiting', { count: awaiting, defaultValue: 'Findings awaiting your response: {{count}}' })}
        </p>
      ) : null}

      <div className="flex min-w-0 flex-col gap-5 rounded-lg border border-neutral-100 bg-white p-3 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-0 w-full sm:min-w-[240px] sm:max-w-[360px] sm:flex-1">
            <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-500">
              <AppIcon icon={SearchIcon} size={18} />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
              aria-label={t('portal.findings.searchPlaceholder', 'Search by NC ID, clause or audit...')}
              placeholder={t('portal.findings.searchPlaceholder', 'Search by NC ID, clause or audit...')}
              className="h-11 w-full rounded-md border border-neutral-100 bg-white ps-10 pe-3 text-body-sm text-neutral-900 placeholder:text-neutral-500 focus:border-primary focus:outline-none"
            />
          </div>
          <TableFilterSelect
            label={t('cab.nonconformities.table.status', 'Status')}
            value={statusFilter}
            onChange={(value) => {
              setPage(1)
              setStatusFilter(value)
            }}
            options={[
              { value: 'all', label: t('portal.findings.allStatuses', 'All statuses') },
              ...NONCONFORMITY_STATUSES.map((status) => ({ value: status, label: statusLabel(status) })),
            ]}
          />
        </div>

        {loadError ? (
          <div role="alert" className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-body-sm text-error-600">{t('common.loadFailed', 'Failed to load. Please try again.')}</p>
            <button
              type="button"
              onClick={retry}
              className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
            >
              {t('common.retry', 'Retry')}
            </button>
          </div>
        ) : hasNone ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary-25 text-primary">
              <AppIcon icon={CorrectiveActionIcon} size={28} />
            </span>
            <p className="text-body font-semibold text-neutral-900">{t('portal.findings.empty', 'No findings')}</p>
            <p className="max-w-md text-body-sm text-neutral-600">
              {t('portal.findings.emptyHint', 'Nonconformities raised at your audits appear here for your corrective-action response.')}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] border-collapse text-center">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="p-5 text-body-sm font-medium">{t('cab.nonconformities.table.ncId', 'NC ID')}</th>
                    <th className="p-5 text-body-sm font-medium">{t('portal.findings.requirement', 'Clause / requirement')}</th>
                    <th className="p-5 text-body-sm font-medium">{t('cab.nonconformities.table.classification', 'Classification')}</th>
                    <th className="p-5 text-body-sm font-medium">{t('portal.findings.raised', 'Raised')}</th>
                    <th className="p-5 text-body-sm font-medium">{t('portal.findings.responseDue', 'Response due')}</th>
                    <th className="p-5 text-body-sm font-medium">{t('cab.nonconformities.table.status', 'Status')}</th>
                    <th className="p-5 text-body-sm font-medium">{t('common.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-neutral-600">
                        {t('common.loading', 'Loading...')}
                      </td>
                    </tr>
                  ) : noMatch ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-neutral-600">
                        {t('portal.findings.noMatch', 'No findings match your filters.')}
                      </td>
                    </tr>
                  ) : (
                    paginated.map((item, index) => {
                      const { clause, text } = splitDescription(item.description)
                      return (
                        <tr
                          key={item.id}
                          onClick={() => open(item)}
                          className={cn('cursor-pointer transition-colors hover:bg-primary-25', index % 2 === 1 && 'bg-neutral-25')}
                        >
                          <td className="px-4 py-4">
                            <p className="text-body font-semibold text-primary" dir="ltr">
                              {item.ncId}
                            </p>
                            <p className="text-caption text-neutral-600" dir="ltr">
                              {item.auditId}
                            </p>
                          </td>
                          <td className="max-w-[360px] px-4 py-4 text-start">
                            <p className="text-body-sm font-medium text-neutral-900">{clause}</p>
                            <p className="line-clamp-2 text-body-sm text-neutral-700">{text}</p>
                          </td>
                          <td className="px-4 py-4">{classificationBadge(item)}</td>
                          <td className="px-4 py-4 text-body-sm text-neutral-800">{item.raisedDate}</td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col items-center gap-1">
                              <span className={cn('text-body-sm', item.overdue ? 'font-medium text-error-600' : 'text-neutral-800')}>
                                {item.dueDate}
                              </span>
                              {overdueBadge(item)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <NonconformityStatusBadge status={item.status} label={statusLabel(item.status)} />
                          </td>
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                open(item)
                              }}
                              className={cn(
                                'rounded-sm px-3 py-1.5 text-caption font-medium transition-colors',
                                awaitsResponse(item.status)
                                  ? 'bg-primary text-white hover:bg-primary-hover'
                                  : 'border border-primary text-primary hover:bg-primary-25',
                              )}
                            >
                              {actionLabel(item)}
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {loading ? <p className="py-6 text-center text-neutral-600">{t('common.loading', 'Loading...')}</p> : null}
              {noMatch ? (
                <p className="py-6 text-center text-neutral-600">{t('portal.findings.noMatch', 'No findings match your filters.')}</p>
              ) : null}
              {!loading &&
                paginated.map((item) => {
                  const { clause, text } = splitDescription(item.description)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => open(item)}
                      className="w-full rounded-lg border border-neutral-100 bg-white p-4 text-start"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-body font-bold text-primary" dir="ltr">
                          {item.ncId}
                        </span>
                        <NonconformityStatusBadge status={item.status} label={statusLabel(item.status)} />
                      </div>
                      <p className="text-body-sm font-semibold text-neutral-900">{clause}</p>
                      <p className="line-clamp-2 text-body-sm text-neutral-700">{text}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {classificationBadge(item)}
                        {overdueBadge(item)}
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 border-t border-neutral-100 pt-2 text-body-sm">
                        <div>
                          <p className="text-neutral-600">{t('portal.findings.raised', 'Raised')}</p>
                          <p className="font-medium text-neutral-900">{item.raisedDate}</p>
                        </div>
                        <div>
                          <p className="text-neutral-600">{t('portal.findings.responseDue', 'Response due')}</p>
                          <p className={cn('font-medium', item.overdue ? 'text-error-600' : 'text-neutral-900')}>{item.dueDate}</p>
                        </div>
                      </div>
                      <span className="mt-3 block text-body-sm font-semibold text-primary">{actionLabel(item)}</span>
                    </button>
                  )
                })}
            </div>

            <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </PortalLayout>
  )
}
