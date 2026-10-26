import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DocumentDownload, Printer } from 'iconsax-reactjs'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { BlockerList, Field, Panel } from '@/components/execution/executionUi'
import { INPUT_CLASS, TEXTAREA_CLASS } from '@/components/execution/fieldClasses'
import { ReportAutoContent, ReportHistory, ReportIdentification } from '@/components/execution/StageReportParts'
import { ApiError } from '@/lib/api/client'
import {
  STAGE_REPORT_TYPES,
  getStageReport,
  issueStageReport,
  reviewStageReport,
  submitStageReport,
  updateStageReport,
  type NarrativeSection,
  type StageReport,
  type StageReportType,
  type StageReportUpdate,
} from '@/lib/api/stageReportApi'
import { executionPath, type StepBlocker } from '@/lib/api/executionApi'
import { outcomeLabel, reportTypeLabel, sectionHint, sectionLabel } from '@/lib/execution/executionText'
import { downloadStageReportPdf } from '@/lib/pdf/stageReportPdf'
import { enumLabel } from '@/lib/enumLabel'
import { toast } from '@/lib/toast'
import { workflowErrorMessage } from '@/lib/workflowErrors'
import { cn } from '@/lib/utils'

/** Stage report (/cab/audit-reporting/report/:reportId): narrative, recommendation, technical review, issue to the client. */
export function CabStageReportPage() {
  const { t, i18n } = useTranslation()
  const { reportId = '' } = useParams()
  const [report, setReport] = useState<StageReport | null>(null)
  const [draft, setDraft] = useState<Partial<Record<NarrativeSection, string>>>({})
  const [recommendation, setRecommendation] = useState('')
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [busy, setBusy] = useState(false)
  const [blockers, setBlockers] = useState<StepBlocker[]>([])
  const [reviewComments, setReviewComments] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const adopt = (next: StageReport) => {
    setReport(next)
    setDraft(next.narrative)
    setRecommendation(next.recommendation)
  }

  useEffect(() => {
    let cancelled = false
    getStageReport(reportId)
      .then((data) => {
        if (cancelled) return
        adopt(data)
        setState('ready')
      })
      .catch(() => !cancelled && setState('error'))
    return () => {
      cancelled = true
    }
  }, [reportId, reloadKey])

  const act = async (action: () => Promise<StageReport>, success: string) => {
    setBusy(true)
    setBlockers([])
    try {
      adopt(await action())
      if (success) toast.success(success)
      return true
    } catch (err) {
      if (err instanceof ApiError && Array.isArray(err.details?.blockers)) setBlockers(err.details.blockers as StepBlocker[])
      toast.error(workflowErrorMessage(err, t))
      return false
    } finally {
      setBusy(false)
    }
  }

  const changed = (): StageReportUpdate | null => {
    if (!report) return null
    const narrative = Object.fromEntries(Object.entries(draft).filter(([k, v]) => (report.narrative[k as NarrativeSection] ?? '') !== v))
    const body: StageReportUpdate = {}
    if (Object.keys(narrative).length) body.narrative = narrative
    if (recommendation !== report.recommendation && report.status === 'draft') body.recommendation = recommendation
    return Object.keys(body).length ? body : null
  }

  const save = async (quiet = false) => {
    const body = changed()
    if (!body || !report) return true
    return act(() => updateStageReport(report.id, body), quiet ? '' : t('execution.report.saved'))
  }

  const submit = async () => {
    if (!report) return
    if (!(await save(true))) return
    await act(() => submitStageReport(report.id), t('execution.report.submitted'))
  }

  if (state !== 'ready' || !report) {
    return (
      <CabLayout>
        <CabHeader title={t('execution.report.title')} />
        <main className="page-main flex flex-col gap-5">
          {state === 'loading' ? (
            <div className="skeleton h-40 w-full" aria-busy="true" />
          ) : (
            <Alert tone="error" role="alert" title={t('execution.report.loadError')} action={<Button size="md" variant="outline" onClick={() => { setState('loading'); setReloadKey((k) => k + 1) }}>{t('execution.retry')}</Button>} />
          )}
        </main>
      </CabLayout>
    )
  }

  const editable = report.editable
  const status = report.reviewStatus

  return (
    <CabLayout>
      <div className="flex min-h-screen flex-col">
        <CabHeader title={t('execution.report.title')} subtitle={`${report.auditNumber} · ${report.header.client.name} · ${enumLabel(t, report.stage)} · v${report.version}`} />
        <main className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden page-main">
          <nav className="flex flex-wrap items-center gap-2 text-body-sm font-medium text-neutral-600" aria-label={t('common.breadcrumb', 'Breadcrumb')}>
            <Link to="/cab/audit-reporting" className="hover:text-primary">{t('execution.report.breadcrumb')}</Link>
            <span aria-hidden>/</span>
            <Link to={executionPath(report.planNumber)} className="hover:text-primary">{report.planNumber}</Link>
            <span aria-hidden>/</span>
            <span className="font-semibold text-neutral-800">{t('execution.report.title')}</span>
          </nav>

          <Panel
            title={t('execution.report.workflowTitle')}
            description={t(`execution.report.workflowHint.${status}`)}
            actions={
              <>
                <Button type="button" size="md" variant="outline" icon={<DocumentDownload size={18} />} onClick={() => void downloadStageReportPdf(report, i18n.language)}>{t('execution.report.downloadPdf')}</Button>
                <Button type="button" size="md" variant="outline" icon={<Printer size={18} />} onClick={() => void downloadStageReportPdf(report, i18n.language, 'print')}>{t('execution.report.print')}</Button>
              </>
            }
          >
            {status === 'changesRequested' && report.review.comments && (
              <Alert tone="warning" title={t('execution.report.returnedBy', { name: report.review.reviewerName ?? '' })}>{report.review.comments}</Alert>
            )}
            {(status === 'issued' || status === 'acknowledged') && (
              <Alert tone="success" title={t('execution.report.issuedOn', { date: report.review.issuedAt?.slice(0, 10) ?? '', version: report.review.issuedVersion ?? report.version })}>
                {status === 'acknowledged'
                  ? t('execution.report.acknowledgedBy', { name: report.review.acknowledgedBy ?? '', date: report.review.acknowledgedAt?.slice(0, 10) ?? '' })
                  : t('execution.report.awaitingAcknowledgement')}
              </Alert>
            )}
            <BlockerList blockers={blockers} title={t('execution.report.blockersTitle')} />
            <div className="flex flex-wrap gap-2">
              {editable && (
                <>
                  <Button type="button" size="md" variant="outline" disabled={busy || !changed()} onClick={() => void save()} data-testid="save-report">{t('execution.report.save')}</Button>
                  <Button type="button" size="md" disabled={busy} onClick={() => void submit()} data-testid="submit-report">{t('execution.report.submit')}</Button>
                </>
              )}
              {status === 'approved' && (
                <Button type="button" size="md" disabled={busy} onClick={() => void act(() => issueStageReport(report.id), t('execution.report.issued'))} data-testid="issue-report">{t('execution.report.issue')}</Button>
              )}
            </div>
            {status === 'inReview' && (
              <div className="flex flex-col gap-3 rounded-md border border-info-500 bg-info-50 p-3 sm:p-4">
                <p className="text-body-sm font-semibold text-neutral-900">{t('execution.report.reviewTitle')}</p>
                <p className="text-caption text-neutral-700">{t('execution.report.reviewHint')}</p>
                <Field label={t('execution.report.reviewComments')} htmlFor="review-comments">
                  <textarea id="review-comments" value={reviewComments} onChange={(e) => setReviewComments(e.target.value)} className={TEXTAREA_CLASS} />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="md" disabled={busy} onClick={() => void act(() => reviewStageReport(report.id, { decision: 'approve', comments: reviewComments }), t('execution.report.approved'))} data-testid="approve-report">{t('execution.report.approve')}</Button>
                  <Button type="button" size="md" variant="outline" disabled={busy || !reviewComments.trim()} onClick={() => void act(() => reviewStageReport(report.id, { decision: 'return', comments: reviewComments }), t('execution.report.returned'))}>{t('execution.report.return')}</Button>
                </div>
              </div>
            )}
          </Panel>

          <ReportIdentification report={report} />

          <Panel title={t('execution.report.typeTitle')} description={t('execution.report.typeHint')}>
            <Field label={t('execution.report.type')} htmlFor="report-type">
              <select id="report-type" value={report.reportType} disabled={!editable || busy} onChange={(e) => void act(() => updateStageReport(report.id, { reportType: e.target.value as StageReportType }), t('execution.report.saved'))} className={`${INPUT_CLASS} sm:max-w-sm`}>
                {STAGE_REPORT_TYPES.map((type) => <option key={type} value={type}>{reportTypeLabel(t, type)}</option>)}
              </select>
            </Field>
          </Panel>

          <Panel title={t('execution.report.narrativeTitle')} description={t('execution.report.narrativeHint')}>
            <div className="flex flex-col gap-5">
              {report.sections.map((section) => {
                const suggestion = report.suggestions[section]
                const value = draft[section] ?? ''
                return (
                  <Field key={section} label={sectionLabel(t, section)} hint={sectionHint(t, section)} required={report.requiredSections.includes(section)} htmlFor={`section-${section}`}>
                    <textarea dir="auto" id={`section-${section}`} value={value} disabled={!editable} onChange={(e) => setDraft((d) => ({ ...d, [section]: e.target.value }))} className={TEXTAREA_CLASS} data-section={section} />
                    {editable && suggestion && suggestion !== value && (
                      <div className="flex flex-col gap-1.5 rounded-md bg-primary-25 p-2.5 text-caption text-neutral-700">
                        <span className="font-semibold text-primary">{t('execution.report.suggestion')}</span>
                        <span className="whitespace-pre-line">{suggestion}</span>
                        <button type="button" className="min-h-9 self-start rounded-md border border-primary bg-white px-3 text-caption font-semibold text-primary" onClick={() => setDraft((d) => ({ ...d, [section]: suggestion }))}>
                          {t('execution.report.useSuggestion')}
                        </button>
                      </div>
                    )}
                  </Field>
                )
              })}
            </div>
          </Panel>

          <ReportAutoContent report={report} />

          <Panel title={t('execution.report.recommendationTitle')} description={t('execution.report.recommendationHint')}>
            <fieldset className="flex flex-col gap-2" disabled={!editable || busy}>
              <legend className="mb-1 text-body-sm font-medium text-neutral-800">{t('execution.report.outcome')} <span className="text-error-700">*</span></legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup">
                {report.outcomes.map((o) => (
                  <button key={o} type="button" role="radio" aria-checked={report.recommendationOutcome === o} onClick={() => void act(() => updateStageReport(report.id, { recommendationOutcome: o }), t('execution.report.saved'))} className={cn('min-h-11 rounded-md border px-3 text-body-sm font-medium', report.recommendationOutcome === o ? 'border-primary bg-primary-50 text-primary' : 'border-neutral-200 bg-white text-neutral-700')} data-outcome={o}>
                    {outcomeLabel(t, o)}
                  </button>
                ))}
              </div>
            </fieldset>
            <Field label={t('execution.report.recommendation')} required htmlFor="recommendation" hint={report.status === 'finalized' ? t('execution.report.recommendationFrozen') : t('execution.report.recommendationNote')}>
              <textarea dir="auto" id="recommendation" value={recommendation} disabled={!editable || report.status === 'finalized'} onChange={(e) => setRecommendation(e.target.value)} className={TEXTAREA_CLASS} />
            </Field>
          </Panel>

          <ReportHistory report={report} />
        </main>
      </div>
    </CabLayout>
  )
}
