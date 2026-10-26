import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/tour/tourTypes'

export function useApplicationTechnicalFeasibilityTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'sidebar-app-feasibility',
      step: 1,
      totalSteps: 10,
      title: t('cab.tour.sidebarAppFeasibility.title', 'Technical Feasibility Icon'),
      description: t(
        'cab.tour.sidebarAppFeasibility.description',
        'Directly access technical feasibility evaluation, auditor competency, and resource availability.'
      ),
      side: 'right',
      align: 'start',
    },
    {
      id: 'header',
      step: 2,
      totalSteps: 10,
      title: t('cab.applications.technicalFeasibility.tour.header.title', 'Header & Control Bar'),
      description: t(
        'cab.applications.technicalFeasibility.tour.header.description',
        'Displays breadcrumb navigation, tour controls, notifications, and profile details.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'page-header',
      step: 3,
      totalSteps: 10,
      title: t(
        'cab.applications.technicalFeasibility.tour.pageHeader.title',
        'Technical Feasibility Title & Actions'
      ),
      description: t(
        'cab.applications.technicalFeasibility.tour.pageHeader.description',
        'View assessment status, download report, and proceed to quotation preparation.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'summary-card',
      step: 4,
      totalSteps: 10,
      title: t('cab.applications.technicalFeasibility.tour.summaryCard.title', 'Feasibility Summary'),
      description: t(
        'cab.applications.technicalFeasibility.tour.summaryCard.description',
        'Overview of client, application type, number of sites, requested date, and assigned evaluator.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'tabs',
      step: 5,
      totalSteps: 10,
      title: t('cab.applications.technicalFeasibility.tour.tabs.title', 'Feasibility Sections & Tabs'),
      description: t(
        'cab.applications.technicalFeasibility.tour.tabs.description',
        'Switch between Assessment Table, Documents, Review Comments, and History.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'assessment-table',
      step: 6,
      totalSteps: 10,
      title: t(
        'cab.applications.technicalFeasibility.tour.assessmentTable.title',
        'Technical Feasibility Assessment Table'
      ),
      description: t(
        'cab.applications.technicalFeasibility.tour.assessmentTable.description',
        'Detailed evaluation of technical competence, standards compliance, resources, and scope.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'comments-section',
      step: 7,
      totalSteps: 10,
      title: t(
        'cab.applications.technicalFeasibility.tour.commentsSection.title',
        'Technical Comments & Justifications'
      ),
      description: t(
        'cab.applications.technicalFeasibility.tour.commentsSection.description',
        'Review assessment notes, lead auditor justifications, and add internal evaluation comments.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'review-summary',
      step: 8,
      totalSteps: 10,
      title: t(
        'cab.applications.technicalFeasibility.tour.reviewSummary.title',
        'Feasibility Completion Indicator'
      ),
      description: t(
        'cab.applications.technicalFeasibility.tour.reviewSummary.description',
        'View overall evaluation completion percentage and number of feasible areas verified.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'audit-team',
      step: 9,
      totalSteps: 10,
      title: t(
        'cab.applications.technicalFeasibility.tour.auditTeam.title',
        'Audit Team, Resources & Recommendation'
      ),
      description: t(
        'cab.applications.technicalFeasibility.tour.auditTeam.description',
        'Inspect auditor competencies, technical experts, key info, and proceed to quotation.'
      ),
      side: 'left',
      align: 'start',
    },
    {
      id: 'workflow-progress',
      step: 10,
      totalSteps: 10,
      title: t('cab.applications.technicalFeasibility.tour.workflowProgress.title', 'Workflow Progress'),
      description: t(
        'cab.applications.technicalFeasibility.tour.workflowProgress.description',
        'Track stage progress and automatic transition to quotation preparation.'
      ),
      side: 'left',
      align: 'start',
    },
  ]
}
