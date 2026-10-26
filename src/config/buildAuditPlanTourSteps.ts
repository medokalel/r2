import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useBuildAuditPlanTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'build-plan-header',
      step: 1,
      totalSteps: 7,
      title: t('cab.buildAuditPlan.tour.header.title', 'Audit Plan Overview'),
      description: t(
        'cab.buildAuditPlan.tour.header.description',
        'Review the plan number, version status, save draft changes, check readiness, or send the finalized plan to the client.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'build-plan-summary-bar',
      step: 2,
      totalSteps: 7,
      title: t('cab.buildAuditPlan.tour.summaryBar.title', 'Key Audit Indicators'),
      description: t(
        'cab.buildAuditPlan.tour.summaryBar.description',
        'Quickly inspect the client entity, certification standard, reviewed audit duration in days, audit site, and primary contact.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'build-plan-details',
      step: 3,
      totalSteps: 7,
      title: t('cab.buildAuditPlan.tour.auditDetails.title', 'Audit Schedule & Team'),
      description: t(
        'cab.buildAuditPlan.tour.auditDetails.description',
        'Configure the audit stage, proposed start and end dates, timezone, lead auditor, and allocate qualified team members.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'build-plan-objectives',
      step: 4,
      totalSteps: 7,
      title: t('cab.buildAuditPlan.tour.objectives.title', 'Objectives & Scope Summary'),
      description: t(
        'cab.buildAuditPlan.tour.objectives.description',
        'Define explicit audit objectives and confirm the facility scope summary covering processes, products, and standards.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'build-plan-tabs',
      step: 5,
      totalSteps: 7,
      title: t('cab.buildAuditPlan.tour.tabs.title', 'Planning Sections Navigation'),
      description: t(
        'cab.buildAuditPlan.tour.tabs.description',
        'Switch between detailed agenda timetable, site allocation, remote audit activities, travel notes, and team declarations.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'build-plan-agenda-table',
      step: 6,
      totalSteps: 7,
      title: t('cab.buildAuditPlan.tour.agenda.title', 'Audit Agenda Timetable'),
      description: t(
        'cab.buildAuditPlan.tour.agenda.description',
        'Add, edit, or remove agenda activities with exact dates, time blocks, assigned auditors, and total calculated duration.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'build-plan-side-cards',
      step: 7,
      totalSteps: 7,
      title: t('cab.buildAuditPlan.tour.sideCards.title', 'Site, Remote & Declarations'),
      description: t(
        'cab.buildAuditPlan.tour.sideCards.description',
        'Manage site addresses, configure remote platforms, record logistics notes, and verify team conflict-of-interest declarations.'
      ),
      side: 'top',
      align: 'start',
    },
  ]
}
