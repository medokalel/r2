import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useReviewQueueTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'review-queue-header',
      step: 1,
      totalSteps: 5,
      title: t('cab.applications.reviewQueue.tour.header.title', 'Review Queue Overview'),
      description: t(
        'cab.applications.reviewQueue.tour.header.description',
        'Manage incoming conformity assessment applications awaiting preliminary review and processing.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'review-queue-filters',
      step: 2,
      totalSteps: 5,
      title: t('cab.applications.reviewQueue.tour.filters.title', 'Search & Filtering'),
      description: t(
        'cab.applications.reviewQueue.tour.filters.description',
        'Filter applications by application number, client name, received date range, country, and review status.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'review-queue-table',
      step: 3,
      totalSteps: 5,
      title: t('cab.applications.reviewQueue.tour.table.title', 'Applications Queue Table'),
      description: t(
        'cab.applications.reviewQueue.tour.table.description',
        'View all application records with client info, standards, assigned reviewers, and due deadlines.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'review-queue-status',
      step: 4,
      totalSteps: 5,
      title: t('cab.applications.reviewQueue.tour.status.title', 'Review Status Badges'),
      description: t(
        'cab.applications.reviewQueue.tour.status.description',
        'Track the stage of each application: Ready for review, In Progress, Clarification requested, or Approved.'
      ),
      side: 'left',
      align: 'start',
    },
    {
      id: 'review-queue-actions',
      step: 5,
      totalSteps: 5,
      title: t('cab.applications.reviewQueue.tour.actions.title', 'Action Buttons'),
      description: t(
        'cab.applications.reviewQueue.tour.actions.description',
        'Directly open the application review workspace or request further information and clarification from the client.'
      ),
      side: 'left',
      align: 'start',
    },
  ]
}
