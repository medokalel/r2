// Run: npm test  (or: node --test tests/personnel-profile.test.mjs)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadSource } from './helpers/loadSource.mjs'
import { createHarness, nodesOf } from './helpers/personnelFormHarness.mjs'

const rules = loadSource('lib/personnelProfile.ts')
const plain = (value) => JSON.parse(JSON.stringify(value))
const today = rules.toIsoDate(new Date())

test('personnel dates: both optional while employed, end date required and not before start once employment ended', () => {
  assert.equal(rules.toIsoDate(new Date(2026, 0, 5)), '2026-01-05')
  assert.deepEqual(plain(rules.personnelDateFields(undefined, today)), { employmentStartDate: today, employmentEndDate: '' })
  assert.deepEqual(plain(rules.personnelDateFields({ employmentStartDate: '2026-10-01T00:00:00.000Z', employmentEndDate: '2026-11-01T00:00:00.000Z' }, today)),
    { employmentStartDate: '2026-10-01', employmentEndDate: '2026-11-01' })
  assert.deepEqual(plain(rules.personnelDateFields({}, '')), { employmentStartDate: '', employmentEndDate: '' })

  assert.equal(rules.validateEmploymentDates(true, '', ''), null)
  assert.equal(rules.validateEmploymentDates(true, '2026-10-01', ''), null)
  assert.equal(rules.validateEmploymentDates(false, '2026-10-01', ''), 'endDateRequired')
  assert.equal(rules.validateEmploymentDates(false, '2026-10-01', '2026-09-01'), 'dateError')
  assert.equal(rules.validateEmploymentDates(false, '2026-10-01', '2026-10-01'), null)
  assert.equal(rules.validateEmploymentDates(false, '', '2026-09-01'), null)

  assert.deepEqual(plain(rules.employmentDatesPayload(true, '', '2026-11-01')), { employmentEndDate: null })
  assert.deepEqual(plain(rules.employmentDatesPayload(false, '2026-10-01', '2026-11-01')),
    { employmentStartDate: '2026-10-01T00:00:00.000Z', employmentEndDate: '2026-11-01T00:00:00.000Z' })
})

test('new member: trimmed name, today as default start date, competence matrix saved, full catalogs offered', async () => {
  const form = createHarness({ cabSchemes: ['ISO 9001', 'Custom CAB Scheme'] })
  const tree = await form.mount()
  assert.equal(form.form.employmentStartDate, today)

  // Option lists come from the shipped catalogs, extended (not replaced) by the CAB's own schemes.
  const field = (id) => nodesOf(tree).find((node) => node.props?.id === id).props
  assert.ok(field('personnel-country').options.length > 200)
  assert.equal(field('personnel-sector').options.length, 39)
  const schemeOptions = form.find((node) => node.props?.schemeOptions).props.schemeOptions
  assert.ok(schemeOptions.some((option) => option.value.startsWith('ISO 50001')), 'catalog must not shrink to CAB schemes')
  assert.ok(schemeOptions.some((option) => option.value === 'Custom CAB Scheme'), 'the CAB\'s own schemes are added')

  form.setForm({ name: ' New Member ', email: 'member@example.com', schemes: ['ISO 9001'] })
  form.find((node) => node.props?.onMatrixChange).props.onMatrixChange({ schemeIafCodes: { 'ISO 9001': ['IAF_01'] }, exams: [] })
  await form.submit()

  assert.equal(form.calls.create.length, 1)
  const [created] = form.calls.create
  assert.equal(created.fullName, 'New Member')
  assert.equal(created.employmentStartDate, `${today}T00:00:00.000Z`)
  assert.equal(created.employmentEndDate, null)
  assert.deepEqual(plain(form.calls.matrix[0].matrix.schemeIafCodes), { 'ISO 9001': ['IAF_01'] })
  const [saved] = form.calls.saved
  assert.equal(saved.name, 'New Member')
  assert.equal(saved.employmentStartDate, today)
  assert.equal(saved.employmentEndDate, '')
  assert.deepEqual([...saved.iafCodes], ['IAF_01'])
})

test('editing: invalid dates block the save; a valid edit updates the same employee and keeps evaluation records', async () => {
  const original = {
    id: 'employee-7', code: 'PER-0007', name: 'New Member', role: 'Auditor', email: 'member@example.com',
    avatarUrl: '/uploads/old-avatar.png', employmentStartDate: '2026-01-01', schemes: [],
    evaluation: { comments: 'Keep this evaluation', highestQualification: 'MSc' },
  }
  const form = createHarness()
  await form.mount(original)
  assert.equal(form.form.qualifications, 'MSc', 'qualification falls back to the evaluation record')

  form.toggleCurrentlyEmployed()
  form.setForm({ name: 'Updated Member', employmentStartDate: '2026-10-01', employmentEndDate: '2026-09-01' })
  await form.submit()
  assert.match(form.alertText(), /dateError$/)
  assert.equal(form.calls.update.length + form.calls.create.length, 0, 'nothing is saved')

  form.setForm({ employmentEndDate: '2026-11-01' })
  await form.submit()
  assert.equal(form.calls.create.length, 0, 'an edit never creates a second employee')
  assert.equal(form.calls.update.length, 1)
  assert.equal(form.calls.update[0].id, 'employee-7')
  assert.equal(form.calls.update[0].payload.employmentStartDate, '2026-10-01T00:00:00.000Z')
  assert.equal(form.calls.update[0].payload.employmentEndDate, '2026-11-01T00:00:00.000Z')
  assert.ok(!('evaluation' in form.calls.competence[0].update), 'the competence PUT leaves the stored evaluation alone')
  const saved = form.calls.saved.at(-1)
  assert.equal(saved.name, 'Updated Member')
  assert.equal(saved.evaluation.comments, 'Keep this evaluation')
  assert.equal(saved.avatarUrl, original.avatarUrl)
  assert.equal(saved.code, 'PER-0007')

  // Back to "currently employed" with the optional start date cleared: both dates are sent empty.
  form.toggleCurrentlyEmployed()
  form.setForm({ employmentStartDate: '' })
  await form.submit()
  const cleared = form.calls.update.at(-1).payload
  assert.ok(!('employmentStartDate' in cleared))
  assert.equal(cleared.employmentEndDate, null)
  assert.equal(form.calls.saved.at(-1).employmentStartDate, '')
  assert.equal(form.calls.saved.at(-1).employmentEndDate, '')
})

test('a failed save shows the API error and does not report the person as saved', async () => {
  const form = createHarness()
  form.control.failCreate = true
  await form.mount()
  form.setForm({ name: 'Unsaved Member', email: 'unsaved@example.com' })
  await form.submit()
  assert.equal(form.calls.create.length, 1)
  assert.equal(form.calls.saved.length, 0)
  assert.match(form.alertText(), /Email already exists/)
  assert.match(form.alertText(), /already registered/)
  assert.doesNotMatch(form.alertText(), /saving is incomplete/, 'no employee exists yet, so this is not a partial save')
})

test('reopening a member with no start date keeps it blank (today is only the default for new members)', async () => {
  const form = createHarness()
  await form.mount({ id: 'employee-9', code: 'PER-0009', name: 'No Start Date', role: 'Auditor', email: 'nostart@example.com', schemes: [] })
  assert.equal(form.form.employmentStartDate, '')
  await form.submit()
  assert.ok(!('employmentStartDate' in form.calls.update.at(-1).payload), 'saving does not invent a start date')
})

test('schemes: same standard under another name is accepted; a missing one is a link to the CAB profile with a way back', async () => {
  const form = createHarness({ cabSchemes: ['ISO 45001'] })
  await form.mount()
  form.setForm({ name: 'Scheme Member', email: 'scheme@example.com', schemes: ['ISO 45001:2018', 'ISO 14001:2015'] })
  await form.submit()
  assert.equal(form.calls.create.length, 0, 'nothing is saved while a scheme is missing')
  const [issue, ...rest] = form.issues()
  assert.equal(rest.length, 0, 'ISO 45001:2018 matches the CAB scheme saved as "ISO 45001"')
  assert.match(issue.message, /missingSchemeItem/)
  assert.match(issue.to, /^\/cab\/company-profile\?page=schemes&field=cab-setup-schemes&returnTo=%2Fcab%2Fcompetence%2Fpersons%2Fnew$/)

  form.setForm({ schemes: ['ISO 45001:2018'] })
  await form.submit()
  assert.equal(form.calls.create.length, 1)
  assert.deepEqual(plain(form.calls.create[0].schemes), ['ISO 45001'], 'saved under the CAB\'s own scheme name')
})

test('standards catalog: legacy and edition names match one scheme; display names carry no dash', () => {
  const catalog = loadSource('lib/standardsCatalog.ts')
  const dash = String.fromCharCode(0x2014)
  assert.equal(catalog.matchCatalogScheme(`ISO 9001 ${dash} QMS`).id, 'ISO_9001')
  assert.equal(catalog.matchCatalogScheme('ISO 27001:2022').id, 'ISO_27001')
  assert.equal(catalog.matchCatalogScheme('ISO/IEC 20000-1').cbRequirement.code, 'ISO/IEC 20000-6')
  assert.equal(catalog.matchCatalogScheme('FSSC 22000'), undefined, 'FSSC 22000 is not ISO 22000')
  assert.equal(catalog.schemeDisplayName(`ISO 45001 ${dash} OH&S`), 'ISO 45001:2018')
  assert.ok(catalog.STANDARDS_CATALOG.every((entry) => !entry.name.includes(dash)))
})
