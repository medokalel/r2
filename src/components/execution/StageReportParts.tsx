import { useTranslation } from 'react-i18next'
import { Chip, InfoGrid, Panel } from '@/components/execution/executionUi'
import type { StageReport, StageReportFinding } from '@/lib/api/stageReportApi'
import { REVIEW_TONE, reportTypeLabel, reviewStatusLabel } from '@/lib/execution/executionText'
import { formatDate, formatDateTime } from '@/lib/format/dates'

/** Identification block of a stage report (17021-1 9.4.8 a to e): CAB, client, audit, team, dates, sites. */
export function ReportIdentification({ report }: { report: StageReport }) {
  const { t, i18n } = useTranslation()
  const h = report.header
  return (
    <Panel
      title={t('execution.report.identification')}
      actions={<Chip className={REVIEW_TONE[report.reviewStatus]}>{reviewStatusLabel(t, report.reviewStatus)}</Chip>}
    >
      <InfoGrid
        rows={[
          [t('execution.report.fields.cab'), [h.cab.legalName || h.cab.name, h.cab.accreditation].filter(Boolean).join(' · ')],
          [t('execution.report.fields.client'), h.client.name],
          [t('execution.report.fields.representative'), h.client.representative],
          [t('execution.report.fields.auditType'), `${h.auditType} · ${reportTypeLabel(t, report.reportType)}`],
          [t('execution.report.fields.standard'), h.standard],
          [t('execution.report.fields.scope'), h.scope],
          [t('execution.report.fields.sites'), h.sites],
          [t('execution.report.fields.dates'), `${formatDate(h.startDate, i18n.language)} · ${formatDate(h.endDate, i18n.language)}`],
          [t('execution.report.fields.team'), h.team.map((m) => `${m.name} (${m.role})`).join(', ')],
          [t('execution.report.fields.remote'), h.remote.enabled ? t('execution.report.remoteShare', { platform: h.remote.platform || '·', percent: h.remote.sharePercent }) : t('execution.summary.no')],
          [t('execution.report.fields.days'), t('execution.report.daysValue', { actual: h.actualDays, planned: h.plannedDays })],
          [t('execution.report.fields.version'), `v${report.version}`],
        ]}
      />
    </Panel>
  )
}

function FindingTable({ title, rows }: { title: string; rows: StageReportFinding[] }) {
  const { t } = useTranslation()
  if (!rows.length) return null
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-body-sm font-semibold text-neutral-900">{title} ({rows.length})</h3>
      <ul className="flex flex-col gap-2">
        {rows.map((f) => (
          <li key={f.id} className="rounded-md border border-neutral-100 p-3">
            <p className="text-caption font-semibold text-primary">{f.nonconformityCode ?? f.code} · {f.requirementRef}</p>
            <p className="mt-0.5 text-body-sm text-neutral-800">{f.statement}</p>
            {f.dueDate && <p className="mt-0.5 text-caption text-neutral-600">{t('execution.report.dueOn', { date: f.dueDate })}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Checklist coverage and findings, generated from the execution and the audit workspace. */
export function ReportAutoContent({ report }: { report: StageReport }) {
  const { t } = useTranslation()
  const f = report.auto.findings
  const none = !f.majors.length && !f.minors.length && !f.observations.length && !f.opportunities.length
  return (
    <>
      <Panel title={t('execution.report.coverage')} description={t('execution.report.autoHint')}>
        {report.auto.checklists.perChecklist.length === 0 ? (
          <p className="text-body-sm text-neutral-600">{t('execution.report.noChecklists')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {report.auto.checklists.perChecklist.map((c) => (
              <li key={c.name} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-neutral-25 px-3 py-2 text-body-sm">
                <span className="font-medium text-neutral-900">{c.name}</span>
                <span className="text-neutral-700">{t('execution.report.coverageValue', { answered: c.answered, total: c.total, nc: c.nonconforming })}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title={t('execution.report.findingsTitle')} description={t('execution.report.autoHint')}>
        {none && <p className="text-body-sm text-neutral-600">{t('execution.report.noFindings')}</p>}
        <FindingTable title={t('execution.report.findings.majors')} rows={f.majors} />
        <FindingTable title={t('execution.report.findings.minors')} rows={f.minors} />
        <FindingTable title={t('execution.report.findings.observations')} rows={f.observations} />
        <FindingTable title={t('execution.report.findings.opportunities')} rows={f.opportunities} />
      </Panel>
    </>
  )
}

/** Review history (submitted, returned, approved, issued, acknowledged, reopened). */
export function ReportHistory({ report }: { report: StageReport }) {
  const { t, i18n } = useTranslation()
  if (!report.review.events.length) return null
  return (
    <Panel title={t('execution.report.historyTitle')}>
      <ol className="flex flex-col gap-2">
        {report.review.events.map((e) => (
          <li key={e.id} className="rounded-md border border-neutral-100 px-3 py-2">
            <p className="text-body-sm font-medium text-neutral-900">{t(`execution.report.events.${e.action}`)} · v{e.version}</p>
            <p className="text-caption text-neutral-600">{e.byName} · {formatDateTime(e.createdAt, i18n.language)}</p>
            {e.comment && <p className="mt-1 text-body-sm text-neutral-700">{e.comment}</p>}
          </li>
        ))}
      </ol>
    </Panel>
  )
}
