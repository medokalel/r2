import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { SelectField, TextField } from '@/components/ui'
import { Toggle } from '@/components/ui/Toggle'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { currencyOptions } from '@/lib/currencies'
import { AuditTimeBreakdown } from '@/components/dashboard/cab/AuditTimeBreakdown'
import { ApiError } from '@/lib/api/client'
import { getAuditTimeContext, previewQuotation, type AuditTimeContext, type CabPricingConfig, type QuotationPreview } from '@/lib/api/cabQuotationApi'
import {
  CYCLE_TYPE_OPTIONS, FOOD_CATEGORIES, calculationPayload, calculationReady, isValidAdjustment,
  isValidPercent, siteOfRow, siteRowOf, sitesOf, standardLabelOf, type CalculationBranch, type CalculationFormState, type CycleTypeInput,
} from '@/lib/quotationForm'
import { classifyStandard, type ClassificationSuggestion } from '@/lib/auditTime/classification'
import { siteOfBranch, type DraftBranch } from '@/lib/auditTime/quotationDraft'
import { SectorClassificationPanel } from '@/components/dashboard/cab/SectorClassificationPanel'
import { MultiSiteRegister } from '@/components/dashboard/cab/MultiSiteRegister'
import { notSet } from '@/lib/emptyValue'

interface Props {
  applicationId: string
  standards: string[]
  branches: CalculationBranch[]
  /** Request type of the application (NEW, RENEWAL, TRANSFER …) shown for the default cycle type. */
  requestType?: string | null
  pricingConfigs: CabPricingConfig[]
  value: CalculationFormState
  onChange: (next: CalculationFormState) => void
}

const sectionTitle = 'text-body font-bold text-primary'
const hint = 'text-caption text-text-secondary'

/**
 * Audit-time and pricing inputs of the quotation editor with a live preview of the days and fees
 * (POST …/quotation/preview, or the same calculator in demo mode) and its breakdown.
 */
export function QuotationCalculationPanel({ applicationId, standards, branches, requestType, pricingConfigs, value, onChange }: Props) {
  const { t, i18n } = useTranslation()
  const [preview, setPreview] = useState<QuotationPreview | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const set = (patch: Partial<CalculationFormState>) => onChange({ ...value, ...patch })

  const sites = sitesOf(branches)
  const ready = calculationReady(value, standards)

  // Suggested classification and override permission (GET …/audit-time-context).
  const [context, setContext] = useState<AuditTimeContext | null>(null)
  useEffect(() => {
    let cancelled = false
    getAuditTimeContext(applicationId)
      .then((result) => { if (!cancelled) setContext(result) })
      .catch(() => { /* the classification falls back to the manual choice */ })
    return () => { cancelled = true }
  }, [applicationId])
  const registerSites = useMemo(
    () => (value.multiSite && value.sites ? value.sites.map(siteOfRow) : context?.sites ?? (branches as DraftBranch[]).filter((b) => (b.employeesInScope ?? 0) > 0).map(siteOfBranch)),
    [value.multiSite, value.sites, context, branches],
  )
  // Same rule as the API: highest category among the IAF codes of the scope and the sites of each standard.
  const suggestions = useMemo(() => {
    const result: Record<string, ClassificationSuggestion> = {}
    for (const code of standards) {
      const scope = context?.standards.find((s) => s.standardCode === code)?.certificateIafCodes ?? []
      const siteCodes = registerSites.filter((s) => s.isCentral || !s.standards?.length || s.standards.includes(code)).flatMap((s) => s.iafCodes ?? [])
      result[code] = classifyStandard(code, [...scope, ...siteCodes])
    }
    return result
  }, [standards, context, registerSites])
  const suggestedKey = JSON.stringify(Object.fromEntries(Object.entries(suggestions).map(([code, s]) => [code, s.rule === 'HIGHEST_OF_CODES' ? s.suggested : null])))
  useEffect(() => {
    if (JSON.stringify(value.suggested) !== suggestedKey) onChange({ ...value, suggested: JSON.parse(suggestedKey) as Record<string, string | null> })
  }, [suggestedKey, value, onChange])
  const enableMultiSite = (multiSite: boolean) =>
    set(multiSite && !value.sites
      ? {
          multiSite,
          sites: registerSites.map(siteRowOf),
          eligibility: Object.keys(value.eligibility).length ? value.eligibility : Object.fromEntries((context?.eligibilityCriteria ?? []).filter((c) => c.input).map((c) => [c.input, null])),
        }
      : { multiSite })
  const payloadKey = useMemo(() => JSON.stringify(calculationPayload(value, standards, branches)), [value, standards, branches])

  useEffect(() => {
    if (!ready) return undefined
    let cancelled = false
    const timer = setTimeout(() => {
      setPreviewing(true)
      previewQuotation(applicationId, JSON.parse(payloadKey))
        .then((result) => { if (!cancelled) { setPreview(result); setPreviewError(null) } })
        .catch((failure: unknown) => { if (!cancelled) { setPreview(null); setPreviewError(failure instanceof ApiError ? failure.message : t('errors.generic')) } })
        .finally(() => { if (!cancelled) setPreviewing(false) })
    }, 400)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [applicationId, payloadKey, ready, t])

  const currencyRate = (currency: string) => pricingConfigs.find((c) => c.standardId === null && c.currency === currency)
  const changeCurrency = (currency: string) => {
    const config = currencyRate(currency)
    set({ currency, rate: config ? String(Number(config.dailyRate)) : '' })
  }
  const money = (amount: string | number, currency: string) =>
    new Intl.NumberFormat(i18n.language, { style: 'currency', currency: currency || 'SAR' }).format(Number(amount))
  const cycleLabel = (cycle: CycleTypeInput) =>
    cycle
      ? t(`cab.auditTime.cycle.${cycle}`, { defaultValue: { INITIAL: 'Initial certification', RECERTIFICATION: 'Recertification', TRANSFER: 'Transfer (IAF MD 2)' }[cycle] })
      : t('cab.auditTime.cycleFromApplication', { type: requestType || notSet(), defaultValue: 'From the application ({{type}})' })
  const percentError = (text: string, min = 0, max = 100) => (isValidPercent(text, min, max) ? undefined : t('cab.auditTime.percentRange', { min, max, defaultValue: 'Enter {{min}} to {{max}} %' }))
  const shown = ready ? preview : null

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <h2 className={sectionTitle}>{t('cab.auditTime.pricingTitle')}</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <SearchableSelect
            id="quotation-currency"
            label={t('cab.quotationEditor.currency')}
            required
            value={value.currency}
            options={currencyOptions(i18n.language)}
            searchPlaceholder={t('cab.pricing.currencySearch')}
            onChange={changeCurrency}
          />
          <TextField
            id="quotation-rate"
            label={value.currency ? t('cab.quotationEditor.dailyRateWithCurrency', { currency: value.currency }) : t('cab.quotationEditor.dailyRate')}
            type="number" min="0.01" step="0.01" required
            value={value.rate}
            onChange={(event) => set({ rate: event.target.value })}
          />
        </div>
        <p className={hint}>{t('cab.auditTime.rateHint', 'Prefilled from CAB Profile → Pricing; changing it here applies to this quotation only.')}</p>
        {standards.length > 1 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {standards.map((code) => (
              <TextField
                key={code}
                id={`quotation-rate-${code}`}
                label={t('cab.auditTime.standardRate', { standard: standardLabelOf(code), currency: value.currency, defaultValue: '{{standard}} rate ({{currency}}, optional)' })}
                type="number" min="0.01" step="0.01"
                value={value.standardRates[code] ?? ''}
                onChange={(event) => set({ standardRates: { ...value.standardRates, [code]: event.target.value } })}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className={sectionTitle}>{t('cab.auditTime.inputsTitle', 'Audit time')}</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            id="quotation-cycle"
            label={t('cab.auditTime.cycleType', 'Certification cycle')}
            value={value.cycleType || 'AUTO'}
            options={[{ value: 'AUTO', label: cycleLabel('') }, ...CYCLE_TYPE_OPTIONS.map((cycle) => ({ value: cycle, label: cycleLabel(cycle) }))]}
            onChange={(next) => set({ cycleType: next === 'AUTO' ? '' : (next as CycleTypeInput) })}
          />
          <TextField
            id="quotation-stage1-share"
            label={t('cab.auditTime.stage1ShareLabel', 'Stage 1 share of the initial audit (%)')}
            type="number" min="1" max="99" step="1" placeholder="30"
            value={value.stage1Share}
            error={value.stage1Share.trim() !== '' && !(Number(value.stage1Share) > 0 && Number(value.stage1Share) < 100) ? t('cab.auditTime.percentRange', { min: 1, max: 99, defaultValue: 'Enter {{min}} to {{max}} %' }) : undefined}
            onChange={(event) => set({ stage1Share: event.target.value })}
          />
        </div>

        <SectorClassificationPanel
          standards={standards}
          suggestions={suggestions}
          canOverride={context?.permissions.canOverrideClassification ?? false}
          value={value}
          onChange={set}
        />

        {standards.includes('ISO_22000') && (
          <div className="grid gap-5 sm:grid-cols-3">
            <SelectField id="fsms-category" label={t('cab.quotationFlow.fsms.category')} required value={value.foodCategory}
              options={FOOD_CATEGORIES} onChange={(foodCategory) => set({ foodCategory })} />
            <TextField id="fsms-studies" label={t('cab.quotationFlow.fsms.studies')} type="number" min="1" step="1" required
              value={value.studies} onChange={(e) => set({ studies: e.target.value })} />
            <TextField id="fsms-fte" label={t('cab.quotationFlow.fsms.fte')} type="number" min="0" step="1"
              value={value.fte} onChange={(e) => set({ fte: e.target.value })} />
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          {standards.length > 1 && (
            <TextField
              id="quotation-integration"
              label={t('cab.auditTime.integrationLabel', 'Integration level of the management systems (%)')}
              type="number" min="0" max="100" step="5" placeholder="0"
              value={value.integrationLevel}
              error={percentError(value.integrationLevel)}
              onChange={(event) => set({ integrationLevel: event.target.value })}
            />
          )}
          <TextField
            id="quotation-remote"
            label={t('cab.auditTime.remoteLabel', 'Remote (ICT) share of audit time (%)')}
            type="number" min="0" max="100" step="5" placeholder="0"
            value={value.remoteShare}
            error={percentError(value.remoteShare)}
            onChange={(event) => set({ remoteShare: event.target.value })}
          />
        </div>
        {standards.length > 1 && <p className={hint}>{t('cab.auditTime.integrationHint', 'IAF MD 11: the summed time is reduced by up to 20 % (20 % × integration level).')}</p>}

        {(sites.length > 1 || (value.sites?.length ?? 0) > 1) && (
          <div className="flex flex-col gap-4 rounded-lg border border-neutral-100 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-body-sm font-semibold text-neutral-900">{t('cab.auditTime.multiSite', 'Multi-site (IAF MD 1)')}</p>
                <p className={hint}>{t('cab.auditTime.multiSiteHint', { count: value.sites?.length ?? sites.length, defaultValue: '{{count}} sites in scope: each site is timed from its own personnel.' })}</p>
              </div>
              <Toggle checked={value.multiSite} onChange={enableMultiSite} aria-label={t('cab.auditTime.multiSite', 'Multi-site (IAF MD 1)')} size="sm" />
            </div>
            {value.multiSite && (
              <MultiSiteRegister
                standards={standards}
                value={value}
                onChange={set}
                summary={shown?.calculation.breakdown.standards.find((s) => s.multiSite)?.multiSite ?? null}
                eligibility={shown?.calculation.breakdown.multiSite?.eligibility ?? null}
              />
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div>
            <p className="text-body-sm font-semibold text-neutral-900">{t('cab.auditTime.adjustmentsTitle', 'Adjustment factors (IAF MD 5)')}</p>
            <p className={hint}>{t('cab.auditTime.adjustmentsHint', 'Each factor needs a reason. The total reduction cannot exceed 30 % of the table time.')}</p>
          </div>
          {value.adjustments.map((row) => {
            const update = (patch: Partial<typeof row>) => set({ adjustments: value.adjustments.map((r) => (r.id === row.id ? { ...r, ...patch } : r)) })
            return (
              <div key={row.id} className="grid items-end gap-3 rounded-md border border-neutral-100 p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_110px_minmax(0,2fr)_auto]">
                <SelectField id={`adj-standard-${row.id}`} label={t('cab.auditTime.standard', 'Standard')} required value={row.standardCode}
                  options={standards.map((code) => ({ value: code, label: standardLabelOf(code) }))} onChange={(standardCode) => update({ standardCode })} />
                <SelectField id={`adj-direction-${row.id}`} label={t('cab.auditTime.direction', 'Effect')} required value={row.direction}
                  options={[
                    { value: 'DECREASE', label: t('cab.auditTime.decrease', 'Reduce') },
                    { value: 'INCREASE', label: t('cab.auditTime.increase', 'Increase') },
                  ]}
                  onChange={(direction) => update({ direction: direction as 'INCREASE' | 'DECREASE' })} />
                <TextField id={`adj-percent-${row.id}`} label="%" type="number" min="0.5" max="100" step="0.5" required value={row.percent}
                  onChange={(e) => update({ percent: e.target.value })} />
                <TextField id={`adj-reason-${row.id}`} label={t('cab.auditTime.reason', 'Reason')} required maxLength={500} value={row.reason}
                  onChange={(e) => update({ reason: e.target.value })} />
                <Button type="button" variant="outline" onClick={() => set({ adjustments: value.adjustments.filter((r) => r.id !== row.id) })}>
                  {t('cab.quotationEditor.remove')}
                </Button>
              </div>
            )
          })}
          {!value.adjustments.every(isValidAdjustment) && (
            <p role="alert" className="text-caption text-error-700">{t('cab.auditTime.adjustmentInvalid', 'Each factor needs a standard, a percentage (0 to 100) and a reason of at least 3 characters.')}</p>
          )}
          <div>
            <Button type="button" variant="outline"
              onClick={() => set({ adjustments: [...value.adjustments, { id: crypto.randomUUID(), standardCode: standards[0] ?? '', direction: 'DECREASE', percent: '', reason: '' }] })}>
              + {t('cab.auditTime.addAdjustment', 'Add factor')}
            </Button>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-live="polite">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className={sectionTitle}>{t('cab.auditTime.previewTitle', 'Calculated audit days')}</h2>
          {previewing && <span className={hint}>{t('common.loading')}</span>}
        </div>
        {!ready && <p className={hint}>{t('cab.auditTime.previewPending', 'Complete the required inputs to see the calculated days.')}</p>}
        {ready && previewError && <p role="alert" className="text-body-sm text-error-700">{previewError}</p>}
        {shown && (
          <>
            <div className="overflow-x-auto rounded-lg border border-neutral-100">
              <table className="w-full min-w-[480px] text-body-sm">
                <thead className="bg-primary-25 text-text-secondary">
                  <tr>
                    <th className="px-3 py-2 text-start font-medium">{t('cab.auditTime.standard', 'Standard')}</th>
                    {shown.standards[0]?.stages.map((stage) => (
                      <th key={stage.stage} className="px-3 py-2 text-end font-medium">{t(`cab.quotationFlow.event.${stage.stage}`)}</th>
                    ))}
                    <th className="px-3 py-2 text-end font-medium">{t('cab.quotationEditor.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.standards.map((standard) => (
                    <tr key={standard.standardCode} className="border-t border-neutral-100">
                      <td className="px-3 py-2 font-semibold" dir="ltr">{standardLabelOf(standard.standardCode)}<span className="block text-caption font-normal text-text-secondary">{money(standard.dailyRate, shown.currency)} / {t('cab.quotationFlow.programme.day')}</span></td>
                      {standard.stages.map((stage) => (
                        <td key={stage.stage} className="px-3 py-2 text-end tabular-nums">{Number(stage.days)}<span className="block text-caption text-text-secondary">{money(stage.fee, shown.currency)}</span></td>
                      ))}
                      <td className="px-3 py-2 text-end font-semibold tabular-nums">{Number(standard.totalDays)}<span className="block text-caption font-normal text-text-secondary">{money(standard.totalFee, shown.currency)}</span></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-neutral-100 bg-neutral-50 font-bold">
                    <td className="px-3 py-2" colSpan={(shown.standards[0]?.stages.length ?? 0) + 1}>{t('cab.auditTime.auditFeeTotal', 'Audit days and fee (before travel, extras and tax)')}</td>
                    <td className="px-3 py-2 text-end tabular-nums">{Number(shown.totalAuditDays)}<span className="block text-caption">{money(shown.totalAuditFee, shown.currency)}</span></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <AuditTimeBreakdown breakdown={shown.calculation.breakdown} />
          </>
        )}
      </section>
    </div>
  )
}
