import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useClientRegistrationTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'sidebar-clients-new',
      step: 1,
      totalSteps: 5,
      title: t('cab.tour.sidebarClientsNew.title', 'New Client Registration Icon'),
      description: t(
        'cab.tour.sidebarClientsNew.description',
        'Directly access the new client registration form to add an organization.'
      ),
      side: 'right',
      align: 'start',
    },
    {
      id: 'header',
      step: 2,
      totalSteps: 5,
      title: t('cab.clientRegistration.tour.header.title', 'Client Registration'),
      description: t(
        'cab.clientRegistration.tour.header.description',
        'Fill out this form to register a new client organisation under your CAB.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'client-information',
      step: 3,
      totalSteps: 5,
      title: t('cab.clientRegistration.tour.clientInformation.title', 'Client Information'),
      description: t(
        'cab.clientRegistration.tour.clientInformation.description',
        'Enter the organization name, legal capacity, administration address, city, activity, owner, email, and phone.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'workflow-progress',
      step: 4,
      totalSteps: 5,
      title: t('cab.clientRegistration.tour.workflowProgress.title', 'Workflow Progress'),
      description: t(
        'cab.clientRegistration.tour.workflowProgress.description',
        'Track where this registration sits in the overall certification pipeline.'
      ),
      side: 'left',
      align: 'start',
    },
    {
      id: 'action-buttons',
      step: 5,
      totalSteps: 5,
      title: t('cab.clientRegistration.tour.actionButtons.title', 'Save & Continue'),
      description: t(
        'cab.clientRegistration.tour.actionButtons.description',
        'Save your progress as a draft or proceed once all required fields are complete.'
      ),
      side: 'top',
      align: 'end',
    },
  ]
}
