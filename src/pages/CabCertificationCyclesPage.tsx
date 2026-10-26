import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { enumLabel } from '@/lib/enumLabel'
import { Link, useNavigate } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useCertificationCyclesTourSteps } from '@/config/certificationCyclesTourSteps'
import { CertificationCycleTimeline } from '@/components/dashboard/cab/CertificationCycleTimeline'
import { CertificationLifecycleBadge } from '@/components/dashboard/cab/CertificationLifecycleBadge'
import { SelectField } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ExportMenuButton } from '@/components/ui/ExportMenuButton'
import { ImportMenuButton } from '@/components/imports/ImportMenuButton'
import {
  AddCircleIcon,
  AppIcon,
  CalendarIcon,
  EditIcon,
  ExcelFileIcon,
  MailIcon,
  MapPinIcon,
  MoreIcon,
  PdfFileIcon,
  SearchIcon,
  UserIcon,
} from '@/components/icons'
import {
  getCertificationCycleDetail,
  getCertificationCycles,
  type CertificationCycle,
  type CertificationCycleDetail,
  type CertificationCycleStage,
} from '@/lib/api/cabCertificationApi'
import { CycleTabPanel, type CycleTab } from '@/components/dashboard/cab/cycles/CycleTabPanel'
import { NewCycleDialog } from '@/components/dashboard/cab/cycles/NewCycleDialog'
import { downloadExcelCsv, downloadPdfFromTable, type TableColumn } from '@/lib/tableTools'
import { cn } from '@/lib/utils'
import { ROUTES, cabManageCertificationCyclePath } from '@/lib/routes'
import { displayCountry } from '@/lib/localizeCountry'
import { notSet } from '@/lib/emptyValue'
import { pageTabClassName, pageTabListClassName } from '@/components/ui/pageTabs'

/** Same breadcrumb chevron used across every CAB page (e.g. CabApplicationRegisterPage). */
function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-500 rtl-flip" aria-hidden>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const dropdownMenuContentClassName = 'z-50 min-w-[180px] rounded-md border border-neutral-100 bg-white p-1 shadow-lg'
const dropdownMenuItemClassName =
  'flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2.5 text-body-sm font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50'

const TABS = ['overview', 'audits', 'findings', 'certificates', 'documents', 'history'] as const
type TabId = (typeof TABS)[number]

/** Register tab → section of the manage-cycle panel that shows the same records. */
const TAB_SECTION: Record<Exclude<TabId, 'overview'>, CycleTab> = {
  audits: 'audits',
  findings: 'findings',
  certificates: 'certificateDetails',
  documents: 'documents',
  history: 'history',
}

const STAGE_STATUS_LABELS: Record<CertificationCycleStage['status'], string> = {
  completed: 'Completed',
  upcoming: 'Upcoming',
  pending: 'Pending',
}

const ACTIVITY_STATUS_STYLES: Record<string, string> = {
  Planned: 'bg-primary-50 text-primary',
  Open: 'bg-warning-50 text-warning-700',
  Done: 'bg-success-50 text-success-600',
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-caption font-medium text-neutral-600">{label}</p>
      <p className="mt-1 text-body-sm font-semibold text-neutral-900">{children || notSet()}</p>
    </div>
  )
}

export function CabCertificationCyclesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tourSteps = useCertificationCyclesTourSteps()
  const [newCycleOpen, setNewCycleOpen] = useState(false)
  /** Detail (tab records) of the selected cycle, keyed by cycle id. */
  const [detail, setDetail] = useState<{ id: string; data: CertificationCycleDetail | null; error: boolean } | null>(null)
  const [cycles, setCycles] = useState<CertificationCycle[]>([])
  const [search, setSearch] = useState('')
  const [duePeriod, setDuePeriod] = useState('all')
  const [country, setCountry] = useState('all')
  const [lifecycleStatus, setLifecycleStatus] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<TabId>('overview')
  const [exporting, setExporting] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  /** Key of the filters the shown list was loaded for; differs from `requestKey` while loading. */
  const [loadedKey, setLoadedKey] = useState<string | null>(null)

  const dueWithinDays = duePeriod === 'all' ? undefined : Number(duePeriod)
  const requestKey = JSON.stringify([search, duePeriod, country, lifecycleStatus, reloadToken])
  const loading = loadedKey !== requestKey

  const load = () => setReloadToken((token) => token + 1)

  useEffect(() => {
    let cancelled = false
    getCertificationCycles({
      searchQuery: search.trim() || undefined,
      country,
      lifecycleStatus,
      dueWithinDays,
    })
      .then((data) => {
        if (cancelled) return
        setCycles(data)
        setSelectedId((previous) => (data.some((cycle) => cycle.id === previous) ? previous : (data[0]?.id ?? null)))
      })
      .catch((error) => {
        console.error('Failed to load certification cycles:', error)
      })
      .finally(() => {
        if (!cancelled) setLoadedKey(requestKey)
      })
    return () => {
      cancelled = true
    }
  }, [search, country, lifecycleStatus, dueWithinDays, requestKey])

  const selected = useMemo(() => cycles.find((cycle) => cycle.id === selectedId) ?? null, [cycles, selectedId])

  /* Records behind the non-overview tabs come from the cycle detail; load it once a tab needs it. */
  const needsDetail = tab !== 'overview' && selectedId !== null
  useEffect(() => {
    if (!needsDetail || !selectedId) return
    let cancelled = false
    getCertificationCycleDetail(selectedId)
      .then((data) => {
        if (!cancelled) setDetail({ id: selectedId, data, error: false })
      })
      .catch((error) => {
        console.error('Failed to load certification cycle detail:', error)
        if (!cancelled) setDetail({ id: selectedId, data: null, error: true })
      })
    return () => {
      cancelled = true
    }
  }, [needsDetail, selectedId, reloadToken])
  const selectedDetail = detail && detail.id === selectedId ? detail : null
  const openManage = () => {
    if (selected) navigate(cabManageCertificationCyclePath(selected.id))
  }

  const clearFilters = () => {
    setSearch('')
    setDuePeriod('all')
    setCountry('all')
    setLifecycleStatus('all')
  }

  const exportColumns: TableColumn<CertificationCycle>[] = [
    { header: t('cab.certification.table.cycleId', 'Cycle ID'), value: (row) => row.cycleId },
    { header: t('cab.certification.fields.clientName', 'Client'), value: (row) => row.clientName },
    { header: t('cab.certification.fields.standard', 'Certificate standard'), value: (row) => row.certificateStandard },
    { header: t('cab.certification.fields.country', 'Country'), value: (row) => displayCountry(row.country) },
    { header: t('cab.certification.fields.cycleStatus', 'Cycle status'), value: (row) => row.lifecycleStatusLabel },
    { header: t('cab.certification.fields.nextSurveillance', 'Next surveillance due'), value: (row) => row.nextSurveillanceDue },
  ]

  const exportAll = async () => {
    setExporting(true)
    try {
      return await getCertificationCycles({ searchQuery: search.trim() || undefined, country, lifecycleStatus, dueWithinDays })
    } finally {
      setExporting(false)
    }
  }

  const handleExportExcel = async () => {
    downloadExcelCsv('certification-cycles', exportColumns, await exportAll())
  }

  const handleExportPdf = async () => {
    downloadPdfFromTable(
      'certification-cycles.pdf',
      t('cab.certification.title', 'Certification cycles'),
      exportColumns,
      await exportAll(),
    )
  }

  const tabLabels: Record<TabId, string> = {
    overview: t('cab.certification.tabs.overview', 'Cycle overview'),
    audits: t('cab.certification.tabs.audits', 'Audits'),
    findings: t('cab.certification.tabs.findings', 'Findings'),
    certificates: t('cab.certification.tabs.certificates', 'Certificates'),
    documents: t('cab.certification.tabs.documents', 'Documents'),
    history: t('cab.certification.tabs.history', 'History'),
  }

  return (
    <CabLayout tourId="cab-certification-cycles" tourSteps={tourSteps}>
      <CabHeader title={t('cab.certification.title', 'Certification cycles')} notificationCount={3} />
      <main className="flex flex-1 flex-col gap-5 overflow-auto page-main">
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-body-sm" aria-label={t('common.breadcrumb')}>
          <Link to={ROUTES.workspace} className="font-light text-neutral-500 hover:text-primary">
            {t('cab.certification.breadcrumbParent', 'Workspace')}
          </Link>
          <Chevron />
          <span className="font-medium text-neutral-800">{t('cab.certification.title', 'Certification cycles')}</span>
        </nav>

        <CabTourStep steps={tourSteps} stepId="cert-cycles-header">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-page-title text-text-primary">
                {t('cab.certification.title', 'Certification cycles')}
              </h1>
              <p className="mt-1 text-body-sm text-neutral-600">
                {t('cab.certification.subtitle', 'Manage certification cycles, view timelines and upcoming activities.')}
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
              <ImportMenuButton definitionKey="certification_cycles" size="default" onImported={load} />
              <Button
                variant="primary"
                icon={<AppIcon icon={AddCircleIcon} size={20} />}
                className="flex-1 sm:flex-none"
                onClick={() => setNewCycleOpen(true)}
              >
                {t('cab.certification.newCycle', 'New cycle')}
              </Button>
              <ExportMenuButton
                exporting={exporting}
                disabled={cycles.length === 0}
                onExportPdf={handleExportPdf}
                onExportExcel={handleExportExcel}
                pdfLabel={t('cab.certification.exportPdf', 'Download PDF')}
                excelLabel={t('cab.certification.exportExcel', 'Download Excel')}
              />
            </div>
          </div>
        </CabTourStep>

        {/* Filters */}
        <CabTourStep steps={tourSteps} stepId="cert-cycles-filters">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              load()
            }}
            className="rounded-lg border border-neutral-100 bg-white p-5"
          >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label htmlFor="certification-search" className="text-body-sm font-medium text-neutral-800">
                {t('cab.certification.searchLabel', 'Search client or certificate')}
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-500">
                  <AppIcon icon={SearchIcon} size={18} />
                </span>
                <input
                  id="certification-search"
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('cab.certification.searchPlaceholder', 'Search client or certificate')}
                  className="h-11 w-full rounded-md border border-neutral-100 bg-white ps-10 pe-3 text-body-sm text-neutral-900 placeholder:text-neutral-500 focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="certification-due-period" className="text-body-sm font-medium text-neutral-800">
                {t('cab.certification.duePeriod', 'Due period')}
              </label>
              <SelectField
                id="certification-due-period"
                value={duePeriod}
                onChange={setDuePeriod}
                className="h-11"
                options={[
                  { value: 'all', label: t('common.all', 'All') },
                  { value: '30', label: t('cab.certification.duePeriodOptions.30', 'Due in 30 days') },
                  { value: '90', label: t('cab.certification.duePeriodOptions.90', 'Due in 90 days') },
                  { value: '180', label: t('cab.certification.duePeriodOptions.180', 'Due in 180 days') },
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="certification-country" className="text-body-sm font-medium text-neutral-800">
                {t('cab.certification.country', 'Country')}
              </label>
              <SelectField
                id="certification-country"
                value={country}
                onChange={setCountry}
                className="h-11"
                options={[
                  { value: 'all', label: t('common.all', 'All') },
                  { value: 'Saudi Arabia', label: 'Saudi Arabia' },
                  { value: 'United Arab Emirates', label: 'United Arab Emirates' },
                  { value: 'Egypt', label: 'Egypt' },
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="certification-lifecycle-status" className="text-body-sm font-medium text-neutral-800">
                {t('cab.certification.lifecycleStatus', 'Lifecycle status')}
              </label>
              <SelectField
                id="certification-lifecycle-status"
                value={lifecycleStatus}
                onChange={setLifecycleStatus}
                className="h-11"
                options={[
                  { value: 'all', label: t('common.all', 'All') },
                  { value: 'active', label: t('cab.certification.status.active', 'Active') },
                  { value: 'upcoming', label: t('cab.certification.status.upcoming', 'Upcoming') },
                  { value: 'suspended', label: t('cab.certification.status.suspended', 'Suspended') },
                  { value: 'expired', label: t('cab.certification.status.expired', 'Expired') },
                ]}
              />
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <Button type="button" variant="tertiary" size="sm" onClick={clearFilters} className="h-auto p-0 text-body-sm">
              {t('cab.certification.clearFilters', 'Clear filters')}
            </Button>
          </div>
        </form>
      </CabTourStep>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
          {/* Cycle list */}
          <CabTourStep steps={tourSteps} stepId="cert-cycles-list">
            <section className="flex h-fit flex-col rounded-lg border border-neutral-100 bg-white p-4">
              <p className="mb-3 px-1 text-body-sm text-neutral-600">
                {loading
                  ? t('common.loading', 'Loading…')
                  : t('cab.certification.resultCount', '{{count}} result', { count: cycles.length })}
              </p>

              <div className="flex flex-col">
                {!loading && cycles.length === 0 && (
                  <p className="px-2 py-6 text-center text-body-sm text-neutral-500">
                    {t('cab.certification.empty', 'No certification cycles match the current filters.')}
                  </p>
                )}
                {cycles.map((cycle) => {
                  const isSelected = cycle.id === selectedId
                  return (
                    <button
                      key={cycle.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(cycle.id)
                        setTab('overview')
                      }}
                      className={cn(
                        'flex items-start gap-2 border-b border-b-neutral-50 border-s-4 px-3 py-3.5 text-start transition-colors last:border-b-0',
                        isSelected ? 'border-s-primary bg-primary-50/50' : 'border-s-transparent hover:bg-neutral-50',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-body-sm font-semibold text-neutral-900">{cycle.clientName}</p>
                          <CertificationLifecycleBadge status={cycle.lifecycleStatus} label={cycle.lifecycleStatusLabel} />
                        </div>
                        <p className="mt-0.5 text-body-sm text-neutral-600">{cycle.certificateStandard}</p>
                        <p className="mt-0.5 text-caption text-neutral-500">
                          {cycle.clientId} · {displayCountry(cycle.country)}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          </CabTourStep>

          {/* Detail panel */}
          <section className="flex min-w-0 flex-col gap-5">
            {!selected ? (
              <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white px-6 text-center">
                <p className="text-body-sm text-neutral-600">
                  {t('cab.certification.selectPrompt', 'Select a certification cycle to view its details.')}
                </p>
              </div>
            ) : (
              <>
                {/* Client header & Summary Card */}
                <CabTourStep steps={tourSteps} stepId="cert-cycles-summary-card">
                  <div className="flex flex-col gap-5">
                    <div className="rounded-lg border border-neutral-100 bg-white p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-caption font-medium text-neutral-600">{selected.clientId}</p>
                          <h1 className="text-page-title text-text-primary mt-0.5 truncate">{selected.clientName}</h1>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-neutral-600">
                            <span className="inline-flex items-center gap-1.5">
                              <AppIcon icon={MapPinIcon} size={16} />
                              {displayCountry(selected.country)}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <AppIcon icon={UserIcon} size={16} />
                              {selected.primaryContactName}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <AppIcon icon={MailIcon} size={16} />
                              {selected.primaryContactEmail}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Button asChild variant="primary" size="sm">
                            <Link to={cabManageCertificationCyclePath(selected.id)}>
                              {t('cab.certification.manageCycle', 'Manage cycle')}
                            </Link>
                          </Button>
                          <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                              <button
                                type="button"
                                aria-label={t('common.moreActions', 'More actions')}
                                className="flex size-9 items-center justify-center rounded-md border border-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-50"
                              >
                                <AppIcon icon={MoreIcon} size={18} />
                              </button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                              <DropdownMenu.Content align="end" sideOffset={4} className={dropdownMenuContentClassName}>
                                <DropdownMenu.Item onSelect={handleExportPdf} className={dropdownMenuItemClassName}>
                                  <AppIcon icon={PdfFileIcon} size={18} />
                                  {t('cab.certification.exportPdf', 'Download PDF')}
                                </DropdownMenu.Item>
                                <DropdownMenu.Item onSelect={handleExportExcel} className={dropdownMenuItemClassName}>
                                  <AppIcon icon={ExcelFileIcon} size={18} />
                                  {t('cab.certification.exportExcel', 'Download Excel')}
                                </DropdownMenu.Item>
                              </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                          </DropdownMenu.Root>
                        </div>
                      </div>
                    </div>

                    {/* Certification cycle info */}
                    <div className="rounded-lg border border-neutral-100 bg-white p-5">
                      <h2 className="text-body font-semibold text-neutral-900">
                        {t('cab.certification.cycleInfoTitle', 'Certification cycle')}
                      </h2>
                      <div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
                        <Field label={t('cab.certification.fields.standard', 'Certificate standard')}>
                          {selected.certificateStandard}
                          <span className="block text-caption font-normal text-neutral-600">{selected.certificateStandardLabel}</span>
                        </Field>
                        <Field label={t('cab.certification.fields.application', 'Application')}>{selected.applicationId}</Field>
                        <Field label={t('cab.certification.fields.cycleStatus', 'Cycle status')}>
                          <CertificationLifecycleBadge status={selected.lifecycleStatus} label={selected.lifecycleStatusLabel} />
                        </Field>
                        <Field label={t('cab.certification.fields.startDate', 'Cycle start date')}>{selected.cycleStartDate}</Field>
                        <Field label={t('cab.certification.fields.nextSurveillance', 'Next surveillance due')}>
                          <span className="inline-flex items-center gap-1.5">
                            <AppIcon icon={CalendarIcon} size={14} className="text-neutral-500" />
                            {selected.nextSurveillanceDue}
                          </span>
                          <span className="mt-0.5 block text-caption font-normal text-primary">
                            {selected.nextSurveillanceDueInDays >= 0
                              ? t('cab.certification.dueIn', 'Due in {{count}} days', { count: selected.nextSurveillanceDueInDays })
                              : t('cab.certification.overdueBy', 'Overdue by {{count}} days', { count: Math.abs(selected.nextSurveillanceDueInDays) })}
                          </span>
                        </Field>
                        <Field label={t('cab.certification.fields.endDate', 'Cycle end date')}>{selected.cycleEndDate}</Field>
                      </div>
                    </div>
                  </div>
                </CabTourStep>

                {/* Tabs — same pill-tab convention as the audit reporting workspace */}
                <div
                  className={pageTabListClassName}
                  role="tablist"
                  aria-label={t('cab.certification.tabsLabel', 'Certification cycle sections')}
                >
                  {TABS.map((tabId) => (
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

                {tab === 'overview' ? (
                  <CabTourStep steps={tourSteps} stepId="cert-cycles-timeline-activities">
                    <div className="flex flex-col gap-5">
                      {/* Timeline */}
                      <section className="rounded-lg border border-neutral-100 bg-white p-5">
                        <h2 className="mb-6 text-body font-semibold text-neutral-900">
                          {t('cab.certification.timelineTitle', 'Cycle timeline')}
                        </h2>
                        <CertificationCycleTimeline stages={selected.stages} statusLabels={STAGE_STATUS_LABELS} />
                      </section>

                      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        {/* Client details */}
                        <section className="rounded-lg border border-neutral-100 bg-white p-5">
                          <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-body font-semibold text-neutral-900">
                              {t('cab.certification.clientDetailsTitle', 'Client details')}
                            </h2>
                            <Button
                              type="button"
                              variant="tertiary"
                              size="sm"
                              icon={<AppIcon icon={EditIcon} size={14} />}
                              className="h-auto p-0 text-body-sm"
                              onClick={() => navigate(selected.organizationId ? `/cab/clients/${encodeURIComponent(selected.organizationId)}/profile` : ROUTES.cabAuditClients)}
                            >
                              {t('common.edit', 'Edit')}
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <Field label={t('cab.certification.fields.clientId', 'Client ID')}>{selected.clientId}</Field>
                            <Field label={t('cab.certification.fields.clientName', 'Client name')}>{selected.clientName}</Field>
                            <Field label={t('cab.certification.fields.country', 'Country')}>{displayCountry(selected.country)}</Field>
                            <Field label={t('cab.certification.fields.primaryContact', 'Primary contact')}>{selected.primaryContactName}</Field>
                            <Field label={t('cab.certification.fields.email', 'Email')}>{selected.primaryContactEmail}</Field>
                          </div>
                        </section>

                        {/* Upcoming activities */}
                        <section className="rounded-lg border border-neutral-100 bg-white p-5">
                          <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-body font-semibold text-neutral-900">
                              {t('cab.certification.upcomingActivitiesTitle', 'Upcoming activities')}
                            </h2>
                            <Button type="button" variant="tertiary" size="sm" className="h-auto p-0 text-body-sm" onClick={openManage}>
                              {t('common.viewAll', 'View all')}
                            </Button>
                          </div>
                          {selected.upcomingActivities.length === 0 ? (
                            <p className="py-4 text-center text-body-sm text-neutral-500">
                              {t('cab.certification.noActivities', 'No upcoming activities.')}
                            </p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[420px] text-start">
                                <thead>
                                  <tr className="border-b border-neutral-100 text-caption text-neutral-600">
                                    <th className="py-2 pe-2 text-start font-medium">{t('cab.certification.table.date', 'Date')}</th>
                                    <th className="py-2 pe-2 text-start font-medium">{t('cab.certification.table.activity', 'Activity')}</th>
                                    <th className="py-2 pe-2 text-start font-medium">{t('cab.certification.table.type', 'Type')}</th>
                                    <th className="py-2 ps-2 text-start font-medium">{t('cab.certification.table.status', 'Status')}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-50">
                                  {selected.upcomingActivities.map((activity) => (
                                    <tr key={activity.id} className="text-body-sm text-neutral-800">
                                      <td className="py-2.5 pe-2 whitespace-nowrap">{activity.date}</td>
                                      <td className="py-2.5 pe-2">{enumLabel(t, activity.activity)}</td>
                                      <td className="py-2.5 pe-2">{enumLabel(t, activity.type)}</td>
                                      <td className="py-2.5 ps-2">
                                        <span className={cn('inline-flex items-center justify-center rounded-sm px-2.5 py-0.5 text-caption font-medium whitespace-nowrap', ACTIVITY_STATUS_STYLES[activity.status])}>
                                          {enumLabel(t, activity.status)}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </section>
                      </div>
                    </div>
                  </CabTourStep>
                ) : !selectedDetail ? (
                  <section className="flex min-h-40 items-center justify-center rounded-lg border border-neutral-100 bg-white px-6 text-center">
                    <p className="text-body-sm text-neutral-600">{t('common.loading', 'Loading…')}</p>
                  </section>
                ) : !selectedDetail.data ? (
                  <section className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-neutral-100 bg-white px-6 text-center">
                    <p className="text-body-sm text-neutral-600">
                      {t('cab.certification.detailLoadFailed', 'The records of this cycle could not be loaded.')}
                    </p>
                    <Button type="button" variant="outline" size="sm" onClick={load}>
                      {t('common.retry', 'Retry')}
                    </Button>
                  </section>
                ) : (
                  <CycleTabPanel
                    tab={TAB_SECTION[tab]}
                    cycle={selectedDetail.data}
                    certificateActions={[]}
                    onCertificateAction={openManage}
                    onNewRequest={openManage}
                    onDecide={openManage}
                  />
                )}
              </>
            )}
          </section>
        </div>
      </main>
      <NewCycleDialog
        open={newCycleOpen}
        onClose={() => setNewCycleOpen(false)}
        onCreated={(cycle) => {
          setNewCycleOpen(false)
          navigate(cabManageCertificationCyclePath(cycle.id))
        }}
      />
    </CabLayout>
  )
}