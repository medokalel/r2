import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectField } from '@/components/ui/Select'
import { FormDialog } from '@/components/platform/FormDialog'
import { FieldLabel } from '@/components/platform/PlatformUi'
import { inputClassName } from '@/components/platform/platformStyles'
import { usePlatformFormat } from '@/components/platform/usePlatformFormat'
import { recordPlatformPayment } from '@/lib/api/platformApi'
import { PAYMENT_METHODS, type PaymentMethod, type PlatformInvoice } from '@/lib/api/platformTypes'
import { toast } from '@/lib/toast'

const today = () => new Date().toISOString().slice(0, 10)

/** Manual collection: amount (≤ open amount), method, bank reference and date received. */
export function RecordPaymentDialog({ invoice, onClose, onSaved }: { invoice: PlatformInvoice | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation()
  const f = usePlatformFormat()
  const open = Math.max(0, Math.round(((invoice?.total ?? 0) - (invoice?.amountPaid ?? 0)) * 100) / 100)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('BANK_TRANSFER')
  const [reference, setReference] = useState('')
  const [receivedAt, setReceivedAt] = useState(today)
  const [lastId, setLastId] = useState<string | null>(null)

  // Reset the form for each invoice the dialog opens with.
  if (invoice && invoice.id !== lastId) {
    setLastId(invoice.id)
    setAmount(open.toFixed(2))
    setMethod('BANK_TRANSFER')
    setReference('')
    setReceivedAt(today())
  }

  const value = Number(amount)
  const valid = Number.isFinite(value) && value > 0 && value <= open + 0.001 && reference.trim().length > 0 && Boolean(receivedAt) && receivedAt <= today()

  return (
    <FormDialog
      open={invoice !== null}
      title={t('platform.payment.title', { number: invoice?.number ?? '' })}
      description={t('platform.payment.description', { amount: f.usd(open) })}
      submitLabel={t('platform.payment.submit')}
      canSubmit={valid}
      onClose={onClose}
      onSubmit={async () => {
        if (!invoice) return
        await recordPlatformPayment(invoice.id, {
          amount: Math.round(value * 100) / 100,
          method,
          reference: reference.trim(),
          receivedAt: new Date(`${receivedAt}T12:00:00`).toISOString(),
        })
        toast.success(t('platform.payment.saved'))
        onSaved()
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="pay-amount" required>
            {t('platform.payment.amount')}
          </FieldLabel>
          <input id="pay-amount" type="number" min={0.01} step={0.01} max={open} dir="ltr" className={inputClassName} value={amount} onChange={(e) => setAmount(e.target.value)} />
          {value > open + 0.001 && <p className="text-caption text-error-600">{t('platform.payment.tooMuch', { amount: f.usd(open) })}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel required>{t('platform.payment.method')}</FieldLabel>
          <SelectField value={method} onChange={(v) => setMethod(v as PaymentMethod)} options={PAYMENT_METHODS.map((m) => ({ value: m, label: t(`platform.payment.methods.${m}`) }))} />
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="pay-ref" required>
            {t('platform.payment.reference')}
          </FieldLabel>
          <input id="pay-ref" dir="ltr" className={inputClassName} value={reference} onChange={(e) => setReference(e.target.value)} maxLength={120} placeholder="TRF-2026-0001" />
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="pay-date" required>
            {t('platform.payment.receivedAt')}
          </FieldLabel>
          <input id="pay-date" type="date" dir="ltr" max={today()} className={inputClassName} value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)} />
        </div>
      </div>
      <p className="text-caption text-neutral-600">{t('platform.payment.manualNote')}</p>
    </FormDialog>
  )
}
