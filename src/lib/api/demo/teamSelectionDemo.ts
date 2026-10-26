/**
 * Preview (demo mode) data and behaviour of team selection, availability and the impartiality register.
 *
 * Runs the same rules as the server (lib/teamSelection/rules.ts) on the shared demo dataset:
 * people (dataset PEOPLE), audit plans (records auditPlans), applications and clients.
 * Seeded situations, so every rule can be seen without typing data:
 *   - Khalid Al-Rashid: consultancy for Al Noor Food Industries until Dec 2025 (cooling-off: blocked on Al Noor audits)
 *     and leave 9 to 15 Dec 2026 (blocked on AUD-0267); IAF 28 without the critical-code exam.
 *   - Omar Hassan: assigned to AUD-0245 (Red Sea Logistics, 9 to 10 Dec 2026): double booking on AUD-0267.
 *   - Nour El-Din Mahmoud: declared family relationship with TechWave Solutions (APP-0147), pending review.
 *   - Maha Al-Qahtani: competence approval expired on 16 Sep 2026 (AUD-0270, APP-0146).
 *   - Youssef Kamal: annual declaration expired (blocking on plans, can be accepted through an exception).
 */
import { ApiError } from '@/lib/api/client'
import { loadState, saveState } from '@/lib/api/demo/demoStore'
import { APPLICATIONS, CLIENTS, DEMO_CAB, PEOPLE, STANDARDS, type DemoPerson, type DemoStandardCode } from '@/lib/api/demo/dataset'
import { auditPlans, notify, saveAuditPlans } from '@/lib/api/demo/records'
import type { AuditPlan } from '@/lib/api/cabAuditPlanningApi'
import type {
  AvailabilityCalendar,
  PlanTeam,
  TeamCandidate,
  TeamContext,
  TeamEvent,
  TeamException,
  TeamExceptionStatus,
  TeamMemberInput,
  TeamProfile,
  TeamRecommendations,
  TeamRole,
  TeamScope,
  TeamSettings,
  TeamValidationResult,
  Unavailability,
  UnavailabilityReason,
} from '@/lib/api/teamSelectionApi'
import type {
  DeclarationInput,
  DeclarationStatus,
  ImpartialityDeclaration,
  ImpartialityPerson,
  ImpartialityRegister,
  ImpartialityRelationship,
  RelationshipInput,
  RelationshipType,
  ReviewStatus,
} from '@/lib/api/impartialityApi'
import {
  DEFAULT_SETTINGS,
  EXCEPTION_CODES,
  ISSUES,
  addMonths,
  evaluateTeam,
  isCriticalIafCode,
  languagesForCountry,
  rankCandidates,
  suggestedRole,
  type EngineContext,
  type EngineException,
  type EngineMember,
  type EnginePerson,
} from '@/lib/teamSelection/rules'

const DAY_MS = 86_400_000
const D = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00.000Z`)
const iso = (date: Date) => date.toISOString().slice(0, 10)
const todayUtc = () => D(new Date().toISOString())
const ACTOR = DEMO_CAB.admin.name
const id = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.round(Math.random() * 1e6).toString(36)}`
const wait = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

interface StoredRelationship {
  id: string
  personId: string
  organizationId: string | null
  clientName: string
  type: RelationshipType
  description: string
  startDate: string | null
  endDate: string | null
  source: 'DECLARATION' | 'CAB_RECORD'
  declarationId: string | null
  reviewStatus: ReviewStatus
  reviewNotes: string
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
}

interface StoredDeclaration {
  id: string
  personId: string
  kind: 'ANNUAL' | 'AUDIT'
  auditPlanId: string | null
  planNumber: string | null
  declaredAt: string
  validUntil: string | null
  noConflicts: boolean
  statement: string
  signedName: string
  recordedBy: string
}

interface DemoTeamState {
  settings: TeamSettings
  relationships: StoredRelationship[]
  declarations: StoredDeclaration[]
  unavailability: Unavailability[]
  profiles: Record<string, { languages: string[]; baseCity: string; baseCountry: string }>
  assignments: Record<string, Array<{ personId: string | null; name: string; role: TeamRole }>>
  confirmations: Record<string, { at: string; by: string }>
  exceptions: TeamException[]
  events: TeamEvent[]
  extraBookings: Array<{ personId: string; planNumber: string; start: string; end: string; clientName: string }>
}

const client = (index: number) => CLIENTS[index]

function seed(): DemoTeamState {
  const now = new Date().toISOString()
  const declaration = (p: DemoPerson, declaredAt: string): StoredDeclaration => ({
    id: `decl-${p.id}`,
    personId: p.id,
    kind: 'ANNUAL',
    auditPlanId: null,
    planNumber: null,
    declaredAt: `${declaredAt}T09:00:00.000Z`,
    validUntil: iso(addMonths(D(declaredAt), 12)),
    noConflicts: p.id !== 'emp-0003',
    statement: 'I declare that, apart from the relationships listed, I have no relationship with any client of the certification body that could threaten my impartiality.',
    signedName: p.name,
    recordedBy: ACTOR,
  })
  return {
    settings: { ...DEFAULT_SETTINGS },
    declarations: PEOPLE.filter((p) => p.standards.length).map((p) => declaration(p, p.id === 'emp-0008' ? '2025-08-01' : '2026-01-12')),
    relationships: [
      {
        id: 'rel-0001', personId: 'emp-0003', organizationId: client(0).id, clientName: client(0).name, type: 'CONSULTANCY',
        description: 'Helped Al Noor prepare its HACCP and ISO 9001 documentation as an external consultant.',
        startDate: '2024-03-01', endDate: '2025-12-31', source: 'DECLARATION', declarationId: 'decl-emp-0003', reviewStatus: 'CONFIRMED',
        reviewNotes: 'Consultancy contract seen. Not assigned to Al Noor until the cooling-off period ends.', reviewedBy: ACTOR, reviewedAt: '2026-01-14T10:00:00.000Z', createdAt: '2026-01-12T09:00:00.000Z',
      },
      {
        id: 'rel-0002', personId: 'emp-0004', organizationId: client(6).id, clientName: client(6).name, type: 'FAMILY',
        description: 'Brother-in-law is the IT director of TechWave Solutions.',
        startDate: null, endDate: null, source: 'CAB_RECORD', declarationId: null, reviewStatus: 'PENDING', reviewNotes: '', reviewedBy: null, reviewedAt: null, createdAt: '2026-10-21T08:30:00.000Z',
      },
      {
        id: 'rel-0003', personId: 'emp-0001', organizationId: client(1).id, clientName: client(1).name, type: 'CERTIFICATION_DECISION',
        description: 'Member of the committee that granted the previous ISO 14001 certificate (other certification body).',
        startDate: '2023-04-10', endDate: '2023-04-10', source: 'DECLARATION', declarationId: 'decl-emp-0001', reviewStatus: 'CONFIRMED',
        reviewNotes: 'Low threat: decision taken for another body three years ago.', reviewedBy: ACTOR, reviewedAt: '2026-01-15T09:00:00.000Z', createdAt: '2026-01-12T09:00:00.000Z',
      },
      {
        id: 'rel-0004', personId: 'emp-0002', organizationId: client(5).id, clientName: client(5).name, type: 'FINANCIAL_INTEREST',
        description: 'Declared shares in Gulf Dairy Products; sold in 2024.',
        startDate: '2020-01-01', endDate: '2024-06-30', source: 'DECLARATION', declarationId: 'decl-emp-0002', reviewStatus: 'DISMISSED',
        reviewNotes: 'Shares sold; sale contract on file.', reviewedBy: ACTOR, reviewedAt: '2026-01-15T09:30:00.000Z', createdAt: '2026-01-12T09:00:00.000Z',
      },
    ],
    unavailability: [
      { id: 'una-0001', personId: 'emp-0003', startDate: '2026-12-09', endDate: '2026-12-15', reason: 'LEAVE', notes: 'Annual leave', createdAt: now },
      { id: 'una-0002', personId: 'emp-0002', startDate: '2026-11-02', endDate: '2026-11-05', reason: 'TRAINING', notes: 'FSSC 22000 v6 update course', createdAt: now },
    ],
    profiles: {
      'emp-0001': { languages: ['ar', 'en'], baseCity: 'Jeddah', baseCountry: 'Saudi Arabia' },
      'emp-0002': { languages: ['ar', 'en'], baseCity: 'Riyadh', baseCountry: 'Saudi Arabia' },
      'emp-0003': { languages: ['ar'], baseCity: 'Jeddah', baseCountry: 'Saudi Arabia' },
      'emp-0004': { languages: ['ar', 'en'], baseCity: 'Cairo', baseCountry: 'Egypt' },
      'emp-0008': { languages: ['ar', 'en'], baseCity: 'Alexandria', baseCountry: 'Egypt' },
    },
    assignments: {},
    confirmations: Object.fromEntries(['plan-0266', 'plan-0264', 'plan-0262'].map((planId) => [planId, { at: '2026-10-01T09:00:00.000Z', by: ACTOR }])),
    exceptions: [],
    events: [],
    extraBookings: [{ personId: 'emp-0001', planNumber: 'AUD-0245', start: '2026-12-09', end: '2026-12-10', clientName: client(4).name }],
  }
}

const state = () => loadState<DemoTeamState>('teamSelection', seed)
const save = () => saveState('teamSelection', state())

const addEvent = (event: Omit<TeamEvent, 'id' | 'actor' | 'createdAt'>) => {
  state().events.unshift({ id: id('evt'), actor: ACTOR, createdAt: new Date().toISOString(), ...event })
}

// ── Demo people → engine people ───────────────────────────────────────────────

const standardKeyOf = (text: string) => text.match(/(\d{4,5})/)?.[1] ?? text.trim().toUpperCase()
const personByName = (name: string) => PEOPLE.find((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase())
/** Competence approval in the demo register: start date + 8 years (as competencePeople shows it). */
const expiryOf = (p: DemoPerson) => D(`${Number(p.startDate.slice(0, 4)) + 8}${p.startDate.slice(4)}`)
/** Critical-code exams in the demo: passed for every critical code a person holds, except Khalid's IAF 28. */
const examsOf = (p: DemoPerson) => {
  const set = new Set<string>()
  for (const code of p.iafCodes.filter(isCriticalIafCode)) {
    if (p.id === 'emp-0003' && code === '28') continue
    set.add(`*|${code}`)
    for (const s of p.standards) set.add(`${standardKeyOf(s)}|${code}`)
  }
  return set
}

function planMembers(plan: AuditPlan): Array<{ personId: string | null; name: string; role: TeamRole }> {
  const stored = state().assignments[plan.id]
  if (stored?.length) return stored
  const names = [...new Set([plan.leadAuditor, ...plan.auditTeam].filter(Boolean))]
  return names.map((name) => ({ personId: personByName(name)?.id ?? null, name, role: name === plan.leadAuditor ? 'TEAM_LEADER' : 'AUDITOR' }))
}

function enginePeople(context: EngineContext, ids?: string[]): EnginePerson[] {
  const s = state()
  const today = context.today
  const buffer = context.settings.travelBufferDays
  const workloadFrom = new Date(today.getTime() - context.settings.workloadWindowDays * DAY_MS)
  const plans = auditPlans().filter((p) => p.id !== context.auditPlanId)
  return PEOPLE.filter((p) => (ids ? ids.includes(p.id) : ['Lead Auditor', 'Auditor', 'Technical Expert'].includes(p.competenceRole))).map((p) => {
    const mine = plans.filter((plan) => planMembers(plan).some((m) => m.personId === p.id))
    const bookings = context.startDate && context.endDate
      ? [
          ...mine
            .filter((plan) => plan.status !== 'Completed')
            .map((plan) => ({ planId: plan.id, planNumber: plan.planNumber, start: D(plan.proposedStartDate), end: D(plan.proposedEndDate) })),
          ...s.extraBookings.filter((b) => b.personId === p.id).map((b) => ({ planId: b.planNumber, planNumber: b.planNumber, start: D(b.start), end: D(b.end) })),
        ].filter((b) => b.start <= new Date((context.endDate as Date).getTime() + buffer * DAY_MS) && b.end >= new Date((context.startDate as Date).getTime() - buffer * DAY_MS))
      : []
    const workloadDays = mine
      .filter((plan) => plan.status !== 'Draft')
      .reduce((sum, plan) => {
        const start = Math.max(D(plan.proposedStartDate).getTime(), workloadFrom.getTime())
        const end = Math.min(D(plan.proposedEndDate).getTime(), today.getTime())
        return end < start ? sum : sum + Math.round((end - start) / DAY_MS) + 1
      }, 0)
    const sectorAudits = mine.filter((plan) => {
      if (plan.status !== 'Completed') return false
      const app = APPLICATIONS.find((a) => a.orderNumber === plan.applicationNumber)
      const codes = app ? STANDARDS[app.standard].iafCodes : []
      return codes.some((c) => context.iafCodes.includes(c)) || context.standards.some((st) => plan.standardName.includes(st.key))
    }).length
    const annual = s.declarations.filter((d) => d.personId === p.id && d.kind === 'ANNUAL').sort((a, b) => b.declaredAt.localeCompare(a.declaredAt))[0]
    const profile = s.profiles[p.id]
    const relationships = s.relationships.filter(
      (r) => r.personId === p.id && (r.organizationId === context.organizationId || (!r.organizationId && r.clientName.toLowerCase() === context.clientName.toLowerCase())),
    )
    return {
      id: p.id,
      name: p.name,
      jobTitle: p.jobRole,
      competenceRole: p.competenceRole,
      active: true,
      employmentEndDate: null,
      authorizationExpiry: expiryOf(p),
      registerStatus: expiryOf(p) < today ? 'Expired' : p.standards.length ? 'Authorized' : 'Under review',
      restrictions: [],
      schemes: new Map(p.standards.map((st) => [st, { standardKey: standardKeyOf(st), codes: p.iafCodes }])),
      passedExams: examsOf(p),
      avatarUrl: null,
      country: p.country,
      languages: profile?.languages ?? [],
      baseCity: profile?.baseCity || null,
      baseCountry: profile?.baseCountry || null,
      bookings,
      unavailability: s.unavailability.filter((u) => u.personId === p.id).map((u) => ({ start: D(u.startDate), end: D(u.endDate), reason: u.reason })),
      relationships: relationships.map((r) => ({ id: r.id, type: r.type, startDate: r.startDate ? D(r.startDate) : null, endDate: r.endDate ? D(r.endDate) : null, reviewStatus: r.reviewStatus })),
      annualDeclarationValidUntil: annual?.validUntil ? D(annual.validUntil) : null,
      auditDeclarationSigned: s.declarations.some((d) => d.personId === p.id && d.kind === 'AUDIT' && d.auditPlanId === context.auditPlanId),
      workloadDays,
      sectorAudits,
    }
  })
}

// ── Contexts ──────────────────────────────────────────────────────────────────

const findPlan = (planId: string) => auditPlans().find((p) => p.id === planId || p.planNumber === planId)

const standardsOfText = (text: string) => {
  const found = text.match(/ISO(?:\/IEC)?\s*\d{4,5}/gi) ?? []
  return [...new Map(found.map((label) => [standardKeyOf(label), { key: standardKeyOf(label), label: label.toUpperCase().replace(/\s+/g, ' ') }])).values()]
}
const codesOfStandards = (keys: string[]) =>
  [...new Set((Object.keys(STANDARDS) as DemoStandardCode[]).filter((code) => keys.includes(standardKeyOf(code))).flatMap((code) => STANDARDS[code].iafCodes))].sort()

function planContext(plan: AuditPlan, dates: { startDate?: string; endDate?: string } = {}): EngineContext {
  const c = CLIENTS.find((x) => x.code === plan.clientCode)
  const standards = standardsOfText(plan.standardName)
  const app = APPLICATIONS.find((a) => a.orderNumber === plan.applicationNumber)
  return {
    kind: 'plan',
    auditPlanId: plan.id,
    applicationId: app?.id ?? null,
    reference: plan.planNumber,
    organizationId: c?.id ?? null,
    clientName: c?.name ?? plan.clientName,
    standards,
    iafCodes: app ? [...STANDARDS[app.standard].iafCodes].sort() : codesOfStandards(standards.map((s) => s.key)),
    startDate: D(dates.startDate ?? plan.proposedStartDate),
    endDate: D(dates.endDate ?? plan.proposedEndDate),
    country: c?.country ?? plan.country,
    city: c?.city ?? null,
    languages: languagesForCountry(c?.country ?? plan.country),
    settings: state().settings,
    today: todayUtc(),
  }
}

function applicationContext(applicationId: string, dates: { startDate?: string; endDate?: string } = {}): EngineContext {
  const app = APPLICATIONS.find((a) => a.id === applicationId || a.orderNumber === applicationId) ?? APPLICATIONS.find((a) => a.orderNumber === 'APP-0147')
  if (!app) throw new ApiError('Certification application not found.', 404)
  const c = CLIENTS.find((x) => x.id === app.clientId)
  const dated = Boolean(dates.startDate && dates.endDate)
  return {
    kind: 'application',
    auditPlanId: null,
    applicationId: app.id,
    reference: app.orderNumber,
    organizationId: app.clientId,
    clientName: c?.name ?? '',
    standards: [{ key: standardKeyOf(app.standard), label: `${app.standard}:${STANDARDS[app.standard].edition}` }],
    iafCodes: [...STANDARDS[app.standard].iafCodes].sort(),
    startDate: dated ? D(dates.startDate as string) : null,
    endDate: dated ? D(dates.endDate as string) : null,
    country: c?.country ?? null,
    city: c?.city ?? null,
    languages: languagesForCountry(c?.country ?? null),
    settings: state().settings,
    today: todayUtc(),
  }
}

function contextFor(scope: TeamScope, dates: { startDate?: string; endDate?: string } = {}): EngineContext {
  if (scope.auditPlanId) {
    const plan = findPlan(scope.auditPlanId)
    if (!plan) throw new ApiError('Audit plan not found.', 404)
    return planContext(plan, dates)
  }
  return applicationContext(scope.applicationId as string, dates)
}

const contextDto = (c: EngineContext): TeamContext => ({
  kind: c.kind,
  auditPlanId: c.auditPlanId,
  applicationId: c.applicationId,
  reference: c.reference,
  organizationId: c.organizationId,
  clientName: c.clientName,
  standards: c.standards,
  iafCodes: c.iafCodes.map((code) => ({ code, critical: isCriticalIafCode(code) })),
  startDate: c.startDate ? iso(c.startDate) : null,
  endDate: c.endDate ? iso(c.endDate) : null,
  country: c.country,
  city: c.city,
  languages: c.languages,
  settings: c.settings,
})

const exceptionsFor = (c: EngineContext): TeamException[] =>
  state().exceptions.filter((e) => (c.auditPlanId ? e.auditPlanId === c.auditPlanId : e.applicationId === c.applicationId && !e.auditPlanId))
const engineExceptions = (list: TeamException[]): EngineException[] => list.map((e) => ({ id: e.id, issueCode: e.issueCode, personId: e.personId, status: e.status }))

function membersOf(context: EngineContext, team: TeamMemberInput[]): EngineMember[] {
  const ids = team.map((m) => m.personId).filter((x): x is string => Boolean(x))
  const people = enginePeople(context, ids)
  return team.map((m) => {
    const person = m.personId ? people.find((p) => p.id === m.personId) ?? null : null
    if (m.personId && !person) throw new ApiError('Team member not found.', 404)
    return { personId: m.personId ?? null, name: person?.name ?? m.name ?? '', role: m.role, person }
  })
}

// ── Team selection ────────────────────────────────────────────────────────────

export async function demoRecommendations(scope: TeamScope, role: TeamRole, options: { startDate?: string; endDate?: string; exclude?: string[] }): Promise<TeamRecommendations> {
  await wait()
  const context = contextFor(scope, options)
  const exclude = new Set(options.exclude ?? [])
  const ranked = rankCandidates(enginePeople(context).filter((p) => !exclude.has(p.id)), role, context, engineExceptions(exceptionsFor(context)))
  const candidates: TeamCandidate[] = ranked.map((c, i) => ({
    personId: c.person.id,
    name: c.person.name,
    jobTitle: c.person.jobTitle ?? '',
    competenceRole: c.person.competenceRole,
    avatarUrl: null,
    role,
    suggestedRole: suggestedRole(c.person),
    eligible: c.eligible,
    rank: i + 1,
    score: c.score,
    components: c.components,
    criteria: c.criteria,
    issues: c.issues,
    coveredStandards: c.competence.standardsCovered,
    coveredIafCodes: role === 'TECHNICAL_EXPERT' ? c.competence.anyCodes : c.competence.auditorCodes,
    unexaminedCriticalCodes: c.competence.unexaminedCritical,
    languages: c.person.languages,
    baseCity: c.person.baseCity,
    workloadDays: c.person.workloadDays,
    sectorAudits: c.person.sectorAudits,
  }))
  return { context: contextDto(context), role, candidates }
}

export async function demoValidate(scope: TeamScope, team: TeamMemberInput[], dates: { startDate?: string; endDate?: string }): Promise<TeamValidationResult> {
  await wait(80)
  const context = contextFor(scope, dates)
  const exceptions = exceptionsFor(context)
  const result = evaluateTeam(context, membersOf(context, team), { exceptions: engineExceptions(exceptions), pool: enginePeople(context) })
  return { context: contextDto(context), ...result, exceptions }
}

function planTeamView(plan: AuditPlan): PlanTeam {
  const context = planContext(plan)
  const members = planMembers(plan)
  const exceptions = exceptionsFor(context)
  const validation = evaluateTeam(context, membersOf(context, members), { exceptions: engineExceptions(exceptions), pool: enginePeople(context) })
  const confirmation = state().confirmations[plan.id]
  return {
    auditPlanId: plan.id,
    planNumber: plan.planNumber,
    status: plan.status,
    confirmed: Boolean(confirmation),
    confirmedAt: confirmation?.at ?? null,
    confirmedBy: confirmation?.by ?? null,
    members,
    context: contextDto(context),
    validation,
    exceptions,
    events: state().events.filter((e) => e.auditPlanId === plan.id).slice(0, 50),
  }
}

export async function demoPlanTeam(planId: string): Promise<PlanTeam> {
  await wait()
  const plan = findPlan(planId)
  if (!plan) throw new ApiError('Audit plan not found.', 404)
  return planTeamView(plan)
}

const ROLE_ORDER: TeamRole[] = ['TEAM_LEADER', 'AUDITOR', 'TECHNICAL_EXPERT', 'TRAINEE', 'OBSERVER']

export async function demoConfirm(planId: string, team: TeamMemberInput[], note?: string): Promise<PlanTeam> {
  await wait(250)
  const plan = findPlan(planId)
  if (!plan) throw new ApiError('Audit plan not found.', 404)
  if (plan.status === 'Completed') throw new ApiError('The team of a completed audit cannot be changed.', 409)
  const context = planContext(plan)
  const members = membersOf(context, team)
  const result = evaluateTeam(context, members, { exceptions: engineExceptions(exceptionsFor(context)) })
  const s = state()
  if (!result.canConfirm) {
    addEvent({ action: 'CONFIRM_BLOCKED', auditPlanId: plan.id, applicationId: null, personId: null, details: { issues: [...result.teamIssues, ...result.members.flatMap((m) => m.issues)].filter((i) => i.severity === 'block' && !i.excepted).map((i) => ({ code: i.code, personId: i.personId })) } })
    save()
    throw new ApiError('The team cannot be confirmed: resolve the blocking issues first (mandatory competence, scheduling and impartiality requirements cannot be overridden).', 422, undefined, 'TEAM_BLOCKED', { validation: result })
  }
  const ordered = [...members].sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)).map(({ personId, name, role }) => ({ personId, name, role }))
  const before = planMembers(plan)
  for (const m of ordered) {
    const old = before.find((x) => (x.personId ?? x.name) === (m.personId ?? m.name))
    if (!old) addEvent({ action: 'MEMBER_ADDED', auditPlanId: plan.id, applicationId: null, personId: m.personId, details: { name: m.name, role: m.role } })
    else if (old.role !== m.role) addEvent({ action: 'MEMBER_ROLE_CHANGED', auditPlanId: plan.id, applicationId: null, personId: m.personId, details: { name: m.name, role: m.role, from: old.role } })
  }
  for (const old of before) if (!ordered.some((m) => (m.personId ?? m.name) === (old.personId ?? old.name))) addEvent({ action: 'MEMBER_REMOVED', auditPlanId: plan.id, applicationId: null, personId: old.personId, details: { name: old.name, role: old.role } })
  s.assignments[plan.id] = ordered
  s.confirmations[plan.id] = { at: new Date().toISOString(), by: ACTOR }
  const auditTeam = ordered.filter((m) => m.role !== 'OBSERVER').map((m) => m.name)
  plan.leadAuditor = ordered.find((m) => m.role === 'TEAM_LEADER')?.name ?? plan.leadAuditor
  plan.auditTeam = auditTeam
  plan.updatedAt = new Date().toISOString()
  saveAuditPlans()
  addEvent({ action: 'TEAM_CONFIRMED', auditPlanId: plan.id, applicationId: null, personId: null, details: { team: ordered, warnings: result.warningCount, ...(note ? { note } : {}) } })
  save()
  notify('cab', 'audit_team_assigned', { ref: plan.planNumber, client: context.clientName, team: auditTeam.join(', '), date: plan.proposedStartDate }, `/cab/audit-planning/build/${plan.planNumber}`)
  return planTeamView(plan)
}

// ── Exceptions, events, settings ─────────────────────────────────────────────

export async function demoListExceptions(filters: { status?: TeamExceptionStatus; auditPlanId?: string; applicationId?: string }): Promise<TeamException[]> {
  await wait(80)
  const planId = filters.auditPlanId ? findPlan(filters.auditPlanId)?.id : undefined
  return state().exceptions.filter((e) => (!filters.status || e.status === filters.status) && (!planId || e.auditPlanId === planId) && (!filters.applicationId || e.applicationId === filters.applicationId))
}

export async function demoRequestException(body: { auditPlanId?: string; applicationId?: string; personId?: string | null; issueCode: string; justification: string }): Promise<TeamException> {
  await wait()
  const def = ISSUES[body.issueCode]
  if (!def || def.mandatory || !EXCEPTION_CODES.includes(body.issueCode)) {
    throw new ApiError('EXCEPTION_NOT_ALLOWED: mandatory competence, scheduling and impartiality requirements cannot be overridden.', 400, undefined, 'EXCEPTION_NOT_ALLOWED')
  }
  const plan = body.auditPlanId ? findPlan(body.auditPlanId) : undefined
  const s = state()
  if (s.exceptions.some((e) => e.issueCode === body.issueCode && e.personId === (body.personId ?? null) && e.auditPlanId === (plan?.id ?? null) && e.status !== 'REJECTED')) {
    throw new ApiError('An exception for this issue is already pending or approved.', 409, undefined, 'EXCEPTION_EXISTS')
  }
  const app = body.applicationId ? APPLICATIONS.find((a) => a.id === body.applicationId || a.orderNumber === body.applicationId) : undefined
  const row: TeamException = {
    id: id('tex'),
    auditPlanId: plan?.id ?? null,
    applicationId: app?.id ?? null,
    personId: body.personId ?? null,
    issueCode: body.issueCode,
    issueText: { en: def.en.replace(/\{\{name\}\}/g, 'The person'), ar: def.ar.replace(/\{\{name\}\}/g, 'الشخص') },
    justification: body.justification,
    status: 'PENDING',
    requestedBy: ACTOR,
    requestedAt: new Date().toISOString(),
    decidedBy: null,
    decidedAt: null,
    decisionNotes: null,
  }
  s.exceptions.unshift(row)
  addEvent({ action: 'EXCEPTION_REQUESTED', auditPlanId: row.auditPlanId, applicationId: row.applicationId, personId: row.personId, details: { exceptionId: row.id, issueCode: row.issueCode, justification: row.justification } })
  save()
  notify('cab', 'team_exception_requested', { ref: plan?.planNumber ?? app?.orderNumber ?? '', person: PEOPLE.find((p) => p.id === row.personId)?.name ?? '', issue: row.issueCode }, plan ? `/cab/audit-planning/build/${plan.planNumber}` : '/cab/impartiality')
  return row
}

export async function demoDecideException(exceptionId: string, decision: 'approve' | 'reject', notes?: string): Promise<TeamException> {
  await wait()
  const s = state()
  const row = s.exceptions.find((e) => e.id === exceptionId)
  if (!row) throw new ApiError('Exception not found.', 404)
  if (row.status !== 'PENDING') throw new ApiError(`This exception is already ${row.status.toLowerCase()}.`, 409)
  if (decision === 'reject' && !notes?.trim()) throw new ApiError('A reason is required to reject an exception.', 400)
  row.status = decision === 'approve' ? 'APPROVED' : 'REJECTED'
  row.decidedBy = ACTOR
  row.decidedAt = new Date().toISOString()
  row.decisionNotes = notes?.trim() || null
  addEvent({ action: decision === 'approve' ? 'EXCEPTION_APPROVED' : 'EXCEPTION_REJECTED', auditPlanId: row.auditPlanId, applicationId: row.applicationId, personId: row.personId, details: { exceptionId: row.id, issueCode: row.issueCode } })
  save()
  return row
}

export async function demoListEvents(filters: { auditPlanId?: string; applicationId?: string; personId?: string }): Promise<TeamEvent[]> {
  await wait(80)
  const planId = filters.auditPlanId ? findPlan(filters.auditPlanId)?.id : undefined
  return state().events.filter((e) => (!planId || e.auditPlanId === planId) && (!filters.applicationId || e.applicationId === filters.applicationId) && (!filters.personId || e.personId === filters.personId))
}

export async function demoSettings(): Promise<TeamSettings> {
  await wait(80)
  return { ...state().settings }
}

export async function demoUpdateSettings(patch: Partial<TeamSettings>): Promise<TeamSettings> {
  await wait()
  const s = state()
  const changed = Object.fromEntries(Object.entries(patch).filter(([k, v]) => s.settings[k as keyof TeamSettings] !== v).map(([k, v]) => [k, { from: s.settings[k as keyof TeamSettings], to: v }]))
  s.settings = { ...s.settings, ...patch }
  if (Object.keys(changed).length) addEvent({ action: 'SETTINGS_UPDATED', auditPlanId: null, applicationId: null, personId: null, details: changed })
  save()
  return { ...s.settings }
}

// ── Availability ──────────────────────────────────────────────────────────────

export async function demoAvailability(from: string, to: string): Promise<AvailabilityCalendar> {
  await wait()
  const s = state()
  const start = D(from)
  const end = D(to)
  const overlaps = (a: string, b: string) => D(a) <= end && D(b) >= start
  const persons = PEOPLE.filter((p) => ['Lead Auditor', 'Auditor', 'Technical Expert'].includes(p.competenceRole))
  return {
    from,
    to,
    persons: persons.map((p) => ({ personId: p.id, name: p.name, jobTitle: p.jobRole, competenceRole: p.competenceRole })),
    entries: [
      ...s.unavailability.filter((u) => overlaps(u.startDate, u.endDate)).map((u) => ({ id: u.id, personId: u.personId, kind: 'unavailable' as const, startDate: u.startDate, endDate: u.endDate, reason: u.reason, notes: u.notes })),
      ...auditPlans()
        .filter((plan) => plan.status !== 'Completed' && overlaps(plan.proposedStartDate, plan.proposedEndDate))
        .flatMap((plan) =>
          planMembers(plan)
            .filter((m) => m.personId)
            .map((m) => ({
              id: `${plan.id}:${m.personId}`,
              personId: m.personId as string,
              kind: 'audit' as const,
              startDate: plan.proposedStartDate,
              endDate: plan.proposedEndDate,
              planId: plan.id,
              planNumber: plan.planNumber,
              clientName: plan.clientName,
              role: m.role,
              confirmed: Boolean(s.confirmations[plan.id]),
            })),
        ),
      ...s.extraBookings.filter((b) => overlaps(b.start, b.end)).map((b) => ({ id: `${b.planNumber}:${b.personId}`, personId: b.personId, kind: 'audit' as const, startDate: b.start, endDate: b.end, planNumber: b.planNumber, clientName: b.clientName, role: 'TEAM_LEADER' as TeamRole, confirmed: true })),
    ],
  }
}

export async function demoListUnavailability(personId: string): Promise<Unavailability[]> {
  await wait(80)
  return state().unavailability.filter((u) => u.personId === personId).sort((a, b) => b.startDate.localeCompare(a.startDate))
}

export async function demoAddUnavailability(personId: string, body: { startDate: string; endDate: string; reason: UnavailabilityReason; notes?: string }): Promise<Unavailability> {
  await wait()
  if (body.endDate < body.startDate) throw new ApiError('The end date must be on or after the start date.', 400)
  const s = state()
  const row: Unavailability = { id: id('una'), personId, startDate: body.startDate, endDate: body.endDate, reason: body.reason, notes: body.notes ?? '', createdAt: new Date().toISOString() }
  s.unavailability.unshift(row)
  const affected = auditPlans().filter(
    (plan) => s.confirmations[plan.id] && plan.status !== 'Completed' && plan.proposedStartDate <= body.endDate && plan.proposedEndDate >= body.startDate && planMembers(plan).some((m) => m.personId === personId),
  )
  for (const plan of affected) {
    delete s.confirmations[plan.id]
    addEvent({ action: 'TEAM_CONFIRMATION_CLEARED', auditPlanId: plan.id, applicationId: null, personId, details: { reason: 'UNAVAILABILITY_ADDED' } })
  }
  addEvent({ action: 'UNAVAILABILITY_ADDED', auditPlanId: null, applicationId: null, personId, details: { startDate: body.startDate, endDate: body.endDate, reason: body.reason } })
  save()
  return { ...row, affectedPlans: affected.map((p) => ({ id: p.id, planNumber: p.planNumber })) }
}

export async function demoUpdateUnavailability(personId: string, entryId: string, body: Partial<{ startDate: string; endDate: string; reason: UnavailabilityReason; notes: string }>): Promise<Unavailability> {
  await wait()
  const row = state().unavailability.find((u) => u.id === entryId && u.personId === personId)
  if (!row) throw new ApiError('Unavailability entry not found.', 404)
  Object.assign(row, Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined)))
  if (row.endDate < row.startDate) throw new ApiError('The end date must be on or after the start date.', 400)
  addEvent({ action: 'UNAVAILABILITY_UPDATED', auditPlanId: null, applicationId: null, personId, details: { startDate: row.startDate, endDate: row.endDate } })
  save()
  return row
}

export async function demoDeleteUnavailability(personId: string, entryId: string): Promise<Unavailability[]> {
  const s = state()
  s.unavailability = s.unavailability.filter((u) => !(u.id === entryId && u.personId === personId))
  addEvent({ action: 'UNAVAILABILITY_DELETED', auditPlanId: null, applicationId: null, personId, details: { id: entryId } })
  save()
  return demoListUnavailability(personId)
}

export async function demoTeamProfile(personId: string): Promise<TeamProfile> {
  await wait(80)
  const p = state().profiles[personId]
  return { personId, languages: p?.languages ?? [], baseCity: p?.baseCity ?? '', baseCountry: p?.baseCountry ?? '' }
}

export async function demoSaveTeamProfile(personId: string, body: { languages: string[]; baseCity: string; baseCountry: string }): Promise<TeamProfile> {
  await wait()
  state().profiles[personId] = { languages: [...new Set(body.languages.map((l) => l.toLowerCase()))], baseCity: body.baseCity, baseCountry: body.baseCountry }
  save()
  return demoTeamProfile(personId)
}

// ── Impartiality register ─────────────────────────────────────────────────────

const personName = (personId: string) => PEOPLE.find((p) => p.id === personId)?.name ?? personId

function effectOf(r: StoredRelationship): { effect: ImpartialityRelationship['effect']; blockedUntil: string | null } {
  if (r.reviewStatus === 'DISMISSED') return { effect: 'none', blockedUntil: null }
  const today = todayUtc()
  const ongoing = !r.endDate || D(r.endDate) >= today
  if (['CONSULTANCY', 'INTERNAL_AUDIT', 'EMPLOYMENT', 'FAMILY', 'FINANCIAL_INTEREST'].includes(r.type) && ongoing) return { effect: 'blocks', blockedUntil: null }
  if (['CONSULTANCY', 'INTERNAL_AUDIT', 'EMPLOYMENT'].includes(r.type) && r.endDate) {
    const until = addMonths(D(r.endDate), state().settings.coolingOffMonths)
    return until >= today ? { effect: 'blocks', blockedUntil: iso(until) } : { effect: 'warns', blockedUntil: null }
  }
  return { effect: 'warns', blockedUntil: null }
}

const relationshipDto = (r: StoredRelationship): ImpartialityRelationship => ({ ...r, personName: personName(r.personId), ongoing: !r.endDate, ...effectOf(r) })

const declarationDto = (d: StoredDeclaration): ImpartialityDeclaration => ({
  ...d,
  personName: personName(d.personId),
  recordedBy: d.recordedBy,
  relationshipIds: state().relationships.filter((r) => r.declarationId === d.id).map((r) => r.id),
})

const declarationStatusOf = (validUntil: string | null): DeclarationStatus => {
  if (!validUntil) return 'missing'
  const today = todayUtc()
  if (D(validUntil) < today) return 'expired'
  return D(validUntil).getTime() - today.getTime() <= 30 * DAY_MS ? 'expiring' : 'valid'
}

const latestAnnual = (personId: string) =>
  state().declarations.filter((d) => d.personId === personId && d.kind === 'ANNUAL').sort((a, b) => b.declaredAt.localeCompare(a.declaredAt))[0]

export async function demoRegister(): Promise<ImpartialityRegister> {
  await wait()
  const s = state()
  const people = PEOPLE.map((p) => {
    const own = s.relationships.filter((r) => r.personId === p.id)
    const latest = latestAnnual(p.id)
    return {
      personId: p.id,
      name: p.name,
      jobTitle: p.jobRole,
      active: true,
      lastDeclarationAt: latest?.declaredAt ?? null,
      declarationValidUntil: latest?.validUntil ?? null,
      declarationStatus: declarationStatusOf(latest?.validUntil ?? null),
      relationshipCount: own.length,
      pendingReview: own.filter((r) => r.reviewStatus === 'PENDING').length,
      blockingRelationships: own.filter((r) => effectOf(r).effect === 'blocks').length,
    }
  })
  return {
    settings: { coolingOffMonths: s.settings.coolingOffMonths, declarationValidityMonths: s.settings.declarationValidityMonths, requireAnnualDeclaration: s.settings.requireAnnualDeclaration, requireAuditDeclaration: s.settings.requireAuditDeclaration },
    summary: {
      people: people.length,
      validDeclarations: people.filter((p) => p.declarationStatus === 'valid' || p.declarationStatus === 'expiring').length,
      missingOrExpired: people.filter((p) => p.declarationStatus === 'missing' || p.declarationStatus === 'expired').length,
      pendingReview: people.reduce((n, p) => n + p.pendingReview, 0),
      blockingRelationships: people.reduce((n, p) => n + p.blockingRelationships, 0),
    },
    people,
  }
}

export async function demoImpartialityPerson(personId: string): Promise<ImpartialityPerson> {
  await wait()
  const p = PEOPLE.find((x) => x.id === personId)
  if (!p) throw new ApiError('Personnel record not found.', 404)
  const s = state()
  const latest = latestAnnual(personId)
  return {
    personId,
    name: p.name,
    jobTitle: p.jobRole,
    declarationStatus: declarationStatusOf(latest?.validUntil ?? null),
    declarationValidUntil: latest?.validUntil ?? null,
    coolingOffMonths: s.settings.coolingOffMonths,
    declarations: s.declarations.filter((d) => d.personId === personId).sort((a, b) => b.declaredAt.localeCompare(a.declaredAt)).map(declarationDto),
    relationships: s.relationships.filter((r) => r.personId === personId).map(relationshipDto),
  }
}

export async function demoListRelationships(filters: { personId?: string; organizationId?: string; reviewStatus?: ReviewStatus; type?: RelationshipType }): Promise<ImpartialityRelationship[]> {
  await wait(80)
  return state()
    .relationships.filter((r) => (!filters.personId || r.personId === filters.personId) && (!filters.organizationId || r.organizationId === filters.organizationId) && (!filters.reviewStatus || r.reviewStatus === filters.reviewStatus) && (!filters.type || r.type === filters.type))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(relationshipDto)
}

function relationshipFields(input: Partial<RelationshipInput>): Pick<StoredRelationship, 'organizationId' | 'clientName'> {
  if (input.organizationId) {
    const c = CLIENTS.find((x) => x.id === input.organizationId)
    if (!c) throw new ApiError('Audit client not found.', 404)
    return { organizationId: c.id, clientName: c.name }
  }
  if (!input.clientName?.trim()) throw new ApiError('Choose an audit client or enter the counterparty name.', 400)
  return { organizationId: null, clientName: input.clientName.trim() }
}

export async function demoCreateRelationship(body: RelationshipInput & { personId: string }): Promise<ImpartialityRelationship> {
  await wait()
  if (body.startDate && body.endDate && body.endDate < body.startDate) throw new ApiError('The end date must be on or after the start date.', 400)
  const row: StoredRelationship = {
    id: id('rel'),
    personId: body.personId,
    ...relationshipFields(body),
    type: body.type,
    description: body.description,
    startDate: body.startDate || null,
    endDate: body.endDate || null,
    source: 'CAB_RECORD',
    declarationId: null,
    reviewStatus: 'PENDING',
    reviewNotes: '',
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date().toISOString(),
  }
  state().relationships.unshift(row)
  addEvent({ action: 'RELATIONSHIP_RECORDED', auditPlanId: null, applicationId: null, personId: row.personId, details: { type: row.type, clientName: row.clientName } })
  save()
  return relationshipDto(row)
}

export async function demoUpdateRelationship(relId: string, body: Partial<RelationshipInput>): Promise<ImpartialityRelationship> {
  await wait()
  const row = state().relationships.find((r) => r.id === relId)
  if (!row) throw new ApiError('Relationship not found.', 404)
  if (body.organizationId !== undefined || body.clientName !== undefined) Object.assign(row, relationshipFields({ ...row, ...body }))
  if (body.type) row.type = body.type
  if (body.description) row.description = body.description
  if (body.startDate !== undefined) row.startDate = body.startDate || null
  if (body.endDate !== undefined) row.endDate = body.endDate || null
  Object.assign(row, { reviewStatus: 'PENDING', reviewNotes: '', reviewedBy: null, reviewedAt: null })
  addEvent({ action: 'RELATIONSHIP_UPDATED', auditPlanId: null, applicationId: null, personId: row.personId, details: { type: row.type, clientName: row.clientName } })
  save()
  return relationshipDto(row)
}

export async function demoDeleteRelationship(relId: string): Promise<{ id: string; deleted: boolean }> {
  await wait()
  const s = state()
  const row = s.relationships.find((r) => r.id === relId)
  if (!row) throw new ApiError('Relationship not found.', 404)
  if (row.reviewStatus !== 'PENDING') throw new ApiError('A reviewed relationship is kept as evidence and cannot be deleted. Edit it or dismiss it instead.', 409, undefined, 'RELATIONSHIP_REVIEWED')
  s.relationships = s.relationships.filter((r) => r.id !== relId)
  addEvent({ action: 'RELATIONSHIP_DELETED', auditPlanId: null, applicationId: null, personId: row.personId, details: { type: row.type, clientName: row.clientName } })
  save()
  return { id: relId, deleted: true }
}

export async function demoReviewRelationship(relId: string, outcome: 'CONFIRMED' | 'DISMISSED', notes: string): Promise<ImpartialityRelationship> {
  await wait()
  const row = state().relationships.find((r) => r.id === relId)
  if (!row) throw new ApiError('Relationship not found.', 404)
  if (outcome === 'DISMISSED' && !notes.trim()) throw new ApiError('Explain why the relationship is not a threat to impartiality.', 400)
  Object.assign(row, { reviewStatus: outcome, reviewNotes: notes.trim(), reviewedBy: ACTOR, reviewedAt: new Date().toISOString() })
  addEvent({ action: outcome === 'CONFIRMED' ? 'RELATIONSHIP_CONFIRMED' : 'RELATIONSHIP_DISMISSED', auditPlanId: null, applicationId: null, personId: row.personId, details: { type: row.type, clientName: row.clientName } })
  save()
  return relationshipDto(row)
}

export async function demoListDeclarations(filters: { personId?: string; kind?: 'ANNUAL' | 'AUDIT'; auditPlanId?: string }): Promise<ImpartialityDeclaration[]> {
  await wait(80)
  const planId = filters.auditPlanId ? findPlan(filters.auditPlanId)?.id : undefined
  return state()
    .declarations.filter((d) => (!filters.personId || d.personId === filters.personId) && (!filters.kind || d.kind === filters.kind) && (!planId || d.auditPlanId === planId))
    .sort((a, b) => b.declaredAt.localeCompare(a.declaredAt))
    .map(declarationDto)
}

export async function demoCreateDeclaration(body: DeclarationInput): Promise<ImpartialityDeclaration> {
  await wait()
  const relationships = body.relationships ?? []
  if (body.noConflicts && relationships.length) throw new ApiError('A declaration of no conflicts cannot list relationships.', 400)
  if (!body.noConflicts && !relationships.length) throw new ApiError('List at least one relationship, or declare no conflicts.', 400)
  const plan = body.kind === 'AUDIT' ? findPlan(body.auditPlanId ?? '') : undefined
  if (body.kind === 'AUDIT' && !plan) throw new ApiError('Audit plan not found.', 404)
  const s = state()
  const declaredAt = body.declaredAt ? `${body.declaredAt}T12:00:00.000Z` : new Date().toISOString()
  const row: StoredDeclaration = {
    id: id('decl'),
    personId: body.personId,
    kind: body.kind,
    auditPlanId: plan?.id ?? null,
    planNumber: plan?.planNumber ?? null,
    declaredAt,
    validUntil: body.kind === 'ANNUAL' ? iso(addMonths(D(declaredAt), s.settings.declarationValidityMonths)) : null,
    noConflicts: body.noConflicts,
    statement: body.statement?.trim() || 'I declare that, apart from the relationships listed, I have no relationship with any client of the certification body that could threaten my impartiality.',
    signedName: body.signedName,
    recordedBy: ACTOR,
  }
  s.declarations.unshift(row)
  const planClient = plan ? CLIENTS.find((c) => c.code === plan.clientCode) : undefined
  for (const rel of relationships) {
    s.relationships.unshift({
      id: id('rel'),
      personId: body.personId,
      ...relationshipFields(planClient ? { ...rel, organizationId: planClient.id } : rel),
      type: rel.type,
      description: rel.description,
      startDate: rel.startDate || null,
      endDate: rel.endDate || null,
      source: 'DECLARATION',
      declarationId: row.id,
      reviewStatus: 'PENDING',
      reviewNotes: '',
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date().toISOString(),
    })
  }
  addEvent({ action: 'DECLARATION_RECORDED', auditPlanId: row.auditPlanId, applicationId: null, personId: row.personId, details: { kind: row.kind, noConflicts: row.noConflicts, relationships: relationships.length } })
  save()
  if (relationships.length) notify('cab', 'impartiality_declared', { person: personName(body.personId), count: String(relationships.length), ref: plan?.planNumber ?? '' }, `/cab/impartiality?person=${body.personId}`)
  return declarationDto(row)
}
