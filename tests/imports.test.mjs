// Excel import rules. Run: npm test  (or: node --test tests/imports.test.mjs)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createLoader } from './helpers/loadModuleGraph.mjs'

const load = createLoader()
const { IMPORT_DEFINITIONS, MIGRATION_ORDER, editLinkFor, fieldIdOf } = load('lib/imports/entities.ts')
const { evaluateImport, parseDate, parsePhone, rowCompleteness, rowsToCommit } = load('lib/imports/engine.ts')
const { gridToRows, templateSheets, parseCsv } = load('lib/imports/workbook.ts')
const { IMPORT_ENTITY_KEYS } = load('lib/imports/types.ts')

const json = (p) => JSON.parse(readFileSync(new URL(`../src/i18n/locales/${p}`, import.meta.url), 'utf8'))
const DASH = /[–—]/
/** Values from the vm sandbox, made comparable with deepEqual. */
const plain = (v) => JSON.parse(JSON.stringify(v))

const lists = {
  countries: [{ value: 'SA', labelEn: 'Saudi Arabia', labelAr: 'السعودية' }, { value: 'EG', labelEn: 'Egypt', labelAr: 'مصر' }],
  currencies: [{ value: 'SAR', labelEn: 'SAR', labelAr: 'SAR' }],
  standards: [{ value: 'ISO 9001:2015', labelEn: 'ISO 9001', labelAr: 'نظام إدارة الجودة' }],
  roles: [{ value: 'LEAD_AUDITOR', labelEn: 'Lead Auditor', labelAr: 'قائد فريق التدقيق' }],
  iafCodes: [{ value: '03', labelEn: 'IAF 03', labelAr: 'IAF 03' }, { value: '29', labelEn: 'IAF 29', labelAr: 'IAF 29' }],
}
const ctx = (extra = {}) => ({ lists, existing: new Map(), clients: new Map([['al noor', 'org-1']]), personnel: new Map(), certificates: new Map(), ...extra })

test('every API entity has a definition, and the migration order covers them', () => {
  for (const key of IMPORT_ENTITY_KEYS) assert.ok(IMPORT_DEFINITIONS[key], key)
  assert.deepEqual([...MIGRATION_ORDER].sort(), [...IMPORT_ENTITY_KEYS].sort())
  for (const def of Object.values(IMPORT_DEFINITIONS)) {
    assert.ok(def.columns.some((c) => c.required || c.requiredIf), `${def.key}: needs a required column`)
    for (const c of def.columns) assert.ok(c.labelEn && c.labelAr, `${def.key}.${c.key}: EN and AR labels`)
    assert.ok(!DASH.test(JSON.stringify(def)), `${def.key}: no em/en dash`)
  }
})

test('field ids follow <prefix>-<kebab-key> and edit links carry the field and the way back', () => {
  assert.equal(fieldIdOf(IMPORT_DEFINITIONS.clients, 'legalName'), 'client-legal-name')
  assert.equal(fieldIdOf(IMPORT_DEFINITIONS.fee_items, 'nameAr'), 'fee-item-name-ar')
  assert.equal(fieldIdOf(IMPORT_DEFINITIONS.personnel, 'criticalIafCodes'), 'personnel-competence-matrix')
  const link = editLinkFor(IMPORT_DEFINITIONS.client_sites, { id: 'S1', parentId: 'O1', missing: ['address'] }, '/cab/migration')
  assert.equal(link.to, '/cab/clients/O1/profile?tab=sites&site=S1&field=site-address&returnTo=%2Fcab%2Fmigration')
  const server = editLinkFor(IMPORT_DEFINITIONS.contacts, { id: 'C1', missing: ['phone'], editRoute: '/cab/contacts?contact=C1&edit=1' }, '/x')
  assert.equal(server.to, '/cab/contacts?contact=C1&edit=1&field=contact-phone&returnTo=%2Fx')
})

test('cells are normalised: dates, phones, enums, countries', () => {
  assert.equal(parseDate('2026-03-18'), '2026-03-18')
  assert.equal(parseDate('18/03/2026'), '2026-03-18')
  assert.equal(parseDate(46099), '2026-03-18')
  assert.equal(parseDate('2026-02-30'), null)
  assert.equal(parsePhone('+966 50 123-4567'), '+966501234567')
  assert.equal(parsePhone('0501234567'), null)
})

test('row statuses: ready, partial, invalid, duplicate, and duplicates inside the file', () => {
  const def = IMPORT_DEFINITIONS.clients
  const rows = [
    { rowNumber: 4, raw: { legalName: 'Alpha Co', contactEmail: 'a@alpha.example', tradeName: 'Alpha', registrationNumber: '1', activity: 'x', employeeCount: '10', country: 'Saudi Arabia', city: 'Jeddah', contactName: 'A B', contactPhone: '+966501234567' } },
    { rowNumber: 5, raw: { legalName: 'Beta Co', contactEmail: 'b@beta.example' } },
    { rowNumber: 6, raw: { legalName: 'Gamma Co', contactEmail: 'not-an-email' } },
    { rowNumber: 7, raw: { legalName: 'Existing Co', contactEmail: 'e@x.example' } },
    { rowNumber: 8, raw: { legalName: 'beta  co', contactEmail: 'b2@beta.example' } },
  ]
  const out = evaluateImport(def, rows, ctx({ existing: new Map([['existing co', 'org-9']]) }), def.columns.map((c) => c.key))
  assert.deepEqual(plain(out.rows.map((r) => r.status)), ['ready', 'partial', 'invalid', 'duplicate', 'invalid'])
  assert.equal(out.rows[0].values.country, 'SA')
  assert.equal(out.rows[3].matchedExistingId, 'org-9')
  assert.ok(out.rows[1].missing.includes('city'))
  assert.equal(out.rows[4].errors[0].code, 'DUPLICATE_IN_FILE')
  assert.deepEqual(plain(out.totals), { rows: 5, ready: 1, partial: 1, invalid: 2, duplicates: 1 })
  assert.deepEqual(plain(rowsToCommit(out.rows, 'complete_only').map((r) => r.rowNumber)), [4])
  assert.deepEqual(plain(rowsToCommit(out.rows, 'include_partial', true).map((r) => r.rowNumber)), [4, 5, 7])
})

test('completeness counts required fields double and ignores optional ones', () => {
  const def = IMPORT_DEFINITIONS.fee_items // required: name, defaultAmount, currency; later: nameAr, code, unit
  const half = rowCompleteness(def, { name: 'x', defaultAmount: 1, currency: 'SAR', description: 'ignored' })
  assert.deepEqual(plain(half), { filled: 6, total: 9, percent: 67 })
})

test('references and plan rules: unknown client, critical IAF codes, certificate cap, plan sections', () => {
  const sites = evaluateImport(IMPORT_DEFINITIONS.client_sites, [{ rowNumber: 4, raw: { client: 'Nobody', siteName: 'Plant' } }], ctx(), ['client', 'siteName'])
  assert.equal(sites.rows[0].errors[0].code, 'CLIENT_NOT_FOUND')

  const people = evaluateImport(IMPORT_DEFINITIONS.personnel, [{ rowNumber: 4, raw: { fullName: 'A', email: 'a@x.example', iafCodes: 'IAF 03, 29' } }], ctx({ isCriticalIafCode: (c) => c === '03' }), ['fullName', 'email', 'iafCodes'])
  assert.deepEqual(plain(people.rows[0].values.iafCodes), ['29'])
  assert.equal(people.rows[0].warnings[0].code, 'CRITICAL_CODE_NEEDS_EXAM')

  const certRow = (n) => ({ rowNumber: n, raw: { certificateNumber: `C-${n}`, client: 'Al Noor', standard: 'ISO 9001', scope: 'x', status: 'Issued', issueDate: '2025-01-01', expiryDate: '2099-01-01' } })
  const certs = evaluateImport(IMPORT_DEFINITIONS.certificates, [certRow(4), certRow(5)], ctx({ certificateLimit: { active: 9, limit: 10 } }), [])
  assert.deepEqual(plain(certs.rows.map((r) => r.status)), ['partial', 'invalid'])
  assert.equal(certs.rows[1].errors[0].code, 'PLAN_CERTIFICATE_LIMIT')

  const sections = evaluateImport(
    IMPORT_DEFINITIONS.audit_plan_sections,
    [
      { rowNumber: 4, raw: { section: 'agenda', date: '2026-12-07', startTime: '09:00', endTime: '10:00', activity: 'Opening meeting', auditors: '' } },
      { rowNumber: 5, raw: { section: 'travel' } },
      { rowNumber: 6, raw: { section: 'agenda', date: '2026-12-07', startTime: '11:00', endTime: '10:00', activity: 'x' } },
    ],
    ctx({ lists: { ...lists, personnel: [] } }),
    [],
  )
  assert.deepEqual(plain(sections.rows.map((r) => r.status)), ['partial', 'invalid', 'invalid'])
  assert.deepEqual(plain(sections.rows[0].missing), ['auditors'])
  assert.equal(sections.rows[2].errors[0].code, 'INVALID_TIME_RANGE')
})

test('a template reads back: key row, example row skipped, header-only files and CSV', () => {
  const def = IMPORT_DEFINITIONS.contacts
  const [data] = templateSheets(def, 'en', lists)
  const filled = [...data.rows, def.columns.map((c) => (c.key === 'firstName' ? 'Reem' : c.key === 'email' ? 'reem@x.example' : ''))]
  const parsed = gridToRows(def, filled)
  assert.equal(parsed.templateVersion, 'v1')
  assert.equal(parsed.templateEntity, 'contacts')
  assert.equal(parsed.rows.length, 1)
  assert.equal(parsed.rows[0].rowNumber, 4)
  assert.equal(parsed.rows[0].raw.firstName, 'Reem')

  const csv = parseCsv('﻿First name;البريد الإلكتروني;Client\n"Sara; Ali";s@x.example;Al Noor\n')
  const fromCsv = gridToRows(def, csv)
  assert.deepEqual(plain(fromCsv.recognised.sort()), ['client', 'email', 'firstName'])
  assert.equal(fromCsv.rows[0].raw.firstName, 'Sara; Ali')
})

test('import UI strings exist in English and Arabic and avoid dashes', () => {
  const flat = (node, prefix = '') => Object.entries(node).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${prefix}${k}.`) : [`${prefix}${k}`]))
  const en = flat(json('imports.en.json')).sort()
  const ar = flat(json('imports.ar.json')).sort()
  assert.deepEqual(ar, en)
  assert.ok(!DASH.test(JSON.stringify(json('imports.en.json')) + JSON.stringify(json('imports.ar.json'))))
})
