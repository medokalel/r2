import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useCertificationCyclesTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'cert-cycles-header',
      step: 1,
      totalSteps: 5,
      title: t('cab.certification.tour.header.title', 'Certification Cycles Overview'),
      description: t(
        'cab.certification.tour.header.description',
        'Monitor active multi-year certification lifecycles, surveillance timelines, and standard expiration dates across all clients.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'cert-cycles-filters',
      step: 2,
      totalSteps: 5,
      title: t('cab.certification.tour.filters.title', 'Search & Filtering'),
      description: t(
        'cab.certification.tour.filters.description',
        'Find client cycles by organization name or certificate code, and filter by due period, country, and lifecycle status.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'cert-cycles-list',
      step: 3,
      totalSteps: 5,
      title: t('cab.certification.tour.list.title', 'Client Cycles Directory'),
      description: t(
        'cab.certification.tour.list.description',
        'Select any client record from the list to view their complete certification history, standard details, and live surveillance progress.'
      ),
      side: 'right',
      align: 'start',
    },
    {
      id: 'cert-cycles-summary-card',
      step: 4,
      totalSteps: 5,
      title: t('cab.certification.tour.summaryCard.title', 'Cycle Details & Milestones'),
      description: t(
        'cab.certification.tour.summaryCard.description',
        'Inspect standard scopes, application references, start/end validity dates, and countdown days to next required surveillance.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'cert-cycles-timeline-activities',
      step: 5,
      totalSteps: 5,
      title: t('cab.certification.tour.timeline.title', 'Lifecycle Timeline & Activities'),
      description: t(
        'cab.certification.tour.timeline.description',
        'Track the 3-year audit timeline across Stage 1/2, Surveillance audits (Surv 1, Surv 2), and scheduled future visits.'
      ),
      side: 'top',
      align: 'start',
    },
  ]
}
