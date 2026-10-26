import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/Button'
import { WorkflowDialog } from '@/components/dashboard/cab/workflow/WorkflowDialog'
import {
  approveOffer,
  isQuotationOffer,
  issueOffer,
  submitOfferForApproval,
  updateOfferStatus,
  type OfferItem,
} from '@/lib/api/cabOffersApi'
import { downloadOfferPdf, offerTotals } from '@/lib/offers/offerPdf'
import { ROUTES, cabApplicationQuotationPath } from '@/lib/routes'
import { toast } from '@/lib/toast'
import { workflowErrorMessage } from '@/lib/workflowErrors'
import { displayCountry } from '@/lib/localizeCountry'
import { notSet } from '@/lib/emptyValue'

type CabAction = 'submit' | 'approve' | 'issue' | 'void'

interface OfferDetailDrawerProps {
  offer: OfferItem | null
  /** Client portal: read-only view; accept / reject stay in the register. */
  portal?: boolean
  onClose: () => void
  /** Called after an action changed the offer (the register reloads). */
  onChanged: () => void
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-caption text-neutral-600">{label}</dt>
      <dd className="mt-0.5 break-words text-body-sm font-semibold text-neutral-900">{value || notSet()}</dd>
    </div>
  )
}

/** Read-only offer view (side panel) with the lifecycle actions the offer allows. */
export function OfferDetailDrawer({ offer, portal = false, onClose, onChanged }: OfferDetailDrawerProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [pending, setPending] = useState<CabAction | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  const money = (value: number, currency: string) => {
    try {
      return new Intl.NumberFormat(i18n.language, { style: 'currency', currency }).format(value)
    } catch {
      return `${value} ${currency}`
    }
  }

  const fromQuotation = offer ? isQuotationOffer(offer) : false
  const final = offer ? offer.status === 'void' || offer.status === 'rejected' || Boolean(offer.acceptedAt) : true

  const actionLabel: Record<CabAction, string> = {
    submit: t('cab.offerDetail.actions.submit', 'Send for approval'),
    approve: t('cab.offerDetail.actions.approve', 'Approve'),
    issue: t('cab.offerDetail.actions.issue', 'Issue to client'),
    void: t('cab.offersPage.actions.voidOffer', 'Void offer'),
  }
  const actionText: Record<CabAction, string> = {
    submit: t('cab.offerDetail.confirm.submit', 'Send this offer for internal approval?'),
    approve: t('cab.offerDetail.confirm.approve', 'Approve this offer? It must be approved by a different CAB user than the one who prepared it (or by the CAB administrator).'),
    issue: t('cab.offerDetail.confirm.issue', 'Issue this offer to the client? The client is notified and can accept or reject it in the portal.'),
    void: t('cab.offerDetail.confirm.void', 'Void this offer? It can no longer be issued or accepted.'),
  }

  const run = async () => {
    if (!offer || !pending) return
    setBusy(true)
    setError(null)
    try {
      if (pending === 'submit') await submitOfferForApproval(offer.id)
      else if (pending === 'approve') await approveOffer(offer.id)
      else if (pending === 'issue') await issueOffer(offer.id)
      else if (!(await updateOfferStatus(offer.id, 'void'))) throw new Error(t('cab.offerDetail.voidFailed', 'This offer can no longer be voided.'))
      toast.success(
        pending === 'issue'
          ? t('cab.offerDetail.issued', { defaultValue: 'Offer {{number}} issued to the client.', number: offer.offerNumber })
          : t('cab.offerDetail.updated', { defaultValue: 'Offer {{number}} updated.', number: offer.offerNumber }),
      )
      setPending(null)
      onChanged()
    } catch (err) {
      setError(workflowErrorMessage(err, t))
    } finally {
      setBusy(false)
    }
  }

  const download = async () => {
    if (!offer) return
    setDownloading(true)
    try {
      await downloadOfferPdf(offer, t, i18n.language)
    } catch (err) {
      toast.error(workflowErrorMessage(err, t))
    } finally {
      setDownloading(false)
    }
  }

  const totals = offer ? offerTotals(offer) : null

  return (
    <Dialog.Root open={offer !== null} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-surface-overlay/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 end-0 z-40 flex w-full max-w-[560px] flex-col bg-white shadow-2xl focus:outline-none"
        >
          {offer && totals && (
            <>
              <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
                <div className="min-w-0">
                  <Dialog.Title className="text-body-lg font-bold text-neutral-900">
                    {t('cab.offerDetail.title', { defaultValue: 'Offer {{number}}', number: offer.offerNumber })}
                  </Dialog.Title>
                  <p className="mt-1 text-body-sm text-neutral-600">
                    {t(`cab.offersPage.status.${offer.status}`, offer.statusLabel)}
                    {offer.revision && offer.revision > 1 ? ` · ${t('cab.offerDetail.revision', 'Revision')} ${offer.revision}` : ''}
                    {fromQuotation ? ` · ${t('cab.offerDetail.fromQuotation', 'From quotation')}` : ''}
                  </p>
                </div>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label={t('common.close', 'Close')}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </Dialog.Close>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
                <section>
                  <h3 className="mb-3 text-body-sm font-bold text-primary">{t('cab.offerDetail.sections.client', 'Client')}</h3>
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label={t('cab.offerDetail.fields.client', 'Client')} value={`${offer.clientName} (${offer.clientCode})`} />
                    <Field label={t('cab.offerDetail.fields.country', 'Country')} value={displayCountry(offer.country)} />
                    <Field label={t('cab.offerDetail.fields.contact', 'Primary contact')} value={offer.primaryContact} />
                    <Field label={t('cab.offerDetail.fields.email', 'E-mail')} value={<span dir="ltr">{offer.contactEmail}</span>} />
                  </dl>
                </section>
                <section>
                  <h3 className="mb-3 text-body-sm font-bold text-primary">{t('cab.offerDetail.sections.application', 'Application')}</h3>
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label={t('cab.offerDetail.fields.application', 'Application')} value={offer.relatedApplication} />
                    <Field label={t('cab.offerDetail.fields.standard', 'Standard')} value={offer.applicationStandard} />
                    <div className="sm:col-span-2">
                      <Field label={t('cab.offerDetail.fields.scope', 'Scope')} value={offer.applicationScope} />
                    </div>
                  </dl>
                </section>
                <section>
                  <h3 className="mb-3 text-body-sm font-bold text-primary">{t('cab.offerDetail.sections.fees', 'Fees')}</h3>
                  <ul className="divide-y divide-neutral-100 rounded-md border border-neutral-100">
                    {offer.fees.map((fee) => (
                      <li key={fee.id} className="flex items-start justify-between gap-3 px-3 py-2.5 text-body-sm">
                        <span className="min-w-0 text-neutral-800">{fee.description}</span>
                        <span className="shrink-0 font-semibold">{money(fee.amount, offer.currency)}</span>
                      </li>
                    ))}
                  </ul>
                  <dl className="mt-3 space-y-1 text-body-sm">
                    {totals.discount > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-neutral-600">{t('cab.offerDetail.discount', 'Discount')}</dt>
                        <dd>- {money(totals.discount, offer.currency)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between text-body font-bold">
                      <dt>{t('cab.offerDetail.total', 'Total (before tax)')}</dt>
                      <dd>{money(totals.total, offer.currency)}</dd>
                    </div>
                  </dl>
                </section>
                <section>
                  <h3 className="mb-3 text-body-sm font-bold text-primary">{t('cab.offerDetail.sections.terms', 'Commercial terms')}</h3>
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label={t('cab.offerDetail.fields.validUntil', 'Valid until')} value={offer.validUntil} />
                    <Field label={t('cab.offerDetail.fields.paymentTerms', 'Payment terms')} value={offer.paymentTerms} />
                    <Field label={t('cab.offerDetail.fields.travel', 'Travel costs')} value={offer.travelCosts} />
                    <Field label={t('cab.offerDetail.fields.terms', 'Terms attachment')} value={offer.termsAttachmentName} />
                  </dl>
                  {offer.notes && <p className="mt-3 whitespace-pre-line text-body-sm text-neutral-800">{offer.notes}</p>}
                </section>
                {offer.history && offer.history.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-body-sm font-bold text-primary">{t('cab.offerDetail.sections.history', 'History')}</h3>
                    <ol className="space-y-2">
                      {offer.history.map((h, i) => (
                        <li key={`${h.action}-${i}`} className="rounded-md bg-neutral-25 px-3 py-2 text-body-sm">
                          <span className="font-semibold text-neutral-900">{h.action}</span>
                          <span className="block text-caption text-neutral-600">
                            {h.by} · {h.date}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
              </div>

              <div className="flex flex-wrap gap-2 border-t border-neutral-100 px-5 py-4">
                <Button type="button" variant="outline" size="sm" className="h-10 px-4" disabled={downloading} onClick={() => void download()}>
                  {downloading ? t('common.loading', 'Loading…') : t('cab.offersPage.actions.downloadPdf', 'Download PDF')}
                </Button>
                {!portal && (
                  <>
                    {fromQuotation
                      ? offer.applicationId && (
                          <Button type="button" variant="outline" size="sm" className="h-10 px-4" onClick={() => navigate(cabApplicationQuotationPath(offer.applicationId as string))}>
                            {t('cab.offerDetail.actions.openQuotation', 'Revise in quotation')}
                          </Button>
                        )
                      : !final && (
                          <Button type="button" variant="outline" size="sm" className="h-10 px-4" onClick={() => navigate(`${ROUTES.cabOfferNew}?revise=${encodeURIComponent(offer.id)}`)}>
                            {t('cab.offersPage.actions.revise', 'Revise (new version)')}
                          </Button>
                        )}
                    {offer.status === 'draft' && (
                      <Button type="button" size="sm" className="h-10 px-4" onClick={() => setPending('submit')}>
                        {actionLabel.submit}
                      </Button>
                    )}
                    {offer.status === 'pending_approval' && (
                      <Button type="button" size="sm" className="h-10 px-4" onClick={() => setPending('approve')}>
                        {actionLabel.approve}
                      </Button>
                    )}
                    {offer.status === 'approved' && (
                      <Button type="button" size="sm" className="h-10 px-4" onClick={() => setPending('issue')}>
                        {actionLabel.issue}
                      </Button>
                    )}
                    {!final && (
                      <Button type="button" variant="destructive" size="sm" className="h-10 px-4" onClick={() => setPending('void')}>
                        {actionLabel.void}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
          <WorkflowDialog
            open={pending !== null}
            title={pending ? actionLabel[pending] : ''}
            description={pending ? actionText[pending] : ''}
            confirmLabel={pending ? actionLabel[pending] : ''}
            tone={pending === 'void' ? 'destructive' : 'primary'}
            busy={busy}
            error={error}
            onConfirm={() => void run()}
            onClose={() => {
              setPending(null)
              setError(null)
            }}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
