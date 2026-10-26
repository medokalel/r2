const KEY_PREFIX = 'icasco_auditee_onboarding_complete_'

// ponytail: client-side-only flag until the backend exposes a real
// onboardingCompleted field on the Auditee organization — swap these two
// functions for a real API read/write then, callers don't change.
export function isAuditeeOnboardingComplete(organizationId: string): boolean {
  return localStorage.getItem(KEY_PREFIX + organizationId) === 'true'
}

export function markAuditeeOnboardingComplete(organizationId: string): void {
  localStorage.setItem(KEY_PREFIX + organizationId, 'true')
}
