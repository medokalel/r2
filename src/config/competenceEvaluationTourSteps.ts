import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useCompetenceEvaluationTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'eval-header',
      step: 1,
      totalSteps: 5,
      title: t('cab.competence.evalTour.header.title', 'Evaluation Overview'),
      description: t(
        'cab.competence.evalTour.header.description',
        'Review and manage the overall competence assessment status for this personnel record.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'eval-actions',
      step: 2,
      totalSteps: 5,
      title: t('cab.competence.evalTour.actions.title', 'Save & Submit Actions'),
      description: t(
        'cab.competence.evalTour.actions.description',
        'Save draft modifications or submit completed evaluations to the technical manager for authorization.'
      ),
      side: 'bottom',
      align: 'end',
    },
    {
      id: 'eval-profile',
      step: 3,
      totalSteps: 5,
      title: t('cab.competence.evalTour.profile.title', 'Personnel Profile Snapshot'),
      description: t(
        'cab.competence.evalTour.profile.description',
        'View key staff credentials including personal code, primary role, email, phone, and active status.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'eval-criteria-form',
      step: 4,
      totalSteps: 5,
      title: t('cab.competence.evalTour.criteria.title', 'Competence Criteria & Experience'),
      description: t(
        'cab.competence.evalTour.criteria.description',
        'Assess scheme standards, proposed sectors, evaluation dates, evaluator decisions, highest qualification, and field of study.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'eval-documents-section',
      step: 5,
      totalSteps: 5,
      title: t('cab.competence.evalTour.documents.title', 'Qualification Documents & Evidence'),
      description: t(
        'cab.competence.evalTour.documents.description',
        'Upload official certificates, diplomas, CVs, and evidence files directly to the employee record.'
      ),
      side: 'top',
      align: 'start',
    },
  ]
}
