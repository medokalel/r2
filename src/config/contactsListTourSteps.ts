import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useContactsListTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'contacts-header',
      step: 1,
      totalSteps: 5,
      title: t('cab.contacts.tour.header.title', 'Contacts Directory'),
      description: t(
        'cab.contacts.tour.header.description',
        'Manage and access all client contacts, authorized signatories, and site personnel in one central place.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'contacts-search-filters',
      step: 2,
      totalSteps: 5,
      title: t('cab.contacts.tour.filters.title', 'Search & Filtering'),
      description: t(
        'cab.contacts.tour.filters.description',
        'Search by contact name, client name, or email, and filter by associated client or contact status.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'contacts-add-btn',
      step: 3,
      totalSteps: 5,
      title: t('cab.contacts.tour.addContact.title', 'Add New Contact'),
      description: t(
        'cab.contacts.tour.addContact.description',
        'Quickly register a new contact person and link them to an existing client and facilities.'
      ),
      side: 'bottom',
      align: 'end',
    },
    {
      id: 'contacts-table',
      step: 4,
      totalSteps: 5,
      title: t('cab.contacts.tour.table.title', 'Contacts Table'),
      description: t(
        'cab.contacts.tour.table.description',
        'Review contact names, designations, roles, direct phone numbers, linked sites, and active statuses.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'contacts-status',
      step: 5,
      totalSteps: 5,
      title: t('cab.contacts.tour.status.title', 'Contact Status & Details'),
      description: t(
        'cab.contacts.tour.status.description',
        'Track active, pending, or inactive contacts, and click View to inspect or edit their complete details.'
      ),
      side: 'left',
      align: 'start',
    },
  ]
}
