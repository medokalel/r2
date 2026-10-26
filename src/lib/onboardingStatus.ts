import { isAbOnboardingComplete } from '@/lib/abOnboardingStatus'
import { isAuditeeOnboardingComplete } from '@/lib/auditeeOnboardingStatus'
import { isCabOnboardingComplete } from '@/lib/cabOnboardingStatus'

const KEY_PREFIX = 'icasco_onboarding_complete_'

export function isOnboardingComplete(
  organizationId: string,
  serverStatus?: 'DRAFT' | 'COMPLETED' | null
): boolean {
  // Server is the source of truth when it speaks.
  if (serverStatus === 'COMPLETED') return true
  // DRAFT + local "complete" flag = a previous successful onboarding on this
  // device (backend has no unified status yet) → trust the local flag.
  // DRAFT with no local flag = genuinely unfinished → onboarding.
  if (serverStatus === 'DRAFT') {
    return (
      localStorage.getItem(KEY_PREFIX + organizationId) === 'true' ||
      isCabOnboardingComplete(organizationId) ||
      isAbOnboardingComplete(organizationId) ||
      isAuditeeOnboardingComplete(organizationId)
    )
  }

  return (
    localStorage.getItem(KEY_PREFIX + organizationId) === 'true' ||
    isCabOnboardingComplete(organizationId) ||
    isAbOnboardingComplete(organizationId) ||
    isAuditeeOnboardingComplete(organizationId)
  )
}

export function markOnboardingComplete(organizationId: string): void {
  localStorage.setItem(KEY_PREFIX + organizationId, 'true')
}
