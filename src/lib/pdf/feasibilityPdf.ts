/**
 * Technical feasibility assessment PDF (CAB branding), generated in the browser.
 */

import type { TFunction } from 'i18next'
import type { CabApplicationTechnicalFeasibility } from '@/lib/api/cabApplicationTechnicalFeasibilityApi'
import { BrandedDocument, loadCabBranding } from '@/lib/pdf/brandedDocument'

export async function downloadFeasibilityPdf(data: CabApplicationTechnicalFeasibility, t: TFunction, language: string): Promise<void> {
  const branding = await loadCabBranding(data.certificationBody)
  const doc = new BrandedDocument(branding, {
    title: `${t('cab.applications.technicalFeasibility.title')} ${data.applicationId}`,
    rtl: language.startsWith('ar'),
    footerNote: data.applicationId,
  })
  doc.header(t('cab.applications.technicalFeasibility.title'), data.applicationId)
  doc.fields([
    [t('cab.applications.technicalFeasibility.summary.client'), data.client],
    [t('cab.applications.technicalFeasibility.summary.standardScheme'), data.primaryStandard],
    [t('cab.applications.technicalFeasibility.summary.sites'), String(data.sitesCount)],
    [t('cab.applications.technicalFeasibility.pdf.result', 'Feasibility'), `${data.feasibilityPercent}% (${data.feasibleCount}/${data.totalAssessments})`],
  ])
  doc.section(t('cab.applications.technicalFeasibility.pdf.assessment', 'Assessment'))
  doc.table(
    [
      { header: t('cab.applications.technicalFeasibility.pdf.area', 'Area'), width: 2.4 },
      { header: t('cab.applications.technicalFeasibility.pdf.assessmentCol', 'Assessment'), width: 3.6 },
      { header: t('cab.applications.technicalFeasibility.pdf.status', 'Status'), width: 1.6 },
      { header: t('cab.applications.technicalFeasibility.pdf.comments', 'Comments'), width: 3 },
    ],
    data.assessments.map((a) => [
      t(`cab.applications.technicalFeasibility.assessment.areas.${a.areaKey}`, a.areaKey),
      a.assessment,
      t(`cab.applications.technicalFeasibility.assessment.status.${a.status}`, a.status),
      a.comments,
    ]),
  )
  doc.section(t('cab.applications.technicalFeasibility.auditTeam.title'))
  doc.table(
    [
      { header: t('cab.applications.technicalFeasibility.pdf.member', 'Name'), width: 3 },
      { header: t('cab.applications.technicalFeasibility.pdf.role', 'Role'), width: 2 },
      { header: t('cab.applications.technicalFeasibility.pdf.certification', 'Certification'), width: 4 },
    ],
    data.auditTeam.map((m) => [m.name, t(`cab.applications.technicalFeasibility.auditTeam.roles.${m.roleKey}`), m.certification]),
  )
  doc.save(`technical-feasibility-${data.applicationId}.pdf`, (page, count) =>
    t('cab.offerDetail.page', { defaultValue: 'Page {{page}} of {{count}}', page, count }),
  )
}
