/**
 * Audit planning API.
 *
 *   GET   /cab/audit-plans?search&country&status&period   → AuditPlan[]
 *   GET   /cab/audit-plans/:id                            → AuditPlan (id or plan number)
 *   POST  /cab/audit-plans                                → AuditPlan (Draft)
 *   PATCH /cab/audit-plans/:id                            → AuditPlan
 *   PATCH /cab/audit-plans/:id/sections/:section          → AuditPlan (one card of the Build page:
 *         site | remote | travel | declarations | agenda)
 *   GET   /cab/audit-plans/:id/readiness                  → EligibilityCheckResult
 *   POST  /cab/audit-plans/:id/send                       → { success, message, timestamp, warnings? } (409 AGREEMENT_REQUIRED without an active agreement)
 *   POST  /cab/audit-plans/:id/reschedule                 → AuditPlan
 *
 * Accepting a quotation drafts the Stage 1 plan on the server; sending a plan notifies
 * the client (`audit_plan_to_confirm`) and adds it to the client's periodic visits.
 * Status lifecycle (changeAuditPlanStatus): Planned / Rescheduled → In progress (the server
 * opens the audit report, `reportId`) → Under review → Completed (the audit is added to the
 * competence audit log of every team member).
 * In the preview (demo mode) plans live in the shared demo store.
 */

import { authorizedRequest } from '@/lib/api/authorizedClient'
import { ApiError } from '@/lib/api/client'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { auditPlans, notify, saveAuditPlans, scopeToSession } from '@/lib/api/demo/records'
import { CLIENTS, PEOPLE } from '@/lib/api/demo/dataset'
import { enforceGate as enforceAgreementGate } from '@/lib/api/demo/agreementsDemo'
import { deriveClientCode, listAllCabAuditClients } from '@/lib/api/clientRegistrationApi'
import { listCabEmployees, type CabEmployee } from '@/lib/api/cabEmployeesApi'
import { listAuditReports } from '@/lib/api/cabAuditReportingApi'
import { notSet, rangeText } from '@/lib/emptyValue'

export interface AgendaActivity {
  id: string
  date: string
  startTime: string
  endTime: string
  activity: string
  auditors: string[]
  durationHours: number
}

export interface SiteAllocation {
  siteCode: string
  siteName: string
  onSitePersonnel: string[]
  siteAddress: string
}

export interface RemoteActivities {
  enabled: boolean
  activities: string[]
  platform: string
  notes: string
}

export interface TravelNotes {
  details: string
}

export interface TeamDeclarations {
  availabilityConfirmed: boolean
  noConflictsDeclared: boolean
  conflictNotes?: string
}

export interface EligibilityCheckResult {
  passed: boolean
  competenceAuthorization: {
    status: 'passed' | 'warning' | 'failed'
    details: string
    certifiedStandards: string[]
  }
  availability: {
    status: 'passed' | 'warning' | 'failed'
    details: string
    conflictingEvents: string[]
  }
  impartiality: {
    status: 'passed' | 'warning' | 'failed'
    details: string
    conflictReasons: string[]
    silentOverrideAllowed: false
  }
}

export interface AuditPlan {
  id: string
  planNumber: string // e.g., 'AUD-0024'
  /** Audit-client organization (real API; required when creating a plan). */
  organizationId?: string
  /** Linked certification application (real API). */
  applicationId?: string | null
  clientName: string
  clientCode: string
  country: string
  stage: 'Planning' | 'Stage 1' | 'Stage 2' | 'Surveillance 1' | 'Surveillance 2' | 'Recertification' | 'Special Audit'
  applicationNumber: string // e.g., 'APP-0024'
  standardName: string // e.g., 'Food Safety Management (ISO 22000)' or 'ISO 22000:2018'
  reviewedDurationCode: string // e.g., 'DUR-0024'
  reviewedDurationDays: number // e.g., 3.0
  totalEffortHours: number // e.g., 8.0
  siteCode: string // e.g., 'SITE-001'
  siteName: string // e.g., 'Riyadh (Main)'
  siteAddress: string
  primaryContactName: string
  primaryContactEmail: string
  primaryContactPhone: string
  proposedStartDate: string // 'YYYY-MM-DD'
  proposedEndDate: string // 'YYYY-MM-DD'
  durationDays: number
  timezone: string // e.g., 'Asia/Riyadh'
  leadAuditor: string
  auditTeam: string[]
  auditObjectives: string
  scopeSummary: string
  status: 'Draft' | 'Planned' | 'In progress' | 'Under review' | 'Completed' | 'Rescheduled'
  agendaActivities: AgendaActivity[]
  siteAllocation: SiteAllocation
  remoteActivities: RemoteActivities
  travelNotes: TravelNotes
  teamDeclarations: TeamDeclarations
  version: number
  rescheduleHistory?: Array<{
    date: string
    previousDates: string
    newDates: string
    reason: string
    rescheduledBy: string
  }>
  /** When the plan was last sent to the client (real API). */
  sentAt?: string | null
  /** When the client confirmed the visit (real API). */
  clientConfirmedAt?: string | null
  /** Audit report opened when the plan was started (null before "In progress"). */
  reportId?: string | null
  reportStatus?: 'Draft' | 'Finalized' | null
  createdAt: string
  updatedAt: string
}

// Plans live in the shared demo store so the schedule, calendar, certification
// cycles and client portal show the same audits (lib/api/demo/records.ts).
function getStoredPlans(): AuditPlan[] {
  return auditPlans()
}

function saveStoredPlans(plans: AuditPlan[]): void {
  saveAuditPlans(plans)
}

export interface AuditPlanFilters {
  search?: string
  /** 'YYYY-MM' — plans overlapping that month. */
  plannedPeriod?: string
  country?: string
  status?: string
}

const ALL = 'All'
const planPath = (idOrNumber: string) => `/cab/audit-plans/${encodeURIComponent(idOrNumber)}`

/** Status values a save may set; Planned / Rescheduled come from send / reschedule. */
const EDITABLE_STATUSES: ReadonlyArray<AuditPlan['status']> = ['Draft', 'In progress', 'Under review', 'Completed']

/** Fields the API accepts on create / update (everything else is derived by the server). */
const WRITABLE_FIELDS = [
  'stage', 'standardName', 'country', 'reviewedDurationDays', 'totalEffortHours', 'siteCode', 'siteName',
  'siteAddress', 'primaryContactName', 'primaryContactEmail', 'primaryContactPhone', 'proposedStartDate',
  'proposedEndDate', 'timezone', 'leadAuditor', 'auditTeam', 'auditObjectives', 'scopeSummary',
  'siteAllocation', 'remoteActivities', 'travelNotes', 'teamDeclarations', 'agendaActivities',
] as const satisfies ReadonlyArray<keyof AuditPlan>

function toPlanPayload(plan: Partial<AuditPlan>): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  for (const key of WRITABLE_FIELDS) {
    if (plan[key] !== undefined) body[key] = plan[key]
  }
  if (plan.status && EDITABLE_STATUSES.includes(plan.status)) body.status = plan.status
  return body
}

export async function fetchAuditPlans(filters?: AuditPlanFilters): Promise<AuditPlan[]> {
  if (!isDemoMode()) {
    const query = new URLSearchParams()
    if (filters?.search?.trim()) query.set('search', filters.search.trim())
    if (filters?.country && filters.country !== ALL) query.set('country', filters.country)
    if (filters?.status && filters.status !== ALL) query.set('status', filters.status)
    if (filters?.plannedPeriod && filters.plannedPeriod !== ALL) query.set('period', filters.plannedPeriod)
    const qs = query.toString()
    return authorizedRequest<AuditPlan[]>(`/cab/audit-plans${qs ? `?${qs}` : ''}`)
  }
  await new Promise((r) => setTimeout(r, 80))
  let plans = scopeToSession(getStoredPlans(), (p) => p.clientCode)

  if (filters) {
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase()
      plans = plans.filter(
        (p) =>
          p.planNumber.toLowerCase().includes(q) ||
          p.clientName.toLowerCase().includes(q) ||
          p.clientCode.toLowerCase().includes(q) ||
          p.leadAuditor.toLowerCase().includes(q) ||
          p.standardName.toLowerCase().includes(q)
      )
    }

    if (filters.country && filters.country !== 'All') {
      plans = plans.filter((p) => p.country.toLowerCase() === filters.country!.toLowerCase())
    }

    if (filters.status && filters.status !== 'All') {
      plans = plans.filter((p) => p.status.toLowerCase() === filters.status!.toLowerCase())
    }

    if (filters.plannedPeriod && filters.plannedPeriod !== 'All') {
      const month = filters.plannedPeriod
      plans = plans.filter((p) => p.proposedStartDate.slice(0, 7) <= month && p.proposedEndDate.slice(0, 7) >= month)
    }
  }

  return plans
}

export async function fetchAuditPlanById(idOrNumber: string): Promise<AuditPlan | null> {
  if (!isDemoMode()) {
    try {
      return await authorizedRequest<AuditPlan>(planPath(idOrNumber))
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null
      throw err
    }
  }
  await new Promise((r) => setTimeout(r, 60))
  const plans = getStoredPlans()
  const found = plans.find((p) => p.id === idOrNumber || p.planNumber === idOrNumber)
  return found || null
}

export async function saveAuditPlan(plan: Partial<AuditPlan> & { id?: string }): Promise<AuditPlan> {
  if (!isDemoMode()) {
    if (plan.id) {
      return authorizedRequest<AuditPlan>(planPath(plan.id), {
        method: 'PATCH',
        body: JSON.stringify(toPlanPayload(plan)),
      })
    }
    if (!plan.organizationId) throw new Error('organizationId is required to create an audit plan')
    return authorizedRequest<AuditPlan>('/cab/audit-plans', {
      method: 'POST',
      body: JSON.stringify({
        ...toPlanPayload({ ...plan, status: undefined }),
        organizationId: plan.organizationId,
        ...(plan.applicationId ? { applicationId: plan.applicationId } : {}),
      }),
    })
  }
  await new Promise((r) => setTimeout(r, 120))
  const plans = getStoredPlans()

  if (plan.id) {
    const index = plans.findIndex((p) => p.id === plan.id || p.planNumber === plan.id)
    if (index >= 0) {
      const updated: AuditPlan = {
        ...plans[index],
        ...plan,
        updatedAt: new Date().toISOString(),
      }
      plans[index] = updated
      saveStoredPlans(plans)
      return updated
    }
  }

  // Create new plan
  const count = plans.length + 1
  const newNumber = `AUD-${String(272 + count).padStart(4, '0')}`
  const newPlan: AuditPlan = {
    id: `plan-${Date.now()}`,
    planNumber: plan.planNumber || newNumber,
    clientName: plan.clientName || CLIENTS[3].name,
    clientCode: plan.clientCode || CLIENTS[3].code,
    country: plan.country || 'Saudi Arabia',
    stage: plan.stage || 'Stage 1',
    applicationNumber: plan.applicationNumber || 'APP-0144',
    standardName: plan.standardName || 'Occupational Health and Safety Management System (ISO 45001:2018)',
    reviewedDurationCode: plan.reviewedDurationCode || 'DUR-0144',
    reviewedDurationDays: plan.reviewedDurationDays || 3.0,
    totalEffortHours: plan.totalEffortHours || 8.0,
    siteCode: plan.siteCode || CLIENTS[3].sites[0].id,
    siteName: plan.siteName || CLIENTS[3].sites[0].name,
    siteAddress: plan.siteAddress || CLIENTS[3].sites[0].address,
    primaryContactName: plan.primaryContactName || 'Faisal Al-Otaibi',
    primaryContactEmail: plan.primaryContactEmail || 'faisal.otaibi@buildwell.example',
    primaryContactPhone: plan.primaryContactPhone || '+966 54 330 9911',
    proposedStartDate: plan.proposedStartDate || new Date().toISOString().split('T')[0],
    proposedEndDate: plan.proposedEndDate || new Date().toISOString().split('T')[0],
    durationDays: plan.durationDays || 5,
    timezone: plan.timezone || 'Asia/Riyadh',
    leadAuditor: plan.leadAuditor || 'Omar Hassan',
    auditTeam: plan.auditTeam || ['Omar Hassan'],
    auditObjectives: plan.auditObjectives || '',
    scopeSummary: plan.scopeSummary || '',
    status: plan.status || 'Draft',
    version: 1,
    siteAllocation: plan.siteAllocation || {
      siteCode: `${CLIENTS[3].sites[0].id} - ${CLIENTS[3].city}`,
      siteName: CLIENTS[3].sites[0].name,
      onSitePersonnel: ['Omar Hassan'],
      siteAddress: CLIENTS[3].sites[0].address,
    },
    remoteActivities: plan.remoteActivities || {
      enabled: false,
      activities: [],
      platform: 'Microsoft Teams',
      notes: '',
    },
    travelNotes: plan.travelNotes || { details: '' },
    teamDeclarations: plan.teamDeclarations || {
      availabilityConfirmed: true,
      noConflictsDeclared: true,
    },
    agendaActivities: plan.agendaActivities || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  plans.unshift(newPlan)
  saveStoredPlans(plans)
  return newPlan
}

export type AuditPlanSectionKey = 'site' | 'remote' | 'travel' | 'declarations' | 'agenda'

/** Body of PATCH /cab/audit-plans/:id/sections/:section. */
export interface AuditPlanSectionBodies {
  site: { siteCode?: string; siteName?: string; siteAddress?: string; onSitePersonnel?: string[] }
  remote: { enabled: boolean; activities?: string[]; platform?: string; notes?: string }
  travel: { details: string }
  declarations: { availabilityConfirmed: boolean; noConflictsDeclared: boolean; conflictNotes?: string }
  agenda: { activities: AgendaActivity[] }
}

/** Saves one section (card) of a plan; the rest of the plan is untouched. */
export async function saveAuditPlanSection<K extends AuditPlanSectionKey>(idOrNumber: string, section: K, body: AuditPlanSectionBodies[K]): Promise<AuditPlan> {
  if (!isDemoMode()) {
    return authorizedRequest<AuditPlan>(`${planPath(idOrNumber)}/sections/${section}`, { method: 'PATCH', body: JSON.stringify(body) })
  }
  const current = getStoredPlans().find((p) => p.id === idOrNumber || p.planNumber === idOrNumber)
  if (!current) throw new Error('Audit plan not found')
  const patch: Partial<AuditPlan> & { id: string } = { id: current.id }
  if (section === 'site') {
    const b = body as AuditPlanSectionBodies['site']
    patch.siteAllocation = { ...current.siteAllocation, ...Object.fromEntries(Object.entries(b).filter(([, v]) => v !== undefined)) }
    if (b.siteName !== undefined) patch.siteName = b.siteName
    if (b.siteCode !== undefined) patch.siteCode = b.siteCode
    if (b.siteAddress !== undefined) patch.siteAddress = b.siteAddress
  } else if (section === 'remote') {
    const b = body as AuditPlanSectionBodies['remote']
    patch.remoteActivities = { ...current.remoteActivities, ...Object.fromEntries(Object.entries(b).filter(([, v]) => v !== undefined)) }
  } else if (section === 'travel') {
    patch.travelNotes = { details: (body as AuditPlanSectionBodies['travel']).details }
  } else if (section === 'declarations') {
    patch.teamDeclarations = { ...current.teamDeclarations, ...(body as AuditPlanSectionBodies['declarations']) }
  } else {
    patch.agendaActivities = (body as AuditPlanSectionBodies['agenda']).activities
  }
  return saveAuditPlan(patch)
}

export async function checkAuditPlanReadiness(idOrNumber: string): Promise<EligibilityCheckResult> {
  if (!isDemoMode()) return authorizedRequest<EligibilityCheckResult>(`${planPath(idOrNumber)}/readiness`)
  await new Promise((r) => setTimeout(r, 100))
  const plan = await fetchAuditPlanById(idOrNumber)

  if (!plan) {
    return {
      passed: false,
      competenceAuthorization: {
        status: 'failed',
        details: 'Audit plan not found',
        certifiedStandards: [],
      },
      availability: {
        status: 'failed',
        details: 'Audit plan not found',
        conflictingEvents: [],
      },
      impartiality: {
        status: 'failed',
        details: 'Audit plan not found',
        conflictReasons: ['Plan does not exist'],
        silentOverrideAllowed: false,
      },
    }
  }

  // Check 1: Competence
  const hasLead = Boolean(plan.leadAuditor)
  const competenceStatus: 'passed' | 'warning' | 'failed' = hasLead ? 'passed' : 'failed'

  // Check 2: Availability
  const availabilityStatus: 'passed' | 'warning' | 'failed' = plan.teamDeclarations.availabilityConfirmed
    ? 'passed'
    : 'warning'

  // Check 3: Impartiality / Conflict
  const impartialityStatus: 'passed' | 'warning' | 'failed' = plan.teamDeclarations.noConflictsDeclared
    ? 'passed'
    : 'failed'

  const allPassed = competenceStatus === 'passed' && availabilityStatus === 'passed' && impartialityStatus === 'passed'

  return {
    passed: allPassed,
    competenceAuthorization: {
      status: competenceStatus,
      details: hasLead
        ? `Lead Auditor ${plan.leadAuditor} is certified for ${plan.standardName} within the authorized IAF sector codes.`
        : 'Lead Auditor is not assigned or qualified.',
      certifiedStandards: [plan.standardName.match(/\(([^)]+)\)/)?.[1] ?? plan.standardName],
    },
    availability: {
      status: availabilityStatus,
      details: plan.teamDeclarations.availabilityConfirmed
        ? `All ${plan.auditTeam.length} team members confirmed available for ${plan.proposedStartDate} to ${plan.proposedEndDate}.`
        : 'Team availability is pending confirmation.',
      conflictingEvents: [],
    },
    impartiality: {
      status: impartialityStatus,
      details: plan.teamDeclarations.noConflictsDeclared
        ? 'Impartiality verified: No consultancy or financial ties within the required 3-year restriction window.'
        : 'Conflict of interest check flagged potential consultancy conflict.',
      conflictReasons: plan.teamDeclarations.noConflictsDeclared ? [] : ['Previous consultancy tie within 24 months'],
      silentOverrideAllowed: false,
    },
  }
}

/** Result of sending a plan; `warnings` holds AGREEMENT_REQUIRED when the CAB's agreement gate is set to warn. */
export interface SendAuditPlanResult {
  success: boolean
  message: string
  timestamp: string
  warnings?: Array<{ code: string; message: string; link: string }>
}

export async function sendAuditPlanToClient(
  idOrNumber: string,
  recipientInfo: { email: string; name: string; notes?: string }
): Promise<SendAuditPlanResult> {
  if (!isDemoMode()) {
    return authorizedRequest<SendAuditPlanResult>(`${planPath(idOrNumber)}/send`, {
      method: 'POST',
      body: JSON.stringify({
        email: recipientInfo.email,
        name: recipientInfo.name,
        ...(recipientInfo.notes ? { notes: recipientInfo.notes } : {}),
      }),
    })
  }
  await new Promise((r) => setTimeout(r, 200))
  const plan = await fetchAuditPlanById(idOrNumber)
  // Stage 1 / Stage 2 / recertification need an active certification agreement (409 AGREEMENT_REQUIRED, or a warning).
  const warnings = plan ? enforceAgreementGate(plan.organizationId ?? plan.clientCode, plan.stage) : []
  if (plan) {
    plan.status = 'Planned'
    await saveAuditPlan(plan)
    const c = CLIENTS.find((x) => x.code === plan.clientCode)
    notify('client', 'audit_plan_to_confirm', { ref: plan.planNumber, date: plan.proposedStartDate }, '/portal/audits', c?.id)
  }
  return {
    success: true,
    message: `Audit plan ${idOrNumber} successfully sent to ${recipientInfo.name} (${recipientInfo.email}).`,
    timestamp: new Date().toISOString(),
    ...(warnings.length ? { warnings } : {}),
  }
}

export async function rescheduleAuditPlan(
  idOrNumber: string,
  newDates: { startDate: string; endDate: string; reason: string; rescheduledBy?: string }
): Promise<AuditPlan> {
  if (!isDemoMode()) {
    return authorizedRequest<AuditPlan>(`${planPath(idOrNumber)}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({
        startDate: newDates.startDate,
        endDate: newDates.endDate,
        reason: newDates.reason,
        ...(newDates.rescheduledBy ? { rescheduledBy: newDates.rescheduledBy } : {}),
      }),
    })
  }
  const plan = await fetchAuditPlanById(idOrNumber)
  if (!plan) throw new Error('Audit plan not found')

  const historyEntry = {
    date: new Date().toISOString(),
    previousDates: rangeText(plan.proposedStartDate, plan.proposedEndDate),
    newDates: rangeText(newDates.startDate, newDates.endDate),
    reason: newDates.reason,
    rescheduledBy: newDates.rescheduledBy || 'Lead Auditor',
  }

  const updated: AuditPlan = {
    ...plan,
    proposedStartDate: newDates.startDate,
    proposedEndDate: newDates.endDate,
    version: plan.version + 1,
    status: 'Rescheduled',
    rescheduleHistory: [...(plan.rescheduleHistory || []), historyEntry],
  }

  return saveAuditPlan(updated)
}

/* ───────────── Clients and auditors offered by the planning screens ───────────── */

export interface PlanningClient {
  /** Audit-client organization id (sent as organizationId when creating a plan). */
  id: string
  code: string
  name: string
  country: string
  /** Default site label ('' when the server derives it from the application). */
  site: string
}

export interface PlanningAuditor {
  id: string
  /** Full name — plans reference team members by name. */
  name: string
  role: 'Lead Auditor' | 'Auditor' | 'Other'
  /** May be assigned to an audit team (qualified auditor). */
  qualified: boolean
}

/** Audit clients of the CAB (GET /cab-clients). */
export async function fetchPlanningClients(): Promise<PlanningClient[]> {
  if (!isDemoMode()) {
    const clients = await listAllCabAuditClients()
    return clients.map((c) => ({
      id: c.id,
      code: deriveClientCode(c.id),
      name: c.name || c.tradeName || notSet(),
      country: c.countryCode ?? '',
      site: '',
    }))
  }
  return CLIENTS.map((c) => ({ id: c.id, code: c.code, name: c.name, country: c.country, site: `${c.sites[0].id} - ${c.city}` }))
}

const AUDITOR_ROLE: Record<string, PlanningAuditor['role']> = {
  LEAD_AUDITOR: 'Lead Auditor',
  AUDITOR: 'Auditor',
  FREELANCE_AUDITOR: 'Auditor',
}

/** Active CAB employees that can audit (GET /cab-employees). */
export async function fetchPlanningAuditors(): Promise<PlanningAuditor[]> {
  if (!isDemoMode()) {
    const res = await listCabEmployees({ limit: 100, status: 'ACTIVE' })
    const employees: CabEmployee[] = Array.isArray(res) ? res : res.employees ?? res.items ?? []
    return employees
      .filter((e) => e.user?.fullName)
      .map((e) => {
        const role = AUDITOR_ROLE[e.professionalRole ?? ''] ?? 'Other'
        return { id: e.id, name: e.user.fullName, role, qualified: role !== 'Other' }
      })
  }
  return PEOPLE.map((p) => ({
    id: p.id,
    name: p.name,
    role: p.competenceRole === 'Lead Auditor' || p.competenceRole === 'Auditor' ? p.competenceRole : 'Other',
    qualified: p.standards.length > 0 && p.competenceRole !== 'Decision Maker',
  }))
}

export function exportAuditPlansToFormat(plans: AuditPlan[], format: 'csv' | 'json' | 'excel'): void {
  if (format === 'json') {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(plans, null, 2))
    const dlAnchorElem = document.createElement('a')
    dlAnchorElem.setAttribute('href', dataStr)
    dlAnchorElem.setAttribute('download', `audit_plans_${new Date().toISOString().split('T')[0]}.json`)
    dlAnchorElem.click()
    return
  }

  const headers = [
    'Audit Plan',
    'Client Name',
    'Client Code',
    'Country',
    'Stage',
    'Standard',
    'Sites',
    'Start Date',
    'End Date',
    'Lead Auditor',
    'Status',
  ]
  const rows = plans.map((p) => [
    p.planNumber,
    `"${p.clientName}"`,
    p.clientCode,
    p.country,
    p.stage,
    `"${p.standardName}"`,
    `"${p.siteName}"`,
    p.proposedStartDate,
    p.proposedEndDate,
    `"${p.leadAuditor}"`,
    p.status,
  ])

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `audit_plans_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/* ───────────── Status lifecycle (build page + plan list row menu) ───────────── */

export type AuditPlanTransition = 'start' | 'review' | 'complete'

/** Target status and allowed source statuses of each lifecycle action (as enforced by the API). */
export const AUDIT_PLAN_TRANSITIONS: Record<AuditPlanTransition, { to: AuditPlan['status']; from: ReadonlyArray<AuditPlan['status']> }> = {
  start: { to: 'In progress', from: ['Planned', 'Rescheduled'] },
  review: { to: 'Under review', from: ['In progress'] },
  complete: { to: 'Completed', from: ['In progress', 'Under review'] },
}

/** Why a lifecycle action is not available for the plan (null when it is). */
export type AuditPlanTransitionBlock = 'notSent' | 'alreadyDone' | 'completed' | 'notStarted' | null

export function auditPlanTransitionBlock(plan: Pick<AuditPlan, 'status'>, action: AuditPlanTransition): AuditPlanTransitionBlock {
  const rule = AUDIT_PLAN_TRANSITIONS[action]
  if (rule.from.includes(plan.status)) return null
  if (plan.status === 'Completed') return 'completed'
  if (plan.status === rule.to) return 'alreadyDone'
  if (plan.status === 'Draft') return 'notSent'
  return action === 'start' ? 'alreadyDone' : 'notStarted'
}

/**
 * Moves the plan along its lifecycle. Real API: PATCH /cab/audit-plans/:id { status } — starting
 * opens the audit report (returned as `reportId`), completing records the audit in the team's
 * competence audit log. Preview: updates the shared demo store the same way.
 */
export async function changeAuditPlanStatus(plan: AuditPlan, action: AuditPlanTransition): Promise<AuditPlan> {
  const rule = AUDIT_PLAN_TRANSITIONS[action]
  if (!isDemoMode()) {
    return authorizedRequest<AuditPlan>(planPath(plan.id), { method: 'PATCH', body: JSON.stringify({ status: rule.to }) })
  }
  if (auditPlanTransitionBlock(plan, action)) throw new Error(`Invalid status change: ${plan.status} → ${rule.to}.`)
  const current = (await fetchAuditPlanById(plan.id)) ?? plan
  let reportId = current.reportId ?? null
  if (action === 'start' && !reportId) {
    const reports = await listAuditReports().catch(() => [])
    reportId = reports[0]?.id ?? null
  }
  return saveAuditPlan({ ...current, id: current.id, status: rule.to, reportId, reportStatus: reportId ? current.reportStatus ?? 'Draft' : null })
}

