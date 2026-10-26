import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { useValuesChanged } from '@/hooks/useValuesChanged'
import { toast } from '@/lib/toast'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { InvoicesTable } from '@/components/dashboard/invoices/InvoicesTable'
import { AppLayout } from '@/components/layout/AppLayout'
import { useInvoicesTourSteps } from '@/config/auditeeTourSteps'
import { TourProvider } from '@/context/TourContext'
import {
  listInvoices,
  type Invoice,
  type InvoiceCurrency,
  type InvoiceStatus,
} from '@/lib/api/invoicesApi'

const PAGE_SIZE = 10

export function InvoicesPage() {
  const { t } = useTranslation()
  const tourSteps = useInvoicesTourSteps()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [currencyFilter, setCurrencyFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Show the loader in the render where the query changes; the effect only fetches.
  if (useValuesChanged([page, appliedSearch, currencyFilter, statusFilter]) && !loading) setLoading(true)

  useEffect(() => {
    let active = true
    listInvoices({
      page,
      limit: PAGE_SIZE,
      search: appliedSearch || undefined,
      currency: currencyFilter !== 'all' ? (currencyFilter as InvoiceCurrency) : undefined,
      status: statusFilter !== 'all' ? (statusFilter as InvoiceStatus) : undefined,
    })
      .then((result) => {
        if (!active) return
        setInvoices(result.items)
        setTotalPages(result.totalPages)
      })
      .catch((error) => {
        if (active) toast.error(getUserErrorMessage(error, t))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [page, appliedSearch, currencyFilter, statusFilter, t])

  const handleSearch = () => {
    setPage(1)
    setAppliedSearch(search)
  }

  const handleCurrencyFilterChange = (value: string) => {
    setPage(1)
    setCurrencyFilter(value)
  }

  const handleStatusFilterChange = (value: string) => {
    setPage(1)
    setStatusFilter(value)
  }

  const handleExportAll = async () => {
    try {
      const result = await listInvoices({
        page: 1,
        limit: 1000,
        search: appliedSearch || undefined,
        currency: currencyFilter !== 'all' ? (currencyFilter as InvoiceCurrency) : undefined,
        status: statusFilter !== 'all' ? (statusFilter as InvoiceStatus) : undefined,
      })
      return result.items
    } catch (error) {
      toast.error(getUserErrorMessage(error, t))
      return []
    }
  }

  return (
    <TourProvider tourId="auditee-invoices" steps={tourSteps}>
      <AppLayout>
        <DashboardTourStep steps={tourSteps} stepId="invoices-header">
          <AccreditationHeader titleKey="invoices.pageTitle" />
        </DashboardTourStep>
        <div className="flex min-w-0 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 sm:p-5">
          <InvoicesTable
            invoices={invoices}
            loading={loading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            search={search}
            onSearchChange={setSearch}
            onSearch={handleSearch}
            currencyFilter={currencyFilter}
            onCurrencyFilterChange={handleCurrencyFilterChange}
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilterChange}
            onExportAll={handleExportAll}
          />
        </div>
      </AppLayout>
    </TourProvider>
  )
}