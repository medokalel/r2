import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast as appToast } from '@/lib/toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { enumLabel } from '@/lib/enumLabel'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useAuditReportingTourSteps } from '@/config/auditReportingTourSteps'
import { useOptionalTour } from '@/context/tour/useTour'
import { AddCircleIcon, AppIcon, SearchIcon, DownloadTrayIcon } from '@/components/icons'
import {
  addEvidenceTask,
  buildReportGates,
  downloadFile,
  finalizeAuditReport,
  getAuditReport,
  reopenAuditReport,
  reportScope,
  saveAuditRecommendation,
  toCsv,
  type AuditReport,
} from '@/lib/api/cabAuditReportingApi'
import { classificationText, gateText, schemeNoteText } from '@/lib/auditReportingText'
import { ScopeBanner } from '@/components/cab/auditReporting/shared'
import type { EvidenceTask, Finding, PageState, TabId } from '@/components/cab/auditReporting/shared'
import { cn } from '@/lib/utils'
import { pageTabClassName, pageTabListClassName } from '@/components/ui/pageTabs'
import { buttonVariants } from '@/components/ui/buttonVariants'

function CabAuditReportingContent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tourSteps = useAuditReportingTourSteps()
  const tour = useOptionalTour()
  const tr = (k: string, fb: string) => t(k, fb)
  const [searchParams] = useSearchParams()
  const reportIdParam = searchParams.get('reportId')
  const [tab, setTab] = useState<TabId>('agenda')
  const [state, setState] = useState<PageState>('loading')
  const [report, setReport] = useState<AuditReport | null>(null)
  const [evidence, setEvidence] = useState<EvidenceTask[]>([])
  const [findings, setFindings] = useState<Finding[]>([])
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')
  const [statusF, setStatusF] = useState('All')
  const [frozen, setFrozen] = useState(false)
  const [version, setVersion] = useState(1)
  const [reco, setReco] = useState('')
  const [modal, setModal] = useState(false)
  const [dDesc, setDDesc] = useState('')
  const [dReq, setDReq] = useState('Clause 8.5')
  const [dDate, setDDate] = useState('2025-03-14')
  const [reloadKey, setReloadKey] = useState(0)

  /** Mirrors a report returned by the API into the page state (row selection is kept). */
  const applyReport = useCallback((next: AuditReport) => {
    setReport(next)
    setEvidence((previous) => next.evidence.map((e) => ({ ...e, selected: previous.find((p) => p.id === e.id)?.selected ?? false })))
    setFindings(next.findings)
    setFrozen(next.frozen)
    setVersion(next.version)
    setReco(next.recommendation)
  }, [])

  useEffect(() => {
    let cancelled = false
    getAuditReport(reportIdParam)
      .then((data) => {
        if (cancelled) return
        if (!data) {
          setState('empty')
          return
        }
        applyReport(data)
        setState('ready')
      })
      .catch((error) => {
        console.error('Failed to load the audit report:', error)
        if (!cancelled) setState('error')
      })
    return () => {
      cancelled = true
    }
  }, [reportIdParam, reloadKey, applyReport])

  // The tour step on the gates opens the Report tab (state adjusted during render, not in an effect).
  const tourOnGates = Boolean(tour?.isTourActive && tour.activeStepId === 'audit-reporting-gates')
  const [prevTourOnGates, setPrevTourOnGates] = useState(false)
  if (tourOnGates !== prevTourOnGates) {
    setPrevTourOnGates(tourOnGates)
    if (tourOnGates) setTab('report')
  }

  const show = (m: string) => {
    appToast.success(m)
  }

  const filtered = useMemo(
    () =>
      evidence.filter(
        (e) =>
          (statusF === 'All' || e.status === statusF) &&
          (query.trim() === '' || `${e.code} ${e.description} ${e.requirementRef}`.toLowerCase().includes(query.toLowerCase())),
      ),
    [evidence, query, statusF],
  )

  const gateContext = {
    evidenceLinked: evidence.length,
    findingsClassified: findings.filter((f) => f.classification && f.status === 'Submitted').length,
    findingsTotal: findings.length,
    frozen,
  }
  const gates = buildReportGates({ ...gateContext, recommendation: reco })

  const doExportEvidence = () => {
    const rows = filtered.map((e) => ({
      ID: e.code, Description: e.description, 'Audit ref': e.auditRef,
      'Requirement ref': e.requirementRef, 'Due date': e.dueDate, Status: e.status,
    }))
    downloadFile('evidence-export.csv', toCsv(rows, ['ID', 'Description', 'Audit ref', 'Requirement ref', 'Due date', 'Status']), 'text/csv')
    show(tr('cab.auditReporting.exported', 'Export prepared from all authorized matching records.'))
  }

  const doExportFindings = () => {
    const rows = findings.map((f) => ({
      ID: f.code, Type: f.type, 'Requirement ref': f.requirementRef,
      Classification: classificationText(t, f.classification) || tr('cab.auditReporting.unclassifiedDraft', 'Unclassified (draft)'), Statement: f.statement,
      'Linked evidence': f.linkedEvidence.join('; '), Status: f.status,
    }))
    downloadFile('findings-export.csv', toCsv(rows, ['ID', 'Type', 'Requirement ref', 'Classification', 'Statement', 'Linked evidence', 'Status']), 'text/csv')
    show(tr('cab.auditReporting.exported', 'Export prepared from all authorized matching records.'))
  }

  /** Runs a workspace mutation; a failed request keeps the entered values and shows the server message. */
  const mutate = async (action: () => Promise<AuditReport>, success: string) => {
    setBusy(true)
    try {
      applyReport(await action())
      show(success)
      return true
    } catch (error) {
      show(error instanceof Error && error.message ? error.message : tr('errors.generic', 'Something went wrong'))
      return false
    } finally {
      setBusy(false)
    }
  }

  const addEvidence = async () => {
    if (!dDesc.trim()) {
      show(tr('cab.auditReporting.evidenceRequired', 'Description is required.'))
      return
    }
    if (!report) return
    const saved = await mutate(
      () => addEvidenceTask(report.id, { description: dDesc.trim(), requirementRef: dReq, dueDate: dDate }),
      tr('cab.auditReporting.evidenceDraft', 'Evidence draft added. Save the workspace to persist it.'),
    )
    if (saved) {
      setDDesc('')
      setModal(false)
    }
  }

  const saveRecommendation = () => {
    if (!report || frozen || reco === report.recommendation) return
    saveAuditRecommendation(report.id, reco)
      .then((next) => setReport(next))
      .catch((error) => console.error('Failed to save the recommendation:', error))
  }

  const finalize = async () => {
    const blocked = gates.filter((g) => !g.passed)
    if (blocked.length > 0) {
      show(`${tr('cab.auditReporting.blocked', 'Finalization blocked')}: ${blocked[0].label}.`)
      return
    }
    if (!report) return
    await mutate(async () => {
      if (reco !== report.recommendation) await saveAuditRecommendation(report.id, reco)
      return finalizeAuditReport(report.id)
    }, tr('cab.auditReporting.reportFrozen', 'Report finalized. Version frozen for technical review handoff.'))
  }

  const reopen = () => {
    if (!report) return
    void mutate(() => reopenAuditReport(report.id), tr('cab.auditReporting.unfrozen', 'New draft version opened from frozen report.'))
  }

  const reportQuery = report ? `?reportId=${encodeURIComponent(report.id)}` : ''

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'agenda', label: tr('cab.auditReporting.tabs.agenda', 'Agenda') },
    { id: 'evidence', label: tr('cab.auditReporting.tabs.evidence', 'Evidence') },
    { id: 'findings', label: tr('cab.auditReporting.tabs.findings', 'Findings') },
    { id: 'report', label: tr('cab.auditReporting.tabs.report', 'Report') },
  ]

  const agenda: string[][] = (report?.agenda ?? []).map((row) => [row.time, row.session, row.clauses, row.auditor, row.status])

  return (
    <>
      <CabTourStep steps={tourSteps} stepId="audit-reporting-header">
        <CabHeader
          title={tr('cab.auditReporting.title', 'Audit Reporting')}
          subtitle={report ? `${report.auditNumber} · ${report.clientName} · ${enumLabel(t, report.stage)}` : tr('cab.auditReporting.subtitleEmpty', 'Audit report')}
          notificationCount={3}
        />
      </CabTourStep>
      <main className="flex flex-1 flex-col gap-5 overflow-auto page-main">
        <CabTourStep steps={tourSteps} stepId="audit-reporting-scope">
          <ScopeBanner title={tr('cab.auditReporting.scope', 'CAB-client scope')} scope={reportScope(report)} />
        </CabTourStep>


        {state === 'loading' && (
          <section className="rounded-lg border border-neutral-100 bg-white p-6 space-y-3" aria-busy="true" aria-label={t('common.loading')}>
            <div className="skeleton h-10 w-[92%]" />
            <div className="skeleton h-10 w-[70%]" />
            <div className="skeleton h-10 w-[55%]" />
            <p className="text-body-sm font-medium text-neutral-600">{tr('common.loading', 'Loading…')}</p>
          </section>
        )}

        {state === 'error' && (
          <section className="rounded-lg border border-neutral-100 bg-white p-6 text-center" role="alert">
            <p className="text-body font-bold text-error-600">{t('errors.title', 'Something went wrong')}</p>
            <p className="mt-1 text-body-sm text-neutral-700">{t('errors.generic', 'We could not load the workspace. Entered values were preserved.')}</p>
            <div className="mt-4 flex justify-center">
              <button type="button" className="h-11 rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50" onClick={() => { setState('loading'); setReloadKey((k) => k + 1); }}>
                {t('errors.retry', 'Try again')}
              </button>
            </div>
          </section>
        )}

        {state === 'denied' && (
          <section className="rounded-lg border border-neutral-100 bg-white p-6 text-center" role="alert">
            <p className="text-body font-bold text-warning-700">{tr('cab.auditReporting.deniedTitle', 'Permission required')}</p>
            <p className="mt-1 text-body-sm text-neutral-700">
              {tr('cab.auditReporting.deniedBody', 'Your role can view this workspace but cannot edit it. Contact the lead auditor, signatory authority, or decision authority.')}
            </p>
          </section>
        )}

        {state === 'empty' && (
          <section className="rounded-lg border border-neutral-100 bg-white p-6 text-center" role="status">
            <p className="text-body font-bold text-neutral-800">{tr('cab.auditReporting.noReportTitle', 'No audit report yet')}</p>
            <p className="mt-1 text-body-sm text-neutral-700">
              {tr('cab.auditReporting.noReportBody', 'A reporting workspace opens for each audit plan. Open one from the audit plan to record evidence and findings.')}
            </p>
          </section>
        )}

        {state === 'ready' && report && (
          <>
            {/* Tabs Navigation */}
            <CabTourStep steps={tourSteps} stepId="audit-reporting-tabs">
              <div className={pageTabListClassName} role="tablist" aria-label={t('ui.workspaceStages')}>
                {tabs.map((x) => (
                  <button
                    key={x.id}
                    role="tab"
                    aria-selected={tab === x.id}
                    type="button"
                    onClick={() => setTab(x.id)}
                    className={pageTabClassName(tab === x.id)}
                  >
                    {x.label}
                  </button>
                ))}
              </div>
            </CabTourStep>

            {frozen && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-success-200 bg-success-50 px-4 py-3 text-body-sm" role="status">
                <p className="font-semibold text-success-700">
                  {tr('cab.auditReporting.frozen', `Report v${version} frozen (read-only). Technical review is a separate handoff.`)}
                </p>
                <button
                  type="button"
                  className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-caption font-medium text-neutral-800 hover:border-primary hover:text-primary transition-colors"
                  disabled={busy}
                  onClick={reopen}
                >
                  {tr('cab.auditReporting.newVersion', 'Open new draft version')}
                </button>
              </div>
            )}


            {/* Agenda Tab */}
            {tab === 'agenda' && (
              <CabTourStep steps={tourSteps} stepId="audit-reporting-content">
                <section className="flex flex-col rounded-lg border border-neutral-100 bg-white py-4 overflow-hidden shadow-none">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 mb-4">
                    <div>
                      <h2 className="text-body-lg font-bold text-neutral-900">{t('cab.auditReporting.agendaTitleFor', { stage: enumLabel(t, report.stage), defaultValue: 'Audit agenda: {{stage}}' })}</h2>
                      <p className="mt-0.5 text-body-sm text-neutral-600">{[report.auditNumber, report.siteName].filter(Boolean).join(' · ')}</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] border-collapse text-center">
                      <thead>
                        <tr className="bg-primary text-white">
                          <th className="p-5 text-body-sm font-medium">{tr('cab.auditReporting.table.time', 'Time')}</th>
                          <th className="p-5 text-body-sm font-medium">{tr('cab.auditReporting.table.session', 'Session / Activity')}</th>
                          <th className="p-5 text-body-sm font-medium">{tr('cab.auditReporting.table.clauses', 'Clauses')}</th>
                          <th className="p-5 text-body-sm font-medium">{tr('cab.auditReporting.table.auditor', 'Auditor')}</th>
                          <th className="p-5 text-body-sm font-medium">{tr('cab.auditReporting.table.status', 'Status')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agenda.map((r, index) => (
                          <tr key={r[1]} className={cn('transition-colors', index % 2 ? 'bg-neutral-25' : '', 'hover:bg-primary-50/50')}>
                            <td className="px-4 py-3.5 text-body-sm font-semibold text-primary" dir="ltr">{r[0]}</td>
                            <td className="px-4 py-3.5 text-body font-medium text-neutral-900">{enumLabel(t, r[1])}</td>
                            <td className="px-4 py-3.5 text-body-sm text-neutral-700">{enumLabel(t, r[2])}</td>
                            <td className="px-4 py-3.5 text-body-sm text-neutral-700">{enumLabel(t, r[3])}</td>
                            <td className="px-4 py-3.5">
                              <span className={cn(
                                'inline-flex items-center justify-center rounded-sm px-3 py-1 text-caption font-medium whitespace-nowrap',
                                r[4] === 'Completed' ? 'bg-success-50 text-success-600' : r[4] === 'In progress' ? 'bg-primary-50 text-primary' : 'bg-neutral-50 text-neutral-700'
                              )}>
                                {enumLabel(t, r[4])}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </CabTourStep>
            )}

            {/* Evidence Tab */}
            {tab === 'evidence' && (
              <CabTourStep steps={tourSteps} stepId="audit-reporting-content">
                <section className="flex flex-col rounded-lg border border-neutral-100 bg-white py-4 overflow-hidden shadow-none">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 mb-4">
                    <div>
                      <h2 className="text-body-lg font-bold text-neutral-900">{tr('cab.auditReporting.evidenceTitle', 'Evidence tasks')}</h2>
                      <p className="mt-0.5 text-body-sm text-neutral-600">
                        {tr('cab.auditReporting.evidenceSub', 'Each item is linked to the audit and a requirement.')}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        className="flex h-11 items-center gap-2 rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
                        onClick={doExportEvidence}
                      >
                        <AppIcon icon={DownloadTrayIcon} size={18} />
                        <span>{tr('cab.auditReporting.exportFiltered', 'Export filtered')}</span>
                      </button>
                      <button
                        type="button"
                        className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
                        disabled={frozen}
                        onClick={() => setModal(true)}
                      >
                        <AppIcon icon={AddCircleIcon} size={18} />
                        <span>{tr('cab.auditReporting.addEvidence', 'Add evidence')}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 border-b border-neutral-100 bg-neutral-25 p-4 mb-2">
                    <div className="relative flex-1 min-w-[240px]">
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={tr('cab.auditReporting.searchEvidencePlaceholder', 'Search ID / description / clause...')}
                        className="h-11 w-full rounded-md border border-neutral-100 bg-white ps-10 pe-4 text-body-sm text-neutral-900 placeholder:text-neutral-500 focus:border-primary focus:outline-none"
                      />
                      <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-neutral-500">
                        <AppIcon icon={SearchIcon} size={18} />
                      </div>
                    </div>

                    <select
                      value={statusF}
                      onChange={(e) => setStatusF(e.target.value)}
                      className="h-11 rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-800 focus:border-primary focus:outline-none"
                    >
                      {['All', 'Open', 'Submitted', 'Verified', 'Closed'].map((s) => <option key={s} value={s}>{enumLabel(t, s)}</option>)}
                    </select>

                    <span className="ms-auto self-center text-body-sm font-medium text-neutral-600">
                      {filtered.length} / {evidence.length}
                    </span>
                  </div>

                  {filtered.length === 0 ? (
                    <div className="p-10 text-center text-neutral-600">
                      <p className="text-body-sm font-bold text-neutral-800">{tr('cab.auditReporting.emptyEvidence', 'No evidence matches these filters')}</p>
                      <button
                        type="button"
                        className="mt-4 h-11 rounded-md border border-neutral-100 px-4 text-body-sm font-medium text-neutral-700 hover:bg-neutral-50"
                        onClick={() => { setQuery(''); setStatusF('All'); }}
                      >
                        {tr('cab.auditReporting.clearFilters', 'Clear filters')}
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[800px] border-collapse text-center">
                        <thead>
                          <tr className="bg-primary text-white">
                            <th className="w-10 p-5"></th>
                            <th className="p-5 text-body-sm font-medium">{tr('cab.auditReporting.table.idDesc', 'ID & Description')}</th>
                            <th className="p-5 text-body-sm font-medium">{tr('cab.auditReporting.table.auditRef', 'Audit Reference')}</th>
                            <th className="p-5 text-body-sm font-medium">{tr('cab.auditReporting.table.reqRef', 'Requirement')}</th>
                            <th className="p-5 text-body-sm font-medium">{tr('cab.auditReporting.table.dueDate', 'Due Date')}</th>
                            <th className="p-5 text-body-sm font-medium">{tr('cab.auditReporting.table.status', 'Status')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((e, index) => (
                            <tr key={e.id} className={cn('transition-colors', index % 2 ? 'bg-neutral-25' : '', 'hover:bg-primary-50/50')}>
                              <td className="px-4 py-3.5">
                                <input
                                  type="checkbox"
                                  checked={e.selected}
                                  disabled={frozen}
                                  onChange={() => setEvidence((p) => p.map((x) => (x.id === e.id ? { ...x, selected: !x.selected } : x)))}
                                  className="size-4 rounded border-neutral-100 text-primary focus:ring-primary"
                                />
                              </td>
                              <td className="px-4 py-3.5 text-start font-medium text-neutral-900">
                                <span className="text-primary font-bold me-2">{e.code}</span>
                                {e.description}
                              </td>
                              <td className="px-4 py-3.5 text-body-sm text-neutral-700">{e.auditRef}</td>
                              <td className="px-4 py-3.5 text-body-sm text-neutral-700">{e.requirementRef}</td>
                              <td className="px-4 py-3.5 text-body-sm text-neutral-700">{e.dueDate}</td>
                              <td className="px-4 py-3.5">
                                <span className={cn(
                                  'inline-flex items-center justify-center rounded-sm px-3 py-1 text-caption font-medium whitespace-nowrap',
                                  e.status === 'Verified' ? 'bg-success-50 text-success-600' : e.status === 'Submitted' ? 'bg-primary-50 text-primary' : 'bg-orange-50 text-orange-600'
                                 )}>
                                  {enumLabel(t, e.status)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </CabTourStep>
            )}

            {/* Findings Tab */}
            {tab === 'findings' && (
              <CabTourStep steps={tourSteps} stepId="audit-reporting-content">
                <section className="flex flex-col rounded-lg border border-neutral-100 bg-white py-4 overflow-hidden shadow-none">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 mb-4">
                    <div>
                      <h2 className="text-body-lg font-bold text-neutral-900">{tr('cab.auditReporting.findingsTitle', 'Findings register')}</h2>
                      <p className="mt-0.5 text-body-sm text-neutral-600">{schemeNoteText(t)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        className="flex h-11 items-center gap-2 rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
                        onClick={doExportFindings}
                      >
                        <AppIcon icon={DownloadTrayIcon} size={18} />
                        <span>{tr('cab.auditReporting.exportFiltered', 'Export filtered')}</span>
                      </button>
                      <button
                        type="button"
                        className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
                        disabled={frozen}
                        onClick={() => navigate(`/cab/audit-reporting/findings/new${reportQuery}`)}
                      >
                        <AppIcon icon={AddCircleIcon} size={18} />
                        <span>{tr('cab.auditReporting.addFinding', 'Add finding')}</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] border-collapse text-center">
                      <thead>
                        <tr className="bg-primary text-white">
                          <th className="p-5 text-body-sm font-medium">{tr('cab.auditReporting.table.findingIdType', 'Finding & Type')}</th>
                          <th className="p-5 text-body-sm font-medium">{tr('cab.auditReporting.table.requirement', 'Requirement')}</th>
                          <th className="p-5 text-body-sm font-medium">{tr('cab.auditReporting.table.statement', 'Statement')}</th>
                          <th className="p-5 text-body-sm font-medium">{tr('cab.auditReporting.table.classification', 'Classification')}</th>
                          <th className="p-5 text-body-sm font-medium">{tr('cab.auditReporting.table.status', 'Status')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {findings.map((f, index) => (
                          <tr key={f.id} className={cn('transition-colors', index % 2 ? 'bg-neutral-25' : '', 'hover:bg-primary-50/50')}>
                            <td className="px-4 py-3.5 font-medium text-neutral-900">
                              <span className="text-primary font-bold me-1.5">{f.code}</span>
                              <span className="text-body-sm text-neutral-700 font-normal">({f.type})</span>
                            </td>
                            <td className="px-4 py-3.5 text-body-sm text-neutral-800">{f.requirementRef}</td>
                            <td className="px-4 py-3.5 text-start text-body-sm text-neutral-800 max-w-xs">{f.statement}</td>
                            <td className="px-4 py-3.5">
                              <span className={cn(
                                'inline-flex items-center justify-center rounded-sm px-3 py-1 text-caption font-medium whitespace-nowrap',
                                f.classification ? 'bg-primary-50 text-primary' : 'bg-orange-50 text-orange-600'
                              )}>
                                {classificationText(t, f.classification) || tr('cab.auditReporting.unclassified', 'Unclassified (draft only)')}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={cn(
                                'inline-flex items-center justify-center rounded-sm px-3 py-1 text-caption font-medium whitespace-nowrap',
                                f.status === 'Submitted' ? 'bg-success-50 text-success-600' : 'bg-neutral-50 text-neutral-800'
                              )}>
                                {enumLabel(t, f.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </CabTourStep>
            )}

            {/* Report Tab */}
            {tab === 'report' && (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                <CabTourStep steps={tourSteps} stepId="audit-reporting-content">
                  <section className="rounded-lg border border-neutral-100 bg-white p-5 space-y-4 shadow-none">
                    <h2 className="text-body-lg font-bold text-neutral-900">{tr('cab.auditReporting.finalTitle', 'Audit report finalization')}</h2>
                    <p className="text-body-sm leading-relaxed text-neutral-600">
                      {tr('cab.auditReporting.finalNote', 'Finalization freezes the version. Technical review is a separate handoff; recommendation is not a decision.')}
                    </p>

                    <div className="space-y-1.5">
                      <label htmlFor="reco" className="block text-body-sm font-medium text-neutral-800">
                        {tr('cab.auditReporting.recommendation', 'Auditor recommendation (record only)')}
                      </label>
                      <textarea
                        id="reco"
                        rows={4}
                        value={reco}
                        disabled={frozen}
                        onChange={(e) => setReco(e.target.value)}
                        onBlur={saveRecommendation}
                        className="w-full rounded-md border border-neutral-100 bg-white p-3 text-body-sm text-neutral-900 placeholder:text-neutral-500 focus:border-primary focus:outline-none min-h-24 resize-y disabled:bg-neutral-50"
                        placeholder={t('ui.recommendationPlaceholder')}
                      />
                    </div>

                    <div className="rounded-md border border-primary-100 bg-primary-50/40 p-4 text-body-sm leading-relaxed text-primary font-medium">
                      {tr('cab.auditReporting.decisionSep', 'Recommendations here are not a certification decision. Review is a separate handoff after freeze.')}
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        type="button"
                        className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
                        disabled={frozen || busy}
                        onClick={() => void finalize()}
                      >
                        {tr('cab.auditReporting.finalize', 'Finalize & freeze version')}
                      </button>
                      {frozen && (
                        <button
                          type="button"
                          className="h-11 rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
                          onClick={() => navigate(report.decisionId ? `/cab/decisions/${encodeURIComponent(report.decisionId)}` : '/cab/decisions')}
                        >
                          {tr('cab.auditReporting.toReview', 'Go to technical review handoff')}
                        </button>
                      )}
                    </div>
                  </section>
                </CabTourStep>

                <CabTourStep steps={tourSteps} stepId="audit-reporting-gates">
                  <aside className="rounded-lg border border-neutral-100 bg-white h-fit p-5 shadow-none">
                    <h3 className="text-body font-bold text-neutral-900">{tr('cab.auditReporting.gatesTitle', 'Submission gates')}</h3>
                    <p className="mt-0.5 text-body-sm text-neutral-600">
                      {tr('cab.auditReporting.gatesSub', 'Draft saves any time. Finalization requires every gate.')}
                    </p>
                    <ul className="mt-4 space-y-3">
                      {gates.map((g) => {
                        const text = gateText(t, g, gateContext)
                        return (
                          <li key={g.id} className={cn('rounded-md border p-3.5', g.passed ? 'border-success-200 bg-success-50' : 'border-neutral-300 bg-neutral-50')}>
                            <p className={cn('flex items-center gap-2 text-body-sm font-bold', g.passed ? 'text-success-700' : 'text-neutral-700')}>
                              <span aria-hidden className={cn('flex size-5 items-center justify-center rounded-full text-caption text-white', g.passed ? 'bg-success-500' : 'bg-neutral-500')}>✓</span>
                              {text.label}
                            </p>
                            <p className="mt-1 text-caption text-neutral-600">{text.hint}</p>
                          </li>
                        )
                      })}
                    </ul>
                  </aside>
                </CabTourStep>
              </div>
            )}
          </>
        )}
      </main>


      {/* Add Evidence Modal */}
      {modal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-surface-overlay/50 p-4" role="dialog" aria-modal="true" aria-label={t('ui.addEvidence')}>
          <div className="rounded-lg border border-neutral-100 bg-white w-full max-w-md space-y-4 p-6 shadow-2xl">
            <h3 className="text-body font-bold text-neutral-900">{tr('cab.auditReporting.addEvidenceTitle', 'Add evidence task (draft)')}</h3>
            <div className="space-y-1.5">
              <label className="block text-body-sm font-medium text-neutral-800">{tr('cab.auditReporting.desc', 'Description')} *</label>
              <input
                value={dDesc}
                onChange={(e) => setDDesc(e.target.value)}
                className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3.5 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                placeholder={t('ui.evidencePlaceholder')}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-body-sm font-medium text-neutral-800">{tr('cab.auditReporting.reqRef', 'Requirement ref')} *</label>
                <input
                  value={dReq}
                  onChange={(e) => setDReq(e.target.value)}
                  className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3.5 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-body-sm font-medium text-neutral-800">{tr('cab.auditReporting.dueDate', 'Due date')}</label>
                <input
                  type="date"
                  value={dDate}
                  onChange={(e) => setDDate(e.target.value)}
                  className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3.5 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <p className="text-caption text-neutral-600">{tr('cab.auditReporting.nestedDraft', 'Stays draft until the workspace is saved. Failed saves preserve values.')}</p>
            <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
              <button
                type="button"
                className="h-11 rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50"
                onClick={() => setModal(false)}
              >
                {tr('common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
                disabled={busy}
                onClick={() => void addEvidence()}
              >
                {tr('cab.auditReporting.addEvidence', 'Add evidence')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function CabAuditReportingPage() {
  const tourSteps = useAuditReportingTourSteps()

  return (
    <CabLayout
      sidebarVariant="auditReporting"
      tourId="cab-audit-reporting"
      tourSteps={tourSteps}
    >
      <CabAuditReportingContent />
    </CabLayout>
  )
}

