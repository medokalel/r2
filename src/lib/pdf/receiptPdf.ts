/**
 * Application receipt PDF (CAB branding), generated in the browser from `CabApplicationReceipt`.
 */

import type { TFunction } from 'i18next'
import type { CabApplicationReceipt } from '@/lib/api/cabApplicationReceiptApi'
import { BrandedDocument, loadCabBranding } from '@/lib/pdf/brandedDocument'

async function buildReceipt(receipt: CabApplicationReceipt, t: TFunction, language: string): Promise<BrandedDocument> {
  const branding = await loadCabBranding(receipt.certificationBody)
  const doc = new BrandedDocument(branding, {
    title: `${t('cab.applications.receipt.title')} ${receipt.applicationId}`,
    rtl: language.startsWith('ar'),
    footerNote: receipt.referenceNo,
  })
  doc.header(t('cab.applications.receipt.title'), receipt.referenceNo, t('cab.applications.receipt.pdf.intro', {
    defaultValue: 'This confirms that the certification application below was received on {{date}}.',
    date: receipt.receivedOn,
  }))
  doc.section(t('cab.applications.receipt.pdf.application', 'Application'))
  doc.fields([
    [t('cab.applications.receipt.pdf.applicationId', 'Application'), receipt.applicationId],
    [t('cab.applications.receipt.pdf.type', 'Application type'), receipt.applicationType],
    [t('cab.applications.receipt.pdf.standards', 'Standards'), receipt.primaryStandards.join(', ')],
    [t('cab.applications.receipt.pdf.sites', 'Number of sites'), String(receipt.numberOfSites)],
    [t('cab.applications.receipt.pdf.received', 'Received on'), receipt.receivedOn],
    [t('cab.applications.receipt.pdf.receivedBy', 'Received by'), receipt.receivedBy],
    [t('cab.applications.receipt.pdf.requestedDate', 'Requested certification date'), receipt.requestedCertificationDate],
    [t('cab.applications.receipt.pdf.language', 'Audit language'), receipt.auditLanguage],
  ])
  doc.section(t('cab.applications.receipt.pdf.client', 'Client'))
  doc.fields([
    [t('cab.applications.receipt.pdf.clientName', 'Client'), receipt.client.legalEntityName || receipt.clientName],
    [t('cab.applications.receipt.pdf.clientId', 'Client ID'), receipt.client.clientId],
    [t('cab.applications.receipt.pdf.country', 'Country'), receipt.client.country],
    [t('cab.applications.receipt.pdf.registration', 'Registration / licence no.'), receipt.client.registrationLicenseNo],
    [t('cab.applications.receipt.pdf.industry', 'Industry'), receipt.client.industry],
    [t('cab.applications.receipt.pdf.accreditation', 'Accreditation body'), receipt.accreditationBody],
  ])
  if (receipt.scopeSummary) {
    doc.section(t('cab.applications.receipt.sections.scopeOfCertification'))
    doc.paragraph(receipt.scopeSummary)
  }
  doc.section(t('cab.applications.receipt.pdf.documents', 'Documents'))
  doc.table(
    [
      { header: t('cab.applications.receipt.documents.uploaded'), width: 1, align: 'end' },
      { header: t('cab.applications.receipt.documents.pending'), width: 1, align: 'end' },
      { header: t('cab.applications.receipt.documents.rejected'), width: 1, align: 'end' },
    ],
    [[String(receipt.documents.uploaded), String(receipt.documents.pending), String(receipt.documents.rejected)]],
  )
  if (receipt.confirmationEmails.length) {
    doc.paragraph(t('cab.applications.receipt.pdf.emails', { defaultValue: 'Confirmation sent to: {{emails}}', emails: receipt.confirmationEmails.join(', ') }))
  }
  return doc
}

const pageLabel = (t: TFunction) => (page: number, count: number) => t('cab.offerDetail.page', { defaultValue: 'Page {{page}} of {{count}}', page, count })

export async function downloadReceiptPdf(receipt: CabApplicationReceipt, t: TFunction, language: string): Promise<void> {
  ;(await buildReceipt(receipt, t, language)).save(`receipt-${receipt.applicationId}.pdf`, pageLabel(t))
}

export async function printReceiptPdf(receipt: CabApplicationReceipt, t: TFunction, language: string): Promise<void> {
  ;(await buildReceipt(receipt, t, language)).print(`receipt-${receipt.applicationId}.pdf`, pageLabel(t))
}
