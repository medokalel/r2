import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useClientCompanyProfileTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'client-profile-header',
      step: 1,
      totalSteps: 4,
      title: t('cab.clientCompanyProfile.tour.header.title', 'Client Profile Overview'),
      description: t(
        'cab.clientCompanyProfile.tour.header.description',
        'Review client organization header, stage titles, and return to the main audit clients directory.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'client-profile-stepper',
      step: 2,
      totalSteps: 4,
      title: t('cab.clientCompanyProfile.tour.stepper.title', 'Profile Stepper Navigation'),
      description: t(
        'cab.clientCompanyProfile.tour.stepper.description',
        'Easily switch between Basic Data, Address, Branches, and Official Documents sections.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'client-profile-form',
      step: 3,
      totalSteps: 4,
      title: t('cab.clientCompanyProfile.tour.form.title', 'Company Data & Document Management'),
      description: t(
        'cab.clientCompanyProfile.tour.form.description',
        'Configure sector classifications, production line status, location addresses, branch networks, and upload verification files.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'client-profile-footer',
      step: 4,
      totalSteps: 4,
      title: t('cab.clientCompanyProfile.tour.footer.title', 'Save Draft & Final Submit'),
      description: t(
        'cab.clientCompanyProfile.tour.footer.description',
        'Save partial progress as a draft, move between steps, or complete the client company profile.'
      ),
      side: 'top',
      align: 'end',
    },
  ]
}
