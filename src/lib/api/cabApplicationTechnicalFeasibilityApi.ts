/**
 * Technical feasibility review of an application.
 *
 *   GET   /cab/certification-applications/:id/technical-feasibility → CabApplicationTechnicalFeasibility
 *   PATCH /cab/certification-applications/:id/technical-feasibility ← TechnicalFeasibilityUpdate
 *   GET   /cab/certification-applications/:id/technical-feasibility/team-candidates → TeamCandidate[]
 *
 * Until the CAB saves it, the server proposes the audit team from the competence register
 * (people authorised for the application's standards and IAF codes) and assesses standards,
 * team and sector expertise from it. A "feasible" decision needs a lead auditor and no area
 * assessed "notFeasible"; the review is editable while the application is SUBMITTED,
 * UNDER_REVIEW or APPROVED. In the preview (demo mode), and when no application is selected
 * (the guided tour), the view is built from the shared demo dataset.
 */

import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode, loadState, saveState } from '@/lib/api/demo/demoStore'
import { APPLICATIONS, PEOPLE, person, standardLabel } from '@/lib/api/demo/dataset'
import { notSet } from '@/lib/emptyValue'

export type WorkflowStepStatus = 'completed' | 'inProgress' | 'pending'
export type AssessmentStatus = 'feasible' | 'partiallyFeasible' | 'notFeasible' | 'notApplicable'

export interface FeasibilityAssessmentRow {
  id: number
  areaKey: string
  assessment: string
  status: AssessmentStatus
  comments: string
}

export interface CabApplicationTechnicalFeasibility {
  applicationId: string
  status: 'inProgress'
  /** Recorded decision (sent by the API); null/absent while undecided. */
  decision?: 'feasible' | 'notFeasible' | null
  /** True once the CAB saved its own team; false while the team is the proposal. */
  teamConfirmed?: boolean
  client: string
  applicationType: string
  certificationBody: string
  primaryStandard: string
  sitesCount: number
  requestedOnDate: string
  requestedOnTime: string
  requestedBy: { name: string; initials: string; role: string }
  documentCount: number
  assessmentDueDate: string
  assessments: FeasibilityAssessmentRow[]
  feasibleCount: number
  totalAssessments: number
  feasibilityPercent: number
  auditTeam: Array<{
    /** CAB employee id (sent by the API) — use it to save the team. */
    employeeId?: string
    name: string
    initials: string
    roleKey: string
    certification: string
    experience: string
    color: string
  }>
  resources: Array<{ key: string; available: boolean }>
  internalComments: Array<{
    author: string
    initials: string
    role: string
    date: string
    time: string
    text: string
    color: string
  }>
  workflowSteps: Array<{ key: string; status: WorkflowStepStatus }>
}

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const feasibilityPath = (applicationId: string) =>
  `/cab/certification-applications/${encodeURIComponent(applicationId)}/technical-feasibility`

/** Role of a feasibility team member (team-selection roles). */
export type FeasibilityTeamRoleKey = 'leadAuditor' | 'auditor' | 'technicalExpert' | 'trainee' | 'observer'

/** Body of the PATCH; send only what changed. */
export interface TechnicalFeasibilityUpdate {
  assessments?: Array<Pick<FeasibilityAssessmentRow, 'areaKey' | 'status'> & Partial<Pick<FeasibilityAssessmentRow, 'assessment' | 'comments'>>>
  /** Exactly one leadAuditor; the team-selection rules apply (competence, IAF codes, critical codes, impartiality). */
  auditTeam?: Array<{ employeeId: string; roleKey: FeasibilityTeamRoleKey }>
  resources?: Array<{ key: string; available: boolean }>
  /** YYYY-MM-DD */
  assessmentDueDate?: string | null
  /** Adds an internal comment */
  comment?: string
  decision?: 'feasible' | 'notFeasible' | null
}

const MOCK: CabApplicationTechnicalFeasibility = {
  applicationId: 'APP-0147',
  status: 'inProgress',
  client: 'TechWave Solutions',
  applicationType: 'Initial Certification',
  certificationBody: 'CASCO',
  primaryStandard: 'ISO/IEC 27001:2022',
  sitesCount: 1,
  requestedOnDate: '16 Oct 2026',
  requestedOnTime: '10:40',
  requestedBy: { name: 'Nour El-Din Mahmoud', initials: 'NM', role: 'Lead Auditor' },
  documentCount: 4,
  assessmentDueDate: '30 Oct 2026',
  assessments: [
    {
      id: 1,
      areaKey: 'scopeComplexity',
      assessment: 'Standard manufacturing scope with moderate complexity',
      status: 'feasible',
      comments: 'Scope is well-defined and within CAB competence',
    },
    {
      id: 2,
      areaKey: 'applicableStandards',
      assessment: 'Requested standard is within the accreditation scope',
      status: 'feasible',
      comments: 'Accreditation scope covers requested standard',
    },
    {
      id: 3,
      areaKey: 'auditTeamAvailability',
      assessment: 'Lead Auditor and Auditor available for proposed dates',
      status: 'feasible',
      comments: 'Team confirmed for the proposed audit window',
    },
    {
      id: 4,
      areaKey: 'technicalExpertise',
      assessment: 'Sector expertise available within the authorized auditor pool',
      status: 'feasible',
      comments: 'Expert assigned for 2 days on-site',
    },
    {
      id: 5,
      areaKey: 'siteAccessibility',
      assessment: 'Both sites accessible; no travel restrictions',
      status: 'feasible',
      comments: 'All sites in scope are reachable within one travel day',
    },
    {
      id: 6,
      areaKey: 'resourceAvailability',
      assessment: 'All required resources available',
      status: 'feasible',
      comments: 'Support staff and equipment confirmed',
    },
    {
      id: 7,
      areaKey: 'timelineScheduling',
      assessment: 'Proposed audit dates feasible',
      status: 'feasible',
      comments: 'Audit duration per IAF MD 5 is sufficient for the scope',
    },
    {
      id: 8,
      areaKey: 'regulatoryRequirements',
      assessment: 'No additional regulatory barriers identified',
      status: 'feasible',
      comments: 'Standard certification requirements apply',
    },
  ],
  feasibleCount: 8,
  totalAssessments: 8,
  feasibilityPercent: 100,
  auditTeam: [
    {
      name: 'Nour El-Din Mahmoud',
      initials: 'NM',
      roleKey: 'leadAuditor',
      certification: 'IRCA ISO/IEC 27001:2022 LA',
      experience: '9+ years',
      color: '#1236a3',
    },
  ],
  resources: [
    { key: 'technicalExpertsOnCall', available: true },
    { key: 'sectorSpecialists', available: true },
    { key: 'documentReviewers', available: true },
    { key: 'supportStaff', available: true },
    { key: 'travelResources', available: true },
  ],
  internalComments: [
    {
      author: 'Nour El-Din Mahmoud',
      initials: 'NM',
      role: 'Lead Auditor',
      date: '16 Oct 2026',
      time: '11:15',
      color: '#3B99CC',
      text: 'All assessment areas reviewed. Application is technically feasible based on scope, team availability, and resource allocation.',
    },
    {
      author: 'Maha Al-Qahtani',
      initials: 'MQ',
      role: 'Technical Manager',
      date: '16 Oct 2026',
      time: '12:05',
      color: '#1236a3',
      text: 'Competence and impartiality confirmed for the proposed team. Recommend proceeding to quotation.',
    },
  ],
  workflowSteps: [
    { key: 'application', status: 'completed' },
    { key: 'applicationReview', status: 'completed' },
    { key: 'informationRequired', status: 'completed' },
    { key: 'technicalFeasibility', status: 'inProgress' },
    { key: 'quotation', status: 'pending' },
    { key: 'quotationApproval', status: 'pending' },
    { key: 'payment', status: 'pending' },
    { key: 'invoicing', status: 'pending' },
    { key: 'contracting', status: 'pending' },
    { key: 'auditPlanning', status: 'pending' },
  ],
}

/** The proposed audit team for this application, from the shared demo dataset. */
function teamFor(orderNumber: string): Partial<CabApplicationTechnicalFeasibility> {
  const app = APPLICATIONS.find((a) => a.orderNumber === orderNumber)
  if (!app) return {}
  const ids = app.teamIds.length ? app.teamIds : PEOPLE.filter((p) => p.standards.includes(app.standard)).slice(0, 2).map((p) => p.id)
  const team = ids.map((id) => person(id))
  const lead = team.find((p) => p.competenceRole === 'Lead Auditor') ?? team[0]
  if (!lead) return {}
  return {
    requestedBy: { name: lead.name, initials: lead.initials, role: 'Lead Auditor' },
    auditTeam: team.map((p) => ({
      name: p.name,
      initials: p.initials,
      roleKey: p.id === lead.id ? 'leadAuditor' : 'auditor',
      certification: `IRCA ${standardLabel(app.standard)} ${p.id === lead.id ? 'LA' : 'Auditor'}`,
      experience: `${p.experienceYears}+ years`,
      color: p.color,
    })),
  }
}

/* Preview: edits (team, comments, due date) are kept per application in the demo store. */
type DemoOverlay = Pick<Partial<CabApplicationTechnicalFeasibility>, 'auditTeam' | 'assessmentDueDate' | 'teamConfirmed' | 'decision' | 'assessments' | 'resources'> & {
  addedComments?: CabApplicationTechnicalFeasibility['internalComments']
}
const DEMO_OVERLAY_KEY = 'technicalFeasibilityEdits'
const demoOverlays = () => loadState<Record<string, DemoOverlay>>(DEMO_OVERLAY_KEY, () => ({}))

function withOverlay(key: string, view: CabApplicationTechnicalFeasibility): CabApplicationTechnicalFeasibility {
  const overlay = demoOverlays()[key]
  if (!overlay) return view
  const { addedComments, ...rest } = overlay
  return { ...view, ...rest, internalComments: [...view.internalComments, ...(addedComments ?? [])] }
}

export interface TeamCandidate {
  employeeId: string
  name: string
  jobTitle: string
  schemes: string[]
  coveredIafCodes: string[]
  /** Authorised for at least one of the application's standards (only these can be saved). */
  eligible: boolean
  leadCapable: boolean
}

/** People who may be put on the audit team ("Edit team"). */
export async function listTeamCandidates(applicationId: string, primaryStandard: string): Promise<TeamCandidate[]> {
  if (!isDemoMode()) return authorizedRequest<TeamCandidate[]>(`${feasibilityPath(applicationId)}/team-candidates`)
  await delay(150)
  const key = primaryStandard.match(/\d{4,5}/)?.[0] ?? primaryStandard
  return PEOPLE.filter((p) => ['Lead Auditor', 'Auditor', 'Technical Expert'].includes(p.competenceRole)).map((p) => {
    const schemes = p.standards.filter((s) => s.includes(key))
    return {
      employeeId: p.id,
      name: p.name,
      jobTitle: p.competenceRole,
      schemes,
      coveredIafCodes: p.iafCodes,
      eligible: schemes.length > 0,
      leadCapable: schemes.length > 0 && p.competenceRole === 'Lead Auditor',
    }
  })
}

export async function getCabApplicationTechnicalFeasibility(
  applicationId?: string,
  clientId?: string,
): Promise<CabApplicationTechnicalFeasibility> {
  if (!isDemoMode() && applicationId) {
    return authorizedRequest<CabApplicationTechnicalFeasibility>(feasibilityPath(applicationId))
  }
  const view = await demoView(applicationId, clientId)
  return applicationId ? withOverlay(applicationId, view) : view
}

async function demoView(applicationId?: string, clientId?: string): Promise<CabApplicationTechnicalFeasibility> {
  const { loadCabApplicationOverlay } = await import(
    '@/lib/api/cabCertificationApplicationApi'
  )
  const overlay = await loadCabApplicationOverlay(applicationId, clientId)
  if (!overlay) {
    await delay()
    return MOCK
  }

  const { application, standards, submittedDate, clientName } = overlay
  return {
    ...MOCK,
    applicationId: application.orderNumber || application.id,
    client: clientName || MOCK.client,
    applicationType: application.legalInfo?.requestType === 'RENEWAL' ? 'Renewal' : 'Initial Certification',
    primaryStandard: standards[0] || MOCK.primaryStandard,
    sitesCount: Math.max(1, application.branches?.length ?? 1),
    requestedOnDate: submittedDate.toLocaleDateString(),
    requestedOnTime: submittedDate.toLocaleTimeString(),
    documentCount: application.documents?.length ?? MOCK.documentCount,
    ...teamFor(application.orderNumber ?? ''),
  }
}

export async function updateCabApplicationTechnicalFeasibility(
  applicationId: string,
  update: TechnicalFeasibilityUpdate,
): Promise<CabApplicationTechnicalFeasibility> {
  if (!isDemoMode()) {
    return authorizedRequest<CabApplicationTechnicalFeasibility>(feasibilityPath(applicationId), {
      method: 'PATCH',
      body: JSON.stringify(update),
    })
  }
  // Preview: apply the change and keep it in the demo store.
  const current = await getCabApplicationTechnicalFeasibility(applicationId)
  const assessments = current.assessments.map((row) => {
    const patch = update.assessments?.find((a) => a.areaKey === row.areaKey)
    return patch ? { ...row, ...patch } : row
  })
  const overlays = demoOverlays()
  const overlay: DemoOverlay = { ...(overlays[applicationId] ?? {}) }
  if (update.assessments) overlay.assessments = assessments
  if (update.resources) overlay.resources = current.resources.map((r) => update.resources?.find((x) => x.key === r.key) ?? r)
  if (update.decision !== undefined) overlay.decision = update.decision
  if (update.assessmentDueDate) {
    overlay.assessmentDueDate = new Date(`${update.assessmentDueDate}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  if (update.auditTeam) {
    overlay.teamConfirmed = true
    overlay.auditTeam = update.auditTeam.map((member) => {
      const p = PEOPLE.find((x) => x.id === member.employeeId)
      return {
        employeeId: member.employeeId,
        name: p?.name ?? member.employeeId,
        initials: p?.initials ?? notSet(),
        roleKey: member.roleKey,
        certification: `${current.primaryStandard} ${member.roleKey === 'leadAuditor' ? 'Lead Auditor' : member.roleKey === 'technicalExpert' ? 'Technical Expert' : 'Auditor'}`,
        experience: p ? `${p.experienceYears}+ years` : notSet(),
        color: p?.color ?? '#1236a3',
      }
    })
  }
  if (update.comment) {
    const now = new Date()
    overlay.addedComments = [
      ...(overlay.addedComments ?? []),
      {
        author: 'CAB Admin',
        initials: 'CA',
        role: 'CAB Admin',
        date: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: now.toTimeString().slice(0, 5),
        text: update.comment,
        color: '#1236a3',
      },
    ]
  }
  overlays[applicationId] = overlay
  saveState(DEMO_OVERLAY_KEY, overlays)
  const next = withOverlay(applicationId, await demoView(applicationId))
  const feasibleCount = next.assessments.filter((a) => a.status === 'feasible').length
  return { ...next, feasibleCount, feasibilityPercent: Math.round((feasibleCount / Math.max(1, next.assessments.length)) * 100) }
}
