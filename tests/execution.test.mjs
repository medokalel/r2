// Run: npm test  (or: node --test tests/execution.test.mjs)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { loadSource } from './helpers/loadSource.mjs'

const { ROUTES } = loadSource('lib/routes.ts')

const json = (p) => JSON.parse(readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8'))
const flat = (node, prefix = '') => Object.entries(node).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${prefix}${k}.`) : [`${prefix}${k}`]))
const DASH = /[–—]/
const ARABIC = /[؀-ۿ]/

test('execution locale fragment: same keys in English and Arabic, Arabic text, no em or en dashes', () => {
  const en = json('i18n/locales/execution.en.json')
  const ar = json('i18n/locales/execution.ar.json')
  assert.deepEqual(flat(ar).sort(), flat(en).sort())
  assert.ok(!DASH.test(JSON.stringify(en)) && !DASH.test(JSON.stringify(ar)))
  for (const step of ['preparation', 'opening', 'conduct', 'teamReview', 'closing', 'report']) {
    assert.equal(typeof en.execution.steps[step], 'string')
    assert.match(ar.execution.steps[step], ARABIC)
  }
  for (const result of ['conforming', 'observation', 'ofi', 'minorNc', 'majorNc', 'notAudited', 'notApplicable']) assert.equal(typeof ar.execution.results[result], 'string')
  for (const type of ['stage1', 'stage2', 'surveillance', 'recertification', 'special', 'transfer']) assert.equal(typeof ar.execution.report.types[type], 'string')
  for (const type of ['audit_report_issued', 'audit_report_acknowledged']) assert.ok(en.execution.notifications[type].title && ar.execution.notifications[type].body)
})

test('checklist library: 15 bilingual checklists in our own words, each item with a clause and stages', () => {
  const index = json('lib/checklists/library/index.json')
  assert.equal(index.length, 15)
  for (const key of ['iso-9001', 'iso-14001', 'iso-45001', 'iso-22000', 'iso-27001', 'iso-50001', 'iso-22301', 'iso-13485', 'iso-37001', 'iso-20000-1', 'iso-39001', 'iso-41001', 'iso-21001', 'ims', 'stage1-readiness']) assert.ok(index.includes(key), key)
  const stages = new Set(['stage1', 'stage2', 'surveillance', 'recertification', 'special'])
  for (const key of index) {
    const list = json(`lib/checklists/library/${key}.json`)
    assert.equal(list.key, key)
    assert.ok(list.items.length >= 10, `${key}: too few items`)
    assert.ok(!DASH.test(JSON.stringify(list)), `${key}: em/en dash`)
    const codes = new Set()
    for (const item of list.items) {
      assert.ok(item.clause, `${key} ${item.code}: clause`)
      assert.ok(!codes.has(item.code), `${key}: duplicate ${item.code}`)
      codes.add(item.code)
      assert.ok(item.title.en && item.requirement.en, `${key} ${item.code}: English text`)
      assert.match(item.title.ar, ARABIC, `${key} ${item.code}: Arabic title`)
      assert.match(item.requirement.ar, ARABIC, `${key} ${item.code}: Arabic requirement`)
      assert.equal(item.evidence.en.length, item.evidence.ar.length, `${key} ${item.code}: evidence lists differ`)
      assert.ok(item.stages.length > 0 && item.stages.every((s) => stages.has(s)), `${key} ${item.code}: stages`)
    }
  }
  const iso27001 = json('lib/checklists/library/iso-27001.json')
  assert.ok(iso27001.items.some((i) => /^A\./.test(i.clause)), 'ISO 27001 covers Annex A themes')
})

test('checklist library: approved by the product owner (25 October 2026), 401 items, no draft note', () => {
  const index = json('lib/checklists/library/index.json')
  let items = 0
  for (const key of index) {
    const list = json(`lib/checklists/library/${key}.json`)
    items += list.items.length
    assert.equal(list.status, 'approved', `${key}: status`)
    assert.equal(list.approvedOn, '2026-10-25', `${key}: approvedOn`)
    assert.doesNotMatch(list.version, /draft/i, `${key}: version`)
    assert.match(list.reviewNote.en, /^Approved by the product owner on 25 October 2026\./, `${key}: approval line`)
    assert.doesNotMatch(list.reviewNote.en, /draft/i, `${key}: no draft wording`)
    assert.match(list.reviewNote.ar, ARABIC, `${key}: Arabic approval line`)
  }
  assert.equal(items, 401)
})

test('execution routes exist for the CAB and the client portal', () => {
  assert.equal(ROUTES.cabAuditExecution, '/cab/audit-execution/:planId')
  assert.equal(ROUTES.cabChecklists, '/cab/checklists')
  assert.equal(ROUTES.cabStageReport, '/cab/audit-reporting/report/:reportId')
  assert.equal(ROUTES.portalAuditDetail, '/portal/audits/:planId')
  assert.equal(ROUTES.portalAuditReport, '/portal/audit-reports/:reportId')
})
