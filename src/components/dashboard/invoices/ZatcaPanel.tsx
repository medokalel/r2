import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, DownloadIcon, ReceiptIcon, SendIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import type { CabInvoiceItem } from '@/lib/api/cabInvoiceRegisterApi'
import {
  getInvoiceZatca,
  getInvoiceZatcaXml,
  saveXmlFile,
  submitInvoiceZatca,
  type InvoiceZatcaInfo,
  type ZatcaStatus,
} from '@/lib/api/zatcaApi'
import { encodeQr, qrSvgPath } from '@/lib/qrCode'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const STATUS_STYLE: Record<ZatcaStatus, string> = {
  NOT_REQUIRED: 'bg-neutral-50 text-neutral-700 border-neutral-100',
  PENDING: 'bg-orange-50 text-orange-700 border-orange-200',
  REPORTED: 'bg-info-50 text-info-700 border-info-100',
  CLEARED: 'bg-success-100 text-success-700 border-success-200',
  REJECTED: 'bg-error-100 text-error-600 border-error-200',
}

const ENV_LABEL = { sandbox: 'Sandbox', simulation: 'Simulation', production: 'Production' } as const

/** QR code of the base64 TLV payload, drawn as one SVG path (crisp at any size, prints well). */
export function ZatcaQrCode({ value, label, className }: { value: string; label: string; className?: string }) {
  const { path, size } = useMemo(() => {
    const qr = encodeQr(value)
    return { path: qrSvgPath(qr, 4), size: qr.size + 8 }
  }, [value])
  return (
    <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} shapeRendering="crispEdges" className={cn('block bg-white', className)}>
      <title>{label}</title>
      <rect width={size} height={size} fill="#ffffff" />
      <path d={path} fill="#000000" />
    </svg>
  )
}

function StatusBadge({ status }: { status: ZatcaStatus }) {
  const { t } = useTranslation()
  const fallback: Record<ZatcaStatus, string> = {
    NOT_REQUIRED: 'Not required',
    PENDING: 'Pending',
    REPORTED: 'Reported',
    CLEARED: 'Cleared',
    REJECTED: 'Rejected',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full border px-3 py-1 text-caption font-bold', STATUS_STYLE[status])}>
      {t(`zatca.status.${status}`, fallback[status])}
    </span>
  )
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-caption font-medium text-neutral-600">{label}</dt>
      <dd className={cn('mt-0.5 truncate text-body-sm text-neutral-900', mono && 'font-mono text-caption')} dir={mono ? 'ltr' : undefined} title={value}>
        {value}
      </dd>
    </div>
  )
}

/**
 * ZATCA e-invoice card of the invoice details page.
 * CAB: QR, status, counter / hashes, ZATCA errors, "Download XML" and "Send to ZATCA".
 * Portal (client): QR and status only.
 */
export function ZatcaPanel({ invoice, portal }: { invoice: CabInvoiceItem; portal: boolean }) {
  const { t, i18n } = useTranslation()
  const [info, setInfo] = useState<InvoiceZatcaInfo | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [busy, setBusy] = useState<'xml' | 'submit' | null>(null)

  useEffect(() => {
    let active = true
    getInvoiceZatca(invoice)
      .then((data) => {
        if (!active) return
        setInfo(data)
        setLoadFailed(false)
      })
      .catch(() => {
        if (active) setLoadFailed(true)
      })
    return () => {
      active = false
    }
  }, [invoice])

  if (loadFailed) {
    return (
      <section className="rounded-lg border border-neutral-100 bg-white p-4 text-body-sm text-error-600 sm:p-5">
        {t('zatca.errors.load', 'Could not load the e-invoice status.')}
      </section>
    )
  }
  if (!info) return <div className="skeleton h-[180px] rounded-lg" aria-hidden />
  // The client only sees e-invoicing when it applies.
  if (portal && !info.required) return null

  const isDraft = invoice.status === 'Draft'
  const canSubmit = !portal && !isDraft && info.required && info.status === 'PENDING' && (info.submissionEnabled || !info.generated)
  const qrLabel = t('zatca.qrAlt', 'ZATCA QR code')

  const downloadXml = async () => {
    setBusy('xml')
    try {
      saveXmlFile(await getInvoiceZatcaXml(invoice))
    } catch {
      toast.error(t('zatca.errors.xml', 'The XML file is not available yet.'))
    } finally {
      setBusy(null)
    }
  }

  const submit = async () => {
    setBusy('submit')
    try {
      const next = await submitInvoiceZatca(invoice)
      setInfo(next)
      if (next.status === 'PENDING') {
        toast.success(t('zatca.generated', 'E-invoice generated.'))
      } else {
        toast.success(t('zatca.submitted', 'E-invoice sent to ZATCA.'))
      }
    } catch (err) {
      toast.error(
        err instanceof Error && err.message === 'ZATCA_ALREADY_SUBMITTED'
          ? t('zatca.errors.alreadySubmitted', 'This e-invoice was already sent to ZATCA.')
          : t('zatca.errors.submit', 'Could not send the e-invoice. Try again.'),
      )
    } finally {
      setBusy(null)
    }
  }

  const hint = !info.required
    ? t('zatca.notRequiredHint', 'E-invoicing applies to invoices issued by CABs registered in Saudi Arabia.')
    : isDraft
      ? t('zatca.draftHint', 'The QR code and e-invoice XML are generated when the invoice is issued.')
      : !info.generated
        ? t('zatca.waitingHint', 'The e-invoice could not be generated yet. Fix the items below, then select Generate e-invoice.')
        : info.status === 'PENDING' && !portal
          ? info.submissionEnabled
            ? t('zatca.pendingHint', 'Generated and waiting to be sent to ZATCA.')
            : t('zatca.notConfiguredHint', 'Submission starts once the ZATCA credentials (CSID) are configured on the server.')
          : null

  const submittedAt = info.submittedAt
    ? new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(info.submittedAt))
    : ''

  return (
    <section className="rounded-lg border border-neutral-100 bg-white p-4 sm:p-5" aria-labelledby="zatca-title">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 pb-3">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary">
            <AppIcon icon={ReceiptIcon} size={18} />
          </span>
          <div>
            <h3 id="zatca-title" className="text-body font-bold text-neutral-900">
              {t('zatca.title', 'ZATCA e-invoice')}
            </h3>
            <p className="text-caption text-neutral-600">{t('zatca.subtitle', 'Fatoora QR code and status of this tax invoice.')}</p>
          </div>
        </div>
        <StatusBadge status={info.status} />
      </header>

      <div className="mt-4 flex flex-col gap-5 sm:flex-row">
        {info.qrCode ? (
          <figure className="flex shrink-0 flex-col items-center gap-2 self-center sm:self-start">
            <ZatcaQrCode value={info.qrCode} label={qrLabel} className="size-[168px] rounded-md border border-neutral-100" />
            <figcaption className="max-w-[168px] text-center text-caption text-neutral-600">{t('zatca.scanHint', 'Scan with the ZATCA app to verify the invoice.')}</figcaption>
          </figure>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {hint && <p className="rounded-md bg-primary-50 p-3 text-body-sm font-medium text-primary">{hint}</p>}

          {!portal && info.required && info.generated && (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {info.kind && (
                <Detail
                  label={t('zatca.fields.type', 'Invoice type')}
                  value={info.kind === 'SIMPLIFIED' ? t('zatca.kind.SIMPLIFIED', 'Simplified tax invoice (B2C)') : t('zatca.kind.STANDARD', 'Standard tax invoice (B2B)')}
                />
              )}
              {info.icv != null && <Detail label={t('zatca.fields.counter', 'Invoice counter (ICV)')} value={String(info.icv)} mono />}
              {info.uuid && <Detail label={t('zatca.fields.uuid', 'UUID')} value={info.uuid} mono />}
              {info.invoiceHash && <Detail label={t('zatca.fields.hash', 'Invoice hash')} value={info.invoiceHash} mono />}
              {info.previousInvoiceHash && <Detail label={t('zatca.fields.previousHash', 'Previous invoice hash')} value={info.previousInvoiceHash} mono />}
              <Detail label={t('zatca.fields.signature', 'Signature')} value={info.signed ? t('zatca.signedYes', 'Signed') : t('zatca.signedNo', 'Not signed yet')} />
              {info.environment && <Detail label={t('zatca.fields.environment', 'Environment')} value={t(`zatca.env.${info.environment}`, ENV_LABEL[info.environment])} />}
              {submittedAt && <Detail label={t('zatca.fields.submittedAt', 'Sent to ZATCA')} value={submittedAt} />}
            </dl>
          )}
          {portal && submittedAt && <Detail label={t('zatca.fields.submittedAt', 'Sent to ZATCA')} value={submittedAt} />}

          {!portal && (info.errors?.length ?? 0) > 0 && (
            <div role="alert" className="rounded-md border border-error-200 bg-error-50 p-3">
              <p className="text-body-sm font-semibold text-error-700">{t('zatca.errorsTitle', 'ZATCA reported these errors')}</p>
              <ul className="mt-1.5 list-disc space-y-1 ps-5 text-caption text-error-700">
                {info.errors?.map((e) => (
                  <li key={`${e.code}-${e.message}`}>
                    <span className="font-mono" dir="ltr">{e.code}</span>: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!portal && (info.warnings?.length ?? 0) > 0 && (
            <div className="rounded-md border border-orange-200 bg-orange-50 p-3">
              <p className="text-body-sm font-semibold text-orange-700">{t('zatca.warningsTitle', 'Warnings')}</p>
              <ul className="mt-1.5 list-disc space-y-1 ps-5 text-caption text-orange-800">
                {info.warnings?.map((w) => (
                  <li key={`${w.code}-${w.message}`}>
                    <span className="font-mono" dir="ltr">{w.code}</span>: {w.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!portal && info.required && (info.xmlAvailable || canSubmit) && (
            <div className="flex flex-wrap gap-2">
              {info.xmlAvailable && (
                <Button variant="secondary" size="sm" disabled={busy !== null} onClick={() => void downloadXml()}>
                  <AppIcon icon={DownloadIcon} size={16} />
                  {t('zatca.downloadXml', 'Download XML')}
                </Button>
              )}
              {canSubmit && (
                <Button variant="primary" size="sm" disabled={busy !== null} onClick={() => void submit()}>
                  <AppIcon icon={SendIcon} size={16} />
                  {busy === 'submit'
                    ? t('zatca.submitting', 'Sending…')
                    : info.generated
                      ? t('zatca.submit', 'Send to ZATCA')
                      : t('zatca.generate', 'Generate e-invoice')}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
