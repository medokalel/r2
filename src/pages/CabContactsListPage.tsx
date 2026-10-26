import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getCountries, getCountryCallingCode } from 'libphonenumber-js'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useContactsListTourSteps } from '@/config/contactsListTourSteps'
import { TableFilterSelect } from '@/components/dashboard/TableFilterSelect'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { getContactClients, getContacts, type ContactClientOption, type ContactItem } from '@/lib/api/cabContactsApi'
import { AddCircleIcon, AppIcon, SearchIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { CountryFlag } from '@/components/ui/CountryFlag'
import { ExportMenuButton } from '@/components/ui/ExportMenuButton'
import { fieldInputClassName, fieldHeightClassName } from '@/components/ui/fieldStyles'
import { downloadExcelCsv, downloadPdfFromTable, matchesSearch, type TableColumn } from '@/lib/tableTools'
import { cn } from '@/lib/utils'
import { ContactDetailDrawer } from '@/components/dashboard/cab/contacts/ContactDetailDrawer'
import { ImportMenuButton } from '@/components/imports/ImportMenuButton'
import { ReturnToBanner } from '@/components/ui/ReturnToBanner'
import { useDeepLinkField } from '@/hooks/useDeepLinkField'
import { notSet } from '@/lib/emptyValue'

const PAGE_SIZE = 10

/** First country using a dial prefix such as "+966", for showing its flag. */
function countryForPrefix(prefix: string): string | null {
  const digits = prefix.replace(/\D/g, '')
  return getCountries().find((code) => getCountryCallingCode(code) === digits) ?? null
}

const statusClass: Record<ContactItem['status'], string> = {
  active: 'bg-success-50 text-success-700',
  pending: 'bg-warning-50 text-warning-700',
  inactive: 'bg-neutral-50 text-neutral-700',
}

function StatusPill({ status, label }: { status: ContactItem['status']; label: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-sm px-2.5 py-0.5 text-caption font-medium whitespace-nowrap', statusClass[status])}>
      {label}
    </span>
  )
}

function Phone({ contact }: { contact: ContactItem }) {
  if (!contact.phoneNumber) return <span className="text-text-secondary">{notSet()}</span>
  const country = countryForPrefix(contact.phonePrefix)
  return (
    <span dir="ltr" className="inline-flex items-center gap-2 whitespace-nowrap tabular-nums">
      {country && <CountryFlag code={country} className="h-3.5 w-5" />}
      {contact.phonePrefix} {contact.phoneNumber}
    </span>
  )
}

export function CabContactsListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tourSteps = useContactsListTourSteps()

  const [contacts, setContacts] = useState<ContactItem[]>([])
  // Contact shown in the detail panel (row "View").
  const [viewingId, setViewingId] = useState<string | null>(null)
  const viewing = viewingId ? contacts.find((c) => c.id === viewingId) ?? null : null
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [exporting, setExporting] = useState(false)
  const [clients, setClients] = useState<ContactClientOption[]>([])
  const [reloadKey, setReloadKey] = useState(0)
  // Deep link from the import wizard: ?contact=<id>&edit=1 opens that contact in edit mode.
  const [params, setParams] = useSearchParams()
  const linkedContact = params.get('contact')
  const [editOnOpen, setEditOnOpen] = useState(false)
  const [handledLink, setHandledLink] = useState<string | null>(null)
  if (linkedContact && !loading && handledLink !== linkedContact) {
    setHandledLink(linkedContact)
    if (contacts.some((c) => c.id === linkedContact)) {
      setViewingId(linkedContact)
      setEditOnOpen(params.get('edit') === '1')
    }
  }
  useEffect(() => {
    if (!linkedContact || handledLink !== linkedContact) return
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('contact')
        next.delete('edit')
        return next
      },
      { replace: true },
    )
  }, [linkedContact, handledLink, setParams])
  useDeepLinkField(Boolean(viewing) && editOnOpen)

  useEffect(() => {
    let cancelled = false
    getContactClients()
      .then((data) => {
        if (!cancelled) setClients(data)
      })
      .catch(() => {
        // The client filter then only offers "All Clients".
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    getContacts({ client: selectedClient, status: selectedStatus })
      .then((data) => {
        if (!cancelled) setContacts(data)
      })
      .catch(() => {
        if (!cancelled) setContacts([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedClient, selectedStatus, reloadKey])

  // Search filters as you type: name, email, client, code, job title, phone.
  const filtered = useMemo(
    () =>
      contacts.filter((c) =>
        matchesSearch(
          [c.firstName, c.lastName, `${c.firstName} ${c.lastName}`, c.email, c.clientName, c.clientCode, c.jobTitle, c.phoneNumber],
          searchQuery
        )
      ),
    [contacts, searchQuery]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const statusLabel = (status: ContactItem['status']) => t(`cab.contacts.status.${status}`, status)

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const pageIds = paginated.map((c) => c.id)
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id))
  const togglePage = () =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) pageIds.forEach((id) => next.delete(id))
      else pageIds.forEach((id) => next.add(id))
      return next
    })

  const exportColumns: TableColumn<ContactItem>[] = [
    { header: t('cab.contacts.columns.contact', 'Contact'), value: (c) => `${c.firstName} ${c.lastName}` },
    { header: t('cab.contacts.fields.email', 'Email'), value: (c) => c.email },
    { header: t('cab.contacts.columns.client', 'Client'), value: (c) => `${c.clientName} (${c.clientCode})` },
    { header: t('cab.contacts.columns.role', 'Roles / Designation'), value: (c) => c.jobTitle },
    { header: t('cab.contacts.columns.phone', 'Phone'), value: (c) => `${c.phonePrefix} ${c.phoneNumber}`.trim() },
    { header: t('cab.contacts.columns.sites', 'Linked Site(s)'), value: (c) => (c.linkedSiteNames ?? c.linkedSites).join(', ') },
    { header: t('cab.contacts.columns.status', 'Status'), value: (c) => statusLabel(c.status) },
  ]

  // Exports the ticked contacts when any are ticked, otherwise the filtered list.
  const exportRows = selected.size ? filtered.filter((c) => selected.has(c.id)) : filtered
  const runExport = (kind: 'excel' | 'pdf') => {
    setExporting(true)
    try {
      if (kind === 'excel') downloadExcelCsv('contacts.xlsx', exportColumns, exportRows)
      else downloadPdfFromTable('contacts.pdf', t('cab.contacts.title', 'Contacts'), exportColumns, exportRows)
    } finally {
      setExporting(false)
    }
  }

  return (
    <CabLayout sidebarVariant="contacts" tourId="cab-contacts-list" tourSteps={tourSteps}>
      <CabTourStep steps={tourSteps} stepId="contacts-header">
        <div>
          <CabHeader title={t('cab.contacts.title', 'Contacts')} notificationCount={3} />
        </div>
      </CabTourStep>

      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto page-main">
        <ReturnToBanner />
        <section className="flex min-w-0 flex-col gap-5 rounded-lg border border-neutral-100 bg-white p-3 shadow-card sm:p-5">
          {/* Toolbar: search + two filters on the start side, export + add on the end side */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CabTourStep steps={tourSteps} stepId="contacts-search-filters">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative block min-w-0 sm:w-[320px]">
                  <span className="sr-only">{t('common.search', 'Search')}</span>
                  <span className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-neutral-500">
                    <AppIcon icon={SearchIcon} size={20} />
                  </span>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setPage(1)
                    }}
                    placeholder={t('cab.contacts.filters.searchPlaceholder', 'Search contact, client or email...')}
                    className={cn(fieldInputClassName, fieldHeightClassName, 'ps-12')}
                  />
                </label>
                <div className="flex gap-3">
                  <TableFilterSelect
                    label={t('cab.contacts.filters.client', 'Client')}
                    value={selectedClient}
                    onChange={(value) => {
                      setPage(1)
                      setSelectedClient(value)
                    }}
                    options={[
                      { value: 'all', label: t('cab.contacts.filters.allClients', 'All Clients') },
                      ...clients.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` })),
                    ]}
                  />
                  <TableFilterSelect
                    label={t('cab.contacts.filters.status', 'Status')}
                    value={selectedStatus}
                    onChange={(value) => {
                      setPage(1)
                      setSelectedStatus(value)
                    }}
                    options={[
                      { value: 'all', label: t('cab.contacts.filters.allStatuses', 'All Statuses') },
                      { value: 'active', label: statusLabel('active') },
                      { value: 'pending', label: statusLabel('pending') },
                      { value: 'inactive', label: statusLabel('inactive') },
                    ]}
                  />
                </div>
              </div>
            </CabTourStep>

            <div className="flex flex-wrap gap-3">
              <ImportMenuButton definitionKey="contacts" size="default" onImported={() => setReloadKey((k) => k + 1)} />
              <ExportMenuButton
                onExportExcel={() => runExport('excel')}
                onExportPdf={() => runExport('pdf')}
                exporting={exporting}
                disabled={!filtered.length}
                label={
                  selected.size
                    ? t('cab.contacts.exportSelected', { count: selected.size, defaultValue: 'Export ({{count}})' })
                    : undefined
                }
              />
              <CabTourStep steps={tourSteps} stepId="contacts-add-btn">
                <Button
                  type="button"
                  onClick={() => navigate('/cab/contacts/new')}
                  icon={<AppIcon icon={AddCircleIcon} size={20} />}
                  className="w-full sm:w-auto"
                >
                  {t('cab.contacts.addContact', 'Add contact')}
                </Button>
              </CabTourStep>
            </div>
          </div>

          {/* Selection bar: only while something is ticked */}
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-primary-25 px-4 py-2.5">
              <p className="text-body-3-medium text-primary">
                {t('cab.contacts.selectedCount', { count: selected.size, defaultValue: '{{count}} selected' })}
              </p>
              <button type="button" onClick={() => setSelected(new Set())} className="text-body-3 text-primary hover:underline">
                {t('cab.contacts.clearSelection', 'Clear selection')}
              </button>
            </div>
          )}

          {/* Desktop table */}
          <CabTourStep steps={tourSteps} stepId="contacts-table">
            <div className="hidden overflow-x-auto rounded-md md:block">
              <table className="w-full min-w-[820px] border-collapse">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="w-12 px-4 py-4">
                      <Checkbox
                        checked={allOnPageSelected}
                        onChange={togglePage}
                        aria-label={t('cab.contacts.selectPage', 'Select all on this page')}
                        className="[&>span]:border-white"
                      />
                    </th>
                    <th className="px-4 py-4 text-start text-body-3-medium">{t('cab.contacts.columns.contact', 'Contact')}</th>
                    <th className="px-4 py-4 text-start text-body-3-medium">{t('cab.contacts.columns.client', 'Client')}</th>
                    <th className="px-4 py-4 text-start text-body-3-medium">{t('cab.contacts.columns.role', 'Roles / Designation')}</th>
                    <th className="px-4 py-4 text-start text-body-3-medium">{t('cab.contacts.columns.phone', 'Phone')}</th>
                    <th className="px-4 py-4 text-start text-body-3-medium">{t('cab.contacts.columns.status', 'Status')}</th>
                    <th className="px-4 py-4 text-end text-body-3-medium">
                      <span className="sr-only">{t('common.actions', 'Actions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-body-3 text-text-secondary">
                        {t('common.loading', 'Loading...')}
                      </td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-body-3 text-text-secondary">
                        {t('cab.contacts.empty', 'No contacts match your search.')}
                      </td>
                    </tr>
                  ) : (
                    paginated.map((contact, index) => {
                      const isSelected = selected.has(contact.id)
                      return (
                        <tr
                          key={contact.id}
                          className={cn(
                            'border-b border-neutral-100 transition-colors',
                            isSelected ? 'bg-primary-25' : index % 2 === 1 && 'bg-neutral-25'
                          )}
                        >
                          <td className="px-4 py-3.5">
                            <Checkbox
                              checked={isSelected}
                              onChange={() => toggleOne(contact.id)}
                              aria-label={`${contact.firstName} ${contact.lastName}`}
                            />
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-body-3-semibold text-text-primary">
                              {contact.firstName} {contact.lastName}
                            </p>
                            <p className="text-body-sm text-text-secondary" dir="ltr">{contact.email}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-body-3-medium text-text-primary">{contact.clientName}</p>
                            <p className="text-body-sm text-text-secondary">{contact.clientCode}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-body-3 text-text-primary">{contact.jobTitle}</p>
                            {(contact.isPrimaryContact || contact.isAuthorizedSignatory) && (
                              <p className="mt-0.5 text-caption text-primary">
                                {[
                                  contact.isPrimaryContact && t('cab.contacts.roles.primary', 'Primary contact'),
                                  contact.isAuthorizedSignatory && t('cab.contacts.roles.signatory', 'Signatory'),
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-body-3 text-text-primary">
                            <Phone contact={contact} />
                          </td>
                          <td className="px-4 py-3.5">
                            {index === 0 ? (
                              <CabTourStep steps={tourSteps} stepId="contacts-status">
                                <StatusPill status={contact.status} label={statusLabel(contact.status)} />
                              </CabTourStep>
                            ) : (
                              <StatusPill status={contact.status} label={statusLabel(contact.status)} />
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-end">
                            <button
                              type="button"
                              onClick={() => setViewingId(contact.id)}
                              className="text-body-3-medium text-primary hover:text-primary-hover hover:underline"
                            >
                              {t('common.view', 'View')}
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CabTourStep>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {!loading &&
              paginated.map((contact) => {
                const isSelected = selected.has(contact.id)
                return (
                  <div
                    key={contact.id}
                    className={cn(
                      'flex gap-3 rounded-md border p-4',
                      isSelected ? 'border-primary bg-primary-25' : 'border-neutral-100'
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => toggleOne(contact.id)}
                      aria-label={`${contact.firstName} ${contact.lastName}`}
                      className="mt-0.5"
                    />
                    <button type="button" onClick={() => setViewingId(contact.id)} className="min-w-0 flex-1 text-start">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-body-3-semibold text-text-primary">
                          {contact.firstName} {contact.lastName}
                        </p>
                        <StatusPill status={contact.status} label={statusLabel(contact.status)} />
                      </div>
                      <p className="mt-0.5 text-body-sm text-text-secondary">
                        {contact.jobTitle} · {contact.clientName}
                      </p>
                      <p className="mt-2 truncate text-body-3 text-text-primary" dir="ltr">{contact.email}</p>
                      <p className="mt-1 text-body-sm text-text-secondary">
                        <Phone contact={contact} />
                      </p>
                    </button>
                  </div>
                )
              })}
            {loading && <p className="py-6 text-center text-body-3 text-text-secondary">{t('common.loading', 'Loading...')}</p>}
            {!loading && !filtered.length && (
              <p className="py-6 text-center text-body-3 text-text-secondary">
                {t('cab.contacts.empty', 'No contacts match your search.')}
              </p>
            )}
          </div>

          {totalPages > 1 && (
            <TablePagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
          )}
        </section>
      </div>
      <ContactDetailDrawer
        contact={viewing}
        initialEditing={editOnOpen}
        onClose={() => {
          setViewingId(null)
          setEditOnOpen(false)
        }}
        onChanged={(saved) =>
          setContacts((list) => (saved ? list.map((c) => (c.id === saved.id ? saved : c)) : list.filter((c) => c.id !== viewingId)))
        }
      />
    </CabLayout>
  )
}
