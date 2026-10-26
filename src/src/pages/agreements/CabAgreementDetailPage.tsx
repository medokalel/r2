import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DocumentDownload, Edit2, Refresh, Send2, Notification, TickCircle, CloseCircle, DocumentCopy } from 'iconsax-reactjs'
import { AppIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Textarea, TextField } from '@/components/ui/TextField'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { ErrorBlock, KeyValue, LoadingBlock, PageHeader } from '@/components/platform/PlatformUi'
import { AgreementStatusBadge } from '@/components/agreements/AgreementStatusBadge'
import { AgreementDocumentView } from '@/components/agreements/AgreementDocumentView'
import { AgreementSignatures } from '@/components/agreements/AgreementSignatures'
import { AgreementAuditTrail } from '@/components/agreements/AgreementAuditTrail'
import { AgreementFlow } from '@/components/agreements/AgreementFlow'
import { AgreementFormDialog } from '@/components/agreements/AgreementFormDialog'
import { SignAgreementDialog } from '@/components/agreements/SignAgreementDialog'
import { AgreementIntegrity } from '@/components/agreements/AgreementIntegrity'
import { agreementErrorMessage, kindTitle } from '@/components/agreements/agreementHelpers'
import {
  countersignAgreement,
  createAmendment,
  getAgreement,
  listAmendmentSources,
  remindAgreement,
  requestCountersignCode,
  sendAgreement,
  terminateAgreement,
  updateAgreement,
  type AgreementDetail,
  type AmendmentSource,
} from '@/lib/api/agreementsApi'
import { formatDate, formatDateTime } from '@/lib/format/dates'
import { downloadAgreementPdf } from '@/lib/pdf/agreementPdf'
import { ROUTES, cabAgreementPath } from '@/lib/routes'
import { toast } from '@/lib/toast'

/** Variables a CAB usually adjusts on a draft before sending it. */
const EDITABLE_VARIABLES = ['client.legalName', 'client.representative', 'client.address', 'standards', 'scope', 'sites', 'fees', 'currency', 'paymentTerms'] as const
const MULTILINE = new Set(['scope', 'sites', 'fees'])

type Dialog = 'edit' | 'terminate' | 'amend' | 'countersign' | null

/** CAB agreement detail (/cab/agreements/:agreementId): text, signatures, audit trail and the lifecycle actions. */
export function CabAgreementDetailPage() {
  const { t, i18n } = useTranslation()
  const { agreementId = '' } = useParams()
  const navigate = useNavigate()
  const [a, setA] = useState<AgreementDetail | null>(null)
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [vars, setVars] = useState<Record<string, string>>({})
  const [reason, setReason] = useState('')
  const [sources, setSources] = useState<AmendmentSource[]>([])
  const [sourceId, setSourceId] = useState('')

  const load = useCallback(() => {
    setError(false)
    getAgreement(agreementId).then(setA, () => setError(true))
  }, [agreementId])

  useEffect(() => {
    let alive = true
    getAgreement(agreementId).then(
      (detail) => alive && setA(detail),
      () => alive && setError(true),
    )
    return () => {
      alive = false
    }
  }, [agreementId])

  const run = async (key: string, action: () => Promise<AgreementDetail>, success: string) => {
    setBusy(key)
    try {
      setA(await action())
      toast.success(success)
    } catch (err) {
      toast.error(agreementErrorMessage(err, t))
    } finally {
      setBusy(null)
    }
  }

  const openEdit = () => {
    if (!a) return
    setVars(Object.fromEntries(EDITABLE_VARIABLES.map((k) => [k, a.variables[k] ?? ''])))
    setDialog('edit')
  }
  const openAmend = async () => {
    if (!a) return
    setReason('')
    setSourceId('')
    setDialog('amend')
    try {
      setSources(await listAmendmentSources(a.id))
    } catch {
      setSources([])
    }
  }

  const download = async () => {
    if (!a) return
    setBusy('pdf')
    try {
      await downloadAgreementPdf(a, t, i18n.language)
    } catch (err) {
      toast.error(agreementErrorMessage(err, t))
    } finally {
      setBusy(null)
    }
  }

  const title = a ? kindTitle(t, a) : t('agreements.register.title')

  return (
    <CabLayout tourId="cab-agreement-detail" tourSteps={[]}>
      <CabHeader title={t('agreements.register.title')} />
      <main className="flex min-w-0 flex-1 flex-col gap-5 page-main">
        <PageHeader
          title={a ? `${title} ${a.reference}` : title}
          subtitle={a ? a.clientName : undefined}
          crumbs={[
            { label: t('agreements.common.hub'), to: ROUTES.workspace },
            { label: t('agreements.register.title'), to: ROUTES.cabAgreements },
            { label: a?.reference ?? '' },
          ]}
          actions={
            a ? (
              <>
                <Button variant="secondary" size="sm" icon={<AppIcon icon={DocumentDownload} size={18} />} onClick={() => void download()} disabled={busy === 'pdf'} className="w-full sm:w-auto">
                  {t('agreements.actions.download')}
                </Button>
                {a.actions.send && (
                  <Button variant="primary" size="sm" icon={<AppIcon icon={Send2} size={18} />} disabled={busy === 'send'} onClick={() => void run('send', () => sendAgreement(a.id), t('agreements.toast.sent'))} className="w-full sm:w-auto">
                    {t('agreements.actions.send')}
                  </Button>
                )}
                {a.actions.remind && (
                  <Button variant="primary" size="sm" icon={<AppIcon icon={Notification} size={18} />} disabled={busy === 'remind'} onClick={() => void run('remind', () => remindAgreement(a.id), t('agreements.toast.reminded'))} className="w-full sm:w-auto">
                    {t('agreements.actions.remind')}
                  </Button>
                )}
                {a.actions.countersign && (
                  <Button variant="primary" size="sm" icon={<AppIcon icon={TickCircle} size={18} />} onClick={() => setDialog('countersign')} className="w-full sm:w-auto">
                    {t('agreements.actions.countersign')}
                  </Button>
                )}
                {a.actions.amend && (
                  <Button variant="secondary" size="sm" icon={<AppIcon icon={DocumentCopy} size={18} />} onClick={() => void openAmend()} className="w-full sm:w-auto">
                    {t('agreements.actions.amend')}
                  </Button>
                )}
              </>
            ) : undefined
          }
        />

        {error && !a ? <ErrorBlock message={t('agreements.common.loadError')} onRetry={load} /> : null}
        {!error && !a ? <LoadingBlock rows={6} /> : null}

        {a && (
          <>
            <div className="flex min-w-0 flex-col gap-3 rounded-lg border border-neutral-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <AgreementFlow status={a.status} />
              <AgreementStatusBadge status={a.status} />
            </div>

            {a.status === 'terminated' && a.terminationReason && (
              <p role="status" className="rounded-md border border-error-100 bg-error-50 px-4 py-3 text-body-sm text-error-700">
                {t('agreements.detail.terminated', { date: formatDate(a.terminatedAt), reason: a.terminationReason })}
              </p>
            )}
            {a.supersededBy && (
              <p role="status" className="rounded-md border border-neutral-100 bg-neutral-25 px-4 py-3 text-body-sm text-neutral-700">
                {t('agreements.detail.superseded')}{' '}
                <Link to={cabAgreementPath(a.supersededBy.id)} className="font-semibold text-primary underline-offset-4 hover:underline" dir="ltr">
                  {a.supersededBy.reference}
                </Link>
              </p>
            )}
            {a.status === 'draft' && (
              <div className="flex flex-col gap-3 rounded-md border border-primary-100 bg-primary-25 px-4 py-3 text-body-sm text-primary sm:flex-row sm:items-center sm:justify-between">
                <span>{t('agreements.detail.draftHint')}</span>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" icon={<AppIcon icon={Edit2} size={16} />} onClick={openEdit}>
                    {t('agreements.actions.edit')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<AppIcon icon={Refresh} size={16} />}
                    disabled={busy === 'refresh'}
                    onClick={() => void run('refresh', () => updateAgreement(a.id, { refreshTemplate: true }), t('agreements.toast.refreshed'))}
                  >
                    {t('agreements.actions.refresh')}
                  </Button>
                </div>
              </div>
            )}

            <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="flex min-w-0 flex-col gap-5">
                <AgreementDocumentView
                  title={kindTitle(t, a)}
                  reference={a.reference}
                  sections={a.sections}
                  meta={a.amendment ? t('agreements.amendment.replaces', { reference: a.amendment.previousReference ?? '' }) : undefined}
                />
                <AgreementSignatures signatures={a.signatures} />
              </div>
              <aside className="flex min-w-0 flex-col gap-5">
                <section className="rounded-lg border border-neutral-100 bg-white p-4 sm:p-5">
                  <h2 className="mb-3 text-body font-semibold text-neutral-900">{t('agreements.detail.summary')}</h2>
                  <dl className="grid grid-cols-1 gap-3">
                    <KeyValue label={t('agreements.fields.client')}>{a.clientName}</KeyValue>
                    <KeyValue label={t('agreements.fields.standards')}>{a.standards || t('agreements.common.notSet')}</KeyValue>
                    <KeyValue label={t('agreements.fields.scope')}>{a.scope || t('agreements.common.notSet')}</KeyValue>
                    <KeyValue label={t('agreements.fields.offer')}>
                      <span dir="ltr">{a.offerNumber ?? t('agreements.common.notSet')}</span>
                    </KeyValue>
                    <KeyValue label={t('agreements.fields.sentAt')}>{formatDateTime(a.sentAt)}</KeyValue>
                    {a.reminderCount > 0 && <KeyValue label={t('agreements.fields.reminders')}>{t('agreements.detail.reminders', { count: a.reminderCount, date: formatDateTime(a.lastReminderAt) })}</KeyValue>}
                    {a.amendment && (
                      <KeyValue label={t('agreements.amendment.title')}>
                        {a.amendment.reason}
                        {a.amendment.cycleRequest && (
                          <span className="block text-caption text-neutral-600" dir="ltr">
                            {a.amendment.cycleRequest.requestCode} · {a.amendment.cycleRequest.title}
                          </span>
                        )}
                      </KeyValue>
                    )}
                  </dl>
                  {a.versions.length > 1 && (
                    <div className="mt-4 border-t border-neutral-100 pt-3">
                      <p className="mb-2 text-caption font-medium text-neutral-600">{t('agreements.detail.versions')}</p>
                      <ul className="flex flex-col gap-1.5">
                        {a.versions.map((v) => (
                          <li key={v.id} className="flex items-center justify-between gap-2">
                            {v.id === a.id ? (
                              <span className="text-body-sm font-semibold text-neutral-900" dir="ltr">
                                {v.reference}
                              </span>
                            ) : (
                              <Link to={cabAgreementPath(v.id)} className="text-body-sm font-semibold text-primary hover:underline" dir="ltr">
                                {v.reference}
                              </Link>
                            )}
                            <AgreementStatusBadge status={v.status} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
                <AgreementIntegrity agreement={a} />
                <AgreementAuditTrail events={a.events} />
                {a.actions.terminate && (
                  <Button variant="outline" size="sm" icon={<AppIcon icon={CloseCircle} size={18} />} onClick={() => { setReason(''); setDialog('terminate') }} className="w-full border-error-500 text-error-600 hover:bg-error-50">
                    {t('agreements.actions.terminate')}
                  </Button>
                )}
              </aside>
            </div>
          </>
        )}
      </main>

      {a && (
        <>
          <AgreementFormDialog
            open={dialog === 'edit'}
            wide
            title={t('agreements.edit.title')}
            description={t('agreements.edit.description')}
            submitLabel={t('agreements.common.save')}
            onClose={() => setDialog(null)}
            onSubmit={async () => {
              setA(await updateAgreement(a.id, { variables: vars }))
              toast.success(t('agreements.toast.saved'))
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {EDITABLE_VARIABLES.map((key) =>
                MULTILINE.has(key) ? (
                  <label key={key} className="flex flex-col gap-2 text-body-sm font-semibold text-neutral-800 sm:col-span-2">
                    {t(`agreements.variables.${key}`)}
                    <Textarea rows={3} value={vars[key] ?? ''} onChange={(e) => setVars((v) => ({ ...v, [key]: e.target.value }))} />
                  </label>
                ) : (
                  <TextField key={key} id={`var-${key}`} label={t(`agreements.variables.${key}`)} value={vars[key] ?? ''} onChange={(e) => setVars((v) => ({ ...v, [key]: e.target.value }))} />
                ),
              )}
            </div>
          </AgreementFormDialog>

          <AgreementFormDialog
            open={dialog === 'terminate'}
            destructive
            title={t('agreements.terminate.title', { reference: a.reference })}
            description={t('agreements.terminate.description')}
            submitLabel={t('agreements.actions.terminate')}
            canSubmit={reason.trim().length >= 5}
            onClose={() => setDialog(null)}
            onSubmit={async () => {
              setA(await terminateAgreement(a.id, reason.trim()))
              toast.success(t('agreements.toast.terminated'))
            }}
          >
            <label className="flex flex-col gap-2 text-body-sm font-semibold text-neutral-800">
              {t('agreements.terminate.reason')}
              <Textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} />
            </label>
          </AgreementFormDialog>

          <AgreementFormDialog
            open={dialog === 'amend'}
            title={t('agreements.amend.title', { reference: a.reference })}
            description={t('agreements.amend.description')}
            submitLabel={t('agreements.amend.submit')}
            canSubmit={reason.trim().length >= 5}
            onClose={() => setDialog(null)}
            onSubmit={async () => {
              const created = await createAmendment(a.id, { reason: reason.trim(), ...(sourceId ? { cycleRequestId: sourceId } : {}) })
              toast.success(t('agreements.toast.amended', { reference: created.reference }))
              setA(created)
              navigate(cabAgreementPath(created.id))
            }}
          >
            <label className="flex flex-col gap-2 text-body-sm font-semibold text-neutral-800" htmlFor="amend-source">
              {t('agreements.amend.source')}
              <select
                id="amend-source"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="h-12 w-full rounded-md border border-neutral-200 bg-white px-3 text-body-sm font-normal text-neutral-900 focus:border-primary focus:outline-none"
              >
                <option value="">{t('agreements.amend.noSource')}</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {`${s.requestCode} · ${t(`agreements.requestType.${s.type}`)} · ${s.title}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-body-sm font-semibold text-neutral-800">
              {t('agreements.amend.reason')}
              <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
            </label>
          </AgreementFormDialog>

          <SignAgreementDialog
            open={dialog === 'countersign'}
            agreement={a}
            party="cab"
            onClose={() => setDialog(null)}
            requestCode={() => requestCountersignCode(a.id)}
            sign={(payload) => countersignAgreement(a.id, payload)}
            onSigned={(detail) => {
              setA(detail)
              toast.success(t('agreements.toast.countersigned'))
            }}
          />
        </>
      )}
    </CabLayout>
  )
}
