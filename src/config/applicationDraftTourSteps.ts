import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useApplicationDraftTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'header',
      step: 1,
      totalSteps: 5,
      title: t('cab.applicationDraft.tour.header.title', 'Application Draft'),
      description: t(
        'cab.applicationDraft.tour.header.description',
        'Create and edit a new certification application for your client.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'stepper',
      step: 2,
      totalSteps: 5,
      title: t('cab.applicationDraft.tour.stepper.title', 'Application Steps'),
      description: t(
        'cab.applicationDraft.tour.stepper.description',
        'Follow the 5 steps: General Info, Standards & Scope, Sites, Documents, and Review.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'form-content',
      step: 3,
      totalSteps: 5,
      title: t('cab.applicationDraft.tour.formContent.title', 'Form Details'),
      description: t(
        'cab.applicationDraft.tour.formContent.description',
        'Fill in the required information for the selected step.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'workflow-progress',
      step: 4,
      totalSteps: 5,
      title: t('cab.applicationDraft.tour.workflowProgress.title', 'Workflow & Summary'),
      description: t(
        'cab.applicationDraft.tour.workflowProgress.description',
        'View application status, document overview, or review details here.'
      ),
      side: 'left',
      align: 'start',
    },
    {
      id: 'action-buttons',
      step: 5,
      totalSteps: 5,
      title: t('cab.applicationDraft.tour.actionButtons.title', 'Save & Continue'),
      description: t(
        'cab.applicationDraft.tour.actionButtons.description',
        'Save draft or move forward to the next step when fields are complete.'
      ),
      side: 'top',
      align: 'end',
    },
  ]
}
