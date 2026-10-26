import { useCallback, useEffect, useMemo, useState } from 'react'
import { ImportMenuButton } from '@/components/imports/ImportMenuButton'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { FormField } from '@/components/ui/FormField'
import { SelectField } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { Toggle } from '@/components/ui/Toggle'
import {
  createFeeItem,
  deleteFeeItem,
  feeItemName,
  getFeeCurrencies,
  listFeeItems,
  updateFeeCurrencies,
  updateFeeItem,
  type FeeCurrency,
  type FeeItem,
  type FeeItemInput,
} from '@/lib/api/feeItemsApi'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

interface ItemForm {
  code: string
  name: string
  nameAr: string
  unit: string
  amount: string
  currency: string
  isActive: boolean
}

const EMPTY_ITEM_FORM: ItemForm = {
  code: '',
  name: '',
  nameAr: '',
  unit: '',
  amount: '',
  currency: '',
  isActive: true,
}

const AMOUNT_PATTERN = /^\d{1,10}(\.\d{1,2})?$/
const CODE_PATTERN = /^[A-Za-z0-9._-]*$/

function formFromItem(item: FeeItem): ItemForm {
  return {
    code: item.code ?? '',
    name: item.name,
    nameAr: item.nameAr ?? '',
    unit: item.unit ?? '',
    amount: String(item.defaultAmount),
    currency: item.currency,
    isActive: item.isActive,
  }
}

interface FeeCatalogManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after any change so the caller can reload its catalog. */
  onChanged?: () => void
  /** Open with this item in the edit form (deep link from "Complete" after an import). */
  editItemId?: string | null
}

/**
 * "Manage catalog" — the CAB's fee-schedule catalog (add / edit / deactivate / delete items)
 * and the currencies it invoices in. Opened from the invoice "Add item" dialog; CAB staff only.
 */
export function FeeCatalogManagerDialog({ open, onOpenChange, onChanged, editItemId }: FeeCatalogManagerDialogProps) {
  const { t, i18n } = useTranslation()
  const [items, setItems] = useState<FeeItem[]>([])
  const [allowed, setAllowed] = useState<FeeCurrency[]>([])
  const [supported, setSupported] = useState<FeeCurrency[]>([])
  const [currencyDraft, setCurrencyDraft] = useState<FeeCurrency[]>([])
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ItemForm>(EMPTY_ITEM_FORM)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  // Each (re)load has a number; the list is "loading" until that number has been answered.
  const [requested, setRequested] = useState(0)
  const [answered, setAnswered] = useState(-1)
  const loading = open && answered !== requested

  const reload = useCallback(() => setRequested((value) => value + 1), [])

  // Deep link: put the linked item in the edit form once the catalog has loaded.
  const [editedLink, setEditedLink] = useState<string | null>(null)
  if (open && editItemId && editedLink !== editItemId && !loading) {
    const linked = items.find((item) => item.id === editItemId)
    if (linked) {
      setEditedLink(editItemId)
      setEditingId(linked.id)
      setForm(formFromItem(linked))
    }
  }

  useEffect(() => {
    if (!open) return
    let cancelled = false
    Promise.all([listFeeItems({ includeInactive: true }), getFeeCurrencies()])
      .then(([list, currencies]) => {
        if (cancelled) return
        setItems(list)
        setAllowed(currencies.allowed)
        setSupported(currencies.supported)
        setCurrencyDraft(currencies.allowed)
      })
      .catch((error: unknown) => {
        if (!cancelled) toast.error(getUserErrorMessage(error, t))
      })
      .finally(() => {
        if (!cancelled) setAnswered(requested)
      })
    return () => {
      cancelled = true
    }
  }, [open, requested, t])

  const resetForm = () => {
    setEditingId(null)
    setForm(EMPTY_ITEM_FORM)
    setShowErrors(false)
  }

  const set = <K extends keyof ItemForm>(key: K, value: ItemForm[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }))

  const errors = useMemo(() => {
    const amount = form.amount.trim()
    return {
      name: form.name.trim() ? undefined : t('feeCatalog.errors.name'),
      amount: AMOUNT_PATTERN.test(amount) ? undefined : t('feeCatalog.errors.amount'),
      currency: form.currency ? undefined : t('feeCatalog.errors.currency'),
      code: CODE_PATTERN.test(form.code.trim()) ? undefined : t('feeCatalog.errors.code'),
    }
  }, [form, t])
  const formValid = !errors.name && !errors.amount && !errors.currency && !errors.code

  const currencyOptions = useMemo(
    () => allowed.map((code) => ({ value: code, label: t(`feeCatalog.currencies.${code}`, code) })),
    [allowed, t],
  )

  const saveItem = async () => {
    if (!formValid) {
      setShowErrors(true)
      return
    }
    const input: FeeItemInput = {
      code: form.code.trim() || null,
      name: form.name.trim(),
      nameAr: form.nameAr.trim() || null,
      unit: form.unit.trim() || null,
      defaultAmount: Number(form.amount.trim()),
      currency: form.currency as FeeCurrency,
      isActive: form.isActive,
    }
    setBusy(true)
    try {
      if (editingId) await updateFeeItem(editingId, input)
      else await createFeeItem(input)
      toast.success(editingId ? t('feeCatalog.toasts.updated') : t('feeCatalog.toasts.created'))
      resetForm()
      reload()
      onChanged?.()
    } catch (error) {
      toast.error(getUserErrorMessage(error, t, { statusMessages: { 409: 'feeCatalog.errors.duplicateCode' } }))
    } finally {
      setBusy(false)
    }
  }

  const toggleActive = async (item: FeeItem, isActive: boolean) => {
    setBusy(true)
    try {
      await updateFeeItem(item.id, { isActive })
      reload()
      onChanged?.()
    } catch (error) {
      toast.error(getUserErrorMessage(error, t))
    } finally {
      setBusy(false)
    }
  }

  const removeItem = async (id: string) => {
    setBusy(true)
    try {
      await deleteFeeItem(id)
      setConfirmDeleteId(null)
      if (editingId === id) resetForm()
      toast.success(t('feeCatalog.toasts.deleted'))
      reload()
      onChanged?.()
    } catch (error) {
      toast.error(getUserErrorMessage(error, t))
    } finally {
      setBusy(false)
    }
  }

  const currenciesDirty =
    currencyDraft.length !== allowed.length || currencyDraft.some((code) => !allowed.includes(code))

  const saveCurrencies = async () => {
    if (currencyDraft.length === 0) return
    setBusy(true)
    try {
      const saved = await updateFeeCurrencies(currencyDraft)
      setAllowed(saved.allowed)
      setCurrencyDraft(saved.allowed)
      toast.success(t('feeCatalog.toasts.currenciesSaved'))
      onChanged?.()
    } catch (error) {
      toast.error(getUserErrorMessage(error, t, { statusMessages: { 409: 'feeCatalog.errors.currencyInUse' } }))
    } finally {
      setBusy(false)
    }
  }

  const toggleCurrency = (code: FeeCurrency) =>
    setCurrencyDraft((previous) =>
      previous.includes(code) ? previous.filter((item) => item !== code) : [...previous, code],
    )

  const formatAmount = (item: FeeItem) =>
    `${item.defaultAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${item.currency}`

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          resetForm()
          setConfirmDeleteId(null)
        }
        onOpenChange(next)
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-surface-overlay/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed start-1/2 top-1/2 z-50 flex max-h-[92vh] w-[min(900px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-card focus:outline-none rtl:translate-x-1/2"
        >
          <div className="flex shrink-0 items-start justify-between gap-4 px-4 pt-5 sm:px-6">
            <div className="min-w-0">
              <Dialog.Title className="text-body-lg font-semibold leading-[1.6] text-neutral-900 sm:text-[24px]">
                {t('feeCatalog.title')}
              </Dialog.Title>
              <p className="text-body-sm text-neutral-600">{t('feeCatalog.subtitle')}</p>
              <div className="mt-2">
                <ImportMenuButton definitionKey="fee_items" size="sm" onImported={reload} />
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t('common.close')}
                className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-text-primary text-text-primary transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-5 sm:px-6">
            {/* Invoice currencies */}
            <section className="space-y-3 rounded-lg border border-neutral-100 p-4">
              <div>
                <h3 className="text-body font-semibold text-neutral-900">{t('feeCatalog.currenciesTitle')}</h3>
                <p className="text-body-sm text-neutral-600">{t('feeCatalog.currenciesHint')}</p>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {supported.map((code) => (
                  <label key={code} className="flex cursor-pointer items-center gap-2 text-body-sm text-neutral-800">
                    <Checkbox
                      checked={currencyDraft.includes(code)}
                      disabled={busy || loading}
                      onChange={() => toggleCurrency(code)}
                    />
                    <span>
                      <span className="font-medium" dir="ltr">{code}</span>
                      <span className="text-neutral-600"> · {t(`feeCatalog.currencies.${code}`, code)}</span>
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={busy || loading || !currenciesDirty || currencyDraft.length === 0}
                  onClick={() => void saveCurrencies()}
                >
                  {t('feeCatalog.saveCurrencies')}
                </Button>
                {currencyDraft.length === 0 && (
                  <p className="text-body-sm text-error-700">{t('feeCatalog.errors.noCurrency')}</p>
                )}
              </div>
            </section>

            {/* Items */}
            <section className="space-y-3">
              <h3 className="text-body font-semibold text-neutral-900">{t('feeCatalog.itemsTitle')}</h3>
              {loading ? (
                <p className="py-6 text-center text-body-sm text-neutral-600">{t('common.loading')}</p>
              ) : items.length === 0 ? (
                <p className="rounded-lg bg-neutral-25 py-6 text-center text-body-sm text-neutral-600">
                  {t('feeCatalog.empty')}
                </p>
              ) : (
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className={cn(
                        'flex flex-wrap items-center gap-3 rounded-md border border-neutral-100 px-3 py-2.5',
                        !item.isActive && 'bg-neutral-25',
                        editingId === item.id && 'border-primary',
                      )}
                    >
                      <div className="min-w-0 flex-1 basis-[220px]">
                        <p className={cn('truncate text-body-sm font-medium', item.isActive ? 'text-neutral-900' : 'text-neutral-600')}>
                          {feeItemName(item, i18n.language)}
                        </p>
                        <p className="mt-0.5 truncate text-caption text-neutral-600">
                          {item.code && <span dir="ltr">{item.code} · </span>}
                          <span dir="ltr">{formatAmount(item)}</span>
                          {item.unit && <span> · {item.unit}</span>}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Toggle
                          size="sm"
                          checked={item.isActive}
                          disabled={busy}
                          onChange={(checked) => void toggleActive(item, checked)}
                          aria-label={t('feeCatalog.activeToggle', { name: feeItemName(item, i18n.language) })}
                        />
                        <span className="w-14 text-caption text-neutral-600">
                          {item.isActive ? t('feeCatalog.active') : t('feeCatalog.inactive')}
                        </span>
                        {confirmDeleteId === item.id ? (
                          <>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={busy}
                              onClick={() => void removeItem(item.id)}
                            >
                              {t('feeCatalog.confirmDelete')}
                            </Button>
                            <Button variant="tertiary" size="sm" disabled={busy} onClick={() => setConfirmDeleteId(null)}>
                              {t('common.cancel')}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busy}
                              onClick={() => {
                                setEditingId(item.id)
                                setForm(formFromItem(item))
                                setShowErrors(false)
                              }}
                            >
                              {t('feeCatalog.edit')}
                            </Button>
                            <Button
                              variant="tertiary"
                              size="sm"
                              className="text-error-500"
                              disabled={busy}
                              onClick={() => setConfirmDeleteId(item.id)}
                            >
                              {t('common.delete')}
                            </Button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Add / edit form */}
            <section className="space-y-4 rounded-lg border border-neutral-100 p-4">
              <h3 className="text-body font-semibold text-neutral-900">
                {editingId ? t('feeCatalog.editTitle') : t('feeCatalog.addTitle')}
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label={t('feeCatalog.fields.name')} required>
                  <TextField
                    id="fee-item-name"
                    value={form.name}
                    maxLength={200}
                    error={showErrors ? errors.name : undefined}
                    onChange={(e) => set('name', e.target.value)}
                  />
                </FormField>
                <FormField label={t('feeCatalog.fields.nameAr')}>
                  <TextField id="fee-item-name-ar" value={form.nameAr} maxLength={200} dir="rtl" onChange={(e) => set('nameAr', e.target.value)} />
                </FormField>
                <FormField label={t('feeCatalog.fields.amount')} required>
                  <TextField
                    inputMode="decimal"
                    error={showErrors ? errors.amount : undefined}
                    dir="ltr"
                    value={form.amount}
                    onChange={(e) => set('amount', e.target.value)}
                  />
                </FormField>
                <FormField label={t('feeCatalog.fields.currency')} required>
                  <SelectField
                    value={form.currency}
                    options={currencyOptions}
                    onChange={(value) => set('currency', value)}
                    placeholder={t('feeCatalog.fields.currencyPlaceholder')}
                  />
                  {showErrors && errors.currency && (
                    <p className="text-caption text-error-700">{errors.currency}</p>
                  )}
                </FormField>
                <FormField label={t('feeCatalog.fields.unit')}>
                  <TextField
                    id="fee-item-unit"
                    value={form.unit}
                    maxLength={60}
                    placeholder={t('feeCatalog.fields.unitPlaceholder')}
                    onChange={(e) => set('unit', e.target.value)}
                  />
                </FormField>
                <FormField label={t('feeCatalog.fields.code')}>
                  <TextField
                    id="fee-item-code"
                    value={form.code}
                    error={showErrors ? errors.code : undefined}
                    maxLength={30}
                    dir="ltr"
                    placeholder="S1-DAY"
                    onChange={(e) => set('code', e.target.value)}
                  />
                </FormField>
              </div>
              <label className="flex items-center gap-3 text-body-sm text-neutral-800">
                <Toggle size="sm" checked={form.isActive} onChange={(checked) => set('isActive', checked)} aria-label={t('feeCatalog.fields.active')} />
                {t('feeCatalog.fields.active')}
              </label>
              <div className="flex flex-wrap justify-end gap-3">
                {editingId && (
                  <Button variant="tertiary" size="sm" disabled={busy} onClick={resetForm}>
                    {t('feeCatalog.cancelEdit')}
                  </Button>
                )}
                <Button variant="primary" size="sm" className="px-5" disabled={busy || loading} onClick={() => void saveItem()}>
                  {editingId ? t('feeCatalog.saveItem') : t('feeCatalog.addItem')}
                </Button>
              </div>
            </section>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
