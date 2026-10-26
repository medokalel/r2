/**
 * "Information required" letter (CAB branding) generated in the browser: the open requests of
 * an application with their reference, due date and status.
 */

import type { TFunction } from 'i18next'
import type { CabApplicationInformationRequired } from '@/lib/api/cabApplicationInformationRequiredApi'
import { BrandedDocument, loadCabBranding } from '@/lib/pdf/brandedDocument'
import { notSet } from '@/lib/emptyValue'

export async function downloadInformationRequestPdf(data: CabApplicationInformationRequired, t: TFunction, language: string): Promise<void> {
  const branding = await loadCabBranding(data.certificationBody)
  const doc = new BrandedDocument(branding, {
    title: `${t('cab.applications.informationRequired.title')} ${data.applicationId}`,
    rtl: language.startsWith('ar'),
    footerNote: data.applicationId,
  })
  doc.header(t('cab.applications.informationRequired.title'), data.applicationId)
  doc.fields([
    [t('cab.applications.informationRequired.summary.client'), data.client],
    [t('cab.applications.informationRequired.summary.primaryStandard'), data.primaryStandard],
    [t('cab.applications.informationRequired.summary.applicationType'), data.applicationType],
    [t('cab.applications.informationRequired.summary.requestedOn'), `${data.requestedOnDate} ${data.requestedOnTime}`],
  ])
  doc.section(t('cab.applications.informationRequired.pdf.requests', 'Requested information'))
  doc.table(
    [
      { header: '#', width: 0.5 },
      { header: t('cab.applications.informationRequired.pdf.item', 'Information'), width: 5 },
      { header: t('cab.applications.informationRequired.pdf.reference', 'Reference'), width: 2 },
      { header: t('cab.applications.informationRequired.pdf.due', 'Due date'), width: 1.6 },
      { header: t('cab.applications.informationRequired.pdf.status', 'Status'), width: 1.6 },
    ],
    data.requests.map((r, i) => [
      String(i + 1),
      r.description,
      r.reference || notSet(),
      r.dueDate || notSet(),
      t(`cab.applications.informationRequired.status.${r.status}`, r.status),
    ]),
  )
  doc.paragraph(t('cab.applications.informationRequired.pdf.note', 'Please upload the requested information in the client portal before the due date.'))
  doc.save(`information-required-${data.applicationId}.pdf`, (page, count) =>
    t('cab.offerDetail.page', { defaultValue: 'Page {{page}} of {{count}}', page, count }),
  )
}
