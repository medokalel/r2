import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useCreateOfferTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'create-offer-header',
      step: 1,
      totalSteps: 6,
      title: t('cab.offersPage.createTour.header.title', 'Create Commercial Offer'),
      description: t(
        'cab.offersPage.createTour.header.description',
        'Prepare a commercial quotation for the client based on an accepted certification application.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'create-offer-client-app',
      step: 2,
      totalSteps: 6,
      title: t('cab.offersPage.createTour.clientApp.title', 'Client & Application'),
      description: t(
        'cab.offersPage.createTour.clientApp.description',
        'Verify client details, primary contact, audit standard, and select the accepted application.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'create-offer-details',
      step: 3,
      totalSteps: 6,
      title: t('cab.offersPage.createTour.offerDetails.title', 'Offer Parameters'),
      description: t(
        'cab.offersPage.createTour.offerDetails.description',
        'Set currency, offer validity deadline, payment terms, and optional internal notes.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'create-offer-fees',
      step: 4,
      totalSteps: 6,
      title: t('cab.offersPage.createTour.fees.title', 'Fee Breakdown & Totals'),
      description: t(
        'cab.offersPage.createTour.fees.description',
        'Add and manage audit fee items, administration fees, and review calculated pre-tax and net totals.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'create-offer-more-details',
      step: 5,
      totalSteps: 6,
      title: t('cab.offersPage.createTour.moreDetails.title', 'Approval Route & Terms'),
      description: t(
        'cab.offersPage.createTour.moreDetails.description',
        'Configure travel costs, discounts, upload terms & conditions, and select the internal approval workflow.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'create-offer-actions',
      step: 6,
      totalSteps: 6,
      title: t('cab.offersPage.createTour.actions.title', 'Save Draft or Submit'),
      description: t(
        'cab.offersPage.createTour.actions.description',
        'Save the offer as a draft or submit it directly into the approval route for review.'
      ),
      side: 'top',
      align: 'end',
    },
  ]
}
