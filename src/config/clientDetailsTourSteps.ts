import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useClientDetailsTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'client-details-header',
      step: 1,
      totalSteps: 4,
      title: t('cab.clientDetails.tour.header.title', 'Client Profile Overview'),
      description: t(
        'cab.clientDetails.tour.header.description',
        'Review the client’s organization details, active status badge, and navigation controls.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'client-details-actions',
      step: 2,
      totalSteps: 4,
      title: t('cab.clientDetails.tour.actions.title', 'Quick Management Actions'),
      description: t(
        'cab.clientDetails.tour.actions.description',
        'Edit this client’s profile, register another client, or return back to the main audit clients directory.'
      ),
      side: 'bottom',
      align: 'end',
    },
    {
      id: 'client-details-summary',
      step: 3,
      totalSteps: 4,
      title: t('cab.clientDetails.tour.summary.title', 'Organization & Status Card'),
      description: t(
        'cab.clientDetails.tour.summary.description',
        'Displays the official legal name of the organization, operating city, and current onboarding/registration status.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'client-details-info-section',
      step: 4,
      totalSteps: 4,
      title: t('cab.clientDetails.tour.infoSection.title', 'Detailed Company Information'),
      description: t(
        'cab.clientDetails.tour.infoSection.description',
        'Complete breakdown including legal capacity, administration name, country, industrial activity, manager, official email, and phone contact.'
      ),
      side: 'top',
      align: 'start',
    },
  ]
}
