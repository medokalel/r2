import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Chip, InfoGrid, Panel } from '@/components/execution/executionUi'
import type { StepProps } from '@/components/execution/types'
import { stageReportPath, type ReportReviewStatus } from '@/lib/api/stageReportApi'
import { REVIEW_TONE, reviewStatusLabel } from '@/lib/execution/executionText'

/** Step 6: the stage report generated from the audit, then technical review, approval and issue to the client. */
export function StepReport({ ws }: StepProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const status = (ws.reportReviewStatus ?? 'notSubmitted') as ReportReviewStatus

  return (
    <Panel
      title={t('execution.reportStep.title')}
      description={t('execution.reportStep.description')}
      actions={ws.reportId ? <Chip className={REVIEW_TONE[status] ?? REVIEW_TONE.notSubmitted}>{reviewStatusLabel(t, status)}</Chip> : undefined}
    >
      {!ws.reportId ? (
        <p className="text-body-sm text-neutral-600">{t('execution.reportStep.noReport')}</p>
      ) : (
        <>
          <InfoGrid
            rows={[
              [t('execution.reportStep.checklistCoverage'), t('execution.conduct.answered', { answered: ws.conduct.progress.answered, total: ws.conduct.progress.total })],
              [t('execution.reportStep.findings'), String(ws.findings.length)],
              [t('execution.reportStep.timeDelivered'), t('execution.time.actual', { days: ws.time.actualDays })],
            ]}
          />
          <div className="flex flex-wrap gap-3">
            <Button type="button" size="md" onClick={() => navigate(stageReportPath(ws.reportId as string))} data-testid="open-stage-report">
              {t('execution.reportStep.open')}
            </Button>
            <Button type="button" size="md" variant="outline" onClick={() => navigate(`/cab/audit-reporting/workspace?reportId=${encodeURIComponent(ws.reportId as string)}`)}>
              {t('execution.teamReview.openWorkspace')}
            </Button>
          </div>
        </>
      )}
    </Panel>
  )
}
