/**
 * Competence register API.
 *
 *   GET /cab/competence/persons      → CompetencePerson[] (personnel register)
 *   GET /cab/competence/persons/:id  → CompetencePerson (evaluation, trainings, audit log, witnessing …)
 *   PUT /cab/competence/persons/:id  ← CompetencePersonUpdate → CompetencePerson
 *   PATCH /cab-employees/:id/status  (activate / deactivate a person, via cabEmployeesApi)
 *
 * `id` is the CAB employee id. Identity (name, e-mail, phone, job title, schemes, IAF codes,
 * status) comes from the employee record; the PUT stores the competence details. The audit
 * log is read-only: completed audits add to it on the server.
 *
 * Preview (demo mode) only: the register is cached in localStorage, seeded from the shared
 * demo store and merged with the mock employee list.
 */

import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { competencePeople } from '@/lib/api/demo/records'
import {
  formatEmployeePhone,
  getCabEmployeeDetail,
  getProfessionalRoleLabel,
  listCabEmployees,
  updateCabEmployeeStatus,
} from '@/lib/api/cabEmployeesApi'
import { formatIafCodesToSectorNames } from '@/lib/iafCodes'

export const PERSONNEL_QUALIFICATION_OPTIONS = [
  { value: "Bachelor's Degree", key: 'bachelor' },
  { value: "Master's Degree", key: 'master' },
  { value: 'Doctorate / PhD', key: 'doctorate' },
  { value: 'Diploma', key: 'diploma' },
] as const

export interface CompetencePerson {
  id: string
  code: string
  name: string
  role: 'Auditor' | 'Lead Auditor' | 'Technical Expert' | 'Decision Maker' | 'Reviewer'
  country: string
  schemes: string[]
  authorizedScope: string
  expiryDate: string
  status: 'Authorized' | 'Under review' | 'Pending' | 'Expired' | 'Suspended'
  avatarUrl?: string
  employmentStartDate?: string
  employmentEndDate?: string
  iafCodes?: string[]
  qualifications?: string
  email: string
  phone: string
  statusDot: 'Active' | 'Inactive' | 'Suspended'
  // Evaluation data
  evaluation?: {
    scheme: string
    proposedSector: string
    evaluationDate: string
    evaluator: string
    overallResult: 'Competent' | 'Not Yet Competent' | 'Requires Training'
    comments: string
    highestQualification: string
    fieldOfStudy: string
    relevantExperienceYears: number
    sectorExperienceYears: number
    additionalNotes: string
    status: 'In progress' | 'Submitted' | 'Authorized' | 'Rejected'
    lastSaved: string
  }
  trainings?: Array<{
    id: string
    date: string
    course: string
    provider: string
    result: 'Completed' | 'Pending' | 'Failed'
  }>
  auditLogs?: Array<{
    id: string
    date: string
    client: string
    clientCode: string
    activity: string
    role: string
    result: 'Satisfactory' | 'Needs Improvement' | 'Unsatisfactory'
    /** 'auditPlan': recorded when an audit plan was completed (only the result can change); 'manual': added by hand. */
    source?: 'auditPlan' | 'manual'
  }>
  witnessings?: Array<{
    id: string
    date: string
    client: string
    clientCode: string
    auditType: string
    witnessedBy: string
    outcome: 'Positive' | 'Conditional' | 'Negative'
  }>
  restrictions?: Array<{
    id: string
    type: string
    details: string
    expiry?: string
  }>
}

const STORAGE_KEY = 'icasco_cab_competence_personnel_v1'

const MOCK_IDS = new Set(['per-1', 'per-2', 'per-3', 'per-4', 'per-5', 'per-6'])

/** Preview only: the locally cached register. */
function getStoredPersonnel(): CompetencePerson[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    // Preview: start from the shared demo register (lib/api/demo/records.ts) so
    // auditors match the audit plans, quotations and decisions.
    if (!raw && isDemoMode()) {
      const seeded = competencePeople()
      savePersonnelList(seeded)
      return seeded
    }
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const dynamicOnly = parsed.filter((p) => p && !MOCK_IDS.has(p.id))
        if (dynamicOnly.length !== parsed.length) {
          savePersonnelList(dynamicOnly)
        }
        return dynamicOnly
      }
    }
  } catch {
    // Ignore JSON parse errors
  }
  return []
}

function savePersonnelList(list: CompetencePerson[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function getPersonById(idOrCode: string): CompetencePerson | undefined {
  const list = getStoredPersonnel()
  return list.find((p) => p.id === idOrCode || p.code === idOrCode)
}

function savePersonEvaluation(idOrCode: string, updated: Partial<CompetencePerson>): CompetencePerson | undefined {
  const list = getStoredPersonnel()
  const idx = list.findIndex((p) => p.id === idOrCode || p.code === idOrCode)
  if (idx === -1) return undefined
  const merged: CompetencePerson = {
    ...list[idx],
    ...updated,
    evaluation: {
      ...list[idx].evaluation,
      ...(updated.evaluation || {}),
      lastSaved: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    } as CompetenceEvaluation,
  }
  list[idx] = merged
  savePersonnelList(list)
  return merged
}

type CompetenceEvaluation = NonNullable<CompetencePerson['evaluation']>

/** What PUT /cab/competence/persons/:id accepts; every field is optional. */
export interface CompetencePersonUpdate {
  role?: CompetencePerson['role']
  country?: string
  authorizedScope?: string
  /** YYYY-MM-DD; empty or null clears it */
  expiryDate?: string | null
  /** Highest qualification */
  qualifications?: string
  /** Merged into the stored evaluation; a first evaluation needs scheme, evaluationDate and overallResult. */
  evaluation?: Partial<Omit<CompetenceEvaluation, 'lastSaved'>>
  /** Each list replaces the stored one. */
  trainings?: NonNullable<CompetencePerson['trainings']>
  witnessings?: NonNullable<CompetencePerson['witnessings']>
  restrictions?: NonNullable<CompetencePerson['restrictions']>
}

const personPath = (id: string) => `/cab/competence/persons/${encodeURIComponent(id)}`

/** The competence view of one person (employee id, or the register code in the preview). */
export async function fetchCompetencePerson(idOrCode: string): Promise<CompetencePerson | undefined> {
  if (!isDemoMode()) return authorizedRequest<CompetencePerson>(personPath(idOrCode))
  return getPersonById(idOrCode)
}

export async function updateCompetencePerson(
  idOrCode: string,
  update: CompetencePersonUpdate,
): Promise<CompetencePerson | undefined> {
  if (!isDemoMode()) {
    return authorizedRequest<CompetencePerson>(personPath(idOrCode), {
      method: 'PUT',
      body: JSON.stringify(update),
    })
  }
  const { expiryDate, evaluation, ...rest } = update
  const fields: Partial<CompetencePerson> = {
    ...rest,
    ...(expiryDate !== undefined ? { expiryDate: expiryDate ?? '' } : {}),
  }
  // savePersonEvaluation merges the evaluation into the stored one.
  if (evaluation) return savePersonEvaluation(idOrCode, { ...fields, evaluation: evaluation as CompetenceEvaluation })
  const list = getStoredPersonnel()
  const idx = list.findIndex((p) => p.id === idOrCode || p.code === idOrCode)
  if (idx === -1) return undefined
  list[idx] = { ...list[idx], ...fields }
  savePersonnelList(list)
  return list[idx]
}

const personsPath = '/cab/competence/persons'

/**
 * The personnel register. Real mode: GET /cab/competence/persons. Preview: the mock employee list
 * merged with the locally cached competence details (`language` localises the derived scope).
 */
export async function listCompetencePersons(language: string): Promise<CompetencePerson[]> {
  if (!isDemoMode()) return authorizedRequest<CompetencePerson[]>(personsPath)
  try {
    const res = await listCabEmployees()
    const rawItems = Array.isArray(res) ? res : res?.items || res?.employees || []
    if (rawItems.length === 0) return getStoredPersonnel()
    const stored = getStoredPersonnel()
    const mapped: CompetencePerson[] = rawItems.map((emp, index) => {
      const existing = stored.find((s) => s.id === emp.id)
      const role = emp.professionalRole ? getProfessionalRoleLabel(emp.professionalRole) : 'Auditor'
      const resolvedStatusDot: CompetencePerson['statusDot'] =
        existing?.statusDot ?? (emp.status === 'INACTIVE' ? 'Inactive' : 'Active')
      const backendStart = emp.employmentStartDate?.split('T')[0]
      const existingExpiry = existing?.expiryDate?.split('T')[0]
      const cleanExistingExpiry =
        existingExpiry && existingExpiry !== '2026-12-31' && existingExpiry !== backendStart ? existingExpiry : ''
      return {
        ...existing,
        id: emp.id,
        code: existing?.code || `PER-${String(index + 1).padStart(4, '0')}`,
        name: existing?.name || emp.user?.fullName || 'Employee',
        role: role as CompetencePerson['role'],
        country: existing?.country || 'Saudi Arabia',
        schemes: emp.schemes?.length ? emp.schemes : existing?.schemes || [],
        authorizedScope:
          formatIafCodesToSectorNames(emp.iafCodes, existing?.authorizedScope, language) || 'Quality management systems',
        expiryDate: cleanExistingExpiry || (emp as { expiryDate?: string | null }).expiryDate?.split('T')[0] || '',
        status:
          resolvedStatusDot === 'Inactive'
            ? 'Suspended'
            : emp.status === 'ACTIVE'
              ? 'Authorized'
              : existing?.status || 'Under review',
        avatarUrl: emp.imageUrl || existing?.avatarUrl || undefined,
        employmentStartDate: (existing?.employmentStartDate || emp.employmentStartDate)?.split('T')[0] || undefined,
        employmentEndDate:
          (existing?.employmentEndDate || (emp as { employmentEndDate?: string | null }).employmentEndDate)?.split('T')[0] ||
          undefined,
        iafCodes: emp.iafCodes || existing?.iafCodes || [],
        email: emp.user?.email || existing?.email || '',
        phone: existing?.phone || formatEmployeePhone(emp.user?.phone, emp.user?.phoneCountryCode) || '',
        statusDot: resolvedStatusDot,
      }
    })
    savePersonnelList(mapped)
    return mapped
  } catch {
    return getStoredPersonnel()
  }
}

/**
 * One person for the profile editor. The `role` is the employee's job title label (what the
 * profile form edits and saves back as `professionalRole`), not the competence role.
 */
export async function fetchPersonnelProfile(id: string): Promise<CompetencePerson | undefined> {
  if (!isDemoMode()) {
    const [{ employee }, person] = await Promise.all([getCabEmployeeDetail(id), fetchCompetencePerson(id)])
    if (!person) return undefined
    const role = employee?.professionalRole ? getProfessionalRoleLabel(employee.professionalRole) : person.role
    return { ...person, role: role as CompetencePerson['role'] }
  }
  try {
    const { employee } = await getCabEmployeeDetail(id)
    const stored = getPersonById(id)
    if (!employee) return stored
    const roleLabel = employee.professionalRole ? getProfessionalRoleLabel(employee.professionalRole) : 'Auditor'
    const rawStart = stored?.employmentStartDate || employee.employmentStartDate
    const rawEnd = stored?.employmentEndDate || (employee as { employmentEndDate?: string | null }).employmentEndDate
    const backendStart = employee.employmentStartDate?.split('T')[0]
    const storedExpiry = stored?.expiryDate?.split('T')[0]
    const cleanStoredExpiry =
      storedExpiry && storedExpiry !== '2026-12-31' && storedExpiry !== backendStart ? storedExpiry : ''
    return {
      ...stored,
      id: employee.id,
      code: stored?.code || `PER-${employee.id.slice(0, 4).toUpperCase()}`,
      name: stored?.name || employee.user?.fullName || 'Employee',
      role: (roleLabel || 'Auditor') as CompetencePerson['role'],
      country: stored?.country || 'Saudi Arabia',
      schemes: employee.schemes?.length ? employee.schemes : stored?.schemes || [],
      authorizedScope:
        (employee.iafCodes?.length ? `IAF: ${employee.iafCodes.join(', ')}` : stored?.authorizedScope) ||
        'Quality management systems',
      expiryDate: cleanStoredExpiry || (employee as { expiryDate?: string | null }).expiryDate?.split('T')[0] || '',
      status: employee.status === 'ACTIVE' ? 'Authorized' : 'Under review',
      avatarUrl: employee.imageUrl || stored?.avatarUrl || undefined,
      employmentStartDate: rawStart ? rawStart.split('T')[0] : undefined,
      employmentEndDate: rawEnd ? rawEnd.split('T')[0] : undefined,
      iafCodes: employee.iafCodes || stored?.iafCodes || [],
      email: employee.user?.email || stored?.email || '',
      phone: stored?.phone || formatEmployeePhone(employee.user?.phone, employee.user?.phoneCountryCode) || '',
      statusDot: employee.status === 'INACTIVE' ? 'Inactive' : 'Active',
    }
  } catch {
    return getPersonById(id)
  }
}

/**
 * The cached person shown before the server answers (preview only; undefined in real mode,
 * where every screen loads from the API).
 */
export function getCachedPerson(idOrCode: string): CompetencePerson | undefined {
  return isDemoMode() ? getPersonById(idOrCode) : undefined
}

/** After the profile form saved a person: preview keeps it in the local register; real mode has nothing to do. */
export function rememberSavedPerson(person: CompetencePerson): void {
  if (!isDemoMode()) return
  const list = getStoredPersonnel()
  const index = list.findIndex((item) => item.id === person.id)
  if (index >= 0) list[index] = { ...list[index], ...person }
  else list.unshift(person)
  savePersonnelList(list)
}

/**
 * Activate / deactivate a person (PATCH /cab-employees/:id/status) and return the register
 * fields that change. Preview also updates the local register.
 */
export async function setPersonActive(
  id: string,
  active: boolean,
): Promise<Pick<CompetencePerson, 'status' | 'statusDot'>> {
  const next: Pick<CompetencePerson, 'status' | 'statusDot'> = active
    ? { status: 'Authorized', statusDot: 'Active' }
    : { status: 'Suspended', statusDot: 'Inactive' }
  if (!isDemoMode()) {
    await updateCabEmployeeStatus(id, active ? 'ACTIVE' : 'INACTIVE')
    // The register status is derived on the server (evaluation, expiry); read it back.
    const person = await fetchCompetencePerson(id)
    return person ? { status: person.status, statusDot: person.statusDot } : next
  }
  const list = getStoredPersonnel()
  if (list.some((item) => item.id === id)) {
    savePersonnelList(list.map((item) => (item.id === id ? { ...item, ...next } : item)))
  }
  if (!id.startsWith('per-')) {
    await updateCabEmployeeStatus(id, active ? 'ACTIVE' : 'INACTIVE').catch(() => undefined)
  }
  return next
}

/* ───────────── Audit log entries ─────────────
 *   POST   /cab/competence/persons/:id/audit-logs          add a manual entry
 *   PATCH  /cab/competence/persons/:id/audit-logs/:logId   correct an entry (audit-plan entries: result only)
 *   DELETE /cab/competence/persons/:id/audit-logs/:logId   delete a manual entry
 * Every call returns the whole person. Trainings and witnessed audits are saved with
 * updateCompetencePerson (each list replaces the stored one).
 */

export type CompetenceAuditLogEntry = NonNullable<CompetencePerson['auditLogs']>[number]
export type CompetenceAuditLogInput = Omit<CompetenceAuditLogEntry, 'id' | 'source'>

const auditLogPath = (id: string, logId?: string) => `${personPath(id)}/audit-logs${logId ? `/${encodeURIComponent(logId)}` : ''}`

async function demoEditAuditLogs(
  id: string,
  edit: (logs: CompetenceAuditLogEntry[]) => CompetenceAuditLogEntry[],
): Promise<CompetencePerson | undefined> {
  const person = getPersonById(id)
  if (!person) return undefined
  const updated = { ...person, auditLogs: edit(person.auditLogs ?? []) }
  rememberSavedPerson(updated)
  return updated
}

export async function addCompetenceAuditLog(id: string, input: CompetenceAuditLogInput): Promise<CompetencePerson | undefined> {
  if (!isDemoMode()) return authorizedRequest<CompetencePerson>(auditLogPath(id), { method: 'POST', body: JSON.stringify(input) })
  return demoEditAuditLogs(id, (logs) => [{ ...input, id: `log-${Date.now()}`, source: 'manual' }, ...logs])
}

export async function updateCompetenceAuditLog(
  id: string,
  logId: string,
  patch: Partial<CompetenceAuditLogInput>,
): Promise<CompetencePerson | undefined> {
  if (!isDemoMode()) return authorizedRequest<CompetencePerson>(auditLogPath(id, logId), { method: 'PATCH', body: JSON.stringify(patch) })
  return demoEditAuditLogs(id, (logs) =>
    logs.map((log) => (log.id !== logId ? log : log.source === 'manual' ? { ...log, ...patch } : { ...log, ...(patch.result ? { result: patch.result } : {}) })),
  )
}

export async function deleteCompetenceAuditLog(id: string, logId: string): Promise<CompetencePerson | undefined> {
  if (!isDemoMode()) return authorizedRequest<CompetencePerson>(auditLogPath(id, logId), { method: 'DELETE' })
  return demoEditAuditLogs(id, (logs) => logs.filter((log) => log.id !== logId || log.source !== 'manual'))
}

