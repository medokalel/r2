/**
 * Opening a CAB workspace as iCASCO support (POST /platform/tenants/:id/impersonate).
 *
 * The platform tab stages the short-lived token in localStorage and opens `#/impersonate`
 * in a new tab; that tab moves it into its own sessionStorage (authStorage.ts), so the
 * platform session keeps working in the first tab and the CAB banner shows who is signed in.
 */
import type { LoginResponseData } from '@/lib/api/authApi'
import type { ImpersonationResult } from '@/lib/api/platformTypes'
import { getAuthSession, stageImpersonationHandoff } from '@/lib/authStorage'
import { ROUTES } from '@/lib/routes'

function isLoginSession(value: unknown): value is LoginResponseData {
  return Boolean(value && typeof value === 'object' && 'user' in value && (value as LoginResponseData).user?.id)
}

/** The tenant's CAB-admin session: the one the backend sends, or one built from the tenant. */
export function buildImpersonatedSession(result: ImpersonationResult, tenant: { id: string; name: string }): LoginResponseData {
  if (isLoginSession(result.session)) return { ...result.session, token: result.token }
  const role = { id: 'impersonated-cab-admin', name: 'CAB_ADMIN' }
  return {
    token: result.token,
    user: { id: `impersonated-${tenant.id}`, email: getAuthSession()?.user?.email ?? 'support@icasco.io', phone: null, status: 'ACTIVE', role },
    role,
    organization: {
      membershipId: `impersonation-${tenant.id}`,
      status: 'ACTIVE',
      id: tenant.id,
      name: tenant.name,
      type: 'CERTIFICATION_BODY',
      onboardingStatus: 'COMPLETED',
      onboardingCompleted: true,
    },
    cab: { id: tenant.id, setupCompleted: true, status: 'ACTIVE' },
  }
}

/** URL of the hand-off page in this app (hash router). */
export function impersonationUrl(): string {
  return `${window.location.href.split('#')[0]}#${ROUTES.impersonate}`
}

/** Stages the hand-off and points the (already opened) tab at it. */
export function launchImpersonation(
  target: Window | null,
  result: ImpersonationResult,
  tenant: { id: string; name: string },
  reason: string,
): boolean {
  const session = buildImpersonatedSession(result, tenant)
  stageImpersonationHandoff(result.token, session, {
    tenantId: tenant.id,
    tenantName: result.tenant?.name ?? tenant.name,
    reason,
    endsAt: result.expiresAt,
    by: getAuthSession()?.user?.email ?? '',
  })
  const url = impersonationUrl()
  if (target && !target.closed) {
    target.location.href = url
    return true
  }
  return Boolean(window.open(url, '_blank'))
}
