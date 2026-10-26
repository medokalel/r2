/**
 * Notifications API — GET /notifications, POST /notifications/:id/read, POST /notifications/read-all.
 *
 * The backend scopes the feed from the JWT (CAB staff → their CAB, client users → their
 * organization). In the preview (demo mode) the feed comes from the shared demo store.
 *
 * The backend sends a notification `type` plus its `params`; the text is
 * rendered from i18n (`notifications.types.<type>`), so both languages stay in
 * the frontend and the server never stores translated strings.
 */

import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { notificationStore, saveNotifications, sessionClientId } from '@/lib/api/demo/records'

export type NotificationAudience = 'cab' | 'client'

export type NotificationType =
  // CAB side
  | 'application_received'
  | 'information_responded'
  | 'quotation_pending_approval'
  | 'audit_plan_pending_approval'
  | 'nonconformity_response_received'
  | 'decision_ready'
  | 'invoice_overdue'
  | 'offer_accepted'
  | 'offer_rejected'
  // Client side
  | 'offer_awaiting_acceptance'
  | 'information_requested'
  | 'audit_plan_to_confirm'
  | 'nonconformity_response_due'
  | 'invoice_due'
  | 'certificate_issued'
  | 'information_reminder'
  | 'certificate_reinstated'
  // Certification agreements (CAB: drafted, signed by client; client: to sign, active, terminated)
  | 'agreement_drafted'
  | 'agreement_signed_by_client'
  | 'agreement_to_sign'
  | 'agreement_active'
  | 'agreement_terminated'
  // Stage reports (client: report issued; CAB: client acknowledged it)
  | 'audit_report_issued'
  | 'audit_report_acknowledged'
  // Audit team selection & impartiality (CAB): team confirmed, exception requested / decided, declaration to review
  | 'audit_team_assigned'
  | 'team_exception_requested'
  | 'team_exception_decided'
  | 'impartiality_declared'

export interface AppNotification {
  id: string
  type: NotificationType
  /** Values interpolated into the i18n text, e.g. { ref: 'APP-0148', client: 'Tower One FM' } */
  params: Record<string, string>
  /** In-app route to open when the notification is clicked */
  link: string
  createdAt: string // ISO 8601
  read: boolean
}

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

// Notifications live in the shared demo store; lifecycle actions elsewhere
// (submitting, requesting information, issuing an offer …) add to it
// (lib/api/demo/records.ts). A client sees only its own notifications.
function feed(audience: NotificationAudience) {
  const list = notificationStore()[audience]
  const clientId = sessionClientId()
  return audience === 'client' && clientId ? list.filter((n) => !n.clientId || n.clientId === clientId) : list
}

export async function fetchNotifications(audience: NotificationAudience): Promise<AppNotification[]> {
  if (!isDemoMode()) return authorizedRequest<AppNotification[]>('/notifications')
  await delay()
  return feed(audience).map((n) => {
    const copy: AppNotification & { clientId?: string } = { ...n }
    delete copy.clientId
    return copy
  })
}

export async function markNotificationRead(audience: NotificationAudience, id: string): Promise<void> {
  if (!isDemoMode()) {
    await authorizedRequest(`/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' })
    return
  }
  await delay(80)
  const item = notificationStore()[audience].find((n) => n.id === id)
  if (item) item.read = true
  saveNotifications()
}

export async function markAllNotificationsRead(audience: NotificationAudience): Promise<void> {
  if (!isDemoMode()) {
    await authorizedRequest('/notifications/read-all', { method: 'POST' })
    return
  }
  await delay(80)
  feed(audience).forEach((n) => { n.read = true })
  saveNotifications()
}
