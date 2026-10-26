/**
 * Signed certification agreement PDF (CAB branding): the agreement text in the reader's language,
 * both signatures, the SHA-256 document fingerprint and seal, and an audit-trail page
 * (every event with time, actor, IP address and device).
 */

import type { TFunction } from 'i18next'
import type { AgreementDetail, AgreementSignature } from '@/lib/api/agreementsApi'
import { BrandedDocument, loadCabBranding } from '@/lib/pdf/brandedDocument'
import { loadImageAsJpeg } from '@/lib/pdf/simplePdf'
import { typedSignatureDataUrl } from '@/components/ui/SignaturePad'
import { formatDateTime } from '@/lib/format/dates'

async function signatureImage(s: AgreementSignature) {
  const source = s.signatureImage || typedSignatureDataUrl(s.signatureText || s.signerName)
  return source ? loadImageAsJpeg(source, 900) : null
}

export async function downloadAgreementPdf(a: AgreementDetail, t: TFunction, language: string): Promise<void> {
  const ar = language.startsWith('ar')
  const lang = ar ? 'ar' : 'en'
  const branding = await loadCabBranding(a.cab?.name)
  const title = a.kind === 'amendment' ? t('agreements.kind.amendment') : t('agreements.kind.original')
  const doc = new BrandedDocument(branding, { title, rtl: ar, footerNote: `${a.reference} · SHA-256 ${(a.documentHash ?? a.draftHash ?? '').slice(0, 16)}` })

  doc.header(title, a.reference, a.status === 'active' ? t('agreements.pdf.signedCopy') : t('agreements.pdf.notSigned'))
  doc.fields([
    [t('agreements.fields.client'), a.clientName],
    [t('agreements.fields.cab'), a.cab?.legalName ?? branding.name],
    [t('agreements.fields.status'), t(`agreements.status.${a.status}`)],
    [t('agreements.fields.standards'), a.standards],
    [t('agreements.fields.sentAt'), formatDateTime(a.sentAt, language)],
    [t('agreements.fields.activeSince'), formatDateTime(a.countersignedAt, language)],
  ])
  if (a.amendment) {
    doc.section(t('agreements.amendment.title'))
    doc.paragraph(`${t('agreements.amendment.replaces', { reference: a.amendment.previousReference ?? '' })} ${a.amendment.reason}`)
  }

  a.sections.forEach((section, index) => {
    doc.section(`${index + 1}. ${section.title[lang]}`)
    doc.paragraph(section.body[lang])
  })

  doc.section(t('agreements.signatures.title'))
  for (const party of ['client', 'cab'] as const) {
    const s = a.signatures.find((x) => x.party === party)
    if (!s) {
      doc.paragraph(`${t(`agreements.signatures.${party}`)}: ${t('agreements.signatures.pending')}`)
      continue
    }
    doc.signature(await signatureImage(s), [
      `${t(`agreements.signatures.${party}`)}: ${s.signerName}, ${s.signerTitle}`,
      `${t('agreements.signatures.signedAt')}: ${formatDateTime(s.signedAt, language)}`,
      `${t('agreements.signatures.method')}: ${t(`agreements.method.${s.method}`)}`,
    ])
  }

  // Audit-trail page
  doc.pageBreak()
  doc.section(t('agreements.pdf.trailTitle'))
  doc.fields([
    [t('agreements.integrity.documentHash'), a.documentHash ?? t('agreements.integrity.notSealed')],
    [t('agreements.integrity.sealHash'), a.sealHash ?? t('agreements.integrity.notSealed')],
    [t('agreements.integrity.check'), a.integrity.documentHashValid === false ? t('agreements.integrity.failed') : a.documentHash ? t('agreements.integrity.ok') : t('agreements.integrity.notSealed')],
    [t('agreements.fields.reference'), a.reference],
  ])
  if (a.signatures.length) {
    doc.table(
      [
        { header: t('agreements.pdf.signer'), width: 3 },
        { header: t('agreements.signatures.signedAt'), width: 2.2 },
        { header: t('agreements.signatures.ip'), width: 1.6 },
        { header: t('agreements.pdf.device'), width: 3.2 },
      ],
      a.signatures.map((s) => [`${s.signerName} (${s.signerEmail})`, formatDateTime(s.signedAt, language), s.ipAddress ?? '', s.userAgent ?? '']),
    )
  }
  doc.table(
    [
      { header: t('agreements.pdf.when'), width: 2.2 },
      { header: t('agreements.pdf.event'), width: 2.6 },
      { header: t('agreements.pdf.by'), width: 2.4 },
      { header: t('agreements.signatures.ip'), width: 1.6 },
    ],
    a.events.map((e) => [formatDateTime(e.at, language), t(`agreements.events.${e.type}`, { defaultValue: e.type }), e.actorName ?? t(`agreements.actor.${e.actorType}`), e.ipAddress ?? '']),
  )
  doc.paragraph(t('agreements.pdf.verifyNote'))

  doc.save(`${a.reference.replace(/\s+/g, '-')}.pdf`, (page, total) => t('agreements.pdf.page', { page, total }))
}
