import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ReturnToBanner } from '@/components/ui/ReturnToBanner'
import { enumLabel } from '@/lib/enumLabel'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useManageCertificationCycleTourSteps } from '@/config/manageCertificationCycleTourSteps'
import { CertificationLifecycleBadge } from '@/components/dashboard/cab/CertificationLifecycleBadge'
import { SectionCard } from '@/components/dashboard/cab/ReviewPrimitives'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import {
  AddCircleIcon,
  AppIcon,
  ArrowRightIcon,
  BuildingsIcon,
  CalendarIcon,
  ChevronDownIcon,
  FileTextIcon,
  HistoryIcon,
  LocationAddIcon,
  MoreIcon,
  PhoneIcon,
  SortIcon,
  UserIcon,
  type AppIconComponent,
} from '@/components/icons'
import {
  getCertificationCycleDetail,
  scheduleNextCycleEvent,
  type CertificationCycleDetail,
  type CertificationCycleEvent,
  type CertificationCycleRecordGroup,
} from '@/lib/api/cabCertificationApi'
import { ROUTES, cabApplicationSubmissionPath, cabPrepareCertificatePath } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { CycleTabPanel } from '@/components/dashboard/cab/cycles/CycleTabPanel'
import {
  CycleCertificateDialog,
  CycleDecisionDialog,
  CycleRequestDialog,
  type CertificateCycleAction,
} from '@/components/dashboard/cab/cycles/CycleDialogs'
import type { CycleRequest, CycleRequestStatus, CycleRequestType } from '@/lib/api/cabCertificationApi'
import { printCycleSummary } from '@/lib/pdf/cycleSummaryPdf'
import { toast } from '@/lib/toast'
import { workflowErrorMessage } from '@/lib/workflowErrors'
import { displayCountry } from '@/lib/localizeCountry'
import { notSet, rangeText } from '@/lib/emptyValue'
import { pageTabClassName, pageTabListClassName } from '@/components/ui/pageTabs'

/** Same breadcrumb chevron used across every CAB page (e.g. CabCertificationCyclesPage). */
function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-500 rtl-flip" aria-hidden>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const dropdownMenuContentClassName = 'z-50 min-w-[200px] rounded-md border border-neutral-100 bg-white p-1 shadow-lg'
const dropdownMenuItemClassName =
  'flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2.5 text-body-sm font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50'

const TABS = [
  'cycle',
  'certificateDetails',
  'auditHistory',
  'sites',
  'scope',
  'transfer',
  'suspension',
  'documents',
  'relatedApplications',
] as const
type TabId = (typeof TABS)[number]

/** Certificate actions allowed for each certificate status. */
const CERTIFICATE_ACTIONS: Partial<Record<string, CertificateCycleAction[]>> = {
  ISSUED: ['reissue', 'extend', 'suspend', 'withdraw'],
  SUSPENDED: ['reinstate', 'extend', 'withdraw'],
}

const RECORD_GROUP_ICONS: Record<string, AppIconComponent> = {
  auditPlans: CalendarIcon,
  auditReports: FileTextIcon,
  decisions: FileTextIcon,
  certificates: FileTextIcon,
  scopeChanges: SortIcon,
  siteChanges: LocationAddIcon,
  transfers: CalendarIcon,
  suspensions: HistoryIcon,
}

/** Label above a value — mirrors the Field helper on the certification register. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-caption font-medium text-neutral-600">{label}</p>
      <div className="mt-1 text-body-sm font-semibold text-neutral-900">{children || notSet()}</div>
    </div>
  )
}

function SummaryDivider() {
  return <div className="hidden h-16 w-px shrink-0 self-center bg-neutral-300 lg:block" aria-hidden />
}

function EventDot({ status }: { status: CertificationCycleEvent['status'] }) {
  return (
    <span
      className={cn(
        'relative z-10 mt-1 flex size-3 shrink-0 rounded-full border-2',
        status === 'next' ? 'border-primary bg-primary' : 'border-neutral-400 bg-white',
      )}
      aria-hidden
    />
  )
}

/**
 * Collapsible "More details" row. Nothing in the codebase provides an
 * accordion (SectionCard is always-open, the steppers are tab bars), so this
 * is a page-local disclosure built on a plain button + aria-expanded rather
 * than pulling in another dependency.
 */
function RecordGroupRow({
  group,
  title,
  description,
  badge,
  emptyLabel,
  columns,
}: {
  group: CertificationCycleRecordGroup
  title: string
  description: string
  badge: { label: string; highlighted: boolean }
  emptyLabel: string
  columns: { title: string; date: string; status: string }
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const Icon = RECORD_GROUP_ICONS[group.id] ?? FileTextIcon
  const contentId = `record-group-${group.id}`

  return (
    <div className="border-b border-neutral-50 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center gap-4 px-2 py-4 text-start transition-colors hover:bg-neutral-50"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-subtle text-primary">
          <AppIcon icon={Icon} size={20} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-body-sm font-semibold text-neutral-900">{title}</span>
          <span className="mt-0.5 block text-body-sm text-neutral-600">{description}</span>
        </span>

        <span
          className={cn(
            'hidden shrink-0 items-center justify-center rounded-sm px-3 py-1 text-caption font-medium whitespace-nowrap sm:inline-flex',
            badge.highlighted ? 'bg-warning-50 text-warning-700' : 'bg-neutral-50 text-neutral-700',
          )}
        >
          {badge.label}
        </span>

        <AppIcon
          icon={ChevronDownIcon}
          size={18}
          className={cn('shrink-0 text-neutral-500 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div id={contentId} className="px-2 pb-4">
          {group.records.length === 0 ? (
            <p className="rounded-md bg-neutral-50 px-4 py-5 text-center text-body-sm text-neutral-500">{emptyLabel}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-start">
                <thead>
                  <tr className="border-b border-neutral-100 text-caption text-neutral-600">
                    <th className="py-2 pe-2 text-start font-medium">{columns.title}</th>
                    <th className="py-2 pe-2 text-start font-medium">{columns.date}</th>
                    <th className="py-2 ps-2 text-start font-medium">{columns.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {group.records.map((record) => (
                    <tr key={record.id} className="text-body-sm text-neutral-800">
                      <td className="py-2.5 pe-2">{record.title}</td>
                      <td className="py-2.5 pe-2 whitespace-nowrap">{record.date}</td>
                      <td className="py-2.5 ps-2">{enumLabel(t, record.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function CabManageCertificationCyclePage() {
  const { t, i18n } = useTranslation()
  const tourSteps = useManageCertificationCycleTourSteps()
  const { cycleId = '' } = useParams<{ cycleId: string }>()
  const navigate = useNavigate()

  const [tab, setTab] = useState<TabId>('cycle')
  const [retryToken, setRetryToken] = useState(0)
  /** Result is tagged with the id it belongs to, so a stale result from a
   *  previous cycleId reads as "still loading" instead of flashing wrong data. */
  const [result, setResult] = useState<{ id: string; cycle: CertificationCycleDetail | null; failed: boolean } | null>(
    null,
  )

  useEffect(() => {
    let cancelled = false

    getCertificationCycleDetail(cycleId)
      .then((data) => {
        if (!cancelled) setResult({ id: cycleId, cycle: data, failed: false })
      })
      .catch((error) => {
        console.error('Failed to load certification cycle:', error)
        if (!cancelled) setResult({ id: cycleId, cycle: null, failed: true })
      })

    return () => {
      cancelled = true
    }
  }, [cycleId, retryToken])

  const loading = result?.id !== cycleId
  const failed = result?.failed ?? false
  const cycle = result?.cycle ?? null
  const retry = () => {
    setResult(null)
    setRetryToken((token) => token + 1)
  }

  const [requestType, setRequestType] = useState<CycleRequestType | null>(null)
  const [decision, setDecision] = useState<{ request: CycleRequest; status: Exclude<CycleRequestStatus, 'open'> } | null>(null)
  const [certificateAction, setCertificateAction] = useState<CertificateCycleAction | null>(null)
  const [scheduling, setScheduling] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const planLink = (planNumber: string) => `/cab/audit-planning/build/${planNumber}`

  /** Drafts the audit plan of the next event, then opens it on the build-plan page. */
  const scheduleNextEvent = async () => {
    if (!cycle || scheduling) return
    const scheduledPlan = cycle.nextEvent?.auditPlanNumber
    if (scheduledPlan) {
      navigate(planLink(scheduledPlan))
      return
    }
    setScheduling(true)
    setScheduleError(null)
    try {
      const scheduled = await scheduleNextCycleEvent(cycle.id)
      setResult({ id: cycleId, cycle: scheduled.cycle, failed: false })
      navigate(scheduled.link)
    } catch (error) {
      console.error('Failed to schedule the next cycle event:', error)
      setScheduleError(
        error instanceof Error && error.message
          ? error.message
          : t('cab.manageCycle.scheduleError', 'Could not create the draft audit plan. Please try again.'),
      )
    } finally {
      setScheduling(false)
    }
  }

  const title = t('cab.manageCycle.title', 'Manage certification cycle')

  const tabLabels: Record<TabId, string> = {
    cycle: t('cab.manageCycle.tabs.cycle', 'Certification cycle'),
    certificateDetails: t('cab.manageCycle.tabs.certificateDetails', 'Certificate details'),
    auditHistory: t('cab.manageCycle.tabs.auditHistory', 'Audit history'),
    sites: t('cab.manageCycle.tabs.sites', 'Sites'),
    scope: t('cab.manageCycle.tabs.scope', 'Scope'),
    transfer: t('cab.manageCycle.tabs.transfer', 'Transfer'),
    suspension: t('cab.manageCycle.tabs.suspension', 'Suspension'),
    documents: t('cab.manageCycle.tabs.documents', 'Documents'),
    relatedApplications: t('cab.manageCycle.tabs.relatedApplications', 'Related applications'),
  }

  const recordGroupLabels: Record<string, { title: string; description: string }> = {
    scopeChanges: {
      title: t('cab.manageCycle.records.scopeChanges.title', 'Scope change requests'),
      description: t('cab.manageCycle.records.scopeChanges.description', 'View and manage scope change requests for this certificate.'),
    },
    siteChanges: {
      title: t('cab.manageCycle.records.siteChanges.title', 'Site changes'),
      description: t('cab.manageCycle.records.siteChanges.description', 'View and manage additions, removals or changes to certified sites.'),
    },
    transfers: {
      title: t('cab.manageCycle.records.transfers.title', 'Transfer records'),
      description: t('cab.manageCycle.records.transfers.description', 'View transfer history related to this certificate.'),
    },
    suspensions: {
      title: t('cab.manageCycle.records.suspensions.title', 'Suspension history'),
      description: t('cab.manageCycle.records.suspensions.description', 'View suspension and reinstatement records for this certificate.'),
    },
    auditPlans: {
      title: t('cab.manageCycle.records.auditPlans.title', 'Audit plans'),
      description: t('cab.manageCycle.records.auditPlans.description', 'Audit plans of this certification cycle.'),
    },
    auditReports: {
      title: t('cab.manageCycle.records.auditReports.title', 'Audit reports'),
      description: t('cab.manageCycle.records.auditReports.description', 'Audit reports prepared for the audits of this cycle.'),
    },
    decisions: {
      title: t('cab.manageCycle.records.decisions.title', 'Certification decisions'),
      description: t('cab.manageCycle.records.decisions.description', 'Certification decisions taken in this cycle.'),
    },
    certificates: {
      title: t('cab.manageCycle.records.certificates.title', 'Certificates'),
      description: t('cab.manageCycle.records.certificates.description', 'The certificate issued for this cycle.'),
    },
  }

  const breadcrumb = (
    <nav className="flex min-w-0 flex-wrap items-center gap-2 text-body-sm" aria-label={t('common.breadcrumb')}>
      <Link to={ROUTES.cabCertificationCycles} className="font-light text-neutral-500 hover:text-primary">
        {t('cab.certification.title', 'Certification')}
      </Link>
      <Chevron />
      <span className="font-medium text-neutral-800">{title}</span>
    </nav>
  )

  if (loading) {
    return (
      <CabLayout>
        <CabHeader title={title} notificationCount={3} />
        <main className="flex flex-1 flex-col gap-5 overflow-auto page-main" aria-busy>
          {breadcrumb}
          <div className="h-24 animate-pulse rounded-lg border border-neutral-100 bg-white" />
          <div className="h-32 animate-pulse rounded-lg border border-neutral-100 bg-white" />
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="h-56 animate-pulse rounded-lg border border-neutral-100 bg-white" />
            <div className="h-56 animate-pulse rounded-lg border border-neutral-100 bg-white" />
            <div className="h-56 animate-pulse rounded-lg border border-neutral-100 bg-white" />
          </div>
        </main>
      </CabLayout>
    )
  }

  if (failed || !cycle) {
    return (
      <CabLayout>
        <CabHeader title={title} notificationCount={3} />
        <main className="flex flex-1 flex-col gap-5 overflow-auto page-main">
          {breadcrumb}
          <ErrorState
            title={
              failed
                ? t('cab.manageCycle.loadErrorTitle', 'Could not load this certification cycle')
                : t('cab.manageCycle.notFoundTitle', 'Certification cycle not found')
            }
            description={
              failed
                ? t('cab.manageCycle.loadErrorDescription', 'Something went wrong while loading the cycle. Please try again.')
                : t('cab.manageCycle.notFoundDescription', 'This cycle may have been removed or the link is no longer valid.')
            }
            retryLabel={failed ? t('errors.retry') : t('cab.manageCycle.backToCycles', 'Back to certification cycles')}
            onRetry={failed ? retry : () => navigate(ROUTES.cabCertificationCycles)}
          />
        </main>
      </CabLayout>
    )
  }

  const { certificate, nextEvent } = cycle
  const certificateActions = cycle.certificateId ? CERTIFICATE_ACTIONS[cycle.certificateStatus ?? ''] ?? [] : []
  const certificateActionLabels: Record<CertificateCycleAction, string> = {
    suspend: t('cab.manageCycle.actions.suspendCertificate', 'Suspend certificate'),
    reinstate: t('cab.manageCycle.actions.reinstateCertificate', 'Reinstate certificate'),
    withdraw: t('cab.manageCycle.actions.withdrawCertificate', 'Withdraw certificate'),
    extend: t('cab.manageCycle.actions.extendCertificate', 'Extend validity'),
    reissue: t('cab.manageCycle.actions.reissueCertificate', 'Reissue certificate'),
  }
  const closedCycle = cycle.certificateStatus === 'WITHDRAWN' || cycle.certificateStatus === 'SUPERSEDED'
  const openCertificate = () => {
    if (cycle.certificateId) navigate(cabPrepareCertificatePath(cycle.certificateId))
    else navigate(ROUTES.cabCertificates)
  }
  const printSummary = () =>
    printCycleSummary(cycle, t, i18n.language).catch((error) => toast.error(workflowErrorMessage(error, t)))

  return (
    <CabLayout tourId="cab-manage-certification-cycle" tourSteps={tourSteps}>
      <CabHeader title={title} notificationCount={3} />
      <main className="flex flex-1 flex-col gap-5 overflow-auto page-main">
        <ReturnToBanner />
        {breadcrumb}

        {/* Page title + lifecycle actions */}
        <CabTourStep steps={tourSteps} stepId="manage-cycle-header">
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
            <div className="min-w-0">
              <h1 className="text-page-title text-text-primary">{title}</h1>
              <p className="mt-1 text-body-sm text-neutral-600">
                {t(
                  'cab.manageCycle.subtitle',
                  'Track and manage the full certification lifecycle, including surveillance, scope changes, site updates and transfers.',
                )}
              </p>
            </div>

            <div className="flex w-full shrink-0 items-center gap-3 lg:w-auto">
              <Button
                variant="primary"
                size="sm"
                icon={<AppIcon icon={AddCircleIcon} size={18} />}
                className="h-11 flex-1 lg:flex-none"
                onClick={() =>
                  navigate(cycle.organizationId ? cabApplicationSubmissionPath(cycle.organizationId) : ROUTES.cabApplicationSubmission)
                }
              >
                {t('cab.manageCycle.createApplication', 'Create application')}
              </Button>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <Button variant="outline" size="sm" className="h-11 flex-1 lg:flex-none">
                    {t('cab.manageCycle.lifecycleActions', 'Lifecycle actions')}
                    <AppIcon icon={ChevronDownIcon} size={16} />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content align="end" sideOffset={4} className={dropdownMenuContentClassName}>
                    <DropdownMenu.Item
                      className={dropdownMenuItemClassName}
                      disabled={!nextEvent || scheduling}
                      onSelect={() => void scheduleNextEvent()}
                    >
                      {t('cab.manageCycle.actions.scheduleSurveillance', 'Schedule surveillance')}
                    </DropdownMenu.Item>
                    {(
                      [
                        ['scopeChange', t('cab.manageCycle.actions.requestScopeChange', 'Request scope change')],
                        ['siteChange', t('cab.manageCycle.actions.requestSiteChange', 'Request site change')],
                        ['transfer', t('cab.manageCycle.actions.transferCertificate', 'Transfer certificate')],
                      ] as const
                    ).map(([type, label]) => (
                      <DropdownMenu.Item key={type} className={dropdownMenuItemClassName} disabled={closedCycle} onSelect={() => setRequestType(type)}>
                        {label}
                      </DropdownMenu.Item>
                    ))}
                    {certificateActions.length > 0 && <DropdownMenu.Separator className="my-1 h-px bg-neutral-100" />}
                    {certificateActions.map((action) => (
                      <DropdownMenu.Item key={action} className={dropdownMenuItemClassName} onSelect={() => setCertificateAction(action)}>
                        {certificateActionLabels[action]}
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    aria-label={t('common.moreActions', 'More actions')}
                    className="flex size-11 shrink-0 items-center justify-center rounded-md border border-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-50"
                  >
                    <AppIcon icon={MoreIcon} size={18} />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content align="end" sideOffset={4} className={dropdownMenuContentClassName}>
                    <DropdownMenu.Item className={dropdownMenuItemClassName} onSelect={openCertificate}>
                      {t('cab.manageCycle.actions.downloadCertificate', 'Download certificate')}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item className={dropdownMenuItemClassName} onSelect={() => void printSummary()}>
                      {t('cab.manageCycle.actions.printSummary', 'Print cycle summary')}
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>
        </CabTourStep>

        {/* Client + certificate summary */}
        <CabTourStep steps={tourSteps} stepId="manage-cycle-client-card">
          <section className="flex flex-col gap-5 rounded-lg border border-neutral-100 bg-white p-5 lg:flex-row lg:items-stretch lg:gap-6">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                <AppIcon icon={BuildingsIcon} size={26} />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-body-lg font-bold text-neutral-900">{cycle.clientName}</h2>
                <p className="mt-0.5 text-body-sm text-neutral-600">
                  {cycle.clientId} <span className="mx-1 text-neutral-400">|</span> {displayCountry(cycle.country)}
                </p>
              </div>
            </div>

            <SummaryDivider />

            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span className="mt-0.5 shrink-0 text-neutral-500">
                <AppIcon icon={UserIcon} size={22} />
              </span>
              <div className="min-w-0">
                <p className="text-caption font-medium text-neutral-600">
                  {t('cab.certification.fields.primaryContact', 'Primary contact')}
                </p>
                <p className="mt-0.5 truncate text-body font-semibold text-neutral-900">{cycle.primaryContactName}</p>
                <a
                  href={`mailto:${cycle.primaryContactEmail}`}
                  className="mt-0.5 block truncate text-body-sm text-neutral-600 hover:text-primary"
                >
                  {cycle.primaryContactEmail}
                </a>
                <a
                  href={`tel:${cycle.primaryContactPhone.replace(/\s/g, '')}`}
                  dir="ltr"
                  className="mt-0.5 flex items-center gap-1.5 text-body-sm text-neutral-600 hover:text-primary"
                >
                  <AppIcon icon={PhoneIcon} size={14} />
                  {cycle.primaryContactPhone}
                </a>
              </div>
            </div>

            <SummaryDivider />

            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span className="mt-0.5 shrink-0 text-neutral-500">
                <AppIcon icon={FileTextIcon} size={22} />
              </span>
              <div className="min-w-0">
                <p className="text-caption font-medium text-neutral-600">
                  {t('cab.manageCycle.activeCertificate', 'Active certificate')}
                </p>
                <p className="mt-0.5 text-body font-bold text-primary">{certificate.certificateNumber}</p>
                <p className="mt-0.5 text-body-sm text-neutral-700">{certificate.standard}</p>
                <p className="text-body-sm text-neutral-600">{certificate.standardLabel}</p>
              </div>
            </div>

            <SummaryDivider />

            <div className="shrink-0">
              <CertificationLifecycleBadge status={certificate.status} label={enumLabel(t, certificate.statusLabel)} />
              <p className="mt-2 text-body-sm text-neutral-700">
                {t('cab.manageCycle.validFrom', 'Valid from {{date}}', { date: certificate.validFrom })}
              </p>
              <p className="text-body-sm text-neutral-700">
                {t('cab.manageCycle.validUntil', 'Valid until {{date}}', { date: certificate.validUntil })}
              </p>
              <Button variant="tertiary" size="sm" className="mt-1 h-auto p-0 text-body-sm" onClick={() => setTab('certificateDetails')}>
                {t('cab.manageCycle.viewCertificate', 'View certificate')}
                <AppIcon icon={ArrowRightIcon} size={14} className="rtl-flip" />
              </Button>
            </div>
          </section>
        </CabTourStep>

        {/* Section tabs */}
        <CabTourStep steps={tourSteps} stepId="manage-cycle-tabs">
          <div
            role="tablist"
            aria-label={t('cab.manageCycle.tabsLabel', 'Certification cycle sections')}
            className={pageTabListClassName}
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
        </CabTourStep>

        {tab !== 'cycle' ? (
          <CycleTabPanel
            tab={tab}
            cycle={cycle}
            certificateActions={certificateActions}
            onCertificateAction={setCertificateAction}
            onNewRequest={setRequestType}
            onDecide={(request, status) => setDecision({ request, status })}
          />
        ) : (
          <>
            <CabTourStep steps={tourSteps} stepId="manage-cycle-current-status">
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                {/* Current cycle */}
                <SectionCard title={t('cab.manageCycle.currentCycleTitle', 'Current certification cycle')}>
                  <div className="space-y-4">
                    <Field label={t('cab.manageCycle.fields.cycle', 'Cycle')}>{cycle.cycleRangeLabel}</Field>
                    <Field label={t('cab.certification.fields.cycleStatus', 'Cycle status')}>
                      <span className="inline-flex items-center gap-2 rounded-sm bg-success-50 px-3 py-1 text-caption font-medium text-success-600 whitespace-nowrap">
                        <span className="size-1.5 rounded-full bg-current" aria-hidden />
                        {cycle.cycleStatusLabel}
                      </span>
                    </Field>
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <Field label={t('cab.manageCycle.fields.initialCertification', 'Initial certification')}>
                        {cycle.initialCertificationDate}
                      </Field>
                      <Field label={t('cab.manageCycle.fields.certificationExpiry', 'Certification expiry')}>
                        {cycle.certificationExpiryDate}
                      </Field>
                    </div>
                  </div>
                </SectionCard>

                {/* Next event — highlighted, matches the CalloutCard blue tone */}
                <section className="rounded-lg border border-primary-100 bg-primary-25 p-5">
                  {nextEvent ? (
                    <>
                      <p className="text-body-sm font-semibold text-primary">
                        {t('cab.manageCycle.nextEvent', 'Next event')}
                      </p>
                      <div className="mt-2 flex items-center gap-2.5">
                        <span className="text-primary">
                          <AppIcon icon={CalendarIcon} size={24} />
                        </span>
                        <h3 className="text-body-lg font-bold text-primary">{enumLabel(t, nextEvent.typeLabel)}</h3>
                      </div>

                      <div className="mt-4">
                        <p className="text-caption font-medium text-neutral-600">
                          {t('cab.manageCycle.fields.targetWindow', 'Target window')}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-3">
                          <p className="text-body-sm font-semibold text-neutral-900">
                            {rangeText(nextEvent.windowStart, nextEvent.windowEnd)}
                          </p>
                          <span
                            className={cn(
                              'inline-flex items-center justify-center rounded-sm px-3 py-1 text-caption font-medium whitespace-nowrap',
                              nextEvent.dueInDays >= 0 ? 'bg-white text-neutral-700' : 'bg-error-50 text-error-600',
                            )}
                          >
                            {nextEvent.dueInDays >= 0
                              ? t('cab.certification.dueIn', 'Due in {{count}} days', { count: nextEvent.dueInDays })
                              : t('cab.certification.overdueBy', 'Overdue by {{count}} days', {
                                  count: Math.abs(nextEvent.dueInDays),
                                })}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label={t('cab.manageCycle.fields.responsibleCoordinator', 'Responsible coordinator')}>
                          <span className="inline-flex items-center gap-1.5">
                            <AppIcon icon={UserIcon} size={16} className="text-neutral-500" />
                            {nextEvent.responsibleCoordinator}
                          </span>
                        </Field>
                        <Field label={t('cab.certification.table.status', 'Status')}>
                          <span className="inline-flex items-center gap-2 text-body-sm font-normal text-neutral-700">
                            <span
                              className={cn(
                                'size-1.5 rounded-full',
                                nextEvent.scheduled ? 'bg-success-600' : 'bg-neutral-500',
                              )}
                              aria-hidden
                            />
                            {nextEvent.schedulingStatusLabel}
                          </span>
                        </Field>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <Button
                          variant="primary"
                          size="sm"
                          className="h-11"
                          disabled={nextEvent.scheduled || scheduling}
                          onClick={() => void scheduleNextEvent()}
                        >
                          {t('cab.manageCycle.saveDraftEvent', 'Save draft event')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-11 bg-white"
                          disabled={!nextEvent.auditPlanNumber}
                          onClick={() => nextEvent.auditPlanNumber && navigate(planLink(nextEvent.auditPlanNumber))}
                        >
                          {t('cab.manageCycle.viewEventDetails', 'View event details')}
                        </Button>
                      </div>
                      {scheduleError && (
                        <p role="alert" className="mt-3 text-body-sm text-error-600">
                          {scheduleError}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="py-8 text-center text-body-sm text-neutral-600">
                      {t('cab.manageCycle.noNextEvent', 'No upcoming event is planned for this cycle.')}
                    </p>
                  )}
                </section>

                {/* Upcoming cycle events */}
                <SectionCard
                  title={t('cab.manageCycle.upcomingEventsTitle', 'Upcoming cycle events')}
                  action={
                    <Button variant="tertiary" size="sm" className="h-auto p-0 text-body-sm" onClick={() => setTab('auditHistory')}>
                      {t('common.viewAll', 'View all')}
                    </Button>
                  }
                >
                  {cycle.upcomingEvents.length === 0 ? (
                    <p className="py-6 text-center text-body-sm text-neutral-500">
                      {t('cab.manageCycle.noUpcomingEvents', 'No upcoming events.')}
                    </p>
                  ) : (
                    <ol className="relative space-y-5">
                      {cycle.upcomingEvents.map((event, index) => (
                        <li key={event.id} className="relative flex gap-3">
                          {index < cycle.upcomingEvents.length - 1 && (
                            <span className="absolute top-4 start-[5px] h-full w-px bg-neutral-300" aria-hidden />
                          )}
                          <EventDot status={event.status} />
                          <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-body-sm font-semibold text-neutral-900">{enumLabel(t, event.typeLabel)}</p>
                              <p className="mt-0.5 text-body-sm text-neutral-600">
                                {rangeText(event.windowStart, event.windowEnd)}
                              </p>
                            </div>
                            <span
                              className={cn(
                                'inline-flex items-center justify-center shrink-0 rounded-sm px-3 py-1 text-caption font-medium whitespace-nowrap',
                                event.status === 'next' ? 'bg-primary-50 text-primary' : 'bg-neutral-50 text-neutral-700',
                              )}
                            >
                              {enumLabel(t, event.statusLabel)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </SectionCard>
              </div>
            </CabTourStep>

            {/* More details */}
            <CabTourStep steps={tourSteps} stepId="manage-cycle-accordions">
              <SectionCard title={t('cab.manageCycle.moreDetails', 'More details')}>
                <div className="-mt-2">
                  {cycle.recordGroups.map((group) => {
                    const labels = recordGroupLabels[group.id]
                    const highlighted = (group.highlightCount ?? 0) > 0

                    return (
                      <RecordGroupRow
                        key={group.id}
                        group={group}
                        title={`${labels?.title ?? group.id} (${group.count})`}
                        description={labels?.description ?? ''}
                        badge={{
                          label: highlighted
                            ? t('cab.manageCycle.openCount', '{{count}} Open', { count: group.highlightCount })
                            : group.count > 0
                              ? t('cab.manageCycle.recordCount', '{{count}} Records', { count: group.count })
                              : t('cab.manageCycle.noRecords', 'No records'),
                          highlighted,
                        }}
                        emptyLabel={t('cab.manageCycle.noRecords', 'No records')}
                        columns={{
                          title: t('cab.manageCycle.table.record', 'Record'),
                          date: t('cab.certification.table.date', 'Date'),
                          status: t('cab.certification.table.status', 'Status'),
                        }}
                      />
                    )
                  })}
                </div>
              </SectionCard>
            </CabTourStep>
          </>
        )}
      </main>

      <CycleRequestDialog
        cycleId={cycle.id}
        type={requestType}
        currentScope={cycle.certificateScope ?? ''}
        onClose={() => setRequestType(null)}
        onSaved={retry}
      />
      <CycleDecisionDialog cycleId={cycle.id} target={decision} onClose={() => setDecision(null)} onSaved={retry} />
      {cycle.certificateId && (
        <CycleCertificateDialog
          certificateId={cycle.certificateId}
          certificateNumber={certificate.certificateNumber}
          currentScope={cycle.certificateScope ?? ''}
          action={certificateAction}
          onClose={() => setCertificateAction(null)}
          onDone={retry}
        />
      )}
    </CabLayout>
  )
}