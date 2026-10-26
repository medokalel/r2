// Run: npm test  (or: node --test tests/platform.test.mjs)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { loadSource } from './helpers/loadSource.mjs'

const rules = loadSource('lib/subscriptionFeatures.ts')
const { FEATURE_KEYS } = loadSource('lib/api/platformTypes.ts')

test('subscription gating: every CAB module route maps to its sellable feature; core routes stay open', () => {
  const cases = {
    '/cab/applications/quotation': 'quotations',
    '/cab/applications/APP-1/quotation': 'quotations',
    '/cab/quotations/approval': 'quotations',
    '/cab/offers/new': 'offers',
    '/cab/invoices/inv-1': 'invoices',
    '/cab/audit-planning/build/p1': 'audit_planning',
    '/cab/audit-reporting/findings/new': 'audit_reporting',
    '/cab/nonconformities/nc-1/response': 'nonconformities',
    '/cab/decisions/d1': 'decisions',
    '/cab/certificates/24/prepare': 'certificates',
    '/cab/certification/c1': 'certification_cycles',
    '/cab/competence/persons/new': 'competence',
    '/cab/contacts': 'contacts',
    '/cab/dashboard': 'dashboard_analytics',
    '/portal/home': 'client_portal',
  }
  for (const [path, feature] of Object.entries(cases)) assert.equal(rules.featureForPath(path), feature, path)
  for (const path of ['/workspace', '/cab/applications', '/cab/applications/review', '/cab/audit-clients', '/cab/company-profile', '/cab/subscription', '/account/profile']) {
    assert.equal(rules.featureForPath(path), null, path)
  }
  // Every mapped feature is a real feature key.
  for (const feature of Object.values(cases)) assert.ok(FEATURE_KEYS.includes(feature), feature)

  const features = Object.fromEntries(FEATURE_KEYS.map((k) => [k, true]))
  features.certification_cycles = false
  assert.equal(rules.isPathAllowed('/cab/certification', features), false)
  assert.equal(rules.isPathAllowed('/cab/certificates', features), true)
  assert.equal(rules.isPathAllowed('/cab/certification', null), true, 'unknown subscription never locks')
  assert.equal(rules.isPathAllowed('/cab/certification', {}), true, 'a key the server leaves out is not locked')
})

test('feature matrix: overrides win over the plan, null follows the plan', () => {
  const plan = { quotations: true, wallet: false, assistant: false }
  const effective = rules.effectiveFeatures(plan, { wallet: true, quotations: null, assistant: false }, ['quotations', 'wallet', 'assistant', 'iaf_api'])
  assert.equal(JSON.stringify(effective), JSON.stringify({ quotations: true, wallet: true, assistant: false, iaf_api: false }))
})

test('usage thresholds: warning from 80 %, unlimited never warns', () => {
  assert.equal(rules.usagePercent(80, 100), 80)
  assert.equal(rules.usagePercent(5, null), null)
  assert.equal(rules.isNearLimit(79, 100), false)
  assert.equal(rules.isNearLimit(80, 100), true)
  assert.equal(rules.isNearLimit(10_000, null), false)
  assert.equal(rules.isAtLimit(5, 5), true)
  assert.equal(rules.isAtLimit(4, 5), false)
})

test('invoice arithmetic: VAT on the subtotal, SAR equivalent of the total, payment status', () => {
  const totals = rules.computeInvoiceTotals([{ quantity: 1, unitPrice: 699 }, { quantity: 2, unitPrice: 10 }, { quantity: 1, unitPrice: 1000 }], 0.15, 3.75)
  assert.equal(JSON.stringify(totals), JSON.stringify({ subtotal: 1719, vatAmount: 257.85, total: 1976.85, totalSar: 7413.19 }))
  assert.equal(rules.invoiceStatusAfterPayment(1976.85, 1976.85), 'PAID')
  assert.equal(rules.invoiceStatusAfterPayment(1976.85, 1000), 'PARTIALLY_PAID')
  assert.equal(rules.monthlyRevenue({ priceMonthly: 699, priceYearly: 6990, extraUserPriceMonthly: 10 }, 'YEARLY', 2), 602.5)
})

test('platform roles: support has no money, finance cannot edit plans, admin can do everything', () => {
  assert.equal(rules.platformCan('PLATFORM_SUPPORT', 'money'), false)
  assert.equal(rules.platformCan('PLATFORM_SUPPORT', 'impersonate'), true)
  assert.equal(rules.platformCan('PLATFORM_FINANCE', 'editPlans'), false)
  assert.equal(rules.platformCan('PLATFORM_FINANCE', 'money'), true)
  assert.equal(rules.platformCan('PLATFORM_FINANCE', 'impersonate'), false)
  assert.equal(rules.platformCan('CAB_ADMIN', 'viewTenants'), false)
  for (const ability of ['manageTenants', 'editPlans', 'money', 'settings', 'auditLog', 'staff']) assert.equal(rules.platformCan('PLATFORM_ADMIN', ability), true, ability)

  assert.equal(rules.abilityForPlatformPath('/platform'), null)
  assert.equal(rules.abilityForPlatformPath('/platform/tenants/new'), 'manageTenants')
  assert.equal(rules.abilityForPlatformPath('/platform/tenants/cab-1'), 'viewTenants')
  assert.equal(rules.abilityForPlatformPath('/platform/plans'), 'viewPlans')
  assert.equal(rules.abilityForPlatformPath('/platform/plans/plan-basic'), 'editPlans')
  assert.equal(rules.abilityForPlatformPath('/platform/invoices'), 'money')
  assert.equal(rules.abilityForPlatformPath('/platform/settings'), 'settings')
})

test('announcements: audience targeting and active window', () => {
  const cab = { id: 'cab-1', planCode: 'BASIC' }
  assert.equal(rules.announcementTargets('ALL', cab), true)
  assert.equal(rules.announcementTargets('PLAN:basic', cab), true)
  assert.equal(rules.announcementTargets('PLAN:ENTERPRISE', cab), false)
  assert.equal(rules.announcementTargets('CAB:cab-1', cab), true)
  assert.equal(rules.announcementTargets('CAB:cab-2', cab), false)
  const now = new Date('2026-10-24T12:00:00Z')
  assert.equal(rules.isAnnouncementActive({ startsAt: '2026-10-24T00:00:00Z', endsAt: null }, now), true)
  assert.equal(rules.isAnnouncementActive({ startsAt: '2026-10-25T00:00:00Z', endsAt: null }, now), false)
  assert.equal(rules.isAnnouncementActive({ startsAt: '2026-10-01T00:00:00Z', endsAt: '2026-10-20T00:00:00Z' }, now), false)
})

test('i18n fragments: English and Arabic have the same keys and every feature has a label', () => {
  const en = JSON.parse(readFileSync(new URL('../src/i18n/locales/platform.en.json', import.meta.url), 'utf8'))
  const ar = JSON.parse(readFileSync(new URL('../src/i18n/locales/platform.ar.json', import.meta.url), 'utf8'))
  const flat = (obj, prefix = '') =>
    Object.entries(obj).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${prefix}${k}.`) : [`${prefix}${k}`]))
  const enKeys = flat(en).filter((k) => !k.endsWith('_other')).sort()
  assert.deepEqual(flat(ar).sort(), enKeys)
  for (const key of FEATURE_KEYS) {
    assert.ok(en.platform.features[key], key)
    assert.match(ar.platform.features[key], /[؀-ۿ]/, key)
  }
  for (const code of ['FEATURE_NOT_IN_PLAN', 'SUBSCRIPTION_READ_ONLY', 'USER_LIMIT_REACHED', 'CERTIFICATE_LIMIT_REACHED', 'SUBSCRIPTION_ENDED']) {
    assert.ok(en.subscription.errors[code] && ar.subscription.errors[code], code)
  }
})
