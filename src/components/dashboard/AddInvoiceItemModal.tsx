import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { SelectField } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { fieldHeightClassName, fieldTextClassName } from '@/components/ui/fieldStyles'
import { FeeCatalogManagerDialog } from '@/components/dashboard/FeeCatalogManagerDialog'
import {
  canManageFeeCatalog,
  feeItemName,
  getFeeCatalog,
  type FeeCatalog,
} from '@/lib/api/feeItemsApi'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { cn } from '@/lib/utils'
import type { InvoiceLineItem } from './InteractiveInvoiceModal'

const EMPTY_FORM = {
  feeItemId: '' as string,
  amount: '',
  quantity: '1',
  currency: '' as string,
}

const AMOUNT_PATTERN = /^\d{1,10}(\.\d{1,2})?$/
const QUANTITY_PATTERN = /^[1-9]\d{0,4}$/

function isFormComplete(form: typeof EMPTY_FORM): boolean {
  return Boolean(
    form.feeItemId &&
      AMOUNT_PATTERN.test(form.amount.trim()) &&
      QUANTITY_PATTERN.test(form.quantity.trim()) &&
      form.currency
  )
}

interface AddInvoiceItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the fully-formed line item right before the dialog closes. */
  onAdd: (item: InvoiceLineItem) => void
  /** Fixed currency of the invoice being edited (the currency picker is then locked to it). */
  currency?: string
  /** Dialog title; defaults to the interactive-invoice title. */
  title?: string
}

/** "Add an interactive invoice" line-item form, opened from the invoice table's Add button. */
export function AddInvoiceItemModal({ open, onOpenChange, onAdd, currency: fixedCurrency, title }: AddInvoiceItemModalProps) {
  const { t, i18n } = useTranslation()
  const [form, setForm] = useState(EMPTY_FORM)
  const [catalog, setCatalog] = useState<FeeCatalog>({ items: [], currencies: [] })
  const [loadError, setLoadError] = useState<string | null>(null)
  const [manageOpen, setManageOpen] = useState(false)
  const canManage = canManageFeeCatalog()
  // Each (re)load has a number; the pickers are "loading" until that number has been answered.
  const [requested, setRequested] = useState(0)
  const [answered, setAnswered] = useState(-1)
  const loading = open && answered !== requested
  const loadCatalog = useCallback(() => setRequested((value) => value + 1), [])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    getFeeCatalog()
      .then((next) => {
        if (cancelled) return
        setCatalog(next)
        setLoadError(null)
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(getUserErrorMessage(error, t))
      })
      .finally(() => {
        if (!cancelled) setAnswered(requested)
      })
    return () => {
      cancelled = true
    }
  }, [open, requested, t])

  const set = <K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  // Picking a catalog item fills its default amount and currency (both stay editable).
  const selectItem = (id: string) => {
    const item = catalog.items.find((entry) => entry.id === id)
    setForm((prev) => ({
      ...prev,
      feeItemId: id,
      amount: item ? String(item.defaultAmount) : prev.amount,
      currency: item && catalog.currencies.includes(item.currency) ? item.currency : prev.currency,
    }))
  }

  const itemOptions = useMemo(
    () =>
      catalog.items.map((item) => ({
        value: item.id,
        label: item.unit ? `${feeItemName(item, i18n.language)} (${item.unit})` : feeItemName(item, i18n.language),
      })),
    [catalog.items, i18n.language]
  )
  const currencyOptions = useMemo(
    () =>
      catalog.currencies.map((code) => ({
        value: code,
        label: `${code} · ${t(`feeCatalog.currencies.${code}`, code)}`,
      })),
    [catalog.currencies, t]
  )

  // A fixed invoice currency always wins over the catalog item's own currency.
  const effective = fixedCurrency ? { ...form, currency: fixedCurrency } : form

  const amountValue = Number(form.amount)
  const quantityValue = Number(form.quantity)
  const total =
    Number.isFinite(amountValue) && Number.isFinite(quantityValue) ? amountValue * quantityValue : 0

  const resetForm = () => setForm(EMPTY_FORM)

  const onSubmit = () => {
    if (!isFormComplete(effective)) return
    const item = catalog.items.find((entry) => entry.id === form.feeItemId)
    if (!item) return
    onAdd({
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : String(Date.now()),
      descriptionKey: 'certificationRequests.invoiceModal.lineItem',
      description: feeItemName(item, i18n.language),
      feeItemId: item.id,
      unit: item.unit ?? undefined,
      amount: amountValue,
      quantity: quantityValue,
      currency: effective.currency,
    })
    resetForm()
    onOpenChange(false)
  }

  return (
    <>
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm()
        onOpenChange(next)
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-surface-overlay/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed start-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(735px,calc(100vw-40px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-card focus:outline-none rtl:translate-x-1/2"
        >
          {/* Fixed header: title at start, circular close at end */}
          <div className="flex shrink-0 items-center justify-between px-6 pt-5">
            <Dialog.Title className="text-[24px] font-semibold leading-[1.6] text-neutral-900">
              {title ?? t('certificationRequests.invoiceModal.addItemTitle')}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t('common.close')}
                className="flex size-10 items-center justify-center rounded-full border-2 border-text-primary text-text-primary transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          {/* Scrollable body */}
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
            <div className="space-y-2">
              <FormField label={t('certificationRequests.invoiceModal.item')}>
                <SelectField
                  value={form.feeItemId}
                  onChange={selectItem}
                  options={itemOptions}
                  disabled={loading}
                  placeholder={
                    loading
                      ? t('common.loading')
                      : catalog.items.length === 0
                        ? t('feeCatalog.emptyPicker')
                        : t('feeCatalog.pickItem')
                  }
                />
              </FormField>
              {loadError && (
                <p className="text-caption text-error-700" role="alert">
                  {loadError}{' '}
                  <button type="button" className="font-medium text-primary hover:underline" onClick={loadCatalog}>
                    {t('common.retry')}
                  </button>
                </p>
              )}
              {canManage && (
                <button
                  type="button"
                  onClick={() => setManageOpen(true)}
                  className="text-body-sm font-medium text-primary hover:underline"
                >
                  {t('feeCatalog.manage')}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField label={t('certificationRequests.invoiceModal.amount')}>
                <TextField
                  type="text"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => set('amount', e.target.value)}
                />
              </FormField>
              <FormField label={t('certificationRequests.invoiceModal.number')}>
                <TextField
                  type="text"
                  inputMode="numeric"
                  value={form.quantity}
                  onChange={(e) => set('quantity', e.target.value)}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField label={t('certificationRequests.invoiceModal.currency')}>
                <SelectField
                  value={effective.currency}
                  onChange={(value) => set('currency', value)}
                  options={fixedCurrency ? [{ value: fixedCurrency, label: fixedCurrency }] : currencyOptions}
                  disabled={loading || Boolean(fixedCurrency)}
                />
              </FormField>
              <FormField label={t('certificationRequests.invoiceModal.totalAmount')}>
                <div
                  className={cn(
                    fieldHeightClassName,
                    fieldTextClassName,
                    'flex items-center rounded-md bg-primary-subtle px-3 font-semibold text-primary'
                  )}
                >
                  <span dir="ltr">
                    {total.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    {effective.currency ? ` ${effective.currency}` : ''}
                  </span>
                </div>
              </FormField>
            </div>

            {/* Footer actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="tertiary"
                size="lg"
                className="flex-1 bg-error-50 text-error-500 hover:bg-error-100"
                onClick={() => onOpenChange(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={onSubmit}
                disabled={!isFormComplete(effective)}
              >
                {t('certificationRequests.invoiceModal.add')}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>

    {canManage && (
      <FeeCatalogManagerDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        onChanged={loadCatalog}
      />
    )}
    </>
  )
}