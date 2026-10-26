import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { SelectField, TextField } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { currencyName, currencyOptions, currencySymbol, listCurrencyCodes } from '@/lib/currencies'
import { SetupSection } from '@/components/auth/cab/setup/CabSetupPrimitives'
import { ApiError } from '@/lib/api/client'
import {
  deactivatePricingConfig,
  listAuditStandards,
  listPricingConfigs,
  upsertPricingConfig,
  type AuditStandardOption,
  type CabPricingConfig,
} from '@/lib/api/cabQuotationApi'

interface RowDraft { rate: string; tax: string }

const percentOf = (taxRate: string) => String(Math.round(Number(taxRate) * 10000) / 100)
const validRate = (value: string) => value.trim() !== '' && Number(value) > 0
const validTax = (value: string) => value.trim() === '' || (Number(value) >= 0 && Number(value) <= 100)
const rowClass = 'grid items-end gap-3 rounded-lg border border-[var(--cab-border,#e5e7eb)] bg-white p-4'

/**
 * CAB Profile, Pricing (GET/POST/DELETE /cab/pricing-config): the default man-day rate and tax per
 * currency (one is the default currency new quotations start from) and optional per-standard
 * rates. Every quotation can still change its rate.
 */
export function PricingConfigSection() {
  const { t, i18n } = useTranslation()
  const [configs, setConfigs] = useState<CabPricingConfig[]>([])
  const [standards, setStandards] = useState<AuditStandardOption[]>([])
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({})
  const [newRate, setNewRate] = useState({ currency: '', rate: '', tax: '' })
  const [newStandardRate, setNewStandardRate] = useState({ standardId: '', currency: '', rate: '' })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const apply = (list: CabPricingConfig[]) => {
    setConfigs(list)
    setDrafts(Object.fromEntries(list.map((c) => [c.id, { rate: String(Number(c.dailyRate)), tax: percentOf(c.taxRate) }])))
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([listPricingConfigs(), listAuditStandards()])
      .then(([list, options]) => {
        if (cancelled) return
        apply(list)
        setStandards(options)
      })
      .catch((error: unknown) => {
        if (!cancelled) setMessage({ type: 'error', text: error instanceof ApiError ? error.message : t('errors.generic') })
      })
    return () => {
      cancelled = true
    }
  }, [t])

  const globals = configs.filter((c) => c.standardId === null)
  const perStandard = configs.filter((c) => c.standardId !== null)
  const freeCurrencies = listCurrencyCodes().filter((code) => !globals.some((c) => c.currency === code))
  const configuredCurrencies = globals.map((c) => c.currency)

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true)
    setMessage(null)
    try {
      await action()
      apply(await listPricingConfigs())
      setMessage({ type: 'success', text: success })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof ApiError ? error.message : t('errors.generic') })
    } finally {
      setBusy(false)
    }
  }

  const rateLabel = (currency?: string) =>
    currency ? t('cab.quotationEditor.dailyRateWithCurrency', { currency }) : t('cab.quotationEditor.dailyRate')
  /** Currency shown in a saved row: symbol + code, with the localized name under it. */
  const currencyBadge = (code: string) => (
    <span className="flex min-w-0 flex-col">
      <span className="text-body font-semibold" dir="ltr">
        {currencySymbol(code) ? `${currencySymbol(code)} ` : ''}{code}
      </span>
      <span className="truncate text-caption text-[var(--cab-muted)]">{currencyName(code, i18n.language)}</span>
    </span>
  )

  const saved = t('cab.quotationEditor.pricingSaved')
  const removed = t('cab.quotationEditor.pricingRemoved')
  const draftOf = (config: CabPricingConfig) => drafts[config.id] ?? { rate: '', tax: '' }
  const setDraft = (id: string, patch: Partial<RowDraft>) => setDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { rate: '', tax: '' }), ...patch } }))

  const saveGlobal = (config: CabPricingConfig, isDefault?: boolean) => {
    const draft = draftOf(config)
    return run(
      () => upsertPricingConfig({ currency: config.currency, dailyRate: Number(draft.rate), taxRate: Number(draft.tax || 0) / 100, ...(isDefault ? { isDefault: true } : {}) }),
      saved,
    )
  }

  return (
    <SetupSection title={t('cab.quotationEditor.pricingTitle')}>
      <p className="mb-5 text-body-sm text-[var(--cab-muted)]">
        {t('cab.pricing.hint')}
      </p>

      <h3 className="mb-3 text-body font-semibold">{t('cab.pricing.defaultRates')}</h3>
      <div className="flex flex-col gap-3">
        {globals.map((config) => {
          const draft = draftOf(config)
          return (
            <div key={config.id} className={`${rowClass} sm:grid-cols-2 lg:grid-cols-[170px_minmax(0,1fr)_minmax(0,1fr)_auto]`}>
              <div className="flex flex-col gap-1">
                <span className="text-body-sm text-[var(--cab-muted)]">{t('cab.quotationEditor.currency')}</span>
                <span className="flex items-start gap-2">
                  {currencyBadge(config.currency)}
                  {config.isDefault && (
                    <span className="mt-0.5 rounded bg-primary-50 px-1.5 py-0.5 text-caption font-semibold text-primary">{t('cab.pricing.default', 'Default')}</span>
                  )}
                </span>
              </div>
              <TextField
                id={`pricing-rate-${config.id}`}
                label={rateLabel(config.currency)}
                type="number" min="0.01" step="0.01" required
                value={draft.rate}
                onChange={(event) => setDraft(config.id, { rate: event.target.value })}
              />
              <TextField
                id={`pricing-tax-${config.id}`}
                label={t('cab.quotationEditor.taxRate')}
                type="number" min="0" max="100" step="any"
                value={draft.tax}
                onChange={(event) => setDraft(config.id, { tax: event.target.value })}
              />
              <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-1">
                <Button type="button" disabled={busy || !validRate(draft.rate) || !validTax(draft.tax)} onClick={() => void saveGlobal(config)}>
                  {t('cab.quotationEditor.savePricing')}
                </Button>
                {!config.isDefault && (
                  <Button type="button" variant="outline" disabled={busy || !validRate(draft.rate) || !validTax(draft.tax)} onClick={() => void saveGlobal(config, true)}>
                    {t('cab.pricing.makeDefault', 'Make default')}
                  </Button>
                )}
                <Button type="button" variant="outline" disabled={busy} onClick={() => void run(() => deactivatePricingConfig(config.id), removed)}>
                  {t('cab.quotationEditor.removePricing')}
                </Button>
              </div>
            </div>
          )
        })}
        {globals.length === 0 && <p className="text-body-sm text-[var(--cab-muted)]">{t('cab.pricing.empty')}</p>}

        {freeCurrencies.length > 0 && (
          <div className={`${rowClass} border-dashed sm:grid-cols-2 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto]`}>
            <SearchableSelect
              id="pricing-new-currency"
              label={t('cab.quotationEditor.currency')}
              value={newRate.currency}
              placeholder={t('cab.pricing.chooseCurrency', 'Choose')}
              searchPlaceholder={t('cab.pricing.currencySearch')}
              options={currencyOptions(i18n.language, freeCurrencies)}
              onChange={(currency) => setNewRate((prev) => ({ ...prev, currency }))}
            />
            <TextField
              id="pricing-new-rate"
              label={rateLabel(newRate.currency)}
              type="number" min="0.01" step="0.01"
              value={newRate.rate}
              onChange={(event) => setNewRate((prev) => ({ ...prev, rate: event.target.value }))}
            />
            <TextField
              id="pricing-new-tax"
              label={t('cab.quotationEditor.taxRate')}
              type="number" min="0" max="100" step="any"
              value={newRate.tax}
              onChange={(event) => setNewRate((prev) => ({ ...prev, tax: event.target.value }))}
            />
            <Button
              type="button"
              disabled={busy || !newRate.currency || !validRate(newRate.rate) || !validTax(newRate.tax)}
              onClick={() => void run(async () => {
                await upsertPricingConfig({ currency: newRate.currency, dailyRate: Number(newRate.rate), taxRate: Number(newRate.tax || 0) / 100 })
                setNewRate({ currency: '', rate: '', tax: '' })
              }, saved)}
            >
              + {t('cab.pricing.addCurrency', 'Add currency')}
            </Button>
          </div>
        )}
      </div>

      <h3 className="mb-1 mt-8 text-body font-semibold">{t('cab.pricing.standardRates', 'Rates per standard (optional)')}</h3>
      <p className="mb-3 text-body-sm text-[var(--cab-muted)]">{t('cab.pricing.standardRatesHint', 'A rate set for a standard wins over the default rate of the same currency.')}</p>
      <div className="flex flex-col gap-3">
        {perStandard.map((config) => {
          const draft = draftOf(config)
          return (
            <div key={config.id} className={`${rowClass} sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_150px_minmax(0,1fr)_auto]`}>
              <div className="flex flex-col gap-1">
                <span className="text-body-sm text-[var(--cab-muted)]">{t('cab.auditTime.standard', 'Standard')}</span>
                <span className="text-body font-semibold" dir="ltr">{config.standard?.name ?? config.standard?.code}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-body-sm text-[var(--cab-muted)]">{t('cab.quotationEditor.currency')}</span>
                {currencyBadge(config.currency)}
              </div>
              <TextField
                id={`pricing-std-rate-${config.id}`}
                label={rateLabel(config.currency)}
                type="number" min="0.01" step="0.01" required
                value={draft.rate}
                onChange={(event) => setDraft(config.id, { rate: event.target.value })}
              />
              <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-1">
                <Button type="button" disabled={busy || !validRate(draft.rate)}
                  onClick={() => void run(() => upsertPricingConfig({ standardId: config.standardId, currency: config.currency, dailyRate: Number(draft.rate), taxRate: Number(config.taxRate) }), saved)}>
                  {t('cab.quotationEditor.savePricing')}
                </Button>
                <Button type="button" variant="outline" disabled={busy} onClick={() => void run(() => deactivatePricingConfig(config.id), removed)}>
                  {t('cab.quotationEditor.removePricing')}
                </Button>
              </div>
            </div>
          )
        })}
        {configuredCurrencies.length > 0 && standards.length > 0 && (
          <div className={`${rowClass} border-dashed sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_160px_minmax(0,1fr)_auto]`}>
            <SelectField
              id="pricing-std-new-standard"
              label={t('cab.auditTime.standard', 'Standard')}
              value={newStandardRate.standardId}
              placeholder={t('cab.pricing.chooseStandard', 'Choose a standard')}
              options={standards.map((s) => ({ value: s.id, label: s.name }))}
              onChange={(standardId) => setNewStandardRate((prev) => ({ ...prev, standardId }))}
            />
            <SelectField
              id="pricing-std-new-currency"
              label={t('cab.quotationEditor.currency')}
              value={newStandardRate.currency}
              placeholder={t('cab.pricing.chooseCurrency', 'Choose')}
              options={currencyOptions(i18n.language, configuredCurrencies)}
              onChange={(currency) => setNewStandardRate((prev) => ({ ...prev, currency }))}
            />
            <TextField
              id="pricing-std-new-rate"
              label={rateLabel(newStandardRate.currency)}
              type="number" min="0.01" step="0.01"
              value={newStandardRate.rate}
              onChange={(event) => setNewStandardRate((prev) => ({ ...prev, rate: event.target.value }))}
            />
            <Button
              type="button"
              disabled={busy || !newStandardRate.standardId || !newStandardRate.currency || !validRate(newStandardRate.rate)}
              onClick={() => void run(async () => {
                const global = globals.find((c) => c.currency === newStandardRate.currency)
                await upsertPricingConfig({
                  standardId: newStandardRate.standardId, currency: newStandardRate.currency, dailyRate: Number(newStandardRate.rate), taxRate: Number(global?.taxRate ?? 0),
                })
                setNewStandardRate({ standardId: '', currency: '', rate: '' })
              }, saved)}
            >
              + {t('cab.pricing.addStandardRate', 'Add rate')}
            </Button>
          </div>
        )}
      </div>

      {message && (
        <p role={message.type === 'error' ? 'alert' : 'status'} className={`mt-5 ${message.type === 'error' ? 'text-error-500' : 'text-success-600'}`}>
          {message.text}
        </p>
      )}
    </SetupSection>
  )
}
