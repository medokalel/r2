import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { SelectField, TextField, Textarea } from '@/components/ui'
import type { ClassificationSuggestion } from '@/lib/auditTime/classification'
import { CATEGORY_RANK, type SectorCategory } from '@/lib/auditTime/sectorCategories'
import { resolveIafCodeSectorName } from '@/lib/iafCodes'
import { COMPLEXITY_OPTIONS, JUSTIFICATION_MIN, standardLabelOf, type CalculationFormState } from '@/lib/quotationForm'
import { cn } from '@/lib/utils'
import { TABLE_FALLBACK, categoryLabel, effectText, linkNoteText, mappingConfirmedText, noCategoryText } from '@/lib/auditTime/labels'

interface Props {
  standards: string[]
  /** Suggestion per standard from the IAF codes of the scope and the sites. */
  suggestions: Record<string, ClassificationSuggestion>
  canOverride: boolean
  value: CalculationFormState
  onChange: (patch: Partial<CalculationFormState>) => void
}

const box = 'flex flex-col gap-3 rounded-lg border border-neutral-100 p-4'
const hint = 'text-caption text-text-secondary'

/**
 * Business-sector risk / complexity per standard (IAF MD 5 Annex A / B / C): the category
 * suggested from the client's IAF codes, why it was selected, how it affects the audit time, the
 * owner-confirmed link of each code (with its information note and alternatives), and a justified
 * override for authorised users. Codes with no MD 5 category are labelled plainly.
 */
export function SectorClassificationPanel({ standards, suggestions, canOverride, value, onChange }: Props) {
  const { t, i18n } = useTranslation()
  const [editing, setEditing] = useState<Record<string, boolean>>({})
  const shown = standards.filter((code) => code in COMPLEXITY_OPTIONS || code === 'ISO_9001')
  if (!shown.length) return null

  return (
    <section className="flex flex-col gap-3" aria-labelledby="sector-classification-title">
      <div>
        <h3 id="sector-classification-title" className="text-body-sm font-semibold text-neutral-900">{t('auditCalc.classification.title', 'Business sector risk and complexity (IAF MD 5)')}</h3>
        <p className={hint}>{t('auditCalc.classification.hint', 'Suggested from the IAF codes of the scope and the sites: the highest category among the codes. Authorised users can change it with a justification.')}</p>
        <p className={cn(hint, 'mt-1')} data-testid="mapping-confirmed">{mappingConfirmedText(t)}</p>
      </div>
      {shown.map((code) => {
        const suggestion = suggestions[code]
        const fromCodes = suggestion?.rule === 'HIGHEST_OF_CODES'
        const override = value.classificationOverrides[code]
        const overriding = Boolean(override?.category) && override.category !== suggestion?.suggested
        const manual = !fromCodes && code !== 'ISO_9001'
        const category = (overriding ? override.category : null) || (fromCodes ? suggestion.suggested : null) || value.complexities[code] || (code === 'ISO_9001' ? suggestion?.suggested ?? 'MEDIUM' : null)
        const options = (COMPLEXITY_OPTIONS[code] ?? ['HIGH', 'MEDIUM', 'LOW']).map((level) => ({ value: level, label: categoryLabel(t, level) }))
        const lowered = overriding && suggestion?.suggested && CATEGORY_RANK[override.category as SectorCategory] < CATEGORY_RANK[suggestion.suggested as SectorCategory]
        const setOverride = (patch: Partial<{ category: string; justification: string }>) =>
          onChange({ classificationOverrides: { ...value.classificationOverrides, [code]: { category: override?.category ?? '', justification: override?.justification ?? '', ...patch } } })
        const clearOverride = () => {
          const next = { ...value.classificationOverrides }
          delete next[code]
          onChange({ classificationOverrides: next })
          setEditing({ ...editing, [code]: false })
        }
        const special = value.specialCases[code] ?? { days: '', justification: '' }
        return (
          <article key={code} className={box} data-standard={code}>
            <header className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-body-sm font-bold text-primary" dir="ltr">{standardLabelOf(code)}</h4>
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn('rounded px-2 py-0.5 text-caption font-semibold', category === 'HIGH' || category === 'SPECIAL' ? 'bg-error-50 text-error-700' : 'bg-primary-50 text-primary')}>
                  {categoryLabel(t, category)}
                </span>
                <span className="rounded bg-neutral-50 px-2 py-0.5 text-caption text-text-secondary">
                  {overriding ? t('auditCalc.source.OVERRIDE', 'Override') : fromCodes ? t('auditCalc.source.SUGGESTED', 'Suggested') : manual ? t('auditCalc.source.SELECTED', 'Chosen by the CAB') : t('auditCalc.source.DEFAULT', 'Table time')}
                </span>
              </div>
            </header>

            {code === 'ISO_50001' ? (
              <p className={hint}>{t('auditCalc.classification.energy', 'ISO 50001 complexity comes from energy consumption, energy types and significant energy uses (ISO 50003), not from IAF codes.')}</p>
            ) : fromCodes ? (
              <p className="text-body-sm">
                {t('auditCalc.classification.why', {
                  category: categoryLabel(t, suggestion.suggested),
                  codes: suggestion.codes.filter((c) => c.category === suggestion.suggested).map((c) => c.code).join(', '),
                  table: t(`auditCalc.table.${code}`, TABLE_FALLBACK[code]),
                  defaultValue: 'Suggested {{category}}: the highest category among the IAF codes, given by IAF code {{codes}} in IAF MD 5 {{table}}.',
                })}
              </p>
            ) : (
              <p className={hint}>
                {suggestion?.codes.length
                  ? t('auditCalc.classification.noMapped', 'None of the IAF codes has an entry in the IAF MD 5 table: choose the category.')
                  : code === 'ISO_9001'
                    ? t('auditCalc.classification.qmsDefault', 'No IAF code on the scope: the Table QMS 1 time applies (medium risk).')
                    : t('auditCalc.classification.noCodes', 'No IAF code on the scope or the sites: choose the category.')}
              </p>
            )}

            {suggestion && suggestion.codes.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-caption">
                  <thead className="text-text-secondary">
                    <tr>
                      <th className="py-1 pe-2 text-start font-medium">{t('auditCalc.classification.code', 'IAF code')}</th>
                      <th className="py-1 pe-2 text-start font-medium">{t('auditCalc.classification.entries', 'IAF MD 5 sector entries')}</th>
                      <th className="py-1 pe-2 text-start font-medium">{t('auditCalc.classification.category', 'Category')}</th>
                      <th className="py-1 text-start font-medium">{t('auditCalc.classification.status', 'Status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggestion.codes.map((c) => (
                      <tr key={c.code} className="border-t border-neutral-100 align-top">
                        <td className="py-1.5 pe-2"><strong dir="ltr">IAF {c.code}</strong><span className="block text-text-secondary">{resolveIafCodeSectorName(c.code, i18n.language) ?? c.description}</span></td>
                        <td className="py-1.5 pe-4">
                          {c.entries.length
                            ? c.entries.map((entry) => (
                              <span key={entry.sector} className="block">
                                <bdi dir="ltr">{entry.sector}</bdi> <span className="text-text-secondary">({categoryLabel(t, entry.category)})</span>
                              </span>
                            ))
                            : t('auditCalc.classification.noEntry', 'No entry')}
                          {linkNoteText(t, c) && <span className="mt-0.5 block text-text-secondary">{linkNoteText(t, c)}</span>}
                        </td>
                        <td className="py-1.5 pe-2 font-semibold">{categoryLabel(t, c.category)}</td>
                        <td className="py-1.5">
                          {c.category
                            ? <span className="rounded bg-success-50 px-1.5 py-0.5 text-success-700">{t('auditCalc.classification.confirmed', 'Confirmed')}</span>
                            : <span className="rounded bg-neutral-50 px-1.5 py-0.5 text-text-secondary">{noCategoryText(t, code)}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="rounded-md bg-primary-25 px-3 py-2 text-body-sm">
              <strong className="font-semibold">{t('auditCalc.classification.effect', 'Effect on the audit time')}: </strong>
              {effectText(t, code, category)}
            </p>

            {manual && (
              <SelectField
                id={`complexity-${code}`}
                label={`${standardLabelOf(code)}: ${t('cab.quotationFlow.complexity.label')}`}
                required
                value={value.complexities[code] ?? ''}
                placeholder={t('cab.quotationFlow.complexity.placeholder')}
                options={options}
                onChange={(level) => onChange({ complexities: { ...value.complexities, [code]: level } })}
              />
            )}

            {(fromCodes || code === 'ISO_9001') && code !== 'ISO_50001' && (
              canOverride ? (
                editing[code] || overriding ? (
                  <div className="grid gap-3 rounded-md border border-warning-200 bg-warning-50/40 p-3 sm:grid-cols-[200px_minmax(0,1fr)]">
                    <SelectField
                      id={`override-${code}`}
                      label={t('auditCalc.override.category', 'New category')}
                      required
                      value={override?.category ?? ''}
                      placeholder={t('cab.quotationFlow.complexity.placeholder')}
                      options={options}
                      onChange={(next) => setOverride({ category: next })}
                    />
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`override-reason-${code}`} className="text-body-sm font-medium">{t('auditCalc.override.justification', 'Justification (required)')}</label>
                      <Textarea id={`override-reason-${code}`} rows={2} maxLength={1000} value={override?.justification ?? ''}
                        onChange={(event) => setOverride({ justification: event.target.value })} />
                      {override?.category && (override.justification ?? '').trim().length < JUSTIFICATION_MIN && (
                        <p role="alert" className="text-caption text-error-700">{t('auditCalc.override.tooShort', { count: JUSTIFICATION_MIN, defaultValue: 'Write at least {{count}} characters.' })}</p>
                      )}
                      {lowered && <p className="text-caption text-warning-800">{t('auditCalc.override.lowered', 'Lowering the category is recorded with your name, the date and the justification (IAF MD 5 Annex B and Annex C).')}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <Button type="button" variant="outline" size="sm" onClick={clearOverride}>{t('auditCalc.override.reset', 'Use the suggested category')}</Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditing({ ...editing, [code]: true })}>{t('auditCalc.override.change', 'Change classification')}</Button>
                  </div>
                )
              ) : (
                <p className={hint}>{t('auditCalc.override.notAllowed', 'Only the CAB administrator, the general manager, the technical manager or the certification manager can change the classification.')}</p>
              )
            )}

            {code === 'ISO_14001' && category === 'SPECIAL' && (
              <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
                <TextField id="special-days" label={t('auditCalc.special.days', 'Individual audit time (days)')} type="number" min="0.5" max="365" step="0.5" required
                  value={special.days} onChange={(event) => onChange({ specialCases: { ...value.specialCases, [code]: { ...special, days: event.target.value } } })} />
                <div className="flex flex-col gap-1">
                  <label htmlFor="special-reason" className="text-body-sm font-medium">{t('auditCalc.special.justification', 'How the time was developed (required)')}</label>
                  <Textarea id="special-reason" rows={2} maxLength={1000} value={special.justification}
                    onChange={(event) => onChange({ specialCases: { ...value.specialCases, [code]: { ...special, justification: event.target.value } } })} />
                </div>
              </div>
            )}
          </article>
        )
      })}
    </section>
  )
}
