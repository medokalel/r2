// Run: npm test  (or: node --test tests/agreements.test.mjs)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { loadSource } from './helpers/loadSource.mjs'

const { DEFAULT_AGREEMENT_SECTIONS, AGREEMENT_VARIABLES } = loadSource('lib/api/demo/agreementTemplateDefault.ts')
const { ROUTES } = loadSource('lib/routes.ts')

const json = (p) => JSON.parse(readFileSync(new URL(`../src/i18n/locales/${p}`, import.meta.url), 'utf8'))
const flat = (node, prefix = '') => Object.entries(node).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${prefix}${k}.`) : [`${prefix}${k}`]))
const DASH = /[–—]/

test('agreements locale fragment: same keys in English and Arabic, Arabic text, no em or en dashes', () => {
  const en = json('agreements.en.json')
  const ar = json('agreements.ar.json')
  assert.deepEqual(flat(ar).sort(), flat(en).sort())
  assert.ok(!DASH.test(JSON.stringify(en)) && !DASH.test(JSON.stringify(ar)))
  assert.match(ar.agreements.portal.title, /[؀-ۿ]/)
  for (const status of ['draft', 'sent', 'client_signed', 'active', 'superseded', 'terminated']) {
    assert.equal(typeof en.agreements.status[status], 'string')
    assert.equal(typeof en.agreements.next[status], 'string')
  }
  for (const type of ['agreement_drafted', 'agreement_signed_by_client', 'agreement_to_sign', 'agreement_active', 'agreement_terminated']) {
    assert.ok(en.agreements.notifications[type].title && ar.agreements.notifications[type].body)
  }
})

test('default agreement text: bilingual, covers the 17021-1 5.1.2 topics, only known variables', () => {
  const keys = new Set(AGREEMENT_VARIABLES.map((v) => v.key))
  const topics = DEFAULT_AGREEMENT_SECTIONS.map((s) => s.key)
  for (const topic of ['clientObligations', 'access', 'complaints', 'marks', 'changes', 'confidentiality', 'suspension', 'fees', 'impartiality', 'transfer', 'term']) assert.ok(topics.includes(topic), topic)
  for (const s of DEFAULT_AGREEMENT_SECTIONS) {
    for (const text of [s.title.en, s.title.ar, s.body.en, s.body.ar]) {
      assert.ok(text.trim().length > 3)
      assert.ok(!DASH.test(text))
      for (const m of text.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)) assert.ok(keys.has(m[1]), m[1])
    }
    assert.match(s.body.ar, /[؀-ۿ]/)
  }
})

test('agreement routes exist for the CAB and the client portal', () => {
  assert.equal(ROUTES.cabAgreements, '/cab/agreements')
  assert.equal(ROUTES.cabAgreementTerms, '/cab/settings/agreement-terms')
  assert.equal(ROUTES.portalAgreementDetail, '/portal/agreements/:agreementId')
})
