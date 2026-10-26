import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImportMenuButton } from '@/components/imports/ImportMenuButton'
import { useTranslation } from 'react-i18next'
import { enumLabel } from '@/lib/enumLabel'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { TableFilterSelect } from '@/components/dashboard/TableFilterSelect'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useAuditScheduleTourSteps } from '@/config/auditScheduleTourSteps'
import { AppIcon, DownloadTrayIcon } from '@/components/icons'
import {
  fetchAuditPlans,
  fetchPlanningAuditors,
  fetchPlanningClients,
  saveAuditPlan,
  exportAuditPlansToFormat,
  type AuditPlan,
  type PlanningAuditor,
  type PlanningClient,
} from '@/lib/api/cabAuditPlanningApi'
import { cn } from '@/lib/utils'
import { ActionMenu, type ActionMenuItem } from '@/components/dashboard/cab/workflow/ActionMenu'
import { AuditPlanTransitionDialog } from '@/components/dashboard/cab/auditPlanning/AuditPlanLifecycleBar'
import {
  AUDIT_PLAN_ACTIONS,
  auditPlanActionLabel,
  auditPlanBlockText,
  auditReportPath,
} from '@/components/dashboard/cab/auditPlanning/lifecycleText'
import { auditPlanTransitionBlock, type AuditPlanTransition } from '@/lib/api/cabAuditPlanningApi'
import { executionPath } from '@/lib/api/executionApi'
import { displayCountry } from '@/lib/localizeCountry'
import { rangeText } from '@/lib/emptyValue'
import { buttonVariants } from '@/components/ui/buttonVariants'

/** 'YYYY-MM' of today (local time) — the month the calendar view opens on. */
function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/** 'YYYY-MM-DD' (UTC) a number of days from now — default dates of a new plan. */
function isoDateInDays(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)
}

/** Every 'YYYY-MM' an audit plan spans. */
function monthsOf(plan: AuditPlan): string[] {
  const months: string[] = []
  let [y, m] = plan.proposedStartDate.slice(0, 7).split('-').map(Number)
  const end = plan.proposedEndDate.slice(0, 7)
  for (let guard = 0; guard < 24; guard += 1) {
    const key = `${y}-${String(m).padStart(2, '0')}`
    months.push(key)
    if (key >= end) break
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return months
}

export function CabAuditSchedulePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const tourSteps = useAuditScheduleTourSteps()

  // View mode: 'list' | 'calendar'
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  // Filter state
  const [searchInput, setSearchInput] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('All')
  const [selectedCountry, setSelectedCountry] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')

  // Applied filter state
  const [appliedFilters, setAppliedFilters] = useState<{
    search: string
    period: string
    country: string
    status: string
  }>({
    search: '',
    period: 'All',
    country: 'All',
    status: 'All',
  })

  const [auditPlans, setAuditPlans] = useState<AuditPlan[]>([])
  // Unfiltered plans — the period and country filter options are derived from them.
  const [allPlans, setAllPlans] = useState<AuditPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  // Lifecycle action chosen from a row menu (confirmed in AuditPlanTransitionDialog).
  const [transition, setTransition] = useState<{ plan: AuditPlan; action: AuditPlanTransition } | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [page, setPage] = useState(1)

  // Clients and auditors offered by the create-plan form
  const [clientsList, setClientsList] = useState<PlanningClient[]>([])
  const [auditors, setAuditors] = useState<PlanningAuditor[]>([])

  // Create plan modal form state
  const [newClientCode, setNewClientCode] = useState('')
  const [newStage, setNewStage] = useState<'Stage 1' | 'Stage 2' | 'Surveillance 1'>('Stage 1')
  const [newStandard, setNewStandard] = useState('Occupational Health and Safety Management System (ISO 45001:2018)')
  const [newStartDate, setNewStartDate] = useState(() => isoDateInDays(21))
  const [newEndDate, setNewEndDate] = useState(() => isoDateInDays(22))
  const [newLeadAuditor, setNewLeadAuditor] = useState('')

  useEffect(() => {
    fetchAuditPlans().then(setAllPlans).catch(() => setAllPlans([]))
    fetchPlanningClients()
      .then((clients) => {
        setClientsList(clients)
        // The demo preselects its fourth client, as before.
        setNewClientCode((current) => current || (clients[3] ?? clients[0])?.code || '')
      })
      .catch(() => setClientsList([]))
    fetchPlanningAuditors()
      .then((people) => {
        const eligible = people.filter((p) => p.role !== 'Other')
        setAuditors(eligible)
        setNewLeadAuditor((current) => current || eligible[0]?.name || '')
      })
      .catch(() => setAuditors([]))
  }, [])

  // Reload whenever the applied filters change (isLoading is set by the filter handlers).
  useEffect(() => {
    let cancelled = false
    fetchAuditPlans({
      search: appliedFilters.search,
      country: appliedFilters.country,
      status: appliedFilters.status,
      plannedPeriod: appliedFilters.period,
    })
      .then((data) => {
        if (!cancelled) setAuditPlans(data)
      })
      .catch(() => {
        if (!cancelled) setAuditPlans([])
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [appliedFilters])

  const periodOptions = useMemo(
    () => Array.from(new Set(allPlans.flatMap(monthsOf))).sort().reverse(),
    [allPlans]
  )
  const countryOptions = useMemo(
    () => Array.from(new Set(allPlans.map((p) => p.country).filter(Boolean))).sort(),
    [allPlans]
  )
  const monthLabel = (period: string) =>
    new Date(Number(period.slice(0, 4)), Number(period.slice(5, 7)) - 1, 1).toLocaleDateString(i18n.language, {
      month: 'long',
      year: 'numeric',
    })

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setPage(1)
    setIsLoading(true)
    setAppliedFilters({
      search: searchInput,
      period: selectedPeriod,
      country: selectedCountry,
      status: selectedStatus,
    })
  }

  const handleClear = () => {
    setSearchInput('')
    setSelectedPeriod('All')
    setSelectedCountry('All')
    setSelectedStatus('All')
    setPage(1)
    setIsLoading(true)
    setAppliedFilters({
      search: '',
      period: 'All',
      country: 'All',
      status: 'All',
    })
  }

  /** Row menu of a plan: edit, agenda, lifecycle actions (disabled with the reason), report, export. */
  const rowActions = (plan: AuditPlan): ActionMenuItem[] => [
    {
      key: 'edit',
      label: t('cab.auditSchedule.actions.buildEdit', 'Build / Edit Plan'),
      onSelect: () => navigate(`/cab/audit-planning/build/${plan.planNumber}`),
    },
    {
      key: 'agenda',
      label: t('cab.auditSchedule.actions.viewAgenda', 'View Agenda'),
      onSelect: () => navigate(`/cab/audit-planning/build/${plan.planNumber}?tab=agenda`),
    },
    ...(plan.stage !== 'Planning'
      ? [{ key: 'execution', label: plan.status === 'Completed' ? t('execution.openButton.view') : t('execution.openButton.startContinue'), onSelect: () => navigate(executionPath(plan.planNumber)) }]
      : []),
    ...AUDIT_PLAN_ACTIONS.map((action) => {
      const block = auditPlanTransitionBlock(plan, action)
      return {
        key: action,
        label: auditPlanActionLabel(t, action),
        disabled: Boolean(block),
        hint: block ? auditPlanBlockText(t, block) : undefined,
        onSelect: () => setTransition({ plan, action }),
      }
    }),
    ...(plan.reportId
      ? [{ key: 'report', label: t('cab.auditPlanning.lifecycle.openReport', 'Open audit report'), onSelect: () => navigate(auditReportPath(plan.reportId as string)) }]
      : []),
    {
      key: 'export',
      label: t('cab.auditSchedule.actions.exportPlan', 'Export Plan'),
      onSelect: () => exportAuditPlansToFormat([plan], 'csv'),
    },
  ]

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    const client = clientsList.find((c) => c.code === newClientCode) || clientsList[0]
    if (!client) return
    const created = await saveAuditPlan({
      organizationId: client.id,
      clientName: client.name,
      clientCode: client.code,
      country: client.country || undefined,
      stage: newStage,
      standardName: newStandard,
      proposedStartDate: newStartDate,
      proposedEndDate: newEndDate,
      leadAuditor: newLeadAuditor,
      auditTeam: newLeadAuditor ? [newLeadAuditor] : [],
      siteName: client.site || undefined,
      status: 'Draft',
    })
    setIsCreateModalOpen(false)
    navigate(`/cab/audit-planning/build/${created.planNumber}`)
  }

  // Calendar view: the filtered period, or the current month.
  const calendarMonth = appliedFilters.period !== 'All' ? appliedFilters.period : currentMonth()
  const calendarDays = useMemo(() => {
    const year = Number(calendarMonth.slice(0, 4))
    const month = Number(calendarMonth.slice(5, 7))
    const total = new Date(year, month, 0).getDate()
    const days = []
    for (let i = 1; i <= total; i++) {
      const fullDate = `${calendarMonth}-${String(i).padStart(2, '0')}`
      const matchedAudits = auditPlans.filter(
        (p) => fullDate >= p.proposedStartDate && fullDate <= p.proposedEndDate
      )
      days.push({ dayNumber: i, dateStr: fullDate, audits: matchedAudits })
    }
    return days
  }, [auditPlans, calendarMonth])
  // Blank cells before day 1 so it falls under its weekday (the grid starts on Sunday).
  const leadingBlankDays = new Date(Number(calendarMonth.slice(0, 4)), Number(calendarMonth.slice(5, 7)) - 1, 1).getDay()

  return (
    <CabLayout sidebarVariant="auditPlanning" tourId="audit-schedule-tour" tourSteps={tourSteps}>
      <CabHeader
        title={t('cab.sidebar.auditSchedule', 'Audit schedule')}
        notificationCount={3}
      />

      <main className="flex flex-1 flex-col gap-5 overflow-auto page-main">
        {/* Page Header & View Toggles */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CabTourStep steps={tourSteps} stepId="audit-schedule-header">
            <div>
              <nav className="mb-1 flex items-center gap-2 text-body-sm text-neutral-500">
                <span className="font-medium text-neutral-600">
                  {t('cab.sidebar.auditPlanning', 'Audit Planning')}
                </span>
                <span>›</span>
                <span className="font-semibold text-primary">
                  {t('cab.sidebar.auditSchedule', 'Audit schedule')}
                </span>
              </nav>
              <h1 className="text-section-title text-text-primary">
                {t('cab.sidebar.auditSchedule', 'Audit schedule')}
              </h1>
              <p className="mt-1 text-body-sm text-neutral-600">
                {t('cab.auditSchedule.subtitle', 'Plan and manage audits across clients and sites.')}
              </p>
            </div>
          </CabTourStep>

          {/* List View / Calendar View toggle */}
          <CabTourStep steps={tourSteps} stepId="audit-schedule-view-toggle">
            <div className="inline-flex h-11 items-center rounded-md border border-neutral-100 bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn(
                  'inline-flex h-9 items-center gap-2 rounded-sm px-3.5 text-body-sm font-medium transition-all',
                  viewMode === 'list'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-neutral-700 hover:text-neutral-900'
                )}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                <span>{t('cab.auditSchedule.listView', 'List view')}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={cn(
                  'inline-flex h-9 items-center gap-2 rounded-sm px-3.5 text-body-sm font-medium transition-all',
                  viewMode === 'calendar'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-neutral-700 hover:text-neutral-900'
                )}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>{t('cab.auditSchedule.calendarView', 'Calendar view')}</span>
              </button>
            </div>
          </CabTourStep>
        </div>

        {/* Filter Toolbar matching DashboardTasks / Contacts standard */}
        <CabTourStep steps={tourSteps} stepId="audit-schedule-filters">
          <section className="rounded-lg border border-neutral-100 bg-white p-3 shadow-none">
            <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
              {/* Search audit or client */}
              <div className="relative min-w-[200px] flex-1">
                <svg
                  className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-neutral-500"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t('cab.auditSchedule.filters.search', 'Search audit or client')}
                  className="h-11 w-full rounded-md border border-neutral-100 bg-white pe-8 ps-9 text-body-sm text-neutral-800 placeholder:text-neutral-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Planned period */}
              <TableFilterSelect
                label={t('cab.auditSchedule.filters.period', 'Planned period')}
                value={selectedPeriod}
                onChange={setSelectedPeriod}
                options={[
                  { value: 'All', label: t('cab.auditSchedule.filters.allPeriods', 'All periods') },
                  ...periodOptions.map((period) => ({ value: period, label: monthLabel(period) })),
                ]}
                aria-label={t('cab.auditSchedule.filters.period', 'Planned period')}
                className="min-w-[150px]"
              />

              {/* Country */}
              <TableFilterSelect
                label={t('cab.auditSchedule.filters.country', 'Country')}
                value={selectedCountry}
                onChange={setSelectedCountry}
                options={[
                  { value: 'All', label: t('cab.auditSchedule.filters.allCountries', 'All countries') },
                  ...countryOptions.map((country) => ({ value: country, label: country })),
                ]}
                aria-label={t('cab.auditSchedule.filters.country', 'Country')}
                className="min-w-[140px]"
              />

              {/* Status */}
              <TableFilterSelect
                label={t('cab.auditSchedule.filters.status', 'Status')}
                value={selectedStatus}
                onChange={setSelectedStatus}
                options={[
                  { value: 'All', label: t('cab.auditSchedule.filters.allStatuses', 'All statuses') },
                  { value: 'Planned', label: enumLabel(t, 'Planned') },
                  { value: 'Draft', label: enumLabel(t, 'Draft') },
                  { value: 'In progress', label: enumLabel(t, 'In progress') },
                  { value: 'Completed', label: enumLabel(t, 'Completed') },
                ]}
                aria-label={t('cab.auditSchedule.filters.status', 'Status')}
                className="min-w-[140px]"
              />

              <button
                type="submit"
                className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'justify-center')}
              >
                {t('common.search', 'Search')}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex h-11 items-center justify-center rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50"
              >
                {t('common.clear', 'Clear')}
              </button>
            </form>
          </section>
        </CabTourStep>

        {/* Action Header bar: Count & Buttons */}
        <section className="flex flex-col rounded-lg border border-neutral-100 bg-white py-4 shadow-none">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4">
            <div>
              <h2 className="text-body-lg font-bold text-neutral-900">
                {t('cab.sidebar.auditSchedule', 'Audit schedule')}
              </h2>
              <p className="text-body-sm text-neutral-600">
                {auditPlans.length} {t('cab.auditSchedule.auditsFound', 'audit found')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <CabTourStep steps={tourSteps} stepId="audit-schedule-create-btn">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
                >
                  <span className="text-body leading-none">+</span>
                  <span>{t('cab.auditSchedule.createPlan', 'Create plan')}</span>
                </button>
              </CabTourStep>

              <ImportMenuButton
                definitionKey="audit_plans"
                onImported={() => {
                  fetchAuditPlans().then(setAllPlans).catch(() => undefined)
                  setAppliedFilters((current) => ({ ...current }))
                }}
              />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setExportMenuOpen((prev) => !prev)}
                  className="inline-flex h-11 items-center gap-2 rounded-md border border-neutral-100 bg-white px-3.5 text-body-sm font-medium text-neutral-800 transition hover:bg-neutral-50 whitespace-nowrap"
                >
                  <AppIcon icon={DownloadTrayIcon} size={18} />
                  <span>{t('common.export', 'Export')}</span>
                  <span className="text-overline text-neutral-500">▼</span>
                </button>

                {exportMenuOpen && (
                  <div className="absolute end-0 mt-1.5 w-44 rounded-md border border-neutral-100 bg-white py-1.5 shadow-xl z-20">
                    <button
                      type="button"
                      onClick={() => {
                        exportAuditPlansToFormat(auditPlans, 'csv')
                        setExportMenuOpen(false)
                      }}
                      className="w-full text-start px-4 py-2 text-body-sm text-neutral-800 hover:bg-neutral-50 font-medium"
                    >
                      {t('cab.auditSchedule.export.csv', 'Export as CSV')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportAuditPlansToFormat(auditPlans, 'excel')
                        setExportMenuOpen(false)
                      }}
                      className="w-full text-start px-4 py-2 text-body-sm text-neutral-800 hover:bg-neutral-50 font-medium"
                    >
                      {t('cab.auditSchedule.export.excel', 'Export as Excel')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportAuditPlansToFormat(auditPlans, 'json')
                        setExportMenuOpen(false)
                      }}
                      className="w-full text-start px-4 py-2 text-body-sm text-neutral-800 hover:bg-neutral-50 font-medium"
                    >
                      {t('cab.auditSchedule.export.json', 'Export as JSON')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* View Mode: List View or Calendar View */}
          <CabTourStep steps={tourSteps} stepId="audit-schedule-table">
            {viewMode === 'list' ? (
              <>
                {/* Desktop Table View */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full border-collapse text-center">
                    <thead>
                      <tr className="bg-primary text-white">
                        <th className="p-5 text-start text-body-sm font-medium">{t('cab.auditSchedule.columns.audit', 'Audit')}</th>
                        <th className="p-5 text-start text-body-sm font-medium">{t('cab.auditSchedule.columns.client', 'Client')}</th>
                        <th className="p-5 text-center text-body-sm font-medium">{t('cab.auditSchedule.columns.sites', 'Sites')}</th>
                        <th className="p-5 text-center text-body-sm font-medium">{t('cab.auditSchedule.columns.dates', 'Dates')}</th>
                        <th className="p-5 text-center text-body-sm font-medium">{t('cab.auditSchedule.columns.leadAuditor', 'Lead auditor')}</th>
                        <th className="p-5 text-center text-body-sm font-medium">{t('cab.auditSchedule.columns.status', 'Status')}</th>
                        <th className="p-5 text-end text-body-sm font-medium">{t('common.actions', 'Actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-neutral-600 text-body-sm">
                            {t('cab.auditSchedule.loading', 'Loading audits...')}
                          </td>
                        </tr>
                      ) : auditPlans.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-neutral-600">
                            <p className="font-semibold text-neutral-800 text-body">{t('cab.auditSchedule.noAudits', 'No audits found')}</p>
                            <p className="text-body-sm text-neutral-500 mt-1">{t('cab.auditSchedule.noAuditsDesc', 'Try adjusting your filters or search term.')}</p>
                          </td>
                        </tr>
                      ) : (
                        auditPlans.map((plan, index) => (
                          <tr
                            key={plan.id}
                            className={cn(
                              'hover:bg-primary-50/50 transition-colors',
                              index % 2 === 1 ? 'bg-neutral-25' : ''
                            )}
                          >
                            {/* Audit code & Standard */}
                            <td className="px-4 py-3.5 text-start">
                              <button
                                type="button"
                                onClick={() => navigate(`/cab/audit-planning/build/${plan.planNumber}`)}
                                className="text-body font-bold text-primary hover:underline"
                              >
                                {plan.planNumber}
                              </button>
                              <p className="text-body-sm text-neutral-600 mt-0.5">{plan.standardName}</p>
                            </td>

                            {/* Client info */}
                            <td className="px-4 py-3.5 text-start">
                              <p className="text-body font-medium text-neutral-900">{plan.clientName}</p>
                              <p className="text-body-sm text-neutral-600 font-mono mt-0.5">
                                {plan.clientCode} · {displayCountry(plan.country)}
                              </p>
                            </td>

                            {/* Sites */}
                            <td className="px-4 py-3.5 text-center">
                              <p className="text-body-sm font-medium text-neutral-800">1 {t('cab.auditSchedule.site', 'site')}</p>
                              <p className="text-body-sm text-neutral-500 mt-0.5">{plan.siteName}</p>
                            </td>

                            {/* Dates */}
                            <td className="px-4 py-3.5 text-center">
                              <p className="text-body-sm font-medium text-neutral-900">
                                {rangeText(plan.proposedStartDate, plan.proposedEndDate)}
                              </p>
                              <p className="text-body-sm text-neutral-500 mt-0.5">{plan.durationDays} {t('cab.auditSchedule.days', 'days')}</p>
                            </td>

                            {/* Lead auditor */}
                            <td className="px-4 py-3.5 text-center">
                              <p className="text-body-sm font-medium text-neutral-800">{plan.leadAuditor}</p>
                            </td>

                            {/* Status badge */}
                            <td className="px-4 py-3.5 text-center">
                              <span
                                className={cn(
                                  'inline-flex items-center justify-center rounded-sm px-3 py-1 text-caption font-medium whitespace-nowrap',
                                  plan.status === 'Planned' && 'bg-primary-50 text-primary',
                                  plan.status === 'Completed' && 'bg-success-50 text-success-600',
                                  (plan.status === 'Draft' || plan.status === 'In progress') && 'bg-orange-50 text-orange-600'
                                )}
                              >
                                {enumLabel(t, plan.status)}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3.5 text-end relative">
                              <ActionMenu
                                ariaLabel={t('cab.auditSchedule.actions.menu', { defaultValue: 'Actions for {{number}}', number: plan.planNumber })}
                                items={rowActions(plan)}
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="space-y-3 px-4 md:hidden">
                  {!isLoading &&
                    auditPlans.map((plan) => (
                      <div
                        key={plan.id}
                        onClick={() => navigate(`/cab/audit-planning/build/${plan.planNumber}`)}
                        className="w-full rounded-md border border-neutral-100 bg-white p-4 text-start space-y-2 cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-body font-bold text-primary">{plan.planNumber}</span>
                          <span className="ms-auto" onClick={(event) => event.stopPropagation()}>
                            <ActionMenu
                              ariaLabel={t('cab.auditSchedule.actions.menu', { defaultValue: 'Actions for {{number}}', number: plan.planNumber })}
                              items={rowActions(plan)}
                            />
                          </span>
                          <span
                            className={cn(
                              'inline-flex items-center justify-center rounded-sm px-3 py-1 text-caption font-medium whitespace-nowrap',
                              plan.status === 'Planned' && 'bg-primary-50 text-primary',
                              plan.status === 'Completed' && 'bg-success-50 text-success-600',
                              (plan.status === 'Draft' || plan.status === 'In progress') && 'bg-orange-50 text-orange-600'
                            )}
                          >
                            {enumLabel(t, plan.status)}
                          </span>
                        </div>
                        <p className="text-body font-medium text-neutral-900">{plan.clientName}</p>
                        <p className="text-body-sm text-neutral-600">{plan.standardName}</p>
                        <div className="flex items-center justify-between text-body-sm text-neutral-600 pt-1 border-t border-neutral-100">
                          <span>{rangeText(plan.proposedStartDate, plan.proposedEndDate)}</span>
                          <span className="font-medium text-neutral-800">{plan.leadAuditor}</span>
                        </div>
                      </div>
                    ))}
                  {isLoading && <p className="py-6 text-center text-neutral-600">{t('cab.auditSchedule.loading', 'Loading audits...')}</p>}
                  {!isLoading && !auditPlans.length && (
                    <p className="py-6 text-center text-neutral-600">{t('cab.auditSchedule.noAudits', 'No audits found')}</p>
                  )}
                </div>

                {/* Table Pagination */}
                <TablePagination
                  page={page}
                  totalPages={1}
                  onPageChange={(nextPage) => setPage(nextPage)}
                  className="mt-5 px-4"
                />
              </>
            ) : (
              /* Calendar View Grid */
              <div className="px-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-body font-bold text-neutral-900">{monthLabel(calendarMonth)}</h3>
                  <p className="text-body-sm text-neutral-600">{t('cab.auditSchedule.timezone', 'Timezone: Asia/Riyadh (AST)')}</p>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-caption font-semibold text-neutral-500 mb-2">
                  <div>{t('cab.auditSchedule.daysOfWeek.sun', 'Sun')}</div>
                  <div>{t('cab.auditSchedule.daysOfWeek.mon', 'Mon')}</div>
                  <div>{t('cab.auditSchedule.daysOfWeek.tue', 'Tue')}</div>
                  <div>{t('cab.auditSchedule.daysOfWeek.wed', 'Wed')}</div>
                  <div>{t('cab.auditSchedule.daysOfWeek.thu', 'Thu')}</div>
                  <div>{t('cab.auditSchedule.daysOfWeek.fri', 'Fri')}</div>
                  <div>{t('cab.auditSchedule.daysOfWeek.sat', 'Sat')}</div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: leadingBlankDays }, (_, i) => (
                    <div key={`blank-${i}`} aria-hidden="true" />
                  ))}
                  {calendarDays.map((d) => (
                    <div
                      key={d.dayNumber}
                      className={cn(
                        'min-h-[90px] rounded-md border p-2 text-start transition-all',
                        d.audits.length > 0
                          ? 'border-primary-100 bg-neutral-25'
                          : 'border-neutral-100 bg-white hover:border-neutral-400'
                      )}
                    >
                      <span className="text-caption font-semibold text-neutral-700 block mb-1">
                        {d.dayNumber}
                      </span>
                      {d.audits.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => navigate(`/cab/audit-planning/build/${a.planNumber}`)}
                          className="w-full text-start rounded-sm bg-primary px-1.5 py-1 text-caption font-bold text-white truncate mb-1 shadow-xs hover:bg-primary/90"
                        >
                          {a.planNumber} • {a.clientName.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CabTourStep>
        </section>
      </main>

      {/* Create Plan Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-overlay/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
              <h3 className="text-body font-bold text-neutral-900">
                {t('cab.auditSchedule.createNewPlan', 'Create new audit plan')}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-500 hover:text-neutral-700 text-body-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="text-body-sm font-medium text-neutral-800 block mb-1">
                  {t('cab.auditSchedule.client', 'Client')} *
                </label>
                <select
                  value={newClientCode}
                  onChange={(e) => setNewClientCode(e.target.value)}
                  className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  {clientsList.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} · {c.name}{c.country ? ` (${displayCountry(c.country)})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-body-sm font-medium text-neutral-800 block mb-1">
                    {t('cab.auditSchedule.auditStage', 'Audit stage')} *
                  </label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value as typeof newStage)}
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Stage 1">{t('ui.stage1')}</option>
                    <option value="Stage 2">{t('ui.stage2')}</option>
                    <option value="Surveillance 1">{t('ui.surveillance1')}</option>
                  </select>
                </div>

                <div>
                  <label className="text-body-sm font-medium text-neutral-800 block mb-1">
                    {t('cab.auditSchedule.leadAuditor', 'Lead auditor')} *
                  </label>
                  <select
                    value={newLeadAuditor}
                    onChange={(e) => setNewLeadAuditor(e.target.value)}
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {auditors.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}{p.role === 'Lead Auditor' ? ' (Lead)' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-body-sm font-medium text-neutral-800 block mb-1">
                  {t('cab.auditSchedule.standard', 'Standard')} *
                </label>
                <input
                  type="text"
                  value={newStandard}
                  onChange={(e) => setNewStandard(e.target.value)}
                  className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-body-sm font-medium text-neutral-800 block mb-1">
                    {t('cab.auditSchedule.startDate', 'Start date')} *
                  </label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="text-body-sm font-medium text-neutral-800 block mb-1">
                    {t('cab.auditSchedule.endDate', 'End date')} *
                  </label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="h-11 rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
                >
                  {t('common.proceed', 'Continue to build plan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AuditPlanTransitionDialog
        plan={transition?.plan ?? null}
        action={transition?.action ?? null}
        onClose={() => setTransition(null)}
        onDone={(updated) => setAuditPlans((plans) => plans.map((p) => (p.id === updated.id ? updated : p)))}
      />
    </CabLayout>
  )
}
