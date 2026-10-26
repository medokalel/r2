import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Refresh2, WifiSquare } from 'iconsax-reactjs'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { ExecutionStepper } from '@/components/execution/ExecutionStepper'
import { BlockerList, Chip, InfoGrid, Panel, ProgressBar } from '@/components/execution/executionUi'
import { StepPreparation } from '@/components/execution/StepPreparation'
import { StepOpening } from '@/components/execution/StepOpening'
import { StepConduct } from '@/components/execution/StepConduct'
import { StepTeamReview } from '@/components/execution/StepTeamReview'
import { StepClosing } from '@/components/execution/StepClosing'
import { StepReport } from '@/components/execution/StepReport'
import { ApiError } from '@/lib/api/client'
import {
  EXECUTION_STEPS,
  NC_RESULTS,
  completeStep,
  executionPath,
  getExecution,
  removeExecutionFile,
  reopenStep,
  startExecution,
  syncExecution,
  updateChecklistItem,
  uploadExecutionFile,
  type AuditChecklistItemResult,
  type AuditExecutionWorkspace,
  type ChecklistProgress,
  type ExecutionFile,
  type ExecutionStepKey,
  type ItemUpdate,
  type StepBlocker,
} from '@/lib/api/executionApi'
import { applyQueued, cachedWorkspace, cacheWorkspace, dropOperations, enqueueItemChange, isNetworkError, queuedOperations } from '@/lib/execution/offlineQueue'
import { daysText, stepHint, stepLabel } from '@/lib/execution/executionText'
import { enumLabel } from '@/lib/enumLabel'
import { formatDate } from '@/lib/format/dates'
import { toast } from '@/lib/toast'
import { workflowErrorMessage } from '@/lib/workflowErrors'

type LoadState = 'loading' | 'ready' | 'error' | 'missing'

function progressOf(items: AuditChecklistItemResult[]): ChecklistProgress {
  const p: ChecklistProgress = { total: items.length, answered: 0, mandatoryOpen: 0, conforming: 0, observation: 0, ofi: 0, minorNc: 0, majorNc: 0, notAudited: 0, notApplicable: 0 }
  for (const i of items) {
    if (i.result) {
      p.answered += 1
      p[i.result] += 1
    } else if (i.mandatory) p.mandatoryOpen += 1
  }
  return p
}

/** The workspace with one item replaced (progress recomputed locally until the next refresh). */
function withItem(ws: AuditExecutionWorkspace, item: AuditChecklistItemResult): AuditExecutionWorkspace {
  const checklists = ws.checklists.map((c) => {
    if (!c.items.some((i) => i.id === item.id)) return c
    const items = c.items.map((i) => (i.id === item.id ? item : i))
    return { ...c, items, progress: progressOf(items) }
  })
  return { ...ws, checklists, conduct: { progress: progressOf(checklists.flatMap((c) => c.items)) } }
}

const FINDING_TYPE: Record<string, { type: string; classification: string }> = {
  majorNc: { type: 'Nonconformity', classification: 'major' },
  minorNc: { type: 'Nonconformity', classification: 'minor' },
  observation: { type: 'Observation', classification: 'observation' },
  ofi: { type: 'Opportunity', classification: 'observation' },
}

/** Audit execution workspace (/cab/audit-execution/:planId): the six-step stepper of one audit plan. */
export function CabAuditExecutionPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { planId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [ws, setWs] = useState<AuditExecutionWorkspace | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [busy, setBusy] = useState(false)
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  const [queueSize, setQueueSize] = useState(() => queuedOperations(planId).length)
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set(queuedOperations(planId).map((op) => op.itemId)))
  const [gates, setGates] = useState<{ step: ExecutionStepKey; blockers: StepBlocker[] } | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const refreshTimer = useRef<number | null>(null)
  const selected = (EXECUTION_STEPS.includes(searchParams.get('step') as ExecutionStepKey) ? searchParams.get('step') : null) as ExecutionStepKey | null
  const step: ExecutionStepKey = selected ?? ws?.currentStep ?? 'preparation'

  const adopt = useCallback(
    (next: AuditExecutionWorkspace) => {
      cacheWorkspace(planId, next)
      setWs(applyQueued(next, queuedOperations(planId)))
    },
    [planId],
  )

  useEffect(() => {
    let cancelled = false
    getExecution(planId)
      .then((data) => {
        if (cancelled) return
        adopt(data)
        setState('ready')
      })
      .catch((err) => {
        if (cancelled) return
        const cached = cachedWorkspace(planId)
        if (cached && isNetworkError(err)) {
          setWs(applyQueued(cached, queuedOperations(planId)))
          setState('ready')
        } else setState(err instanceof ApiError && err.status === 404 ? 'missing' : 'error')
      })
    return () => {
      cancelled = true
    }
  }, [planId, reloadKey, adopt])

  const flush = useCallback(async () => {
    const queue = queuedOperations(planId)
    if (!queue.length) return
    setSyncing(true)
    try {
      const result = await syncExecution(planId, queue)
      const rest = dropOperations(planId, result.results.map((r) => r.opId))
      setQueueSize(rest.length)
      setPendingIds(new Set(rest.map((op) => op.itemId)))
      adopt(result.workspace)
      const stale = result.results.filter((r) => r.status !== 'applied').length
      toast.success(stale ? t('execution.offline.syncedWithSkipped', { count: stale }) : t('execution.offline.synced', { count: result.results.length }))
    } catch (err) {
      if (!isNetworkError(err)) toast.error(workflowErrorMessage(err, t))
    } finally {
      setSyncing(false)
    }
  }, [planId, adopt, t])

  useEffect(() => {
    const goOnline = () => {
      setOnline(true)
      void flush()
    }
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current)
    }
  }, [flush])

  const selectStep = (key: ExecutionStepKey) => {
    setGates(null)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('step', key)
      return next
    }, { replace: true })
  }

  const run = useCallback(
    async (action: () => Promise<AuditExecutionWorkspace>, success?: string) => {
      setBusy(true)
      try {
        adopt(await action())
        if (success) toast.success(success)
        return true
      } catch (err) {
        if (err instanceof ApiError && Array.isArray(err.details?.blockers)) setGates({ step, blockers: err.details.blockers as StepBlocker[] })
        toast.error(isNetworkError(err) ? t('execution.offline.needsConnection') : workflowErrorMessage(err, t))
        return false
      } finally {
        setBusy(false)
      }
    },
    [adopt, step, t],
  )

  const scheduleRefresh = () => {
    if (refreshTimer.current) window.clearTimeout(refreshTimer.current)
    refreshTimer.current = window.setTimeout(() => {
      getExecution(planId).then(adopt, () => undefined)
    }, 1500)
  }

  const queue = (item: AuditChecklistItemResult, update: ItemUpdate) => {
    const q = enqueueItemChange(planId, item.id, update)
    setQueueSize(q.length)
    setPendingIds(new Set(q.map((op) => op.itemId)))
    setWs((current) => (current ? withItem(current, { ...item, ...Object.fromEntries(Object.entries(update).filter(([k]) => k !== 'clientUpdatedAt')) }) : current))
  }

  const onItemChange = (item: AuditChecklistItemResult, update: ItemUpdate) => {
    if (!online) {
      queue(item, update)
      return
    }
    setWs((current) => (current ? withItem(current, { ...item, ...update } as AuditChecklistItemResult) : current))
    updateChecklistItem(planId, item.id, { ...update, clientUpdatedAt: new Date().toISOString() })
      .then((saved) => {
        setWs((current) => (current ? withItem(current, saved) : current))
        scheduleRefresh()
      })
      .catch((err) => {
        if (isNetworkError(err)) queue(item, update)
        else {
          toast.error(workflowErrorMessage(err, t))
          setWs((current) => (current ? withItem(current, item) : current))
        }
      })
  }

  const onPhoto = async (item: AuditChecklistItemResult | null, file: File) => {
    if (!online) {
      toast.error(t('execution.offline.photoNeedsConnection'))
      return
    }
    try {
      const saved = await uploadExecutionFile(planId, file, { checklistItemId: item?.id, takenAt: new Date().toISOString() })
      setWs((current) => (current ? { ...current, files: [...current.files, saved] } : current))
      toast.success(t('execution.conduct.photoSaved'))
    } catch (err) {
      toast.error(workflowErrorMessage(err, t))
    }
  }

  const onRemoveFile = async (file: ExecutionFile) => {
    try {
      await removeExecutionFile(planId, file.id)
      setWs((current) => (current ? { ...current, files: current.files.filter((f) => f.id !== file.id) } : current))
    } catch (err) {
      toast.error(workflowErrorMessage(err, t))
    }
  }

  const onRaiseFinding = (item: AuditChecklistItemResult) => {
    if (!ws?.reportId) {
      toast.error(t('execution.conduct.reportNotOpen'))
      return
    }
    const mapping = FINDING_TYPE[item.result ?? 'minorNc'] ?? FINDING_TYPE.minorNc
    const checklist = ws.checklists.find((c) => c.items.some((i) => i.id === item.id))
    const evidence = [item.notes, item.documentsSampled.length ? `${t('execution.conduct.documentsSampled')}: ${item.documentsSampled.join(', ')}` : '', item.interviewees.length ? `${t('execution.conduct.interviewees')}: ${item.interviewees.join(', ')}` : '']
      .filter(Boolean)
      .join('\n')
    const params = new URLSearchParams({
      reportId: ws.reportId,
      planId: ws.plan.id,
      checklistItemId: item.id,
      type: mapping.type,
      classification: mapping.classification,
      requirementRef: `${checklist?.standardLabel || ws.plan.standardName}, ${t('execution.conduct.clause')} ${item.clause}`,
      statement: item.notes,
      evidence,
      returnTo: `${executionPath(ws.plan.planNumber)}?step=conduct`,
    })
    if (ws.closing.ncResponseDueDate && item.result && NC_RESULTS.includes(item.result)) params.set('dueDate', ws.closing.ncResponseDueDate)
    navigate(`/cab/audit-reporting/findings/new?${params.toString()}`)
  }

  const current = ws?.steps.find((s) => s.key === step)
  const locked = current?.status === 'done'
  const shownBlockers = gates?.step === step ? gates.blockers : current?.blockers ?? []

  const complete = async () => {
    setGates(null)
    const ok = await run(() => completeStep(planId, step), t('execution.stepCompleted', { step: stepLabel(t, step) }))
    if (ok) {
      const next = EXECUTION_STEPS[EXECUTION_STEPS.indexOf(step) + 1]
      if (next) selectStep(next)
    }
  }

  const stepProps = ws ? { ws, busy, locked, run } : null

  return (
    <CabLayout>
      <div className="flex min-h-screen flex-col">
        <CabHeader
          title={t('execution.title')}
          subtitle={ws ? `${ws.plan.planNumber} · ${ws.plan.clientName} · ${enumLabel(t, ws.plan.stage)}` : t('execution.subtitle')}
        />
        <main className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden page-main">
          <nav className="flex flex-wrap items-center gap-2 text-body-sm font-medium text-neutral-600" aria-label={t('common.breadcrumb', 'Breadcrumb')}>
            <Link to="/cab/audit-planning/schedule" className="hover:text-primary">{t('execution.breadcrumbPlanning')}</Link>
            <span aria-hidden>/</span>
            {ws && <Link to={`/cab/audit-planning/build/${ws.plan.planNumber}`} className="hover:text-primary">{ws.plan.planNumber}</Link>}
            {ws && <span aria-hidden>/</span>}
            <span className="font-semibold text-neutral-800">{t('execution.title')}</span>
          </nav>

          {state === 'loading' && (
            <section className="space-y-3 rounded-lg border border-neutral-100 bg-white p-6" aria-busy="true">
              <div className="skeleton h-10 w-[90%]" />
              <div className="skeleton h-10 w-[70%]" />
              <div className="skeleton h-40 w-full" />
            </section>
          )}
          {state === 'error' && (
            <Alert tone="error" role="alert" title={t('execution.loadError')} action={<Button size="md" variant="outline" onClick={() => { setState('loading'); setReloadKey((k) => k + 1) }}>{t('execution.retry')}</Button>} />
          )}
          {state === 'missing' && <Alert tone="warning" title={t('execution.notFound')} />}

          {state === 'ready' && ws && (
            <>
              {(!online || queueSize > 0) && (
                <Alert
                  tone={online ? 'info' : 'warning'}
                  title={online ? t('execution.offline.pendingTitle', { count: queueSize }) : t('execution.offline.title')}
                  action={online && queueSize > 0 ? <Button size="md" variant="outline" disabled={syncing} onClick={() => void flush()} icon={<Refresh2 size={18} />}>{t('execution.offline.syncNow')}</Button> : <WifiSquare size={24} className="text-warning-500" />}
                >
                  {online ? t('execution.offline.pendingBody') : t('execution.offline.body', { count: queueSize })}
                </Alert>
              )}

              <Panel
                title={`${ws.plan.planNumber} · ${ws.plan.clientName}`}
                description={ws.plan.standardName}
                actions={<Chip className="border-primary-300 bg-primary-50 text-primary-700">{enumLabel(t, ws.plan.status)}</Chip>}
              >
                <InfoGrid
                  rows={[
                    [t('execution.summary.stage'), enumLabel(t, ws.plan.stage)],
                    [t('execution.summary.dates'), `${formatDate(ws.plan.startDate, i18n.language)} · ${formatDate(ws.plan.endDate, i18n.language)}`],
                    [t('execution.summary.site'), ws.plan.siteName],
                    [t('execution.summary.lead'), ws.plan.leadAuditor],
                    [t('execution.summary.team'), ws.plan.auditTeam.join(', ')],
                    [t('execution.summary.remote'), ws.plan.remoteEnabled ? ws.plan.remotePlatform || t('execution.summary.yes') : t('execution.summary.no')],
                  ]}
                />
                {ws.started && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <ProgressBar value={ws.conduct.progress.answered} total={ws.conduct.progress.total} label={<><span>{t('execution.summary.checklists')}</span><span>{ws.conduct.progress.answered}/{ws.conduct.progress.total}</span></>} />
                    <ProgressBar value={ws.time.actualDays} total={Math.max(ws.time.plannedDays, ws.time.actualDays) || 1} tone={ws.time.status === 'under' ? 'warning' : 'primary'} label={<><span>{t('execution.summary.time')}</span><span>{daysText(ws.time.actualDays)} / {daysText(ws.time.plannedDays)}</span></>} />
                  </div>
                )}
              </Panel>

              {!ws.started ? (
                <Panel title={t('execution.start.title')} description={t('execution.start.description')}>
                  <ul className="list-disc space-y-1 ps-5 text-body-sm text-neutral-700">
                    <li>{t('execution.start.point1')}</li>
                    <li>{t('execution.start.point2')}</li>
                    <li>{t('execution.start.point3')}</li>
                  </ul>
                  <div>
                    <Button type="button" size="md" disabled={busy || ws.plan.status === 'Completed'} onClick={() => void run(() => startExecution(planId), t('execution.start.started'))} data-testid="start-execution">
                      {t('execution.start.button')}
                    </Button>
                  </div>
                </Panel>
              ) : (
                <>
                  <ExecutionStepper steps={ws.steps} selected={step} onSelect={selectStep} />
                  <div className="flex flex-col gap-1">
                    <h2 className="text-h3 font-bold text-neutral-900">{stepLabel(t, step)}</h2>
                    <p className="text-body-sm text-neutral-600">{stepHint(t, step)}</p>
                  </div>
                  {stepProps && (
                    <div key={step}>
                      {step === 'preparation' && <StepPreparation {...stepProps} />}
                      {step === 'opening' && <StepOpening {...stepProps} />}
                      {step === 'conduct' && (
                        <StepConduct {...stepProps} pendingItemIds={pendingIds} onItemChange={onItemChange} onPhoto={(item, file) => void onPhoto(item, file)} onRemoveFile={(f) => void onRemoveFile(f)} onRaiseFinding={onRaiseFinding} />
                      )}
                      {step === 'teamReview' && <StepTeamReview {...stepProps} />}
                      {step === 'closing' && <StepClosing {...stepProps} />}
                      {step === 'report' && <StepReport {...stepProps} />}
                    </div>
                  )}
                  {step !== 'report' && (
                    <section className="sticky bottom-0 z-10 flex flex-col gap-3 rounded-lg border border-neutral-100 bg-white p-4 shadow-md sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        {locked ? (
                          <p className="text-body-sm font-semibold text-success-700">{t('execution.stepDone', { step: stepLabel(t, step) })}</p>
                        ) : (
                          <BlockerList blockers={shownBlockers} />
                        )}
                        {!locked && !shownBlockers.length && <p className="text-body-sm text-neutral-700">{t('execution.readyToComplete')}</p>}
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {locked ? (
                          <Button type="button" size="md" variant="outline" disabled={busy} onClick={() => void run(() => reopenStep(planId, step), t('execution.stepReopened'))}>
                            {t('execution.reopen')}
                          </Button>
                        ) : (
                          <Button type="button" size="md" disabled={busy} onClick={() => void complete()} data-testid="complete-step">
                            {t('execution.complete', { step: stepLabel(t, step) })}
                          </Button>
                        )}
                      </div>
                    </section>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </CabLayout>
  )
}
