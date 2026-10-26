import type { TFunction } from 'i18next'
import { ApiError } from '@/lib/api/client'
import { getUserErrorMessage } from '@/lib/errorMessages'

/** Business-rule codes the workflow endpoints put at the start of their error message. */
const CODE_MESSAGES: Record<string, [key: string, fallback: string]> = {
  APPROVAL_SEPARATION: ['cab.workflow.errors.approvalSeparation', 'A different CAB user than the preparer (or the CAB administrator) must approve this.'],
  QUOTATION_APPROVAL_REQUIRED: ['cab.workflow.errors.approvalRequired', 'The quotation needs internal approval before it can be issued.'],
  QUOTATION_APPROVAL_STATE: ['cab.workflow.errors.approvalState', 'The approval status has changed. Refresh and try again.'],
  QUOTATION_NOT_OPEN: ['cab.workflow.errors.quotationNotOpen', 'This quotation has already been issued or closed.'],
  OFFER_LINKED_TO_QUOTATION: ['cab.workflow.errors.offerLinked', 'This offer follows its quotation. Revise the quotation instead.'],
  OFFER_NOT_REVISABLE: ['cab.workflow.errors.offerNotRevisable', 'Accepted or void offers cannot be revised.'],
  OFFER_INVALID_TRANSITION: ['cab.workflow.errors.offerTransition', 'This action is not available for the offer in its current status.'],
  REMINDER_RATE_LIMIT: ['cab.workflow.errors.reminderRateLimit', 'A reminder was already sent in the last 24 hours.'],
  REMINDER_NOT_NEEDED: ['cab.workflow.errors.reminderNotNeeded', 'The client has already answered this request.'],
  AUDIT_LOG_FROM_PLAN: ['cab.workflow.errors.auditLogFromPlan', 'Only the result of an entry recorded from an audit plan can change.'],
}

/**
 * Message to show for a failed workflow action: the business rule in plain words when the
 * API sent a known code, the API message for other 409/422 rule violations, else the
 * standard error text.
 */
export function workflowErrorMessage(error: unknown, t: TFunction): string {
  if (error instanceof ApiError) {
    const code = Object.keys(CODE_MESSAGES).find((key) => error.message.startsWith(key))
    if (code) {
      const [key, fallback] = CODE_MESSAGES[code]
      return t(key, fallback)
    }
    if (error.status === 409 || error.status === 422 || error.status === 429) return error.message
  } else if (error instanceof Error && error.message && !(error instanceof TypeError)) {
    return error.message
  }
  return getUserErrorMessage(error, t)
}
