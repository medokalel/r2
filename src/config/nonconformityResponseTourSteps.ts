import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useNonconformityResponseTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'nc-response-header',
      step: 1,
      totalSteps: 5,
      title: t(
        'cab.nonconformityResponse.tour.header.title',
        'Corrective Action Review'
      ),
      description: t(
        'cab.nonconformityResponse.tour.header.description',
        'Inspect the nonconformity details, client identifier, status badge, and jump to related applications.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'nc-response-tabs',
      step: 2,
      totalSteps: 5,
      title: t(
        'cab.nonconformityResponse.tour.tabs.title',
        'Response Navigation'
      ),
      description: t(
        'cab.nonconformityResponse.tour.tabs.description',
        'Switch between the corrective action plan, full audit trail activity log, related records, and attachments.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'nc-response-form',
      step: 3,
      totalSteps: 5,
      title: t(
        'cab.nonconformityResponse.tour.form.title',
        'Corrective Action Plan & Evidence'
      ),
      description: t(
        'cab.nonconformityResponse.tour.form.description',
        'Review original audit findings, root-cause analysis, proposed preventive actions, and verified evidence files.'
      ),
      side: 'right',
      align: 'start',
    },
    {
      id: 'nc-response-more-details',
      step: 4,
      totalSteps: 5,
      title: t(
        'cab.nonconformityResponse.tour.moreDetails.title',
        'Implementation & Effectiveness'
      ),
      description: t(
        'cab.nonconformityResponse.tour.moreDetails.description',
        'Specify assigned responsible persons, target closure dates, and document formal effectiveness review conclusions.'
      ),
      side: 'left',
      align: 'start',
    },
    {
      id: 'nc-response-actions',
      step: 5,
      totalSteps: 5,
      title: t(
        'cab.nonconformityResponse.tour.actions.title',
        'Reviewer Verification & Actions'
      ),
      description: t(
        'cab.nonconformityResponse.tour.actions.description',
        'Save working response drafts, submit client responses, request clarification revisions, or close verified nonconformities.'
      ),
      side: 'left',
      align: 'start',
    },
  ]
}
