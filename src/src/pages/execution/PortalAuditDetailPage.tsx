import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TickCircle } from 'iconsax-reactjs'
import { PortalLayout } from '@/components/layout/PortalLayout'
import { Alert } from '@/components/ui/Alert'
import { Chip, InfoGrid, Panel } from '@/components/execution/executionUi'
import { getClientAudit, type ClientAttendee, type ClientAuditView } from '@/lib/api/executionApi'
import { portalReportPath } from '@/lib/api/stageReportApi'
import { portalFindingResponsePath } from '@/lib/routes'
import { enumLabel } from '@/lib/enumLabel'
import { formatDate, formatDateTime } from '@/lib/format/dates'
import { stepLabel } from '@/lib/execution/executionText'
import { cn } from '@/lib/utils'

function AttendeeList({ attendees }: { attendees: ClientAttendee[] }) {
  const { t } = useTranslation()
  if (!attendees.length) return <p className="text-body-sm text-neutral-600">{t('execution.portal.noAttendance')}</p>
  return (
    <ul className="flex flex-col gap-1.5">
      {attendees.map((a, i) => (
        <li key={`${a.name}-${i}`} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-neutral-25 px-3 py-2 text-body-sm">
          <span className="font-medium text-neutral-900">{a.name}{a.position ? ` · ${a.position}` : ''}</span>
          <span className="text-caption text-neutral-600">{t(`execution.attendance.parties.${a.party}`)} · {a.signed ? t('execution.attendance.signed') : t('execution.attendance.notSigned')}</span>
        </li>
      ))}
    </ul>
  )
}

/** Client portal (/portal/audits/:planId): schedule, opening and closing meetings, findings to answer and the issued report. */
export function PortalAuditDetailPage() {
  const { t, i18n } = useTranslation()
  const { planId = '' } = useParams()
  const [view, setView] = useState<ClientAuditView | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    getClientAudit(planId).then((v) => alive && setView(v), () => alive && setError(true))
    return () => {
      alive = false
    }
  }, [planId])

  return (
    <PortalLayout title={t('execution.portal.title')} subtitle={view ? `${view.plan.planNumber} · ${enumLabel(t, view.plan.stage)}` : t('execution.portal.subtitle')}>
      <Link to="/portal/audits" className="text-body-sm font-semibold text-primary underline-offset-4 hover:underline">{t('execution.portal.back')}</Link>
      {error && <Alert tone="error" role="alert" title={t('execution.portal.loadError')} />}
      {!view && !error && <div className="skeleton h-40 w-full" aria-busy="true" />}
      {view && (
        <>
          <Panel title={`${view.plan.planNumber} · ${view.plan.standardName}`}>
            <InfoGrid
              rows={[
                [t('execution.summary.stage'), enumLabel(t, view.plan.stage)],
                [t('execution.summary.dates'), `${formatDate(view.plan.startDate, i18n.language)} · ${formatDate(view.plan.endDate, i18n.language)}`],
                [t('execution.summary.site'), view.plan.siteName],
                [t('execution.summary.lead'), view.plan.leadAuditor],
                [t('execution.summary.team'), view.plan.auditTeam.join(', ')],
                [t('execution.summary.remote'), view.plan.remoteEnabled ? view.plan.remotePlatform || t('execution.summary.yes') : t('execution.summary.no')],
              ]}
            />
            <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label={t('execution.stepperLabel')} data-testid="client-steps">
              {view.steps.map((s, i) => (
                <li key={s.key} className={cn('flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-center', s.done ? 'border-success-500 bg-success-25' : 'border-neutral-100')}>
                  <span className={cn('flex size-8 items-center justify-center rounded-full text-caption font-bold', s.done ? 'bg-success-500 text-white' : 'bg-neutral-50 text-neutral-700')}>
                    {s.done ? <TickCircle size={18} variant="Bold" /> : i + 1}
                  </span>
                  <span className="text-caption text-neutral-800">{stepLabel(t, s.key)}</span>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title={t('execution.portal.scheduleTitle')}>
            {view.plan.agenda.length === 0 ? (
              <p className="text-body-sm text-neutral-600">{t('execution.opening.noAgenda')}</p>
            ) : (
              <ol className="flex flex-col gap-2">
                {view.plan.agenda.map((a) => (
                  <li key={a.id} className="flex flex-col gap-0.5 rounded-md border border-neutral-100 px-3 py-2 sm:flex-row sm:gap-4">
                    <span className="shrink-0 text-caption font-semibold text-primary">{formatDate(a.date, i18n.language)} · {t('execution.timeRange', { start: a.startTime, end: a.endTime })}</span>
                    <span className="min-w-0 flex-1 text-body-sm text-neutral-900">{a.activity}</span>
                    <span className="text-caption text-neutral-600">{a.auditors.join(', ')}</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Panel title={t('execution.portal.openingTitle')} actions={<Chip className={view.opening.done ? 'border-success-500 bg-success-50 text-success-700' : 'border-neutral-300 bg-neutral-50 text-neutral-700'}>{view.opening.done ? t('execution.portal.held') : t('execution.portal.notHeld')}</Chip>}>
              {view.opening.heldAt && <p className="text-caption text-neutral-600">{formatDateTime(view.opening.heldAt, i18n.language)}</p>}
              <AttendeeList attendees={view.opening.attendance} />
            </Panel>
            <Panel title={t('execution.portal.closingTitle')} actions={<Chip className={view.closing.done ? 'border-success-500 bg-success-50 text-success-700' : 'border-neutral-300 bg-neutral-50 text-neutral-700'}>{view.closing.done ? t('execution.portal.held') : t('execution.portal.notHeld')}</Chip>}>
              {view.closing.done && (
                <InfoGrid
                  rows={[
                    [t('execution.closing.clientPosition'), view.closing.clientPosition ? t(`execution.closing.positions.${view.closing.clientPosition}`) : '·'],
                    [t('execution.closing.ncDueDate'), view.closing.ncResponseDueDate ? formatDate(view.closing.ncResponseDueDate, i18n.language) : '·'],
                  ]}
                />
              )}
              <AttendeeList attendees={view.closing.attendance} />
            </Panel>
          </div>

          {view.presentedFindings.length > 0 && (
            <Panel title={t('execution.portal.presentedTitle')} description={t('execution.portal.presentedDescription')}>
              <ul className="flex flex-col gap-2">
                {view.presentedFindings.map((f) => (
                  <li key={f.code} className="rounded-md border border-neutral-100 p-3">
                    <p className="text-caption font-semibold text-primary">{f.code} · {t(`execution.findingTypes.${f.type}`)}{f.classification ? ` · ${t(`execution.classifications.${f.classification}`)}` : ''}</p>
                    <p className="text-caption text-neutral-600">{f.requirementRef}</p>
                    <p className="mt-0.5 text-body-sm text-neutral-800">{f.statement}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel title={t('execution.portal.answerTitle')} description={t('execution.portal.answerDescription')}>
            {view.findingsToAnswer.length === 0 ? (
              <p className="text-body-sm text-neutral-600">{t('execution.portal.noFindingsToAnswer')}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {view.findingsToAnswer.map((f) => (
                  <li key={f.id} className="flex flex-col gap-2 rounded-md border border-neutral-100 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-body-sm font-semibold text-neutral-900">{f.code} · {t(`execution.classifications.${f.classification}`)}</p>
                      <p className="text-body-sm text-neutral-700">{f.description}</p>
                      {f.dueDate && <p className="text-caption text-neutral-600">{t('execution.report.dueOn', { date: formatDate(f.dueDate, i18n.language) })}</p>}
                    </div>
                    <Link to={portalFindingResponsePath(f.id)} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-body-sm font-semibold text-white">{t('execution.portal.respond')}</Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title={t('execution.portal.reportTitle')}>
            {view.report ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-body-sm text-neutral-800">
                  {t('execution.portal.reportIssued', { version: view.report.version, date: view.report.issuedAt ? formatDate(view.report.issuedAt, i18n.language) : '' })}
                  {view.report.acknowledged && ` · ${t('execution.portal.reportAcknowledged')}`}
                </p>
                <Link to={portalReportPath(view.report.id)} className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-body-sm font-semibold text-white" data-testid="open-client-report">{t('execution.portal.readReport')}</Link>
              </div>
            ) : (
              <p className="text-body-sm text-neutral-600">{t('execution.portal.noReport')}</p>
            )}
          </Panel>
        </>
      )}
    </PortalLayout>
  )
}
