// Run: npm test  (or: node --test tests/audit-time.test.mjs)
// The demo's audit-time calculator (src/lib/auditTime) must reproduce the backend's worked examples
// (backend docs/AUDIT_TIME.md, tests/unit/audit-time.calculator.test.js) so preview figures match the API.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadSource } from './helpers/loadSource.mjs'

const modules = new Map()
const resolve = (name) => {
  const paths = {
    '@/lib/auditTime/tables': 'lib/auditTime/tables.ts',
    '@/lib/auditTime/rules': 'lib/auditTime/rules.ts',
    '@/lib/auditTime/calculator': 'lib/auditTime/calculator.ts',
    '@/lib/auditTime/sectorCategories': 'lib/auditTime/sectorCategories.ts',
    '@/lib/auditTime/classification': 'lib/auditTime/classification.ts',
    '@/lib/quotationForm': 'lib/quotationForm.ts',
  }
  if (!paths[name]) return undefined
  if (!modules.has(name)) modules.set(name, loadSource(paths[name], resolve))
  return modules.get(name)
}
const { calculateAuditTime, roundHalf } = resolve('@/lib/auditTime/calculator')
const { draftQuotation } = loadSource('lib/auditTime/quotationDraft.ts', resolve)
const form = resolve('@/lib/quotationForm')

const days = (r, code = r.standards[0].standardCode) =>
  Object.fromEntries(r.standards.find((s) => s.standardCode === code).stages.map((s) => [s.stage, s.days]))

test('worked examples: tables, extrapolation, stages, minimums', () => {
  const qms = calculateAuditTime({ employees: 40, standards: [{ standardCode: 'ISO_9001' }] })
  assert.deepEqual(days(qms), { STAGE_1: 1, STAGE_2: 3, SURVEILLANCE_1: 1.5, SURVEILLANCE_2: 1.5 })
  assert.equal(qms.standards[0].nextCycleRecertificationDays, 2.5)
  assert.equal(calculateAuditTime({ employees: 12000, standards: [{ standardCode: 'ISO_9001' }] }).standards[0].baseDays, 23)
  assert.equal(calculateAuditTime({ employees: 25000, standards: [{ standardCode: 'ISO_9001' }] }).standards[0].baseDays, 29)
  assert.equal(calculateAuditTime({ employees: 12000, standards: [{ standardCode: 'ISO_14001', complexity: 'HIGH' }] }).standards[0].baseDays, 36)
  assert.deepEqual(days(calculateAuditTime({ employees: 3, standards: [{ standardCode: 'ISO_9001' }] })), { STAGE_1: 0.5, STAGE_2: 1, SURVEILLANCE_1: 1, SURVEILLANCE_2: 1 })
  assert.deepEqual(days(calculateAuditTime({ employees: 40, cycleType: 'RECERTIFICATION', standards: [{ standardCode: 'ISO_50001', complexity: 'HIGH' }] })),
    { RECERTIFICATION: 7, SURVEILLANCE_1: 3.5, SURVEILLANCE_2: 3.5 })
  for (const [value, expected] of [[1.24, 1], [1.25, 1.5], [1.75, 2], [4.5 / 3, 1.5]]) assert.equal(roundHalf(value), expected)
})

test('worked examples: 30 % cap, IMS, multi-site, food, on-site / remote', () => {
  const capped = calculateAuditTime({ employees: 100, standards: [{ standardCode: 'ISO_9001', adjustments: [
    { direction: 'DECREASE', percent: 20, reason: 'Low risk' }, { direction: 'DECREASE', percent: 15, reason: 'Repetitive' },
  ] }] })
  assert.equal(capped.standards[0].reductionCapApplied, true)
  assert.deepEqual(days(capped), { STAGE_1: 1.5, STAGE_2: 3.5, SURVEILLANCE_1: 1.5, SURVEILLANCE_2: 1.5 })

  const ims = calculateAuditTime({ employees: 100, integrationLevelPercent: 50, standards: [{ standardCode: 'ISO_9001' }, { standardCode: 'ISO_14001', complexity: 'MEDIUM' }] })
  assert.deepEqual(ims.standards.map((s) => s.initialAuditDays), [6.5, 7])

  const sites = [{ name: 'HQ', employees: 100, isCentral: true }, { name: 'A', employees: 80 }, { name: 'B', employees: 120 }, { name: 'C', employees: 50 }, { name: 'D', employees: 150 }]
  const ms = calculateAuditTime({ employees: 500, standards: [{ standardCode: 'ISO_9001' }], multiSite: { enabled: true, sites, siteReductionPercent: 60, centralReductionPercent: 10 } })
  assert.deepEqual({ ...ms.standards[0].multiSite.sampleSizes }, { INITIAL: 3, SURVEILLANCE: 2, RECERTIFICATION: 2 })
  assert.deepEqual(days(ms), { STAGE_1: 4, STAGE_2: 10, SURVEILLANCE_1: 3.5, SURVEILLANCE_2: 3.5 })

  const food = calculateAuditTime({ employees: 30, standards: [{ standardCode: 'ISO_22000', food: { category: 'CI', studies: 3 } }] })
  assert.deepEqual(days(food), { STAGE_1: 1, STAGE_2: 2.5, SURVEILLANCE_1: 1, SURVEILLANCE_2: 1 })

  const remote = calculateAuditTime({ employees: 40, remoteSharePercent: 20, standards: [{ standardCode: 'ISO_9001' }] })
  const stage2 = remote.standards[0].stages.find((s) => s.stage === 'STAGE_2')
  assert.deepEqual([stage2.days, stage2.onSiteMinDays, stage2.offSiteMaxDays, stage2.remoteDays], [3, 2.5, 0.5, 0.5])
})

test('errors carry the backend codes', () => {
  const code = (fn) => { try { fn(); return null } catch (error) { return error.code } }
  assert.equal(code(() => calculateAuditTime({ employees: 10, standards: [{ standardCode: 'ISO_14001' }] })), 'COMPLEXITY_REQUIRED')
  assert.equal(code(() => calculateAuditTime({ employees: 10, standards: [{ standardCode: 'ISO_9001', adjustments: [{ direction: 'DECREASE', percent: 5, reason: '' }] }] })), 'ADJUSTMENT_REASON_REQUIRED')
  assert.equal(code(() => calculateAuditTime({ employees: 0, standards: [{ standardCode: 'ISO_9001' }] })), 'EMPLOYEES_INVALID')
})

test('demo quotation draft: rates and totals match the API integration tests', () => {
  const pricing = [
    { id: 'sar', standardId: null, standard: null, currency: 'SAR', dailyRate: '3000.00', taxRate: '0.1500', isDefault: true, isActive: true },
    { id: 'ems', standardId: 'std-ISO_14001', standard: { id: 'std-ISO_14001', code: 'ISO_14001', name: 'ISO 14001:2015' }, currency: 'SAR', dailyRate: '3500.00', taxRate: '0.1500', isActive: true },
  ]
  const branches = [{ branchName: 'Head office', employeesInScope: 40, centralManagement: true }]
  const one = draftQuotation({ standards: ['ISO_9001'], branches, fallbackEmployees: 1, payload: {}, pricing })
  assert.equal(one.totalDays, 7)
  assert.equal(one.totalFee, 21000)
  assert.equal(one.currency, 'SAR')
  assert.equal(one.perStandard[0].rateSource, 'CAB_DEFAULT')

  const two = draftQuotation({ standards: ['ISO_9001', 'ISO_14001'], branches, fallbackEmployees: 1, payload: { complexities: { ISO_14001: 'LOW' }, integrationLevelPercent: 100 }, pricing })
  assert.deepEqual(JSON.parse(JSON.stringify(two.perStandard.map((s) => [s.standardCode, s.dailyRate, s.rateSource]))), [['ISO_9001', '3000.00', 'CAB_DEFAULT'], ['ISO_14001', '3500.00', 'CAB_STANDARD']])
  assert.deepEqual(JSON.parse(JSON.stringify(two.breakdown.standards.map((s) => s.initialAuditDays))), [3, 3])

  const renewal = draftQuotation({ standards: ['ISO_9001'], branches, fallbackEmployees: 1, requestType: 'RENEWAL', payload: {}, pricing })
  assert.deepEqual(JSON.parse(JSON.stringify(renewal.events.map((e) => [e.auditEventType, e.days]))), [['RECERTIFICATION', 2.5], ['SURVEILLANCE_1', 1.5], ['SURVEILLANCE_2', 1.5]])

  const euro = () => draftQuotation({ standards: ['ISO_9001'], branches, fallbackEmployees: 1, payload: { currency: 'EUR' }, pricing })
  assert.throws(euro, /No daily rate in EUR/)
  const entered = draftQuotation({ standards: ['ISO_9001'], branches, fallbackEmployees: 1, payload: { currency: 'EUR', dailyRate: 900 }, pricing })
  assert.equal(entered.totalFee, 6300)
})

test('editor payload: only the inputs that were set are sent', () => {
  const state = form.emptyCalculationForm({ currency: 'SAR', dailyRate: '3000.00' }, [
    { branchName: 'HQ', employeesInScope: 100, centralManagement: true }, { branchName: 'B', employeesInScope: 50, centralManagement: false }, { branchName: 'Empty', employeesInScope: 0 },
  ])
  assert.equal(state.rate, '3000')
  assert.deepEqual({ ...form.calculationPayload(state, ['ISO_9001'], []) }, { currency: 'SAR', dailyRate: 3000 })
  const full = form.calculationPayload({
    ...state, cycleType: 'RECERTIFICATION', integrationLevel: '50', remoteShare: '20', stage1Share: '40', multiSite: true, siteReduction: '10',
    complexities: { ISO_14001: 'LOW' }, standardRates: { ISO_14001: '3500', ISO_45001: '1' },
    adjustments: [{ id: 'a', standardCode: 'ISO_9001', direction: 'DECREASE', percent: '10', reason: ' Low risk ' }],
  }, ['ISO_9001', 'ISO_14001'], [
    { branchName: 'HQ', employeesInScope: 100, centralManagement: true }, { branchName: 'B', employeesInScope: 50 }, { branchName: 'Empty', employeesInScope: 0 },
  ])
  assert.equal(full.cycleType, 'RECERTIFICATION')
  assert.equal(full.integrationLevelPercent, 50)
  assert.equal(full.remoteSharePercent, 20)
  assert.equal(full.stage1SharePercent, 40)
  assert.deepEqual(JSON.parse(JSON.stringify(full.standardRates)), [{ standardCode: 'ISO_14001', dailyRate: 3500 }])
  assert.deepEqual(JSON.parse(JSON.stringify(full.multiSite.sites)), [{ name: 'HQ', employees: 100, isCentral: true }, { name: 'B', employees: 50, isCentral: false }])
  assert.equal(full.adjustments[0].reason, 'Low risk')
  assert.equal(form.isValidDayOverride('2.5', 'Second shift'), true)
  assert.equal(form.isValidDayOverride('2.3', 'Second shift'), false)
  assert.equal(form.isValidDayOverride('2', 'no'), false)
  assert.equal(form.canonicalStandardCode('ISO/IEC 27001:2022'), 'ISO_27001')
})

// ── Business-sector classification and IAF MD 1:2023 multi-site (backend examples 11 to 14) ──
const { classifyStandard, resolveClassification } = resolve('@/lib/auditTime/classification')
const { IAF_SECTOR_CATEGORIES } = resolve('@/lib/auditTime/sectorCategories')
const codeOf = (fn) => { try { fn(); return null } catch (error) { return error.code } }
const YES = { singleManagementSystem: true, centralAuthority: true, centralManagementReview: true, internalAuditAllSites: true, centralDataAnalysis: true, legalLink: true, similarProcesses: true, noSchemeRestriction: true, clientAcceptsSampling: true }
const TEN = [['HQ', 60, true], ['Riyadh', 40], ['Dammam', 35], ['Makkah', 30], ['Madinah', 25], ['Taif', 20], ['Abha', 15], ['Tabuk', 12], ['Hail', 10], ['Jazan', 8]]
  .map(([name, employees, isCentral]) => ({ name, employees, isCentral: Boolean(isCentral) }))
const qmsSites = (multiSite) => calculateAuditTime({ employees: 255, standards: [{ standardCode: 'ISO_9001' }], multiSite: { enabled: true, ...multiSite } })

test('example 11: nuclear fuel is High (QMS, OH&S) and Special (EMS); highest category of the codes', () => {
  assert.equal(Object.keys(IAF_SECTOR_CATEGORIES).length, 39)
  assert.equal(classifyStandard('ISO_9001', ['11']).suggested, 'HIGH')
  assert.equal(classifyStandard('ISO_14001', ['IAF_11']).suggested, 'SPECIAL')
  assert.equal(classifyStandard('ISO_45001', ['11']).suggested, 'HIGH')
  assert.equal(classifyStandard('ISO_9001', ['03', '30']).suggested, 'HIGH')
  assert.equal(classifyStandard('ISO_14001', ['03', '30']).suggested, 'MEDIUM')
  // The mapping is owner-confirmed (25 October 2026): no unverified code; 08 has no MD 5 category.
  const confirmed = classifyStandard('ISO_45001', ['03', '08', 'abc'])
  assert.deepEqual([...confirmed.unverifiedCodes], [])
  assert.deepEqual([...confirmed.unmappedCodes], ['08'])
  assert.equal(confirmed.confirmation.date, '2026-10-25')
  const ohs = calculateAuditTime({ employees: 50, standards: [{ standardCode: 'ISO_45001', iafCodes: ['03', '23'] }] })
  assert.ok(!ohs.warnings.some((w) => w.code === 'CLASSIFICATION_UNVERIFIED'), 'no needs-confirmation warning')
  assert.deepEqual([...ohs.warnings.find((w) => w.code === 'CLASSIFICATION_UNMAPPED').codes], ['23'])
  assert.ok(Object.values(IAF_SECTOR_CATEGORIES).every((row) => ['QMS', 'EMS', 'OHS'].every((k) => row[k].verified === (row[k].category !== null))))
  const s = classifyStandard('ISO_14001', ['28'])
  assert.equal(codeOf(() => resolveClassification(s, { selected: 'LOW' })), 'CLASSIFICATION_JUSTIFICATION_REQUIRED')
  assert.equal(resolveClassification(s, { override: { category: 'MEDIUM', justification: 'Only interior fit-out works, no civil works.' } }).override.lowered, true)
  const special = calculateAuditTime({ employees: 50, standards: [{ standardCode: 'ISO_14001', iafCodes: ['11'], specialCase: { days: 9, justification: 'Fuel fabrication plant, radiological aspects.' } }] })
  assert.deepEqual(days(special), { STAGE_1: 2.5, STAGE_2: 6.5, SURVEILLANCE_1: 3, SURVEILLANCE_2: 3 })
  assert.equal(codeOf(() => calculateAuditTime({ employees: 50, standards: [{ standardCode: 'ISO_14001', iafCodes: ['11'] }] })), 'SPECIAL_CASE_TIME_REQUIRED')
})

test('example 12: eligible multi-site, x = all 10 sites with the central function (IAF MD 1 §6.1.3.3)', () => {
  const r = qmsSites({ eligibility: YES, siteReductionPercent: 30, sites: TEN })
  assert.deepEqual({ ...r.standards[0].multiSite.sampleSizes }, { INITIAL: 4, SURVEILLANCE: 2, RECERTIFICATION: 3 })
  assert.equal(r.standards[0].multiSite.sampledGroup, 10)
  assert.equal(r.standards[0].baseDays, 13.4)
  assert.deepEqual(days(r), { STAGE_1: 4, STAGE_2: 9.5, SURVEILLANCE_1: 2.5, SURVEILLANCE_2: 2.5 })
  assert.deepEqual({ ...r.totals.threeYearCycle }, { stage1: 4, stage2: 9.5, surveillance1: 2.5, surveillance2: 2.5, recertification: 7, total: 18.5 })
})

test('example 13: individually audited sites, new site mandatory, rotation; not eligible', () => {
  const sites = TEN.map((s) => ({ ...s }))
  sites[2].sameProcesses = false
  sites[3].auditIndividually = true
  sites[9].isNew = true
  const r = qmsSites({ eligibility: YES, siteReductionPercent: 30, sites })
  assert.deepEqual([...r.standards[0].stages[0].siteNames], ['HQ', 'Riyadh', 'Dammam', 'Makkah', 'Jazan'])
  assert.deepEqual([...r.standards[0].stages[3].siteNames], ['HQ', 'Riyadh', 'Makkah'])
  assert.deepEqual(days(r), { STAGE_1: 5, STAGE_2: 12, SURVEILLANCE_1: 4, SURVEILLANCE_2: 4 })
  const open = qmsSites({ eligibility: { ...YES, internalAuditAllSites: null }, siteReductionPercent: 30, sites: TEN })
  assert.deepEqual(days(open), { STAGE_1: 9.5, STAGE_2: 22.5, SURVEILLANCE_1: 5.5, SURVEILLANCE_2: 4.5 })
  assert.ok(open.warnings.some((w) => w.code === 'SAMPLING_NOT_ELIGIBLE'))
})

test('example 14: IMS with the classification from IAF 28', () => {
  const r = calculateAuditTime({
    employees: 100,
    integrationLevelPercent: 50,
    standards: [
      { standardCode: 'ISO_9001', iafCodes: ['28'], adjustments: [{ direction: 'INCREASE', percent: 10, reason: 'Complex construction (QMS High risk)' }] },
      { standardCode: 'ISO_14001', iafCodes: ['28'] },
      { standardCode: 'ISO_45001', iafCodes: ['28'] },
    ],
  })
  assert.deepEqual(r.standards.map((s) => s.classification.category), ['HIGH', 'HIGH', 'HIGH'])
  assert.deepEqual(r.standards.map((s) => s.initialAuditDays), [7, 10, 10])
})
