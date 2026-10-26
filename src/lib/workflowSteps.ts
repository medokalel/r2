import type { TFunction } from 'i18next'

export type WorkflowStepStatus = 'completed' | 'inProgress' | 'pending'

export interface WorkflowStep {
  key: string
  label: string
  description: string
  status: WorkflowStepStatus
}

/** Canonical CAB workflow — same 12 steps shown on every CAB application page. */
export const CAB_WORKFLOW_STEP_KEYS = [
  'application',
  'applicationReview',
  'quotation',
  'applicationReceipt',
  'quotationApproval',
  'payment',
  'invoicing',
  'contracting',
  'auditPlanning',
  'auditExecution',
  'reporting',
  'surveillance',
] as const

export type CabWorkflowStepKey = (typeof CAB_WORKFLOW_STEP_KEYS)[number]

/** Steps shown while registering a new client (before an application exists yet). */
export const CLIENT_WORKFLOW_STEP_KEYS = [
  'application',
  'applicationReview',
  'quotation',
  'contracting',
  'financial',
  'auditPlanning',
  'auditExecution',
  'auditReporting',
  'certificationDecision',
  'surveillanceProgramme',
] as const

export type ClientWorkflowStepKey = (typeof CLIENT_WORKFLOW_STEP_KEYS)[number]

function statusFor(index: number, activeIndex: number): WorkflowStepStatus {
  return index < activeIndex ? 'completed' : index === activeIndex ? 'inProgress' : 'pending'
}

export function buildCabWorkflowSteps(t: TFunction, activeStep: CabWorkflowStepKey): WorkflowStep[] {
  const activeIndex = CAB_WORKFLOW_STEP_KEYS.indexOf(activeStep)
  return CAB_WORKFLOW_STEP_KEYS.map((key, index) => ({
    key,
    label: t(`cab.applications.receipt.workflowSteps.${key}`),
    description: t(`cab.applications.receipt.workflowStepDescriptions.${key}`),
    status: statusFor(index, activeIndex),
  }))
}

export function buildClientWorkflowSteps(t: TFunction, activeStep: ClientWorkflowStepKey): WorkflowStep[] {
  const activeIndex = CLIENT_WORKFLOW_STEP_KEYS.indexOf(activeStep)
  return CLIENT_WORKFLOW_STEP_KEYS.map((key, index) => ({
    key,
    label: t(`cab.clientRegistration.workflow.steps.${key}.title`),
    description: t(`cab.clientRegistration.workflow.steps.${key}.description`),
    status: statusFor(index, activeIndex),
  }))
}