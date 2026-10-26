import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function usePersonnelTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'personnel-header',
      step: 1,
      totalSteps: 5,
      title: t('cab.competence.tour.header.title', 'Competence Register Overview'),
      description: t(
        'cab.competence.tour.header.description',
        'Manage auditor and technical personnel qualifications, scheme authorizations, and competence evaluations.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'personnel-actions',
      step: 2,
      totalSteps: 5,
      title: t('cab.competence.tour.actions.title', 'Add & Export Personnel'),
      description: t(
        'cab.competence.tour.actions.description',
        'Enroll new technical resources and auditors, assign initial schemes, or export records to CSV.'
      ),
      side: 'bottom',
      align: 'end',
    },
    {
      id: 'personnel-filters',
      step: 3,
      totalSteps: 5,
      title: t('cab.competence.tour.filters.title', 'Search & Filtering'),
      description: t(
        'cab.competence.tour.filters.description',
        'Filter staff by name or code, country, authorization status (Authorized, Under review, Expired), and expiry deadlines.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'personnel-table',
      step: 4,
      totalSteps: 5,
      title: t('cab.competence.tour.table.title', 'Personnel Register Table'),
      description: t(
        'cab.competence.tour.table.description',
        'Detailed overview of personnel codes, roles, authorized standards & sectors, expiry dates, and validation badges.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'personnel-eval-action',
      step: 5,
      totalSteps: 5,
      title: t('cab.competence.tour.evalAction.title', 'Competence Evaluations'),
      description: t(
        'cab.competence.tour.evalAction.description',
        'Click on any person to perform formal competence assessments, review CPD certificates, and authorize standards.'
      ),
      side: 'left',
      align: 'start',
    },
  ]
}
