import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useAddContactTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'add-contact-header',
      step: 1,
      totalSteps: 5,
      title: t('cab.contacts.addTour.header.title', 'Add New Contact'),
      description: t(
        'cab.contacts.addTour.header.description',
        'Create a new contact person record linked to an active client organization.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'add-contact-client-association',
      step: 2,
      totalSteps: 5,
      title: t('cab.contacts.addTour.clientAssociation.title', 'Client Association'),
      description: t(
        'cab.contacts.addTour.clientAssociation.description',
        'Select the client company to associate this contact with and verify client details.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'add-contact-details',
      step: 3,
      totalSteps: 5,
      title: t('cab.contacts.addTour.contactDetails.title', 'Contact Details'),
      description: t(
        'cab.contacts.addTour.contactDetails.description',
        'Provide the personal name, corporate email address, designation, and primary contact number.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'add-contact-additional',
      step: 4,
      totalSteps: 5,
      title: t('cab.contacts.addTour.additional.title', 'Sites, Roles & Portal Access'),
      description: t(
        'cab.contacts.addTour.additional.description',
        'Assign linked operating sites, grant primary or signatory roles, and optionally send a portal invitation.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'add-contact-actions',
      step: 5,
      totalSteps: 5,
      title: t('cab.contacts.addTour.actions.title', 'Save & Submit'),
      description: t(
        'cab.contacts.addTour.actions.description',
        'Save the new contact to the directory or cancel and return to the contacts register.'
      ),
      side: 'top',
      align: 'end',
    },
  ]
}
