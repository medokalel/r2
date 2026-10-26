import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useAuditReportingTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'audit-reporting-header',
      step: 1,
      totalSteps: 5,
      title: t('cab.auditReporting.tour.header.title', 'Audit Reporting Workspace'),
      description: t(
        'cab.auditReporting.tour.header.description',
        'Manage audit reporting stages, verify client scope, track findings, and finalize the formal audit report.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'audit-reporting-scope',
      step: 2,
      totalSteps: 5,
      title: t('cab.auditReporting.tour.scope.title', 'CAB-Client Audit Scope'),
      description: t(
        'cab.auditReporting.tour.scope.description',
        'Review the certified entity, standard clauses under assessment, facility location, and active audit stage.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'audit-reporting-tabs',
      step: 3,
      totalSteps: 5,
      title: t('cab.auditReporting.tour.tabs.title', 'Reporting Sections & Stages'),
      description: t(
        'cab.auditReporting.tour.tabs.description',
        'Navigate seamlessly across the Agenda timetable, Evidence tasks, Findings register, and Final Report assembly.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'audit-reporting-content',
      step: 4,
      totalSteps: 5,
      title: t('cab.auditReporting.tour.content.title', 'Execution & Findings Register'),
      description: t(
        'cab.auditReporting.tour.content.description',
        'Log objective evidence, record non-conformity findings, classify clauses, and export audit data.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'audit-reporting-gates',
      step: 5,
      totalSteps: 5,
      title: t('cab.auditReporting.tour.gates.title', 'Report Finalization & Gates'),
      description: t(
        'cab.auditReporting.tour.gates.description',
        'Validate all mandatory submission gates, formulate auditor recommendations, and freeze the version for technical review.'
      ),
      side: 'top',
      align: 'end',
    },
  ]
}
