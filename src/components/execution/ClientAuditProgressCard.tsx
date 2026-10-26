import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Chip } from '@/components/execution/executionUi'
import { listClientAudits, type ClientAuditSummary } from '@/lib/api/executionApi'
import { portalReportPath } from '@/lib/api/stageReportApi'
import { enumLabel } from '@/lib/enumLabel'
import { formatDate } from '@/lib/format/dates'
import { stepLabel } from '@/lib/execution/executionText'

/** Client portal: audits in progress and issued reports, shown above the audit visits list. */
export function ClientAuditProgressCard() {
  const { t, i18n } = useTranslation()
  const [audits, setAudits] = useState<ClientAuditSummary[]>([])

  useEffect(() => {
    let alive = true
    listClientAudits().then((rows) => alive && setAudits(rows.filter((a) => a.executionStarted || a.reportId)), () => alive && setAudits([]))
    return () => {
      alive = false
    }
  }, [])

  if (!audits.length) return null
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-neutral-100 bg-white p-4 sm:p-5" data-testid="client-audit-progress">
      <div>
        <h2 className="text-body font-bold text-neutral-900">{t('execution.portal.progressTitle')}</h2>
        <p className="text-body-sm text-neutral-600">{t('execution.portal.progressDescription')}</p>
      </div>
      <ul className="flex flex-col gap-2">
        {audits.map((a) => (
          <li key={a.planId} className="flex flex-col gap-2 rounded-md border border-neutral-100 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-body-sm font-semibold text-neutral-900">{a.planNumber} · {enumLabel(t, a.stage)}</p>
              <p className="text-caption text-neutral-600">{a.standardName} · {formatDate(a.startDate, i18n.language)}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {a.currentStep && !a.reportId && <Chip className="border-primary-300 bg-primary-50 text-primary-700">{stepLabel(t, a.currentStep)}</Chip>}
                {a.findingsToAnswer > 0 && <Chip className="border-error-500 bg-error-50 text-error-700">{t('execution.portal.findingsToAnswer', { count: a.findingsToAnswer })}</Chip>}
                {a.reportId && (
                  <Chip className={a.reportAcknowledged ? 'border-success-500 bg-success-50 text-success-700' : 'border-warning-500 bg-warning-50 text-warning-700'}>
                    {a.reportAcknowledged ? t('execution.portal.reportAcknowledged') : t('execution.portal.reportToAcknowledge')}
                  </Chip>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to={`/portal/audits/${encodeURIComponent(a.planId)}`} className="inline-flex min-h-11 items-center rounded-md border border-primary px-4 text-body-sm font-semibold text-primary hover:bg-primary-50">{t('execution.portal.viewAudit')}</Link>
              {a.reportId && (
                <Link to={portalReportPath(a.reportId)} className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-body-sm font-semibold text-white hover:bg-primary-hover">{t('execution.portal.readReport')}</Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
