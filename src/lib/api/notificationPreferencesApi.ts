/**
 * Notification preferences of the signed-in person ("My profile → Notifications").
 * Real endpoints: GET /users/me/notification-preferences,
 *                 PATCH /users/me/notification-preferences { email?: {<group>: bool}, sms?: {<group>: bool} }
 *
 * In-app notifications (the bell) are always on. Email and SMS are chosen per type group;
 * the server sends them from an outbox (bilingual email, SMS through Unifonic). Defaults: email on
 * for every group except routine updates, SMS off (opt-in). In the preview (demo mode) the
 * choices are kept in localStorage per signed-in user.
 */
import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { getAuthSession, isAuditClientSession } from '@/lib/authStorage'

export const NOTIFICATION_GROUPS = ['requests', 'findings', 'certification', 'billing', 'updates'] as const
export type NotificationGroup = (typeof NOTIFICATION_GROUPS)[number]
export type GroupChoices = Record<NotificationGroup, boolean>

export interface NotificationPreferences {
  /** Always true — in-app notifications cannot be switched off. */
  inApp: true
  /** Groups this account can receive (clients have no "updates"). */
  groups: NotificationGroup[]
  email: GroupChoices
  sms: GroupChoices
  channels: {
    email: { available: boolean; address: string }
    /** `phone` is the masked mobile number used for SMS ('' when none). */
    sms: { available: boolean; phone: string }
  }
}

export interface NotificationPreferencesPatch {
  email?: Partial<GroupChoices>
  sms?: Partial<GroupChoices>
}

const DEFAULT_EMAIL: GroupChoices = { requests: true, findings: true, certification: true, billing: true, updates: false }
const DEFAULT_SMS: GroupChoices = { requests: false, findings: false, certification: false, billing: false, updates: false }

const demoKey = () => `icasco_notification_prefs_${getAuthSession()?.user?.id ?? 'demo'}`

function demoPreferences(): NotificationPreferences {
  let stored: Partial<Pick<NotificationPreferences, 'email' | 'sms'>> = {}
  try {
    stored = JSON.parse(localStorage.getItem(demoKey()) ?? '{}') as typeof stored
  } catch {
    stored = {}
  }
  const session = getAuthSession()
  const phone = (session?.user?.phone ?? '').replace(/\D/g, '')
  return {
    inApp: true,
    groups: isAuditClientSession(session) ? NOTIFICATION_GROUPS.filter((g) => g !== 'updates') : [...NOTIFICATION_GROUPS],
    email: { ...DEFAULT_EMAIL, ...stored.email },
    sms: { ...DEFAULT_SMS, ...stored.sms },
    channels: {
      email: { available: true, address: session?.user?.email ?? '' },
      sms: { available: true, phone: phone ? `+${phone.slice(0, 3)} ••• ${phone.slice(-4)}` : '' },
    },
  }
}

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  if (!isDemoMode()) return authorizedRequest<NotificationPreferences>('/users/me/notification-preferences')
  await delay()
  return demoPreferences()
}

export async function updateNotificationPreferences(patch: NotificationPreferencesPatch): Promise<NotificationPreferences> {
  if (!isDemoMode()) {
    return authorizedRequest<NotificationPreferences>('/users/me/notification-preferences', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
  }
  await delay()
  const current = demoPreferences()
  const next = { email: { ...current.email, ...patch.email }, sms: { ...current.sms, ...patch.sms } }
  try {
    localStorage.setItem(demoKey(), JSON.stringify(next))
  } catch {
    // preview only — the in-memory answer below still reflects the change
  }
  return { ...current, ...next }
}
