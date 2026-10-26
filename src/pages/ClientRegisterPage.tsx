import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useValuesChanged } from '@/hooks/useValuesChanged'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useAuditClientsTourSteps } from '@/config/auditClientsTourSteps'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { Button } from '@/components/ui/Button'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Checkbox } from '@/components/ui/Checkbox'
import { CountryFlag } from '@/components/ui/CountryFlag'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { DateRangePicker, type DateRange } from '@/components/ui/DateRangePicker'
import { AddCircleIcon, AppIcon, ChevronDownIcon, ExcelFileIcon, ExportIcon, MoreIcon, PdfFileIcon, SearchIcon } from '@/components/icons'
import { ImportMenuButton } from '@/components/imports/ImportMenuButton'
import {
  listAllCabAuditClients,
  toClientRegisterEntry,
  type ClientRegisterEntry,
} from '@/lib/api/clientRegistrationApi'
import { getCountryOptions } from '@/lib/countries'
import { downloadExcelCsv, downloadPdfFromTable, matchesSearch, type TableColumn } from '@/lib/tableTools'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { notSet } from '@/lib/emptyValue'

const PAGE_SIZE = 10

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function endOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).getTime()
}


export function ClientRegisterPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const tourSteps = useAuditClientsTourSteps()

  const [clients, setClients] = useState<ClientRegisterEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState<DateRange>({ from: null, to: null })
  const [countryFilter, setCountryFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)

  const countryOptions = useMemo(() => getCountryOptions(i18n.language), [i18n.language])

  // Requests the clients; state is only set once the request settles.
  const requestClients = useCallback(
    () =>
      listAllCabAuditClients()
        .then((items) => setClients(items.map(toClientRegisterEntry)))
        .catch((loadError: unknown) => {
          setError(getUserErrorMessage(loadError, t, { fallbackKey: 'cab.clientsPage.loadError' }))
        })
        .finally(() => setLoading(false)),
    [t]
  )

  const loadClients = useCallback(() => {
    setLoading(true)
    setError('')
    return requestClients()
  }, [requestClients])

  // Reset the load flags in the render where the loader changes (language);
  // the effect below then refetches. On mount they already start as true/''.
  const requestClientsChanged = useValuesChanged([requestClients])
  if (requestClientsChanged) {
    setLoading(true)
    setError('')
  }

  useEffect(() => {
    void requestClients()
  }, [requestClients])

  const filtered = useMemo(() => {
    const periodStart = period.from ? startOfDay(period.from) : null
    // A single selected date means that full day. A completed range includes
    // every timestamp on its final day, rather than stopping at midnight.
    const periodEnd = period.to
      ? endOfDay(period.to)
      : period.from
        ? endOfDay(period.from)
        : null

    return clients.filter((client) => {
      const matchesQuery = matchesSearch(
        [client.code, client.name, client.contactName, client.contactEmail, client.city],
        query
      )
      const matchesCountry =
        countryFilter === 'all' || !client.countryCode || client.countryCode === countryFilter
      const addedAt = new Date(client.updatedAt).getTime()
      const hasValidDate = !Number.isNaN(addedAt)
      const matchesFrom = periodStart === null || (hasValidDate && addedAt >= periodStart)
      const matchesTo = periodEnd === null || (hasValidDate && addedAt <= periodEnd)
      return matchesQuery && matchesCountry && matchesFrom && matchesTo
    })
  }, [clients, query, countryFilter, period])

  // A changed filter can hide previously selected rows, so drop the selection
  // whenever the filtered set itself changes shape.
  const filtersChanged = useValuesChanged([query, countryFilter, period])
  if (filtersChanged) {
    setSelectedIds([])
  }

  const toggleSelected = (id: string) =>
    setSelectedIds((previous) => (previous.includes(id) ? previous.filter((selectedId) => selectedId !== id) : [...previous, id]))

  const allFilteredSelected = filtered.length > 0 && filtered.every((client) => selectedIds.includes(client.id))
  const toggleSelectAll = () => setSelectedIds(allFilteredSelected ? [] : filtered.map((client) => client.id))

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const rangeFrom = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeTo = Math.min(currentPage * PAGE_SIZE, filtered.length)

  const hasActiveFilters = Boolean(query || period.from || period.to || countryFilter !== 'all')
  const clearFilters = () => {
    setQuery('')
    setPeriod({ from: null, to: null })
    setCountryFilter('all')
    setPage(1)
  }

  const formatDate = (iso: string) => {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return notSet()
    return new Intl.DateTimeFormat(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
  }

  const exportColumns: TableColumn<ClientRegisterEntry>[] = [
    { header: t('cab.clientRegister.table.code'), value: (row) => row.code },
    { header: t('cab.clientRegister.table.client'), value: (row) => row.name },
    {
      header: t('cab.clientRegister.table.city'),
      value: (row) => row.city || notSet(),
    },
    { header: t('cab.clientRegister.table.country'), value: (row) => (row.countryCode ? countryName(row.countryCode) : notSet()) },
    { header: t('cab.clientRegister.table.primaryContact'), value: (row) => row.contactName },
    { header: 'Email', value: (row) => row.contactEmail },
    { header: t('cab.clientRegister.table.added', 'Added'), value: (row) => formatDate(row.updatedAt) },
  ]

  const exportRows = selectedIds.length > 0 ? filtered.filter((client) => selectedIds.includes(client.id)) : filtered

  const handleExportPdf = () =>
    downloadPdfFromTable('client-register.pdf', t('cab.clientRegister.title'), exportColumns, exportRows)
  const handleExportExcel = () => downloadExcelCsv('client-register.csv', exportColumns, exportRows)


  const countryName = (code: string) => countryOptions.find((option) => option.code === code)?.name ?? code
  const initials = (name: string) =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase()
  const openClient = (id: string) => navigate(`/cab/clients/${id}`)
  const menuItemClass =
    'flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2.5 text-start text-body-sm font-medium text-neutral-800 outline-none data-[highlighted]:bg-primary-25'
  const menuClass = 'z-50 min-w-[200px] rounded-md border border-neutral-100 bg-white p-1 shadow-card'

  const exportMenu = (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="secondary" icon={<AppIcon icon={ExportIcon} size={20} />} disabled={filtered.length === 0}>
          {selectedIds.length > 0
            ? t('cab.clientRegister.exportSelected', { count: selectedIds.length, defaultValue: 'Export ({{count}})' })
            : t('cab.clientRegister.export')}
          <AppIcon icon={ChevronDownIcon} size={16} />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={6} className={menuClass}>
          <DropdownMenu.Item onSelect={handleExportPdf} className={menuItemClass}>
            <AppIcon icon={PdfFileIcon} size={18} />
            {t('cab.clientRegister.exportPdf')}
          </DropdownMenu.Item>
          <DropdownMenu.Item onSelect={handleExportExcel} className={menuItemClass}>
            <AppIcon icon={ExcelFileIcon} size={18} />
            {t('cab.clientRegister.exportExcel')}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )

  // Excel import (clients template); refreshes the register after a commit.
  const importMenu = <ImportMenuButton definitionKey="clients" variant="secondary" size="default" onImported={() => void loadClients()} />

  const rowMenu = (client: ClientRegisterEntry) => (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          aria-label={t('cab.clientRegister.table.actions')}
          className="flex size-9 items-center justify-center rounded-md text-neutral-600 hover:bg-primary-25 hover:text-primary"
        >
          <AppIcon icon={MoreIcon} size={20} className="rotate-90" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={4} className={menuClass} onClick={(event) => event.stopPropagation()}>
          <DropdownMenu.Item onSelect={() => openClient(client.id)} className={menuItemClass}>
            {t('cab.clientRegister.rowActions.view')}
          </DropdownMenu.Item>
          <DropdownMenu.Item onSelect={() => navigate(`/cab/clients/${client.id}/profile`)} className={menuItemClass}>
            {t('cab.clientRegister.rowActions.edit')}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )

  const location = (client: ClientRegisterEntry) => (
    <span className="flex min-w-0 items-center gap-2">
      {client.countryCode && <CountryFlag code={client.countryCode} className="h-4 w-6 shrink-0" />}
      <span className="min-w-0">
        <span dir="auto" className="block truncate text-start text-body-sm text-text-primary">{client.city || notSet()}</span>
        {client.countryCode && <span className="block truncate text-caption text-text-secondary">{countryName(client.countryCode)}</span>}
      </span>
    </span>
  )

  return (
    <CabLayout tourId="audit-clients-register" tourSteps={tourSteps}>
      <CabTourStep steps={tourSteps} stepId="audit-clients-header">
        <div>
          <CabHeader title={t('cab.clientRegister.title')} notificationCount={3} />
        </div>
      </CabTourStep>
      <main className="flex flex-1 flex-col gap-5 overflow-auto page-main">
        <Breadcrumbs
          items={[
            { label: t('cab.clientRegister.breadcrumbParent'), to: ROUTES.cabWorkspace },
            { label: t('cab.clientRegister.title') },
          ]}
        />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-page-title text-text-primary">{t('cab.clientRegister.title')}</h1>
            <p className="mt-1 text-body-sm text-text-secondary">{t('cab.clientRegister.subtitle')}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
            <CabTourStep steps={tourSteps} stepId="audit-clients-new-btn" className="col-span-2 w-full sm:order-last sm:w-auto">
              <Button
                variant="primary"
                icon={<AppIcon icon={AddCircleIcon} size={20} />}
                onClick={() => navigate('/cab/clients/new')}
                className="w-full sm:w-auto"
              >
                {t('cab.clientRegister.newClient')}
              </Button>
            </CabTourStep>
            {importMenu}
            {exportMenu}
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-error-50 px-4 py-3 text-body-sm text-error-600">
            {error}
          </p>
        )}

        <CabTourStep steps={tourSteps} stepId="audit-clients-filters">
          <section className="rounded-lg border border-neutral-100 bg-white p-4 shadow-card sm:p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.618fr)_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
              <label className="flex flex-col gap-2 sm:col-span-2 xl:col-span-1">
                <span className="text-body-sm font-semibold text-text-primary">{t('cab.clientRegister.filters.search')}</span>
                <span className="relative">
                  <span className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-text-secondary">
                    <AppIcon icon={SearchIcon} size={20} />
                  </span>
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => {
                      setPage(1)
                      setQuery(event.target.value)
                    }}
                    placeholder={t('cab.clientRegister.filters.searchPlaceholder')}
                    className="h-14 w-full rounded-md border border-neutral-100 bg-white ps-12 pe-4 text-body text-text-primary placeholder:text-text-secondary focus:border-focus focus:outline-none"
                  />
                </span>
              </label>

              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                aria-expanded={filtersOpen}
                className="flex h-11 items-center justify-between rounded-md bg-primary-25 px-4 text-body-sm font-semibold text-primary sm:hidden"
              >
                <span>
                  {t('cab.clientRegister.moreFilters', 'More filters')}
                  {hasActiveFilters && <span className="ms-2 inline-block size-2 rounded-full bg-primary align-middle" aria-hidden />}
                </span>
                <AppIcon icon={ChevronDownIcon} size={16} className={cn('transition-transform', filtersOpen && 'rotate-180')} />
              </button>

              <div className={cn('flex-col gap-2 sm:flex', filtersOpen ? 'flex' : 'hidden')}>
                <span className="text-body-sm font-semibold text-text-primary">{t('cab.clientRegister.filters.addedPeriod')}</span>
                <DateRangePicker
                  value={period}
                  onChange={(next) => {
                    setPage(1)
                    setPeriod(next)
                  }}
                  placeholder={t('cab.clientRegister.filters.addedPeriodPlaceholder')}
                />
              </div>

              <div className={cn('flex-col gap-2 sm:flex', filtersOpen ? 'flex' : 'hidden')}>
                <span className="text-body-sm font-semibold text-text-primary">{t('cab.clientRegister.filters.country')}</span>
                <SearchableSelect
                  value={countryFilter}
                  onChange={(value) => {
                    setPage(1)
                    setCountryFilter(value)
                  }}
                  options={[
                    { value: 'all', label: t('cab.clientRegister.filters.allCountries') },
                    ...countryOptions.map((option) => ({ value: option.code, label: option.name })),
                  ]}
                  searchPlaceholder={t('common.search')}
                />
              </div>

              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className={cn('h-14 whitespace-nowrap rounded-md px-4 text-body-sm font-semibold text-primary transition-colors hover:bg-primary-25 disabled:cursor-not-allowed disabled:text-neutral-400 disabled:hover:bg-transparent sm:block sm:justify-self-start xl:justify-self-end', filtersOpen ? 'block' : 'hidden')}
              >
                {t('cab.clientRegister.clearFilters')}
              </button>
            </div>
          </section>
        </CabTourStep>

        <CabTourStep steps={tourSteps} stepId="audit-clients-table">
          <section className="flex flex-col overflow-hidden rounded-lg border border-neutral-100 bg-white shadow-card">
            <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3 sm:px-5">
              <p className="text-body-sm font-semibold text-text-primary">
                {t('cab.clientRegister.count', { count: filtered.length, defaultValue: '{{count}} clients' })}
              </p>
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-3 rounded-full bg-primary-25 px-3 py-1.5 text-body-sm">
                  <span className="font-semibold text-primary">{t('cab.clientRegister.selectedCount', { count: selectedIds.length })}</span>
                  <button type="button" onClick={() => setSelectedIds([])} className="font-medium text-text-secondary hover:text-primary">
                    {t('cab.clientRegister.clearSelection', 'Clear selection')}
                  </button>
                </div>
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] border-collapse text-start">
                <thead>
                  <tr className="bg-primary text-white">
                    <th className="w-12 px-4 py-4 text-start">
                      <Checkbox checked={allFilteredSelected} onChange={toggleSelectAll} aria-label={t('common.selectAll')} className="[&>span]:border-white/70" />
                    </th>
                    <th className="px-4 py-4 text-start text-body-sm font-medium">{t('cab.clientRegister.table.client')}</th>
                    <th className="px-4 py-4 text-start text-body-sm font-medium">{t('cab.clientRegister.table.location', 'Location')}</th>
                    <th className="px-4 py-4 text-start text-body-sm font-medium">{t('cab.clientRegister.table.primaryContact')}</th>
                    <th className="px-4 py-4 text-start text-body-sm font-medium">{t('cab.clientRegister.table.added', 'Added')}</th>
                    <th className="w-14 px-4 py-4">
                      <span className="sr-only">{t('cab.clientRegister.table.actions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-body text-text-secondary">{t('common.loading')}</td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-body text-text-secondary">{t('cab.clientRegister.empty')}</td>
                    </tr>
                  ) : (
                    paginated.map((client, index) => {
                      const selected = selectedIds.includes(client.id)
                      return (
                        <tr
                          key={client.id}
                          onClick={() => openClient(client.id)}
                          className={cn(
                            'cursor-pointer border-b border-neutral-100 transition-colors last:border-0 hover:bg-primary-25',
                            selected ? 'bg-primary-25' : index % 2 ? 'bg-neutral-25' : 'bg-white',
                          )}
                        >
                          <td className="px-4 py-4" onClick={(event) => event.stopPropagation()}>
                            <Checkbox checked={selected} onChange={() => toggleSelected(client.id)} aria-label={client.name} />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-body-sm font-bold text-primary">
                                {initials(client.name)}
                              </span>
                              <div className="min-w-0">
                                <p dir="auto" className="truncate text-start text-body font-semibold text-text-primary">{client.name}</p>
                                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-caption text-text-secondary">
                                  <span className="rounded-sm bg-primary-25 px-1.5 py-0.5 font-medium text-primary" dir="ltr">{client.code}</span>
                                  {client.industry && <span className="truncate">{client.industry}</span>}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">{location(client)}</td>
                          <td className="px-4 py-4">
                            <p dir="auto" className="truncate text-start text-body-sm font-medium text-text-primary">{client.contactName || notSet()}</p>
                            <p className="truncate text-body-sm text-text-secondary" dir="ltr">{client.contactEmail || notSet()}</p>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-body-sm text-text-secondary">{formatDate(client.updatedAt)}</td>
                          <td className="px-4 py-4" onClick={(event) => event.stopPropagation()}>
                            <CabTourStep steps={tourSteps} stepId={index === 0 ? 'audit-clients-actions' : undefined}>
                              {rowMenu(client)}
                            </CabTourStep>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Phones: one card per client */}
            <ul className="flex flex-col gap-3 p-4 md:hidden">
              {loading ? (
                <li className="py-6 text-center text-body-sm text-text-secondary">{t('common.loading')}</li>
              ) : paginated.length === 0 ? (
                <li className="py-6 text-center text-body-sm text-text-secondary">{t('cab.clientRegister.empty')}</li>
              ) : (
                paginated.map((client) => (
                  <li key={client.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => openClient(client.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') openClient(client.id)
                      }}
                      className={cn(
                        'flex cursor-pointer flex-col gap-3 rounded-lg border p-4 transition-colors',
                        selectedIds.includes(client.id) ? 'border-primary-100 bg-primary-25' : 'border-neutral-100 bg-white',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span onClick={(event) => event.stopPropagation()} className="pt-2.5">
                          <Checkbox checked={selectedIds.includes(client.id)} onChange={() => toggleSelected(client.id)} aria-label={client.name} />
                        </span>
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-body-sm font-bold text-primary">
                          {initials(client.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p dir="auto" className="truncate text-start text-body font-semibold text-text-primary">{client.name}</p>
                          <span className="mt-1 inline-block rounded-sm bg-primary-25 px-1.5 py-0.5 text-caption font-medium text-primary" dir="ltr">{client.code}</span>
                        </div>
                        <span onClick={(event) => event.stopPropagation()}>{rowMenu(client)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 border-t border-neutral-100 pt-3">
                        {location(client)}
                        <span className="text-end text-caption text-text-secondary">{formatDate(client.updatedAt)}</span>
                      </div>
                      {client.contactName && (
                        <p className="truncate text-body-sm text-text-secondary">
                          <span className="font-medium text-text-primary">{client.contactName}</span> · <span dir="ltr">{client.contactEmail}</span>
                        </p>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>

            {filtered.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-neutral-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-body-sm text-text-secondary">
                  {t('cab.clientRegister.showingRange', { from: rangeFrom, to: rangeTo, total: filtered.length })}
                </p>
                <TablePagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </section>
        </CabTourStep>
      </main>
    </CabLayout>
  )
}
