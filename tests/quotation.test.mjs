// Run: npm test  (or: node --test tests/quotation.test.mjs)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadSource } from './helpers/loadSource.mjs'

const form = loadSource('lib/quotationForm.ts')
const { REVIEW_SECTIONS } = loadSource('lib/api/cabApplicationReviewApi.ts')
const complete = Object.fromEntries(REVIEW_SECTIONS.map((key) => [key, 'complete']))

const valid = {
  today: '2026-10-24', offerEnd: '2026-11-01', rate: '100.10', auditorCount: 1,
  travel: '50.20', charges: [{ name: 'Other', cost: '0.10' }],
  standards: [], complexities: {}, foodCategory: '', studies: '1',
}
const steps = (patch) => [...form.quotationStepValidity({ ...valid, ...patch })]

test('quotation inputs: rate, offer date, team, travel and extra charges are validated per step', () => {
  assert.deepEqual(steps({}), [true, true, true])
  assert.deepEqual(steps({ offerEnd: valid.today, travel: '0', charges: [{ name: 'Free', cost: '0' }] }), [true, true, true])

  // Step 1: offer end date must be today or later, daily rate must be positive.
  for (const offerEnd of ['', '2026-10-23']) assert.equal(steps({ offerEnd })[0], false, offerEnd)
  for (const rate of ['', '0', '-1', 'abc']) assert.equal(steps({ rate })[0], false, rate)
  // Step 2: at least one auditor.
  assert.equal(steps({ auditorCount: 0 })[1], false)
  // Step 3: travel and every extra charge need a non-negative amount; charges need a name.
  for (const travel of ['', ' ', '-1', 'NaN']) assert.equal(steps({ travel })[2], false, travel)
  for (const cost of ['', ' ', '-1', 'NaN']) {
    assert.equal(steps({ charges: [{ name: 'Travel', cost }] })[2], false, cost)
    assert.equal(form.isValidQuotationCharge({ name: 'Travel', cost }), false, cost)
  }
  assert.equal(steps({ charges: [{ name: ' ', cost: '10' }] })[2], false)
  assert.equal(form.isValidQuotationCharge({ name: 'Travel', cost: '25.00' }), true)
})

test('quotation inputs: standards that need a complexity level or FSMS details block step 1 until set', () => {
  const certificates = [
    { certificateName: 'ISO 9001:2015' }, { certificateCode: '14001' },
    { certificateName: 'ISO 22000', certificateCode: '22000' }, { certificateName: 'ISO 19001' },
  ]
  const standards = form.standardCodesOf({ certificates })
  assert.deepEqual([...standards], ['ISO_9001', 'ISO_14001', 'ISO_22000'])
  assert.deepEqual([...form.standardCodesOf({})], [])
  assert.deepEqual([...form.complexityStandards(standards)], ['ISO_14001'])

  assert.equal(steps({ standards, foodCategory: 'AI' })[0], false, 'complexity missing')
  const ready = { standards, complexities: { ISO_14001: 'LOW' }, foodCategory: 'AI', studies: '2' }
  assert.equal(steps(ready)[0], true)
  assert.equal(steps({ ...ready, foodCategory: '' })[0], false)
  for (const studies of ['', '0', '1.5', 'x']) assert.equal(steps({ ...ready, studies })[0], false, studies)
  assert.ok(form.FOOD_CATEGORIES.includes('CIV'))
})

test('quotation API: only fully reviewed applications are offered; pricing and live quotation are resolved; failures propagate', async () => {
  let sections = complete
  let configs = []
  let quotations = []
  let fail = false
  const reviewRequests = []
  const applications = [
    { id: 'done', status: 'UNDER_REVIEW' },
    { id: 'incomplete', status: 'APPROVED' },
    { id: 'draft', status: 'DRAFT' },
    { id: 'rejected', status: 'REJECTED' },
  ]
  const api = loadSource('lib/api/cabApplicationQuotationApi.ts', (name) => ({
    '@/lib/api/cabApi': { getCabProfile: async () => ({ cab: { legalEntityName: 'Real CAB' } }) },
    '@/lib/api/cabApplicationRegisterApi': { listCabApplications: async () => applications },
    '@/lib/api/cabCertificationApplicationApi': {
      getCabCertificationApplication: async (id) => ({ id, status: 'UNDER_REVIEW', orderNumber: 'APP-123' }),
    },
    '@/lib/api/cabQuotationApi': {
      listPricingConfigs: async () => configs,
      listQuotations: async ({ applicationId }) => ({ items: quotations.filter((q) => q.applicationId === applicationId) }),
      getQuotation: async (id) => ({ ...quotations.find((q) => q.id === id), calculation: null }),
    },
    '@/lib/api/cabApplicationReviewApi': {
      REVIEW_SECTIONS,
      listSectionReviews: async (id) => {
        reviewRequests.push(id)
        if (fail) throw new Error('Unavailable')
        return id === 'incomplete' ? { ...complete, documents: 'partiallyComplete' } : sections
      },
    },
  })[name])

  assert.equal(api.isQuotationReviewComplete('UNDER_REVIEW', complete), true)
  assert.equal(api.isQuotationReviewComplete('APPROVED', { ...complete, branches: 'notApplicable' }), true)
  assert.equal(api.isQuotationReviewComplete('SUBMITTED', complete), true)
  assert.equal(api.isQuotationReviewComplete('QUOTATION_ISSUED', complete), true)
  assert.equal(api.isQuotationReviewComplete('DRAFT', complete), false)
  assert.equal(api.isQuotationReviewComplete('REJECTED', complete), false)
  for (const key of REVIEW_SECTIONS) {
    for (const status of [undefined, 'partiallyComplete', 'incomplete']) {
      assert.equal(api.isQuotationReviewComplete('UNDER_REVIEW', { ...complete, [key]: status }), false, `${key}=${status}`)
    }
  }

  const eligible = await api.listQuotationApplications()
  assert.deepEqual(eligible.map((application) => application.id), ['done'])
  assert.deepEqual(reviewRequests, ['done', 'incomplete'], 'drafts and rejected applications are not reviewed')

  configs = [
    { id: 'iso', isActive: true, standardId: 'iso-9001', dailyRate: '90.00' },
    { id: 'old', isActive: false, standardId: null, dailyRate: '80.00' },
    { id: 'global', isActive: true, standardId: null, dailyRate: '100.10', currency: 'USD' },
  ]
  quotations = [
    { id: 'q-old', applicationId: 'done', status: 'ISSUED', createdAt: '2026-10-01T00:00:00Z' },
    { id: 'q-cancelled', applicationId: 'done', status: 'CANCELLED', createdAt: '2026-10-20T00:00:00Z' },
    { id: 'q-live', applicationId: 'done', status: 'CREATED', createdAt: '2026-10-10T00:00:00Z' },
  ]
  const quote = await api.getCabApplicationQuotation('done')
  assert.equal(quote.application.orderNumber, 'APP-123')
  assert.equal(quote.cab.legalEntityName, 'Real CAB')
  assert.equal(quote.pricing.id, 'global', 'the active CAB-wide pricing config is used')
  assert.equal(quote.pricing.dailyRate, '100.10', 'decimal strings from the API are kept exactly')
  assert.equal(quote.quotation.id, 'q-live', 'newest non-cancelled quotation is the live one')
  assert.equal(quote.reviewComplete, true)

  sections = { ...complete, documents: 'incomplete' }
  assert.equal((await api.getCabApplicationQuotation('done')).reviewComplete, false)
  configs = configs.filter((config) => config.id !== 'global')
  quotations = quotations.filter((quotation) => quotation.id === 'q-cancelled')
  const empty = await api.getCabApplicationQuotation('done')
  assert.equal(empty.pricing, null)
  assert.equal(empty.quotation, null, 'a cancelled quotation allows creating a new one')

  fail = true
  await assert.rejects(api.listQuotationApplications(), /Unavailable/)
  await assert.rejects(api.getCabApplicationQuotation('done'), /Unavailable/)
})

test('a later CAB profile/onboarding save keeps existing certificate settings such as pricing defaults', () => {
  const setup = loadSource('lib/cabSetupForm.ts')
  const mapper = loadSource('lib/cabSetupMapper.ts', (name) => ({
    '@/lib/cabSetupForm': setup,
    '@/lib/api/cabSetupApi': { getSchemeOptions: () => [] },
  })[name])
  const pricing = { auditDays: 2.5, dailyRate: 100.10, currency: 'USD' }
  const draft = mapper.mapFormToCabSetupDraft(
    { cabSetup: setup.emptyCabSetupForm, languages: [], legalEntityName: 'Updated CAB' },
    { certificateSettings: { quotationDefaults: pricing, retainedSetting: 'keep' } },
  )
  assert.equal(draft.legalEntityName, 'Updated CAB')
  assert.equal(draft.certificateSettings.quotationDefaults, pricing)
  assert.equal(draft.certificateSettings.retainedSetting, 'keep')
})
