import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useDecisionDetailsTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'decision-details-header',
      step: 1,
      totalSteps: 5,
      title: t('cab.decisionDetails.tour.header.title', 'Decision Record & Scope'),
      description: t(
        'cab.decisionDetails.tour.header.description',
        'View the decision record ID, review status badge, client profile, and quick actions.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'decision-details-gates',
      step: 2,
      totalSteps: 5,
      title: t('cab.decisionDetails.tour.gates.title', 'Readiness & Compliance Gates'),
      description: t(
        'cab.decisionDetails.tour.gates.description',
        'Verify all prerequisites including technical review completion, findings closure, and decision-maker independence.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'decision-details-record',
      step: 3,
      totalSteps: 5,
      title: t('cab.decisionDetails.tour.record.title', 'Decision Formulation & Recording'),
      description: t(
        'cab.decisionDetails.tour.record.description',
        'Select the certification outcome (Grant, Refuse, Suspend), define the confirmed scope, provide rationale, and record the immutable decision.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'decision-details-tabs',
      step: 4,
      totalSteps: 5,
      title: t('cab.decisionDetails.tour.tabs.title', 'Audit Evidence & Findings Tabs'),
      description: t(
        'cab.decisionDetails.tour.tabs.description',
        'Inspect linked technical documentation, open/closed non-conformity findings, and chronological activity trail.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'decision-details-sidebar',
      step: 5,
      totalSteps: 5,
      title: t('cab.decisionDetails.tour.sidebar.title', 'Decision Maker & Context Summary'),
      description: t(
        'cab.decisionDetails.tour.sidebar.description',
        'Select an authorized independent decision maker and review application lifecycle details and technical recommendations.'
      ),
      side: 'left',
      align: 'start',
    },
  ]
}
