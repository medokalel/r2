import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useOffersTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'offers-header',
      step: 1,
      totalSteps: 5,
      title: t('cab.offersPage.tour.header.title', 'Offer Register Overview'),
      description: t(
        'cab.offersPage.tour.header.description',
        'Track, manage, and review all quotation offers issued to clients across different certification schemes.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'offers-search-filters',
      step: 2,
      totalSteps: 5,
      title: t('cab.offersPage.tour.filters.title', 'Search & Filtering'),
      description: t(
        'cab.offersPage.tour.filters.description',
        'Quickly find offers by number or client name, and filter by country and offer status.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'offers-new-btn',
      step: 3,
      totalSteps: 5,
      title: t('cab.offersPage.tour.newOffer.title', 'Create New Offer'),
      description: t(
        'cab.offersPage.tour.newOffer.description',
        'Draft a new commercial offer with fee breakdown, validity period, and custom discounts.'
      ),
      side: 'bottom',
      align: 'end',
    },
    {
      id: 'offers-table',
      step: 4,
      totalSteps: 5,
      title: t('cab.offersPage.tour.table.title', 'Offers List Table'),
      description: t(
        'cab.offersPage.tour.table.description',
        'Review offer numbers, clients, total fees, currencies, validity deadlines, and current statuses.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'offers-status-actions',
      step: 5,
      totalSteps: 5,
      title: t('cab.offersPage.tour.statusActions.title', 'Status Badges & Actions'),
      description: t(
        'cab.offersPage.tour.statusActions.description',
        'Monitor offer progress (Issued, Approved, Draft, Void) and use the action menu to view, revise, or download PDFs.'
      ),
      side: 'left',
      align: 'start',
    },
  ]
}
