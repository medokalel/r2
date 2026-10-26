import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { PeriodicVisitsTable } from '@/components/dashboard/periodicVisits/PeriodicVisitsTable'
import { AppLayout } from '@/components/layout/AppLayout'
import { ClientAuditProgressCard } from '@/components/execution/ClientAuditProgressCard'
import { usePeriodicVisitsTourSteps } from '@/config/auditeeTourSteps'
import { TourProvider } from '@/context/TourContext'
import {
  confirmPeriodicVisit,
  listPeriodicVisits,
  type PeriodicVisit,
  type PeriodicVisitProcedure,
} from '@/lib/api/periodicVisitsApi'

const PAGE_SIZE = 10

export function PeriodicVisitsPage() {
  const { t } = useTranslation()
  const tourSteps = usePeriodicVisitsTourSteps()
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [visits, setVisits] = useState<PeriodicVisit[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [procedureFilter, setProcedureFilter] = useState('all')
  const [specificationFilter, setSpecificationFilter] = useState('all')

  const query = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: appliedSearch || undefined,
      procedure: procedureFilter !== 'all' ? (procedureFilter as PeriodicVisitProcedure) : undefined,
      specification: specificationFilter !== 'all' ? specificationFilter : undefined,
    }),
    [page, appliedSearch, procedureFilter, specificationFilter],
  )
  // Loading until the list for the current query has arrived.
  const queryKey = JSON.stringify(query)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const loading = loadedKey !== queryKey

  useEffect(() => {
    let cancelled = false
    listPeriodicVisits(query)
      .then((result) => {
        if (cancelled) return
        setVisits(result.items)
        setTotalPages(result.totalPages)
      })
      .catch(() => {
        // The table stays as it was; the API error event surfaces the failure.
      })
      .finally(() => {
        if (!cancelled) setLoadedKey(queryKey)
      })
    return () => {
      cancelled = true
    }
  }, [query, queryKey])

  const handleConfirm = async (visit: PeriodicVisit) => {
    setConfirmingId(visit.id)
    setConfirmError(null)
    try {
      const saved = await confirmPeriodicVisit(visit.id)
      setVisits((prev) => prev.map((row) => (row.id === saved.id ? { ...row, ...saved } : row)))
    } catch (err) {
      setConfirmError(
        err instanceof Error && err.message
          ? err.message
          : t('periodicVisits.confirmError', 'The visit could not be confirmed. Please try again.'),
      )
    } finally {
      setConfirmingId(null)
    }
  }

  const handleSearch = () => {
    setPage(1)
    setAppliedSearch(search)
  }

  const handleExportAll = async () => {
    const result = await listPeriodicVisits({
      page: 1,
      limit: 1000,
      search: appliedSearch || undefined,
      procedure:
        procedureFilter !== 'all' ? (procedureFilter as PeriodicVisitProcedure) : undefined,
      specification: specificationFilter !== 'all' ? specificationFilter : undefined,
    })
    return result.items
  }

  return (
    <TourProvider tourId="auditee-periodic-visits" steps={tourSteps}>
      <AppLayout>
        <DashboardTourStep steps={tourSteps} stepId="visits-header">
          <AccreditationHeader titleKey="periodicVisits.pageTitle" />
        </DashboardTourStep>
        <div className="flex min-w-0 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 sm:p-5">
          {confirmError ? (
            <p role="alert" className="rounded-md border border-error-100 bg-error-50 px-4 py-3 text-body-sm text-error-700">
              {confirmError}
            </p>
          ) : null}
          <ClientAuditProgressCard />
          <PeriodicVisitsTable
            visits={visits}
            loading={loading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            search={search}
            onSearchChange={setSearch}
            onSearch={handleSearch}
            procedureFilter={procedureFilter}
            onProcedureFilterChange={(value) => {
              setPage(1)
              setProcedureFilter(value)
            }}
            specificationFilter={specificationFilter}
            onSpecificationFilterChange={(value) => {
              setPage(1)
              setSpecificationFilter(value)
            }}
            onExportAll={handleExportAll}
            onConfirm={handleConfirm}
            confirmingId={confirmingId}
          />
        </div>
      </AppLayout>
    </TourProvider>
  )
}
