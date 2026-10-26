import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode, loadState, saveState } from '@/lib/api/demo/demoStore'
import { findApp, notify as demoNotify } from '@/lib/api/demo/records'
import {
  getCabApplicationReview,
  persistSectionReviewStatus,
  startCabApplicationReview,
  statusesFromReview,
  updateCabApplicationStatus,
  partialRequestsFromReview,
  type ReviewSectionKey,
} from '@/lib/api/cabApplicationReviewApi'
import {
  dedupeInformationRequired,
  dueDateOneWeekFromRequestedOn,
  isReviewSectionKey,
  syncReviewSectionsWithInformationRequired,
  withReviewSectionDueDate,
} from '@/lib/api/irReviewSectionSync'
import { resolveCabCertificationApplication } from '@/lib/api/cabCertificationApplicationApi'
import { ApiError } from '@/lib/api/client'
import type { ApplicationStatus, InformationRequiredItem } from '@/lib/api/certificationApplicationApi'
import { uiLocale } from '@/lib/format/dates'
import { notSet } from '@/lib/emptyValue'

export type WorkflowStepStatus = 'completed' | 'inProgress' | 'pending'
export type RequestPriority = 'high' | 'medium' | 'low'
export type RequestStatus = 'pending' | 'submitted' | 'accepted' | 'rejected'

export interface InformationRequestItem {
  id: string
  description: string
  reference: string
  requestedBy: { name: string; initials: string }
  requestedOnDate: string
  requestedOnTime: string
  dueDate: string
  priority: RequestPriority | null
  status: RequestStatus
}

export interface ClientResponseRow {
  id: string
  item: string
  text: string
  attachments: Array<{ name: string; url: string }>
  submittedOnDate: string
  submittedOnTime: string
  submittedBy: string
  status: RequestStatus
  sectionKey: ReviewSectionKey | null
  approved: boolean | null
}

export interface CabApplicationInformationRequired {
  id: string
  applicationId: string
  applicationStatus: ApplicationStatus
  status: 'inProgress'
  client: string
  applicationType: string
  certificationBody: string
  primaryStandard: string
  requestedOnDate: string
  requestedOnTime: string
  requestedBy: { name: string; initials: string }
  documentCount: number
  earliestDueDate: string | null
  requests: InformationRequestItem[]
  responses: ClientResponseRow[]
  workflowSteps: Array<{ key: string; status: WorkflowStepStatus }>
}

export interface CreateInformationRequiredPayload {
  informationItem: string
  referenceClause?: string
  dueDate?: string
  priority?: string
}

interface CabInformationRequiredList {
  application: {
    id: string
    orderNumber: string | null
    status: ApplicationStatus
    organization?: { id: string; name: string }
  }
  informationRequired: InformationRequiredItem[]
}

const PRIORITIES: Record<string, RequestPriority> = { HIGH: 'high', MEDIUM: 'medium', LOW: 'low' }
const LATER_STAGES = [
  'technicalFeasibility',
  'quotation',
  'quotationApproval',
  'payment',
  'invoicing',
  'contracting',
  'auditPlanning',
]

const cabPath = (applicationId: string) =>
  `/cab/certification-applications/${encodeURIComponent(applicationId)}/information-required`

const formatDate = (iso?: string | null, timeZone?: string) =>
  iso ? new Date(iso).toLocaleDateString(uiLocale(), { timeZone }) : notSet()

const formatTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('') || notSet()

function statusOf(status: string | null | undefined, answered: boolean): RequestStatus {
  const value = (status ?? '').toLowerCase()
  if (value === 'accepted' || value === 'rejected') return value
  return answered || value === 'submitted' ? 'submitted' : 'pending'
}

function itemKey(item: Pick<InformationRequiredItem, 'referenceClause' | 'informationItem'>) {
  return `${item.referenceClause ?? ''}|${item.informationItem.trim().toLowerCase()}`
}

function responseApproval(
  sectionKey: string | null | undefined,
  sectionStatuses: Partial<Record<ReviewSectionKey, string>>,
): boolean | null {
  if (!isReviewSectionKey(sectionKey)) return null
  if (sectionStatuses[sectionKey] === 'complete') return true
  if (sectionStatuses[sectionKey] === 'incomplete') return false
  return null
}

function responseRowStatus(
  item: InformationRequiredItem,
  responseStatus: string | null,
  sectionStatuses: Partial<Record<ReviewSectionKey, string>>,
): RequestStatus {
  const approval = responseApproval(item.referenceClause, sectionStatuses)
  if (approval === true) return 'accepted'
  if (approval === false) return 'rejected'
  return statusOf(responseStatus, true)
}

function toResponseRows(
  items: InformationRequiredItem[],
  sectionStatuses: Partial<Record<ReviewSectionKey, string>>,
): ClientResponseRow[] {
  return items.flatMap((item) =>
    [...item.responses]
      .sort((a, b) => Date.parse(a.submittedOn) - Date.parse(b.submittedOn))
      .map((response) => ({
        id: response.id,
        item: item.informationItem,
        text: response.response ?? '',
        attachments: response.attachments.map((file) => ({
          name: file.originalName || file.fileName || file.fileUrl,
          url: file.fileUrl,
        })),
        submittedOnDate: formatDate(response.submittedOn),
        submittedOnTime: formatTime(response.submittedOn),
        submittedBy: response.submittedBy?.fullName ?? notSet(),
        status: responseRowStatus(item, response.status, sectionStatuses),
        sectionKey: isReviewSectionKey(item.referenceClause) ? item.referenceClause : null,
        approved: responseApproval(item.referenceClause, sectionStatuses),
      })),
  )
}

export async function approveCabClientResponse(
  applicationId: string,
  sectionKey: ReviewSectionKey,
  approved: boolean,
  applicationStatus: ApplicationStatus,
): Promise<void> {
  if (applicationStatus === 'SUBMITTED') {
    await startCabApplicationReview(applicationId)
  } else if (applicationStatus === 'REJECTED' || applicationStatus === 'APPROVED') {
    await updateCabApplicationStatus(
      applicationId,
      'UNDER_REVIEW',
      'Review resumed after client response approval.',
    )
  }
  await persistSectionReviewStatus(applicationId, sectionKey, approved ? 'complete' : 'partiallyComplete')
}

export function createCabInformationRequired(
  applicationId: string,
  payload: CreateInformationRequiredPayload,
): Promise<InformationRequiredItem> {
  return authorizedRequest(cabPath(applicationId), {
    method: 'POST',
    body: JSON.stringify({
      informationItem: payload.informationItem,
      referenceClause: payload.referenceClause || undefined,
      dueDate: payload.dueDate || undefined,
      priority: payload.priority ? payload.priority.toUpperCase() : undefined,
    }),
  })
}

export async function getCabApplicationInformationRequired(
  applicationId: string,
  clientId?: string,
): Promise<CabApplicationInformationRequired> {
  const detail = await resolveCabCertificationApplication(applicationId, clientId)
  if (!detail) throw new ApiError('Application not found.', 404)
  const remote = await authorizedRequest<CabInformationRequiredList | InformationRequiredItem[]>(
    cabPath(applicationId),
  )
  const list: CabInformationRequiredList = Array.isArray(remote)
    ? {
        application: {
          id: detail.id,
          orderNumber: detail.orderNumber ?? null,
          status: detail.status,
          organization: detail.organization,
        },
        informationRequired: remote,
      }
    : {
        application: remote.application ?? {
          id: detail.id,
          orderNumber: detail.orderNumber ?? null,
          status: detail.status,
          organization: detail.organization,
        },
        informationRequired: remote.informationRequired ?? [],
      }
  const { application } = list
  let reviewPartials: InformationRequiredItem[]
  let sectionStatuses: Partial<Record<ReviewSectionKey, string>> = {}
  try {
    const review = await getCabApplicationReview(applicationId)
    sectionStatuses = statusesFromReview(review)
    reviewPartials = partialRequestsFromReview(review).map((item) => ({
      id: item.id,
      applicationId,
      informationItem: item.informationItem,
      referenceClause: item.referenceClause,
      requestedBy: item.requestedBy,
      requestedOn: item.requestedOn,
      dueDate: dueDateOneWeekFromRequestedOn(item.requestedOn),
      priority: 'MEDIUM',
      status: 'PENDING',
      responses: [],
    }))
  } catch {
    reviewPartials = []
  }
  syncReviewSectionsWithInformationRequired(applicationId, sectionStatuses)
  const officialAll = list.informationRequired.map(withReviewSectionDueDate)
  const existingAll = new Set(officialAll.map(itemKey))
  const history = dedupeInformationRequired([
    ...officialAll,
    ...reviewPartials.filter((item) => !existingAll.has(itemKey(item))),
  ]).map(withReviewSectionDueDate)
  const requests = history
  const responses = toResponseRows(
    history.filter((item) => item.responses.length > 0),
    sectionStatuses,
  )
  const first = requests[0] ?? history[0]
  const requesterName = first?.requestedBy?.fullName ?? notSet()
  const standards = (detail?.certificates ?? [])
    .map((certificate) => certificate.certificateName || certificate.certificateCode || '')
    .filter(Boolean)
  const openDueDates = requests
    .filter((request) => {
      const approval = responseApproval(request.referenceClause, sectionStatuses)
      return approval !== true && request.dueDate && request.responses.length === 0
    })
    .map((request) => request.dueDate as string)
    .sort()
  const decided = application.status === 'APPROVED' || application.status === 'REJECTED'
  const approvable = responses.filter((row) => row.sectionKey)
  const allResponsesApproved =
    approvable.length > 0 && approvable.every((row) => row.approved === true)

  return {
    id: application.id,
    applicationId: application.orderNumber || application.id,
    applicationStatus: application.status,
    status: 'inProgress',
    client: application.organization?.name || detail?.legalInfo?.organizationName || notSet(),
    applicationType: detail?.legalInfo?.requestType === 'RENEWAL' ? 'Renewal' : 'Initial Certification',
    certificationBody: 'CASCO',
    primaryStandard: standards[0] || notSet(),
    requestedOnDate: formatDate(first?.requestedOn),
    requestedOnTime: formatTime(first?.requestedOn),
    requestedBy: { name: requesterName, initials: initialsOf(requesterName) },
    documentCount: detail?.documents?.length ?? 0,
    earliestDueDate: openDueDates[0] ? formatDate(openDueDates[0], 'UTC') : null,
    requests: requests.map((item) => {
      const name = item.requestedBy?.fullName ?? notSet()
      const approval = responseApproval(item.referenceClause, sectionStatuses)
      return {
        id: item.id,
        description: item.informationItem,
        reference: item.referenceClause ?? '',
        requestedBy: { name, initials: initialsOf(name) },
        requestedOnDate: formatDate(item.requestedOn),
        requestedOnTime: formatTime(item.requestedOn),
        dueDate: formatDate(item.dueDate, 'UTC'),
        priority: PRIORITIES[(item.priority ?? '').toUpperCase()] ?? null,
        status:
          approval === true
            ? 'accepted'
            : approval === false
              ? 'rejected'
              : statusOf(item.status, item.responses.length > 0),
      }
    }),
    responses,
    workflowSteps: [
      { key: 'application', status: 'completed' },
      { key: 'applicationReview', status: decided || allResponsesApproved ? 'completed' : 'inProgress' },
      {
        key: 'informationRequired',
        status:
          requests.length === 0 && responses.length === 0
            ? 'pending'
            : allResponsesApproved
              ? 'completed'
              : 'inProgress',
      },
      ...LATER_STAGES.map((key) => ({ key, status: 'pending' as const })),
    ],
  }
}

/* ───────────── Reminders to the client ─────────────
 *   GET  /cab/certification-applications/:id/information-required/reminders        → InformationReminderSummary[]
 *   POST /cab/certification-applications/:id/information-required/:irId/reminders  → InformationReminderSummary
 * The server re-notifies the client (`information_reminder`), logs the reminder and allows one
 * reminder per request per 24 hours (429 REMINDER_RATE_LIMIT). The preview keeps the log in
 * the demo store.
 */

export interface InformationReminderSummary {
  informationRequiredId: string
  count: number
  lastSentAt: string | null
  lastSentBy: string | null
  nextAllowedAt: string | null
}

const REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000
const DEMO_REMINDERS_KEY = 'informationReminders'
const demoReminders = () => loadState<Record<string, string[]>>(DEMO_REMINDERS_KEY, () => ({}))
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function demoSummary(irId: string): InformationReminderSummary {
  const sent = demoReminders()[irId] ?? []
  const last = sent[0] ?? null
  return {
    informationRequiredId: irId,
    count: sent.length,
    lastSentAt: last,
    lastSentBy: last ? 'CAB Admin' : null,
    nextAllowedAt: last ? new Date(new Date(last).getTime() + REMINDER_INTERVAL_MS).toISOString() : null,
  }
}

/** Requests the client still has to answer (and that the server knows by id). */
export function remindableRequests(requests: InformationRequestItem[]): InformationRequestItem[] {
  return requests.filter((r) => (r.status === 'pending' || r.status === 'rejected') && (isDemoMode() || UUID.test(r.id)))
}

export async function listInformationReminders(applicationId: string, requestIds: string[]): Promise<InformationReminderSummary[]> {
  if (!isDemoMode()) return authorizedRequest<InformationReminderSummary[]>(`${cabPath(applicationId)}/reminders`)
  return requestIds.map(demoSummary)
}

export async function sendInformationReminder(
  applicationId: string,
  request: Pick<InformationRequestItem, 'id' | 'description' | 'dueDate'>,
  applicationNumber: string,
): Promise<InformationReminderSummary> {
  if (!isDemoMode()) {
    return authorizedRequest<InformationReminderSummary>(`${cabPath(applicationId)}/${encodeURIComponent(request.id)}/reminders`, { method: 'POST' })
  }
  const current = demoSummary(request.id)
  if (current.nextAllowedAt && new Date(current.nextAllowedAt).getTime() > Date.now()) {
    throw new Error(`REMINDER_RATE_LIMIT: next reminder after ${current.nextAllowedAt}`)
  }
  const state = demoReminders()
  state[request.id] = [new Date().toISOString(), ...(state[request.id] ?? [])]
  saveState(DEMO_REMINDERS_KEY, state)
  const app = findApp(applicationId)
  demoNotify('client', 'information_reminder', { ref: applicationNumber, item: request.description, due: request.dueDate }, '/portal/applications', app?.organizationId)
  return demoSummary(request.id)
}
