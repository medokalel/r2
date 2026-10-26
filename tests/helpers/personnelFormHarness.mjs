// Mounts PersonnelProfileForm with a tiny hooks runtime (useState / useEffect) and a fake
// employee API, so tests can drive the real save flow without a DOM or a test framework.
import { createRequire } from 'node:module'
import { loadSource } from './loadSource.mjs'

const nodeRequire = createRequire(import.meta.url)

// Real catalog modules (countries, sectors, schemes) so option lists are the shipped ones.
// Any other import of theirs (API clients, demo data) is stubbed as `{}`.
const CATALOGS = ['@/lib/countries', '@/lib/accreditationBodies', '@/lib/iafCodes', '@/lib/api/cabSetupApi', '@/lib/api/applicationDraftApi',
  '@/components/dashboard/companyProfile/constants']
const catalogs = new Map()
function loadCatalog(name) {
  if (name === '@/i18n') return { default: { language: 'en' } }
  if (name === '@/lib/api/demo/dataset') return { CLIENTS: [] }
  if (name === 'libphonenumber-js') return nodeRequire('libphonenumber-js')
  if (!CATALOGS.includes(name)) return undefined
  if (!catalogs.has(name)) catalogs.set(name, loadSource(`${name.slice(2)}.ts`, loadCatalog))
  return catalogs.get(name)
}

export const nodesOf = (node) =>
  !node || typeof node !== 'object' ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(nodesOf)]
export const textOf = (tree) => nodesOf(tree).flatMap((node) => [node.props?.children].flat(Infinity))
  .filter((child) => typeof child === 'string').join(' ')
export const flush = async () => { for (let i = 0; i < 10; i++) await Promise.resolve() }

export function createHarness({ cabSchemes = ['ISO 9001'] } = {}) {
  const calls = { create: [], update: [], uploads: [], matrix: [], competence: [], saved: [] }
  const control = { failCreate: false, failUpload: false, qualifications: [] }
  let nextId = 1
  class ApiError extends Error { constructor(message, errors) { super(message); this.errors = errors } }
  const employeeOf = (id, payload = {}) => ({
    id, status: 'ACTIVE', schemes: payload.schemes ?? [], professionalRole: payload.professionalRole ?? 'AUDITOR',
    user: { fullName: payload.fullName ?? 'Server Name', email: payload.email ?? 'server@example.test' },
  })
  const employeesApi = {
    CAB_PROFESSIONAL_ROLES: [{ value: 'AUDITOR', label: 'Auditor' }, { value: 'LEAD_AUDITOR', label: 'Lead Auditor' }],
    toBackendRole: (role) => (role === 'Lead Auditor' ? 'LEAD_AUDITOR' : 'AUDITOR'),
    cleanIafCodes: (codes) => codes,
    createCabEmployee: async (payload) => {
      calls.create.push(payload)
      if (control.failCreate) throw new ApiError('Email already exists', ['email: already registered'])
      return { employee: employeeOf(`employee-${nextId++}`, payload) } },
    updateCabEmployee: async (id, payload) => { calls.update.push({ id, payload }); return { employee: employeeOf(id, payload) } },
    uploadCabEmployeeImage: async (id) => ({ employee: { ...employeeOf(id), imageUrl: '/uploads/avatar.png' } }),
    uploadCabEmployeeQualification: async (id, file, category) => {
      calls.uploads.push({ id, name: file.name, category })
      if (control.failUpload) throw new ApiError('Upload unavailable')
      return { qualification: { id: `doc-${calls.uploads.length}`, originalName: file.name, fileUrl: `/uploads/${file.name}`, uploadedAt: '2026-10-21', documentType: category } }
    },
    getCabEmployeeDetail: async (id) => ({ employee: { ...employeeOf(id), qualifications: control.qualifications } }),
    deleteCabEmployeeQualification: async () => {},
  }

  const mocks = {
    'react-i18next': { useTranslation: () => ({ t: (key) => key, i18n: { language: 'en', dir: () => 'ltr' } }) },
    '@/lib/api/cabEmployeesApi': employeesApi,
    '@/lib/api/client': { ApiError },
    '@/lib/api/cabApi': { getCabProfile: async () => ({ cab: { schemes: cabSchemes.map((schemeName) => ({ schemeName })) } }) },
    '@/lib/api/competenceMatrixApi': {
      getCompetenceMatrix: async () => null,
      saveCompetenceMatrix: async (id, matrix) => { calls.matrix.push({ id, matrix }) },
    },
    '@/lib/api/cabCompetenceApi': { updateCompetencePerson: async (id, update) => { calls.competence.push({ id, update }) } },
    '@/lib/api/demo/demoStore': { isDemoMode: () => false },
    '@/lib/criticalCodeExams': { iafDigits: (code) => String(code).replace(/\D/g, '').padStart(2, '0') },
    '@/lib/validators': { isValidPhoneNumber: () => true },
    '@/lib/utils': { cn: (...names) => names.filter(Boolean).join(' ') },
    'libphonenumber-js': loadCatalog('libphonenumber-js'),
    '@/lib/countries': loadCatalog('@/lib/countries'),
    '@/lib/api/cabSetupApi': loadCatalog('@/lib/api/cabSetupApi'),
    '@/lib/api/applicationDraftApi': loadCatalog('@/lib/api/applicationDraftApi'),
    '@/components/dashboard/companyProfile/constants': loadCatalog('@/components/dashboard/companyProfile/constants'),
    '@/lib/personnelProfile': loadSource('lib/personnelProfile.ts'),
    '@/lib/enumLabel': loadSource('lib/enumLabel.ts'),
    '@/lib/format/dates': loadSource('lib/format/dates.ts', loadCatalog),
    'react-router-dom': { useLocation: () => ({ pathname: '/cab/competence/persons/new', search: '' }), Link: 'Link' },
    '@/components/ui/ErrorSummary': { ErrorSummary: 'ErrorSummary' },
    '@/lib/fieldNavigation': loadSource('lib/fieldNavigation.ts', (name) => (name === '@/lib/routes' ? loadSource('lib/routes.ts') : undefined), { URLSearchParams }),
    '@/lib/standardsCatalog': loadSource('lib/standardsCatalog.ts'),
  }

  // Minimal hooks runtime: state by call order, effects re-run when their deps change.
  let state = [], effectDeps = [], pendingEffects = [], cursor = 0, effectCursor = 0, dirty = false
  const react = {
    useState(initial) {
      const index = cursor++
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial
      return [state[index], (value) => {
        const next = typeof value === 'function' ? value(state[index]) : value
        if (next !== state[index]) { state[index] = next; dirty = true }
      }]
    },
    useEffect(effect, deps) {
      const index = effectCursor++
      const previous = effectDeps[index]
      if (!previous || !deps || deps.some((dep, i) => !Object.is(dep, previous[i]))) {
        effectDeps[index] = deps
        pendingEffects.push(effect)
      }
    },
  }
  const jsx = (type, props) => ({ type, props })
  const { PersonnelProfileForm } = loadSource('components/dashboard/cab/PersonnelProfileForm.tsx', (name) => {
    if (name === 'react') return react
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'Fragment' }
    return mocks[name]
  }, {
    URL: { createObjectURL: (file) => `blob:${file.name}`, revokeObjectURL() {} },
  })

  let props = {}
  const harness = {
    calls, control, tree: null,
    /** Mount a fresh form (a new page visit) for `person`. */
    async mount(person) {
      state = []; effectDeps = []; pendingEffects = []
      props = { person, onCancel() {}, onSaved: (value) => calls.saved.push(value) }
      harness.render(); await flush(); return harness.render()
    },
    render() {
      for (let pass = 0; pass < 5; pass++) {
        dirty = false; cursor = 0; effectCursor = 0
        harness.tree = PersonnelProfileForm(props)
        if (!dirty) break
      }
      pendingEffects.splice(0).forEach((effect) => effect())
      return harness.tree
    },
    /** The form fields object (the only state holding `employmentStartDate`). */
    get form() { return state.find((value) => value && typeof value === 'object' && 'employmentStartDate' in value) },
    setForm(patch) {
      const index = state.indexOf(harness.form)
      state[index] = { ...state[index], ...patch }
      harness.render()
    },
    find: (predicate) => nodesOf(harness.render()).find(predicate),
    toggleCurrentlyEmployed() { harness.find((node) => typeof node.props?.checked === 'boolean').props.onChange(); harness.render() },
    async submit() {
      await harness.render().props.onSubmit({ preventDefault() {} })
      await flush()
      return harness.render()
    },
    /** Text of the error area: the clickable validation summary, or the API error alert. */
    alertText: () => {
      const summary = harness.find((node) => node.type === 'ErrorSummary' && node.props?.issues?.length)
      if (summary) return summary.props.issues.map((issue) => issue.message).join(' ')
      return textOf(harness.find((node) => node.props?.role === 'alert'))
    },
    /** Items of the clickable validation summary ({ message, fieldId?, to? }). */
    issues: () => harness.find((node) => node.type === 'ErrorSummary')?.props.issues ?? [],
  }
  return harness
}
