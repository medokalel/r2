import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import type { AuditTimeBreakdown as Breakdown, AuditTimeStep } from '@/lib/auditTime/calculator'
import { stepText } from '@/lib/auditTime/stepText'
import type { QuotationClassificationOverride, QuotationEvent } from '@/lib/api/cabQuotationApi'
import { standardLabelOf } from '@/lib/quotationForm'
import { cn } from '@/lib/utils'
import { categoryLabel, codeCategoryText, criterionText, effectText, siteGroupText, siteReasonText } from '@/lib/auditTime/labels'
import { Button } from '@/components/ui/Button'
import { printAuditTimeBreakdown } from '@/lib/pdf/auditTimePdf'

function StepList({ steps, t }: { steps: AuditTimeStep[]; t: TFunction }) {
  return (
    <ol className="flex flex-col gap-1.5">
      {steps.map((step, index) => (
        <li key={`${step.code}-${index}`} className="flex gap-2 text-body-sm leading-5">
          <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
          <span className="min-w-0 break-words" style={{ unicodeBidi: 'plaintext' }}>
            {step.site && <strong className="font-semibold">{step.site}: </strong>}
            {stepText(step, t)}
          </span>
        </li>
      ))}
    </ol>
  )
}

interface Props {
  breakdown: Breakdown
  /** Quotation events: shows the applied days next to the calculated ones (manual overrides). */
  events?: QuotationEvent[]
  /** Open by default (preview). */
  defaultOpen?: boolean
  /** Classification overrides logged with a stored quotation (who, when, from, to, why). */
  classificationOverrides?: QuotationClassificationOverride[]
  /** Reference printed on the PDF (quotation number or application number). */
  reference?: string
  className?: string
}

/** Expandable "How these days were calculated" — per standard and stage, with caps and references. */
export function AuditTimeBreakdown({ breakdown, events, defaultOpen = false, className, classificationOverrides, reference }: Props) {
  const { t, i18n } = useTranslation()
  const cycle = breakdown.totals.threeYearCycle
  const eligibility = breakdown.multiSite?.eligibility
  const days = t('cab.quotationFlow.programme.days')
  const applied = (code: string, stage: string) =>
    events?.find((e) => (e.standardCode === code || e.standardCode.replace(/[^0-9]/g, '') === code.replace(/[^0-9]/g, '')) && e.auditEventType === stage)

  return (
    <details open={defaultOpen} className={cn('group rounded-lg border border-neutral-100 bg-white', className)}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-body-sm font-semibold text-primary">
        <span>{t('cab.auditTime.howCalculated', 'How these days were calculated')}</span>
        <span aria-hidden className="text-caption text-text-secondary transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="flex flex-col gap-4 border-t border-neutral-100 p-4">
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={() => void printAuditTimeBreakdown(breakdown, t, i18n.language, { events, classificationOverrides, reference })}>
            {t('auditCalc.print', 'Print or save as PDF')}
          </Button>
        </div>
        {cycle && (
          <section aria-label={t('auditCalc.cycle.title', 'Three-year certification cycle')}>
            <h5 className="mb-1.5 text-caption font-semibold uppercase tracking-wide text-text-secondary">{t('auditCalc.cycle.title', 'Three-year certification cycle')}</h5>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-body-sm">
                <thead className="bg-primary-25 text-text-secondary">
                  <tr>
                    <th className="px-3 py-2 text-start font-medium">{t('cab.auditTime.standard', 'Standard')}</th>
                    {breakdown.cycleType === 'INITIAL' && <><th className="px-3 py-2 text-end font-medium">{t('cab.quotationFlow.event.STAGE_1')}</th><th className="px-3 py-2 text-end font-medium">{t('cab.quotationFlow.event.STAGE_2')}</th></>}
                    {breakdown.cycleType === 'RECERTIFICATION' && <th className="px-3 py-2 text-end font-medium">{t('cab.quotationFlow.event.RECERTIFICATION')}</th>}
                    <th className="px-3 py-2 text-end font-medium">{t('cab.quotationFlow.event.SURVEILLANCE_1')}</th>
                    <th className="px-3 py-2 text-end font-medium">{t('cab.quotationFlow.event.SURVEILLANCE_2')}</th>
                    <th className="px-3 py-2 text-end font-medium">{t('cab.quotationEditor.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.standards.map((standard) => {
                    const at = (stage: string) => standard.stages.find((s) => s.stage === stage)?.days ?? 0
                    return (
                      <tr key={standard.standardCode} className="border-t border-neutral-100">
                        <td className="px-3 py-2 font-semibold" dir="ltr">{standardLabelOf(standard.standardCode)}</td>
                        {breakdown.cycleType === 'INITIAL' && <><td className="px-3 py-2 text-end tabular-nums">{at('STAGE_1')}</td><td className="px-3 py-2 text-end tabular-nums">{at('STAGE_2')}</td></>}
                        {breakdown.cycleType === 'RECERTIFICATION' && <td className="px-3 py-2 text-end tabular-nums">{at('RECERTIFICATION')}</td>}
                        <td className="px-3 py-2 text-end tabular-nums">{at('SURVEILLANCE_1')}</td>
                        <td className="px-3 py-2 text-end tabular-nums">{at('SURVEILLANCE_2')}</td>
                        <td className="px-3 py-2 text-end font-semibold tabular-nums">{standard.totalDays}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-neutral-100 bg-neutral-50 font-bold">
                    <td className="px-3 py-2">{t('cab.quotationEditor.total')}</td>
                    {breakdown.cycleType === 'INITIAL' && <><td className="px-3 py-2 text-end tabular-nums">{cycle.stage1}</td><td className="px-3 py-2 text-end tabular-nums">{cycle.stage2}</td></>}
                    {breakdown.cycleType === 'RECERTIFICATION' && <td className="px-3 py-2 text-end tabular-nums">{cycle.recertification}</td>}
                    <td className="px-3 py-2 text-end tabular-nums">{cycle.surveillance1}</td>
                    <td className="px-3 py-2 text-end tabular-nums">{cycle.surveillance2}</td>
                    <td className="px-3 py-2 text-end tabular-nums">{cycle.total}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {breakdown.cycleType !== 'RECERTIFICATION' && (
              <p className="mt-1 text-caption text-text-secondary">{t('auditCalc.cycle.nextRecertification', { days: cycle.recertification, defaultValue: 'Recertification of the next cycle (information): {{days}} days' })}</p>
            )}
          </section>
        )}
        {classificationOverrides && classificationOverrides.length > 0 && (
          <section>
            <h5 className="mb-1.5 text-caption font-semibold uppercase tracking-wide text-text-secondary">{t('auditCalc.override.log', 'Classification changes')}</h5>
            <ul className="flex flex-col gap-1 text-caption">
              {classificationOverrides.map((o) => (
                <li key={o.id} style={{ unicodeBidi: 'plaintext' }}>
                  <strong dir="ltr">{standardLabelOf(o.standardCode)}</strong>
                  {': '}
                  {t('auditCalc.override.logLine', {
                    from: categoryLabel(t, o.fromCategory), to: categoryLabel(t, o.toCategory), by: o.changedByName ?? t('auditCalc.override.someone', 'an authorised user'),
                    date: o.createdAt.slice(0, 10), reason: o.justification,
                    defaultValue: '{{from}} to {{to}}, by {{by}} on {{date}}: {{reason}}',
                  })}
                </li>
              ))}
            </ul>
          </section>
        )}
        {eligibility && (
          <section>
            <h5 className="mb-1.5 text-caption font-semibold uppercase tracking-wide text-text-secondary">{t('auditCalc.eligibility.title', 'Sampling eligibility (IAF MD 1)')}</h5>
            <ul className="grid grid-cols-1 gap-1 text-caption md:grid-cols-2">
              {eligibility.criteria.map((criterion) => (
                <li key={criterion.key} className="flex gap-2">
                  <span aria-hidden className={criterion.status === 'MET' || criterion.status === 'DECLARED' ? 'text-success-700' : 'text-warning-800'}>{criterion.status === 'MET' || criterion.status === 'DECLARED' ? '\u2713' : '!'}</span>
                  <span>{criterionText(t, criterion.key)} <span className="text-text-secondary" dir="ltr">({criterion.clause})</span>: {t(`auditCalc.eligibility.status.${criterion.status}`, criterion.status)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-body-sm sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex justify-between gap-2 sm:block">
            <dt className="text-text-secondary">{t('cab.auditTime.cycleType', 'Certification cycle')}</dt>
            <dd className="font-semibold">{t(`cab.auditTime.cycle.${breakdown.cycleType}`, { defaultValue: { INITIAL: 'Initial certification', RECERTIFICATION: 'Recertification', TRANSFER: 'Transfer (IAF MD 2)' }[breakdown.cycleType] })}</dd>
          </div>
          <div className="flex justify-between gap-2 sm:block">
            <dt className="text-text-secondary">{t('cab.auditTime.personnel', 'Effective personnel')}</dt>
            <dd className="font-semibold tabular-nums">{breakdown.employees}</dd>
          </div>
          <div className="flex justify-between gap-2 sm:block">
            <dt className="text-text-secondary">{t('cab.auditTime.ims', 'Integrated system (IAF MD 11)')}</dt>
            <dd className="font-semibold">
              {breakdown.ims.applied
                ? t('cab.auditTime.imsApplied', { level: breakdown.ims.integrationLevelPercent, reduction: breakdown.ims.reductionPercent, defaultValue: 'Integration {{level}} % → −{{reduction}} %' })
                : t('cab.auditTime.imsNone', 'Not applied')}
            </dd>
          </div>
          {breakdown.multiSite && (
            <div className="flex justify-between gap-2 sm:block">
              <dt className="text-text-secondary">{t('cab.auditTime.multiSite', 'Multi-site (IAF MD 1)')}</dt>
              <dd className="font-semibold">
                {t('cab.auditTime.multiSiteSummary', {
                  sites: breakdown.multiSite.sites,
                  defaultValue: '{{sites}} sites',
                })}
                {breakdown.multiSite.sampling ? ` · ${t('cab.auditTime.sampling', 'sampling')}` : ''}
              </dd>
            </div>
          )}
          {breakdown.remoteSharePercent > 0 && (
            <div className="flex justify-between gap-2 sm:block">
              <dt className="text-text-secondary">{t('cab.auditTime.remoteShare', 'Remote share (IAF MD 4)')}</dt>
              <dd className="font-semibold tabular-nums">{breakdown.remoteSharePercent} %</dd>
            </div>
          )}
          <div className="flex justify-between gap-2 sm:block">
            <dt className="text-text-secondary">{t('cab.auditTime.stage1Share', 'Stage 1 share')}</dt>
            <dd className="font-semibold tabular-nums">{breakdown.stage1SharePercent} %</dd>
          </div>
        </dl>

        {breakdown.standards.map((standard) => (
          <article key={standard.standardCode} className="overflow-hidden rounded-md border border-primary-100" data-standard={standard.standardCode}>
            <header className="flex flex-wrap items-center justify-between gap-2 bg-primary-25 px-4 py-2.5">
              <h4 className="text-body-sm font-bold text-primary" dir="ltr">
                {standardLabelOf(standard.standardCode)}
                {standard.complexity && <span className="ms-2 rounded bg-white px-1.5 py-0.5 text-caption font-semibold text-primary">{t(`cab.quotationFlow.complexity.${standard.complexity}`)}</span>}
              </h4>
              <p className="text-body-sm">
                {t('cab.auditTime.standardTotal', { days: standard.totalDays, defaultValue: 'Cycle total {{days}} days' })}
              </p>
            </header>
            <div className="flex flex-col gap-3 p-4">
              {standard.classification && (
                <section className="rounded-md bg-primary-25 px-3 py-2 text-body-sm">
                  <h5 className="mb-1 text-caption font-semibold uppercase tracking-wide text-text-secondary">{t('auditCalc.classification.title', 'Business sector risk and complexity (IAF MD 5)')}</h5>
                  <p>
                    <strong>{categoryLabel(t, standard.classification.category)}</strong>
                    {' · '}
                    {t(`auditCalc.source.${standard.classification.source}`, standard.classification.source)}
                    {standard.classification.table && <span className="text-text-secondary" dir="ltr"> ({standard.classification.table.document}, {standard.classification.table.clause})</span>}
                  </p>
                  {standard.classification.codes.length > 0 && (
                    <p className="text-caption text-text-secondary" dir="ltr" style={{ unicodeBidi: 'plaintext' }}>
                      {standard.classification.codes.map((c) => `IAF ${c.code}: ${codeCategoryText(t, c.category)}`).join(' · ')}
                    </p>
                  )}
                  {standard.classification.override && (
                    <p className="mt-1 text-caption text-warning-800">
                      {t('auditCalc.override.recorded', {
                        from: categoryLabel(t, standard.classification.override.from), to: categoryLabel(t, standard.classification.override.to),
                        by: standard.classification.override.by?.name ?? t('auditCalc.override.someone', 'an authorised user'),
                        reason: standard.classification.override.justification,
                        defaultValue: 'Changed from {{from}} to {{to}} by {{by}}: {{reason}}',
                      })}
                    </p>
                  )}
                  <p className="mt-1 text-caption">{effectText(t, standard.standardCode, standard.classification.category)}</p>
                </section>
              )}
              <section>
                <h5 className="mb-1.5 text-caption font-semibold uppercase tracking-wide text-text-secondary">{t('cab.auditTime.initialTime', 'Initial audit time')}</h5>
                <StepList steps={standard.steps} t={t} />
                {standard.reductionCapApplied && (
                  <p className="mt-2 rounded-md bg-warning-50 px-3 py-2 text-caption text-warning-800">
                    {t('cab.auditTime.capApplied', { requested: -standard.requestedAdjustmentPercent, defaultValue: 'Requested reduction {{requested}} % capped at 30 % (IAF MD 5 §3.9).' })}
                  </p>
                )}
              </section>

              <section>
                <h5 className="mb-1.5 text-caption font-semibold uppercase tracking-wide text-text-secondary">{t('cab.auditTime.stages', 'Audit days per stage')}</h5>
                <ul className="flex flex-col divide-y divide-neutral-100 rounded-md border border-neutral-100">
                  {standard.stages.map((stage) => {
                    const event = applied(standard.standardCode, stage.stage)
                    const overridden = event?.manualOverride && Number(event.auditDays) !== stage.days
                    return (
                      <li key={stage.stage} className="flex flex-col gap-2 p-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-body-sm font-semibold text-neutral-900">{t(`cab.quotationFlow.event.${stage.stage}`)}</span>
                          <span className="text-body-sm tabular-nums">
                            <strong className={cn(overridden && 'text-text-secondary line-through')}>{stage.days}</strong> {days}
                            {overridden && (
                              <strong className="ms-2 text-warning-700">
                                {t('cab.auditTime.appliedDays', { days: Number(event.auditDays), defaultValue: 'applied {{days}}' })}
                              </strong>
                            )}
                          </span>
                        </div>
                        <StepList steps={stage.steps} t={t} />
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-text-secondary">
                          {stage.minimumApplied && <span>{t('cab.auditTime.minimumApplied', 'Minimum applied')}</span>}
                          {stage.sitesVisited != null && <span>{t('cab.auditTime.sitesVisited', { count: stage.sitesVisited, defaultValue: '{{count}} sites visited' })}</span>}
                          {overridden && event.overrideReason && (
                            <span className="text-warning-700">{t('cab.auditTime.overrideReason', { reason: event.overrideReason, defaultValue: 'Override: {{reason}}' })}</span>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
                {standard.nextCycleRecertificationDays != null && (
                  <p className="mt-2 text-caption text-text-secondary">
                    {t('cab.auditTime.nextRecertification', { days: standard.nextCycleRecertificationDays, defaultValue: 'Recertification (next cycle, not billed here): {{days}} days' })}
                  </p>
                )}
              </section>

              {standard.multiSite && (
                <section>
                  <h5 className="mb-1.5 text-caption font-semibold uppercase tracking-wide text-text-secondary">{t('cab.auditTime.sites', 'Sites')}</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[420px] text-start text-caption">
                      <thead className="text-text-secondary">
                        <tr>
                          <th className="py-1 pe-2 text-start font-medium">{t('cab.auditTime.site', 'Site')}</th>
                          <th className="py-1 pe-2 text-end font-medium">{t('cab.auditTime.personnelShort', 'Personnel')}</th>
                          <th className="py-1 pe-2 text-end font-medium">{t('cab.auditTime.tableDays', 'Table days')}</th>
                          <th className="py-1 pe-2 text-end font-medium">{t('cab.auditTime.reduction', 'Reduction')}</th>
                          <th className="py-1 pe-2 text-start font-medium">{t('auditCalc.sites.groupColumn', 'Group')}</th>
                          <th className="py-1 text-end font-medium">{t('auditCalc.sites.visitedColumn', 'Visited (initial / S1 / S2 / recert.)')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standard.multiSite.units.map((unit) => (
                          <tr key={unit.name} className="border-t border-neutral-100">
                            <td className="py-1 pe-2">{unit.name}{unit.isCentral && <span className="ms-1 text-primary">({t('cab.auditTime.central', 'central function')})</span>}</td>
                            <td className="py-1 pe-2 text-end tabular-nums">{unit.employees}</td>
                            <td className="py-1 pe-2 text-end tabular-nums">{unit.tableDays}</td>
                            <td className="py-1 pe-2 text-end tabular-nums">{unit.reductionPercent} %</td>
                            <td className="py-1 pe-2">{siteGroupText(t, unit.group)}{unit.reasons?.length && unit.group !== 'CENTRAL' ? <span className="block text-text-secondary">{unit.reasons.map((r) => siteReasonText(t, r)).join(' · ')}</span> : null}</td>
                            <td className="py-1 text-end">{(unit.visited.SURVEILLANCE_1 !== undefined ? (['INITIAL', 'SURVEILLANCE_1', 'SURVEILLANCE_2', 'RECERTIFICATION'] as const) : (['INITIAL', 'SURVEILLANCE', 'RECERTIFICATION'] as const)).map((k) => (unit.visited[k] ? '\u2713' : '\u00b7')).join(' / ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          </article>
        ))}

        {breakdown.warnings.length > 0 && (
          <ul className="flex flex-col gap-1 rounded-md bg-warning-50 px-3 py-2 text-caption text-warning-800">
            {breakdown.warnings.map((warning, index) => (
              <li key={`${warning.code}-${index}`}>{t([`auditCalc.warning.${warning.code}`, `cab.auditTime.warning.${warning.code}`], { standard: warning.standardCode ? standardLabelOf(warning.standardCode) : '', defaultValue: warning.message })}</li>
            ))}
          </ul>
        )}

        <section>
          <h5 className="mb-1.5 text-caption font-semibold uppercase tracking-wide text-text-secondary">{t('cab.auditTime.references', 'Normative references')}</h5>
          <ul className="grid grid-cols-1 gap-1 text-caption text-neutral-800 md:grid-cols-2">
            {Object.entries(breakdown.references).map(([key, ref]) => (
              <li key={key} className="min-w-0" style={{ unicodeBidi: 'plaintext' }}>
                <strong className="font-semibold" dir="ltr">{ref.document}{ref.clause ? ` ${ref.clause}` : ''}</strong>: {ref.topic}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-caption text-text-secondary">{t('cab.auditTime.frameworkNote', breakdown.frameworkNote)}</p>
        </section>
      </div>
    </details>
  )
}
