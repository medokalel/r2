import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function usePrepareCertificateTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'prepare-certificate-header',
      step: 1,
      totalSteps: 6,
      title: t(
        'cab.certificatePrepare.tour.header.title',
        'Prepare Certificate Workspace'
      ),
      description: t(
        'cab.certificatePrepare.tour.header.description',
        'Generate and issue conformity certificates based on authorized certification decisions, with full live preview.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'prepare-certificate-client-section',
      step: 2,
      totalSteps: 6,
      title: t(
        'cab.certificatePrepare.tour.clientSection.title',
        'Application & Client Information'
      ),
      description: t(
        'cab.certificatePrepare.tour.clientSection.description',
        'Review verified client profile details, legal entity name, country, primary contact, and linked application number.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'prepare-certificate-decision-section',
      step: 3,
      totalSteps: 6,
      title: t(
        'cab.certificatePrepare.tour.decisionSection.title',
        'Authorized Decision & Scope'
      ),
      description: t(
        'cab.certificatePrepare.tour.decisionSection.description',
        'Verify the authorized decision number, date, approved scope of certification, and table of certified facility sites.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'prepare-certificate-details-section',
      step: 4,
      totalSteps: 6,
      title: t(
        'cab.certificatePrepare.tour.detailsSection.title',
        'Certificate Parameters & Configuration'
      ),
      description: t(
        'cab.certificatePrepare.tour.detailsSection.description',
        'Set certificate validity dates (issue, effective, expiry), select design template, language, signatory, and configure accreditation marks and verification QR code.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'prepare-certificate-preview-section',
      step: 5,
      totalSteps: 6,
      title: t(
        'cab.certificatePrepare.tour.previewSection.title',
        'Live Certificate Preview'
      ),
      description: t(
        'cab.certificatePrepare.tour.previewSection.description',
        'Real-time visualization of the printed certificate document. You can expand to full screen to inspect formatting before issuance.'
      ),
      side: 'left',
      align: 'start',
    },
    {
      id: 'prepare-certificate-actions',
      step: 6,
      totalSteps: 6,
      title: t(
        'cab.certificatePrepare.tour.actions.title',
        'Preview & Issue Actions'
      ),
      description: t(
        'cab.certificatePrepare.tour.actions.description',
        'Preview the full certificate or finalize and issue the official certificate to the client.'
      ),
      side: 'bottom',
      align: 'end',
    },
  ]
}
