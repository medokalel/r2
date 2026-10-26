/**
 * Audit team selection & competence validation API.
 *
 *   GET  /cab/team-selection/recommendations?auditPlanId|applicationId&role&startDate&endDate → TeamRecommendations
 *   POST /cab/team-selection/validate        { auditPlanId|applicationId, team }               → TeamValidationResult
 *   GET  /cab/audit-plans/:id/team                                                              → PlanTeam
 *   POST /cab/audit-plans/:id/team/confirm   { team, note }  (422 TEAM_BLOCKED + validation)    → PlanTeam
 *   GET|POST /cab/team-selection/exceptions, POST /cab/team-selection/exceptions/:id/approve|reject
 *   GET  /cab/team-selection/events?auditPlanId|applicationId|personId                         → TeamEvent[]
 *   GET|PUT /cab/team-selection/settings                                                        → TeamSettings
 *   GET  /cab/team-selection/availability?from&to                                               → AvailabilityCalendar
 *   GET|POST|PATCH|DELETE /cab/competence/persons/:id/unavailability[/:entryId]
 *   GET|PUT /cab/competence/persons/:id/team-profile                                            → TeamProfile
 *
 * The server enforces the rules (docs/TEAM_SELECTION.md in the backend): plans are sent or started
 * only with a confirmed team that still passes the checks. In the preview (demo mode) the same rules
 * run in the browser (lib/teamSelection/rules.ts) on the shared demo dataset (lib/api/demo/teamSelectionDemo.ts).
 */

import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode } from '@/lib/api/demo/demoStore'

export type TeamRole = 'TEAM_LEADER' | 'AUDITOR' | 'TECHNICAL_EXPERT' | 'TRAINEE' | 'OBSERVER'
export const TEAM_ROLES: TeamRole[] = ['TEAM_LEADER', 'AUDITOR', 'TECHNICAL_EXPERT', 'TRAINEE', 'OBSERVER']

export interface Localized {
  en: string
  ar: string
}

export interface TeamAlternative {
  personId: string
  name: string
  score: number
  role: TeamRole
}

export type IssueSeverity = 'block' | 'warn' | 'info'

export interface TeamIssue {
  code: string
  severity: IssueSeverity
  /** Mandatory issues can never be overridden. */
  mandatory: boolean
  /** Blocking, but an approved exception accepts it. */
  overridable: boolean
  criterion: string
  personId: string | null
  params: Record<string, string>
  message: Localized
  alternatives: TeamAlternative[]
  excepted: boolean
  exceptionId: string | null
}

export type CriterionStatus = 'pass' | 'partial' | 'warn' | 'fail' | 'na'

export interface TeamCriterion {
  key: string
  label: Localized
  status: CriterionStatus
  message: Localized
}

export interface ScoreComponent {
  key: 'competence' | 'availability' | 'workload' | 'experience' | 'location' | 'language'
  score: number
  max: number
  explanation: Localized
}

export interface TeamCandidate {
  personId: string
  name: string
  jobTitle: string
  competenceRole: string
  avatarUrl: string | null
  role: TeamRole
  suggestedRole: TeamRole
  eligible: boolean
  rank: number
  score: number
  components: ScoreComponent[]
  criteria: TeamCriterion[]
  issues: TeamIssue[]
  coveredStandards: string[]
  coveredIafCodes: string[]
  unexaminedCriticalCodes: string[]
  languages: string[]
  baseCity: string | null
  workloadDays: number
  sectorAudits: number
}

export interface TeamSettings {
  coolingOffMonths: number
  travelBufferDays: number
  workloadWindowDays: number
  maxAuditDaysInWindow: number
  declarationValidityMonths: number
  requireAnnualDeclaration: boolean
  requireAuditDeclaration: boolean
  exceptionSecondApprover: boolean
  expiryWarningDays: number
}

export interface TeamContext {
  kind: 'plan' | 'application'
  auditPlanId: string | null
  applicationId: string | null
  reference: string
  organizationId: string | null
  clientName: string
  standards: Array<{ key: string; label: string }>
  iafCodes: Array<{ code: string; critical: boolean }>
  startDate: string | null
  endDate: string | null
  country: string | null
  city: string | null
  languages: string[]
  settings: TeamSettings
}

export interface TeamRecommendations {
  context: TeamContext
  role: TeamRole
  candidates: TeamCandidate[]
}

export interface TeamMemberInput {
  personId?: string | null
  /** External observer / witness only. */
  name?: string
  role: TeamRole
}

export interface TeamMemberResult {
  personId: string | null
  name: string
  role: TeamRole
  registered: boolean
  status: 'ok' | 'warn' | 'block'
  issues: TeamIssue[]
  criteria: TeamCriterion[]
}

export interface TeamCoverage {
  standards: Array<{ key: string; label: string; coveredBy: string[] }>
  iafCodes: Array<{ code: string; critical: boolean; coveredBy: Array<{ personId: string; via: 'auditor' | 'technicalExpert' }> }>
  members: Array<{ personId: string | null; name: string; role: TeamRole; standards: string[]; iafCodes: string[] }>
}

export interface TeamValidation {
  valid: boolean
  canConfirm: boolean
  blockingCount: number
  mandatoryBlockingCount: number
  overridableBlockingCount: number
  warningCount: number
  members: TeamMemberResult[]
  teamIssues: TeamIssue[]
  coverage: TeamCoverage
}

export type TeamExceptionStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface TeamException {
  id: string
  auditPlanId: string | null
  applicationId: string | null
  personId: string | null
  issueCode: string
  issueText: Localized
  justification: string
  status: TeamExceptionStatus
  requestedBy: string
  requestedAt: string
  decidedBy: string | null
  decidedAt: string | null
  decisionNotes: string | null
}

export interface TeamValidationResult extends TeamValidation {
  context: TeamContext
  exceptions: TeamException[]
}

export interface TeamEvent {
  id: string
  action: string
  auditPlanId: string | null
  applicationId: string | null
  personId: string | null
  actor: string
  details: Record<string, unknown>
  createdAt: string
}

export interface PlanTeam {
  auditPlanId: string
  planNumber: string
  status: string
  confirmed: boolean
  confirmedAt: string | null
  confirmedBy: string | null
  members: Array<{ personId: string | null; name: string; role: TeamRole }>
  context: TeamContext
  validation: TeamValidation
  exceptions: TeamException[]
  events: TeamEvent[]
}

export type UnavailabilityReason = 'LEAVE' | 'TRAINING' | 'SICK' | 'OTHER_ASSIGNMENT' | 'OTHER'
export const UNAVAILABILITY_REASONS: UnavailabilityReason[] = ['LEAVE', 'TRAINING', 'SICK', 'OTHER_ASSIGNMENT', 'OTHER']

export interface Unavailability {
  id: string
  personId: string
  startDate: string
  endDate: string
  reason: UnavailabilityReason
  notes: string
  createdAt: string
  /** Returned when recording: confirmed audit plans that overlap (their team is re-checked). */
  affectedPlans?: Array<{ id: string; planNumber: string }>
}

export interface AvailabilityEntry {
  id: string
  personId: string
  kind: 'unavailable' | 'audit'
  startDate: string
  endDate: string
  reason?: UnavailabilityReason
  notes?: string
  planId?: string
  planNumber?: string
  clientName?: string
  role?: TeamRole
  confirmed?: boolean
}

export interface AvailabilityCalendar {
  from: string
  to: string
  persons: Array<{ personId: string; name: string; jobTitle: string; competenceRole: string | null }>
  entries: AvailabilityEntry[]
}

export interface TeamProfile {
  personId: string
  languages: string[]
  baseCity: string
  baseCountry: string
}

/** Which audit plan or application the team is for (plan id or number; application id or order number). */
export type TeamScope = { auditPlanId: string; applicationId?: undefined } | { applicationId: string; auditPlanId?: undefined }

const demo = () => import('@/lib/api/demo/teamSelectionDemo')

const qs = (params: Record<string, string | number | undefined | null | string[]>) => {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) value.forEach((v) => search.append(key, v))
    else if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

const json = (method: string, body?: unknown): RequestInit => ({ method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })

// ── Recommendations & validation ──────────────────────────────────────────────

export async function getTeamRecommendations(
  scope: TeamScope,
  role: TeamRole,
  options: { startDate?: string; endDate?: string; exclude?: string[] } = {},
): Promise<TeamRecommendations> {
  if (!isDemoMode()) {
    return authorizedRequest<TeamRecommendations>(`/cab/team-selection/recommendations${qs({ ...scope, role, ...options })}`)
  }
  return (await demo()).demoRecommendations(scope, role, options)
}

export async function validateTeam(scope: TeamScope, team: TeamMemberInput[], dates: { startDate?: string; endDate?: string } = {}): Promise<TeamValidationResult> {
  if (!isDemoMode()) return authorizedRequest<TeamValidationResult>('/cab/team-selection/validate', json('POST', { ...scope, ...dates, team }))
  return (await demo()).demoValidate(scope, team, dates)
}

// ── Audit plan team ───────────────────────────────────────────────────────────

const planTeamPath = (planId: string) => `/cab/audit-plans/${encodeURIComponent(planId)}/team`

export async function getPlanTeam(planId: string): Promise<PlanTeam> {
  if (!isDemoMode()) return authorizedRequest<PlanTeam>(planTeamPath(planId))
  return (await demo()).demoPlanTeam(planId)
}

/** Confirms the team; a blocked team rejects with ApiError 422 TEAM_BLOCKED (details.validation). */
export async function confirmPlanTeam(planId: string, team: TeamMemberInput[], note?: string): Promise<PlanTeam> {
  if (!isDemoMode()) return authorizedRequest<PlanTeam>(`${planTeamPath(planId)}/confirm`, json('POST', { team, ...(note ? { note } : {}) }))
  return (await demo()).demoConfirm(planId, team, note)
}

// ── Exceptions & audit trail ──────────────────────────────────────────────────

export async function listTeamExceptions(filters: { status?: TeamExceptionStatus; auditPlanId?: string; applicationId?: string } = {}): Promise<TeamException[]> {
  if (!isDemoMode()) return authorizedRequest<TeamException[]>(`/cab/team-selection/exceptions${qs(filters)}`)
  return (await demo()).demoListExceptions(filters)
}

export async function requestTeamException(body: { auditPlanId?: string; applicationId?: string; personId?: string | null; issueCode: string; justification: string }): Promise<TeamException> {
  if (!isDemoMode()) return authorizedRequest<TeamException>('/cab/team-selection/exceptions', json('POST', body))
  return (await demo()).demoRequestException(body)
}

export async function decideTeamException(id: string, decision: 'approve' | 'reject', notes?: string): Promise<TeamException> {
  if (!isDemoMode()) return authorizedRequest<TeamException>(`/cab/team-selection/exceptions/${encodeURIComponent(id)}/${decision}`, json('POST', { notes: notes ?? '' }))
  return (await demo()).demoDecideException(id, decision, notes)
}

export async function listTeamEvents(filters: { auditPlanId?: string; applicationId?: string; personId?: string } = {}): Promise<TeamEvent[]> {
  if (!isDemoMode()) return authorizedRequest<TeamEvent[]>(`/cab/team-selection/events${qs(filters)}`)
  return (await demo()).demoListEvents(filters)
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function getTeamSettings(): Promise<TeamSettings> {
  if (!isDemoMode()) return authorizedRequest<TeamSettings>('/cab/team-selection/settings')
  return (await demo()).demoSettings()
}

export async function updateTeamSettings(patch: Partial<TeamSettings>): Promise<TeamSettings> {
  if (!isDemoMode()) return authorizedRequest<TeamSettings>('/cab/team-selection/settings', json('PUT', patch))
  return (await demo()).demoUpdateSettings(patch)
}

// ── Availability ──────────────────────────────────────────────────────────────

export async function getAvailabilityCalendar(from: string, to: string): Promise<AvailabilityCalendar> {
  if (!isDemoMode()) return authorizedRequest<AvailabilityCalendar>(`/cab/team-selection/availability${qs({ from, to })}`)
  return (await demo()).demoAvailability(from, to)
}

const personPath = (personId: string) => `/cab/competence/persons/${encodeURIComponent(personId)}`

export async function listUnavailability(personId: string): Promise<Unavailability[]> {
  if (!isDemoMode()) return authorizedRequest<Unavailability[]>(`${personPath(personId)}/unavailability`)
  return (await demo()).demoListUnavailability(personId)
}

export async function addUnavailability(personId: string, body: { startDate: string; endDate: string; reason: UnavailabilityReason; notes?: string }): Promise<Unavailability> {
  if (!isDemoMode()) return authorizedRequest<Unavailability>(`${personPath(personId)}/unavailability`, json('POST', body))
  return (await demo()).demoAddUnavailability(personId, body)
}

export async function updateUnavailability(personId: string, entryId: string, body: Partial<{ startDate: string; endDate: string; reason: UnavailabilityReason; notes: string }>): Promise<Unavailability> {
  if (!isDemoMode()) return authorizedRequest<Unavailability>(`${personPath(personId)}/unavailability/${encodeURIComponent(entryId)}`, json('PATCH', body))
  return (await demo()).demoUpdateUnavailability(personId, entryId, body)
}

export async function deleteUnavailability(personId: string, entryId: string): Promise<Unavailability[]> {
  if (!isDemoMode()) return authorizedRequest<Unavailability[]>(`${personPath(personId)}/unavailability/${encodeURIComponent(entryId)}`, json('DELETE'))
  return (await demo()).demoDeleteUnavailability(personId, entryId)
}

export async function getTeamProfile(personId: string): Promise<TeamProfile> {
  if (!isDemoMode()) return authorizedRequest<TeamProfile>(`${personPath(personId)}/team-profile`)
  return (await demo()).demoTeamProfile(personId)
}

export async function saveTeamProfile(personId: string, body: { languages: string[]; baseCity: string; baseCountry: string }): Promise<TeamProfile> {
  if (!isDemoMode()) return authorizedRequest<TeamProfile>(`${personPath(personId)}/team-profile`, json('PUT', body))
  return (await demo()).demoSaveTeamProfile(personId, body)
}
