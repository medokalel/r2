/**
 * Demo (preview) data of single sign-on: connections of the demo CAB, the audit trail, test results
 * and the one-time codes of the simulated sign-in. Mirrors the backend rules (src/modules/sso) so
 * the screens behave the same: verified domains only, JIT and the seat-free demo, group rules,
 * "Require SSO" with a break-glass admin, the client secret never returned.
 *
 * Stored in localStorage (`icasco-demo-sso`, cleared by ?demo=reset) and read fresh on every call,
 * because the "Test connection" popup writes the result from another window.
 */

import type {
  SsoAuditEvent,
  SsoConnection,
  SsoConnectionInput,
  SsoDiscoverResult,
  SsoOptions,
  SsoTestOutcome,
  SsoVerifyResult,
} from '@/lib/api/ssoApi'
import { ApiError } from '@/lib/api/client'
import { DEMO_CAB } from '@/lib/api/demo/dataset'
import { DEMO_SEED_VERSION, isDemoMode } from '@/lib/api/demo/demoStore'
import { demoMySubscription } from '@/lib/api/demo/platformDemo'
import {
  SSO_DEFAULT_ISSUER,
  SSO_DEFAULT_MAPPING,
  SSO_PROVIDER_PROTOCOL,
  SSO_PROVIDERS,
  SSO_ROUTES,
  domainProblem,
  emailDomain,
  missingForEnable,
  normalizeDomain,
  type SsoProvider,
} from '@/lib/sso'

const STORAGE_KEY = 'icasco-demo-sso'
const API = 'https://api.icasco.co/api/v1/auth/sso'
const TXT_PREFIX = 'icasco-verification='
const ROLES = ['CAB_ADMIN']

interface DemoSsoState {
  connections: Array<Omit<SsoConnection, 'sp' | 'breakGlassUser'> & { breakGlassUserId: string | null; secretSet: boolean }>
  events: SsoAuditEvent[]
  codes: Array<{ code: string; email: string; expiresAt: number }>
  users: string[]
}

const ADMINS = [
  { id: DEMO_CAB.admin.id, name: DEMO_CAB.admin.name, email: DEMO_CAB.admin.email },
  { id: 'usr-admin-0002', name: 'Huda Al Harbi', email: 'quality@casco.example' },
]

const now = () => new Date().toISOString()
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()
const rid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`
const token = () => Array.from({ length: 24 }, () => 'abcdefghijkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 32)]).join('')

function seed(): DemoSsoState {
  const id = 'sso-demo-entra'
  return {
    connections: [
      {
        id,
        scope: 'CAB',
        name: 'CASCO Microsoft Entra ID',
        protocol: 'OIDC',
        provider: 'entra',
        status: 'ENABLED',
        issuerUrl: 'https://login.microsoftonline.com/7f3c1d2e-58a4-4b8e-9a61-2c1b5d0e9f10/v2.0',
        clientId: 'b8d2c0f4-1e7a-4c55-9d3b-6a0f2e8c7d41',
        hasSecret: true,
        secretSet: true,
        scopes: 'openid email profile',
        samlMetadataUrl: null,
        hasSamlMetadataXml: false,
        samlIdpEntityId: null,
        samlSsoUrl: null,
        samlIdpCertificate: null,
        attributeMapping: { ...SSO_DEFAULT_MAPPING.entra },
        groupRoleMapping: [{ group: 'iCASCO-Admins', role: 'CAB_ADMIN' }],
        defaultRole: 'CAB_ADMIN',
        jitEnabled: true,
        requireSso: false,
        breakGlassUserId: DEMO_CAB.admin.id,
        domains: [
          {
            id: 'dom-casco',
            domain: 'casco.example',
            verified: true,
            verifiedAt: daysAgo(12),
            verificationToken: 'q7m2w9x4k8r3t6y1p5n0c2v8',
            txtRecord: { host: 'casco.example', type: 'TXT', value: `${TXT_PREFIX}q7m2w9x4k8r3t6y1p5n0c2v8` },
            lastCheckedAt: daysAgo(12),
            lastCheckError: null,
          },
        ],
        lastTest: {
          at: daysAgo(12),
          status: 'SUCCESS',
          result: {
            subject: 'AAAAAAAAAAAAAAAAAAAAAMd8kq3Lr0',
            claims: { sub: 'AAAAAAAAAAAAAAAAAAAAAMd8kq3Lr0', email: DEMO_CAB.admin.email, name: DEMO_CAB.admin.name, groups: ['iCASCO-Admins'], tid: '7f3c1d2e-58a4-4b8e-9a61-2c1b5d0e9f10' },
            mapped: { email: DEMO_CAB.admin.email, name: DEMO_CAB.admin.name, groups: ['iCASCO-Admins'], role: 'CAB_ADMIN', matchedGroup: 'iCASCO-Admins' },
            domainVerified: true,
            userExists: true,
            wouldProvision: false,
            warnings: [],
          },
        },
        lastLoginAt: daysAgo(1),
        createdAt: daysAgo(14),
        updatedAt: daysAgo(12),
      },
    ],
    events: [
      { id: 'sev-4', connectionId: id, action: 'login.succeeded', email: DEMO_CAB.admin.email, actor: { ...ADMINS[0] }, details: { provisioned: false }, ip: '10.0.4.18', createdAt: daysAgo(1) },
      { id: 'sev-3', connectionId: id, action: 'test.succeeded', email: DEMO_CAB.admin.email, actor: { ...ADMINS[0] }, details: null, ip: '10.0.4.18', createdAt: daysAgo(12) },
      { id: 'sev-2', connectionId: id, action: 'domain.verified', email: null, actor: { ...ADMINS[0] }, details: { domain: 'casco.example' }, ip: '10.0.4.18', createdAt: daysAgo(12) },
      { id: 'sev-1', connectionId: id, action: 'connection.created', email: null, actor: { ...ADMINS[0] }, details: { name: 'CASCO Microsoft Entra ID' }, ip: '10.0.4.18', createdAt: daysAgo(14) },
    ],
    codes: [],
    users: ADMINS.map((a) => a.email),
  }
}

let memory: DemoSsoState | null = null

function read(): DemoSsoState {
  if (isDemoMode()) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const parsed = raw ? (JSON.parse(raw) as { v: number; d: DemoSsoState }) : null
      if (parsed && parsed.v === DEMO_SEED_VERSION) return parsed.d
    } catch {
      // fall through to the seed
    }
  }
  memory ??= seed()
  return memory
}

function write(state: DemoSsoState) {
  memory = state
  if (!isDemoMode()) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: DEMO_SEED_VERSION, d: state }))
  } catch {
    // storage blocked: the in-memory copy still works for this page
  }
}

const delay = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms))

function toDto(c: DemoSsoState['connections'][number]): SsoConnection {
  const { breakGlassUserId, secretSet, ...rest } = c
  return {
    ...rest,
    hasSecret: secretSet,
    breakGlassUser: ADMINS.find((a) => a.id === breakGlassUserId) ?? null,
    sp: {
      redirectUri: `${API}/oidc/callback`,
      acsUrl: `${API}/saml/acs`,
      entityId: `${API}/saml/${c.id}/metadata`,
      metadataUrl: `${API}/saml/${c.id}/metadata`,
      loginUrl: `${API}/${c.id}/start`,
    },
  }
}

const fail = (status: number, message: string, code?: string) => new ApiError(message, status, undefined, code)

function log(state: DemoSsoState, connectionId: string | null, action: string, extra: Partial<SsoAuditEvent> = {}) {
  state.events.unshift({ id: rid('sev'), connectionId, action, email: null, actor: { ...ADMINS[0] }, details: null, ip: '10.0.4.18', createdAt: now(), ...extra })
  state.events = state.events.slice(0, 200)
}

function find(state: DemoSsoState, id: string) {
  const c = state.connections.find((x) => x.id === id)
  if (!c) throw fail(404, 'SSO connection not found.', 'SSO_CONNECTION_NOT_FOUND')
  return c
}

function connectionForDomain(state: DemoSsoState, domain: string) {
  return state.connections.find((c) => c.status === 'ENABLED' && c.domains.some((d) => d.verified && d.domain === domain)) ?? null
}

/* ── Sign-in ─────────────────────────────────────────────────────────── */

export async function demoDiscover(email: string): Promise<SsoDiscoverResult> {
  await delay()
  const c = connectionForDomain(read(), emailDomain(email))
  // Like the API: a CAB whose plan has no `sso` feature gets no SSO sign-in.
  if (!c || !(await demoMySubscription()).features.sso) return { sso: false, required: false }
  return { sso: true, required: c.requireSso, connectionId: c.id, connectionName: c.name, protocol: c.protocol, provider: c.provider }
}

/** Connection id when password sign-in is blocked for this email (Require SSO), else null. */
export function demoPasswordBlocked(email: string): string | null {
  const state = read()
  const c = connectionForDomain(state, emailDomain(email))
  if (!c?.requireSso) return null
  const breakGlass = ADMINS.find((a) => a.id === c.breakGlassUserId)
  if (breakGlass && breakGlass.email.toLowerCase() === email.trim().toLowerCase()) return null
  log(state, c.id, 'password_login.blocked', { email: email.trim().toLowerCase(), actor: null })
  write(state)
  return c.id
}

/** Public facts the simulated identity provider shows on its consent screen. */
export function demoConnectionSummary(id: string): { name: string; provider: SsoProvider; protocol: SsoConnection['protocol'] } | null {
  const c = read().connections.find((x) => x.id === id)
  return c ? { name: c.name, provider: c.provider, protocol: c.protocol } : null
}

/** The simulated IdP said yes: applies the backend rules and returns a one-time code or an error code. */
export async function demoCompleteLogin(connectionId: string, email: string, groups: string[]): Promise<{ code?: string; error?: string }> {
  await delay(400)
  const state = read()
  const c = state.connections.find((x) => x.id === connectionId)
  const address = email.trim().toLowerCase()
  const result = (() => {
    if (!c) return { error: 'SSO_CONNECTION_NOT_FOUND' }
    if (c.status !== 'ENABLED') return { error: 'SSO_CONNECTION_DISABLED' }
    if (!c.domains.some((d) => d.verified && d.domain === emailDomain(address))) return { error: 'SSO_DOMAIN_NOT_VERIFIED' }
    const rule = c.groupRoleMapping.find((r) => groups.some((g) => g.toLowerCase() === r.group.toLowerCase()))
    const role = rule?.role ?? c.defaultRole
    const exists = state.users.includes(address)
    if (c.groupRoleMapping.length && !role) return { error: 'SSO_ACCESS_DENIED' }
    if (!exists) {
      if (!c.jitEnabled) return { error: 'SSO_USER_NOT_PROVISIONED' }
      if (!role) return { error: 'SSO_ACCESS_DENIED' }
      state.users.push(address)
      log(state, c.id, 'user.provisioned', { email: address, actor: null, details: { role } })
    }
    const code = token() + token()
    state.codes.push({ code, email: address, expiresAt: Date.now() + 60000 })
    c.lastLoginAt = now()
    log(state, c.id, 'login.succeeded', { email: address, actor: null, details: { provisioned: !exists } })
    return { code }
  })()
  if (result.error && c) log(state, c.id, 'login.failed', { email: address, actor: null, details: { code: result.error } })
  write(state)
  return result
}

/** Consumes a one-time code (single use, 60 seconds) and returns the signed-in email. */
export function demoConsumeCode(code: string): string {
  const state = read()
  const index = state.codes.findIndex((x) => x.code === code && x.expiresAt > Date.now())
  if (index < 0) throw fail(401, 'This sign-in code has expired or was already used. Sign in again.', 'SSO_CODE_INVALID')
  const [entry] = state.codes.splice(index, 1)
  write(state)
  return entry.email
}

/* ── CAB admin ───────────────────────────────────────────────────────── */

export async function demoOptions(): Promise<SsoOptions> {
  await delay(120)
  return {
    roles: ROLES,
    providers: SSO_PROVIDERS.map((key) => ({ key, protocol: SSO_PROVIDER_PROTOCOL[key], attributeMapping: SSO_DEFAULT_MAPPING[key], issuerUrl: SSO_DEFAULT_ISSUER[key] ?? null })),
    admins: ADMINS,
    txtPrefix: TXT_PREFIX,
  }
}

export async function demoList(): Promise<SsoConnection[]> {
  await delay()
  return read().connections.map(toDto)
}

export async function demoGet(id: string): Promise<SsoConnection> {
  await delay(120)
  return toDto(find(read(), id))
}

function applyInput(state: DemoSsoState, c: DemoSsoState['connections'][number], input: SsoConnectionInput) {
  const { clientSecret, domains, ...rest } = input
  const merged = { ...c, ...Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)) } as typeof c
  for (const key of ['issuerUrl', 'clientId', 'samlMetadataUrl', 'samlIdpEntityId', 'samlSsoUrl', 'samlIdpCertificate'] as const) {
    if (merged[key] === '') merged[key] = null
  }
  if (input.samlMetadataXml) {
    merged.hasSamlMetadataXml = true
    merged.samlIdpEntityId ||= 'https://idp.casco.example/metadata'
    merged.samlSsoUrl ||= 'https://idp.casco.example/sso'
    merged.samlIdpCertificate ||= '-----BEGIN CERTIFICATE-----\nMIIDdemoCertificateFromMetadata\n-----END CERTIFICATE-----'
  }
  if (clientSecret !== undefined) merged.secretSet = Boolean(clientSecret)
  if (domains) {
    const wanted = [...new Set(domains.map(normalizeDomain))]
    for (const domain of wanted) {
      if (domainProblem(domain) === 'public') throw fail(400, `${domain} is a public mailbox provider and cannot be used for single sign-on.`)
      const taken = state.connections.some((o) => o.id !== c.id && o.domains.some((d) => d.domain === domain))
      if (taken) throw fail(409, `${domain} is already used by another SSO connection of your organization.`, 'SSO_DOMAIN_TAKEN')
    }
    merged.domains = wanted.map((domain) => {
      const kept = c.domains.find((d) => d.domain === domain)
      if (kept) return kept
      const tk = token()
      log(state, c.id, 'domain.added', { details: { domain } })
      return { id: rid('dom'), domain, verified: false, verifiedAt: null, verificationToken: tk, txtRecord: { host: domain, type: 'TXT' as const, value: `${TXT_PREFIX}${tk}` }, lastCheckedAt: null, lastCheckError: null }
    })
  }
  if (merged.status === 'ENABLED' && missingForEnable(merged).length) {
    throw fail(400, 'Complete the identity provider settings before enabling the connection.', 'SSO_CONNECTION_INCOMPLETE')
  }
  if (merged.jitEnabled && !merged.defaultRole && !merged.groupRoleMapping.length) {
    throw fail(400, 'Just-in-time provisioning needs a default role or at least one group rule.')
  }
  if (merged.requireSso) {
    if (!merged.breakGlassUserId) throw fail(400, 'Choose a break-glass CAB admin before requiring single sign-on.')
    if (!merged.domains.some((d) => d.verified)) throw fail(400, 'Verify at least one domain before requiring single sign-on.')
  }
  return merged
}

export async function demoCreate(input: SsoConnectionInput): Promise<SsoConnection> {
  await delay()
  const state = read()
  const provider = input.provider ?? 'generic_oidc'
  const protocol = SSO_PROVIDER_PROTOCOL[provider]
  const base: DemoSsoState['connections'][number] = {
    id: rid('sso'),
    scope: 'CAB',
    name: input.name ?? 'SSO',
    protocol,
    provider,
    status: 'DISABLED',
    issuerUrl: protocol === 'OIDC' ? SSO_DEFAULT_ISSUER[provider] ?? null : null,
    clientId: null,
    hasSecret: false,
    secretSet: false,
    scopes: 'openid email profile',
    samlMetadataUrl: null,
    hasSamlMetadataXml: false,
    samlIdpEntityId: null,
    samlSsoUrl: null,
    samlIdpCertificate: null,
    attributeMapping: { ...SSO_DEFAULT_MAPPING[provider] },
    groupRoleMapping: [],
    defaultRole: null,
    jitEnabled: false,
    requireSso: false,
    breakGlassUserId: null,
    domains: [],
    lastTest: null,
    lastLoginAt: null,
    createdAt: now(),
    updatedAt: now(),
  }
  const created = applyInput(state, base, input)
  state.connections.push(created)
  log(state, created.id, 'connection.created', { details: { name: created.name, provider } })
  write(state)
  return toDto(created)
}

export async function demoUpdate(id: string, input: SsoConnectionInput): Promise<SsoConnection> {
  await delay()
  const state = read()
  const c = find(state, id)
  if (input.provider && SSO_PROVIDER_PROTOCOL[input.provider] !== c.protocol) {
    throw fail(400, 'The protocol of a connection cannot change. Create a new connection instead.')
  }
  const updated = { ...applyInput(state, c, input), updatedAt: now() }
  if (c.status !== updated.status) log(state, id, updated.status === 'ENABLED' ? 'connection.enabled' : 'connection.disabled')
  if (c.requireSso !== updated.requireSso || c.breakGlassUserId !== updated.breakGlassUserId) {
    log(state, id, 'enforcement.changed', { details: { after: { requireSso: updated.requireSso, breakGlassUserId: updated.breakGlassUserId } } })
  }
  if (c.jitEnabled !== updated.jitEnabled) log(state, id, 'jit.changed', { details: { jitEnabled: updated.jitEnabled } })
  if (input.clientSecret !== undefined) log(state, id, 'connection.secret_changed')
  log(state, id, 'connection.updated')
  state.connections = state.connections.map((x) => (x.id === id ? updated : x))
  write(state)
  return toDto(updated)
}

export async function demoDelete(id: string): Promise<void> {
  await delay()
  const state = read()
  const c = find(state, id)
  state.connections = state.connections.filter((x) => x.id !== id)
  log(state, id, 'connection.deleted', { details: { name: c.name } })
  write(state)
}

/** Preview DNS: a domain whose name contains "pending" has no TXT record yet; every other domain passes. */
export async function demoVerify(id: string, domainInput: string): Promise<SsoVerifyResult> {
  await delay(700)
  const state = read()
  const c = find(state, id)
  const domain = normalizeDomain(domainInput)
  const d = c.domains.find((x) => x.domain === domain)
  if (!d) throw fail(404, `${domain} is not a domain of this connection.`)
  const found = !domain.includes('pending')
  d.lastCheckedAt = now()
  d.lastCheckError = found ? null : 'No TXT record found for this domain yet.'
  if (found && !d.verified) {
    d.verified = true
    d.verifiedAt = now()
  }
  log(state, id, found ? 'domain.verified' : 'domain.verification_failed', { details: { domain } })
  write(state)
  return { verified: d.verified, domain: { ...d }, connection: toDto(c) }
}

export async function demoStartTest(id: string): Promise<{ authorizationUrl: string; expiresAt: string }> {
  await delay(150)
  const state = read()
  const c = find(state, id)
  if (missingForEnable(c).length) throw fail(400, 'Complete the identity provider settings before testing the connection.', 'SSO_CONNECTION_INCOMPLETE')
  log(state, id, 'test.started')
  write(state)
  const base = `${window.location.origin}${window.location.pathname}`
  return { authorizationUrl: `${base}#${SSO_ROUTES.demoIdp}?mode=test&connection=${encodeURIComponent(id)}`, expiresAt: new Date(Date.now() + 600000).toISOString() }
}

/** Test round trip finished in the simulated IdP: stores what a real IdP would have sent. */
export async function demoRecordTest(id: string, email: string, name: string, groups: string[]): Promise<'success' | 'failed'> {
  await delay(300)
  const state = read()
  const c = find(state, id)
  const address = email.trim().toLowerCase()
  const rule = c.groupRoleMapping.find((r) => groups.some((g) => g.toLowerCase() === r.group.toLowerCase()))
  const role = rule?.role ?? c.defaultRole
  const domainVerified = c.domains.some((d) => d.verified && d.domain === emailDomain(address))
  const userExists = state.users.includes(address)
  const warnings = [
    !domainVerified && 'DOMAIN_NOT_VERIFIED',
    !role && 'NO_ROLE',
    !userExists && !c.jitEnabled && 'USER_NOT_PROVISIONED',
  ].filter(Boolean) as string[]
  const claims: Record<string, unknown> =
    c.protocol === 'OIDC'
      ? { sub: `demo-${address.split('@')[0]}`, email: address, name, groups, iss: c.issuerUrl, aud: c.clientId }
      : { nameID: address, [c.attributeMapping.email]: address, [c.attributeMapping.name]: name, [c.attributeMapping.groups || 'groups']: groups }
  const result: SsoTestOutcome = {
    subject: c.protocol === 'OIDC' ? `demo-${address.split('@')[0]}` : address,
    claims,
    mapped: { email: address, name, groups, role, matchedGroup: rule?.group ?? null },
    domainVerified,
    userExists,
    wouldProvision: !userExists && c.jitEnabled && Boolean(role) && domainVerified,
    warnings,
  }
  c.lastTest = { at: now(), status: 'SUCCESS', result }
  log(state, id, 'test.succeeded', { email: address, details: { warnings } })
  write(state)
  return 'success'
}

export async function demoEvents({ connectionId, limit = 50 }: { connectionId?: string; limit?: number }): Promise<SsoAuditEvent[]> {
  await delay(150)
  return read().events.filter((e) => !connectionId || e.connectionId === connectionId).slice(0, limit)
}
