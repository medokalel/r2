import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast as appToast } from '@/lib/toast'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { activityText } from '@/lib/activityText'
import { enumLabel } from '@/lib/enumLabel'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useDecisionDetailsTourSteps } from '@/config/decisionDetailsTourSteps'
import { Button } from '@/components/ui/Button'
import {
  AppIcon,
  ArrowRightIcon,
  CommentIcon,
  HistoryIcon,
  InfoIcon,
  LockIcon,
  ShieldIcon,
  SuccessCircleIcon,
  UsersIcon,
} from '@/components/icons'
import {
  DECISION_FIELD_KEYS,
  DECISION_OUTCOME_OPTIONS,
  completeTechnicalReview,
  evaluateGates,
  getDecisionById,
  openCorrectionVersion,
  recordDecision,
  saveDecisionDraft,
  type DecisionDetail,
  type DecisionOutcome,
  type DraftInput,
} from '@/lib/api/cabDecisionsApi'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { notSet } from '@/lib/emptyValue'
import { buttonVariants } from '@/components/ui/buttonVariants'

const cardClassName = 'rounded-lg border border-neutral-100 bg-white'

type TabKey = 'evidence' | 'findings' | 'activity'

function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: 'amber' | 'green' | 'red' | 'blue' | 'neutral' }) {
  const tones: Record<string, string> = {
    amber: 'bg-warning-50 text-warning-700',
    green: 'bg-success-50 text-success-500',
    red: 'bg-error-50 text-error-500',
    blue: 'bg-primary-50 text-primary',
    neutral: 'bg-neutral-50 text-neutral-700',
  }
  return (
    <span className={cn('inline-flex items-center rounded-sm px-3 py-1.5 text-body-sm font-medium leading-none', tones[tone])}>
      {label}
    </span>
  )
}

function GateRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-body-sm text-neutral-800">{label}</span>
      {ok ? (
        <AppIcon icon={SuccessCircleIcon} size={16} className="text-success-500" />
      ) : (
        <span className="flex size-4 items-center justify-center text-caption font-bold text-error-700">✕</span>
      )}
    </div>
  )
}

function SummaryField({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-body-sm font-medium text-neutral-600">{label}</p>
      <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-body-sm font-semibold text-neutral-900">
        {icon && <span className="shrink-0 text-neutral-500">{icon}</span>}
        <span className="min-w-0 break-words">{value || notSet()}</span>
      </p>
    </div>
  )
}

/** i18n keys of the gate messages the data layer returns in English. */
const BLOCKER_KEYS: Record<string, string> = {
  'Technical review is not complete.': 'cab.decisionDetails.blockers.technicalReview',
  'There are unresolved findings. All findings must be closed or accepted before a decision can be recorded.': 'cab.decisionDetails.blockers.findingsOpen',
  'Select an authorized decision-maker.': 'cab.decisionDetails.blockers.selectMaker',
  'Selected user is not authorized as decision-maker.': 'cab.decisionDetails.blockers.makerNotAuthorized',
  'Decision-maker must be independent from the audit team.': 'cab.decisionDetails.blockers.makerNotIndependent',
  'Rationale is required.': 'cab.decisionDetails.blockers.rationale',
  'Confirmed scope is required.': 'cab.decisionDetails.blockers.scope',
  'Decision date is required.': 'cab.decisionDetails.blockers.date',
  'Outcome is required.': 'cab.decisionDetails.blockers.outcome',
}

export function CabDecisionDetailsPage() {
  const { decisionId } = useParams<{ decisionId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const outcomeLabel = (value: string | null | undefined): string => {
    if (!value) return ''
    const fallback = DECISION_OUTCOME_OPTIONS.find((o) => o.value === value)?.label ?? value
    return t(`cab.decisionDetails.outcomes.${value}`, { defaultValue: fallback })
  }
  const tourSteps = useDecisionDetailsTourSteps()

  const [detail, setDetail] = useState<DecisionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [notFound, setNotFound] = useState(false)

  // Draft form — stable keys via DECISION_FIELD_KEYS (shared with the portal).
  const [outcome, setOutcome] = useState<DecisionOutcome | ''>('')
  const [rationale, setRationale] = useState('')
  const [decisionMakerId, setDecisionMakerId] = useState('')
  const [decisionDate, setDecisionDate] = useState('')
  const [confirmedScope, setConfirmedScope] = useState('')

  const [dirty, setDirty] = useState(false)
  const [showDiscard, setShowDiscard] = useState(false)
  const [saving, setSaving] = useState<'draft' | 'record' | 'correction' | 'review' | null>(null)
  const [saveError, setSaveError] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('evidence')

  /** Puts a loaded decision (or "not found") into the page and the draft form. */
  const applyDetail = useCallback((d: DecisionDetail | null) => {
    if (!d) {
      setNotFound(true)
      setDetail(null)
      return
    }
    const preferred = d.decisionMakers.find((m) => m.authorized && m.independentFromAudit)
    setNotFound(false)
    setDetail(d)
    setOutcome(d.record.outcome ?? '')
    setRationale(d.record.rationale || '')
    setDecisionMakerId(d.record.decisionMakerId || preferred?.id || '')
    setDecisionDate(d.record.decisionDate || d.dueDateRaw || '')
    setConfirmedScope(d.record.confirmedScope || d.proposedScope)
    setDirty(false)
    setSaveError('')
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      applyDetail(await getDecisionById(decisionId || ''))
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : t('ui.decisionLoadFailed'))
    } finally {
      setLoading(false)
    }
  }, [decisionId, applyDetail, t])

  useEffect(() => {
    let cancelled = false
    getDecisionById(decisionId || '')
      .then((d) => {
        if (!cancelled) applyDetail(d)
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : t('ui.decisionLoadFailed'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [decisionId, applyDetail, t])

  const draft = useMemo<DraftInput>(
    () => ({ outcome: outcome || null, rationale, decisionMakerId, decisionDate, confirmedScope }),
    [outcome, rationale, decisionMakerId, decisionDate, confirmedScope],
  )

  const gates = useMemo(() => (detail ? evaluateGates(detail, draft) : null), [detail, draft])

  const gateRows = gates
    ? [
        { label: t('cab.decisionDetails.gates.technicalReview', 'Technical review completed'), ok: gates.technicalReviewCompleted },
        { label: t('cab.decisionDetails.gates.findingsClosed', 'Findings closed or accepted'), ok: gates.findingsClosed },
        { label: t('cab.decisionDetails.gates.makerAuthorized', 'Decision maker authorized'), ok: gates.makerAuthorized },
        { label: t('cab.decisionDetails.gates.makerIndependent', 'Decision maker independent from audit'), ok: gates.makerIndependent },
        { label: t('cab.decisionDetails.gates.scopeOk', 'Confirmed scope provided'), ok: gates.scopeOk },
        { label: t('cab.decisionDetails.gates.rationaleOk', 'Rationale provided'), ok: gates.rationaleOk },
        { label: t('cab.decisionDetails.gates.dateOk', 'Decision date provided'), ok: gates.dateOk },
      ]
    : []

  const immutable = Boolean(detail?.record.immutable)
  const record = detail?.record

  const showToast = (msg: string) => {
    appToast.success(msg)
  }

  const handleSaveDraft = async () => {
    if (!detail) return
    setSaving('draft')
    setSaveError('')
    try {
      // Draft save permits incomplete later-stage data — gates are never validated here.
      const updated = await saveDecisionDraft(detail.id, { ...draft, version: detail.record.version })
      setDetail(updated)
      setDirty(false)
      showToast(t('cab.decisionDetails.draftSaved', 'Draft saved. Your values are preserved.'))
    } catch (e) {
      // A failed save keeps the in-form values intact.
      setSaveError(e instanceof Error ? e.message : t('ui.saveFailedPreserved'))
      if ((e as Error & { code?: string }).code === 'CONFLICT_IMMUTABLE') {
        void load()
      }
    } finally {
      setSaving(null)
    }
  }

  const handleRecordDecision = async () => {
    if (!detail || !draft.outcome) {
      setSaveError(t('cab.decisionDetails.selectOutcomeBefore', 'Select an outcome before recording the decision.'))
      return
    }
    if (gates && !gates.canRecord) {
      setSaveError(gates.blockers.map((text) => t(BLOCKER_KEYS[text] ?? text, { defaultValue: text })).join(' '))
      return
    }
    setSaving('record')
    setSaveError('')
    try {
      // Submission requires configured gates; recorded outcome is immutable.
      const updated = await recordDecision(detail.id, { ...draft, outcome: draft.outcome as DecisionOutcome })
      setDetail(updated)
      setDirty(false)
      const label = outcomeLabel(updated.record.outcome)
      showToast(
        updated.record.outcome === 'grant'
          ? t('cab.decisionDetails.toasts.recordedGrant', {
              label,
              defaultValue: 'Decision recorded ({{label}}). Certificate issuance is now enabled for this client.',
            })
          : t('cab.decisionDetails.toasts.recorded', { label, defaultValue: 'Decision recorded ({{label}}).' }),
      )
    } catch (e) {
      const code = (e as Error & { code?: string }).code
      if (code === 'CONFLICT_IMMUTABLE') {
        setSaveError(
          t(
            'cab.decisionDetails.conflictImmutable',
            'This outcome was already recorded elsewhere. The immutable record is shown; corrections require a controlled version.',
          ),
        )
        void load()
      } else {
        setSaveError(e instanceof Error ? e.message : t('ui.decisionRecordFailed'))
      }
    } finally {
      setSaving(null)
    }
  }

  const handleOpenCorrection = async () => {
    if (!detail) return
    setSaving('correction')
    setSaveError('')
    try {
      const updated = await openCorrectionVersion(detail.id)
      setDetail(updated)
      setDirty(false)
      showToast(
        t('cab.decisionDetails.toasts.correctionOpened', {
          version: updated.record.version,
          defaultValue: 'Controlled correction version v{{version}} opened. Every change stays traceable.',
        }),
      )
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : t('ui.correctionOpenFailed'))
    } finally {
      setSaving(null)
    }
  }

  const handleCompleteTechnicalReview = async () => {
    if (!detail) return
    setSaving('review')
    setSaveError('')
    try {
      setDetail(await completeTechnicalReview(detail.id))
      showToast(t('cab.decisionDetails.technicalReviewDone', 'Technical review completed. The file is ready for decision.'))
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : t('ui.decisionRecordFailed'))
    } finally {
      setSaving(null)
    }
  }

  const goBack = () => {
    if (dirty) {
      setShowDiscard(true)
      return
    }
    navigate(ROUTES.cabDecisions)
  }

  if (loading) {
    return (
      <CabLayout sidebarVariant="decisions" tourId="cab-decision-details" tourSteps={tourSteps}>
        <CabHeader title={t('cab.decisionDetails.header', 'Decisions')} />
        <div className="flex flex-1 flex-col gap-4 overflow-auto page-main">
          <div className="h-5 w-44 rounded-lg bg-primary-50" aria-hidden />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className={cn(cardClassName, 'min-h-[360px] p-5')}>
              <div className="skeleton h-5 w-44" />
              <div className="mt-5 space-y-3">
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-4 w-5/6" />
              </div>
            </div>
            <div className={cn(cardClassName, 'min-h-[360px] p-5')}>
              <div className="skeleton h-5 w-36" />
              <div className="mt-5 space-y-3">
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </CabLayout>
    )
  }

  if (notFound) {
    return (
      <CabLayout sidebarVariant="decisions" tourId="cab-decision-details" tourSteps={tourSteps}>
        <CabHeader title={t('cab.decisionDetails.header', 'Decisions')} />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className={cn(cardClassName, 'mx-auto max-w-md p-8 text-center')}>
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-error-50 text-error-500">
              <AppIcon icon={LockIcon} size={22} />
            </div>
            <h2 className="text-body font-bold text-neutral-900">{t('cab.decisionDetails.notFound.title', 'Decision not available')}</h2>
            <p className="mt-2 text-body-sm leading-relaxed text-neutral-600">
              {t('cab.decisionDetails.notFound.message', 'This record does not exist or your account cannot access it. Decision records are scoped to a single CAB-client relationship and are never shared across tenants.')}
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.cabDecisions)}>
                {t('cab.decisionDetails.notFound.back', 'Back to decision queue')}
              </Button>
            </div>
          </div>
        </div>
      </CabLayout>
    )
  }

  if (loadError || !detail) {
    return (
      <CabLayout sidebarVariant="decisions" tourId="cab-decision-details" tourSteps={tourSteps}>
        <CabHeader title={t('cab.decisionDetails.header', 'Decisions')} />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className={cn(cardClassName, 'mx-auto max-w-md p-8 text-center')}>
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-error-50 text-error-500">
              <AppIcon icon={SuccessCircleIcon} size={22} />
            </div>
            <h2 className="text-body font-bold text-neutral-900">{t('errors.title', 'Something went wrong')}</h2>
            <p className="mt-2 text-body-sm leading-relaxed text-neutral-600">
              {loadError || t('errors.generic', 'We could not load this decision record.')}
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => void load()}>
                {t('errors.retry', 'Try again')}
              </Button>
            </div>
          </div>
        </div>
      </CabLayout>
    )
  }

  const selectedMaker = detail.decisionMakers.find((m) => m.id === decisionMakerId) ?? null
  const recordMaker = record?.decisionMakerId ? detail.decisionMakers.find((m) => m.id === record!.decisionMakerId) : null

  return (
    <CabLayout sidebarVariant="decisions" tourId="cab-decision-details" tourSteps={tourSteps}>
      <CabHeader title={detail.decisionId} subtitle={t('cab.decisionDetails.header', 'Decisions')} notificationCount={2} />

      <div className="flex flex-1 flex-col gap-4 overflow-auto page-main">
        {/* Breadcrumb & Header Bar */}
        <CabTourStep steps={tourSteps} stepId="decision-details-header">
          <div className="flex flex-col gap-3">
            <nav className="flex items-center gap-2 text-body-sm font-medium text-neutral-600">
              <button type="button" onClick={goBack} className="hover:text-primary transition-colors">
                {t('cab.decisionDetails.header', 'Decisions')}
              </button>
              <span>/</span>
              <span className="text-neutral-800 font-semibold">{detail.decisionId}</span>
            </nav>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary">
                  <AppIcon icon={SuccessCircleIcon} size={22} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-section-title text-text-primary">{detail.decisionId}</h1>
                    <StatusBadge
                      label={
                        immutable && record
                          ? `${t('cab.decisionDetails.recordedTag', 'Recorded')} · v${record.version}`
                          : t(`cab.decisions.statuses.${detail.reviewStatus}`, { defaultValue: detail.reviewStatusLabel })
                      }
                      tone={immutable ? 'green' : detail.reviewStatus === 'awaiting_technical_review' ? 'amber' : detail.reviewStatus === 'decided_refused' ? 'red' : 'blue'}
                    />
                  </div>
                  <p className="mt-1 text-body-sm text-neutral-600">
                    {detail.clientName} · {detail.scheme}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex h-11 items-center gap-2 rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
                >
                  <AppIcon icon={ArrowRightIcon} size={14} className="rotate-180 rtl:rotate-0" />
                  <span>{t('cab.decisionDetails.queue', 'Queue')}</span>
                </button>
                {!immutable && !detail.technicalReviewCompleted && (
                  <button
                    type="button"
                    onClick={() => void handleCompleteTechnicalReview()}
                    disabled={saving === 'review'}
                    className="flex h-11 items-center gap-2 rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50 transition-colors disabled:opacity-60"
                  >
                    <AppIcon icon={SuccessCircleIcon} size={16} />
                    <span>{t('cab.decisionDetails.completeTechnicalReview', 'Mark technical review complete')}</span>
                  </button>
                )}
                {immutable ? (
                  <button
                    type="button"
                    onClick={() => void handleOpenCorrection()}
                    disabled={saving === 'correction'}
                    className="flex h-11 items-center gap-2 rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50 transition-colors disabled:opacity-60"
                  >
                    <AppIcon icon={HistoryIcon} size={16} />
                    <span>{saving === 'correction' ? t('cab.decisionDetails.opening', 'Opening…') : t('cab.decisionDetails.openCorrection', 'Open controlled correction')}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleRecordDecision()}
                    disabled={saving === 'record'}
                    className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
                  >
                    <AppIcon icon={LockIcon} size={16} />
                    <span>{saving === 'record' ? t('cab.decisionDetails.recording', 'Recording…') : t('cab.decisionDetails.recordDecision', 'Record decision')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </CabTourStep>

        {saveError && (
          <div className="flex items-start gap-2 rounded-md border border-error-100 bg-error-50 px-4 py-3 text-body-sm font-medium text-error-700">
            <AppIcon icon={InfoIcon} size={16} className="mt-0.5 shrink-0" />
            <span className="min-w-0">{saveError}</span>
            <button type="button" onClick={() => setSaveError('')} className="ms-auto shrink-0 hover:opacity-70" aria-label={t('common.dismiss')}>
              ✕
            </button>
          </div>
        )}

        <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* LEFT column */}
          <div className="flex min-w-0 flex-col gap-5">
            {/* Readiness gates */}
            <CabTourStep steps={tourSteps} stepId="decision-details-gates">
              <section className={cn(cardClassName, 'overflow-hidden')}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <AppIcon icon={ShieldIcon} size={18} className="text-primary" />
                    <h2 className="text-body font-bold text-neutral-900">{t('cab.decisionDetails.readinessTitle', 'Readiness to record')}</h2>
                  </div>
                  {gates?.canRecord ? (
                    <StatusBadge label={t('cab.decisionDetails.allGatesPassed', 'All gates passed')} tone="green" />
                  ) : (
                    <StatusBadge label={t('cab.decisionDetails.incomplete', 'Incomplete')} tone="amber" />
                  )}
                </div>
                <div className="px-5 py-4">
                  <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
                    {gateRows.map((g) => (
                      <GateRow key={g.label} label={g.label} ok={g.ok} />
                    ))}
                  </div>
                  {gates && gates.blockers.length > 0 && (
                    <div className="mt-4 rounded-md border border-error-50 bg-error-25 px-4 py-3">
                      <p className="text-body-sm font-semibold text-error-700">{t('cab.decisionDetails.blockingGates', 'Blocking gates')}</p>
                      <ul className="mt-1.5 list-disc space-y-1 ps-4 text-body-sm text-error-800">
                        {gates.blockers.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-4 flex items-start gap-2 rounded-md bg-primary-25 px-4 py-3 text-body-sm leading-relaxed text-indigo-800">
                    <AppIcon icon={InfoIcon} size={16} className="mt-0.5 shrink-0" />
                    <p>{t('cab.decisionDetails.gatesInfo', 'A certification decision is separate from application acceptance. Certificates are enabled only after an authorized grant decision is recorded. No automated grant is made based on payment.')}</p>
                  </div>
                </div>
              </section>
            </CabTourStep>

            {/* Decision record / immutable outcome */}
            <CabTourStep steps={tourSteps} stepId="decision-details-record">
              <section className={cn(cardClassName, 'overflow-hidden')}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 px-5 py-4">
                  <div className="flex items-center gap-2">
                    {immutable ? <AppIcon icon={LockIcon} size={18} className="text-success-500" /> : <AppIcon icon={HistoryIcon} size={18} className="text-primary" />}
                    <h2 className="text-body font-bold text-neutral-900">
                      {immutable ? t('cab.decisionDetails.recordedDecision', 'Recorded decision (immutable)') : t('cab.decisionDetails.decisionRecord', 'Decision record')}
                    </h2>
                  </div>
                  {immutable ? (
                    <StatusBadge label={`v${record?.version ?? 1} · ${t('cab.decisionDetails.recordedTag', 'recorded')}`} tone="green" />
                  ) : (
                    <StatusBadge label={`v${record?.version ?? 1} · ${t('cab.decisionDetails.draftTag', 'draft')}`} tone="neutral" />
                  )}
                </div>

                {immutable && record ? (
                  <div className="px-5 py-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <SummaryField
                        label={t('cab.decisionDetails.outcome', 'Outcome')}
                        value={record.outcome ? outcomeLabel(record.outcome) : ''}
                      />
                      <SummaryField label={t('cab.decisionDetails.decisionMaker', 'Decision maker')} value={recordMaker?.name ?? record.decisionMakerId ?? ''} />
                      <SummaryField label={t('cab.decisionDetails.decisionDate', 'Decision date')} value={record.decisionDate || ''} />
                      <SummaryField label={t('cab.decisionDetails.recommendedBy', 'Recorded by')} value={`${record.recordedBy ?? ''}${record.recordedAt ? ` · ${record.recordedAt}` : ''}`} />
                      <div className="sm:col-span-2">
                        <SummaryField label={t('cab.decisionDetails.confirmedScope', 'Confirmed scope')} value={record.confirmedScope} />
                      </div>
                      <div className="sm:col-span-2">
                        <SummaryField label={t('cab.decisionDetails.rationale', 'Rationale')} value={record.rationale} />
                      </div>
                    </div>
                    <div className="mt-4 flex items-start gap-2 rounded-md border border-success-100 bg-success-25 px-4 py-3 text-body-sm leading-relaxed text-success-800">
                      <AppIcon icon={LockIcon} size={16} className="mt-0.5 shrink-0" />
                      <p>{t('cab.decisionDetails.immutableInfo', 'Recorded outcomes are immutable. Changes are only possible through a controlled correction version that keeps the full decision history.')}</p>
                    </div>
                  </div>
                ) : (
                  <form className="px-5 py-4" onSubmit={(e) => { e.preventDefault(); void handleRecordDecision() }}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <label className="flex flex-col gap-1.5 text-body-sm font-medium text-neutral-800">
                        {t('cab.decisionDetails.outcome', 'Outcome')}
                        <select
                          name={DECISION_FIELD_KEYS.outcome}
                          value={outcome}
                          onChange={(e) => { setOutcome(e.target.value as DecisionOutcome | ''); setDirty(true); setSaveError('') }}
                          className={cn(
                            'h-11 w-full cursor-pointer rounded-md border bg-white px-3 text-body-sm text-neutral-900 outline-none transition focus:border-primary',
                            dirty && outcome === '' ? 'border-error-500' : 'border-neutral-100',
                          )}
                        >
                          <option value="">{t('cab.decisionDetails.selectOutcome', 'Select outcome…')}</option>
                          {DECISION_OUTCOME_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {outcomeLabel(o.value)}
                            </option>
                          ))}
                        </select>
                        {outcome === 'grant' && (
                          <span className="text-caption font-normal text-neutral-600">
                            {t('cab.decisionDetails.grantNote', 'Certificates become available only after this grant is recorded.')}
                          </span>
                        )}
                      </label>

                      <label className="flex flex-col gap-1.5 text-body-sm font-medium text-neutral-800">
                        {t('cab.decisionDetails.decisionDate', 'Decision date')}
                        <input
                          type="date"
                          name={DECISION_FIELD_KEYS.decisionDate}
                          value={decisionDate}
                          onChange={(e) => { setDecisionDate(e.target.value); setDirty(true); setSaveError('') }}
                          className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900 outline-none focus:border-primary"
                        />
                      </label>

                      <label className="flex flex-col gap-1.5 text-body-sm font-medium text-neutral-800">
                        {t('cab.decisionDetails.confirmedScope', 'Confirmed scope')}
                        <textarea
                          name={DECISION_FIELD_KEYS.confirmedScope}
                          value={confirmedScope}
                          rows={3}
                          onChange={(e) => { setConfirmedScope(e.target.value); setDirty(true); setSaveError('') }}
                          className="w-full resize-y rounded-md border border-neutral-100 bg-white px-3 py-2.5 text-body-sm leading-relaxed text-neutral-900 outline-none focus:border-primary"
                        />
                      </label>

                      <label className="flex flex-col gap-1.5 text-body-sm font-medium text-neutral-800 sm:col-span-2">
                        {t('cab.decisionDetails.rationale', 'Rationale')}
                        <textarea
                          name={DECISION_FIELD_KEYS.rationale}
                          value={rationale}
                          rows={4}
                          onChange={(e) => { setRationale(e.target.value); setDirty(true); setSaveError('') }}
                          placeholder={t('cab.decisionDetails.rationalePlaceholder', 'Explain your decision. Written notes take precedence over any generated microcopy shown to the client.')}
                          className="w-full resize-y rounded-md border border-neutral-100 bg-white px-3 py-2.5 text-body-sm leading-relaxed text-neutral-900 outline-none placeholder:text-neutral-500 focus:border-primary"
                        />
                      </label>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-neutral-100 pt-4">
                      <button
                        type="button"
                        onClick={() => void handleSaveDraft()}
                        disabled={saving === 'draft'}
                        className="flex h-11 items-center justify-center rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50 transition-colors disabled:opacity-60"
                      >
                        {saving === 'draft' ? t('cab.decisionDetails.saving', 'Saving…') : t('cab.decisionDetails.saveDraft', 'Save draft')}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRecordDecision()}
                        disabled={saving === 'record' || !outcome}
                        className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'justify-center')}
                      >
                        {saving === 'record' ? t('cab.decisionDetails.recording', 'Recording…') : t('cab.decisionDetails.recordDecision', 'Record decision')}
                      </button>
                    </div>
                    <p className="mt-2 text-caption text-neutral-600">
                      {t('cab.decisionDetails.draftInfo', 'Saving a draft keeps incomplete data. Recording requires all gates above to pass.')}
                    </p>
                  </form>
                )}
              </section>
            </CabTourStep>

            {/* Evidence / Findings / Activity tabs */}
            <CabTourStep steps={tourSteps} stepId="decision-details-tabs">
              <section className={cn(cardClassName, 'overflow-hidden')}>
                <div className="flex flex-wrap items-center gap-1 overflow-x-auto border-b border-neutral-100 px-3">
                  {([
                    { key: 'evidence', label: t('cab.decisionDetails.tabs.evidence', 'Evidence'), icon: LockIcon },
                    { key: 'findings', label: t('cab.decisionDetails.tabs.findings', 'Findings'), icon: ShieldIcon },
                    { key: 'activity', label: t('cab.decisionDetails.tabs.activity', 'Activity'), icon: HistoryIcon },
                  ] as Array<{ key: TabKey; label: string; icon: typeof LockIcon }>).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        'flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-body-sm font-semibold transition-colors',
                        activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-neutral-600 hover:text-neutral-800',
                      )}
                    >
                      <AppIcon icon={tab.icon} size={15} />
                      {tab.label}
                      {tab.key === 'evidence' && detail.evidence.length > 0 && (
                        <span className="rounded-full bg-primary-50 px-2 py-0.5 text-caption font-semibold text-primary">{detail.evidence.length}</span>
                      )}
                      {tab.key === 'findings' && detail.findings.length > 0 && (
                        <span className="rounded-full bg-primary-50 px-2 py-0.5 text-caption font-semibold text-primary">{detail.findings.length}</span>
                      )}
                    </button>
                  ))}
                </div>

                {activeTab === 'evidence' && (
                  <div className="px-5 py-4">
                    <ul className="space-y-3">
                      {detail.evidence.length === 0 ? (
                        <li className="text-body-sm text-neutral-500">{t('cab.decisionDetails.emptyEvidence', 'No evidence documents recorded.')}</li>
                      ) : (
                        detail.evidence.map((doc) => (
                          <li key={doc.id} className="flex items-start justify-between gap-3 rounded-md border border-neutral-100 px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-body-sm font-semibold text-neutral-900">{doc.name}</p>
                              <p className="mt-0.5 text-body-sm text-neutral-600">{doc.docTypeLabel} · v{doc.version} · {doc.date}</p>
                            </div>
                            <span
                              className={cn(
                                'inline-flex shrink-0 items-center rounded-sm px-2.5 py-1 text-caption font-medium',
                                doc.status === 'Final'
                                  ? 'bg-success-50 text-success-600'
                                  : doc.status === 'Open'
                                    ? 'bg-warning-50 text-warning-700'
                                    : 'bg-primary-50 text-primary',
                              )}
                            >
                              {enumLabel(t, doc.status)}
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}

                {activeTab === 'findings' && (
                  <div className="px-5 py-4">
                    <ul className="space-y-3">
                      {detail.findings.length === 0 ? (
                        <li className="text-body-sm text-neutral-500">{t('cab.decisionDetails.emptyFindings', 'No audit findings recorded.')}</li>
                      ) : (
                        detail.findings.map((f) => (
                          <li key={f.id} className="rounded-md border border-neutral-100 px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-body-sm font-semibold text-neutral-900">{f.requirement}</p>
                              <span
                                className={cn(
                                  'inline-flex shrink-0 items-center rounded-sm px-2.5 py-1 text-caption font-medium',
                                  f.severity === 'Major' ? 'bg-error-50 text-error-500' : 'bg-warning-50 text-warning-700',
                                )}
                              >
                                {f.severity}
                              </span>
                            </div>
                            <p className="mt-1 text-body-sm leading-relaxed text-neutral-700">{f.description}</p>
                            <p className="mt-1.5 text-caption font-medium text-neutral-600">{t('ui.statusLabel')} {f.status}</p>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div className="px-5 py-4">
                    <ul className="space-y-3">
                      {detail.activity.length === 0 ? (
                        <li className="text-body-sm text-neutral-500">{t('cab.decisionDetails.emptyActivity', 'No activity recorded yet.')}</li>
                      ) : (
                        detail.activity.map((a) => (
                          <li key={a.id} className="flex items-start gap-3">
                            <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
                            <div className="min-w-0">
                              <p className="text-body-sm text-neutral-800">{activityText(t, a.text)}</p>
                              <p className="mt-0.5 text-caption text-neutral-500">{a.by} · {a.at}</p>
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </section>
            </CabTourStep>
          </div>

          <aside className="flex min-w-0 flex-col gap-5">
            {/* Decision maker */}
            <CabTourStep steps={tourSteps} stepId="decision-details-sidebar">
              <section className={cn(cardClassName, 'overflow-hidden')}>
                <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-4">
                  <AppIcon icon={UsersIcon} size={18} className="text-primary" />
                  <h2 className="text-body font-bold text-neutral-900">{t('cab.decisionDetails.decisionMaker', 'Decision maker')}</h2>
                </div>
                <div className="px-5 py-4">
                  {immutable ? (
                    <SummaryField label={t('cab.decisionDetails.decisionMaker', 'Decision maker')} value={recordMaker?.name ?? record?.decisionMakerId ?? notSet()} />
                  ) : (
                    <label className="flex flex-col gap-1.5 text-body-sm font-medium text-neutral-800">
                      {t('cab.decisionDetails.decisionMaker', 'Decision maker')}
                      <select
                        name={DECISION_FIELD_KEYS.decisionMaker}
                        value={decisionMakerId}
                        onChange={(e) => { setDecisionMakerId(e.target.value); setDirty(true); setSaveError('') }}
                        className="h-11 w-full cursor-pointer rounded-md border border-neutral-100 bg-white px-3 text-body-sm font-normal text-neutral-900 outline-none focus:border-primary"
                      >
                        <option value="">{t('cab.decisionDetails.selectDecisionMaker', 'Select decision maker…')}</option>
                        {detail.decisionMakers.map((maker) => (
                          <option key={maker.id} value={maker.id}>
                            {maker.name}
                            {maker.authorized ? ` (${t('cab.decisionDetails.authorizedMaker', 'authorized')})` : ''}
                            {maker.independentFromAudit ? '' : ` (${t('cab.decisionDetails.notIndependentMaker', 'audit team')})`}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {selectedMaker && (
                    <span
                      className={cn(
                        'mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption font-medium',
                        !selectedMaker.authorized || !selectedMaker.independentFromAudit ? 'text-warning-700' : 'text-success-700',
                      )}
                    >
                      {selectedMaker.authorized
                        ? `✓ ${t('cab.decisionDetails.authorizedMaker', 'Authorized decision maker')}`
                        : `✕ ${t('cab.decisionDetails.notAuthorizedMaker', 'Not in decision authority')}`}
                      {selectedMaker.independentFromAudit
                        ? `· ✓ ${t('cab.decisionDetails.independentMaker', 'Independent from audit')}`
                        : `· ✕ ${t('cab.decisionDetails.notIndependentMaker', 'Part of audit team')}`}
                    </span>
                  )}
                  <div className="mt-4 flex items-start gap-2 rounded-md bg-primary-25 px-4 py-3 text-body-sm leading-relaxed text-indigo-800">
                    <AppIcon icon={InfoIcon} size={16} className="mt-0.5 shrink-0" />
                    <p>{t('cab.decisionDetails.makerInfo', 'Authorization and audit independence are verified separately from auditor roles and are required before recording a grant.')}</p>
                  </div>
                </div>
              </section>
            </CabTourStep>

            {/* Application summary */}
            <section className={cn(cardClassName, 'overflow-hidden')}>
              <div className="border-b border-neutral-100 px-5 py-4">
                <h2 className="text-body font-bold text-neutral-900">{t('cab.decisionDetails.applicationSummary', 'Application summary')}</h2>
              </div>
              <div className="space-y-3.5 px-5 py-4">
                <SummaryField label={t('cab.decisionDetails.client', 'Client')} value={detail.clientName} />
                <SummaryField label={t('cab.decisionDetails.application', 'Application')} value={detail.applicationId} />
                <SummaryField label={t('cab.decisionDetails.scheme', 'Scheme')} value={detail.applicationScheme || detail.scheme} />
                <SummaryField label={t('cab.decisionDetails.country', 'Country')} value={detail.clientCountry || detail.country} />
                <SummaryField label={t('cab.decisionDetails.stage', 'Stage')} value={`${detail.currentStage}${detail.currentStageDetail ? `: ${detail.currentStageDetail}` : ''}`} />
                <div className="grid grid-cols-2 gap-3">
                  <SummaryField label={t('cab.decisionDetails.received', 'Received')} value={detail.receivedDate} />
                  <SummaryField label={t('cab.decisionDetails.due', 'Due')} value={detail.dueDate} />
                </div>
              </div>
            </section>

            {/* Technical recommendation */}
            {detail.recommendationText && (
              <section className={cn(cardClassName, 'overflow-hidden')}>
                <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-4">
                  <AppIcon icon={CommentIcon} size={16} className="text-primary" />
                  <h2 className="text-body font-bold text-neutral-900">{t('cab.decisionDetails.technicalRecommendation', 'Technical recommendation')}</h2>
                </div>
                <div className="space-y-3 px-5 py-4">
                  <SummaryField label={t('cab.decisionDetails.recommendedBy', 'Recommended by')} value={`${detail.recommendationBy}${detail.recommendationDate ? ` · ${detail.recommendationDate}` : ''}`} />
                  <p className="text-body-sm leading-relaxed text-neutral-800">{detail.recommendationText}</p>
                </div>
              </section>
            )}
          </aside>
        </div>
        {showDiscard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <div className="w-full max-w-sm rounded-lg border border-neutral-100 bg-white p-6 shadow-xl">
              <h2 className="text-body font-bold text-neutral-900">{t('cab.decisionDetails.discard.title', 'Discard unsaved changes?')}</h2>
              <p className="mt-2 text-body-sm leading-relaxed text-neutral-600">
                {t('cab.decisionDetails.discard.message', 'You have unsaved changes to this decision draft. Leaving now will discard them.')}
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowDiscard(false)}>
                  {t('cab.decisionDetails.discard.keep', 'Keep editing')}
                </Button>
                <Button type="button" size="sm" onClick={() => { setShowDiscard(false); navigate(ROUTES.cabDecisions) }}>
                  {t('cab.decisionDetails.discard.discardAction', 'Discard & leave')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CabLayout>
  )
}
