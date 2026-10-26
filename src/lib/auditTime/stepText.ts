/**
 * Translated text of one audit-time breakdown step (keys cab.auditTime.step.<code>), shared by the
 * breakdown view and its PDF.
 */
import type { TFunction } from 'i18next'
import { round2, type AuditTimeStep } from '@/lib/auditTime/calculator'
import { rangeText } from '@/lib/emptyValue'
import { categoryLabel } from '@/lib/auditTime/labels'

/** English templates of the breakdown steps (i18next interpolation); keys cab.auditTime.step.<key>. */
const STEP_TEMPLATES: Record<string, string> = {
  CLASSIFICATION: 'Category {{category}} (suggested {{suggested}} from IAF codes {{codes}})',
  CLASSIFICATION_OVERRIDE: 'Category {{category}}: override of the suggested {{suggested}}. Justification: {{justification}}',
  CLASSIFICATION_SELECTED: 'Category {{category}} chosen by the CAB',
  SPECIAL_CASE: 'Special category, individual time {{days}} days: {{justification}}',
  SAMPLE_INCREASE: 'Sample increased by {{sites}} site(s) for risk: {{reason}}',
  SITES_VISITED: 'Sites visited: {{names}}',
  MULTI_SITE_GROUPS: '{{sites}} sites; sampling x = {{sampledGroup}} sites, central function included (IAF MD 1 §6.1.3.3): {{sampleInitial}} initial / {{sampleSurveillance}} surveillance / {{sampleRecertification}} recertification sites; {{individualGroup}} audited individually ({{individualSurveillance}} per surveillance): {{days}} days',
  MULTI_SITE_INDIVIDUAL: '{{sites}} sites, no sampling: {{individualGroup}} sites audited individually ({{individualSurveillance}} per surveillance): {{days}} days',
  TABLE: 'Table time for {{employees}} personnel, band {{band}}: {{days}} days',
  TABLE_EXTRAPOLATED: '{{employees}} personnel is above the last table row ({{lastRowMax}}): {{lastRowDays}} + {{blocks}} × {{stepDays}} days per {{bandWidth}} further personnel = {{days}} days',
  FOOD_FORMULA: 'Ds = TD {{td}} + TH {{th}} × ({{studies}} − 1) + TFTE {{tfte}} ({{fteEmployees}} FTE, category {{category}}) = {{days}} days',
  MULTI_SITE: '{{sites}} sites; sampled besides the central function: {{sampleInitial}} initial / {{sampleSurveillance}} surveillance / {{sampleRecertification}} recertification: {{days}} days',
  MULTI_SITE_ALL: '{{sites}} sites, every site audited: {{days}} days',
  SITE_REDUCTION: 'Per-site reduction {{appliedPercent}} %',
  SITE_REDUCTION_CAPPED: 'Per-site reduction {{appliedPercent}} % (requested {{requestedPercent}} %, capped at {{capPercent}} %)',
  CENTRAL_REDUCTION: 'Central-function reduction {{appliedPercent}} %',
  CENTRAL_REDUCTION_CAPPED: 'Central-function reduction {{appliedPercent}} % (requested {{requestedPercent}} %, capped at {{capPercent}} %)',
  ADJUSTMENT: '{{sign}}{{percent}} %: {{reason}}',
  REDUCTION_CAP: 'Net reduction {{requestedPercent}} % exceeds the {{capPercent}} % cap; {{capPercent}} % applied',
  ADJUSTED: 'After factors ({{net}} %): {{days}} days',
  IMS_REDUCTION: 'Integrated system, integration level {{integrationLevelPercent}} % → −{{reductionPercent}} %: {{days}} days',
  ROUNDED_INITIAL: 'Initial audit {{rawDays}} days → {{days}} days',
  ROUNDED_INITIAL_MIN: 'Initial audit {{rawDays}} days (minimum {{minimumDays}} day) → {{days}} days',
  STAGE_SPLIT: 'Stage 1 = max({{minDays}}, {{sharePercent}} % × {{initialDays}}) = {{stage1Days}}; Stage 2 = {{initialDays}} − {{stage1Days}} = {{stage2Days}} days',
  RATIO: '{{ratioLabel}} × {{basisDays}} initial days = {{rawDays}} → {{days}} days',
  RATIO_MIN: '{{ratioLabel}} × {{basisDays}} initial days = {{rawDays}} → minimum {{minimumDays}} day → {{days}} days',
  CYCLE_TABLE: 'ISO 50003 Table A.4: {{tableDays}} days × {{factor}} = {{rawDays}} → {{days}} days',
  ON_SITE: 'On-site at least {{onSiteMinDays}} days ({{minOnSitePercent}} %); planning and reporting at most {{offSiteMaxDays}} days',
  REMOTE: 'Remote (ICT) share {{remoteSharePercent}} % recorded: {{remoteDays}} days',
}

const n = (value: unknown) => (typeof value === 'number' ? String(round2(value)) : String(value ?? ''))

/** Translated text of one breakdown step. */
export function stepText(step: AuditTimeStep, t: TFunction): string {
  const p = step.params
  let key: string = step.code
  if (step.code === 'MULTI_SITE' && p.sampledGroup !== undefined) key = p.sampling ? (p.individualGroup ? 'MULTI_SITE_GROUPS' : 'MULTI_SITE') : 'MULTI_SITE_INDIVIDUAL'
  else if (step.code === 'MULTI_SITE' && !p.sampling) key = 'MULTI_SITE_ALL'
  if (step.code === 'CLASSIFICATION' && p.source === 'OVERRIDE') key = 'CLASSIFICATION_OVERRIDE'
  if (step.code === 'CLASSIFICATION' && p.source === 'SELECTED') key = 'CLASSIFICATION_SELECTED'
  if ((step.code === 'SITE_REDUCTION' || step.code === 'CENTRAL_REDUCTION') && p.capped) key = `${step.code}_CAPPED`
  if ((step.code === 'ROUNDED_INITIAL' || step.code === 'RATIO') && p.minimumApplied) key = `${step.code}_MIN`
  const values: Record<string, string> = {}
  for (const [name, value] of Object.entries(p)) values[name] = n(value)
  values.band = rangeText(p.bandMin ?? '', p.bandMax ?? '')
  values.sign = p.direction === 'INCREASE' ? '+' : '−'
  values.net = `${Number(p.netPercent) >= 0 ? '+' : '−'}${n(Math.abs(Number(p.netPercent ?? 0)))}`
  if (step.code === 'CLASSIFICATION') {
    values.category = categoryLabel(t, p.category)
    values.suggested = categoryLabel(t, p.suggested)
  }
  // Breakdowns stored before the IAF MD 1:2023 groups keep the earlier multi-site wording.
  const legacy = step.code === 'MULTI_SITE' && p.sampledGroup === undefined
  return t(legacy ? [`cab.auditTime.step.${key}`] : [`auditCalc.step.${key}`, `cab.auditTime.step.${key}`], { ...values, defaultValue: STEP_TEMPLATES[key] ?? step.text, interpolation: { escapeValue: false } })
}
