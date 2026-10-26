import { authorizedRequest } from '@/lib/api/authorizedClient'
import { resolveCabCertificationApplication } from '@/lib/api/cabCertificationApplicationApi'
import { ApiError } from '@/lib/api/client'
import type { ApplicationResponse, ApplicationStatus } from '@/lib/api/certificationApplicationApi'

export const REVIEW_SECTIONS = [
  'legalInfo',
  'operationalInfo',
  'consultantInfo',
  'declarationInfo',
  'branches',
  'certificates',
  'documents',
] as const
export type ReviewSectionKey = (typeof REVIEW_SECTIONS)[number]

export const SECTION_STATUSES = ['complete', 'partiallyComplete', 'incomplete', 'notApplicable'] as const
export type SectionStatus = (typeof SECTION_STATUSES)[number]

export type ApiSectionReviewStatus =
  | 'UNDER_REVIEW'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'NOT_APPLICABLE'

export interface ApplicationComment {
  id: string
  sectionKey: ReviewSectionKey | null
  content: string
  isInternal: boolean
  createdBy: { id: string; fullName: string }
  createdAt: string
  updatedAt: string
}

export interface StartReviewResult {
  id: string
  orderNumber?: string | null
  status: ApplicationStatus
}

export interface SectionReview {
  id?: string
  applicationId?: string
  sectionKey: ReviewSectionKey
  status: ApiSectionReviewStatus | string
  reviewStatus?: ApiSectionReviewStatus | string
  reviewedBy?: string | null
  reviewedAt?: string | null
}

export interface ApplicationReviewMetadata {
  applicationId?: string
  status?: ApplicationStatus
  sectionReviewsByKey?: Partial<Record<ReviewSectionKey, SectionReview | null>>
  commentsBySection?: Partial<Record<ReviewSectionKey | 'general', unknown[]>>
  comments?: unknown[]
}

const STATUS_PREFIX = /^\[status:(\w+)\]\s*/

const TO_API: Record<SectionStatus, ApiSectionReviewStatus> = {
  complete: 'COMPLETED',
  partiallyComplete: 'PARTIALLY_COMPLETED',
  incomplete: 'UNDER_REVIEW',
  notApplicable: 'NOT_APPLICABLE',
}

const FROM_API: Record<string, SectionStatus> = {
  COMPLETED: 'complete',
  PARTIALLY_COMPLETED: 'partiallyComplete',
  UNDER_REVIEW: 'incomplete',
  NOT_APPLICABLE: 'notApplicable',
  complete: 'complete',
  partiallyComplete: 'partiallyComplete',
  incomplete: 'incomplete',
  notApplicable: 'notApplicable',
}

export function toApiSectionStatus(status: SectionStatus): ApiSectionReviewStatus {
  return TO_API[status]
}

export function fromApiSectionStatus(status: string | null | undefined): SectionStatus | null {
  if (!status) return null
  return FROM_API[status] ?? FROM_API[status.toUpperCase()] ?? null
}

export function decodeSectionComment(content: string): { status: SectionStatus | null; text: string } {
  const match = STATUS_PREFIX.exec(content)
  const status = match?.[1] as SectionStatus | undefined
  if (!match || !status || !SECTION_STATUSES.includes(status)) return { status: null, text: content }
  return { status, text: content.slice(match[0].length) }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeComment(raw: unknown): ApplicationComment | null {
  if (!isRecord(raw) || typeof raw.id !== 'string') return null
  const createdByRaw = raw.createdBy
  const createdBy =
    typeof createdByRaw === 'string'
      ? { id: createdByRaw, fullName: createdByRaw }
      : isRecord(createdByRaw)
        ? {
            id: String(createdByRaw.id ?? ''),
            fullName: String(createdByRaw.fullName ?? createdByRaw.id ?? ''),
          }
        : { id: '', fullName: '' }
  const sectionKey = raw.sectionKey
  return {
    id: raw.id,
    sectionKey:
      typeof sectionKey === 'string' && REVIEW_SECTIONS.includes(sectionKey as ReviewSectionKey)
        ? (sectionKey as ReviewSectionKey)
        : null,
    content: String(raw.content ?? ''),
    isInternal: Boolean(raw.isInternal),
    createdBy,
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? raw.createdAt ?? ''),
  }
}

function commentsFromUnknown(data: unknown): ApplicationComment[] {
  if (Array.isArray(data)) {
    return data.map(normalizeComment).filter((item): item is ApplicationComment => Boolean(item))
  }
  if (!isRecord(data)) return []
  if (Array.isArray(data.comments)) return commentsFromUnknown(data.comments)
  if (isRecord(data.commentsBySection)) {
    return Object.values(data.commentsBySection).flatMap((group) => commentsFromUnknown(group))
  }
  return []
}

export function statusesFromReview(review: ApplicationReviewMetadata): Partial<Record<ReviewSectionKey, SectionStatus>> {
  const map: Partial<Record<ReviewSectionKey, SectionStatus>> = {}
  for (const key of REVIEW_SECTIONS) {
    const entry = review.sectionReviewsByKey?.[key]
    const status = fromApiSectionStatus(entry?.status ?? entry?.reviewStatus)
    if (status) map[key] = status
  }
  return map
}

export async function getCabApplication(id: string): Promise<ApplicationResponse> {
  const application = await resolveCabCertificationApplication(id)
  if (!application) throw new ApiError('Application not found.', 404)
  return application
}

export function startCabApplicationReview(id: string): Promise<StartReviewResult> {
  return authorizedRequest(`/cab/certification-applications/${encodeURIComponent(id)}/start-review`, {
    method: 'POST',
  })
}

export function updateCabApplicationStatus(
  id: string,
  status: Extract<ApplicationStatus, 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW'>,
  note?: string,
): Promise<StartReviewResult> {
  return authorizedRequest(`/cab/certification-applications/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(note ? { status, note } : { status }),
  })
}

export async function applyAllSectionReviews(
  id: string,
  status: SectionStatus,
  comment: string,
): Promise<void> {
  for (const sectionKey of REVIEW_SECTIONS) {
    await persistSectionReviewStatus(id, sectionKey, status)
    await createSectionComment(id, sectionKey, comment)
  }
}

export function getCabApplicationReview(id: string): Promise<ApplicationReviewMetadata> {
  return authorizedRequest(`/cab/certification-applications/${encodeURIComponent(id)}/review`)
}

export function updateSectionReviewStatus(
  id: string,
  sectionKey: ReviewSectionKey,
  status: SectionStatus,
): Promise<SectionReview> {
  return authorizedRequest(
    `/certification-applications/${encodeURIComponent(id)}/sections/${encodeURIComponent(sectionKey)}/review-status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ reviewStatus: toApiSectionStatus(status) }),
    },
  )
}

export function persistSectionReviewStatus(
  id: string,
  sectionKey: ReviewSectionKey,
  status: SectionStatus,
): Promise<SectionReview> {
  return updateSectionReviewStatus(id, sectionKey, status)
}

export function createSectionComment(
  id: string,
  sectionKey: ReviewSectionKey,
  text: string,
): Promise<ApplicationComment> {
  return authorizedRequest(`/certification-applications/${encodeURIComponent(id)}/comments`, {
    method: 'POST',
    body: JSON.stringify({
      sectionKey,
      content: text.trim(),
      isInternal: true,
    }),
  }).then((data) => normalizeComment(data) ?? (data as ApplicationComment))
}

export function createInternalComment(id: string, text: string): Promise<ApplicationComment> {
  return authorizedRequest(`/certification-applications/${encodeURIComponent(id)}/comments`, {
    method: 'POST',
    body: JSON.stringify({
      sectionKey: null,
      content: text.trim(),
      isInternal: true,
    }),
  }).then((data) => normalizeComment(data) ?? (data as ApplicationComment))
}

export async function listApplicationComments(id: string): Promise<ApplicationComment[]> {
  const data = await authorizedRequest<unknown>(`/certification-applications/${encodeURIComponent(id)}/comments`)
  return commentsFromUnknown(data)
}

export async function listSectionReviews(
  id: string,
): Promise<Partial<Record<ReviewSectionKey, SectionStatus>>> {
  const review = await getCabApplicationReview(id)
  const fromKeys = statusesFromReview(review)
  if (Object.keys(fromKeys).length > 0) return fromKeys
  const comments = commentsFromUnknown(review)
  const fromComments: Partial<Record<ReviewSectionKey, SectionStatus>> = {}
  comments.forEach((comment) => {
    if (!comment.sectionKey) return
    const status = decodeSectionComment(comment.content).status
    if (status) fromComments[comment.sectionKey] = status
  })
  return fromComments
}

export interface PartialReviewRequest {
  id: string
  sectionKey: ReviewSectionKey
  informationItem: string
  referenceClause: string
  requestedBy: { id: string; fullName: string } | null
  requestedOn: string
}

export function partialRequestsFromReview(review: ApplicationReviewMetadata): PartialReviewRequest[] {
  const comments = commentsFromUnknown(review)
  const statuses = statusesFromReview(review)
  return REVIEW_SECTIONS.flatMap((sectionKey) => {
    if (statuses[sectionKey] !== 'partiallyComplete') return []
    const latest = [...comments].reverse().find((comment) => comment.sectionKey === sectionKey)
    const text = latest ? decodeSectionComment(latest.content).text.trim() : ''
    return [
      {
        id: `review-${sectionKey}`,
        sectionKey,
        informationItem: text || `${sectionKey} is partially complete`,
        referenceClause: sectionKey,
        requestedBy: latest?.createdBy ?? null,
        requestedOn: latest?.createdAt || latest?.updatedAt || new Date().toISOString(),
      },
    ]
  })
}
