import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function usePortalHomeTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'portal-home-header',
      step: 1,
      totalSteps: 5,
      title: t('portal.home.tour.header.title', 'Client Account Overview'),
      description: t(
        'portal.home.tour.header.description',
        'View your registered company details, active certification status, primary contact information, and quick profile management.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'portal-home-application-card',
      step: 2,
      totalSteps: 5,
      title: t('portal.home.tour.appCard.title', 'Certification Applications'),
      description: t(
        'portal.home.tour.appCard.description',
        'Track live progress of your active certification schemes, review draft submissions, and resume incomplete applications.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'portal-home-clarification-card',
      step: 3,
      totalSteps: 5,
      title: t('portal.home.tour.clarificationCard.title', 'Information & Clarification Requests'),
      description: t(
        'portal.home.tour.clarificationCard.description',
        'Review and respond to technical clarification requests from auditors before stated deadlines to avoid review delays.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'portal-home-audit-card',
      step: 4,
      totalSteps: 5,
      title: t('portal.home.tour.auditCard.title', 'Upcoming Audits & Visits'),
      description: t(
        'portal.home.tour.auditCard.description',
        'Check upcoming audit stages, dates, and confirmed facilities to ensure site readiness for audit teams.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'portal-home-activity-contacts',
      step: 5,
      totalSteps: 5,
      title: t('portal.home.tour.activityContacts.title', 'Activity Log & CAB Team'),
      description: t(
        'portal.home.tour.activityContacts.description',
        'Monitor audit trail history, uploaded records, and directly reach your assigned CAB account manager and lead auditors.'
      ),
      side: 'top',
      align: 'start',
    },
  ]
}
