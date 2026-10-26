// Run: npm test  (or: node --test tests/sso.test.mjs)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { loadSource } from './helpers/loadSource.mjs'

const sso = loadSource('lib/sso.ts')
const { featureForPath } = loadSource('lib/subscriptionFeatures.ts')
const { FEATURE_KEYS } = loadSource('lib/api/platformTypes.ts')

const json = (p) => JSON.parse(readFileSync(new URL(`../src/i18n/locales/${p}`, import.meta.url), 'utf8'))
const flat = (node, prefix = '') => Object.entries(node).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${prefix}${k}.`) : [`${prefix}${k}`]))

test('sso is a sellable feature and gates the settings page', () => {
  assert.ok(FEATURE_KEYS.includes('sso'))
  assert.equal(featureForPath('/cab/settings/sso'), 'sso')
  assert.equal(featureForPath('/sso/complete'), null)
  assert.equal(featureForPath('/login'), null)
})

test('domains: normalisation, invalid, public mailbox and duplicates', () => {
  assert.equal(sso.normalizeDomain(' @Casco.SA. '), 'casco.sa')
  assert.equal(sso.domainProblem('casco.sa'), null)
  assert.equal(sso.domainProblem('no_dots'), 'invalid')
  assert.equal(sso.domainProblem('-bad.com'), 'invalid')
  assert.equal(sso.domainProblem('Gmail.com'), 'public')
  assert.equal(sso.domainProblem('@casco.sa', ['casco.sa']), 'duplicate')
  assert.equal(sso.emailDomain('Ali@Casco.SA'), 'casco.sa')
  assert.equal(sso.emailDomain('nope'), '')
})

test('redirect paths: only same-app relative paths', () => {
  assert.equal(sso.safeRedirectPath('/cab/clients'), '/cab/clients')
  for (const bad of ['https://evil.com', '//evil.com', '/\\evil', 'cab', null, '/a\nb']) assert.equal(sso.safeRedirectPath(bad), null)
})

test('enable and Require SSO preconditions', () => {
  assert.deepEqual([...sso.missingForEnable({ protocol: 'OIDC', issuerUrl: '', clientId: 'x' })], ['issuerUrl'])
  assert.deepEqual([...sso.missingForEnable({ protocol: 'OIDC', issuerUrl: 'https://i', clientId: 'x' })], [])
  assert.deepEqual([...sso.missingForEnable({ protocol: 'SAML', samlSsoUrl: 'https://s', samlIdpCertificate: '' })], ['samlIdpCertificate'])
  assert.equal(sso.requireSsoProblem({ breakGlassUserId: null, verifiedDomains: 1 }), 'breakGlass')
  assert.equal(sso.requireSsoProblem({ breakGlassUserId: 'u', verifiedDomains: 0 }), 'domain')
  assert.equal(sso.requireSsoProblem({ breakGlassUserId: 'u', verifiedDomains: 1 }), null)
})

test('every provider has a protocol and default mapping; every error code has a message in both languages', () => {
  const en = json('sso.en.json')
  const ar = json('sso.ar.json')
  for (const p of sso.SSO_PROVIDERS) {
    assert.ok(sso.SSO_PROVIDER_PROTOCOL[p])
    assert.ok(sso.SSO_DEFAULT_MAPPING[p].email)
    assert.ok(en.sso.providers[p] && ar.sso.providers[p], p)
    for (const n of [1, 2, 3, 4]) assert.ok(en.sso.wizard.guide[`${p}${n}`] && ar.sso.wizard.guide[`${p}${n}`], `${p}${n}`)
  }
  for (const code of sso.SSO_ERROR_CODES) {
    assert.equal(sso.ssoErrorKey(code), `sso.errors.${code}`)
    assert.ok(en.sso.errors[code] && ar.sso.errors[code], code)
  }
  assert.equal(sso.ssoErrorKey('SOMETHING_ELSE'), 'sso.errors.generic')
  assert.equal(sso.ssoErrorIsRetryable('SSO_STATE_INVALID'), true)
  assert.equal(sso.ssoErrorIsRetryable('SSO_USER_NOT_PROVISIONED'), false)
})

test('sso locale fragment: same keys in English and Arabic, Arabic text, no em or en dashes', () => {
  const en = json('sso.en.json')
  const ar = json('sso.ar.json')
  assert.deepEqual(flat(ar).sort(), flat(en).sort())
  assert.match(ar.sso.nav, /[؀-ۿ]/)
  assert.ok(!/[–—]/.test(JSON.stringify(en) + JSON.stringify(ar)))
  for (const lang of ['en', 'ar']) assert.ok(json(`platform.${lang}.json`).platform.features.sso, `platform.features.sso ${lang}`)
})
