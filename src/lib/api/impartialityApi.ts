/**
 * Impartiality register API (ISO/IEC 17021-1 5.2).
 *
 *   GET    /cab/impartiality/register                          → ImpartialityRegister
 *   GET    /cab/impartiality/persons/:id                       → ImpartialityPerson
 *   GET    /cab/impartiality/relationships?personId&organizationId&reviewStatus&type → ImpartialityRelationship[]
 *   POST   /cab/impartiality/relationships                     → ImpartialityRelationship
 *   PATCH  /cab/impartiality/relationships/:id                 → ImpartialityRelationship (back to pending review)
 *   DELETE /cab/impartiality/relationships/:id                 (pending records only)
 *   POST   /cab/impartiality/relationships/:id/review          { outcome, notes } → ImpartialityRelationship
 *   GET    /cab/impartiality/declarations?personId&kind&auditPlanId → ImpartialityDeclaration[]
 *   POST   /cab/impartiality/declarations                      → ImpartialityDeclaration
 *
 * Employees do not sign in: a CAB admin records the declaration the person signed. Team validation reads
 * this register (cooling-off period from the team-selection settings). Preview: demo store.
 */

import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode } from '@/lib/api/demo/demoStore'

export type RelationshipType = 'CONSULTANCY' | 'INTERNAL_AUDIT' | 'EMPLOYMENT' | 'FAMILY' | 'FINANCIAL_INTEREST' | 'CERTIFICATION_DECISION' | 'OTHER'
export const RELATIONSHIP_TYPES: RelationshipType[] = ['CONSULTANCY', 'INTERNAL_AUDIT', 'EMPLOYMENT', 'FAMILY', 'FINANCIAL_INTEREST', 'CERTIFICATION_DECISION', 'OTHER']
export type ReviewStatus = 'PENDING' | 'CONFIRMED' | 'DISMISSED'
export type DeclarationStatus = 'valid' | 'expiring' | 'expired' | 'missing'

export interface ImpartialityRelationship {
  id: string
  personId: string
  personName: string
  organizationId: string | null
  clientName: string
  type: RelationshipType
  description: string
  startDate: string | null
  endDate: string | null
  ongoing: boolean
  source: 'DECLARATION' | 'CAB_RECORD'
  declarationId: string | null
  reviewStatus: ReviewStatus
  reviewNotes: string
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  /** Effect on team selection today. */
  effect: 'blocks' | 'warns' | 'none'
  /** End of the cooling-off period when it blocks for that reason. */
  blockedUntil: string | null
}

export interface ImpartialityDeclaration {
  id: string
  personId: string
  personName: string
  kind: 'ANNUAL' | 'AUDIT'
  auditPlanId: string | null
  planNumber: string | null
  declaredAt: string
  validUntil: string | null
  noConflicts: boolean
  statement: string
  signedName: string
  recordedBy: string | null
  relationshipIds: string[]
}

export interface ImpartialityRegisterRow {
  personId: string
  name: string
  jobTitle: string
  active: boolean
  lastDeclarationAt: string | null
  declarationValidUntil: string | null
  declarationStatus: DeclarationStatus
  relationshipCount: number
  pendingReview: number
  blockingRelationships: number
}

export interface ImpartialityRegister {
  settings: { coolingOffMonths: number; declarationValidityMonths: number; requireAnnualDeclaration: boolean; requireAuditDeclaration: boolean }
  summary: { people: number; validDeclarations: number; missingOrExpired: number; pendingReview: number; blockingRelationships: number }
  people: ImpartialityRegisterRow[]
}

export interface ImpartialityPerson {
  personId: string
  name: string
  jobTitle: string
  declarationStatus: DeclarationStatus
  declarationValidUntil: string | null
  coolingOffMonths: number
  declarations: ImpartialityDeclaration[]
  relationships: ImpartialityRelationship[]
}

export interface RelationshipInput {
  organizationId?: string | null
  clientName?: string
  type: RelationshipType
  description: string
  startDate?: string | null
  endDate?: string | null
}

export interface DeclarationInput {
  personId: string
  kind: 'ANNUAL' | 'AUDIT'
  auditPlanId?: string
  noConflicts: boolean
  statement?: string
  signedName: string
  declaredAt?: string
  relationships?: RelationshipInput[]
}

const demo = () => import('@/lib/api/demo/teamSelectionDemo')
const json = (method: string, body?: unknown): RequestInit => ({ method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
const qs = (params: Record<string, string | undefined>) => {
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v) search.set(k, v)
  const text = search.toString()
  return text ? `?${text}` : ''
}

export async function getImpartialityRegister(): Promise<ImpartialityRegister> {
  if (!isDemoMode()) return authorizedRequest<ImpartialityRegister>('/cab/impartiality/register')
  return (await demo()).demoRegister()
}

export async function getImpartialityPerson(personId: string): Promise<ImpartialityPerson> {
  if (!isDemoMode()) return authorizedRequest<ImpartialityPerson>(`/cab/impartiality/persons/${encodeURIComponent(personId)}`)
  return (await demo()).demoImpartialityPerson(personId)
}

export async function listRelationships(filters: { personId?: string; organizationId?: string; reviewStatus?: ReviewStatus; type?: RelationshipType } = {}): Promise<ImpartialityRelationship[]> {
  if (!isDemoMode()) return authorizedRequest<ImpartialityRelationship[]>(`/cab/impartiality/relationships${qs(filters)}`)
  return (await demo()).demoListRelationships(filters)
}

export async function createRelationship(body: RelationshipInput & { personId: string }): Promise<ImpartialityRelationship> {
  if (!isDemoMode()) return authorizedRequest<ImpartialityRelationship>('/cab/impartiality/relationships', json('POST', body))
  return (await demo()).demoCreateRelationship(body)
}

export async function updateRelationship(id: string, body: Partial<RelationshipInput>): Promise<ImpartialityRelationship> {
  if (!isDemoMode()) return authorizedRequest<ImpartialityRelationship>(`/cab/impartiality/relationships/${encodeURIComponent(id)}`, json('PATCH', body))
  return (await demo()).demoUpdateRelationship(id, body)
}

export async function deleteRelationship(id: string): Promise<{ id: string; deleted: boolean }> {
  if (!isDemoMode()) return authorizedRequest<{ id: string; deleted: boolean }>(`/cab/impartiality/relationships/${encodeURIComponent(id)}`, json('DELETE'))
  return (await demo()).demoDeleteRelationship(id)
}

export async function reviewRelationship(id: string, outcome: 'CONFIRMED' | 'DISMISSED', notes: string): Promise<ImpartialityRelationship> {
  if (!isDemoMode()) return authorizedRequest<ImpartialityRelationship>(`/cab/impartiality/relationships/${encodeURIComponent(id)}/review`, json('POST', { outcome, notes }))
  return (await demo()).demoReviewRelationship(id, outcome, notes)
}

export async function listDeclarations(filters: { personId?: string; kind?: 'ANNUAL' | 'AUDIT'; auditPlanId?: string } = {}): Promise<ImpartialityDeclaration[]> {
  if (!isDemoMode()) return authorizedRequest<ImpartialityDeclaration[]>(`/cab/impartiality/declarations${qs(filters)}`)
  return (await demo()).demoListDeclarations(filters)
}

export async function createDeclaration(body: DeclarationInput): Promise<ImpartialityDeclaration> {
  if (!isDemoMode()) return authorizedRequest<ImpartialityDeclaration>('/cab/impartiality/declarations', json('POST', body))
  return (await demo()).demoCreateDeclaration(body)
}
