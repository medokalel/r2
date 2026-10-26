import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useAuditClientsTourSteps } from '@/config/auditClientsTourSteps'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { AddCircleIcon, AppIcon, EyeIcon, SearchIcon } from '@/components/icons'
import { listCabClients, type CabAuditClientListItem, type CabClientList } from '@/lib/api/clientRegistrationApi'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { notSet } from '@/lib/emptyValue'
import { buttonVariants } from '@/components/ui/buttonVariants'
import { cn } from '@/lib/utils'

const EMPTY_RESULT: CabClientList = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
}

export function CabClientsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tourSteps = useAuditClientsTourSteps()
  const [result, setResult] = useState<CabClientList>(EMPTY_RESULT)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    listCabClients({ page, limit: 10, search })
      .then((data) => {
        if (!cancelled) setResult(data)
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(getUserErrorMessage(loadError, t, { fallbackKey: 'cab.clientsPage.loadError' }))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, search, t])

  const applySearch = () => {
    const nextSearch = query.trim()
    if (page === 1 && search === nextSearch) return
    setLoading(true)
    setError('')
    setPage(1)
    setSearch(nextSearch)
  }

  const openClient = (client: CabAuditClientListItem) => navigate(`/cab/clients/${client.id}`)

  const statusKey = (client: CabAuditClientListItem) => {
    const profileStatus = (client.profileStatus || '').toLowerCase()
    if (profileStatus === 'completed') return 'registered'
    if (profileStatus === 'draft') return 'draft'
    if (client.status?.toLowerCase() === 'inactive') return 'inactive'
    return profileStatus || client.status?.toLowerCase() || 'draft'
  }

  return (
    <CabLayout tourId="cab-audit-clients" tourSteps={tourSteps}>
      <CabTourStep steps={tourSteps} stepId="audit-clients-header">
        <CabHeader title={t('cab.clientsPage.title')} notificationCount={3} />
      </CabTourStep>
      <main className="flex flex-1 flex-col gap-5 overflow-auto page-main">
        <CabTourStep steps={tourSteps} stepId="audit-clients-filters">
          <div className="rounded-lg border border-neutral-100 bg-white p-3">
            <div className="relative flex items-center">
              <AppIcon icon={SearchIcon} size={18} className="pointer-events-none absolute start-3 text-neutral-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && applySearch()}
                placeholder={t('cab.clientsPage.searchPlaceholder')}
                className="w-full rounded-md border-0 bg-transparent py-2.5 ps-10 pe-14 text-body-sm outline-none"
              />
              <button
                type="button"
                onClick={applySearch}
                aria-label={t('cab.clientsPage.search')}
                className="absolute end-0 flex size-13 items-center justify-center rounded-md bg-primary text-white hover:bg-primary/90"
              >
                <AppIcon icon={SearchIcon} size={18} />
              </button>
            </div>
          </div>
        </CabTourStep>

        <CabTourStep steps={tourSteps} stepId="audit-clients-table">
          <section className="flex flex-col rounded-lg border border-neutral-100 bg-white py-5">
            <div className="mb-4 flex items-center justify-between gap-3 px-5">
              <div>
                <h2 className="text-body-lg font-bold text-neutral-900">{t('cab.clientsPage.title')}</h2>
                <p className="text-body-sm text-neutral-600">{t('cab.clientsPage.total', { count: result.total })}</p>
              </div>
              <CabTourStep steps={tourSteps} stepId="audit-clients-new-btn">
                <button
                  type="button"
                  onClick={() => navigate('/cab/clients/new')}
                  className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
                >
                  <AppIcon icon={AddCircleIcon} size={18} />
                  {t('cab.clientsPage.addClient')}
                </button>
              </CabTourStep>
            </div>

            {error && <p role="alert" className="px-5 py-4 text-error-500">{error}</p>}

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] border-collapse text-center">
                <thead>
                  <tr className="bg-primary text-white">
                    <th className="px-4 py-4 text-body-sm font-medium">{t('cab.clientsPage.table.client')}</th>
                    <th className="px-4 py-4 text-body-sm font-medium">{t('cab.clientsPage.table.registration')}</th>
                    <th className="px-4 py-4 text-body-sm font-medium">{t('cab.clientsPage.table.contact')}</th>
                    <th className="px-4 py-4 text-body-sm font-medium">{t('cab.clientsPage.table.location')}</th>
                    <th className="px-4 py-4 text-body-sm font-medium">{t('cab.clientsPage.table.status')}</th>
                    <th className="px-4 py-4 text-body-sm font-medium">{t('cab.clientsPage.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-neutral-600">{t('common.loading')}</td></tr>
                  ) : result.items.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-neutral-600">{t('cab.clientsPage.empty')}</td></tr>
                  ) : (
                    result.items.map((client, index) => (
                      <tr key={client.id} className={index % 2 ? 'bg-neutral-25' : ''}>
                        <td className="px-4 py-4 font-medium text-neutral-900">{client.name || notSet()}</td>
                        <td className="px-4 py-4 text-neutral-800">{client.tradeName || notSet()}</td>
                        <td className="px-4 py-4 text-neutral-800">
                          <div>{client.owner?.fullName || notSet()}</div>
                          <div className="text-body-sm text-neutral-600">{client.owner?.email || notSet()}</div>
                        </td>
                        <td className="px-4 py-4 text-neutral-800">{[client.city, client.address].filter(Boolean).join(', ') || notSet()}</td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-primary-50 px-3 py-1 text-caption font-medium text-primary">
                            {t(`cab.clientsPage.status.${statusKey(client)}`)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <CabTourStep steps={tourSteps} stepId="audit-clients-actions">
                            <button type="button" onClick={() => openClient(client)} aria-label={t('cab.clientsPage.view')} className="text-primary">
                              <AppIcon icon={EyeIcon} size={20} />
                            </button>
                          </CabTourStep>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 px-5 md:hidden">
              {!loading && result.items.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => openClient(client)}
                  className="w-full rounded-lg border border-neutral-100 p-4 text-start"
                >
                  <p className="font-semibold text-neutral-900">{client.name || notSet()}</p>
                  <p className="text-body-sm text-neutral-600">{client.tradeName || notSet()}</p>
                  <p className="mt-2 text-body-sm text-neutral-800">{client.owner?.email || notSet()}</p>
                </button>
              ))}
              {loading && <p className="py-6 text-center text-neutral-600">{t('common.loading')}</p>}
              {!loading && !result.items.length && <p className="py-6 text-center text-neutral-600">{t('cab.clientsPage.empty')}</p>}
            </div>

            {result.totalPages > 1 && (
              <TablePagination
                page={result.page}
                totalPages={result.totalPages}
                onPageChange={(nextPage) => {
                  setLoading(true)
                  setError('')
                  setPage(nextPage)
                }}
                className="mt-5 px-5"
              />
            )}
          </section>
        </CabTourStep>
      </main>
    </CabLayout>
  )
}
