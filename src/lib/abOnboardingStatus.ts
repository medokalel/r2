const KEY_PREFIX = 'icasco_ab_onboarding_complete_'

// ponytail: client-side-only flag until the backend exposes a real
// onboardingCompleted field on the AB organization — swap these two
// functions for a real API read/write then, callers don't change.
export function isAbOnboardingComplete(organizationId: string): boolean {
  return localStorage.getItem(KEY_PREFIX + organizationId) === 'true'
}

export function markAbOnboardingComplete(organizationId: string): void {
  localStorage.setItem(KEY_PREFIX + organizationId, 'true')
}
