import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { createCabInvoice, type CabInvoiceItem } from '@/lib/api/cabInvoiceRegisterApi'
import { fetchPlanningClients, type PlanningClient } from '@/lib/api/cabAuditPlanningApi'
import { getFeeCurrencies } from '@/lib/api/feeItemsApi'
import { getUserErrorMessage } from '@/lib/errorMessages'

interface CreateCabInvoiceDialogProps {
  /** Mount only while open; closing unmounts the dialog and resets the form. */
  onClose: () => void
  onCreated: (invoice: CabInvoiceItem) => void
}

interface Options {
  clients: PlanningClient[]
  currencies: string[]
}

/**
 * Opens a manual draft invoice (POST /cab/invoices) for one of the CAB's audit clients.
 * The currency list is the CAB's allowed invoice currencies from the fee catalog; the
 * line items are then picked from the catalog on the invoice details page.
 */
export function CreateCabInvoiceDialog({ onClose, onCreated }: CreateCabInvoiceDialogProps) {
  const { t } = useTranslation()
  const [options, setOptions] = useState<Options | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [clientId, setClientId] = useState('')
  const [currency, setCurrency] = useState('')
  const [poReference, setPoReference] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchPlanningClients(), getFeeCurrencies()])
      .then(([clients, settings]) => {
        if (cancelled) return
        setOptions({ clients, currencies: settings.allowed })
        setCurrency(settings.allowed[0] ?? '')
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(getUserErrorMessage(err, t, { fallbackKey: 'invoices.create.loadError' }))
      })
    return () => {
      cancelled = true
    }
  }, [t])

  const errorText = (err: unknown) => {
    const code = err instanceof Error ? err.message : ''
    if (code === 'CLIENT_NOT_FOUND') return t('invoices.create.clientNotFound')
    if (code === 'CURRENCY_NOT_ALLOWED') return t('invoices.create.currencyNotAllowed')
    return getUserErrorMessage(err, t, { fallbackKey: 'invoices.create.saveError' })
  }

  const submit = async () => {
    if (!clientId || !currency) {
      setError(t('invoices.create.required'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      const invoice = await createCabInvoice({ clientId, currency, poReference })
      onCreated(invoice)
    } catch (err) {
      setError(errorText(err))
      setSaving(false)
    }
  }

  const loading = !options && !loadError

  return (
    <Dialog.Root open onOpenChange={(next) => { if (!next && !saving) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-surface-overlay/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed start-1/2 top-1/2 z-50 flex max-h-[92vh] w-[min(480px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-3xl bg-white p-5 shadow-card focus:outline-none rtl:translate-x-1/2 sm:p-6"
        >
          <div className="space-y-1">
            <Dialog.Title className="text-body-lg font-semibold text-neutral-900">{t('invoices.create.title')}</Dialog.Title>
            <p className="text-body-sm leading-relaxed text-neutral-600">{t('invoices.create.subtitle')}</p>
          </div>

          {loading && <p className="text-body-sm text-neutral-600">{t('invoices.create.loading')}</p>}
          {loadError && <p className="text-body-sm text-error-700">{loadError}</p>}

          {options && (
            <div className="space-y-4">
              <SelectField
                label={t('invoices.create.client')}
                required
                value={clientId}
                onChange={setClientId}
                placeholder={t('invoices.create.clientPlaceholder')}
                options={options.clients.map((c) => ({ value: c.id, label: `${c.name} (${c.code})`, textValue: c.name }))}
              />
              {options.clients.length === 0 && (
                <p className="text-body-sm text-neutral-600">{t('invoices.create.noClients')}</p>
              )}
              <SelectField
                label={t('invoices.create.currency')}
                required
                value={currency}
                onChange={setCurrency}
                options={options.currencies}
              />
              <TextField
                label={t('invoices.create.poReference')}
                value={poReference}
                maxLength={100}
                onChange={(e) => setPoReference(e.target.value)}
              />
              <p className="text-caption text-neutral-600">{t('invoices.create.itemsHint')}</p>
            </div>
          )}

          {error && <p className="text-body-sm text-error-700">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="tertiary" size="sm" disabled={saving} onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button size="sm" disabled={saving || !options || !clientId || !currency} onClick={() => void submit()}>
              {saving ? t('invoices.create.saving') : t('invoices.create.submit')}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
