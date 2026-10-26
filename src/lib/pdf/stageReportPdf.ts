/**
 * Stage report PDF (ISO/IEC 17021-1 9.4.8), CAB branded and bilingual: every label is printed in
 * English and Arabic; the narrative is printed as the auditor wrote it. The layout follows the
 * UI language (right to left in Arabic).
 */
import i18n from '@/i18n'
import type { StageReport, StageReportFinding } from '@/lib/api/stageReportApi'
import { BrandedDocument, loadCabBranding } from '@/lib/pdf/brandedDocument'

export async function downloadStageReportPdf(report: StageReport, language: string, mode: 'save' | 'print' = 'save'): Promise<void> {
  const en = i18n.getFixedT('en')
  const ar = i18n.getFixedT('ar')
  const both = (key: string, options?: Record<string, unknown>) => `${en(key, options)} / ${ar(key, options)}`
  const branding = await loadCabBranding(report.header.cab.name || 'CAB')
  const typeLabel = both(`execution.report.types.${report.reportType}`)
  const doc = new BrandedDocument(branding, {
    title: `${en('execution.report.pdfTitle')} ${report.auditNumber}`,
    rtl: language.startsWith('ar'),
    footerNote: `${report.auditNumber} · v${report.version}`,
  })
  doc.header(both('execution.report.pdfTitle'), `${report.auditNumber} · v${report.version}`, typeLabel)

  const h = report.header
  doc.section(both('execution.report.identification'))
  doc.fields([
    [both('execution.report.fields.cab'), [h.cab.legalName || h.cab.name, h.cab.accreditation].filter(Boolean).join(' · ')],
    [both('execution.report.fields.client'), [h.client.name, h.client.address].filter(Boolean).join(' · ')],
    [both('execution.report.fields.representative'), h.client.representative],
    [both('execution.report.fields.auditType'), `${h.auditType} · ${typeLabel}`],
    [both('execution.report.fields.standard'), h.standard],
    [both('execution.report.fields.scope'), h.scope],
    [both('execution.report.fields.sites'), h.sites],
    [both('execution.report.fields.dates'), `${h.startDate} · ${h.endDate}`],
    [both('execution.report.fields.team'), h.team.map((m) => `${m.name} (${m.role})`).join(', ')],
    [both('execution.report.fields.remote'), h.remote.enabled ? `${h.remote.platform} · ${h.remote.sharePercent}%` : '·'],
    [both('execution.report.fields.days'), `${h.actualDays} / ${h.plannedDays}`],
  ])

  for (const section of report.sections) {
    const text = report.narrative[section]?.trim()
    if (!text) continue
    doc.section(both(`execution.report.sections.${section}`))
    doc.paragraph(text)
  }

  doc.section(both('execution.report.coverage'))
  doc.table(
    [
      { header: both('execution.report.columns.checklist'), width: 4 },
      { header: both('execution.report.columns.audited'), width: 1.6, align: 'end' },
      { header: both('execution.report.columns.nonconforming'), width: 1.6, align: 'end' },
    ],
    report.auto.checklists.perChecklist.map((c) => [c.name, `${c.answered}/${c.total}`, String(c.nonconforming)]),
  )

  const findingRows = (rows: StageReportFinding[]) => rows.map((f) => [f.nonconformityCode ?? f.code, f.requirementRef, f.statement, f.dueDate || '·'])
  const findingColumns = [
    { header: both('execution.report.columns.reference'), width: 1.3 },
    { header: both('execution.report.columns.requirement'), width: 2 },
    { header: both('execution.report.columns.statement'), width: 4 },
    { header: both('execution.report.columns.due'), width: 1.4 },
  ]
  const groups: Array<[string, StageReportFinding[]]> = [
    ['execution.report.findings.majors', report.auto.findings.majors],
    ['execution.report.findings.minors', report.auto.findings.minors],
    ['execution.report.findings.observations', report.auto.findings.observations],
    ['execution.report.findings.opportunities', report.auto.findings.opportunities],
  ]
  doc.section(both('execution.report.findingsTitle'))
  for (const [key, rows] of groups) {
    if (!rows.length) continue
    doc.paragraph(`${both(key)} (${rows.length})`)
    doc.table(findingColumns, findingRows(rows))
  }
  if (groups.every(([, rows]) => !rows.length)) doc.paragraph(both('execution.report.noFindings'))

  doc.section(both('execution.report.recommendationTitle'))
  if (report.recommendationOutcome) doc.paragraph(both(`execution.report.outcomes.${report.recommendationOutcome}`))
  if (report.recommendation) doc.paragraph(report.recommendation)

  doc.section(both('execution.report.approvalTitle'))
  doc.fields([
    [both('execution.report.fields.leadAuditor'), h.leadAuditor],
    [both('execution.report.fields.reviewer'), report.review.reviewerName ?? '·'],
    [both('execution.report.fields.issued'), report.review.issuedAt ? report.review.issuedAt.slice(0, 10) : '·'],
    [both('execution.report.fields.acknowledged'), report.review.acknowledgedAt ? `${report.review.acknowledgedAt.slice(0, 10)} · ${report.review.acknowledgedBy ?? ''}` : '·'],
  ])

  const pageLabel = (page: number, count: number) => `${en('execution.report.page', { page, count })} / ${ar('execution.report.page', { page, count })}`
  const filename = `${report.auditNumber}-v${report.version}-${report.reportType}.pdf`
  if (mode === 'print') doc.print(filename, pageLabel)
  else doc.save(filename, pageLabel)
}
