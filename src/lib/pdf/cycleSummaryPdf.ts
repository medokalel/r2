/**
 * Certification cycle summary PDF (CAB branding) — printed from the manage-cycle page.
 */

import type { TFunction } from 'i18next'
import type { CertificationCycleDetail } from '@/lib/api/cabCertificationApi'
import { BrandedDocument, loadCabBranding } from '@/lib/pdf/brandedDocument'
import { notSet } from '@/lib/emptyValue'

export async function printCycleSummary(cycle: CertificationCycleDetail, t: TFunction, language: string): Promise<void> {
  const branding = await loadCabBranding()
  const doc = new BrandedDocument(branding, {
    title: `${t('cab.manageCycle.title', 'Manage certification cycle')} ${cycle.cycleId}`,
    rtl: language.startsWith('ar'),
    footerNote: cycle.cycleId,
  })
  doc.header(t('cab.manageCycle.pdf.title', 'Certification cycle summary'), `${cycle.cycleId} · ${cycle.certificate.certificateNumber}`)
  doc.fields([
    [t('cab.manageCycle.pdf.client', 'Client'), `${cycle.clientName} (${cycle.clientId})`],
    [t('cab.manageCycle.pdf.standard', 'Standard'), `${cycle.certificate.standard} · ${cycle.certificate.standardLabel}`],
    [t('cab.manageCycle.pdf.status', 'Status'), cycle.lifecycleStatusLabel],
    [t('cab.manageCycle.pdf.cycle', 'Cycle'), cycle.cycleRangeLabel],
    [t('cab.manageCycle.pdf.initial', 'Initial certification'), cycle.initialCertificationDate],
    [t('cab.manageCycle.pdf.expiry', 'Certificate expiry'), cycle.certificationExpiryDate],
  ])
  if (cycle.certificateScope) {
    doc.section(t('cab.manageCycle.scope.title', 'Certified scope'))
    doc.paragraph(cycle.certificateScope)
  }
  doc.section(t('cab.manageCycle.pdf.events', 'Cycle events'))
  doc.table(
    [
      { header: t('cab.manageCycle.pdf.event', 'Event'), width: 3 },
      { header: t('cab.manageCycle.pdf.date', 'Target date'), width: 2 },
      { header: t('cab.manageCycle.pdf.eventStatus', 'Status'), width: 2 },
    ],
    cycle.stages.map((s) => [s.label, s.date, t(`cab.manageCycle.pdf.stage.${s.status}`, s.status)]),
  )
  if (cycle.audits?.length) {
    doc.section(t('cab.manageCycle.audits.title', 'Audits'))
    doc.table(
      [
        { header: t('cab.manageCycle.audits.plan', 'Audit'), width: 2 },
        { header: t('cab.manageCycle.audits.date', 'Date'), width: 1.6 },
        { header: t('cab.manageCycle.audits.lead', 'Lead auditor'), width: 2.4 },
        { header: t('cab.manageCycle.audits.status', 'Status'), width: 1.6 },
        { header: t('cab.manageCycle.audits.findings', 'Findings'), width: 1, align: 'end' },
      ],
      cycle.audits.map((a) => [`${a.planNumber} · ${a.stage}`, a.startDate, a.leadAuditor || notSet(), a.status, String(a.findingsCount)]),
    )
  }
  if (cycle.requests?.length) {
    doc.section(t('cab.manageCycle.pdf.requests', 'Requests'))
    doc.table(
      [
        { header: t('cab.manageCycle.pdf.request', 'Request'), width: 4 },
        { header: t('cab.manageCycle.pdf.requestStatus', 'Status'), width: 1.5 },
      ],
      cycle.requests.map((r) => [`${r.code} · ${r.title}`, r.statusLabel]),
    )
  }
  doc.print(`${cycle.cycleId}.pdf`, (page, count) => t('cab.offerDetail.page', { defaultValue: 'Page {{page}} of {{count}}', page, count }))
}
