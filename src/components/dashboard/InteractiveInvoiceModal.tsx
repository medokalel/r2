import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/Button'
import { AppIcon, RiyalSymbolIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { AddInvoiceItemModal } from './AddInvoiceItemModal'

export interface InvoiceLineItem {
  id: string
  /** i18n key of the line text — used when `description` is absent (fixed lines). */
  descriptionKey: string
  /** Line text copied from the fee-schedule catalog item (already in the user's language). */
  description?: string
  /** Catalog item the line was created from. */
  feeItemId?: string
  /** Billing unit of that catalog item (e.g. "per auditor day"). */
  unit?: string
  amount: number
  quantity: number
  currency: string
}

const MOCK_INVOICE_ITEMS: InvoiceLineItem[] = [
  { id: '1', descriptionKey: 'certificationRequests.invoiceModal.lineItem', amount: 3000, quantity: 1, currency: 'SAR' },
  { id: '2', descriptionKey: 'certificationRequests.invoiceModal.lineItem', amount: 3000, quantity: 1, currency: 'SAR' },
  { id: '3', descriptionKey: 'certificationRequests.invoiceModal.lineItem', amount: 3000, quantity: 1, currency: 'SAR' },
]

/** Riyal symbol for SAR, the ISO code for any other currency. */
function CurrencyMark({ currency }: { currency: string }) {
  return (
    <div className="flex items-center justify-center text-primary">
      {currency === 'SAR' ? (
        <AppIcon icon={RiyalSymbolIcon} size={18} />
      ) : (
        <span className="text-body-sm font-semibold" dir="ltr">
          {currency}
        </span>
      )}
    </div>
  )
}

interface InteractiveInvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items?: InvoiceLineItem[]
  onAdd?: () => void
}

export function InteractiveInvoiceModal({
  open,
  onOpenChange,
  items = MOCK_INVOICE_ITEMS,
  onAdd,
}: InteractiveInvoiceModalProps) {
  const { t } = useTranslation()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addedItems, setAddedItems] = useState<InvoiceLineItem[]>([])
  const allItems = [...items, ...addedItems]
  const total = allItems.reduce((sum, item) => sum + item.amount * item.quantity, 0)
  const totalCurrencies = [...new Set(allItems.map((item) => item.currency))]

  return (
    <>
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-surface-overlay/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed start-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(1150px,calc(100vw-40px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-card focus:outline-none rtl:translate-x-1/2"
        >
          {/* Fixed header: title at start, circular close at end */}
          <div className="flex shrink-0 items-center justify-between px-6 py-5">
            <Dialog.Title className="text-[28px] font-semibold leading-[1.6] text-neutral-900">
              {t('certificationRequests.invoiceModal.title')}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t('common.close')}
                className="flex size-10 items-center justify-center rounded-full border-2 border-text-primary text-text-primary transition-colors "
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          {/* Scrollable body */}
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 pb-6">
            <div className="overflow-x-auto rounded-md border border-neutral-100">
              <table className="w-full min-w-[720px] border-collapse text-center">
                <thead>
                  <tr className="bg-primary text-white">
                    <th className="p-5 text-center text-body-sm font-medium">
                      {t('certificationRequests.invoiceModal.index')}
                    </th>
                    <th className="p-5 text-center text-body-sm font-medium">
                      {t('certificationRequests.invoiceModal.item')}
                    </th>
                    <th className="p-5 text-center text-body-sm font-medium">
                      {t('certificationRequests.invoiceModal.amount')}
                    </th>
                    <th className="p-5 text-center text-body-sm font-medium">
                      {t('certificationRequests.invoiceModal.number')}
                    </th>
                    <th className="p-5 text-center text-body-sm font-medium">
                      {t('certificationRequests.invoiceModal.totalAmount')}
                    </th>
                    <th className="p-5 text-center text-body-sm font-medium">
                      {t('certificationRequests.invoiceModal.currency')}
                    </th>
                    <th className="p-5 text-center text-body-sm font-medium">
                      {t('certificationRequests.invoiceModal.procedures')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allItems.map((item, index) => (
                    <tr key={item.id} className={cn(index % 2 === 1 && 'bg-neutral-25')}>
                      <td className="px-4 py-4 text-body font-medium text-neutral-900">
                        {index + 1}
                      </td>
                      <td className="max-w-[420px] px-4 py-4 text-start text-body text-neutral-800">
                        {item.description ?? t(item.descriptionKey)}
                      </td>
                      <td className="px-4 py-4 text-body text-neutral-800">{item.amount.toLocaleString()}</td>
                      <td className="px-4 py-4 text-body text-neutral-800">{item.quantity}</td>
                      <td className="px-4 py-4 text-body text-neutral-800">
                        {(item.amount * item.quantity).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <CurrencyMark currency={item.currency} />
                      </td>
                      <td className="px-4 py-4 text-body text-neutral-600">
                        {t('certificationRequests.invoiceModal.noProcedure')}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-primary-50">
                    <td colSpan={2} className="px-4 py-5 text-body-lg font-semibold text-primary">
                      {t('certificationRequests.invoiceModal.total')}
                    </td>
                    <td />
                    <td />
                    <td className="px-4 py-5 text-body-lg font-semibold text-primary">
                      {total.toLocaleString()}
                    </td>
                    <td className="px-4 py-5">
                      {totalCurrencies.length === 1 ? (
                        <CurrencyMark currency={totalCurrencies[0]} />
                      ) : (
                        <span className="text-body-sm font-medium text-primary">
                          {t('feeCatalog.mixedCurrencies')}
                        </span>
                      )}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-4">
              <Button
                variant="tertiary"
                size="lg"
                className="min-w-[160px] bg-error-50 text-error-500 hover:bg-error-100"
                onClick={() => onOpenChange(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="min-w-[160px]"
                onClick={() => setIsAddOpen(true)}
              >
                {t('certificationRequests.invoiceModal.add')}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>

    <AddInvoiceItemModal
      open={isAddOpen}
      onOpenChange={setIsAddOpen}
      onAdd={(newItem) => {
        setAddedItems((prev) => [...prev, newItem])
        onAdd?.()
      }}
    />
    </>
  )
}