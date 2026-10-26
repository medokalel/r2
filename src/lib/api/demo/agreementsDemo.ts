/**
 * Preview (demo mode) store of the certification agreements: same rules as the API
 * (backend src/modules/agreements), kept in the shared demo store so the CAB and the client
 * portal see the same agreements. The signing code is returned as `devCode` and shown on screen.
 */

import { ApiError } from '@/lib/api/client'
import type {
  AgreementDetail,
  AgreementEvent,
  AgreementFilterParams,
  AgreementGate,
  AgreementGateMode,
  AgreementListItem,
  AgreementPreview,
  AgreementSection,
  AgreementSignature,
  AgreementStatus,
  AgreementTemplate,
  AmendmentSource,
  SignAgreementPayload,
  SigningCode,
} from '@/lib/api/agreementsApi'
import type { OfferItem } from '@/lib/api/cabOffersApi'
import { loadState, saveState } from '@/lib/api/demo/demoStore'
import { CLIENTS, DEMO_CAB, contactName, nowIso, primaryContact, type DemoClient } from '@/lib/api/demo/dataset'
import { clientRecord, cycles, notify, offers, sessionClientId } from '@/lib/api/demo/records'
import { AGREEMENT_VARIABLES, DEFAULT_AGREEMENT_SECTIONS } from '@/lib/api/demo/agreementTemplateDefault'

const KEY = 'agreements'
const DAY_MS = 86_400_000
const OTP_TTL_MS = 10 * 60_000
const OTP_MAX_ATTEMPTS = 5
const GATED_STAGES = ['Stage 1', 'Stage 2', 'Recertification', 'STAGE_1', 'STAGE_2', 'RECERTIFICATION']
const PAYMENT_TERMS = '50% on acceptance, 50% before the Stage 2 audit'
const PAYMENT_TERMS_AR = '50% عند القبول و50% قبل تدقيق المرحلة الثانية'

type Party = 'client' | 'cab'

interface DemoAgreement {
  id: string
  agreementNumber: string
  version: number
  kind: 'original' | 'amendment'
  status: AgreementStatus
  clientId: string
  offerNumber: string | null
  previousId: string | null
  amendmentReason: string | null
  cycleRequest: { id: string; requestCode: string; type: string; title: string } | null
  templateVersion: number
  templateSections: AgreementSection[]
  variables: Record<string, string>
  sections: AgreementSection[]
  documentHash: string | null
  sealHash: string | null
  createdAt: string
  sentAt: string | null
  clientSignedAt: string | null
  countersignedAt: string | null
  terminatedAt: string | null
  terminationReason: string | null
  lastReminderAt: string | null
  reminderCount: number
  signatures: AgreementSignature[]
  events: AgreementEvent[]
}

interface DemoOtp {
  code: string
  expiresAt: number
  createdAt: number
  attempts: number
  documentHash: string
}

interface AgreementsState {
  template: { version: number; sections: AgreementSection[]; gateMode: AgreementGateMode; updatedAt: string | null; updatedByName: string | null } | null
  list: DemoAgreement[]
  seq: number
  otps: Record<string, DemoOtp>
}

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))
const STATUS_LABEL: Record<AgreementStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  client_signed: 'Signed by client',
  active: 'Active',
  superseded: 'Superseded',
  terminated: 'Terminated',
}
const CLIENT_VISIBLE: AgreementStatus[] = ['sent', 'client_signed', 'active', 'superseded', 'terminated']
const userAgent = () => (typeof navigator === 'undefined' ? null : navigator.userAgent)
const fail = (status: number, code: string, message: string, details?: Record<string, unknown>) => new ApiError(`${code}: ${message}`, status, undefined, code, details)

// ── Hashing (same canonical form as the API) ─────────────────────────────────

const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    return `{${Object.keys(obj)
      .sort()
      .filter((k) => obj[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${canonical(obj[k])}`)
      .join(',')}}`
  }
  return JSON.stringify(value ?? null)
}

async function sha256(text: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle
  if (subtle) {
    const digest = await subtle.digest('SHA-256', new TextEncoder().encode(text))
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  // Non-secure preview context: a stable stand-in fingerprint (64 hex characters).
  let h = 0
  for (let i = 0; i < text.length; i += 1) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0
  return (Math.abs(h).toString(16).padStart(8, '0')).repeat(8)
}

const documentContent = (a: DemoAgreement) => ({
  agreementNumber: a.agreementNumber,
  version: a.version,
  kind: a.kind,
  clientId: a.clientId,
  variables: a.variables,
  sections: a.sections,
})
const documentHashOf = (a: DemoAgreement) => sha256(canonical(documentContent(a)))

// ── Template + rendering ──────────────────────────────────────────────────────

const PLACEHOLDER = /\{\{\s*([\w.]+)\s*\}\}/g
const VARIABLE_KEYS = AGREEMENT_VARIABLES.map((v) => v.key)

function fill(text: string, variables: Record<string, string>, lang: 'en' | 'ar'): string {
  return text.replace(PLACEHOLDER, (whole, key: string) => {
    if (!VARIABLE_KEYS.includes(key)) return whole
    const value = (lang === 'ar' ? variables[`${key}@ar`] : undefined) ?? variables[key]
    return value == null || String(value).trim() === '' ? (lang === 'ar' ? '[غير محدد]' : '[not provided]') : String(value)
  })
}

const render = (sections: AgreementSection[], variables: Record<string, string>): AgreementSection[] =>
  sections.map((s) => ({
    key: s.key,
    title: { en: fill(s.title.en, variables, 'en'), ar: fill(s.title.ar, variables, 'ar') },
    body: { en: fill(s.body.en, variables, 'en'), ar: fill(s.body.ar, variables, 'ar') },
  }))

const unknownPlaceholders = (sections: AgreementSection[]) => {
  const found = new Set<string>()
  for (const s of sections) for (const text of [s.title.en, s.title.ar, s.body.en, s.body.ar]) for (const m of text.matchAll(PLACEHOLDER)) if (!VARIABLE_KEYS.includes(m[1])) found.add(m[1])
  return [...found]
}

function sampleVariables(): Record<string, string> {
  return Object.fromEntries(AGREEMENT_VARIABLES.map((v) => [v.key, v.sample]))
}

function variablesFor(c: DemoClient, offer: OfferItem | null, number: string, version: number): Record<string, string> {
  const pc = primaryContact(c)
  const money = (n: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
  const vars: Record<string, string> = {
    'agreement.number': number,
    'agreement.version': String(version),
    'agreement.date': nowIso().slice(0, 10),
    'cab.name': DEMO_CAB.name,
    'cab.legalName': DEMO_CAB.legalName,
    'cab.registrationNumber': '4030412233',
    'cab.address': DEMO_CAB.address,
    'cab.accreditationBody': DEMO_CAB.accreditationBody,
    'client.legalName': c.name,
    'client.tradeName': c.tradeName,
    'client.crNumber': c.crNumber,
    'client.address': c.address,
    'client.representative': pc ? contactName(pc) : '',
    standards: offer?.applicationStandard ?? '',
    scope: offer?.applicationScope ?? '',
    sites: c.sites.map((s) => `${s.name}, ${s.address}`).join('; '),
    fees: (offer?.fees ?? []).map((f) => `${f.description}: ${money(f.amount)}`).join('; '),
    currency: offer?.currency ?? c.currency,
    paymentTerms: offer?.paymentTerms ?? PAYMENT_TERMS,
    cycleYears: '3',
    'offer.number': offer?.offerNumber ?? '',
    'application.number': offer?.relatedApplication ?? '',
  }
  if (vars.paymentTerms === PAYMENT_TERMS) vars['paymentTerms@ar'] = PAYMENT_TERMS_AR
  return vars
}

const offerOf = (clientId: string): OfferItem | null => {
  const c = clientRecord(clientId)
  return offers().find((o) => o.clientCode === c.code && (o.acceptedAt || (o.history ?? []).some((h) => h.action === 'Accepted by client'))) ?? offers().find((o) => o.clientCode === c.code) ?? null
}

// ── Store ─────────────────────────────────────────────────────────────────────

const event = (type: string, actorType: AgreementEvent['actorType'], actorName: string | null, details: Record<string, unknown> = {}, at = nowIso()): AgreementEvent => ({
  id: `ev-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
  type,
  actorType,
  actorName,
  ipAddress: actorType === 'system' ? null : '127.0.0.1',
  userAgent: actorType === 'system' ? null : userAgent(),
  details,
  at,
})

function blank(number: string, seq: number, c: DemoClient, offer: OfferItem | null, at: string): DemoAgreement {
  const variables = variablesFor(c, offer, number, 1)
  return {
    id: `agr-${seq}-v1`,
    agreementNumber: number,
    version: 1,
    kind: 'original',
    status: 'draft',
    clientId: c.id,
    offerNumber: offer?.offerNumber ?? null,
    previousId: null,
    amendmentReason: null,
    cycleRequest: null,
    templateVersion: 0,
    templateSections: DEFAULT_AGREEMENT_SECTIONS,
    variables,
    sections: render(DEFAULT_AGREEMENT_SECTIONS, variables),
    documentHash: null,
    sealHash: null,
    createdAt: at,
    sentAt: null,
    clientSignedAt: null,
    countersignedAt: null,
    terminatedAt: null,
    terminationReason: null,
    lastReminderAt: null,
    reminderCount: 0,
    signatures: [],
    events: [event('GENERATED', 'system', 'System (offer accepted)', { offerNumber: offer?.offerNumber ?? null }, at)],
  }
}

const daysAgo = (days: number) => new Date(Date.now() - days * DAY_MS).toISOString()

function signature(party: Party, c: DemoClient, at: string, hash: string): AgreementSignature {
  const pc = primaryContact(c)
  return party === 'client'
    ? { party, signerName: pc ? contactName(pc) : c.name, signerTitle: pc?.role ?? 'Management representative', signerEmail: pc?.email ?? '', method: 'typed', signatureText: pc ? contactName(pc) : c.name, signatureImage: null, documentHash: hash, ipAddress: '127.0.0.1', userAgent: 'Preview', signedAt: at }
    : { party, signerName: DEMO_CAB.admin.name, signerTitle: 'Certification Manager', signerEmail: DEMO_CAB.admin.email, method: 'typed', signatureText: DEMO_CAB.admin.name, signatureImage: null, documentHash: hash, ipAddress: '127.0.0.1', userAgent: 'Preview', signedAt: at }
}

/** Seed: an active agreement with an amendment awaiting the portal client, one sent, one signed by the client, one draft. */
function seed(): AgreementsState {
  const list: DemoAgreement[] = []
  const make = (seq: number, client: DemoClient, status: AgreementStatus, ageDays: number) => {
    const number = `AGR-${String(seq).padStart(4, '0')}`
    const a = blank(number, seq, client, offerOf(client.id), daysAgo(ageDays))
    a.events = [event('GENERATED', 'system', 'System (offer accepted)', { offerNumber: a.offerNumber }, a.createdAt)]
    if (status !== 'draft') {
      a.status = 'sent'
      a.sentAt = daysAgo(ageDays - 1)
      a.documentHash = 'pending'
      a.events.push(event('SENT', 'cab', DEMO_CAB.admin.name, {}, a.sentAt))
    }
    if (status === 'client_signed' || status === 'active') {
      a.status = 'client_signed'
      a.clientSignedAt = daysAgo(ageDays - 2)
      a.events.push(event('CLIENT_SIGNED', 'client', primaryContact(client) ? contactName(primaryContact(client)) : client.name, {}, a.clientSignedAt))
    }
    if (status === 'active') {
      a.status = 'active'
      a.countersignedAt = daysAgo(ageDays - 3)
      a.events.push(event('COUNTERSIGNED', 'cab', DEMO_CAB.admin.name, {}, a.countersignedAt))
    }
    list.push(a)
    return a
  }
  const active = make(1, CLIENTS[0], 'active', 120)
  make(2, CLIENTS[1], 'sent', 6)
  make(3, CLIENTS[2], 'client_signed', 9)
  make(4, CLIENTS[3], 'draft', 1)
  // Amendment v2 of AGR-0001 (scope change) waiting for the portal client's signature.
  const amendment: DemoAgreement = {
    ...blank(active.agreementNumber, 1, CLIENTS[0], offerOf(CLIENTS[0].id), daysAgo(2)),
    id: 'agr-1-v2',
    version: 2,
    kind: 'amendment',
    status: 'sent',
    previousId: active.id,
    amendmentReason: 'Scope extended to the new bakery line (cycle request CR-0003).',
    sentAt: daysAgo(1),
    documentHash: 'pending',
  }
  amendment.variables = { ...active.variables, 'agreement.version': '2', scope: `${active.variables.scope} Including the new bakery line.`.trim() }
  amendment.sections = render(amendment.templateSections, amendment.variables)
  amendment.events = [event('AMENDMENT_CREATED', 'cab', DEMO_CAB.admin.name, { reason: amendment.amendmentReason }, daysAgo(2)), event('SENT', 'cab', DEMO_CAB.admin.name, {}, daysAgo(1))]
  list.push(amendment)
  return { template: null, list, seq: 4, otps: {} }
}

const state = () => loadState<AgreementsState>(KEY, seed)
const save = () => saveState(KEY, state())

/** Seeds carry a placeholder hash; the real fingerprint is computed on first use (needs async crypto). */
async function ensureHashes(): Promise<void> {
  let changed = false
  for (const a of state().list) {
    if (a.documentHash === 'pending') {
      a.documentHash = await documentHashOf(a)
      const c = clientRecord(a.clientId)
      if (a.clientSignedAt && !a.signatures.some((s) => s.party === 'client')) a.signatures.push(signature('client', c, a.clientSignedAt, a.documentHash))
      if (a.countersignedAt && !a.signatures.some((s) => s.party === 'cab')) a.signatures.push(signature('cab', c, a.countersignedAt, a.documentHash))
      if (a.status === 'active') a.sealHash = await sha256(canonical({ documentHash: a.documentHash, signatures: a.signatures }))
      changed = true
    }
  }
  if (changed) save()
}

const templateNow = () => {
  const t = state().template
  return t ?? { version: 0, sections: DEFAULT_AGREEMENT_SECTIONS, gateMode: 'block' as AgreementGateMode, updatedAt: null, updatedByName: null }
}

const reference = (a: { agreementNumber: string; version: number }) => `${a.agreementNumber} v${a.version}`

function toList(a: DemoAgreement): AgreementListItem {
  const c = clientRecord(a.clientId)
  return {
    id: a.id,
    agreementNumber: a.agreementNumber,
    version: a.version,
    reference: reference(a),
    title: a.kind === 'amendment' ? 'Amendment to the certification agreement' : 'Certification agreement',
    kind: a.kind,
    status: a.status,
    statusLabel: STATUS_LABEL[a.status],
    organizationId: c.id,
    clientName: c.name,
    clientCode: c.code,
    standards: a.variables.standards ?? '',
    scope: a.variables.scope ?? '',
    offerNumber: a.offerNumber,
    createdAt: a.createdAt,
    sentAt: a.sentAt,
    clientSignedAt: a.clientSignedAt,
    countersignedAt: a.countersignedAt,
    terminatedAt: a.terminatedAt,
    lastReminderAt: a.lastReminderAt,
    reminderCount: a.reminderCount,
    awaiting: a.status === 'sent' ? 'client' : a.status === 'draft' || a.status === 'client_signed' ? 'cab' : null,
  }
}

async function toDetail(a: DemoAgreement, viewer: Party): Promise<AgreementDetail> {
  const computed = await documentHashOf(a)
  const family = state().list.filter((x) => x.agreementNumber === a.agreementNumber && (viewer === 'cab' || CLIENT_VISIBLE.includes(x.status)))
  const amendments = state().list.filter((x) => x.previousId === a.id)
  const open = amendments.find((x) => ['draft', 'sent', 'client_signed'].includes(x.status))
  const next = amendments.find((x) => x.status === 'active' || x.status === 'superseded')
  const previous = a.previousId ? state().list.find((x) => x.id === a.previousId) : null
  const cab = viewer === 'cab'
  return {
    ...toList(a),
    sections: a.sections,
    variables: a.variables,
    templateVersion: a.templateVersion,
    documentHash: a.documentHash,
    draftHash: a.documentHash ? null : computed,
    sealHash: a.sealHash,
    integrity: { documentHashValid: a.documentHash ? a.documentHash === computed : null, sealHashValid: a.sealHash ? true : null },
    amendment: a.kind === 'amendment' ? { reason: a.amendmentReason ?? '', previousAgreementId: previous?.id ?? null, previousReference: previous ? reference(previous) : null, cycleRequest: a.cycleRequest } : null,
    supersededBy: a.status === 'superseded' && next ? { id: next.id, reference: reference(next) } : null,
    terminationReason: a.terminationReason,
    signatures: [...a.signatures].sort((x) => (x.party === 'client' ? -1 : 1)),
    events: viewer === 'client' ? a.events.filter((e) => !['UPDATED', 'GENERATED', 'OTP_FAILED'].includes(e.type)) : a.events,
    versions: family.sort((x, y) => x.version - y.version).map((v) => ({ id: v.id, reference: reference(v), version: v.version, status: v.status, createdAt: v.createdAt })),
    cab: { name: DEMO_CAB.name, legalName: DEMO_CAB.legalName, logoUrl: null },
    actions: cab
      ? {
          edit: a.status === 'draft',
          send: a.status === 'draft',
          remind: a.status === 'sent',
          countersign: a.status === 'client_signed',
          terminate: ['draft', 'sent', 'client_signed', 'active'].includes(a.status),
          amend: a.status === 'active' && !open,
          sign: false,
        }
      : { edit: false, send: false, remind: false, countersign: false, terminate: false, amend: false, sign: a.status === 'sent' },
  }
}

function find(id: string): DemoAgreement {
  const all = state().list
  const a = all.find((x) => x.id === id) ?? all.filter((x) => x.agreementNumber === id.toUpperCase()).sort((x, y) => y.version - x.version)[0]
  if (!a) throw new ApiError('Agreement not found.', 404)
  return a
}

function findForClient(id: string): DemoAgreement {
  const a = find(id)
  const clientId = sessionClientId()
  if ((clientId && a.clientId !== clientId) || !CLIENT_VISIBLE.includes(a.status) || !a.sentAt) throw new ApiError('Agreement not found.', 404)
  return a
}

const assertStatus = (a: DemoAgreement, allowed: AgreementStatus[], action: string) => {
  if (!allowed.includes(a.status)) throw fail(409, 'AGREEMENT_INVALID_STATUS', `an agreement that is ${STATUS_LABEL[a.status].toLowerCase()} cannot be ${action}.`)
}

// ── Template API ──────────────────────────────────────────────────────────────

const templateDto = (): AgreementTemplate => {
  const t = templateNow()
  return { version: t.version, isDefault: !state().template, gateMode: t.gateMode, sections: t.sections, variables: AGREEMENT_VARIABLES, updatedAt: t.updatedAt, updatedByName: t.updatedByName }
}

export async function getTemplate(): Promise<AgreementTemplate> {
  await delay()
  return templateDto()
}

export async function saveTemplate(payload: { sections?: AgreementSection[]; gateMode?: AgreementGateMode }): Promise<AgreementTemplate> {
  await delay()
  if (payload.sections) {
    const unknown = unknownPlaceholders(payload.sections)
    if (unknown.length) throw fail(400, 'UNKNOWN_VARIABLE', `the template uses variables that do not exist: ${unknown.map((u) => `{{${u}}}`).join(', ')}.`, { variables: unknown })
  }
  const current = templateNow()
  state().template = {
    version: current.version + 1,
    sections: (payload.sections ?? current.sections).map((s, i) => ({ ...s, key: s.key || `section${i + 1}` })),
    gateMode: payload.gateMode ?? current.gateMode,
    updatedAt: nowIso(),
    updatedByName: DEMO_CAB.admin.name,
  }
  save()
  return templateDto()
}

export async function resetTemplate(): Promise<AgreementTemplate> {
  return saveTemplate({ sections: DEFAULT_AGREEMENT_SECTIONS })
}

export async function previewTemplate(payload: { sections?: AgreementSection[]; organizationId?: string }): Promise<AgreementPreview> {
  await delay(120)
  const sections = payload.sections ?? templateNow().sections
  const unknown = unknownPlaceholders(sections)
  if (unknown.length) throw fail(400, 'UNKNOWN_VARIABLE', `the template uses variables that do not exist: ${unknown.map((u) => `{{${u}}}`).join(', ')}.`, { variables: unknown })
  const variables = payload.organizationId ? variablesFor(clientRecord(payload.organizationId), offerOf(payload.organizationId), 'AGR-PREVIEW', 1) : sampleVariables()
  return { variables, sections: render(sections, variables) }
}

// ── Register ──────────────────────────────────────────────────────────────────

export async function listAgreements(params: AgreementFilterParams): Promise<AgreementListItem[]> {
  await delay()
  await ensureHashes()
  const term = params.search?.trim().toLowerCase() ?? ''
  return state()
    .list.filter((a) => (!params.status || params.status === 'all' || a.status === params.status) && (!params.organizationId || a.clientId === params.organizationId))
    .map(toList)
    .filter((a) => !term || [a.reference, a.clientName, a.clientCode, a.standards, a.offerNumber].some((v) => String(v ?? '').toLowerCase().includes(term)))
    .sort((x, y) => y.createdAt.localeCompare(x.createdAt))
}

export async function getAgreement(id: string, viewer: Party): Promise<AgreementDetail> {
  await delay()
  await ensureHashes()
  const a = viewer === 'client' ? findForClient(id) : find(id)
  if (viewer === 'client' && !a.events.some((e) => e.type === 'VIEWED')) {
    a.events.push(event('VIEWED', 'client', clientName(a)))
    save()
  }
  return toDetail(a, viewer)
}

const clientName = (a: DemoAgreement) => {
  const pc = primaryContact(clientRecord(a.clientId))
  return pc ? contactName(pc) : clientRecord(a.clientId).name
}

function nextNumber(): { seq: number; number: string } {
  const s = state()
  s.seq += 1
  return { seq: s.seq, number: `AGR-${String(s.seq).padStart(4, '0')}` }
}

export async function createAgreement(payload: { organizationId: string; offerId?: string }): Promise<AgreementDetail> {
  await delay()
  const c = CLIENTS.find((x) => x.id === payload.organizationId) ? clientRecord(payload.organizationId) : null
  if (!c) throw new ApiError('Audit client not found.', 404)
  const offer = payload.offerId ? offers().find((o) => o.id === payload.offerId) ?? null : offerOf(c.id)
  const { seq, number } = nextNumber()
  const t = templateNow()
  const a = blank(number, seq, c, offer, nowIso())
  a.templateVersion = t.version
  a.templateSections = t.sections
  a.sections = render(t.sections, a.variables)
  a.events = [event('GENERATED', 'cab', DEMO_CAB.admin.name, { offerNumber: offer?.offerNumber ?? null })]
  state().list.push(a)
  save()
  return toDetail(a, 'cab')
}

/** Demo counterpart of the server hook: accepting an offer drafts the agreement and tells the CAB. */
export function generateForAcceptedOffer(offer: OfferItem): void {
  const c = CLIENTS.find((x) => x.code === offer.clientCode)
  if (!c || state().list.some((a) => a.offerNumber === offer.offerNumber && a.status !== 'terminated')) return
  const { seq, number } = nextNumber()
  const t = templateNow()
  const a = blank(number, seq, clientRecord(c.id), offer, nowIso())
  a.templateVersion = t.version
  a.templateSections = t.sections
  a.sections = render(t.sections, a.variables)
  state().list.push(a)
  save()
  notify('cab', 'agreement_drafted', { ref: number, client: c.name }, `/cab/agreements/${a.id}`)
}

export async function updateAgreement(id: string, payload: { variables?: Record<string, string>; refreshTemplate?: boolean }): Promise<AgreementDetail> {
  await delay()
  const a = find(id)
  assertStatus(a, ['draft'], 'edited')
  if (payload.refreshTemplate) {
    const t = templateNow()
    a.templateSections = t.sections
    a.templateVersion = t.version
  }
  for (const [key, value] of Object.entries(payload.variables ?? {})) {
    if (key === 'agreement.number' || key === 'agreement.version') continue
    a.variables[key] = value
    if (!key.endsWith('@ar') && payload.variables?.[`${key}@ar`] === undefined) delete a.variables[`${key}@ar`]
  }
  a.sections = render(a.templateSections, a.variables)
  a.events.push(event('UPDATED', 'cab', DEMO_CAB.admin.name, { variables: Object.keys(payload.variables ?? {}), refreshTemplate: Boolean(payload.refreshTemplate) }))
  save()
  return toDetail(a, 'cab')
}

export async function sendAgreement(id: string): Promise<AgreementDetail> {
  await delay()
  const a = find(id)
  assertStatus(a, ['draft'], 'sent')
  a.variables['agreement.date'] = nowIso().slice(0, 10)
  a.sections = render(a.templateSections, a.variables)
  a.documentHash = await documentHashOf(a)
  a.status = 'sent'
  a.sentAt = nowIso()
  a.events.push(event('SENT', 'cab', DEMO_CAB.admin.name, { documentHash: a.documentHash }))
  save()
  notify('client', 'agreement_to_sign', { ref: reference(a) }, `/portal/agreements/${a.id}`, a.clientId)
  return toDetail(a, 'cab')
}

export async function remindAgreement(id: string): Promise<AgreementDetail> {
  await delay()
  const a = find(id)
  assertStatus(a, ['sent'], 'reminded')
  if (a.lastReminderAt && Date.now() - new Date(a.lastReminderAt).getTime() < DAY_MS) throw fail(429, 'REMINDER_RATE_LIMIT', 'a reminder was already sent in the last 24 hours.')
  a.lastReminderAt = nowIso()
  a.reminderCount += 1
  a.events.push(event('REMINDED', 'cab', DEMO_CAB.admin.name, { count: a.reminderCount }))
  save()
  notify('client', 'agreement_to_sign', { ref: reference(a) }, `/portal/agreements/${a.id}`, a.clientId)
  return toDetail(a, 'cab')
}

export async function terminateAgreement(id: string, reason: string): Promise<AgreementDetail> {
  await delay()
  const a = find(id)
  assertStatus(a, ['draft', 'sent', 'client_signed', 'active'], 'terminated')
  a.events.push(event('TERMINATED', 'cab', DEMO_CAB.admin.name, { reason, fromStatus: a.status }))
  a.status = 'terminated'
  a.terminatedAt = nowIso()
  a.terminationReason = reason
  save()
  if (a.sentAt) notify('client', 'agreement_terminated', { ref: reference(a) }, `/portal/agreements/${a.id}`, a.clientId)
  return toDetail(a, 'cab')
}

export async function amendmentSources(id: string): Promise<AmendmentSource[]> {
  await delay(120)
  const a = find(id)
  const c = clientRecord(a.clientId)
  return cycles()
    .filter((cy) => cy.clientId === c.code || cy.clientName === c.name)
    .flatMap((cy) =>
      (cy.requests ?? [])
        .filter((r) => r.status !== 'rejected')
        .map((r) => ({ id: r.id, requestCode: r.code, cycleCode: cy.cycleId, type: r.type, status: r.status, title: r.title, metadata: r.metadata ?? {}, createdAt: r.requestedAt })),
    )
}

export async function createAmendment(id: string, payload: { reason: string; cycleRequestId?: string; variables?: Record<string, string> }): Promise<AgreementDetail> {
  await delay()
  const a = find(id)
  assertStatus(a, ['active'], 'amended')
  if (state().list.some((x) => x.previousId === a.id && ['draft', 'sent', 'client_signed'].includes(x.status))) {
    throw fail(409, 'AMENDMENT_IN_PROGRESS', 'finish or terminate the open amendment first.')
  }
  const source = payload.cycleRequestId ? (await amendmentSources(id)).find((r) => r.id === payload.cycleRequestId) ?? null : null
  if (payload.cycleRequestId && !source) throw new ApiError('Cycle request not found for this client.', 404)
  const version = Math.max(...state().list.filter((x) => x.agreementNumber === a.agreementNumber).map((x) => x.version)) + 1
  const t = templateNow()
  const variables: Record<string, string> = { ...a.variables, ...(payload.variables ?? {}), 'agreement.version': String(version), 'agreement.number': a.agreementNumber }
  if (source?.type === 'scopeChange' && source.metadata.proposedScope) variables.scope = source.metadata.proposedScope
  if (source?.type === 'siteChange' && source.metadata.siteName) variables.sites = [variables.sites, [source.metadata.siteName, source.metadata.siteAddress].filter(Boolean).join(', ')].filter(Boolean).join('; ')
  const amendment: DemoAgreement = {
    ...a,
    id: `${a.id.replace(/-v\d+$/, '')}-v${version}`,
    version,
    kind: 'amendment',
    status: 'draft',
    previousId: a.id,
    amendmentReason: payload.reason,
    cycleRequest: source ? { id: source.id, requestCode: source.requestCode, type: source.type, title: source.title } : null,
    templateVersion: t.version,
    templateSections: t.sections,
    variables,
    sections: render(t.sections, variables),
    documentHash: null,
    sealHash: null,
    createdAt: nowIso(),
    sentAt: null,
    clientSignedAt: null,
    countersignedAt: null,
    terminatedAt: null,
    terminationReason: null,
    lastReminderAt: null,
    reminderCount: 0,
    signatures: [],
    events: [event('AMENDMENT_CREATED', 'cab', DEMO_CAB.admin.name, { reason: payload.reason, previous: reference(a), cycleRequest: source?.requestCode ?? null })],
  }
  a.events.push(event('AMENDMENT_CREATED', 'cab', DEMO_CAB.admin.name, { reason: payload.reason, amendment: reference(amendment) }))
  state().list.push(amendment)
  save()
  return toDetail(amendment, 'cab')
}

// ── Gate ──────────────────────────────────────────────────────────────────────

export async function gateFor(clientIdOrCode: string, stage: string): Promise<AgreementGate> {
  await delay(80)
  await ensureHashes()
  return gateSync(clientIdOrCode, stage)
}

function gateSync(clientIdOrCode: string, stage: string): AgreementGate {
  const c = CLIENTS.find((x) => x.id === clientIdOrCode || x.code === clientIdOrCode || x.name === clientIdOrCode)
  const mode = templateNow().gateMode
  const required = GATED_STAGES.includes(stage)
  const mine = state().list.filter((a) => a.clientId === c?.id)
  const active = mine.find((a) => a.status === 'active')
  const latest = [...mine].filter((a) => a.status !== 'terminated' && a.status !== 'superseded').sort((x, y) => y.createdAt.localeCompare(x.createdAt))[0]
  const agreement = active ?? latest
  return {
    required,
    satisfied: !required || Boolean(active),
    mode,
    agreement: agreement ? { id: agreement.id, reference: reference(agreement), status: agreement.status } : null,
    link: agreement ? `/cab/agreements/${agreement.id}` : `/cab/agreements?client=${c?.id ?? ''}`,
  }
}

/** Demo plan gate (sendAuditPlanToClient): throws AGREEMENT_REQUIRED in block mode, returns the warning in warn mode. */
export function enforceGate(clientIdOrCode: string, stage: string): Array<{ code: string; message: string; link: string }> {
  const gate = gateSync(clientIdOrCode, stage)
  if (gate.satisfied) return []
  const message =
    'AGREEMENT_REQUIRED: this client has no active certification agreement. Send the agreement, have it signed by the client and countersign it before sending a Stage 1, Stage 2 or recertification plan.'
  if (gate.mode === 'block') throw new ApiError(message, 409, undefined, 'AGREEMENT_REQUIRED', { link: gate.link, agreement: gate.agreement })
  return [{ code: 'AGREEMENT_REQUIRED', message, link: gate.link }]
}

// ── Signing ───────────────────────────────────────────────────────────────────

export async function requestCode(id: string, party: Party): Promise<SigningCode> {
  await delay()
  await ensureHashes()
  const a = party === 'client' ? findForClient(id) : find(id)
  const expected: AgreementStatus = party === 'client' ? 'sent' : 'client_signed'
  if (a.status !== expected) {
    if (party === 'cab' && a.status === 'sent') throw fail(409, 'SIGNING_ORDER', 'the client signs first; countersign after the client has signed.')
    throw fail(409, 'AGREEMENT_INVALID_STATUS', `an agreement that is ${STATUS_LABEL[a.status].toLowerCase()} cannot be signed.`)
  }
  const key = `${a.id}:${party}`
  const recent = state().otps[key]
  if (recent && Date.now() - recent.createdAt < 60_000) {
    const wait = Math.ceil((60_000 - (Date.now() - recent.createdAt)) / 1000)
    throw fail(429, 'OTP_RATE_LIMIT', `a code was sent less than a minute ago. Try again in ${wait} seconds.`, { retryAfterSeconds: wait })
  }
  const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
  state().otps[key] = { code, createdAt: Date.now(), expiresAt: Date.now() + OTP_TTL_MS, attempts: 0, documentHash: a.documentHash ?? '' }
  const email = party === 'client' ? primaryContact(clientRecord(a.clientId))?.email ?? '' : DEMO_CAB.admin.email
  a.events.push(event('OTP_SENT', party, party === 'client' ? clientName(a) : DEMO_CAB.admin.name, { sentTo: email.replace(/^(.).*@/, '$1***@') }))
  save()
  return { otpId: key, expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(), sentTo: email.replace(/^(.).*@/, '$1***@'), delivery: 'none', devCode: code }
}

export async function sign(id: string, party: Party, payload: SignAgreementPayload): Promise<AgreementDetail> {
  await delay()
  const a = party === 'client' ? findForClient(id) : find(id)
  const expected: AgreementStatus = party === 'client' ? 'sent' : 'client_signed'
  if (a.status !== expected) {
    if (party === 'cab' && a.status === 'sent') throw fail(409, 'SIGNING_ORDER', 'the client signs first; countersign after the client has signed.')
    throw fail(409, 'AGREEMENT_INVALID_STATUS', 'the agreement cannot be signed in its current status.')
  }
  if ((await documentHashOf(a)) !== a.documentHash) throw fail(409, 'DOCUMENT_INTEGRITY_FAILED', 'the agreement text no longer matches its sealed fingerprint.')
  if (payload.documentHash !== a.documentHash) throw fail(409, 'DOCUMENT_CHANGED', 'the agreement changed after you opened it. Reload it and review it again.')
  const key = `${a.id}:${party}`
  const otp = state().otps[key]
  if (!otp) throw fail(422, 'OTP_REQUIRED', 'request a signing code first.')
  if (otp.attempts >= OTP_MAX_ATTEMPTS) throw fail(429, 'OTP_LOCKED', 'too many wrong codes. Request a new signing code.')
  if (otp.expiresAt <= Date.now()) throw fail(422, 'OTP_EXPIRED', 'the signing code has expired. Request a new one.')
  if (otp.code !== payload.code) {
    otp.attempts += 1
    a.events.push(event('OTP_FAILED', party, null, { attempts: otp.attempts }))
    save()
    if (otp.attempts >= OTP_MAX_ATTEMPTS) throw fail(429, 'OTP_LOCKED', 'too many wrong codes. Request a new signing code.')
    throw fail(422, 'OTP_INVALID', `the signing code is not correct. ${OTP_MAX_ATTEMPTS - otp.attempts} attempts left.`, { attemptsLeft: OTP_MAX_ATTEMPTS - otp.attempts })
  }
  delete state().otps[key]
  const at = nowIso()
  a.signatures.push({
    party,
    signerName: payload.signerName,
    signerTitle: payload.signerTitle,
    signerEmail: party === 'client' ? primaryContact(clientRecord(a.clientId))?.email ?? '' : DEMO_CAB.admin.email,
    method: payload.method,
    signatureText: payload.signatureText || null,
    signatureImage: payload.signatureImage || null,
    documentHash: a.documentHash ?? '',
    ipAddress: '127.0.0.1',
    userAgent: userAgent(),
    signedAt: at,
  })
  a.events.push(event(party === 'client' ? 'CLIENT_SIGNED' : 'COUNTERSIGNED', party, payload.signerName, { signerTitle: payload.signerTitle, method: payload.method, documentHash: a.documentHash }))
  if (party === 'client') {
    a.status = 'client_signed'
    a.clientSignedAt = at
    save()
    notify('cab', 'agreement_signed_by_client', { ref: reference(a), client: clientRecord(a.clientId).name }, `/cab/agreements/${a.id}`)
  } else {
    a.status = 'active'
    a.countersignedAt = at
    a.sealHash = await sha256(canonical({ documentHash: a.documentHash, signatures: a.signatures }))
    const previous = a.previousId ? state().list.find((x) => x.id === a.previousId && x.status === 'active') : null
    if (previous) {
      previous.status = 'superseded'
      previous.events.push(event('SUPERSEDED', 'system', 'System', { by: reference(a) }))
    }
    save()
    notify('client', 'agreement_active', { ref: reference(a) }, `/portal/agreements/${a.id}`, a.clientId)
  }
  return toDetail(a, party)
}

// ── Client list ───────────────────────────────────────────────────────────────

export async function listClientAgreements(): Promise<AgreementListItem[]> {
  await delay()
  await ensureHashes()
  const clientId = sessionClientId()
  return state()
    .list.filter((a) => (!clientId || a.clientId === clientId) && CLIENT_VISIBLE.includes(a.status) && a.sentAt)
    .sort((x, y) => String(y.sentAt).localeCompare(String(x.sentAt)))
    .map(toList)
}
