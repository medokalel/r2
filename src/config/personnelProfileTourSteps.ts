import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function usePersonnelProfileTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'profile-header',
      step: 1,
      totalSteps: 5,
      title: t('cab.competence.profileTour.header.title', 'Member Profile Overview'),
      description: t(
        'cab.competence.profileTour.header.description',
        'Review or update the personnel record, professional role, and contact credentials.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'profile-personal-section',
      step: 2,
      totalSteps: 5,
      title: t('cab.competence.profileTour.personal.title', 'Personal & Contact Information'),
      description: t(
        'cab.competence.profileTour.personal.description',
        'Update full name, professional role (Auditor, Lead Auditor, etc.), email, phone, and upload profile photo.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'profile-employment-section',
      step: 3,
      totalSteps: 5,
      title: t('cab.competence.profileTour.employment.title', 'Employment Details'),
      description: t(
        'cab.competence.profileTour.employment.description',
        'Record employment start and optional contract end dates for organizational tracking.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'profile-competence-section',
      step: 4,
      totalSteps: 5,
      title: t('cab.competence.profileTour.competence.title', 'Schemes & Sector Authorizations'),
      description: t(
        'cab.competence.profileTour.competence.description',
        'Assign accredited IAF sector codes, approved certification schemes, qualifications, and country.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'profile-save-action',
      step: 5,
      totalSteps: 5,
      title: t('cab.competence.profileTour.save.title', 'Save & Sync'),
      description: t(
        'cab.competence.profileTour.save.description',
        'Save modifications to synchronize them across the CAB personnel register and competence evaluation portal.'
      ),
      side: 'top',
      align: 'end',
    },
  ]
}
