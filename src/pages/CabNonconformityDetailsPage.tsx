import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ReturnToBanner } from '@/components/ui/ReturnToBanner'
import { activityText } from '@/lib/activityText'
import { useNavigate, useParams } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { NonconformityStatusBadge } from '@/components/dashboard/cab/NonconformityStatusBadge'
import { AppIcon, AttachIcon, CheckIcon, HistoryIcon } from '@/components/icons'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import {
  getNonconformities,
  type CorrectiveActionStage,
  type NonconformityItem,
  type NonconformityStatus,
} from '@/lib/api/cabNonconformitiesApi'
import { enumLabel } from '@/lib/enumLabel'
import { ROUTES, cabNonconformityDetailsPath, cabNonconformityResponsePath } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { displayCountry } from '@/lib/localizeCountry'
import { notSet } from '@/lib/emptyValue'

const STAGES: CorrectiveActionStage[] = ['correction', 'root_cause', 'corrective_action', 'verification']

const CLASS_STYLE: Record<string, string> = {
  critical: 'bg-error-100 text-error-600',
  major: 'bg-error-50 text-error-600',
  minor: 'bg-warning-50 text-warning-700',
  observation: 'bg-primary-50 text-primary',
}

function Card({ title, aside, children, className }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-lg border border-neutral-100 bg-white p-4 shadow-card sm:p-6', className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-body font-bold text-text-primary">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-neutral-100 py-3 last:border-0 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-body-sm text-text-secondary">{label}</dt>
      <dd className="text-body-sm font-medium text-text-primary">{children || notSet()}</dd>
    </div>
  )
}

/** One nonconformity on its own page — every detail, whatever its status (open, in progress, submitted, closed, overdue). */
export function CabNonconformityDetailsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { ncId = '' } = useParams()
  const [all, setAll] = useState<NonconformityItem[] | null>(null)

  useEffect(() => {
    let cancelled = false
    getNonconformities()
      .then((rows) => !cancelled && setAll(rows))
      .catch(() => !cancelled && setAll([]))
    return () => {
      cancelled = true
    }
  }, [])

  const index = useMemo(() => (all ?? []).findIndex((n) => n.id === ncId || n.ncId === ncId), [all, ncId])
  const nc = index >= 0 && all ? all[index] : null
  const prev = all && index > 0 ? all[index - 1] : null
  const next = all && index >= 0 && index < all.length - 1 ? all[index + 1] : null
  const statusLabel = (status: NonconformityStatus) => t(`cab.nonconformities.status.${status}`)

  const crumbs = [
    { label: t('cab.nonconformities.breadcrumbParent', 'Workspace'), to: ROUTES.cabWorkspace },
    { label: t('cab.nonconformities.title'), to: ROUTES.cabNonconformities },
    { label: nc?.ncId ?? ncId },
  ]

  if (all && !nc) {
    return (
      <CabLayout>
        <CabHeader title={t('cab.nonconformities.title')} />
        <main className="flex flex-1 flex-col gap-5 page-main">
          <Breadcrumbs items={crumbs} />
          <div className="rounded-lg border border-neutral-100 bg-white p-8 text-center">
            <p className="text-body text-text-secondary">{t('cab.nonconformities.details.notFound', 'This nonconformity was not found.')}</p>
            <Button variant="primary" className="mt-4" onClick={() => navigate(ROUTES.cabNonconformities)}>
              {t('cab.nonconformities.details.backToList', 'Back to nonconformities')}
            </Button>
          </div>
        </main>
      </CabLayout>
    )
  }

  const stageState = (stage: CorrectiveActionStage) => {
    const items = nc?.actions.filter((a) => a.stage === stage) ?? []
    if (!items.length) return 'none' as const
    if (items.every((a) => a.status === 'accepted')) return 'accepted' as const
    if (items.some((a) => a.status === 'rejected')) return 'rejected' as const
    if (items.some((a) => a.status === 'submitted')) return 'submitted' as const
    return 'pending' as const
  }
  const closed = nc?.status === 'closed'

  return (
    <CabLayout>
      <CabHeader title={t('cab.nonconformities.title')} />
      <main className="flex flex-1 flex-col gap-5 overflow-auto page-main">
        <ReturnToBanner />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Breadcrumbs items={crumbs} />
          <div className="flex items-center gap-2">
            <Button variant="secondary" disabled={!prev} onClick={() => prev && navigate(cabNonconformityDetailsPath(prev.id))} className="h-10 min-w-0 px-3 text-body-sm">
              <span aria-hidden className="inline-block rtl:-scale-x-100">←</span>
              {t('cab.nonconformities.details.previous', 'Previous')}
            </Button>
            <Button variant="secondary" disabled={!next} onClick={() => next && navigate(cabNonconformityDetailsPath(next.id))} className="h-10 min-w-0 px-3 text-body-sm">
              {t('cab.nonconformities.details.next', 'Next')}
              <span aria-hidden className="inline-block rtl:-scale-x-100">→</span>
            </Button>
          </div>
        </div>

        {!nc ? (
          <p className="text-body-sm text-text-secondary">{t('common.loading')}</p>
        ) : (
          <>
            {/* Summary */}
            <section className="rounded-lg border border-neutral-100 bg-white p-4 shadow-card sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-page-title text-text-primary" dir="ltr">{nc.ncId}</h1>
                    <NonconformityStatusBadge status={nc.status} label={statusLabel(nc.status)} />
                    <span className={cn('rounded-full px-3 py-1 text-caption font-semibold', CLASS_STYLE[nc.classification] ?? 'bg-neutral-25 text-neutral-800')}>
                      {enumLabel(t, nc.classificationLabel)}
                    </span>
                    {nc.overdue && !closed && (
                      <span className="rounded-full bg-error-500 px-3 py-1 text-caption font-semibold text-white">{t('cab.nonconformities.status.overdue')}</span>
                    )}
                  </div>
                  <p className="mt-2 text-body font-medium text-text-primary">{nc.clientName}</p>
                  <p className="mt-0.5 text-body-sm text-text-secondary">
                    {t('cab.nonconformities.fields.finding')}: <span dir="ltr">{nc.findingId}</span> · {t('cab.nonconformities.fields.raisedDate')}: <span dir="ltr">{nc.raisedDate}</span> · {t('cab.nonconformities.table.due')}:{' '}
                    <span dir="ltr" className={cn(nc.overdue && !closed && 'font-semibold text-error-600')}>{nc.dueDate}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" onClick={() => navigate(cabNonconformityResponsePath(nc.id))}>
                    {closed ? t('cab.nonconformities.details.viewResponse', 'View response') : t('cab.nonconformities.openResponse')}
                  </Button>
                </div>
              </div>

              {/* Corrective-action progress */}
              <ol className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                {STAGES.map((stage, i) => {
                  const state = stageState(stage)
                  return (
                    <li key={stage} className={cn('rounded-lg border p-3', state === 'accepted' ? 'border-success-100 bg-success-50' : state === 'rejected' ? 'border-error-100 bg-error-50' : state === 'submitted' ? 'border-primary-100 bg-primary-25' : 'border-neutral-100 bg-neutral-25')}>
                      <div className="flex items-center gap-2">
                        <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-full text-caption font-bold', state === 'accepted' ? 'bg-success-500 text-white' : state === 'rejected' ? 'bg-error-500 text-white' : state === 'submitted' ? 'bg-primary text-white' : 'bg-white text-neutral-700 ring-1 ring-neutral-100')}>
                          {state === 'accepted' ? <AppIcon icon={CheckIcon} size={14} /> : i + 1}
                        </span>
                        <p className="text-body-sm font-semibold text-text-primary">{t(`cab.nonconformities.actionStage.${stage}`)}</p>
                      </div>
                      <p className="mt-1.5 text-caption text-text-secondary">{t(`cab.nonconformities.details.stageState.${state}`)}</p>
                    </li>
                  )
                })}
              </ol>
            </section>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.618fr)_minmax(0,1fr)]">
              <div className="flex min-w-0 flex-col gap-5">
                <Card title={t('cab.nonconformities.fields.description')}>
                  <p dir="auto" className="whitespace-pre-line text-start text-body leading-[1.7] text-text-primary">{nc.description}</p>
                </Card>

                <Card title={t('cab.nonconformities.tabs.actions')} aside={<span className="rounded-full bg-primary-25 px-2.5 py-0.5 text-caption font-semibold text-primary">{nc.actions.length}</span>}>
                  {nc.actions.length === 0 ? (
                    <p className="py-4 text-center text-body-sm text-text-secondary">{t('cab.nonconformities.noActions')}</p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {nc.actions.map((action) => (
                        <li key={action.id} className="rounded-lg border border-neutral-100 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="text-body-sm font-semibold text-text-primary">{t(`cab.nonconformities.actionStage.${action.stage}`)}</p>
                            <span className={cn('rounded-full px-2.5 py-0.5 text-caption font-medium', action.status === 'accepted' ? 'bg-success-50 text-success-700' : action.status === 'rejected' ? 'bg-error-50 text-error-600' : action.status === 'submitted' ? 'bg-primary-25 text-primary' : 'bg-neutral-25 text-neutral-800')}>
                              {t(`cab.nonconformities.actionStatus.${action.status}`)}
                            </span>
                          </div>
                          <p dir="auto" className="mt-2 text-start text-body-sm leading-[1.6] text-neutral-800">{action.description}</p>
                          <p className="mt-2 text-caption text-text-secondary">
                            {action.ownerName} · {t('cab.nonconformities.table.due')}: <span dir="ltr">{action.dueDate}</span>
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                <Card title={t('cab.nonconformities.tabs.history')}>
                  {nc.history.length === 0 ? (
                    <p className="py-4 text-center text-body-sm text-text-secondary">{notSet()}</p>
                  ) : (
                    <ol className="relative flex flex-col gap-5 border-s-2 border-primary-50 ps-6">
                      {nc.history.map((entry) => (
                        <li key={entry.id} className="relative">
                          <span className="absolute -start-[33px] top-0 flex size-6 items-center justify-center rounded-full bg-primary-50 text-primary">
                            <AppIcon icon={HistoryIcon} size={13} />
                          </span>
                          <p dir="auto" className="text-start text-body-sm font-medium text-text-primary">{activityText(t, entry.text)}</p>
                          <p className="mt-0.5 text-caption text-text-secondary">
                            {entry.by} · {entry.at}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                </Card>
              </div>

              <div className="flex min-w-0 flex-col gap-5">
                <Card title={t('cab.nonconformities.tabs.details')}>
                  <dl>
                    <Row label={t('cab.nonconformities.table.client')}>
                      {nc.clientName} <span className="text-text-secondary" dir="ltr">({nc.clientId})</span>
                    </Row>
                    <Row label={t('cab.nonconformities.fields.country')}>{displayCountry(nc.country)}</Row>
                    <Row label={t('cab.nonconformities.fields.finding')}>
                      <button type="button" onClick={() => navigate(ROUTES.cabAuditReporting)} className="text-primary hover:underline" dir="ltr">
                        {nc.findingId}
                      </button>
                    </Row>
                    <Row label={t('cab.nonconformities.details.audit', 'Audit')}><span dir="ltr">{nc.auditId}</span></Row>
                    <Row label={t('cab.nonconformities.table.classification')}>{enumLabel(t, nc.classificationLabel)}</Row>
                    <Row label={t('cab.nonconformities.table.owner')}>{nc.ownerName}</Row>
                    <Row label={t('cab.nonconformities.table.status')}>
                      <NonconformityStatusBadge status={nc.status} label={statusLabel(nc.status)} />
                    </Row>
                  </dl>
                </Card>

                <Card title={t('cab.nonconformities.details.contact', 'Client contact')}>
                  <dl>
                    <Row label={t('cab.nonconformities.fields.primaryContact')}>{nc.primaryContactName}</Row>
                    <Row label={t('cab.nonconformities.fields.email')}>
                      <a href={`mailto:${nc.primaryContactEmail}`} className="break-all text-primary hover:underline" dir="ltr">
                        {nc.primaryContactEmail}
                      </a>
                    </Row>
                  </dl>
                </Card>

                <Card title={t('cab.nonconformities.tabs.attachments')} aside={<span className="rounded-full bg-primary-25 px-2.5 py-0.5 text-caption font-semibold text-primary">{nc.attachments.length}</span>}>
                  {nc.attachments.length === 0 ? (
                    <p className="py-4 text-center text-body-sm text-text-secondary">{t('cab.nonconformities.noAttachments')}</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {nc.attachments.map((file) => (
                        <li key={file.id} className="flex items-start gap-3 rounded-md border border-neutral-100 p-3">
                          <AppIcon icon={AttachIcon} size={18} className="mt-0.5 shrink-0 text-primary" />
                          <div className="min-w-0">
                            <p dir="auto" className="truncate text-start text-body-sm font-medium text-text-primary">{file.name}</p>
                            <p className="mt-0.5 text-caption text-text-secondary">
                              <span dir="ltr">{file.sizeLabel}</span> · {file.uploadedBy} · {file.uploadedAt}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            </div>
          </>
        )}
      </main>
    </CabLayout>
  )
}
