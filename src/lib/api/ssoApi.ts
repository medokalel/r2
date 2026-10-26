/**
 * Single sign-on API.
 *
 * Sign-in (public):
 *   POST /auth/sso/discover {email}       → SsoDiscoverResult
 *   GET  /auth/sso/:id/start               browser navigation to the identity provider (ssoStartUrl)
 *   POST /auth/sso/exchange {code}         → LoginResponseData (the one-time code from /sso/complete?code=)
 * CAB admin (feature `sso`, 403 FEATURE_NOT_IN_PLAN otherwise):
 *   GET    /cab/sso/options                → SsoOptions
 *   GET    /cab/sso/connections            → SsoConnection[]
 *   POST   /cab/sso/connections            → SsoConnection
 *   GET    /cab/sso/connections/:id        → SsoConnection
 *   PATCH  /cab/sso/connections/:id        → SsoConnection
 *   DELETE /cab/sso/connections/:id
 *   POST   /cab/sso/connections/:id/verify-domain {domain} → SsoVerifyResult
 *   POST   /cab/sso/connections/:id/test   → { authorizationUrl, expiresAt } (opened in a popup)
 *   GET    /cab/sso/events?connectionId&limit → SsoAuditEvent[]
 *
 * In the preview (demo mode) everything runs against the demo store (lib/api/demo/ssoDemo.ts) and the
 * identity provider is simulated in-app by a consent screen (/sso/demo-idp).
 */

import { apiRequest, ApiError } from '@/lib/api/client'
import { API_BASE_URL } from '@/lib/api/config'
import { authorizedRequest } from '@/lib/api/authorizedClient'
import { login, type LoginResponseData } from '@/lib/api/authApi'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import * as demo from '@/lib/api/demo/ssoDemo'
import { emailDomain, SSO_ROUTES, safeRedirectPath, type SsoProtocol, type SsoProvider } from '@/lib/sso'

export interface SsoDomain {
  id: string
  domain: string
  verified: boolean
  verifiedAt: string | null
  verificationToken: string
  txtRecord: { host: string; type: 'TXT'; value: string }
  lastCheckedAt: string | null
  lastCheckError: string | null
}

export interface SsoAttributeMapping {
  email: string
  name: string
  groups: string
}

export interface SsoGroupRule {
  group: string
  role: string
}

export interface SsoTestOutcome {
  subject?: string
  claims?: Record<string, unknown>
  mapped?: { email: string | null; name: string | null; groups: string[]; role: string | null; matchedGroup: string | null }
  domainVerified?: boolean
  userExists?: boolean
  wouldProvision?: boolean
  warnings?: string[]
  code?: string
  error?: string
}

export interface SsoConnection {
  id: string
  scope: 'CAB' | 'ORGANIZATION' | 'PLATFORM'
  name: string
  protocol: SsoProtocol
  provider: SsoProvider
  status: 'ENABLED' | 'DISABLED'
  issuerUrl: string | null
  clientId: string | null
  /** The client secret itself is never returned. */
  hasSecret: boolean
  scopes: string
  samlMetadataUrl: string | null
  hasSamlMetadataXml: boolean
  samlIdpEntityId: string | null
  samlSsoUrl: string | null
  samlIdpCertificate: string | null
  attributeMapping: SsoAttributeMapping
  groupRoleMapping: SsoGroupRule[]
  defaultRole: string | null
  jitEnabled: boolean
  requireSso: boolean
  breakGlassUser: { id: string; name: string; email: string } | null
  domains: SsoDomain[]
  /** Values to paste into the identity provider. */
  sp: { redirectUri: string; acsUrl: string; entityId: string; metadataUrl: string; loginUrl: string }
  lastTest: { at: string; status: 'SUCCESS' | 'FAILED'; result: SsoTestOutcome | null } | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

/** Body of create / update. `clientSecret`: omit to keep, '' or null to clear. `domains` replaces the list. */
export interface SsoConnectionInput {
  name?: string
  provider?: SsoProvider
  status?: 'ENABLED' | 'DISABLED'
  issuerUrl?: string | null
  clientId?: string | null
  clientSecret?: string | null
  scopes?: string
  samlMetadataUrl?: string | null
  samlMetadataXml?: string | null
  samlIdpEntityId?: string | null
  samlSsoUrl?: string | null
  samlIdpCertificate?: string | null
  attributeMapping?: SsoAttributeMapping
  groupRoleMapping?: SsoGroupRule[]
  defaultRole?: string | null
  jitEnabled?: boolean
  requireSso?: boolean
  breakGlassUserId?: string | null
  domains?: string[]
}

export interface SsoOptions {
  roles: string[]
  providers: Array<{ key: SsoProvider; protocol: SsoProtocol; attributeMapping: SsoAttributeMapping; issuerUrl: string | null }>
  admins: Array<{ id: string; name: string; email: string }>
  txtPrefix: string
}

export interface SsoDiscoverResult {
  sso: boolean
  required: boolean
  connectionId?: string
  connectionName?: string
  protocol?: SsoProtocol
  provider?: SsoProvider
}

export interface SsoVerifyResult {
  verified: boolean
  domain: SsoDomain
  connection: SsoConnection
}

export interface SsoAuditEvent {
  id: string
  connectionId: string | null
  action: string
  email: string | null
  actor: { id: string; name: string; email: string } | null
  details: Record<string, unknown> | null
  ip: string | null
  createdAt: string
}

const json = (body: unknown): RequestInit => ({ body: JSON.stringify(body) })

/* ── Sign-in ─────────────────────────────────────────────────────────── */

export async function discoverSso(email: string): Promise<SsoDiscoverResult> {
  if (isDemoMode()) return demo.demoDiscover(email)
  return apiRequest<SsoDiscoverResult>('/auth/sso/discover', { method: 'POST', ...json({ email: email.trim() }) })
}

/** URL the browser opens to start a sign-in (real API) or the in-app consent screen (preview). */
export function ssoStartUrl(connectionId: string, { email, redirect }: { email?: string; redirect?: string | null } = {}): string {
  const params = new URLSearchParams()
  const path = safeRedirectPath(redirect)
  if (path) params.set('redirect', path)
  if (email) params.set(isDemoMode() ? 'email' : 'login_hint', email.trim())
  if (isDemoMode()) {
    params.set('connection', connectionId)
    return `#${SSO_ROUTES.demoIdp}?${params.toString()}`
  }
  const query = params.toString()
  return `${API_BASE_URL}/auth/sso/${encodeURIComponent(connectionId)}/start${query ? `?${query}` : ''}`
}

/** Exchanges the one-time code for the normal session (same body as POST /auth/login). */
export async function exchangeSsoCode(code: string): Promise<LoginResponseData> {
  if (isDemoMode()) {
    const email = demo.demoConsumeCode(code)
    // The preview's mock API turns any sign-in into the demo CAB session.
    return login(email, 'sso-demo-session')
  }
  return apiRequest<LoginResponseData>('/auth/sso/exchange', { method: 'POST', ...json({ code }) })
}

/**
 * Preview only: the mock API has no "Require SSO", so the demo store answers like the backend
 * (403 SSO_REQUIRED) before the password sign-in. With the real API this is a no-op: the server
 * enforces it on POST /auth/login.
 */
export async function ssoPasswordPrecheck(email: string): Promise<void> {
  if (!isDemoMode()) return
  const blocked = demo.demoPasswordBlocked(email)
  if (blocked) throw new ApiError('Your organization requires single sign-on.', 403, undefined, 'SSO_REQUIRED', { connectionId: blocked })
}

/* ── CAB admin ───────────────────────────────────────────────────────── */

export async function getSsoOptions(): Promise<SsoOptions> {
  if (isDemoMode()) return demo.demoOptions()
  return authorizedRequest<SsoOptions>('/cab/sso/options')
}

export async function listSsoConnections(): Promise<SsoConnection[]> {
  if (isDemoMode()) return demo.demoList()
  return authorizedRequest<SsoConnection[]>('/cab/sso/connections')
}

export async function getSsoConnection(id: string): Promise<SsoConnection> {
  if (isDemoMode()) return demo.demoGet(id)
  return authorizedRequest<SsoConnection>(`/cab/sso/connections/${encodeURIComponent(id)}`)
}

export async function createSsoConnection(input: SsoConnectionInput): Promise<SsoConnection> {
  if (isDemoMode()) return demo.demoCreate(input)
  return authorizedRequest<SsoConnection>('/cab/sso/connections', { method: 'POST', ...json(input) })
}

export async function updateSsoConnection(id: string, input: SsoConnectionInput): Promise<SsoConnection> {
  if (isDemoMode()) return demo.demoUpdate(id, input)
  return authorizedRequest<SsoConnection>(`/cab/sso/connections/${encodeURIComponent(id)}`, { method: 'PATCH', ...json(input) })
}

export async function deleteSsoConnection(id: string): Promise<void> {
  if (isDemoMode()) return demo.demoDelete(id)
  await authorizedRequest<unknown>(`/cab/sso/connections/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function verifySsoDomain(id: string, domain: string): Promise<SsoVerifyResult> {
  if (isDemoMode()) return demo.demoVerify(id, domain)
  return authorizedRequest<SsoVerifyResult>(`/cab/sso/connections/${encodeURIComponent(id)}/verify-domain`, { method: 'POST', ...json({ domain }) })
}

/** Starts "Test connection": open `authorizationUrl` in a popup; the result lands in `lastTest`. */
export async function startSsoTest(id: string): Promise<{ authorizationUrl: string; expiresAt: string }> {
  if (isDemoMode()) return demo.demoStartTest(id)
  return authorizedRequest<{ authorizationUrl: string; expiresAt: string }>(`/cab/sso/connections/${encodeURIComponent(id)}/test`, { method: 'POST' })
}

export async function listSsoEvents(params: { connectionId?: string; limit?: number } = {}): Promise<SsoAuditEvent[]> {
  if (isDemoMode()) return demo.demoEvents(params)
  const qs = new URLSearchParams()
  if (params.connectionId) qs.set('connectionId', params.connectionId)
  if (params.limit) qs.set('limit', String(params.limit))
  const query = qs.toString()
  return authorizedRequest<SsoAuditEvent[]>(`/cab/sso/events${query ? `?${query}` : ''}`)
}

/** Verified domain count of a connection. */
export const verifiedDomainCount = (c: Pick<SsoConnection, 'domains'>) => c.domains.filter((d) => d.verified).length

/** Whether an email is on one of the connection's verified domains. */
export const isEmailOnConnection = (c: Pick<SsoConnection, 'domains'>, email: string) =>
  c.domains.some((d) => d.verified && d.domain === emailDomain(email))
