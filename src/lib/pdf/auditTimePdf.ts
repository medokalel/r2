/**
 * Audit time breakdown PDF (CAB branding), printed from "How these days were calculated": the
 * three-year cycle, the classification per standard with its source and override, MD 1
 * eligibility, the sites (sampled or individually audited, visits per audit), every calculation
 * step with its IAF reference, the classification changes and the normative references.
 */

import type { TFunction } from 'i18next'
import type { AuditTimeBreakdown } from '@/lib/auditTime/calculator'
import type { QuotationClassificationOverride, QuotationEvent } from '@/lib/api/cabQuotationApi'
import { categoryLabel, codeCategoryText, criterionText, effectText, mappingConfirmedText, siteGroupText, siteReasonText } from '@/lib/auditTime/labels'
import { stepText } from '@/lib/auditTime/stepText'
import { BrandedDocument, loadCabBranding } from '@/lib/pdf/brandedDocument'

const label = (code: string) => code.replace('_', ' ')

export async function printAuditTimeBreakdown(
  breakdown: AuditTimeBreakdown,
  t: TFunction,
  language: string,
  extra: { events?: QuotationEvent[]; classificationOverrides?: QuotationClassificationOverride[]; reference?: string } = {},
): Promise<void> {
  const branding = await loadCabBranding()
  const reference = extra.reference ?? ''
  const doc = new BrandedDocument(branding, { title: t('auditCalc.pdf.title', 'Audit time calculation'), rtl: language.startsWith('ar'), footerNote: reference })
  doc.header(t('auditCalc.pdf.title', 'Audit time calculation'), reference, t(`cab.auditTime.cycle.${breakdown.cycleType}`, breakdown.cycleType))
  doc.fields([
    [t('cab.auditTime.personnel', 'Effective personnel'), String(breakdown.employees)],
    [t('cab.auditTime.stage1Share', 'Stage 1 share'), `${breakdown.stage1SharePercent} %`],
    [t('cab.auditTime.ims', 'Integrated system (IAF MD 11)'), breakdown.ims.applied ? `${breakdown.ims.integrationLevelPercent} % / −${breakdown.ims.reductionPercent} %` : t('cab.auditTime.imsNone', 'Not applied')],
    [t('cab.auditTime.remoteShare', 'Remote share (IAF MD 4)'), `${breakdown.remoteSharePercent} %`],
  ])

  const cycle = breakdown.totals.threeYearCycle
  if (cycle) {
    doc.section(t('auditCalc.cycle.title', 'Three-year certification cycle'))
    const at = (stages: AuditTimeBreakdown['standards'][number]['stages'], stage: string) => String(stages.find((s) => s.stage === stage)?.days ?? 0)
    const first = breakdown.cycleType === 'INITIAL' ? ['STAGE_1', 'STAGE_2'] : breakdown.cycleType === 'RECERTIFICATION' ? ['RECERTIFICATION'] : []
    const columns = [...first, 'SURVEILLANCE_1', 'SURVEILLANCE_2']
    doc.table(
      [
        { header: t('cab.auditTime.standard', 'Standard'), width: 2 },
        ...columns.map((stage) => ({ header: t(`cab.quotationFlow.event.${stage}`, stage), width: 1.3, align: 'end' as const })),
        { header: t('cab.quotationEditor.total', 'Total'), width: 1.2, align: 'end' as const },
      ],
      breakdown.standards.map((s) => [label(s.standardCode), ...columns.map((stage) => at(s.stages, stage)), String(s.totalDays)]),
    )
    if (breakdown.cycleType !== 'RECERTIFICATION') {
      doc.paragraph(t('auditCalc.cycle.nextRecertification', { days: cycle.recertification, defaultValue: 'Recertification of the next cycle (information): {{days}} days' }))
    }
  }

  const eligibility = breakdown.multiSite?.eligibility
  if (eligibility) {
    doc.section(t('auditCalc.eligibility.title', 'Sampling eligibility (IAF MD 1)'))
    doc.table(
      [
        { header: t('auditCalc.pdf.criterion', 'Criterion'), width: 5 },
        { header: t('auditCalc.pdf.clause', 'Clause'), width: 1.5 },
        { header: t('auditCalc.classification.status', 'Status'), width: 1.5 },
      ],
      eligibility.criteria.map((c) => [criterionText(t, c.key), c.clause, t(`auditCalc.eligibility.status.${c.status}`, c.status)]),
    )
  }

  // The owner's confirmation of the IAF code to MD 5 mapping, once for the document.
  if (breakdown.standards.some((s) => s.classification?.basis === 'IAF_CODE' && s.classification.codes.length > 0)) {
    doc.paragraph(mappingConfirmedText(t))
  }

  for (const standard of breakdown.standards) {
    doc.section(label(standard.standardCode))
    if (standard.classification) {
      const c = standard.classification
      doc.fields([
        [t('auditCalc.classification.category', 'Category'), `${categoryLabel(t, c.category)} (${t(`auditCalc.source.${c.source}`, c.source)})`],
        [t('auditCalc.pdf.suggested', 'Suggested'), categoryLabel(t, c.suggested)],
        [t('auditCalc.classification.code', 'IAF code'), c.codes.map((x) => `${x.code}: ${codeCategoryText(t, x.category)}`).join(', ') || '-'],
        [t('auditCalc.pdf.table', 'Table'), c.table ? `${c.table.document}, ${c.table.clause}` : '-'],
      ])
      if (c.override) doc.paragraph(`${t('auditCalc.source.OVERRIDE', 'Override')}: ${categoryLabel(t, c.override.from)} → ${categoryLabel(t, c.override.to)}. ${c.override.justification}`)
      doc.paragraph(effectText(t, standard.standardCode, c.category))
    }
    if (standard.multiSite) {
      doc.table(
        [
          { header: t('auditCalc.sites.name', 'Site name'), width: 2.4 },
          { header: t('auditCalc.sites.employees', 'Effective personnel'), width: 1.2, align: 'end' },
          { header: t('auditCalc.sites.groupColumn', 'Group'), width: 2.6 },
          { header: t('auditCalc.sites.visitedColumn', 'Visited (initial / S1 / S2 / recert.)'), width: 2 },
        ],
        standard.multiSite.units.map((u) => [
          u.name,
          String(u.employees),
          [siteGroupText(t, u.group), ...(u.group === 'CENTRAL' ? [] : (u.reasons ?? []).map((r) => siteReasonText(t, r)))].filter(Boolean).join(': '),
          (['INITIAL', 'SURVEILLANCE_1', 'SURVEILLANCE_2', 'RECERTIFICATION'] as const).map((k) => (u.visited[k] ?? u.visited.SURVEILLANCE ? 'x' : '-')).join(' / '),
        ]),
      )
    }
    doc.table(
      [
        { header: t('auditCalc.pdf.step', 'Step'), width: 6 },
        { header: t('auditCalc.pdf.reference', 'Reference'), width: 2.4 },
      ],
      [
        ...standard.steps.map((s) => [`${s.site ? `${s.site}: ` : ''}${stepText(s, t)}`, breakdown.references[s.reference] ? `${breakdown.references[s.reference].document} ${breakdown.references[s.reference].clause ?? ''}`.trim() : s.reference]),
        ...standard.stages.flatMap((stage) => {
          const event = extra.events?.find((e) => e.standardCode === standard.standardCode && e.auditEventType === stage.stage)
          const applied = event?.manualOverride && Number(event.auditDays) !== stage.days ? ` (${t('cab.auditTime.appliedDays', { days: Number(event.auditDays), defaultValue: 'applied {{days}}' })})` : ''
          return [[`${t(`cab.quotationFlow.event.${stage.stage}`, stage.stage)}: ${stage.days}${applied}`, ''], ...stage.steps.map((s) => [`  ${stepText(s, t)}`, breakdown.references[s.reference]?.document ?? s.reference])]
        }),
      ],
    )
  }

  if (extra.classificationOverrides?.length) {
    doc.section(t('auditCalc.override.log', 'Classification changes'))
    doc.table(
      [
        { header: t('cab.auditTime.standard', 'Standard'), width: 1.4 },
        { header: t('auditCalc.pdf.change', 'Change'), width: 1.6 },
        { header: t('auditCalc.pdf.by', 'By'), width: 1.8 },
        { header: t('auditCalc.pdf.date', 'Date'), width: 1.3 },
        { header: t('auditCalc.override.justification', 'Justification (required)'), width: 4 },
      ],
      extra.classificationOverrides.map((o) => [label(o.standardCode), `${categoryLabel(t, o.fromCategory)} → ${categoryLabel(t, o.toCategory)}`, o.changedByName ?? '-', o.createdAt.slice(0, 10), o.justification]),
    )
  }

  doc.section(t('cab.auditTime.references', 'Normative references'))
  doc.table(
    [
      { header: t('auditCalc.pdf.document', 'Document'), width: 2.6 },
      { header: t('auditCalc.pdf.topic', 'Topic'), width: 5 },
    ],
    Object.values(breakdown.references).map((r) => [`${r.document}${r.clause ? ` ${r.clause}` : ''}`, r.topic]),
  )
  doc.paragraph(t('cab.auditTime.frameworkNote', breakdown.frameworkNote))
  doc.print(`${reference || 'audit-time'}.pdf`, (page, count) => t('cab.offerDetail.page', { defaultValue: 'Page {{page}} of {{count}}', page, count }))
}
