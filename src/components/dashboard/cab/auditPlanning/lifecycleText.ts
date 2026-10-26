import type { TFunction } from 'i18next'
import type { AuditPlan, AuditPlanTransition, AuditPlanTransitionBlock } from '@/lib/api/cabAuditPlanningApi'

/** Labels and messages of the audit-plan lifecycle actions (build page + plan list). */

export const AUDIT_PLAN_ACTIONS: AuditPlanTransition[] = ['start', 'review', 'complete']

/** Workspace route of the plan's audit report. */
export const auditReportPath = (reportId: string) => `/cab/audit-reporting/workspace?reportId=${encodeURIComponent(reportId)}`

export function auditPlanActionLabel(t: TFunction, action: AuditPlanTransition): string {
  switch (action) {
    case 'start':
      return t('cab.auditPlanning.lifecycle.start', 'Start audit')
    case 'review':
      return t('cab.auditPlanning.lifecycle.review', 'Send for review')
    default:
      return t('cab.auditPlanning.lifecycle.complete', 'Mark completed')
  }
}

export function auditPlanBlockText(t: TFunction, block: AuditPlanTransitionBlock): string {
  switch (block) {
    case 'notSent':
      return t('cab.auditPlanning.lifecycle.blockNotSent', 'Send the plan to the client first.')
    case 'notStarted':
      return t('cab.auditPlanning.lifecycle.blockNotStarted', 'Start the audit first.')
    case 'completed':
      return t('cab.auditPlanning.lifecycle.blockCompleted', 'The audit is completed.')
    case 'alreadyDone':
      return t('cab.auditPlanning.lifecycle.blockDone', 'Already done for this plan.')
    default:
      return ''
  }
}

export function confirmText(t: TFunction, action: AuditPlanTransition, plan: AuditPlan): string {
  switch (action) {
    case 'start':
      return t('cab.auditPlanning.lifecycle.confirmStart', {
        defaultValue: 'Start audit {{number}}? Its status becomes "In progress" and the audit report opens for the team.',
        number: plan.planNumber,
      })
    case 'review':
      return t('cab.auditPlanning.lifecycle.confirmReview', {
        defaultValue: 'Send audit {{number}} for review? The status becomes "Under review" while the report is finalized.',
        number: plan.planNumber,
      })
    default:
      return t('cab.auditPlanning.lifecycle.confirmComplete', {
        defaultValue: 'Mark audit {{number}} as completed? The plan becomes read-only and the audit is added to the competence log of each team member.',
        number: plan.planNumber,
      })
  }
}

export function successText(t: TFunction, action: AuditPlanTransition, plan: AuditPlan): string {
  switch (action) {
    case 'start':
      return plan.reportId
        ? t('cab.auditPlanning.lifecycle.startedWithReport', 'Audit started. The audit report is open.')
        : t('cab.auditPlanning.lifecycle.started', 'Audit started.')
    case 'review':
      return t('cab.auditPlanning.lifecycle.reviewed', 'Audit sent for review.')
    default:
      return t('cab.auditPlanning.lifecycle.completed', {
        defaultValue: 'Audit completed and added to the competence log of {{count}} team member(s).',
        count: plan.auditTeam.length || 1,
      })
  }
}
