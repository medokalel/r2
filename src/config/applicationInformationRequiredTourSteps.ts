import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useApplicationInformationRequiredTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'sidebar-app-info',
      step: 1,
      totalSteps: 8,
      title: t('cab.tour.sidebarAppInfo.title', 'Information Required Icon'),
      description: t(
        'cab.tour.sidebarAppInfo.description',
        'Track missing items and required documentation to be fulfilled by the client.'
      ),
      side: 'right',
      align: 'start',
    },
    {
      id: 'header',
      step: 2,
      totalSteps: 8,
      title: t('cab.applications.informationRequired.tour.header.title', 'Header & Control Bar'),
      description: t(
        'cab.applications.informationRequired.tour.header.description',
        'Displays breadcrumb navigation, tour controls, notifications, and profile details.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'page-header',
      step: 3,
      totalSteps: 8,
      title: t(
        'cab.applications.informationRequired.tour.pageHeader.title',
        'Information Required Title & Actions'
      ),
      description: t(
        'cab.applications.informationRequired.tour.pageHeader.description',
        'View current request status, send reminders to the client, or download request packages.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'summary-card',
      step: 4,
      totalSteps: 8,
      title: t('cab.applications.informationRequired.tour.summaryCard.title', 'Request Summary'),
      description: t(
        'cab.applications.informationRequired.tour.summaryCard.description',
        'Overview of client, application type, requested date, and requester details.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'requests-table',
      step: 5,
      totalSteps: 8,
      title: t('cab.applications.informationRequired.tour.requestsTable.title', 'Requested Items Table'),
      description: t(
        'cab.applications.informationRequired.tour.requestsTable.description',
        'Review missing items, clause references, requester, due date, and priority level.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'client-responses',
      step: 6,
      totalSteps: 8,
      title: t(
        'cab.applications.informationRequired.tour.clientResponses.title',
        'Client Responses & Attachments'
      ),
      description: t(
        'cab.applications.informationRequired.tour.clientResponses.description',
        'Review responses and uploaded files received from the client for verification.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'internal-comments',
      step: 7,
      totalSteps: 8,
      title: t(
        'cab.applications.informationRequired.tour.internalComments.title',
        'Internal Team Comments'
      ),
      description: t(
        'cab.applications.informationRequired.tour.internalComments.description',
        'Add and track internal notes and instructions between assessment team members.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'workflow-progress',
      step: 8,
      totalSteps: 8,
      title: t('cab.applications.informationRequired.tour.workflowProgress.title', 'Workflow Progress'),
      description: t(
        'cab.applications.informationRequired.tour.workflowProgress.description',
        'Track stage status and pending client actions.'
      ),
      side: 'left',
      align: 'start',
    },
  ]
}
