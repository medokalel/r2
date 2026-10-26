/**
 * Pure single sign-on rules shared by the login page, the SSO settings page and the demo IdP:
 * provider presets, error codes, domain checks and the frontend routes of the round trip.
 * No React, no I/O (unit tested in tests/sso.test.mjs).
 */

export const SSO_PROVIDERS = ['entra', 'google', 'okta', 'generic_oidc', 'generic_saml'] as const
export type SsoProvider = (typeof SSO_PROVIDERS)[number]
export type SsoProtocol = 'OIDC' | 'SAML'

export const SSO_PROVIDER_PROTOCOL: Record<SsoProvider, SsoProtocol> = {
  entra: 'OIDC',
  google: 'OIDC',
  okta: 'OIDC',
  generic_oidc: 'OIDC',
  generic_saml: 'SAML',
}

const SAML_CLAIMS = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims'

/** Claim / attribute names the backend uses when a connection leaves the mapping empty. */
export const SSO_DEFAULT_MAPPING: Record<SsoProvider, { email: string; name: string; groups: string }> = {
  entra: { email: 'email', name: 'name', groups: 'groups' },
  google: { email: 'email', name: 'name', groups: '' },
  okta: { email: 'email', name: 'name', groups: 'groups' },
  generic_oidc: { email: 'email', name: 'name', groups: 'groups' },
  generic_saml: {
    email: `${SAML_CLAIMS}/emailaddress`,
    name: `${SAML_CLAIMS}/name`,
    groups: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/groups',
  },
}

/** Issuer of the providers that have a fixed one. */
export const SSO_DEFAULT_ISSUER: Partial<Record<SsoProvider, string>> = {
  google: 'https://accounts.google.com',
}

/** Placeholder shown in the issuer field per provider. */
export const SSO_ISSUER_HINT: Record<SsoProvider, string> = {
  entra: 'https://login.microsoftonline.com/<tenant-id>/v2.0',
  google: 'https://accounts.google.com',
  okta: 'https://<your-org>.okta.com',
  generic_oidc: 'https://idp.example.com',
  generic_saml: '',
}

/** Error codes the backend returns (body.code, or ?error= on /sso/complete), plus SSO_NOT_CONFIGURED from discovery. */
export const SSO_ERROR_CODES = [
  'SSO_NOT_CONFIGURED',
  'SSO_REQUIRED',
  'SSO_CONNECTION_NOT_FOUND',
  'SSO_CONNECTION_DISABLED',
  'SSO_CONNECTION_INCOMPLETE',
  'SSO_STATE_INVALID',
  'SSO_VALIDATION_FAILED',
  'SSO_IDP_ERROR',
  'SSO_EMAIL_MISSING',
  'SSO_DOMAIN_NOT_VERIFIED',
  'SSO_USER_NOT_PROVISIONED',
  'SSO_ACCESS_DENIED',
  'SSO_ACCOUNT_SUSPENDED',
  'SSO_CODE_INVALID',
  'SSO_DOMAIN_TAKEN',
  'USER_LIMIT_REACHED',
  'FEATURE_NOT_IN_PLAN',
] as const
export type SsoErrorCode = (typeof SSO_ERROR_CODES)[number]

/** i18n key of the message for an error code (unknown codes fall back to the generic one). */
export function ssoErrorKey(code: string | null | undefined): string {
  return code && (SSO_ERROR_CODES as readonly string[]).includes(code) ? `sso.errors.${code}` : 'sso.errors.generic'
}

/** Whether the person can fix it by trying again (vs. needing their administrator). */
export function ssoErrorIsRetryable(code: string | null | undefined): boolean {
  return code === 'SSO_STATE_INVALID' || code === 'SSO_CODE_INVALID' || code === 'SSO_IDP_ERROR' || code === 'SSO_VALIDATION_FAILED'
}

/** Public mailbox providers nobody can claim for SSO (same list as the backend). */
export const PUBLIC_EMAIL_DOMAINS = [
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'yahoo.com', 'icloud.com',
  'me.com', 'aol.com', 'proton.me', 'protonmail.com', 'gmx.com', 'yandex.com', 'mail.com', 'zoho.com',
]

const DOMAIN_RE = /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/

/** Lower-case domain without a leading @ or trailing dot. */
export function normalizeDomain(value: string): string {
  return value.trim().toLowerCase().replace(/^@/, '').replace(/\.$/, '')
}

/** null when valid, otherwise 'invalid' | 'public' | 'duplicate'. */
export function domainProblem(value: string, existing: string[] = []): 'invalid' | 'public' | 'duplicate' | null {
  const domain = normalizeDomain(value)
  if (!DOMAIN_RE.test(domain)) return 'invalid'
  if (PUBLIC_EMAIL_DOMAINS.includes(domain)) return 'public'
  if (existing.map(normalizeDomain).includes(domain)) return 'duplicate'
  return null
}

/** Domain part of an email address (lower case), or '' when there is none. */
export function emailDomain(email: string): string {
  const at = email.lastIndexOf('@')
  return at > 0 ? normalizeDomain(email.slice(at + 1)) : ''
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export function isWorkEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim())
}

/** Only same-app relative paths may be used as the post-login destination. */
export function safeRedirectPath(path: string | null | undefined): string | null {
  if (typeof path !== 'string') return null
  const p = path.trim()
  if (!p.startsWith('/') || p.startsWith('//') || p.includes('\\') || /[\r\n]/.test(p) || p.length > 300) return null
  return p
}

/** What a connection still needs before it can be enabled (empty = ready). */
export function missingForEnable(c: {
  protocol: SsoProtocol
  issuerUrl?: string | null
  clientId?: string | null
  samlSsoUrl?: string | null
  samlIdpCertificate?: string | null
}): Array<'issuerUrl' | 'clientId' | 'samlSsoUrl' | 'samlIdpCertificate'> {
  if (c.protocol === 'OIDC') {
    return [!c.issuerUrl?.trim() && ('issuerUrl' as const), !c.clientId?.trim() && ('clientId' as const)].filter(Boolean) as Array<'issuerUrl' | 'clientId'>
  }
  return [!c.samlSsoUrl?.trim() && ('samlSsoUrl' as const), !c.samlIdpCertificate?.trim() && ('samlIdpCertificate' as const)].filter(Boolean) as Array<'samlSsoUrl' | 'samlIdpCertificate'>
}

/** Why "Require SSO" cannot be turned on yet (null = it can). */
export function requireSsoProblem(c: { breakGlassUserId: string | null; verifiedDomains: number }): 'breakGlass' | 'domain' | null {
  if (!c.breakGlassUserId) return 'breakGlass'
  if (c.verifiedDomains < 1) return 'domain'
  return null
}

/** Frontend routes of the round trip (HashRouter paths). */
export const SSO_ROUTES = {
  complete: '/sso/complete',
  testResult: '/sso/test-result',
  demoIdp: '/sso/demo-idp',
  settings: '/cab/settings/sso',
} as const

/** Message posted by the test-result popup to the settings page. */
export const SSO_TEST_MESSAGE = 'icasco:sso-test-result'
