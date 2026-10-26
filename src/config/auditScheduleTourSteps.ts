import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useAuditScheduleTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'audit-schedule-header',
      step: 1,
      totalSteps: 5,
      title: t('cab.auditSchedule.tour.header.title', 'Audit Schedule Overview'),
      description: t(
        'cab.auditSchedule.tour.header.description',
        'Plan and manage audit operations, review schedules, and track stages across clients and certification standards.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'audit-schedule-view-toggle',
      step: 2,
      totalSteps: 5,
      title: t('cab.auditSchedule.tour.viewToggle.title', 'List & Calendar Views'),
      description: t(
        'cab.auditSchedule.tour.viewToggle.description',
        'Toggle between a detailed tabular list view and an interactive monthly calendar view.'
      ),
      side: 'bottom',
      align: 'end',
    },
    {
      id: 'audit-schedule-filters',
      step: 3,
      totalSteps: 5,
      title: t('cab.auditSchedule.tour.filters.title', 'Search & Filtering'),
      description: t(
        'cab.auditSchedule.tour.filters.description',
        'Search audits by reference or client name, and filter by period, country, and operational status.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'audit-schedule-create-btn',
      step: 4,
      totalSteps: 5,
      title: t('cab.auditSchedule.tour.createPlan.title', 'Create Audit Plan'),
      description: t(
        'cab.auditSchedule.tour.createPlan.description',
        'Initialize a new audit plan for any client, selecting standard, stage, dates, and lead auditor.'
      ),
      side: 'bottom',
      align: 'end',
    },
    {
      id: 'audit-schedule-table',
      step: 5,
      totalSteps: 5,
      title: t('cab.auditSchedule.tour.table.title', 'Audit Plans Table & Actions'),
      description: t(
        'cab.auditSchedule.tour.table.description',
        'Access audit plans, configure full schedules & agendas, view site allocations, and export records.'
      ),
      side: 'top',
      align: 'start',
    },
  ]
}
