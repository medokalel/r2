/**
 * Certification agreements API (ISO/IEC 17021-1 5.1.2): CAB template, register, e-signature, client portal.
 *
 * CAB (core feature, not plan gated):
 *   GET    /cab/agreement-template                 → AgreementTemplate
 *   PUT    /cab/agreement-template                 { sections?, gateMode? } → AgreementTemplate
 *   POST   /cab/agreement-template/reset           → AgreementTemplate
 *   POST   /cab/agreement-template/preview         { sections?, organizationId? } → AgreementPreview
 *   GET    /cab/agreements?status&search&organizationId → AgreementListItem[]
 *   GET    /cab/agreements/gate?organizationId&stage    → AgreementGate
 *   POST   /cab/agreements                         { organizationId, offerId? } → AgreementDetail
 *   GET    /cab/agreements/:id                     → AgreementDetail
 *   PATCH  /cab/agreements/:id                     { variables?, refreshTemplate? } → AgreementDetail
 *   POST   /cab/agreements/:id/send | remind       → AgreementDetail
 *   POST   /cab/agreements/:id/otp                 → SigningCode
 *   POST   /cab/agreements/:id/countersign         SignAgreementPayload → AgreementDetail
 *   POST   /cab/agreements/:id/terminate           { reason } → AgreementDetail
 *   GET    /cab/agreements/:id/amendment-sources   → AmendmentSource[]
 *   POST   /cab/agreements/:id/amendments          { reason, cycleRequestId?, variables? } → AgreementDetail
 * Client portal:
 *   GET  /agreements, GET /agreements/:id, POST /agreements/:id/otp, POST /agreements/:id/sign
 *
 * Errors carry a `code`: AGREEMENT_REQUIRED (plan gate, with `link`), SIGNING_ORDER, OTP_INVALID
 * (`attemptsLeft`), OTP_EXPIRED, OTP_LOCKED, OTP_RATE_LIMIT, DOCUMENT_CHANGED, DOCUMENT_INTEGRITY_FAILED,
 * REMINDER_RATE_LIMIT, AMENDMENT_IN_PROGRESS, UNKNOWN_VARIABLE. In the preview (demo mode) everything
 * runs on the demo store (lib/api/demo/agreementsDemo.ts), which shows the signing code on screen.
 */

import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import * as demo from '@/lib/api/demo/agreementsDemo'
import { listAllCabAuditClients } from '@/lib/api/clientRegistrationApi'
import { CLIENTS } from '@/lib/api/demo/dataset'

export type AgreementStatus = 'draft' | 'sent' | 'client_signed' | 'active' | 'superseded' | 'terminated'
export const AGREEMENT_STATUSES: AgreementStatus[] = ['draft', 'sent', 'client_signed', 'active', 'superseded', 'terminated']
export type AgreementGateMode = 'block' | 'warn'
export type SignatureMethod = 'typed' | 'drawn' | 'uploaded'

export interface Bilingual {
  en: string
  ar: string
}

export interface AgreementSection {
  key: string
  title: Bilingual
  body: Bilingual
}

export interface AgreementVariableInfo {
  key: string
  label: Bilingual
  sample: string
}

export interface AgreementTemplate {
  version: number
  isDefault: boolean
  gateMode: AgreementGateMode
  sections: AgreementSection[]
  variables: AgreementVariableInfo[]
  updatedAt: string | null
  updatedByName: string | null
}

export interface AgreementPreview {
  variables: Record<string, string>
  sections: AgreementSection[]
}

export interface AgreementListItem {
  id: string
  agreementNumber: string
  version: number
  reference: string
  title: string
  kind: 'original' | 'amendment'
  status: AgreementStatus
  statusLabel: string
  organizationId: string
  clientName: string
  clientCode: string
  standards: string
  scope: string
  offerNumber: string | null
  createdAt: string
  sentAt: string | null
  clientSignedAt: string | null
  countersignedAt: string | null
  terminatedAt: string | null
  lastReminderAt: string | null
  reminderCount: number
  awaiting: 'cab' | 'client' | null
}

export interface AgreementSignature {
  party: 'client' | 'cab'
  signerName: string
  signerTitle: string
  signerEmail: string
  method: SignatureMethod
  signatureText: string | null
  signatureImage: string | null
  documentHash: string
  ipAddress: string | null
  userAgent: string | null
  signedAt: string
}

export interface AgreementEvent {
  id: string
  type: string
  actorType: 'cab' | 'client' | 'system'
  actorName: string | null
  ipAddress: string | null
  userAgent: string | null
  details: Record<string, unknown>
  at: string
}

export interface AgreementActions {
  edit: boolean
  send: boolean
  remind: boolean
  countersign: boolean
  terminate: boolean
  amend: boolean
  sign: boolean
}

export interface AgreementDetail extends AgreementListItem {
  sections: AgreementSection[]
  variables: Record<string, string>
  templateVersion: number
  documentHash: string | null
  draftHash: string | null
  sealHash: string | null
  integrity: { documentHashValid: boolean | null; sealHashValid: boolean | null }
  amendment: {
    reason: string
    previousAgreementId: string | null
    previousReference: string | null
    cycleRequest: { id: string; requestCode: string; type: string; title: string } | null
  } | null
  supersededBy: { id: string; reference: string } | null
  terminationReason: string | null
  signatures: AgreementSignature[]
  events: AgreementEvent[]
  versions: Array<{ id: string; reference: string; version: number; status: AgreementStatus; createdAt: string }>
  cab: { name: string; legalName: string; logoUrl: string | null } | null
  actions: AgreementActions
}

export interface AgreementGate {
  required: boolean
  satisfied: boolean
  mode: AgreementGateMode
  agreement: { id: string; reference: string; status: string } | null
  link: string
}

export interface SigningCode {
  otpId: string
  expiresAt: string
  sentTo: string
  delivery: 'email' | 'none'
  /** Preview and non-production servers without email only: the code to type. */
  devCode?: string
}

export interface SignAgreementPayload {
  code: string
  signerName: string
  signerTitle: string
  method: SignatureMethod
  signatureText?: string
  signatureImage?: string
  documentHash: string
  accept: true
}

export interface AmendmentSource {
  id: string
  requestCode: string
  cycleCode: string
  type: 'scopeChange' | 'siteChange' | 'transfer'
  status: string
  title: string
  metadata: Record<string, string>
  createdAt: string
}

export interface AgreementFilterParams {
  status?: AgreementStatus | 'all'
  search?: string
  organizationId?: string
}

const json = (method: string, body?: unknown): RequestInit => ({ method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
const path = (id: string) => `/cab/agreements/${encodeURIComponent(id)}`
const clientPath = (id: string) => `/agreements/${encodeURIComponent(id)}`

// ── Template ──────────────────────────────────────────────────────────────────

export async function getAgreementTemplate(): Promise<AgreementTemplate> {
  if (!isDemoMode()) return authorizedRequest<AgreementTemplate>('/cab/agreement-template')
  return demo.getTemplate()
}

export async function saveAgreementTemplate(payload: { sections?: AgreementSection[]; gateMode?: AgreementGateMode }): Promise<AgreementTemplate> {
  if (!isDemoMode()) return authorizedRequest<AgreementTemplate>('/cab/agreement-template', json('PUT', payload))
  return demo.saveTemplate(payload)
}

export async function resetAgreementTemplate(): Promise<AgreementTemplate> {
  if (!isDemoMode()) return authorizedRequest<AgreementTemplate>('/cab/agreement-template/reset', json('POST'))
  return demo.resetTemplate()
}

export async function previewAgreementTemplate(payload: { sections?: AgreementSection[]; organizationId?: string }): Promise<AgreementPreview> {
  if (!isDemoMode()) return authorizedRequest<AgreementPreview>('/cab/agreement-template/preview', json('POST', payload))
  return demo.previewTemplate(payload)
}

// ── CAB register ──────────────────────────────────────────────────────────────

export async function listAgreements(params: AgreementFilterParams = {}): Promise<AgreementListItem[]> {
  if (!isDemoMode()) {
    const qs = new URLSearchParams()
    if (params.status && params.status !== 'all') qs.set('status', params.status)
    if (params.search?.trim()) qs.set('search', params.search.trim())
    if (params.organizationId) qs.set('organizationId', params.organizationId)
    const query = qs.toString()
    return authorizedRequest<AgreementListItem[]>(`/cab/agreements${query ? `?${query}` : ''}`)
  }
  return demo.listAgreements(params)
}

export async function getAgreement(id: string): Promise<AgreementDetail> {
  if (!isDemoMode()) return authorizedRequest<AgreementDetail>(path(id))
  return demo.getAgreement(id, 'cab')
}

export async function createAgreement(payload: { organizationId: string; offerId?: string }): Promise<AgreementDetail> {
  if (!isDemoMode()) return authorizedRequest<AgreementDetail>('/cab/agreements', json('POST', payload))
  return demo.createAgreement(payload)
}

export async function updateAgreement(id: string, payload: { variables?: Record<string, string>; refreshTemplate?: boolean }): Promise<AgreementDetail> {
  if (!isDemoMode()) return authorizedRequest<AgreementDetail>(path(id), json('PATCH', payload))
  return demo.updateAgreement(id, payload)
}

export async function sendAgreement(id: string): Promise<AgreementDetail> {
  if (!isDemoMode()) return authorizedRequest<AgreementDetail>(`${path(id)}/send`, json('POST'))
  return demo.sendAgreement(id)
}

export async function remindAgreement(id: string): Promise<AgreementDetail> {
  if (!isDemoMode()) return authorizedRequest<AgreementDetail>(`${path(id)}/remind`, json('POST'))
  return demo.remindAgreement(id)
}

export async function terminateAgreement(id: string, reason: string): Promise<AgreementDetail> {
  if (!isDemoMode()) return authorizedRequest<AgreementDetail>(`${path(id)}/terminate`, json('POST', { reason }))
  return demo.terminateAgreement(id, reason)
}

export async function listAmendmentSources(id: string): Promise<AmendmentSource[]> {
  if (!isDemoMode()) return authorizedRequest<AmendmentSource[]>(`${path(id)}/amendment-sources`)
  return demo.amendmentSources(id)
}

export async function createAmendment(id: string, payload: { reason: string; cycleRequestId?: string; variables?: Record<string, string> }): Promise<AgreementDetail> {
  if (!isDemoMode()) return authorizedRequest<AgreementDetail>(`${path(id)}/amendments`, json('POST', payload))
  return demo.createAmendment(id, payload)
}

/** Audit clients the CAB can generate an agreement for (GET /cab-clients). */
export async function listAgreementClients(): Promise<Array<{ id: string; name: string }>> {
  if (!isDemoMode()) return (await listAllCabAuditClients()).map((c) => ({ id: c.id, name: c.name || c.tradeName || c.id }))
  return CLIENTS.map((c) => ({ id: c.id, name: c.name }))
}

export async function getAgreementGate(organizationId: string, stage: string): Promise<AgreementGate> {
  if (!isDemoMode()) {
    const qs = new URLSearchParams({ organizationId, stage })
    return authorizedRequest<AgreementGate>(`/cab/agreements/gate?${qs.toString()}`)
  }
  return demo.gateFor(organizationId, stage)
}

/** Signing code for the CAB countersignature. */
export async function requestCountersignCode(id: string): Promise<SigningCode> {
  if (!isDemoMode()) return authorizedRequest<SigningCode>(`${path(id)}/otp`, json('POST'))
  return demo.requestCode(id, 'cab')
}

export async function countersignAgreement(id: string, payload: SignAgreementPayload): Promise<AgreementDetail> {
  if (!isDemoMode()) return authorizedRequest<AgreementDetail>(`${path(id)}/countersign`, json('POST', payload))
  return demo.sign(id, 'cab', payload)
}

// ── Client portal ─────────────────────────────────────────────────────────────

export async function listClientAgreements(): Promise<AgreementListItem[]> {
  if (!isDemoMode()) return authorizedRequest<AgreementListItem[]>('/agreements')
  return demo.listClientAgreements()
}

export async function getClientAgreement(id: string): Promise<AgreementDetail> {
  if (!isDemoMode()) return authorizedRequest<AgreementDetail>(clientPath(id))
  return demo.getAgreement(id, 'client')
}

export async function requestSigningCode(id: string): Promise<SigningCode> {
  if (!isDemoMode()) return authorizedRequest<SigningCode>(`${clientPath(id)}/otp`, json('POST'))
  return demo.requestCode(id, 'client')
}

export async function signAgreement(id: string, payload: SignAgreementPayload): Promise<AgreementDetail> {
  if (!isDemoMode()) return authorizedRequest<AgreementDetail>(`${clientPath(id)}/sign`, json('POST', payload))
  return demo.sign(id, 'client', payload)
}
