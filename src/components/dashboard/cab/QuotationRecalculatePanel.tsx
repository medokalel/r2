import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui'
import { SectorClassificationPanel } from '@/components/dashboard/cab/SectorClassificationPanel'
import { ApiError } from '@/lib/api/client'
import { getAuditTimeContext, recalculateQuotation, type AuditTimeContext, type Quotation } from '@/lib/api/cabQuotationApi'
import { classifyStandard, type ClassificationSuggestion } from '@/lib/auditTime/classification'
import { emptyCalculationForm, isValidOverride, JUSTIFICATION_MIN, type CalculationFormState } from '@/lib/quotationForm'

interface Props {
  quotation: Quotation
  onChange: (next: Quotation) => void
}

const OPEN = ['CREATED', 'DRAFT']
const hint = 'text-caption text-text-secondary'

/** Classification state of the stored quotation (overrides, manual categories, Special time). */
function stateOf(quotation: Quotation): CalculationFormState {
  const state = emptyCalculationForm(null)
  for (const s of quotation.calculation?.inputs.standards ?? []) {
    if (s.classificationOverride?.to) state.classificationOverrides[s.standardCode] = { category: s.classificationOverride.to, justification: s.classificationOverride.justification }
    if (s.complexity && s.classification?.source === 'SELECTED') state.complexities[s.standardCode] = s.complexity
    if (s.specialCase) state.specialCases[s.standardCode] = { days: String(s.specialCase.days), justification: s.specialCase.justification }
  }
  return state
}

/**
 * Recalculate an open quotation with the current application data, sites and classification
 * (POST /cab/quotations/:id/recalculate): a reason, optional justified classification changes,
 * and the history of recalculations with the totals before and after. Issued or accepted
 * quotations are locked: a revised quotation is needed.
 */
export function QuotationRecalculatePanel({ quotation, onChange }: Props) {
  const { t, i18n } = useTranslation()
  const [context, setContext] = useState<AuditTimeContext | null>(null)
  const [value, setValue] = useState<CalculationFormState>(() => stateOf(quotation))
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const open = OPEN.includes(quotation.status)

  useEffect(() => {
    let cancelled = false
    getAuditTimeContext(quotation.applicationId)
      .then((result) => { if (!cancelled) setContext(result) })
      .catch(() => { /* the panel stays read-only */ })
    return () => { cancelled = true }
  }, [quotation.applicationId])

  const standards = quotation.standardCodesUsed
  const suggestions = useMemo(() => {
    const result: Record<string, ClassificationSuggestion> = {}
    for (const code of standards) {
      const scope = context?.standards.find((s) => s.standardCode === code)?.certificateIafCodes ?? []
      const siteCodes = (context?.sites ?? []).filter((s) => s.isCentral || !s.standards?.length || s.standards.includes(code)).flatMap((s) => s.iafCodes ?? [])
      result[code] = classifyStandard(code, [...scope, ...siteCodes])
    }
    return result
  }, [standards, context])
  const suggested = Object.fromEntries(Object.entries(suggestions).map(([code, s]) => [code, s.rule === 'HIGHEST_OF_CODES' ? s.suggested : null]))
  const state = { ...value, suggested }
  const canRecalculate = context?.permissions.canOverrideClassification ?? false
  const overridesOk = Object.values(state.classificationOverrides).every(isValidOverride)
  const ready = open && canRecalculate && reason.trim().length >= 3 && overridesOk

  const money = (amount: string) => new Intl.NumberFormat(i18n.language, { style: 'currency', currency: quotation.currency || 'SAR' }).format(Number(amount))

  const submit = async () => {
    setBusy(true)
    setError(null)
    setDone(false)
    try {
      const overrides = Object.entries(state.classificationOverrides)
        .filter(([code, row]) => row.category && row.category !== suggested[code] && row.justification.trim().length >= JUSTIFICATION_MIN)
        .map(([standardCode, row]) => ({ standardCode, category: row.category, justification: row.justification.trim() }))
      const manual = Object.fromEntries(Object.entries(state.complexities).filter(([code, level]) => level && !suggested[code]))
      const special = Object.entries(state.specialCases).filter(([, row]) => Number(row.days) > 0).map(([standardCode, row]) => ({ standardCode, days: Number(row.days), justification: row.justification.trim() }))
      const next = await recalculateQuotation(quotation.id, {
        reason: reason.trim(),
        classificationOverrides: overrides,
        ...(Object.keys(manual).length ? { complexities: manual } : {}),
        ...(special.length ? { specialCases: special } : {}),
      })
      setReason('')
      setDone(true)
      onChange(next)
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : t('errors.generic'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-neutral-100 bg-white p-5 sm:p-6" aria-labelledby="quotation-recalculate-title">
      <div>
        <h2 id="quotation-recalculate-title" className="text-body font-bold text-primary">{t('auditCalc.recalc.title', 'Recalculate audit time')}</h2>
        <p className={hint}>{t('auditCalc.recalc.hint', 'Runs the calculation again with the current application data, sites and classification. Days changed by hand are replaced; every recalculation is recorded with the totals before and after.')}</p>
      </div>

      {!open ? (
        <p className="rounded-md bg-warning-50 px-3 py-2 text-body-sm text-warning-800">
          {t('auditCalc.recalc.locked', 'This quotation is issued or closed and cannot be recalculated. Cancel it and prepare a revised quotation.')}
        </p>
      ) : !canRecalculate ? (
        <p className={hint}>{t('auditCalc.recalc.notAllowed', 'Only the CAB administrator, the general manager, the technical manager or the certification manager can recalculate a quotation.')}</p>
      ) : (
        <>
          {quotation.calculation && (
            <SectorClassificationPanel standards={standards} suggestions={suggestions} canOverride={canRecalculate} value={state}
              onChange={(patch) => setValue((previous) => ({ ...previous, ...patch }))} />
          )}
          <div className="flex flex-col gap-1">
            <label htmlFor="recalc-reason" className="text-body-sm font-medium">{t('auditCalc.recalc.reason', 'Reason for the recalculation (required)')}</label>
            <Textarea id="recalc-reason" rows={2} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />
          </div>
          {error && <p role="alert" className="text-body-sm text-error-700">{error}</p>}
          {done && <p role="status" className="text-body-sm text-success-700">{t('auditCalc.recalc.done', 'Quotation recalculated. An approved quotation goes back for approval.')}</p>}
          <div>
            <Button type="button" disabled={!ready || busy} onClick={() => void submit()}>
              {busy ? t('common.loading') : t('auditCalc.recalc.action', 'Recalculate')}
            </Button>
          </div>
        </>
      )}

      {(quotation.recalculations?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-caption font-semibold uppercase tracking-wide text-text-secondary">{t('auditCalc.recalc.history', 'Recalculations')}</h3>
          <ul className="flex flex-col divide-y divide-neutral-100 rounded-md border border-neutral-100">
            {quotation.recalculations!.map((r) => (
              <li key={r.id} className="flex flex-col gap-1 p-3 text-body-sm">
                <span className="font-semibold">
                  {t('auditCalc.recalc.line', {
                    beforeDays: Number(r.beforeTotalAuditDays), afterDays: Number(r.afterTotalAuditDays),
                    beforeAmount: money(r.beforeTotalAmount), afterAmount: money(r.afterTotalAmount),
                    defaultValue: '{{beforeDays}} to {{afterDays}} days; total {{beforeAmount}} to {{afterAmount}}',
                  })}
                </span>
                <span className="text-caption text-text-secondary">
                  {t('auditCalc.recalc.by', { by: r.changedByName ?? t('auditCalc.override.someone', 'an authorised user'), date: r.createdAt.slice(0, 10), reason: r.reason, defaultValue: '{{by}} on {{date}}: {{reason}}' })}
                  {r.manualOverridesReset > 0 && ` · ${t('auditCalc.recalc.reset', { count: r.manualOverridesReset, defaultValue: '{{count}} manual day changes replaced' })}`}
                  {r.approvalStatusBefore === 'APPROVED' && ` · ${t('auditCalc.recalc.reapproval', 'sent back for approval')}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
