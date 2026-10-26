import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useDecisionsTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'decisions-header',
      step: 1,
      totalSteps: 5,
      title: t('cab.decisions.tour.header.title', 'Certification Decision Queue'),
      description: t(
        'cab.decisions.tour.header.description',
        'Review audit reports, technical recommendations, and issue formal certification grant or refusal decisions.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'decisions-search-filters',
      step: 2,
      totalSteps: 5,
      title: t('cab.decisions.tour.filters.title', 'Filters & Criteria'),
      description: t(
        'cab.decisions.tour.filters.description',
        'Filter files by decision ID, client name, audit scheme, country, and review status.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'decisions-table',
      step: 3,
      totalSteps: 5,
      title: t('cab.decisions.tour.table.title', 'Decisions List Table'),
      description: t(
        'cab.decisions.tour.table.description',
        'Click on any application file in the table to inspect its comprehensive summary and decision audit trail.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'decisions-status-badge',
      step: 4,
      totalSteps: 5,
      title: t('cab.decisions.tour.status.title', 'Review & Decision Status'),
      description: t(
        'cab.decisions.tour.status.description',
        'Monitor pending stages: Awaiting Technical Review, Ready for Decision, Granted, or Refused.'
      ),
      side: 'left',
      align: 'start',
    },
    {
      id: 'decisions-summary-card',
      step: 5,
      totalSteps: 5,
      title: t('cab.decisions.tour.summary.title', 'Selected Decision Summary'),
      description: t(
        'cab.decisions.tour.summary.description',
        'Inspect client information, due dates, assigned decision maker, and click Open Decision to finalize the grant.'
      ),
      side: 'left',
      align: 'start',
    },
  ]
}
