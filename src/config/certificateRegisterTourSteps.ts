import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useCertificateRegisterTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'certificate-register-header',
      step: 1,
      totalSteps: 5,
      title: t(
        'cab.certificateRegister.tour.header.title',
        'Certificates Register'
      ),
      description: t(
        'cab.certificateRegister.tour.header.description',
        'Search, monitor, and manage all conformity assessment certificates issued by your CAB.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'certificate-register-prepare-btn',
      step: 2,
      totalSteps: 5,
      title: t(
        'cab.certificateRegister.tour.prepareCertificate.title',
        'Prepare Certificate'
      ),
      description: t(
        'cab.certificateRegister.tour.prepareCertificate.description',
        'Click here to create and prepare a new certificate draft for approved client decisions.'
      ),
      side: 'bottom',
      align: 'end',
    },
    {
      id: 'certificate-register-filters',
      step: 3,
      totalSteps: 5,
      title: t(
        'cab.certificateRegister.tour.filters.title',
        'Filter & Search'
      ),
      description: t(
        'cab.certificateRegister.tour.filters.description',
        'Quickly search by certificate number, client name, issue period, country, or certificate status.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'certificate-register-table',
      step: 4,
      totalSteps: 5,
      title: t(
        'cab.certificateRegister.tour.table.title',
        'Certificates Table'
      ),
      description: t(
        'cab.certificateRegister.tour.table.description',
        'Review certificate numbers, client details, standards, certification scope, validity dates, and status badges.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'certificate-register-actions',
      step: 5,
      totalSteps: 5,
      title: t(
        'cab.certificateRegister.tour.actions.title',
        'Certificate Lifecycle Actions'
      ),
      description: t(
        'cab.certificateRegister.tour.actions.description',
        'Access actions to prepare certificates, edit drafts, issue, reissue, suspend, or withdraw certificates.'
      ),
      side: 'left',
      align: 'start',
    },
  ]
}
