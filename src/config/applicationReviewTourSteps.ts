import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useApplicationReviewTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'sidebar-app-review',
      step: 1,
      totalSteps: 3,
      title: t('cab.tour.sidebarAppReview.title', 'Application Review Icon'),
      description: t(
        'cab.tour.sidebarAppReview.description',
        'Directly access application documents, review data, and make certification decisions.'
      ),
      side: 'right',
      align: 'start',
    },
    {
      id: 'tabs',
      step: 2,
      totalSteps: 3,
      title: t('cab.applications.review.tour.tabs.title', 'Review Sections & Tabs'),
      description: t(
        'cab.applications.review.tour.tabs.description',
        'Start with Application Details, review each section, then open the Review Checklist.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'checklist-table',
      step: 3,
      totalSteps: 3,
      title: t('cab.applications.review.tour.checklistTable.title', 'Review Checklist'),
      description: t(
        'cab.applications.review.tour.checklistTable.description',
        "Inspect each area's completion status, add comments, and set overall decision."
      ),
      side: 'bottom',
      align: 'start',
    },
  ]
}
