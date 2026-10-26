import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useAuditClientsTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'audit-clients-header',
      step: 1,
      totalSteps: 5,
      title: t('cab.clientRegister.tour.header.title', 'Audit Clients Register'),
      description: t(
        'cab.clientRegister.tour.header.description',
        'Overview and central directory of all registered audit clients and organizations.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'audit-clients-new-btn',
      step: 2,
      totalSteps: 5,
      title: t('cab.clientRegister.tour.newClient.title', 'Register New Client'),
      description: t(
        'cab.clientRegister.tour.newClient.description',
        'Quickly onboard and register a new client company into your CAB certification system.'
      ),
      side: 'bottom',
      align: 'end',
    },
    {
      id: 'audit-clients-filters',
      step: 3,
      totalSteps: 5,
      title: t('cab.clientRegister.tour.filters.title', 'Search & Filtering'),
      description: t(
        'cab.clientRegister.tour.filters.description',
        'Search by client code, company name, contact person, or email, and filter by country and added period.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'audit-clients-table',
      step: 4,
      totalSteps: 5,
      title: t('cab.clientRegister.tour.table.title', 'Clients Directory Table'),
      description: t(
        'cab.clientRegister.tour.table.description',
        'View complete client records with IDs, legal names, country flags, primary contacts, and last update dates.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'audit-clients-actions',
      step: 5,
      totalSteps: 5,
      title: t('cab.clientRegister.tour.actions.title', 'Client Actions'),
      description: t(
        'cab.clientRegister.tour.actions.description',
        'Open client profile details, view certification history, or edit company information directly.'
      ),
      side: 'left',
      align: 'start',
    },
  ]
}
