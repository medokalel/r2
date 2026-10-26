import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/ui/TextField'
import { DatePicker } from '@/components/ui/DatePicker'
import { fieldHeightClassName, fieldInputClassName } from '@/components/ui/fieldStyles'
import { WalletModalBody, WalletModalShell } from '@/components/dashboard/wallet/WalletModalShell'
import { cn } from '@/lib/utils'

interface RequestRefundModalProps {
  open: boolean
  onClose: () => void
  onSubmit: () => void
}

const REFUND_MODAL_SIZE_CLASS =
  'w-[min(920px,calc(100vw-32px))] max-h-[calc(100dvh-24px)]'

const refundFieldClass = cn(
  fieldHeightClassName,
  'font-sans text-body-sm font-normal leading-[1.6] placeholder:text-caption placeholder:font-normal placeholder:text-neutral-500'
)
const refundLabelClass =
  'block font-sans text-body-sm font-normal leading-[1.6] text-neutral-900'

const refundButtonBaseClass =
  'flex h-10 w-[240px] items-center justify-center rounded-sm border-0 px-6 font-sans text-body-sm font-normal leading-[1.4] transition-colors'
const refundCancelButtonClass = cn(
  refundButtonBaseClass,
  'bg-error-50/50 text-error-500 hover:bg-error-50'
)
const refundSubmitButtonClass = cn(
  refundButtonBaseClass,
  'bg-primary text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60'
)

export function RequestRefundModal({ open, onClose, onSubmit }: RequestRefundModalProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [authorized, setAuthorized] = useState(true)
  const [form, setForm] = useState({
    orderNumber: '578676498098',
    date: new Date(2026, 0, 1),
    amount: '4,000',
    reason: '',
    notes: '',
  })

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 400))
      onSubmit()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <WalletModalShell
      open={open}
      onClose={onClose}
      title={t('wallet.refundModal.title')}
      className={REFUND_MODAL_SIZE_CLASS}
      headerClassName="px-8 pt-8 pb-3"
      titleClassName="font-sans text-body-lg font-semibold leading-[1.6]"
      closeClassName="size-10"
    >
      <WalletModalBody className="flex flex-col gap-5 overflow-visible px-8 pb-8 pt-0 font-sans leading-[1.6] [&_.field-label]:text-body-sm [&_.field-label]:font-normal">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <TextField
            id="refund-order-number"
            label={t('wallet.refundModal.orderNumber')}
            value={form.orderNumber}
            onChange={(e) => setForm((prev) => ({ ...prev, orderNumber: e.target.value }))}
            className={refundFieldClass}
            dir="ltr"
          />

          <div className="space-y-2">
            <span className={refundLabelClass}>{t('wallet.refundModal.date')}</span>
            <DatePicker
              value={form.date}
              onChange={(date) => setForm((prev) => ({ ...prev, date }))}
              className="[&>button]:font-sans [&>button]:text-body-sm [&>button]:font-normal [&>button]:leading-[1.6]"
            />
          </div>

          <TextField
            id="refund-amount"
            label={t('wallet.refundModal.amount')}
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
            className={refundFieldClass}
            dir="ltr"
          />
          <TextField
            id="refund-reason"
            label={t('wallet.refundModal.reason')}
            value={form.reason}
            onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder={t('ui.refundReasonPlaceholder')}
            className={refundFieldClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="refund-notes" className={refundLabelClass}>
            {t('wallet.refundModal.notes')}
          </label>
          <textarea
            id="refund-notes"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder={t('wallet.refundModal.notesPlaceholder')}
            className={cn(
              fieldInputClassName,
              'min-h-[96px] resize-none py-3 font-sans text-body-sm font-normal leading-[1.6] placeholder:text-caption placeholder:font-normal placeholder:text-neutral-500'
            )}
          />
        </div>

        <div className="space-y-4 rounded-md border border-neutral-100 p-5">
          <div className="rounded-md bg-error-50/50 px-4 py-3">
            <p className="text-body-sm font-normal leading-[1.6] text-error-700">
              {t('wallet.refundModal.warning')}
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={authorized}
              onChange={(e) => setAuthorized(e.target.checked)}
              className="mt-0.5 size-5 shrink-0 accent-primary"
            />
            <span className="text-body-sm font-normal leading-[1.6] text-neutral-800">
              {t('wallet.refundModal.authorization')}
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className={refundCancelButtonClass}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!authorized || loading}
            className={refundSubmitButtonClass}
          >
            {loading ? t('common.loading') : t('wallet.refundModal.submit')}
          </button>
        </div>
      </WalletModalBody>
    </WalletModalShell>
  )
}
