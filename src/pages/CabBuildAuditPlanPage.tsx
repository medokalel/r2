import { useState, useEffect, useEffectEvent } from 'react'
import { toast } from '@/lib/toast'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { enumLabel } from '@/lib/enumLabel'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useBuildAuditPlanTourSteps } from '@/config/buildAuditPlanTourSteps'
import {
  fetchAuditPlanById,
  fetchPlanningAuditors,
  saveAuditPlan,
  checkAuditPlanReadiness,
  sendAuditPlanToClient,
  rescheduleAuditPlan,
  type AuditPlan,
  type AgendaActivity,
  type EligibilityCheckResult,
  type PlanningAuditor,
} from '@/lib/api/cabAuditPlanningApi'
import { CreateAuditPlanForm } from '@/components/dashboard/cab/auditPlanning/CreateAuditPlanForm'
import { AuditPlanLifecycleBar } from '@/components/dashboard/cab/auditPlanning/AuditPlanLifecycleBar'
import { PlanSectionDialogs, type PlanSection } from '@/components/dashboard/cab/auditPlanning/PlanSectionDialogs'
import { ImportWizard } from '@/components/imports/ImportWizard'
import { ReturnToBanner } from '@/components/ui/ReturnToBanner'
import { useDeepLinkField } from '@/hooks/useDeepLinkField'
import { IMPORT_BATCH_PARAM, IMPORT_DEF_PARAM } from '@/lib/imports/entities'
import {
  AppIcon,
  CalendarIcon,
  BuildingsIcon,
  FileTextIcon,
  HistoryIcon,
  MapPinIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
} from '@/components/icons'
import { cn } from '@/lib/utils'
import { displayCountry } from '@/lib/localizeCountry'
import { notSet } from '@/lib/emptyValue'
import { buttonVariants } from '@/components/ui/buttonVariants'
import { AgreementGateNotice } from '@/components/agreements/AgreementGateNotice'
import { TravelCostPanel } from '@/components/travel/TravelCostPanel'
import { agreementErrorMessage } from '@/components/agreements/agreementHelpers'
import { PlanTeamPanel } from '@/components/teamSelection/PlanTeamPanel'

/** Statuses a "Save draft" may return to Draft (in-progress or later plans keep their status). */
const DRAFTABLE_STATUSES: ReadonlyArray<AuditPlan['status']> = ['Draft', 'Planned', 'Rescheduled']

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err))

/**
 * /cab/audit-planning/build/:planId — build an existing plan;
 * /cab/audit-planning/new — the blank create-plan form.
 */
export function CabBuildAuditPlanPage() {
  const { planId } = useParams<{ planId: string }>()
  return planId ? <BuildAuditPlanEditor key={planId} planId={planId} /> : <CreateAuditPlanForm />
}

function BuildAuditPlanEditor({ planId }: { planId: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tourSteps = useBuildAuditPlanTourSteps()

  const [plan, setPlan] = useState<AuditPlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // CAB employees who can be assigned to the audit team
  const [auditors, setAuditors] = useState<PlanningAuditor[]>([])
  const qualifiedAuditors = auditors.filter((p) => p.qualified)
  const [activeTab, setActiveTab] = useState<'agenda' | 'site' | 'remote' | 'travel' | 'declarations'>('agenda')
  // All plan sections stay on one page; the tabs jump to a section and briefly highlight it.
  const goToPlanSection = (key: typeof activeTab) => {
    setActiveTab(key)
    const el = document.getElementById(`plan-section-${key}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    el.classList.add('ring-2', 'ring-primary')
    window.setTimeout(() => el.classList.remove('ring-2', 'ring-primary'), 1200)
  }

  // Form states
  const [auditStage, setAuditStage] = useState('Stage 1')
  const [proposedStartDate, setProposedStartDate] = useState('2025-05-18')
  const [proposedEndDate, setProposedEndDate] = useState('2025-05-19')
  const [timezone, setTimezone] = useState('Asia/Riyadh')
  const [leadAuditor, setLeadAuditor] = useState('Omar Hassan')
  const [auditTeam, setAuditTeam] = useState<string[]>(['Omar Hassan (Lead)', 'Khalid Al-Rashid'])
  const [auditObjectives, setAuditObjectives] = useState(() =>
    t('ui.defaultAuditObjectives')
  )
  const [scopeSummary, setScopeSummary] = useState(() =>
    t('ui.defaultScopeSummary')
  )

  // Sub-sections states
  const [siteCode, setSiteCode] = useState('SITE-001 · Riyadh')
  const [siteName, setSiteName] = useState('')
  const [onSitePersonnel, setOnSitePersonnel] = useState<string[]>([])
  // Section edit dialogs and the one-plan Excel import ("Import template").
  const [editSection, setEditSection] = useState<PlanSection | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importBatchId, setImportBatchId] = useState<string | null>(null)
  // Back from "Complete" (…?importBatch=…&importDef=audit_plan_sections): reopen the import result.
  const [searchParams, setSearchParams] = useSearchParams()
  const reopenBatch = searchParams.get(IMPORT_DEF_PARAM) === 'audit_plan_sections' ? searchParams.get(IMPORT_BATCH_PARAM) : null
  const [handledBatch, setHandledBatch] = useState<string | null>(null)
  if (reopenBatch && handledBatch !== reopenBatch) {
    setHandledBatch(reopenBatch)
    setImportBatchId(reopenBatch)
    setImportOpen(true)
  }
  useEffect(() => {
    if (!reopenBatch || handledBatch !== reopenBatch) return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete(IMPORT_BATCH_PARAM)
        next.delete(IMPORT_DEF_PARAM)
        return next
      },
      { replace: true },
    )
  }, [reopenBatch, handledBatch, setSearchParams])
  const [siteAddress, setSiteAddress] = useState(
    'Al Noor Food Industries\nSecond Industrial City\nRiyadh 14334\nSaudi Arabia'
  )
  const [remoteEnabled, setRemoteEnabled] = useState(true)
  const [remoteActivitiesList, setRemoteActivitiesList] = useState<string[]>([
    'Document review',
    'Interviews (if required)',
  ])
  const [remotePlatform, setRemotePlatform] = useState('Microsoft Teams')
  const [remoteNotes, setRemoteNotes] = useState('Client to arrange access and invitations.')
  const [travelNotes, setTravelNotes] = useState(
    'Auditors to arrive in Riyadh on 17 May 2025. Accommodation booked near the site. Local transport to be arranged by client.'
  )
  const [availabilityConfirmed, setAvailabilityConfirmed] = useState(true)
  const [noConflictsDeclared, setNoConflictsDeclared] = useState(true)

  // Agenda activities
  const [agenda, setAgenda] = useState<AgendaActivity[]>([])

  // Notification banners / alerts
  const [isSaving, setIsSaving] = useState(false)

  // Modals state
  const [isReadinessModalOpen, setIsReadinessModalOpen] = useState(false)
  const [readinessResult, setReadinessResult] = useState<EligibilityCheckResult | null>(null)
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<AgendaActivity | null>(null)

  // Reschedule form
  const [rescheduleStart, setRescheduleStart] = useState('')
  const [rescheduleEnd, setRescheduleEnd] = useState('')
  const [rescheduleReason, setRescheduleReason] = useState('Client requested date adjustment due to scheduled facility maintenance.')

  // Activity form
  const [actDate, setActDate] = useState('2025-05-18')
  const [actStartTime, setActStartTime] = useState('09:00')
  const [actEndTime, setActEndTime] = useState('10:00')
  const [actTitle, setActTitle] = useState('')
  const [actAuditors, setActAuditors] = useState('Omar Hassan')
  const [actDuration, setActDuration] = useState(1.0)

  useEffect(() => {
    fetchPlanningAuditors().then(setAuditors).catch(() => setAuditors([]))
  }, [])

  /** Copies a loaded or imported plan into the editor state. */
  const applyPlanData = (data: AuditPlan) => {
    setPlan(data)
    setAuditStage(data.stage)
    setProposedStartDate(data.proposedStartDate)
    setProposedEndDate(data.proposedEndDate)
    setTimezone(data.timezone)
    setLeadAuditor(data.leadAuditor)
    setActAuditors(data.leadAuditor)
    setAuditTeam(data.auditTeam.map((a) => (a === data.leadAuditor ? `${a} (Lead)` : a)))
    setAuditObjectives(data.auditObjectives)
    setScopeSummary(data.scopeSummary)
    setAgenda(data.agendaActivities)
    setSiteCode(data.siteAllocation?.siteCode || data.siteCode || '')
    setSiteName(data.siteAllocation?.siteName || data.siteName || '')
    setOnSitePersonnel(data.siteAllocation?.onSitePersonnel ?? [])
    setSiteAddress(data.siteAllocation?.siteAddress || '')
    setRemoteEnabled(data.remoteActivities?.enabled ?? true)
    setRemoteActivitiesList(data.remoteActivities?.activities || ['Document review'])
    setRemotePlatform(data.remoteActivities?.platform || 'Microsoft Teams')
    setRemoteNotes(data.remoteActivities?.notes || '')
    setTravelNotes(data.travelNotes?.details || '')
    setAvailabilityConfirmed(data.teamDeclarations?.availabilityConfirmed ?? true)
    setNoConflictsDeclared(data.teamDeclarations?.noConflictsDeclared ?? true)
  }
  // Effect Event: the loader applies the plan without making the setters dependencies.
  const onPlanLoaded = useEffectEvent((data: AuditPlan) => applyPlanData(data))

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      const data = await fetchAuditPlanById(planId).catch(() => null)
      if (!data) {
        // Unknown plan: back to the plan list.
        navigate('/cab/audit-planning/schedule', { replace: true })
        return
      }
      onPlanLoaded(data)
      setIsLoading(false)
    }
    load()
  }, [planId, navigate])

  /** After a section dialog saved: keep the editor in step with the saved plan. */
  const onSectionSaved = (saved: AuditPlan) => {
    setPlan(saved)
    setSiteCode(saved.siteAllocation?.siteCode || saved.siteCode || '')
    setSiteName(saved.siteAllocation?.siteName || saved.siteName || '')
    setSiteAddress(saved.siteAllocation?.siteAddress || '')
    setOnSitePersonnel(saved.siteAllocation?.onSitePersonnel ?? [])
    setRemoteEnabled(saved.remoteActivities?.enabled ?? false)
    setRemoteActivitiesList(saved.remoteActivities?.activities || [])
    setRemotePlatform(saved.remoteActivities?.platform || 'Microsoft Teams')
    setRemoteNotes(saved.remoteActivities?.notes || '')
    setTravelNotes(saved.travelNotes?.details || '')
    setEditSection(null)
  }

  // "Complete" from an import focuses a field or section of this plan (?field=…).
  useDeepLinkField(!isLoading && Boolean(plan), 'plan-section-agenda')

  const showToast = (msg: string) => {
    toast.success(msg)
  }

  // Calculate total effort hours
  const totalEffort = agenda.reduce((acc, cur) => acc + (cur.durationHours || 0), 0)

  const handleSaveDraft = async () => {
    setIsSaving(true)
    try {
      const updated = await saveAuditPlan({
        id: plan?.id,
        planNumber: plan?.planNumber || undefined,
        stage: auditStage as AuditPlan['stage'],
        proposedStartDate,
        proposedEndDate,
        timezone,
        leadAuditor,
        auditTeam: auditTeam.map((a) => a.replace(' (Lead)', '')),
        auditObjectives,
        scopeSummary,
        totalEffortHours: totalEffort,
        siteAllocation: {
          siteCode,
          siteName: siteName || siteCode,
          onSitePersonnel: onSitePersonnel.length ? onSitePersonnel : auditTeam.map((a) => a.replace(' (Lead)', '')),
          siteAddress,
        },
        remoteActivities: {
          enabled: remoteEnabled,
          activities: remoteActivitiesList,
          platform: remotePlatform,
          notes: remoteNotes,
        },
        travelNotes: { details: travelNotes },
        teamDeclarations: {
          availabilityConfirmed,
          noConflictsDeclared,
        },
        agendaActivities: agenda,
        ...(plan && DRAFTABLE_STATUSES.includes(plan.status) ? { status: 'Draft' as const } : {}),
      })
      setPlan(updated)
      showToast(t('cab.auditPlanning.draftSaved', 'Draft saved successfully.'))
    } catch (err) {
      showToast(errorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const handleRunReadinessCheck = async () => {
    try {
      const result = await checkAuditPlanReadiness(plan?.planNumber || planId)
      setReadinessResult(result)
      setIsReadinessModalOpen(true)
    } catch (err) {
      showToast(errorMessage(err))
    }
  }

  const handleConfirmSendToClient = async () => {
    if (!plan) return
    try {
      const result = await sendAuditPlanToClient(plan.planNumber, {
        name: plan.primaryContactName,
        email: plan.primaryContactEmail,
      })
      const refreshed = await fetchAuditPlanById(plan.id)
      if (refreshed) setPlan(refreshed)
      setIsSendModalOpen(false)
      showToast(t('cab.buildPlan.toasts.sent', { name: plan.primaryContactName, email: plan.primaryContactEmail, defaultValue: 'Audit plan sent to {{name}} ({{email}}).' }))
      // Agreement gate in warn mode: sent, but the client has no active certification agreement yet.
      if (result.warnings?.length) toast.warning(t('agreements.gate.warnTitle'), { description: t('agreements.gate.body') })
    } catch (err) {
      // Agreement gate in block mode (AGREEMENT_REQUIRED): the notice in the dialog links to the agreement.
      toast.error(agreementErrorMessage(err, t))
    }
  }

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!plan) return
    let updated: AuditPlan
    try {
      updated = await rescheduleAuditPlan(plan.planNumber, {
        startDate: rescheduleStart,
        endDate: rescheduleEnd,
        reason: rescheduleReason,
      })
    } catch (err) {
      showToast(errorMessage(err))
      return
    }
    setPlan(updated)
    setProposedStartDate(updated.proposedStartDate)
    setProposedEndDate(updated.proposedEndDate)
    setAgenda(updated.agendaActivities)
    setIsRescheduleModalOpen(false)
    showToast(t('cab.buildPlan.toasts.rescheduled', { start: updated.proposedStartDate, end: updated.proposedEndDate, version: updated.version, defaultValue: 'Audit plan rescheduled to {{start}} to {{end}}. Version {{version}}.' }))
  }

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingActivity) {
      setAgenda((prev) =>
        prev.map((a) =>
          a.id === editingActivity.id
            ? {
                ...a,
                date: actDate,
                startTime: actStartTime,
                endTime: actEndTime,
                activity: actTitle,
                auditors: [actAuditors],
                durationHours: actDuration,
              }
            : a
        )
      )
    } else {
      const newAct: AgendaActivity = {
        id: `act-${Date.now()}`,
        date: actDate,
        startTime: actStartTime,
        endTime: actEndTime,
        activity: actTitle,
        auditors: [actAuditors],
        durationHours: actDuration,
      }
      setAgenda((prev) => [...prev, newAct])
    }
    setIsActivityModalOpen(false)
    setEditingActivity(null)
  }

  const handleDeleteActivity = (id: string) => {
    setAgenda((prev) => prev.filter((a) => a.id !== id))
  }

  const handleRemoveAuditorChip = (auditor: string) => {
    setAuditTeam((prev) => prev.filter((a) => a !== auditor))
  }

  if (isLoading || !plan) {
    return (
      <CabLayout sidebarVariant="auditPlanning">
        <div className="flex flex-1 items-center justify-center p-12 text-neutral-500">
          {t('common.loading', 'Loading audit plan...')}
        </div>
      </CabLayout>
    )
  }

  return (
    <CabLayout
      sidebarVariant="auditPlanning"
      tourId="cab-build-audit-plan"
      tourSteps={tourSteps}
    >
      <CabHeader
        title={t('cab.auditPlanning.title', 'Audit Planning')}
        subtitle={t('cab.auditPlanning.subtitle', 'Plan and manage audits across clients and sites.')}
        notificationCount={3}
      />

      <div className="flex flex-1 flex-col gap-5 overflow-auto page-main">

        {/* Page Top Header with Breadcrumbs & Action Buttons */}
        <CabTourStep steps={tourSteps} stepId="build-plan-header">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <nav className="flex items-center gap-2 text-body-sm text-neutral-500 mb-1">
                <button
                  type="button"
                  onClick={() => navigate('/cab/audit-planning/schedule')}
                  className="hover:text-primary transition font-medium"
                >
                  {t('cab.sidebar.auditPlanning', 'Audit Planning')}
                </button>
                <span>›</span>
                <button
                  type="button"
                  onClick={() => navigate('/cab/audit-planning/schedule')}
                  className="hover:text-primary transition font-medium"
                >
                  {t('cab.sidebar.auditSchedule', 'Audit Plans')}
                </button>
                <span>›</span>
                <span className="text-primary font-semibold">{plan.planNumber}</span>
              </nav>
              <div className="flex items-center gap-3">
                <h2 className="text-body-lg font-bold text-neutral-900 tracking-tight">
                  {t('cab.buildAuditPlan.title', 'Build audit plan')}
                </h2>
                <span className="inline-flex items-center justify-center rounded-sm px-3 py-1 text-caption font-medium whitespace-nowrap bg-primary-50 text-primary">
                  {enumLabel(t, plan.status)}
                </span>
              </div>
              <p className="text-body-sm text-neutral-600 mt-0.5">
                {t('cab.buildAuditPlan.subtitle', 'Plan the audit, allocate resources and prepare the agenda.')}
              </p>
            </div>

            {/* Top Actions matching design system */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Save Draft */}
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="inline-flex h-11 items-center gap-2 rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <span>{isSaving ? t('common.saving', 'Saving...') : t('common.saveDraft', 'Save draft')}</span>
              </button>

              {/* Check Readiness */}
              <button
                type="button"
                onClick={handleRunReadinessCheck}
                className="inline-flex h-11 items-center gap-2 rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <span>{t('cab.buildAuditPlan.checkReadiness', 'Check readiness')}</span>
              </button>

              {/* Send to client */}
              <button
                type="button"
                onClick={() => setIsSendModalOpen(true)}
                className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                <span>{t('cab.buildAuditPlan.sendToClient', 'Send to client')}</span>
              </button>

              {/* More options menu */}
              <button
                type="button"
                onClick={() => {
                  setRescheduleStart(proposedStartDate)
                  setRescheduleEnd(proposedEndDate)
                  setIsRescheduleModalOpen(true)
                }}
                title={t('ui.reschedulePlan')}
                className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-neutral-100 bg-white text-neutral-800 transition hover:bg-neutral-50 font-bold"
              >
                •••
              </button>
            </div>
          </div>
        </CabTourStep>

        <ReturnToBanner />

        {/* Status lifecycle: start → review → completed (report + competence log side effects) */}
        <AuditPlanLifecycleBar plan={plan} onChange={setPlan} />

        {/* Audit Summary Header Card Bar */}
        <CabTourStep steps={tourSteps} stepId="build-plan-summary-bar">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 rounded-lg border border-neutral-100 bg-white p-5 shadow-sm">
            {/* Audit plan */}
            <div className="space-y-1.5 border-e border-neutral-100 pe-3 last:border-e-0">
              <div className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-primary-50 text-primary-hover">
                  <CalendarIcon className="size-4" />
                </span>
                <span className="text-caption text-neutral-600 font-medium">{t('ui.auditPlan')}</span>
              </div>
              <p className="text-body font-bold text-neutral-900">{plan.planNumber}</p>
              <p className="text-body-sm text-neutral-600">{enumLabel(t, plan.stage)}</p>
            </div>

            {/* Client */}
            <div className="space-y-1.5 border-e border-neutral-100 pe-3 last:border-e-0">
              <div className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-warning-50 text-warning-700">
                  <AppIcon icon={BuildingsIcon} size={15} />
                </span>
                <span className="text-caption text-neutral-600 font-medium">{t('ui.client')}</span>
              </div>
              <p className="text-body-sm font-bold text-neutral-900 truncate">{plan.clientName}</p>
              <p className="text-caption text-neutral-600">
                {plan.clientCode} · {displayCountry(plan.country)}
              </p>
            </div>

            {/* Application */}
            <div className="space-y-1.5 border-e border-neutral-100 pe-3 last:border-e-0">
              <div className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-violet-100 text-violet-700">
                  <AppIcon icon={FileTextIcon} size={15} />
                </span>
                <span className="text-caption text-neutral-600 font-medium">{t('ui.application')}</span>
              </div>
              <p className="text-body-sm font-bold text-primary">{plan.applicationNumber}</p>
              <p className="text-caption text-neutral-600 line-clamp-2">{plan.standardName}</p>
            </div>

            {/* Reviewed duration */}
            <div className="space-y-1.5 border-e border-neutral-100 pe-3 last:border-e-0">
              <div className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-success-100 text-accent-teal">
                  <AppIcon icon={HistoryIcon} size={15} />
                </span>
                <span className="text-caption text-neutral-600 font-medium">{t('ui.reviewedDuration')}</span>
              </div>
              <p className="text-body-sm font-bold text-neutral-900">{plan.reviewedDurationCode}</p>
              <p className="text-body-sm text-neutral-600">{plan.reviewedDurationDays.toFixed(1)} {t('ui.days')}</p>
            </div>

            {/* Site */}
            <div className="space-y-1.5 border-e border-neutral-100 pe-3 last:border-e-0">
              <div className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-error-100 text-error-600">
                  <AppIcon icon={MapPinIcon} size={15} />
                </span>
                <span className="text-caption text-neutral-600 font-medium">{t('ui.site')}</span>
              </div>
              <p className="text-body-sm font-bold text-neutral-900">{plan.siteCode}</p>
              <p className="text-caption text-neutral-600">
                {plan.siteName.split(' ')[0]} · {displayCountry(plan.country)}
              </p>
            </div>

            {/* Primary contact */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-pink-50 text-pink-700">
                  <AppIcon icon={UserIcon} size={15} />
                </span>
                <span className="text-caption text-neutral-600 font-medium">{t('ui.primaryContact')}</span>
              </div>
              <p className="text-body-sm font-bold text-neutral-900">{plan.primaryContactName}</p>
              <p className="flex items-center gap-1 text-caption text-primary truncate">
                <AppIcon icon={MailIcon} size={12} className="text-neutral-500 shrink-0" />
                <span className="truncate">{plan.primaryContactEmail}</span>
              </p>
              <p className="flex items-center gap-1 text-caption text-neutral-600">
                <AppIcon icon={PhoneIcon} size={12} className="text-neutral-500 shrink-0" />
                <span>{plan.primaryContactPhone}</span>
              </p>
            </div>
          </div>
        </CabTourStep>

        {/* Form Details: Two Columns Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Audit Details */}
          <div className="lg:col-span-7">
            <CabTourStep steps={tourSteps} stepId="build-plan-details">
              <div className="rounded-lg border border-neutral-100 bg-white p-5 shadow-none space-y-4">
                <h3 className="text-body font-bold text-neutral-900 mb-3 border-b border-neutral-100 pb-2">{t('ui.auditDetails')}</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Audit Stage */}
                  <div className="space-y-1.5">
                    <label className="text-body-sm font-medium text-neutral-800">
                      {t('ui.auditStage')} <span className="text-error-500">*</span>
                    </label>
                    <select
                      value={auditStage}
                      onChange={(e) => setAuditStage(e.target.value)}
                      className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Stage 1">{t('ui.stage1')}</option>
                      <option value="Stage 2">{t('ui.stage2')}</option>
                      <option value="Surveillance 1">{t('ui.surveillance1')}</option>
                    </select>
                  </div>

                  {/* Proposed start date */}
                  <div className="space-y-1.5">
                    <label className="text-body-sm font-medium text-neutral-800">
                      {t('ui.proposedStartDate')} <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={proposedStartDate}
                      onChange={(e) => setProposedStartDate(e.target.value)}
                      className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Proposed end date */}
                  <div className="space-y-1.5">
                    <label className="text-body-sm font-medium text-neutral-800">
                      {t('ui.proposedEndDate')} <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={proposedEndDate}
                      onChange={(e) => setProposedEndDate(e.target.value)}
                      className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Timezone */}
                  <div className="space-y-1.5">
                    <label className="text-body-sm font-medium text-neutral-800">
                      {t('ui.timezone')} <span className="text-error-500">*</span>
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Asia/Riyadh">Asia/Riyadh</option>
                      <option value="Asia/Dubai">Asia/Dubai</option>
                      <option value="Africa/Cairo">Africa/Cairo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start pt-2">
                  {/* Lead auditor */}
                  <div className="sm:col-span-4 space-y-1.5">
                    <label className="text-body-sm font-medium text-neutral-800">
                      {t('ui.leadAuditor')} <span className="text-error-500">*</span>
                    </label>
                    <select
                      id="plan-lead-auditor"
                      value={leadAuditor}
                      onChange={(e) => setLeadAuditor(e.target.value)}
                      className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {!qualifiedAuditors.some((p) => p.name === leadAuditor) && (
                        <option value={leadAuditor}>{leadAuditor || notSet()}</option>
                      )}
                      {qualifiedAuditors.map((p) => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Audit team chips */}
                  <div className="sm:col-span-8 space-y-1.5">
                    <label className="text-body-sm font-medium text-neutral-800">{t('ui.auditTeam')}</label>
                    <div className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-md border border-neutral-100 bg-white p-2">
                      {auditTeam.map((member) => (
                        <span
                          key={member}
                          className="inline-flex items-center gap-1.5 rounded-sm bg-primary-50 px-2.5 py-1 text-body-sm font-medium text-primary"
                        >
                          {member}
                          <button
                            type="button"
                            onClick={() => handleRemoveAuditorChip(member)}
                            className="text-primary hover:text-error-500 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <select
                        onChange={(e) => {
                          if (e.target.value && !auditTeam.includes(e.target.value)) {
                            setAuditTeam((prev) => [...prev, e.target.value])
                            e.target.value = ''
                          }
                        }}
                        className="bg-transparent text-body-sm text-neutral-600 focus:outline-none cursor-pointer"
                      >
                        <option value="">{t('ui.addAuditorOption')}</option>
                        {qualifiedAuditors
                          .filter((p) => !auditTeam.some((member) => member.replace(' (Lead)', '') === p.name))
                          .map((p) => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </CabTourStep>
          </div>

          {/* Right Column: Objectives and Scope */}
          <div className="lg:col-span-5">
            <CabTourStep steps={tourSteps} stepId="build-plan-objectives">
              <div className="rounded-lg border border-neutral-100 bg-white p-5 shadow-none space-y-4">
                <h3 className="text-body font-bold text-neutral-900 mb-3 border-b border-neutral-100 pb-2">{t('ui.objectivesAndScope')}</h3>

                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium text-neutral-800">{t('ui.auditObjectives')}</label>
                  <textarea
                    value={auditObjectives}
                    onChange={(e) => setAuditObjectives(e.target.value)}
                    rows={2}
                    className="w-full rounded-md border border-neutral-100 bg-white p-3 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium text-neutral-800">{t('ui.scopeSummary')}</label>
                  <textarea
                    id="plan-scope"
                    value={scopeSummary}
                    onChange={(e) => setScopeSummary(e.target.value)}
                    rows={2}
                    className="w-full rounded-md border border-neutral-100 bg-white p-3 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </CabTourStep>
          </div>
        </div>

        {/* Competence-based audit team selection: validate and confirm the team (needed to send or start the plan). */}
        {plan && (
          <PlanTeamPanel
            planId={plan.planNumber}
            onConfirmed={({ leadAuditor: lead, auditTeam: team }) => {
              setLeadAuditor(lead)
              setAuditTeam(team.map((name) => (name === lead ? `${name} (Lead)` : name)))
            }}
          />
        )}

        {/* Tabs Bar */}
        <CabTourStep steps={tourSteps} stepId="build-plan-tabs">
          <div className="border-b border-neutral-100 flex gap-8 text-body-sm">
            {[
              { key: 'agenda', label: 'Agenda' },
              { key: 'site', label: 'Site allocation' },
              { key: 'remote', label: 'Remote activities' },
              { key: 'travel', label: 'Travel notes' },
              { key: 'declarations', label: 'Team declarations' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => goToPlanSection(tab.key as typeof activeTab)}
                aria-controls={`plan-section-${tab.key}`}
                aria-current={activeTab === tab.key ? 'true' : undefined}
                className={cn(
                  'pb-3 transition-colors border-b-2 font-medium',
                  activeTab === tab.key
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                )}
              >
                {enumLabel(t, tab.label)}
              </button>
            ))}
          </div>
        </CabTourStep>

        {/* Tab 1: Agenda Grid & Side Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Main Agenda Table Card */}
          <div className="lg:col-span-8">
            <CabTourStep steps={tourSteps} stepId="build-plan-agenda-table">
              <div id="plan-section-agenda" data-plan-section="agenda" className="scroll-mt-4 transition-shadow rounded-lg border border-neutral-100 bg-white p-5 shadow-none">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-body font-bold text-neutral-900">{t('ui.auditAgenda')}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingActivity(null)
                        setActTitle('')
                        setActDuration(1.0)
                        setIsActivityModalOpen(true)
                      }}
                      className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
                    >
                      <span>+</span>
                      <span>{t('ui.addActivity')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImportBatchId(null)
                        setImportOpen(true)
                      }}
                      data-testid="plan-import-template"
                      className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-neutral-100 bg-white px-3.5 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
                    >
                      <span>{t('ui.importTemplate')}</span>
                    </button>
                  </div>
                </div>

                <div id="plan-auditors" className="overflow-x-auto rounded-md border border-neutral-100">
                  <table className="w-full border-collapse text-start text-body-sm">
                    <thead>
                      <tr className="bg-primary text-white">
                        <th className="p-3.5 text-start w-10 text-body-sm font-medium">#</th>
                        <th className="p-3.5 text-start text-body-sm font-medium">{t('ui.date')}</th>
                        <th className="p-3.5 text-start text-body-sm font-medium">{t('ui.timeAst')}</th>
                        <th className="p-3.5 text-start text-body-sm font-medium">{t('ui.activity')}</th>
                        <th className="p-3.5 text-start text-body-sm font-medium">{t('ui.auditors')}</th>
                        <th className="p-3.5 text-start text-body-sm font-medium">{t('ui.duration')}</th>
                        <th className="p-3.5 text-end text-body-sm font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {agenda.map((item, idx) => (
                        <tr
                          key={item.id}
                          className={cn(
                            'hover:bg-primary-50/50 transition-colors',
                            idx % 2 === 1 ? 'bg-neutral-25' : ''
                          )}
                        >
                          <td className="px-3.5 py-3 text-neutral-500 text-body-sm">{idx + 1}</td>
                          <td className="px-3.5 py-3 text-neutral-800 text-body-sm font-medium">{item.date}</td>
                          <td className="px-3.5 py-3 text-neutral-700 text-body-sm">
                            {item.startTime} - {item.endTime}
                          </td>
                          <td className="px-3.5 py-3 text-neutral-900 text-body-sm font-medium">{enumLabel(t, item.activity)}</td>
                          <td className="px-3.5 py-3 text-neutral-800 text-body-sm">{item.auditors.join(', ')}</td>
                          <td className="px-3.5 py-3 text-neutral-800 text-body-sm font-medium">{item.durationHours} h</td>
                          <td className="px-3.5 py-3 text-end">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingActivity(item)
                                setActDate(item.date)
                                setActStartTime(item.startTime)
                                setActEndTime(item.endTime)
                                setActTitle(item.activity)
                                setActAuditors(item.auditors[0] || leadAuditor)
                                setActDuration(item.durationHours)
                                setIsActivityModalOpen(true)
                              }}
                              className="text-neutral-500 hover:text-neutral-800 font-bold px-1"
                            >
                              ⋮
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-neutral-100 bg-neutral-25 font-bold text-neutral-900">
                        <td colSpan={5} className="p-3.5 text-start text-body-sm">
                          {t('ui.totalReviewedDuration')} {plan.reviewedDurationCode})
                        </td>
                        <td className="p-3.5 text-start text-body-sm text-primary">{totalEffort.toFixed(1)} h</td>
                        <td className="p-3.5"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </CabTourStep>
          </div>

          {/* Right Side Cards */}
          <div className="lg:col-span-4 space-y-5">
            <CabTourStep steps={tourSteps} stepId="build-plan-side-cards">
              <div className="space-y-5">
                {/* Site Allocation Card */}
                <div id="plan-section-site" data-plan-section="site" className="scroll-mt-4 transition-shadow rounded-lg border border-neutral-100 bg-white p-5 shadow-none">
                  <div className="flex items-center justify-between mb-3 border-b border-neutral-100 pb-2">
                    <h4 className="text-body font-bold text-neutral-900">{t('ui.siteAllocation')}</h4>
                    <button
                      type="button"
                      onClick={() => setEditSection('site')}
                      data-testid="plan-edit-site"
                      className="text-body-sm font-medium text-primary hover:underline"
                    >
                      {t('common.edit')}
                    </button>
                  </div>

                  <div className="space-y-3 text-body-sm">
                    <div>
                      <span className="text-body-sm font-medium text-neutral-800 block mb-0.5">{t('ui.site')} *</span>
                      <p className="text-body-sm font-semibold text-neutral-900">{siteName || siteCode || notSet()}</p>
                      {siteCode && siteName && siteCode !== siteName && <p className="text-caption text-neutral-600" dir="ltr">{siteCode}</p>}
                    </div>

                    <div>
                      <span className="text-body-sm font-medium text-neutral-800 block mb-0.5">
                        {t('ui.onSitePersonnel')}
                      </span>
                      <p id="plan-on-site-personnel" className="text-neutral-800 text-body-sm">{(onSitePersonnel.length ? onSitePersonnel : auditTeam).join(', ')}</p>
                    </div>

                    <div>
                      <span className="text-body-sm font-medium text-neutral-800 block mb-0.5">
                        {t('ui.siteAddress')}
                      </span>
                      <p id="plan-site-address" className="text-neutral-800 whitespace-pre-line text-body-sm">{siteAddress || notSet()}</p>
                    </div>
                  </div>
                </div>

                {/* Remote Activities Card */}
                <div id="plan-section-remote" data-plan-section="remote" className="scroll-mt-4 transition-shadow rounded-lg border border-neutral-100 bg-white p-5 shadow-none">
                  <div className="flex items-center justify-between mb-3 border-b border-neutral-100 pb-2">
                    <h4 className="text-body font-bold text-neutral-900">{t('ui.remoteActivities')}</h4>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditSection('remote')}
                        className="text-body-sm font-medium text-primary hover:underline"
                        data-testid="plan-edit-remote"
                      >
                        {t('common.edit')}
                      </button>
                      <span className="text-caption text-neutral-600">{t('ui.includeRemote')}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={remoteEnabled}
                        onClick={() => setRemoteEnabled((prev) => !prev)}
                        className={cn(
                          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200',
                          remoteEnabled ? 'bg-primary' : 'bg-neutral-400'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block size-4 transform rounded-full bg-white transition duration-200 mt-0.5',
                            remoteEnabled ? 'translate-x-4' : 'translate-x-0.5'
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  {remoteEnabled && (
                    <div className="space-y-3 text-body-sm">
                      <div>
                        <span className="text-body-sm font-medium text-neutral-800 block mb-1">
                          {t('ui.remoteActivities')}
                        </span>
                        <div id="plan-remote-activities" className="flex flex-wrap gap-1.5">
                          {remoteActivitiesList.map((item) => (
                            <span
                              key={item}
                              className="inline-flex items-center gap-1 rounded-sm bg-neutral-100 px-2 py-0.5 text-caption text-neutral-800 font-medium"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-body-sm font-medium text-neutral-800 block mb-1">
                          {t('ui.platform')}
                        </span>
                        <select
                          id="plan-remote-platform"
                          value={remotePlatform}
                          onChange={(e) => setRemotePlatform(e.target.value)}
                          className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-neutral-800 text-body-sm"
                        >
                          <option value="Microsoft Teams">Microsoft Teams</option>
                          <option value="Zoom">Zoom</option>
                          <option value="Google Meet">Google Meet</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-body-sm font-medium text-neutral-800 block mb-0.5">
                          {t('ui.notes')}
                        </span>
                        <p className="text-body-sm text-neutral-700">{remoteNotes}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Travel Notes Card */}
                <div id="plan-section-travel" data-plan-section="travel" className="scroll-mt-4 transition-shadow rounded-lg border border-neutral-100 bg-white p-5 shadow-none">
                  <div className="flex items-center justify-between mb-2 border-b border-neutral-100 pb-2">
                    <h4 className="text-body font-bold text-neutral-900">{t('ui.travelNotes')}</h4>
                    <button
                      type="button"
                      onClick={() => setEditSection('travel')}
                      data-testid="plan-edit-travel"
                      className="text-body-sm font-medium text-primary hover:underline"
                    >
                      {t('common.edit')}
                    </button>
                  </div>
                  <p className="text-body-sm text-neutral-700 leading-relaxed">{travelNotes}</p>
                  {/* Travel cost estimate of the plan: estimated vs actual (travel cost calculator). */}
                  <TravelCostPanel
                    key={`${plan.id}-${plan.proposedStartDate}-${plan.proposedEndDate}`}
                    scope={{ auditPlanId: plan.id }}
                    variant="plan"
                    seed={{
                      startDate: plan.proposedStartDate,
                      endDate: plan.proposedEndDate,
                      mode: plan.remoteActivities?.enabled ? 'HYBRID' : 'ONSITE',
                      sites: [{ key: 'plan-site', name: plan.siteName || 'Audit site', address: plan.siteAddress }],
                      team: [plan.leadAuditor, ...plan.auditTeam].filter(Boolean).map((name) => ({ name })),
                    }}
                    className="mt-4 border-t border-neutral-100 pt-4"
                  />
                </div>
              </div>
            </CabTourStep>
          </div>
        </div>

        {/* Team Declarations Card */}
        <div id="plan-section-declarations" data-plan-section="declarations" className="scroll-mt-4 transition-shadow rounded-lg border border-neutral-100 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-2">
            <h3 className="text-body font-bold text-neutral-900">{t('ui.teamDeclarations')}</h3>
            <button
              type="button"
              onClick={() => showToast(t('cab.buildPlan.toasts.declarationsEditing', 'Declarations update enabled'))}
              className="text-body-sm font-medium text-primary hover:underline"
            >
              {t('common.edit')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={availabilityConfirmed}
                onChange={(e) => setAvailabilityConfirmed(e.target.checked)}
                className="size-4 mt-0.5 rounded text-primary focus:ring-primary"
              />
              <span className="text-body-sm text-neutral-800 font-medium">
                {t('ui.teamAvailabilityConfirmed')}
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={noConflictsDeclared}
                onChange={(e) => setNoConflictsDeclared(e.target.checked)}
                className="size-4 mt-0.5 rounded text-primary focus:ring-primary"
              />
              <span className="text-body-sm text-neutral-800 font-medium">
                {t('ui.teamNoConflicts')}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* MODAL 1: Check Readiness Modal */}
      {isReadinessModalOpen && readinessResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-overlay/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-success-500" />
                <h3 className="text-body font-bold text-neutral-900">
                  {t('ui.eligibilityReadiness')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReadinessModalOpen(false)}
                className="text-neutral-500 hover:text-neutral-700 text-body-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-body-sm">
              {/* Check 1: Competence */}
              <div className="rounded-md border border-neutral-100 bg-neutral-25 p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900">{t('ui.check1Competence')}</span>
                  <span className="rounded-sm bg-success-50 px-2.5 py-0.5 font-medium text-success-700">
                    {t('ui.passed')}
                  </span>
                </div>
                <p className="text-neutral-700">{readinessResult.competenceAuthorization.details}</p>
                <p className="text-caption text-neutral-500">
                  {t('ui.authorizedStandards')} {readinessResult.competenceAuthorization.certifiedStandards.join(', ')}
                </p>
              </div>

              {/* Check 2: Availability */}
              <div className="rounded-md border border-neutral-100 bg-neutral-25 p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900">{t('ui.check2Availability')}</span>
                  <span className="rounded-sm bg-success-50 px-2.5 py-0.5 font-medium text-success-700">
                    {t('ui.passed')}
                  </span>
                </div>
                <p className="text-neutral-700">{readinessResult.availability.details}</p>
              </div>

              {/* Check 3: Impartiality & Conflicts */}
              <div className="rounded-md border border-neutral-100 bg-neutral-25 p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900">{t('ui.check3Impartiality')}</span>
                  <span className="rounded-sm bg-success-50 px-2.5 py-0.5 font-medium text-success-700">
                    {t('ui.passed')}
                  </span>
                </div>
                <p className="text-neutral-700">{readinessResult.impartiality.details}</p>
                <p className="text-caption text-neutral-600 italic">
                  {t('ui.noSilentOverrides')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsReadinessModalOpen(false)}
                className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
              >
                {t('ui.done')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Send to Client Preview Modal */}
      {isSendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-overlay/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <h3 className="text-body font-bold text-neutral-900">
                {t('ui.sendPlanToClient')}
              </h3>
              <button
                type="button"
                onClick={() => setIsSendModalOpen(false)}
                className="text-neutral-500 hover:text-neutral-700 text-body-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-body-sm">
              <div className="rounded-md bg-neutral-25 border border-primary-50 p-4 space-y-1">
                <span className="text-caption font-bold text-primary uppercase tracking-wider">
                  {t('ui.recipientPreview')}
                </span>
                <p className="font-bold text-neutral-900 text-body">{plan.primaryContactName}</p>
                <p className="text-neutral-700">{plan.primaryContactEmail}</p>
                <p className="text-neutral-600">{plan.clientName} ({plan.clientCode})</p>
              </div>

              <AgreementGateNotice clientId={plan.organizationId ?? plan.clientCode} stage={plan.stage} />

              <div className="rounded-md border border-warning-200 bg-warning-50 p-3.5 text-warning-900 text-caption">
                <strong>{t('ui.importantNotice')}</strong> {t('ui.sendPlanNotice')}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsSendModalOpen(false)}
                className="h-11 rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmSendToClient}
                className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
              >
                {t('ui.confirmSendPlan')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Reschedule Audit Plan Modal */}
      {isRescheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-overlay/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
              <h3 className="text-body font-bold text-neutral-900">
                {t('ui.rescheduleAuditPlanV')}{plan.version} → v{plan.version + 1})
              </h3>
              <button
                type="button"
                onClick={() => setIsRescheduleModalOpen(false)}
                className="text-neutral-500 hover:text-neutral-700 text-body-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleConfirmReschedule} className="space-y-4 text-body-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-body-sm font-medium text-neutral-800 block mb-1">{t('ui.newStartDate')} *</label>
                  <input
                    type="date"
                    value={rescheduleStart}
                    onChange={(e) => setRescheduleStart(e.target.value)}
                    required
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900"
                  />
                </div>
                <div>
                  <label className="text-body-sm font-medium text-neutral-800 block mb-1">{t('ui.newEndDate')} *</label>
                  <input
                    type="date"
                    value={rescheduleEnd}
                    onChange={(e) => setRescheduleEnd(e.target.value)}
                    required
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-body-sm font-medium text-neutral-800 block mb-1">{t('ui.rescheduleReason')} *</label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  required
                  rows={3}
                  className="w-full rounded-md border border-neutral-100 bg-white p-3 text-body-sm text-neutral-900"
                />
              </div>

              <p className="text-caption text-neutral-500">
                {t('ui.rescheduleNote')}
              </p>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsRescheduleModalOpen(false)}
                  className="h-11 rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
                >
                  {t('ui.confirmReschedule')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Add / Edit Activity Modal */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-overlay/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
              <h3 className="text-body font-bold text-neutral-900">
                {editingActivity ? t('ui.editActivity') : t('ui.addAgendaActivity')}
              </h3>
              <button
                type="button"
                onClick={() => setIsActivityModalOpen(false)}
                className="text-neutral-500 hover:text-neutral-700 text-body-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-4 text-body-sm">
              <div>
                <label className="text-body-sm font-medium text-neutral-800 block mb-1">{t('ui.activityTitle')} *</label>
                <input
                  type="text"
                  value={actTitle}
                  onChange={(e) => setActTitle(e.target.value)}
                  placeholder={t('ui.activityTitlePlaceholder')}
                  required
                  className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-body-sm font-medium text-neutral-800 block mb-1">{t('ui.date')} *</label>
                  <input
                    type="date"
                    value={actDate}
                    onChange={(e) => setActDate(e.target.value)}
                    required
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900"
                  />
                </div>
                <div>
                  <label className="text-body-sm font-medium text-neutral-800 block mb-1">{t('ui.startAst')} *</label>
                  <input
                    type="time"
                    value={actStartTime}
                    onChange={(e) => setActStartTime(e.target.value)}
                    required
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900"
                  />
                </div>
                <div>
                  <label className="text-body-sm font-medium text-neutral-800 block mb-1">{t('ui.endAst')} *</label>
                  <input
                    type="time"
                    value={actEndTime}
                    onChange={(e) => setActEndTime(e.target.value)}
                    required
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-body-sm font-medium text-neutral-800 block mb-1">{t('ui.auditor')} *</label>
                  <select
                    value={actAuditors}
                    onChange={(e) => setActAuditors(e.target.value)}
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900"
                  >
                    {[...new Set([leadAuditor, ...auditTeam.map((a) => a.replace(' (Lead)', ''))])].map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                    <option value={auditTeam.map((a) => a.replace(' (Lead)', '')).join(', ')}>{auditTeam.map((a) => a.replace(' (Lead)', '')).join(', ')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-body-sm font-medium text-neutral-800 block mb-1">{t('ui.durationHours')} *</label>
                  <input
                    type="number"
                    step="0.5"
                    value={actDuration}
                    onChange={(e) => setActDuration(parseFloat(e.target.value) || 0)}
                    required
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                {editingActivity ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteActivity(editingActivity.id)
                      setIsActivityModalOpen(false)
                    }}
                    className="text-error-700 font-medium text-body-sm hover:underline"
                  >
                    {t('ui.deleteActivity')}
                  </button>
                ) : <span />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsActivityModalOpen(false)}
                    className="h-11 rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
                  >
                    {t('ui.saveActivity')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      <PlanSectionDialogs
        plan={plan}
        section={editSection}
        team={auditTeam.map((a) => a.replace(' (Lead)', ''))}
        onClose={() => setEditSection(null)}
        onSaved={onSectionSaved}
      />
      <ImportWizard
        open={importOpen}
        onOpenChange={(next) => {
          setImportOpen(next)
          if (!next) setImportBatchId(null)
        }}
        batchId={importBatchId}
        definitionKey="audit_plan_sections"
        context={{ auditPlanId: plan.id }}
        onImported={() => {
          fetchAuditPlanById(plan.id)
            .then((fresh) => fresh && applyPlanData(fresh))
            .catch(() => undefined)
        }}
      />
    </CabLayout>
  )
}
