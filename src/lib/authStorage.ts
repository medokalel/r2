import type { LoginResponseData, OrganizationType } from '@/lib/api/authApi'
import { isOnboardingComplete } from '@/lib/onboardingStatus'
import { AUTHENTICATED_HOME, ROUTES } from '@/lib/routes'
import { isPlatformRole } from '@/lib/subscriptionFeatures'
import type { PlatformRole } from '@/lib/api/platformTypes'
const TOKEN_KEY = 'icasco_auth_token'
const SESSION_KEY = 'icasco_auth_session'

/*
 * Impersonation (platform support signed in to a CAB workspace). Kept in this tab's
 * sessionStorage only and read before the normal session, so a platform admin's own
 * session (possibly in localStorage) never shadows it and other tabs are unaffected.
 */
const IMP_TOKEN_KEY = 'icasco_impersonation_token'
const IMP_SESSION_KEY = 'icasco_impersonation_session'
const IMP_INFO_KEY = 'icasco_impersonation_info'
/** One-shot hand-off from the platform tab to the CAB tab it opens (localStorage is shared between tabs). */
const IMP_HANDOFF_KEY = 'icasco_impersonation_handoff'

export interface ImpersonationInfo {
  tenantId: string
  tenantName: string
  reason: string
  /** ISO time the impersonation token expires. */
  endsAt: string
  /** Platform user who started it. */
  by: string
}

interface ImpersonationHandoff {
  token: string
  session: LoginResponseData
  info: ImpersonationInfo
  createdAt: number
}

function safeGet(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function clearImpersonationKeys(): void {
  try {
    sessionStorage.removeItem(IMP_TOKEN_KEY)
    sessionStorage.removeItem(IMP_SESSION_KEY)
    sessionStorage.removeItem(IMP_INFO_KEY)
  } catch {
    // storage blocked — nothing to clear
  }
}

/** The active impersonation of this tab, or null (an expired one is cleared). */
export function getImpersonation(): ImpersonationInfo | null {
  const raw = safeGet(sessionStorage, IMP_INFO_KEY)
  if (!raw) return null
  try {
    const info = JSON.parse(raw) as ImpersonationInfo
    if (!info.endsAt || new Date(info.endsAt).getTime() <= Date.now()) {
      clearImpersonationKeys()
      return null
    }
    return info
  } catch {
    clearImpersonationKeys()
    return null
  }
}

/** Ends the impersonation of this tab (the platform session in other tabs stays). */
export function endImpersonation(): void {
  clearImpersonationKeys()
}

/** Platform tab: leaves the impersonation token for the CAB tab about to open. */
export function stageImpersonationHandoff(token: string, session: LoginResponseData, info: ImpersonationInfo): void {
  const handoff: ImpersonationHandoff = { token, session: { ...session, token }, info, createdAt: Date.now() }
  localStorage.setItem(IMP_HANDOFF_KEY, JSON.stringify(handoff))
}

/** CAB tab: takes the staged hand-off (valid for two minutes) and starts the impersonation. */
export function consumeImpersonationHandoff(): ImpersonationInfo | null {
  const raw = safeGet(localStorage, IMP_HANDOFF_KEY)
  if (!raw) return null
  try {
    localStorage.removeItem(IMP_HANDOFF_KEY)
    const handoff = JSON.parse(raw) as ImpersonationHandoff
    if (!handoff.token || Date.now() - handoff.createdAt > 120_000) return null
    sessionStorage.setItem(IMP_TOKEN_KEY, handoff.token)
    sessionStorage.setItem(IMP_SESSION_KEY, JSON.stringify(handoff.session))
    sessionStorage.setItem(IMP_INFO_KEY, JSON.stringify(handoff.info))
    return getImpersonation()
  } catch {
    return null
  }
}

export function saveAuthSession(data: LoginResponseData, remember: boolean): void {
  // Always clear the other storage first: otherwise a stale token in
  // localStorage would shadow the fresh sessionStorage token (getAuthToken
  // reads localStorage first) and the user gets kicked back to /login.
  if (remember) {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(SESSION_KEY)
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(SESSION_KEY, JSON.stringify(data))
  } else {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.setItem(TOKEN_KEY, data.token)
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
  }
}

export function getAuthToken(): string | null {
  if (getImpersonation()) {
    const impersonationToken = safeGet(sessionStorage, IMP_TOKEN_KEY)
    if (impersonationToken) return impersonationToken
  }
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
}

export function getAuthSession(): LoginResponseData | null {
  const impersonated = getImpersonation() ? safeGet(sessionStorage, IMP_SESSION_KEY) : null
  const raw =
    impersonated ?? localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as LoginResponseData
  } catch {
    return null
  }
}

export function isAuditClientOrganization(
  organization?: { type?: string | null; legalCapacity?: string | null } | null,
): boolean {
  if (!organization?.type) return false
  const type = organization.type.toUpperCase()
  if (type === 'AUDIT_CLIENT') return true
  return (
    type === 'CONSULTATION_BODY' &&
    organization.legalCapacity?.trim().toLowerCase() === 'audit client'
  )
}

export function isAuditClientSession(session = getAuthSession()): boolean {
  return isAuditClientOrganization(session?.organization)
}

function roleNameOf(session: LoginResponseData | null | undefined): string {
  return (session?.user?.role?.name ?? session?.role?.name ?? '').toUpperCase()
}

/** iCASCO platform staff: a platform role, or the `platform: true` flag of the login payload / JWT. */
export function isPlatformSession(session: LoginResponseData | null | undefined = getAuthSession()): boolean {
  if (!session) return false
  return (session as { platform?: boolean }).platform === true || isPlatformRole(roleNameOf(session))
}

/** Role of a platform session; a flagged session without a platform role gets the least privileged one. */
export function getPlatformRole(session: LoginResponseData | null | undefined = getAuthSession()): PlatformRole | null {
  if (!isPlatformSession(session)) return null
  const role = roleNameOf(session)
  return isPlatformRole(role) ? role : 'PLATFORM_SUPPORT'
}

/** After login, platform staff land in the platform console and unfinished onboarding goes to
 *  the shared wizard. Audit clients land in the client portal; every other onboarded account
 *  lands in the application workspace. */
export function getPostLoginRedirect(session: LoginResponseData): string {
  if (isPlatformSession(session)) {
    return ROUTES.platform
  }

  if (isAuditClientSession(session)) {
    return ROUTES.portalHome
  }

  const roleName = (session?.user?.role?.name ?? session?.role?.name)?.toUpperCase()
  const isOwnerOrCabAdmin =
    roleName === 'OWNER' ||
    roleName === 'CAB_ADMIN' ||
    roleName === 'ADMIN' ||
    session.organization?.type === 'CERTIFICATION_BODY'

  // CAB admin / OWNER with completed setup goes straight to the workspace
  if (session.cab?.setupCompleted || isOwnerOrCabAdmin) {
    if (session.cab && session.cab.setupCompleted === false && !isOwnerOrCabAdmin) {
      return ROUTES.onboarding
    }
    return ROUTES.workspace
  }

  if (session.cab && !session.cab.setupCompleted) {
    return ROUTES.onboarding
  }

  const org = session.organization
  if (org && !isOnboardingComplete(org.id, org.onboardingStatus)) {
    return ROUTES.onboarding
  }
  if (org?.type === 'ACCREDITATION_BODY') {
    return ROUTES.abDashboard
  }
  return AUTHENTICATED_HOME
}

export function clearAuthSession(): void {
  // Signing out of an impersonated workspace ends the impersonation only; the
  // platform user's own session (shared localStorage) stays signed in.
  if (getImpersonation()) {
    clearImpersonationKeys()
    return
  }
  clearImpersonationKeys()
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}

export function patchAuthOrganizationType(type: OrganizationType): void {
  const session = getAuthSession()
  if (!session?.organization) return

  const nextSession: LoginResponseData = {
    ...session,
    organization: { ...session.organization, type },
  }

  if (localStorage.getItem(SESSION_KEY)) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
    return
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
}

export function patchCabSetupCompleted(setupCompleted: boolean): void {
  const session = getAuthSession()
  if (!session?.cab) return

  const nextSession: LoginResponseData = {
    ...session,
    cab: { ...session.cab, setupCompleted },
  }

  if (localStorage.getItem(SESSION_KEY)) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
    return
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
}

export function isCabUserOnboarded(): boolean {
  const session = getAuthSession()
  const roleName = (session?.user?.role?.name ?? session?.role?.name)?.toUpperCase()
  if (roleName === 'OWNER' || roleName === 'CAB_ADMIN' || roleName === 'ADMIN') {
    return true
  }
  return session?.cab?.setupCompleted === true
}
