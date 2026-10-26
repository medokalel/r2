import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { FormLabel, MultiSelect, SelectField, TextField } from '@/components/ui'
import { Toggle } from '@/components/ui/Toggle'
import type { MultiSiteEligibility, MultiSiteSummary, MultiSiteUnit } from '@/lib/auditTime/calculator'
import { MD1_ELIGIBILITY_CRITERIA, type EligibilityInputKey } from '@/lib/auditTime/rules'
import { getIafCodeOptions } from '@/lib/iafCodes'
import { isValidPercent, isValidSiteRow, standardLabelOf, type CalculationFormState, type SiteRow } from '@/lib/quotationForm'
import { cn } from '@/lib/utils'
import { criterionText, siteGroupText, siteReasonText } from '@/lib/auditTime/labels'

interface Props {
  standards: string[]
  value: CalculationFormState
  onChange: (patch: Partial<CalculationFormState>) => void
  /** Result of the last calculation (per-site groups and visits). */
  summary: MultiSiteSummary | null
  eligibility: MultiSiteEligibility | null
}

const hint = 'text-caption text-text-secondary'
const VISITS = [
  ['INITIAL', 'auditCalc.sites.visit.INITIAL', 'Initial'],
  ['SURVEILLANCE_1', 'auditCalc.sites.visit.SURVEILLANCE_1', 'S1'],
  ['SURVEILLANCE_2', 'auditCalc.sites.visit.SURVEILLANCE_2', 'S2'],
  ['RECERTIFICATION', 'auditCalc.sites.visit.RECERTIFICATION', 'Recert.'],
] as const

const newRow = (index: number): SiteRow => ({
  key: `new-${Date.now()}-${index}`, id: null, name: '', location: '', activities: '', employees: '', temporaryEmployees: '', shifts: '',
  iafCodes: [], standards: [], isCentral: false, siteType: 'PERMANENT', sameProcesses: true, isNew: true, auditIndividually: false, individualReason: '',
})

/**
 * Multi-site register and IAF MD 1:2023 evaluation: eligibility per criterion, the sites of the
 * certification scope (activities, IAF codes, personnel, location, standards, central function,
 * permanent or temporary, same processes, new site), and, from the last calculation, whether each
 * site is sampled or audited individually and which audits visit it.
 */
export function MultiSiteRegister({ standards, value, onChange, summary, eligibility }: Props) {
  const { t, i18n } = useTranslation()
  const rows = value.sites ?? []
  const setRows = (next: SiteRow[]) => onChange({ sites: next })
  const updateRow = (key: string, patch: Partial<SiteRow>) =>
    setRows(rows.map((row) => (row.key === key ? { ...row, ...patch } : patch.isCentral ? { ...row, isCentral: false } : row)))
  const unitOf = (row: SiteRow, index: number): MultiSiteUnit | undefined =>
    summary?.units.find((unit) => (row.id && unit.id === row.id) || unit.name === row.name.trim()) ?? summary?.units[index]
  const answer = (key: EligibilityInputKey) => value.eligibility[key]
  const setAnswer = (key: EligibilityInputKey, next: string) =>
    onChange({ eligibility: { ...value.eligibility, [key]: next === 'yes' ? true : next === 'no' ? false : null } })
  const statusOf = (key: string) => eligibility?.criteria.find((c) => c.key === key)?.status
  const iafOptions = getIafCodeOptions(i18n.language).map((o) => ({ value: o.value.replace('IAF_', ''), label: o.label }))
  const percentError = (text: string) => (isValidPercent(text) ? undefined : t('cab.auditTime.percentRange', { min: 0, max: 100, defaultValue: 'Enter {{min}} to {{max}} %' }))

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3" aria-labelledby="md1-eligibility">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 id="md1-eligibility" className="text-body-sm font-semibold text-neutral-900">{t('auditCalc.eligibility.title', 'Sampling eligibility (IAF MD 1)')}</h4>
          {eligibility && (
            <span className={cn('rounded px-2 py-0.5 text-caption font-semibold', eligibility.samplingApplied ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-800')}>
              {eligibility.samplingApplied
                ? t('auditCalc.eligibility.eligible', 'Sampling applies')
                : eligibility.eligible ? t('auditCalc.eligibility.off', 'Sampling switched off') : t('auditCalc.eligibility.notEligible', 'Sampling not allowed: sites audited individually')}
            </span>
          )}
        </div>
        <p className={hint}>{t('auditCalc.eligibility.hint', 'Confirm each criterion. Sampling applies only when all are met; otherwise every site is audited individually (IAF MD 1 §6.2).')}</p>
        <ul className="flex flex-col divide-y divide-neutral-100 rounded-md border border-neutral-100">
          {MD1_ELIGIBILITY_CRITERIA.map((criterion) => {
            const status = statusOf(criterion.key)
            return (
              <li key={criterion.key} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="min-w-0 text-body-sm">
                  {criterionText(t, criterion.key)} <bdi className="whitespace-nowrap text-caption text-text-secondary" dir="ltr">(IAF MD 1 {criterion.clause})</bdi>
                  {status && status !== 'MET' && status !== 'DECLARED' && (
                    <span className="ms-2 text-caption font-semibold text-warning-800">{t(`auditCalc.eligibility.status.${status}`, status === 'NOT_MET' ? 'Not met' : 'Not confirmed')}</span>
                  )}
                </span>
                {criterion.input ? (
                  <div className="flex shrink-0 gap-1" role="radiogroup" aria-label={criterionText(t, criterion.key)}>
                    {(['yes', 'no', 'unknown'] as const).map((option) => {
                      const current = answer(criterion.input!)
                      const selected = option === 'yes' ? current === true : option === 'no' ? current === false : current == null
                      return (
                        <button key={option} type="button" role="radio" aria-checked={selected} onClick={() => setAnswer(criterion.input!, option)}
                          className={cn('rounded-md border px-2.5 py-1 text-caption font-semibold', selected ? 'border-primary bg-primary text-white' : 'border-neutral-100 text-neutral-700 hover:border-primary')}>
                          {t(`auditCalc.eligibility.answer.${option}`, { yes: 'Yes', no: 'No', unknown: 'Not confirmed' }[option])}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <span className={cn('text-caption font-semibold', rows.some((r) => r.isCentral) ? 'text-success-700' : 'text-warning-800')}>
                    {rows.some((r) => r.isCentral) ? t('auditCalc.eligibility.status.MET', 'Met') : t('auditCalc.eligibility.markCentral', 'Mark the central function below')}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-3 rounded-md bg-primary-25 px-3 py-2">
          <span className="text-body-sm">{t('auditCalc.options.sampling', 'Use sampling when eligible')}</span>
          <Toggle checked={value.sampling} onChange={(sampling) => onChange({ sampling })} aria-label={t('auditCalc.options.sampling', 'Use sampling when eligible')} size="sm" />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-md bg-primary-25 px-3 py-2">
          <span className="text-body-sm">{t('auditCalc.options.systemEffective', 'System proved effective over the cycle (recertification sample 0.8√x)')}</span>
          <Toggle checked={value.systemEffective} onChange={(systemEffective) => onChange({ systemEffective })} aria-label={t('auditCalc.options.systemEffective', 'System proved effective over the cycle (recertification sample 0.8√x)')} size="sm" />
        </div>
        <TextField id="quotation-site-reduction" label={t('auditCalc.options.siteReduction', 'Reduction per sampled site (%, max 50)')} type="number" min="0" max="100" step="5" placeholder="0"
          value={value.siteReduction} error={percentError(value.siteReduction)} onChange={(event) => onChange({ siteReduction: event.target.value })} />
        <TextField id="quotation-central-reduction" label={t('cab.auditTime.centralReductionLabel', 'Central-function reduction (%, max 20)')} type="number" min="0" max="100" step="5" placeholder="0"
          value={value.centralReduction} error={percentError(value.centralReduction)} onChange={(event) => onChange({ centralReduction: event.target.value })} />
        <TextField id="quotation-sample-increase" label={t('auditCalc.options.increase', 'Extra sampled sites for risk (IAF MD 1 §6.1.3.5)')} type="number" min="0" max="100" step="1" placeholder="0"
          value={value.additionalSampleSites} onChange={(event) => onChange({ additionalSampleSites: event.target.value })} />
        <TextField id="quotation-sample-increase-reason" label={t('auditCalc.options.increaseReason', 'Reason for the extra sites')} maxLength={500}
          required={Number(value.additionalSampleSites) > 0} value={value.additionalSampleReason}
          error={Number(value.additionalSampleSites) > 0 && value.additionalSampleReason.trim().length < 3 ? t('auditCalc.options.increaseReasonRequired', 'Give the reason (3 characters or more).') : undefined}
          onChange={(event) => onChange({ additionalSampleReason: event.target.value })} />
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="sites-register">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 id="sites-register" className="text-body-sm font-semibold text-neutral-900">{t('auditCalc.sites.title', 'Sites in the certification scope')}</h4>
          <span className={hint}>{t('auditCalc.sites.count', { count: rows.length, defaultValue: '{{count}} sites' })}</span>
        </div>
        <p className={hint}>{t('auditCalc.sites.hint', 'Each site is timed from its own effective personnel. Days are recalculated whenever a site is added, removed or changed.')}</p>
        {rows.map((row, index) => {
          const unit = unitOf(row, index)
          const invalid = !isValidSiteRow(row)
          return (
            <article key={row.key} className={cn('flex flex-col gap-3 rounded-lg border p-4', invalid ? 'border-error-200' : 'border-neutral-100')} data-site={row.name}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-body-sm text-neutral-900">{row.name.trim() || t('auditCalc.sites.unnamed', { number: index + 1, defaultValue: 'Site {{number}}' })}</strong>
                  {unit?.group && (
                    <span className={cn('rounded px-2 py-0.5 text-caption font-semibold', unit.group === 'INDIVIDUAL' ? 'bg-warning-50 text-warning-800' : unit.group === 'CENTRAL' ? 'bg-primary-50 text-primary' : 'bg-success-50 text-success-700')}>
                      {siteGroupText(t, unit.group)}
                    </span>
                  )}
                  {unit?.category && <span className="rounded bg-neutral-50 px-2 py-0.5 text-caption text-text-secondary">{t(`auditCalc.category.${unit.category}`, unit.category)}</span>}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setRows(rows.filter((r) => r.key !== row.key))}>{t('cab.quotationEditor.remove')}</Button>
              </div>
              <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <TextField id={`site-name-${row.key}`} label={t('auditCalc.sites.name', 'Site name')} required maxLength={200} value={row.name} onChange={(e) => updateRow(row.key, { name: e.target.value })} />
                <TextField id={`site-location-${row.key}`} label={t('auditCalc.sites.location', 'Location')} maxLength={300} value={row.location} onChange={(e) => updateRow(row.key, { location: e.target.value })} />
                <TextField id={`site-employees-${row.key}`} label={t('auditCalc.sites.employees', 'Effective personnel')} type="number" min="1" step="1" required value={row.employees} onChange={(e) => updateRow(row.key, { employees: e.target.value })} />
                <div className="grid grid-cols-2 items-start gap-3">
                  <TextField id={`site-temp-${row.key}`} label={t('auditCalc.sites.temporary', 'Temporary')} type="number" min="0" step="1" value={row.temporaryEmployees} onChange={(e) => updateRow(row.key, { temporaryEmployees: e.target.value })} />
                  <TextField id={`site-shifts-${row.key}`} label={t('auditCalc.sites.shifts', 'Shifts')} type="number" min="0" max="10" step="1" value={row.shifts} onChange={(e) => updateRow(row.key, { shifts: e.target.value })} />
                </div>
                <TextField id={`site-activities-${row.key}`} label={t('auditCalc.sites.activities', 'Activities')} maxLength={2000} value={row.activities} onChange={(e) => updateRow(row.key, { activities: e.target.value })} />
                <div className="flex flex-col gap-1.5">
                  <FormLabel>{t('auditCalc.sites.iafCodes', 'IAF codes')}</FormLabel>
                  <MultiSelect tags={row.iafCodes} options={iafOptions} searchable searchPlaceholder={t('common.search')} onChange={(iafCodes) => updateRow(row.key, { iafCodes })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <FormLabel>{t('auditCalc.sites.standards', 'Standards at the site (empty = all)')}</FormLabel>
                  <MultiSelect tags={row.standards} options={standards.map((code) => ({ value: code, label: standardLabelOf(code) }))} onChange={(next) => updateRow(row.key, { standards: next })} />
                </div>
                <SelectField id={`site-type-${row.key}`} label={t('auditCalc.sites.type', 'Site type')} value={row.siteType}
                  options={[{ value: 'PERMANENT', label: t('auditCalc.sites.permanent', 'Permanent') }, { value: 'TEMPORARY', label: t('auditCalc.sites.temporarySite', 'Temporary') }]}
                  onChange={(siteType) => updateRow(row.key, { siteType: siteType as SiteRow['siteType'], ...(siteType === 'TEMPORARY' ? { isCentral: false } : {}) })} />
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {([
                  ['isCentral', t('auditCalc.sites.central', 'Central function')],
                  ['sameProcesses', t('auditCalc.sites.sameProcesses', 'Same processes as the other sites')],
                  ['isNew', t('auditCalc.sites.isNew', 'New site')],
                  ['auditIndividually', t('auditCalc.sites.individual', 'Audit this site individually')],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-body-sm">
                    <Toggle checked={row[key]} size="sm" aria-label={label} disabled={key === 'isCentral' && row.siteType === 'TEMPORARY'}
                      onChange={(checked) => updateRow(row.key, { [key]: checked } as Partial<SiteRow>)} />
                    {label}
                  </label>
                ))}
              </div>
              {row.auditIndividually && (
                <TextField id={`site-reason-${row.key}`} label={t('auditCalc.sites.individualReason', 'Why this site is audited individually')} required maxLength={500}
                  value={row.individualReason} onChange={(e) => updateRow(row.key, { individualReason: e.target.value })} />
              )}
              {invalid && <p role="alert" className="text-caption text-error-700">{t('auditCalc.sites.invalid', 'Each site needs a name and a whole number of personnel of at least 1; an individual audit needs a reason.')}</p>}
              {unit && (
                <div className="flex flex-col gap-1 rounded-md bg-neutral-50 px-3 py-2 text-caption">
                  {unit.reasons?.length ? <span>{unit.reasons.map((reason) => siteReasonText(t, reason)).join(' · ')}</span> : null}
                  <span className="flex flex-wrap gap-x-4 gap-y-1">
                    <span>{t('auditCalc.sites.tableDays', { days: unit.tableDays, defaultValue: 'Table time {{days}} days' })}</span>
                    {unit.reductionPercent > 0 && <span>{t('auditCalc.sites.reduction', { percent: unit.reductionPercent, defaultValue: 'Reduction {{percent}} %' })}</span>}
                    {VISITS.map(([kind, key, fallback]) => (
                      <span key={kind} className={unit.visited[kind] ? 'font-semibold text-primary' : 'text-text-secondary'}>
                        {t(key, fallback)} {unit.visited[kind] ? '✓' : '·'}
                      </span>
                    ))}
                    {unit.mandatory?.length && unit.group !== 'CENTRAL' ? <span className="font-semibold text-warning-800">{t('auditCalc.sites.mandatory', 'Mandatory in the first audit (new site)')}</span> : null}
                  </span>
                </div>
              )}
            </article>
          )
        })}
        <div>
          <Button type="button" variant="outline" onClick={() => setRows([...rows, newRow(rows.length)])}>+ {t('auditCalc.sites.add', 'Add site')}</Button>
        </div>
      </section>
    </div>
  )
}
