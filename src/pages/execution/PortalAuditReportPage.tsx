import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DocumentDownload } from 'iconsax-reactjs'
import { PortalLayout } from '@/components/layout/PortalLayout'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Field, Panel } from '@/components/execution/executionUi'
import { INPUT_CLASS, TEXTAREA_CLASS } from '@/components/execution/fieldClasses'
import { ReportAutoContent, ReportIdentification } from '@/components/execution/StageReportParts'
import { acknowledgeReport, getClientReport, type StageReport } from '@/lib/api/stageReportApi'
import { outcomeLabel, sectionLabel } from '@/lib/execution/executionText'
import { downloadStageReportPdf } from '@/lib/pdf/stageReportPdf'
import { formatDate } from '@/lib/format/dates'
import { toast } from '@/lib/toast'
import { workflowErrorMessage } from '@/lib/workflowErrors'

/** Client portal (/portal/audit-reports/:reportId): the issued stage report and the acknowledgement of receipt. */
export function PortalAuditReportPage() {
  const { t, i18n } = useTranslation()
  const { reportId = '' } = useParams()
  const [report, setReport] = useState<StageReport | null>(null)
  const [error, setError] = useState(false)
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    getClientReport(reportId).then((r) => alive && setReport(r), () => alive && setError(true))
    return () => {
      alive = false
    }
  }, [reportId])

  const acknowledge = async () => {
    if (!report) return
    setBusy(true)
    try {
      setReport(await acknowledgeReport(report.id, { name: name.trim() || undefined, note: note.trim() || undefined }))
      toast.success(t('execution.portal.acknowledged'))
    } catch (err) {
      toast.error(workflowErrorMessage(err, t))
    } finally {
      setBusy(false)
    }
  }

  return (
    <PortalLayout title={t('execution.portal.reportPageTitle')} subtitle={report ? `${report.auditNumber} · v${report.version}` : undefined}>
      <Link to={report ? `/portal/audits/${encodeURIComponent(report.auditPlanId)}` : '/portal/audits'} className="text-body-sm font-semibold text-primary underline-offset-4 hover:underline">{t('execution.portal.back')}</Link>
      {error && <Alert tone="error" role="alert" title={t('execution.portal.reportLoadError')} />}
      {!report && !error && <div className="skeleton h-40 w-full" aria-busy="true" />}
      {report && (
        <>
          <Panel
            title={t('execution.portal.acknowledgeTitle')}
            actions={<Button type="button" size="md" variant="outline" icon={<DocumentDownload size={18} />} onClick={() => void downloadStageReportPdf(report, i18n.language)}>{t('execution.report.downloadPdf')}</Button>}
          >
            {report.reviewStatus === 'acknowledged' ? (
              <Alert tone="success" title={t('execution.report.acknowledgedBy', { name: report.review.acknowledgedBy ?? '', date: report.review.acknowledgedAt ? formatDate(report.review.acknowledgedAt, i18n.language) : '' })}>
                {report.review.acknowledgementNote}
              </Alert>
            ) : (
              <div className="flex flex-col gap-3" data-testid="acknowledge-form">
                <p className="text-body-sm text-neutral-700">{t('execution.portal.acknowledgeHint')}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label={t('execution.portal.yourName')} htmlFor="ack-name"><input id="ack-name" value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} /></Field>
                </div>
                <Field label={t('execution.portal.note')} htmlFor="ack-note"><textarea id="ack-note" value={note} onChange={(e) => setNote(e.target.value)} className={TEXTAREA_CLASS} /></Field>
                <div><Button type="button" size="md" disabled={busy} onClick={() => void acknowledge()} data-testid="acknowledge-report">{t('execution.portal.acknowledge')}</Button></div>
              </div>
            )}
          </Panel>

          <ReportIdentification report={report} />

          <Panel title={t('execution.report.narrativeTitle')}>
            <div className="flex flex-col gap-4">
              {report.sections.filter((s) => report.narrative[s]?.trim()).map((s) => (
                <div key={s}>
                  <h3 className="text-body-sm font-semibold text-neutral-900">{sectionLabel(t, s)}</h3>
                  <p dir="auto" className="mt-1 whitespace-pre-line text-start text-body-sm text-neutral-800">{report.narrative[s]}</p>
                </div>
              ))}
            </div>
          </Panel>

          <ReportAutoContent report={report} />

          <Panel title={t('execution.report.recommendationTitle')}>
            {report.recommendationOutcome && <p className="text-body-sm font-semibold text-primary">{outcomeLabel(t, report.recommendationOutcome)}</p>}
            <p className="whitespace-pre-line text-body-sm text-neutral-800">{report.recommendation}</p>
            <p className="text-caption text-neutral-600">{t('execution.portal.recommendationNote')}</p>
          </Panel>
        </>
      )}
    </PortalLayout>
  )
}
