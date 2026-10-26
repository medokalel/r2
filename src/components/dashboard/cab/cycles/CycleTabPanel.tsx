import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import type { CertificationCycleDetail, CycleRequest, CycleRequestStatus, CycleRequestType } from '@/lib/api/cabCertificationApi'
import type { CertificateCycleAction } from '@/components/dashboard/cab/cycles/CycleDialogs'
import { cabApplicationReviewPath } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { notSet, rangeText } from '@/lib/emptyValue'

export type CycleTab =
  | 'certificateDetails'
  | 'auditHistory'
  /* Single sections of "auditHistory", used by the certification-cycles register. */
  | 'audits'
  | 'findings'
  | 'history'
  | 'sites'
  | 'scope'
  | 'transfer'
  | 'suspension'
  | 'documents'
  | 'relatedApplications'

interface Props {
  tab: CycleTab
  cycle: CertificationCycleDetail
  /** Certificate actions allowed for the current certificate status. */
  certificateActions: CertificateCycleAction[]
  onCertificateAction: (action: CertificateCycleAction) => void
  onNewRequest: (type: CycleRequestType) => void
  onDecide: (request: CycleRequest, status: Exclude<CycleRequestStatus, 'open'>) => void
}

const card = 'rounded-lg border border-neutral-100 bg-white p-4 sm:p-5'
const th = 'px-3 py-2.5 text-start text-caption font-semibold text-neutral-600'
const td = 'px-3 py-2.5 text-body-sm text-neutral-800 align-top'

function Empty({ text }: { text: string }) {
  return <p className="rounded-md bg-neutral-50 px-4 py-5 text-center text-body-sm text-neutral-600">{text}</p>
}

function Heading({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-body font-bold text-neutral-900">{title}</h3>
      {action}
    </div>
  )
}

/** Content of the manage-cycle tabs other than "Certification cycle". */
export function CycleTabPanel({ tab, cycle, certificateActions, onCertificateAction, onNewRequest, onDecide }: Props) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const date = (iso: string | null | undefined) =>
    iso ? new Intl.DateTimeFormat(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso)) : notSet()
  const history = cycle.certificateHistory
  const requests = cycle.requests ?? []

  const actionLabel: Record<CertificateCycleAction, string> = {
    suspend: t('cab.manageCycle.actions.suspendCertificate', 'Suspend certificate'),
    reinstate: t('cab.manageCycle.actions.reinstateCertificate', 'Reinstate certificate'),
    withdraw: t('cab.manageCycle.actions.withdrawCertificate', 'Withdraw certificate'),
    extend: t('cab.manageCycle.actions.extendCertificate', 'Extend validity'),
    reissue: t('cab.manageCycle.actions.reissueCertificate', 'Reissue certificate'),
  }

  const requestList = (type: CycleRequestType, emptyText: string) => {
    const list = requests.filter((r) => r.type === type)
    if (!list.length) return <Empty text={emptyText} />
    return (
      <ul className="space-y-3">
        {list.map((r) => (
          <li key={r.id} className="rounded-lg border border-neutral-100 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-body-sm font-semibold text-neutral-900">
                  {r.code} · {r.title}
                </p>
                <p className="text-caption text-neutral-600">
                  {r.requestedBy} · {date(r.requestedAt)}
                </p>
              </div>
              <span
                className={cn(
                  'rounded-sm px-2.5 py-1 text-caption font-medium',
                  r.status === 'open' && 'bg-warning-50 text-warning-700',
                  r.status === 'approved' && 'bg-primary-50 text-primary',
                  r.status === 'completed' && 'bg-success-50 text-success-600',
                  r.status === 'rejected' && 'bg-error-100 text-error-600',
                )}
              >
                {t(`cab.manageCycle.requests.status.${r.status}`, r.statusLabel)}
              </span>
            </div>
            {Object.entries(r.metadata).filter(([, v]) => v).length > 0 && (
              <dl className="mt-2 grid grid-cols-1 gap-1 text-caption sm:grid-cols-2">
                {Object.entries(r.metadata)
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k}>
                      <dt className="inline text-neutral-600">{t(`cab.manageCycle.requests.${k}`, k)}: </dt>
                      <dd className="inline text-neutral-800">{v}</dd>
                    </div>
                  ))}
              </dl>
            )}
            {r.details && <p className="mt-2 whitespace-pre-line text-body-sm text-neutral-800">{r.details}</p>}
            {r.decidedAt && (
              <p className="mt-2 text-caption text-neutral-600">
                {t('cab.manageCycle.requests.decided', { defaultValue: 'Decided by {{name}} on {{date}}', name: r.decidedBy ?? notSet(), date: date(r.decidedAt) })}
                {r.decisionNote ? ` · ${r.decisionNote}` : ''}
              </p>
            )}
            {(r.status === 'open' || r.status === 'approved') && (
              <div className="mt-3 flex flex-wrap gap-2">
                {r.status === 'open' ? (
                  <Button type="button" size="sm" className="h-8 px-3" onClick={() => onDecide(r, 'approved')}>
                    {t('cab.manageCycle.requests.approve', 'Approve')}
                  </Button>
                ) : (
                  <Button type="button" size="sm" className="h-8 px-3" onClick={() => onDecide(r, 'completed')}>
                    {t('cab.manageCycle.requests.complete', 'Mark completed')}
                  </Button>
                )}
                <Button type="button" variant="outline" size="sm" className="h-8 px-3" onClick={() => onDecide(r, 'rejected')}>
                  {t('cab.manageCycle.requests.reject', 'Reject')}
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    )
  }

  const newRequestButton = (type: CycleRequestType, label: string) => (
    <Button type="button" size="sm" variant="outline" className="h-9 px-3" onClick={() => onNewRequest(type)}>
      {label}
    </Button>
  )

  const auditsSection = (
    <section className={card}>
      <Heading title={t('cab.manageCycle.audits.title', 'Audits')} />
      {!cycle.audits?.length ? (
        <Empty text={t('cab.manageCycle.audits.empty', 'No audits recorded for this cycle yet.')} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-neutral-100">
              <tr>
                <th className={th}>{t('cab.manageCycle.audits.plan', 'Audit')}</th>
                <th className={th}>{t('cab.manageCycle.audits.date', 'Date')}</th>
                <th className={th}>{t('cab.manageCycle.audits.lead', 'Lead auditor')}</th>
                <th className={th}>{t('cab.manageCycle.audits.status', 'Status')}</th>
                <th className={th}>{t('cab.manageCycle.audits.findings', 'Findings')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {cycle.audits.map((a) => (
                <tr key={a.id}>
                  <td className={td}>
                    <button type="button" className="font-semibold text-primary hover:underline" onClick={() => navigate(`/cab/audit-planning/build/${encodeURIComponent(a.planNumber)}`)}>
                      {a.planNumber}
                    </button>
                    <span className="block text-caption text-neutral-600">{a.stage}</span>
                  </td>
                  <td className={td}>{date(a.startDate)}</td>
                  <td className={td}>{a.leadAuditor || notSet()}</td>
                  <td className={td}>
                    {a.status}
                    {a.reportId && (
                      <button
                        type="button"
                        className="block text-caption text-primary hover:underline"
                        onClick={() => navigate(`/cab/audit-reporting/workspace?reportId=${encodeURIComponent(a.reportId as string)}`)}
                      >
                        {t('cab.manageCycle.audits.report', 'Report')}: {a.reportStatus}
                      </button>
                    )}
                  </td>
                  <td className={td}>
                    {a.findingsCount}
                    {a.nonconformityCount > 0 && (
                      <span className="block text-caption text-neutral-600">
                        {t('cab.manageCycle.audits.ncs', { defaultValue: '{{count}} NC, {{open}} open', count: a.nonconformityCount, open: a.openNonconformityCount })}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
  const findingsSection = (
    <section className={card}>
      <Heading title={t('cab.manageCycle.findings.title', 'Findings')} />
      {!cycle.findings?.length ? (
        <Empty text={t('cab.manageCycle.findings.empty', 'No findings recorded in this cycle.')} />
      ) : (
        <ul className="space-y-2">
          {cycle.findings.map((f) => (
            <li key={f.id} className="rounded-md border border-neutral-100 px-3 py-2 text-body-sm">
              <span className="font-semibold">{f.code}</span> · {f.type}
              {f.classification ? ` (${f.classification})` : ''} · {f.auditNumber}
              <span className="block text-caption text-neutral-600">{f.clause}</span>
              <span className="block text-neutral-800">{f.statement}</span>
              {f.nonconformityId ? (
                <button type="button" className="mt-1 text-caption font-semibold text-primary hover:underline" onClick={() => navigate(`/cab/nonconformities/${encodeURIComponent(f.nonconformityId as string)}`)}>
                  {f.nonconformityCode} · {f.status}
                </button>
              ) : (
                <span className="mt-1 block text-caption text-neutral-600">{f.status}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
  const historySection = (
    <section className={card}>
      <Heading title={t('cab.manageCycle.history.title', 'Cycle history')} />
      {!cycle.history?.length ? (
        <Empty text={t('cab.manageCycle.history.empty', 'No history yet.')} />
      ) : (
        <ol className="space-y-2">
          {cycle.history.map((h) => (
            <li key={h.id} className="border-s-2 border-primary-100 ps-3 text-body-sm">
              <span className="font-semibold text-neutral-900">{h.title}</span>
              <span className="block text-caption text-neutral-600">
                {date(h.date)}
                {h.by ? ` · ${h.by}` : ''}
                {h.detail ? ` · ${h.detail}` : ''}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )

  switch (tab) {
    case 'certificateDetails':
      return (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <section className={card}>
            <Heading title={t('cab.manageCycle.tabs.certificateDetails', 'Certificate details')} />
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                [t('cab.manageCycle.cert.number', 'Certificate number'), cycle.certificate.certificateNumber],
                [t('cab.manageCycle.cert.standard', 'Standard'), `${cycle.certificate.standard} · ${cycle.certificate.standardLabel}`],
                [t('cab.manageCycle.cert.status', 'Status'), cycle.certificate.statusLabel],
                [t('cab.manageCycle.cert.version', 'Version'), String(history?.version ?? 1)],
                [t('cab.manageCycle.cert.validFrom', 'Valid from'), cycle.certificate.validFrom],
                [t('cab.manageCycle.cert.validUntil', 'Valid until'), cycle.certificate.validUntil],
                [t('cab.manageCycle.cert.initial', 'Initial certification'), cycle.initialCertificationDate],
                [t('cab.manageCycle.cert.origin', 'Cycle origin'), cycle.origin === 'manual' ? t('cab.manageCycle.cert.manual', 'Registered manually') : t('cab.manageCycle.cert.automatic', 'Opened on issue')],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-caption text-neutral-600">{label}</dt>
                  <dd className="mt-0.5 text-body-sm font-semibold text-neutral-900">{value || notSet()}</dd>
                </div>
              ))}
            </dl>
            {cycle.notes && <p className="mt-3 text-body-sm text-neutral-700">{cycle.notes}</p>}
            {certificateActions.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {certificateActions.map((a) => (
                  <Button key={a} type="button" size="sm" variant={a === 'suspend' || a === 'withdraw' ? 'outline' : 'primary'} className="h-9 px-3" onClick={() => onCertificateAction(a)}>
                    {actionLabel[a]}
                  </Button>
                ))}
              </div>
            )}
          </section>
          <section className={card}>
            <Heading title={t('cab.certificateRegister.lifecycle.versions', 'Versions')} />
            {!history?.versions.length ? (
              <Empty text={t('cab.manageCycle.cert.noVersions', 'No certificate versions recorded.')} />
            ) : (
              <ul className="space-y-2">
                {history.versions.map((v) => (
                  <li key={v.id} className="rounded-md bg-neutral-25 px-3 py-2 text-body-sm">
                    <span className="font-semibold" dir="ltr">{v.certificateNumber}</span> · {t(`cab.certificateRegister.status.${v.status.toLowerCase()}`, v.status)}
                    <span className="block text-caption text-neutral-600">
                      {rangeText(date(v.issueDate), date(v.expiryDate))}
                      {v.reissueReason ? ` · ${v.reissueReason}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <Heading title={t('cab.certificateRegister.lifecycle.events', 'Status history')} />
              {!history?.events.length ? (
                <Empty text={t('cab.certificateRegister.lifecycle.noEvents', 'No status changes recorded yet.')} />
              ) : (
                <ol className="space-y-2">
                  {history.events.map((e) => (
                    <li key={e.id} className="border-s-2 border-primary-100 ps-3 text-body-sm">
                      <span className="font-semibold">{t(`cab.certificateRegister.lifecycle.event.${e.type}`, e.type)}</span>
                      <span className="block text-caption text-neutral-600">
                        {date(e.at)} · {e.by}
                        {e.reason ? ` · ${e.reason}` : ''}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        </div>
      )
    case 'auditHistory':
      return (
        <div className="flex flex-col gap-5">
          {auditsSection}
          {findingsSection}
          {historySection}
        </div>
      )
    case 'audits':
      return auditsSection
    case 'findings':
      return findingsSection
    case 'history':
      return historySection
    case 'sites':
      return (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <section className={card}>
            <Heading title={t('cab.manageCycle.sites.title', 'Certified sites')} />
            {!cycle.sites?.length ? (
              <Empty text={t('cab.manageCycle.sites.empty', 'No sites recorded for this cycle.')} />
            ) : (
              <ul className="space-y-2">
                {cycle.sites.map((s) => (
                  <li key={s.id} className="rounded-md bg-neutral-25 px-3 py-2 text-body-sm">
                    <span className="font-semibold">{s.name}</span>
                    {s.address && <span className="block text-caption text-neutral-600">{s.address}</span>}
                    {s.employeesInScope > 0 && (
                      <span className="block text-caption text-neutral-600">{t('cab.manageCycle.sites.employees', { defaultValue: '{{count}} employees in scope', count: s.employeesInScope })}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className={card}>
            <Heading
              title={t('cab.manageCycle.records.siteChanges.title', 'Site changes')}
              action={newRequestButton('siteChange', t('cab.manageCycle.actions.requestSiteChange', 'Request site change'))}
            />
            {requestList('siteChange', t('cab.manageCycle.requests.noneSite', 'No site change requests.'))}
          </section>
        </div>
      )
    case 'scope':
      return (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <section className={card}>
            <Heading title={t('cab.manageCycle.scope.title', 'Certified scope')} />
            <p className="whitespace-pre-line text-body-sm text-neutral-800">{cycle.certificateScope || notSet()}</p>
          </section>
          <section className={card}>
            <Heading
              title={t('cab.manageCycle.records.scopeChanges.title', 'Scope change requests')}
              action={newRequestButton('scopeChange', t('cab.manageCycle.actions.requestScopeChange', 'Request scope change'))}
            />
            {requestList('scopeChange', t('cab.manageCycle.requests.noneScope', 'No scope change requests.'))}
          </section>
        </div>
      )
    case 'transfer':
      return (
        <section className={card}>
          <Heading
            title={t('cab.manageCycle.records.transfers.title', 'Transfer records')}
            action={newRequestButton('transfer', t('cab.manageCycle.actions.transferCertificate', 'Transfer certificate'))}
          />
          {requestList('transfer', t('cab.manageCycle.requests.noneTransfer', 'No transfer requests.'))}
        </section>
      )
    case 'suspension': {
      const events = (history?.events ?? []).filter((e) => ['SUSPENDED', 'REINSTATED', 'WITHDRAWN', 'EXTENDED'].includes(e.type))
      return (
        <section className={card}>
          <Heading title={t('cab.manageCycle.records.suspensions.title', 'Suspension history')} />
          <p className="mb-3 text-body-sm text-neutral-700">
            {t('cab.manageCycle.suspension.current', { defaultValue: 'Current certificate status: {{status}}', status: cycle.certificate.statusLabel })}
          </p>
          {certificateActions.filter((a) => a !== 'reissue').length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {certificateActions
                .filter((a) => a !== 'reissue')
                .map((a) => (
                  <Button key={a} type="button" size="sm" variant={a === 'suspend' || a === 'withdraw' ? 'outline' : 'primary'} className="h-9 px-3" onClick={() => onCertificateAction(a)}>
                    {actionLabel[a]}
                  </Button>
                ))}
            </div>
          )}
          {!events.length ? (
            <Empty text={t('cab.manageCycle.suspension.empty', 'No suspension, reinstatement or extension recorded.')} />
          ) : (
            <ol className="space-y-2">
              {events.map((e) => (
                <li key={e.id} className="border-s-2 border-primary-100 ps-3 text-body-sm">
                  <span className="font-semibold">{t(`cab.certificateRegister.lifecycle.event.${e.type}`, e.type)}</span>
                  <span className="block text-caption text-neutral-600">
                    {date(e.at)} · {e.by}
                    {e.reason ? ` · ${e.reason}` : ''}
                    {e.newExpiryDate ? ` · ${date(e.newExpiryDate)}` : ''}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )
    }
    case 'documents':
      return (
        <section className={card}>
          <Heading title={t('cab.manageCycle.tabs.documents', 'Documents')} />
          {!cycle.documents?.length ? (
            <Empty text={t('cab.manageCycle.documents.empty', 'No documents for this cycle yet.')} />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {cycle.documents.map((d) => (
                <li key={`${d.kind}-${d.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="text-body-sm font-semibold text-neutral-900">{d.title}</p>
                    <p className="text-caption text-neutral-600">
                      {t(`cab.manageCycle.documents.kind.${d.kind}`, d.kind)} · {date(d.date)} · {d.status}
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="h-8 px-3" onClick={() => navigate(d.link)}>
                    {t('cab.manageCycle.documents.open', 'Open')}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )
    case 'relatedApplications':
      return (
        <section className={card}>
          <Heading title={t('cab.manageCycle.tabs.relatedApplications', 'Related applications')} />
          {!cycle.relatedApplications?.length ? (
            <Empty text={t('cab.manageCycle.applications.empty', 'No applications for this client.')} />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {cycle.relatedApplications.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="text-body-sm font-semibold text-neutral-900">
                      {a.applicationNumber}
                      {a.linkedToCycle && <span className="ms-2 rounded-sm bg-primary-50 px-2 py-0.5 text-caption text-primary">{t('cab.manageCycle.applications.thisCycle', 'This cycle')}</span>}
                    </p>
                    <p className="text-caption text-neutral-600">
                      {a.standards.join(', ')} · {a.status} · {date(a.submittedAt)}
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="h-8 px-3" onClick={() => navigate(cabApplicationReviewPath(a.id))}>
                    {t('cab.manageCycle.documents.open', 'Open')}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )
    default:
      return null
  }
}
