/**
 * Certificates — the CAB certificate register, the prepare/issue screen and the
 * audit client's own certificates.
 *
 * Real endpoints:
 *   GET  /cab/certificates                    register (drafts are prepared when a decision grants certification)
 *   GET  /cab/certificates/:id/preparation
 *   POST /cab/certificates/:id/issue          notifies the client (certificate_issued)
 *   POST /cab/certificates/:id/suspend        { reason }
 *   POST /cab/certificates/:id/withdraw       { reason }
 *   POST /cab/certificates/:id/reinstate      { reason }  SUSPENDED → ISSUED (notifies certificate_reinstated)
 *   POST /cab/certificates/:id/reissue        { reason, scope?, issueDate?, expiryDate? }  new version, old one SUPERSEDED
 *   POST /cab/certificates/:id/extend         { expiryDate, reason }  ≤ 6 months
 *   GET  /cab/certificates/:id/history        versions + status events
 *   GET  /certificates                        the signed-in audit client's certificates (no drafts)
 * In the preview (demo mode) certificates live in the shared demo store.
 */
import { authorizedRequest } from '@/lib/api/authorizedClient'
import { ApiError } from '@/lib/api/client'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { APPLICATIONS, CERTIFICATES as DATASET_CERTIFICATES, CLIENTS, primaryContact } from '@/lib/api/demo/dataset'
import { certificates, decisions, notify as demoNotify, onCertificateIssued, saveCertificates, scopeToSession } from '@/lib/api/demo/records'
import { loadState, saveState } from '@/lib/api/demo/demoStore'
import { notSet } from '@/lib/emptyValue'

export type CertificateStatus = 'DRAFT' | 'ISSUED' | 'SUSPENDED' | 'WITHDRAWN' | 'SUPERSEDED'

export interface CertificateRegisterItem {
  id: string
  certificateNumber: string
  clientId: string
  clientName: string
  standard: string
  scope: string
  status: CertificateStatus
  /** ISO 3166-1 alpha-2 code, matched against getCountryOptions(). */
  countryCode: string
  issuedAt: string
  /** Empty until the certificate is issued. */
  validUntil: string | null
  /** 1 for the original certificate, 2+ for reissued versions (real API). */
  version?: number
  /** Reason of the last status change (suspension, reinstatement, reissue …). */
  statusReason?: string | null
}

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

// Demo mode: certificates live in the shared demo store; drafts are prepared when a
// decision grants certification, and issuing one opens its certification cycle
// (lib/api/demo/records.ts).
const all = () => certificates()
const certificatePath = (id: string) => `/cab/certificates/${encodeURIComponent(id)}`
const findDemo = (id: string) => all().find((certificate) => certificate.id === id || certificate.certificateNumber === id)

export function listCabCertificates(): Promise<CertificateRegisterItem[]> {
  if (!isDemoMode()) return authorizedRequest<CertificateRegisterItem[]>('/cab/certificates')
  return delay().then(() => scopeToSession([...all()], (c) => c.clientId))
}

/** The signed-in audit client's issued, suspended and withdrawn certificates (drafts are never shown). */
export function listMyCertificates(): Promise<CertificateRegisterItem[]> {
  if (!isDemoMode()) return authorizedRequest<CertificateRegisterItem[]>('/certificates')
  return delay().then(() => scopeToSession(all().filter((c) => c.status !== 'DRAFT'), (c) => c.clientId))
}

/* ── Prepare certificate ──────────────────────────────────────────────── */

/** Languages a certificate document can be issued in. */
export type CertificateLanguage = 'en' | 'ar'

/** A text the API returns once per certificate language. */
export type LocalizedText = Record<CertificateLanguage, string>

export interface CertificateSite {
  id: string
  name: string
  address: string
  scope: string
}

export interface CertificateOption {
  id: string
  name: string
}

/** An accreditation / scheme mark printed in the certificate footer. */
export interface CertificateMark extends CertificateOption {
  imageUrl: string
}

export interface CertificateSignatory extends CertificateOption {
  /** Role printed under the signature line, e.g. "Certification Manager". */
  title: LocalizedText
  signatureUrl: string
}

/** The certifying body's details printed on the certificate (from the CAB profile). */
export interface CertificateIssuer {
  /** Short brand name used inside sentences, e.g. "CASCO". */
  shortName: string
  name: LocalizedText
  logoUrl: string
  /** Large faint mark drawn behind the certificate text. */
  watermarkUrl: string
  tagline: string
  addressLines: LocalizedText[]
  website: string
  email: string
  phone: string
  workingHours: LocalizedText
  formCode: string
  version: string
  accreditation: {
    name: LocalizedText
    address: LocalizedText
  }
}

export interface CertificatePreparation {
  certificateId: string
  certificateNumber: string
  status: CertificateStatus
  standard: {
    /** Standard with its edition, e.g. "ISO 9001:2015". */
    code: string
    /** Management-system name used in sentences, e.g. "Quality Management System". */
    systemNames: LocalizedText
  }
  application: {
    number: string
    clientNumber: string
    legalName: string
    /** ISO 3166-1 alpha-2 code, matched against getCountryOptions(). */
    countryCode: string
    primaryContact: string
    email: string
  }
  decision: {
    number: string
    /** ISO date (YYYY-MM-DD). */
    date: string
    outcome: 'GRANTED'
    approvedScope: string
    approvedScopeDescription: string
    sites: CertificateSite[]
  }
  /** Client-facing text printed on the certificate, in each certificate language. */
  content: {
    tradeName: LocalizedText
    clientName: LocalizedText
    clientAddress: LocalizedText
    scope: LocalizedText
    clientLogoUrl: string | null
  }
  issuer: CertificateIssuer
  /** Values the form opens with — ISO dates (YYYY-MM-DD). */
  defaults: {
    issueDate: string
    effectiveDate: string
    expiryDate: string
    templateId: string
    language: CertificateLanguage
    signatoryId: string
    includeQrCode: boolean
    markIds: string[]
  }
  options: {
    templates: CertificateOption[]
    signatories: CertificateSignatory[]
    /** Marks the CAB is authorised to apply (configured in the CAB setup). */
    marks: CertificateMark[]
  }
}

export interface IssueCertificatePayload {
  issueDate: string
  effectiveDate: string
  expiryDate: string
  templateId: string
  language: CertificateLanguage
  signatoryId: string
  markIds: string[]
  includeQrCode: boolean
}

const STANDARD_EDITIONS: Record<string, string> = {
  'ISO 9001': '2015',
  'ISO 14001': '2015',
  'ISO 22000': '2018',
  'ISO 45001': '2018',
  'ISO 13485': '2016',
  'ISO/IEC 27001': '2022',
}

const SYSTEM_NAMES: Record<string, LocalizedText> = {
  'ISO 9001': { en: 'Quality Management System', ar: 'نظام إدارة الجودة' },
  'ISO 14001': { en: 'Environmental Management System', ar: 'نظام الإدارة البيئية' },
  'ISO 22000': { en: 'Food Safety Management System', ar: 'نظام إدارة سلامة الغذاء' },
  'ISO 45001': {
    en: 'Occupational Health and Safety Management System',
    ar: 'نظام إدارة الصحة والسلامة المهنية',
  },
  'ISO 13485': { en: 'Medical Devices Quality Management System', ar: 'نظام إدارة جودة الأجهزة الطبية' },
  'ISO/IEC 27001': { en: 'Information Security Management System', ar: 'نظام إدارة أمن المعلومات' },
}

const MOCK_ISSUER: CertificateIssuer = {
  shortName: 'CASCO',
  name: { en: 'CASCO For Assessment Services Ltd.', ar: 'كاسكو لخدمات التقييم المحدودة' },
  logoUrl: '/certificate/casco-logo.png',
  watermarkUrl: '/certificate/casco-watermark.png',
  tagline: 'SMALL CONFORMITY.. REAL IMPACT',
  addressLines: [
    {
      en: 'Building No. 1, Chillout Lotus Maxim, Third Floor, Fifth Settlement, New Cairo, Egypt.',
      ar: 'مبنى رقم ١، شيل اوت لوتس مكسيم، الدور الثالث، التجمع الخامس، القاهرة الجديدة، مصر.',
    },
    {
      en: '61 Al Falki, Bab Al Louq, Abdeen, Cairo 11513, Egypt.',
      ar: '٦١ الفلكي، باب اللوق، عابدين، القاهرة ١١٥١٣، مصر.',
    },
  ],
  website: 'www.casco.com.eg',
  email: 'info@casco.com.eg',
  phone: '+20 2 2390 2404',
  workingHours: {
    en: 'Monday to Friday, from 9:00 AM to 6:00 PM.',
    ar: 'من الاثنين إلى الجمعة، من 9:00 صباحًا حتى 6:00 مساءً.',
  },
  formCode: 'CASCO/F/50',
  version: '01/2026',
  accreditation: {
    name: { en: 'The Egyptian Accreditation Council (EGAC)', ar: 'المجلس المصري للاعتماد (EGAC)' },
    address: {
      en: 'Riad Maadi Tower - Maadi Corniche, Maadi District, 11432 Cairo Egypt',
      ar: 'برج رياض المعادي، كورنيش المعادي، منطقة المعادي، ١١٤٣٢ القاهرة مصر',
    },
  },
}

const MOCK_MARKS: CertificateMark[] = [
  { id: 'mark-iaf', name: 'IAF', imageUrl: '/certificate/iaf.png' },
  { id: 'mark-egac', name: 'EGAC', imageUrl: '/certificate/egac.png' },
  { id: 'mark-casco', name: 'CASCO ISO 9001', imageUrl: '/certificate/casco-seal.png' },
]

const MOCK_PREPARATION_OPTIONS: CertificatePreparation['options'] = {
  templates: [
    { id: 'tpl-controlled', name: 'CASCO controlled template' },
    { id: 'tpl-accredited', name: 'CASCO accredited template' },
  ],
  signatories: [
    {
      id: 'sig-layla',
      name: 'Layla Ibrahim',
      title: { en: 'Certification Manager', ar: 'مدير الشهادات' },
      signatureUrl: '/certificate/signature.png',
    },
    {
      id: 'sig-maha',
      name: 'Dr. Maha Al-Qahtani',
      title: { en: 'Technical Manager', ar: 'المدير الفني' },
      signatureUrl: '/certificate/signature.png',
    },
  ],
  marks: MOCK_MARKS,
}

function buildPreparation(item: CertificateRegisterItem): CertificatePreparation {
  const client = CLIENTS.find((c) => c.code === item.clientId)
  const seed = DATASET_CERTIFICATES.find((c) => c.id === item.id)
  const appNumber = seed?.applicationNumber ?? `APP-${item.certificateNumber.slice(-4)}`
  const app = APPLICATIONS.find((a) => a.orderNumber === appNumber)
  const contact = client ? primaryContact(client) : undefined
  const decision = decisions().find((d) => d.applicationId === appNumber)
  const decisionDate = decision?.record.decisionDate || seed?.decisionDate || new Date().toISOString().slice(0, 10)
  const scopeEn = app?.scope ?? item.scope
  const scopeAr = app?.scopeAr ?? item.scope
  const sites = client
    ? client.sites.filter((s) => !app || app.sitesInScope.includes(s.id)).map((s) => ({ id: s.id, name: s.name, address: s.address, scope: scopeEn }))
    : [{ id: 'SITE-1', name: `${item.clientName} - Main Facility`, address: notSet(), scope: scopeEn }]
  const expiry = new Date(decisionDate)
  expiry.setFullYear(expiry.getFullYear() + 3)
  expiry.setDate(expiry.getDate() - 1)

  return {
    certificateId: item.id,
    certificateNumber: item.certificateNumber,
    status: item.status,
    standard: {
      code: `${item.standard}:${STANDARD_EDITIONS[item.standard] ?? ''}`.replace(/:$/, ''),
      systemNames: SYSTEM_NAMES[item.standard] ?? { en: 'Management System', ar: 'نظام الإدارة' },
    },
    application: {
      number: appNumber,
      clientNumber: item.clientId,
      legalName: item.clientName,
      countryCode: item.countryCode,
      primaryContact: contact ? `${contact.firstName} ${contact.lastName}` : notSet(),
      email: contact?.email ?? notSet(),
    },
    decision: {
      number: decision?.decisionId ?? seed?.decisionNumber ?? `DEC-${appNumber.slice(4)}`,
      date: decisionDate,
      outcome: 'GRANTED',
      approvedScope: scopeEn,
      approvedScopeDescription: decision?.record.confirmedScope || scopeEn,
      sites,
    },
    content: {
      tradeName: { en: client?.tradeName ?? item.clientName, ar: client?.nameAr ?? item.clientName },
      clientName: { en: item.clientName, ar: client?.nameAr ?? item.clientName },
      clientAddress: { en: client?.address ?? '', ar: client?.addressAr ?? '' },
      scope: { en: scopeEn, ar: scopeAr },
      clientLogoUrl: null,
    },
    issuer: MOCK_ISSUER,
    defaults: {
      issueDate: item.status === 'DRAFT' ? new Date().toISOString().slice(0, 10) : item.issuedAt.slice(0, 10),
      effectiveDate: item.status === 'DRAFT' ? new Date().toISOString().slice(0, 10) : item.issuedAt.slice(0, 10),
      expiryDate: item.validUntil ? item.validUntil.slice(0, 10) : expiry.toISOString().slice(0, 10),
      templateId: MOCK_PREPARATION_OPTIONS.templates[0].id,
      language: 'en',
      signatoryId: MOCK_PREPARATION_OPTIONS.signatories[0].id,
      includeQrCode: true,
      markIds: MOCK_MARKS.map((mark) => mark.id),
    },
    options: MOCK_PREPARATION_OPTIONS,
  }
}

/** Returns null when the certificate does not exist (or is not visible to this CAB). */
export async function getCertificatePreparation(certificateId: string): Promise<CertificatePreparation | null> {
  if (!isDemoMode()) {
    try {
      return await authorizedRequest<CertificatePreparation>(`${certificatePath(certificateId)}/preparation`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null
      throw err
    }
  }
  await delay()
  const item = findDemo(certificateId)
  return item ? buildPreparation(item) : null
}

/** Issues a prepared certificate. Only drafts can be issued; rejects otherwise. */
export async function issueCertificate(certificateId: string, payload: IssueCertificatePayload): Promise<void> {
  if (!isDemoMode()) {
    await authorizedRequest<CertificateRegisterItem>(`${certificatePath(certificateId)}/issue`, { method: 'POST', body: JSON.stringify(payload) })
    return
  }
  await delay(600)
  const item = findDemo(certificateId)
  if (!item) throw new Error('Certificate not found.')
  if (item.status !== 'DRAFT') throw new Error('Only draft certificates can be issued.')
  onCertificateIssued(item, payload.issueDate, payload.expiryDate)
}

async function changeStatus(
  certificateId: string,
  action: 'suspend' | 'withdraw',
  reason: string,
): Promise<CertificateRegisterItem> {
  if (!isDemoMode()) {
    return authorizedRequest<CertificateRegisterItem>(`${certificatePath(certificateId)}/${action}`, { method: 'POST', body: JSON.stringify({ reason }) })
  }
  await delay()
  const item = findDemo(certificateId)
  if (!item) throw new Error('Certificate not found.')
  if (action === 'suspend' && item.status !== 'ISSUED') throw new Error('Only an issued certificate can be suspended.')
  if (action === 'withdraw' && item.status !== 'ISSUED' && item.status !== 'SUSPENDED') {
    throw new Error('Only an issued or suspended certificate can be withdrawn.')
  }
  const from = item.status
  item.status = action === 'suspend' ? 'SUSPENDED' : 'WITHDRAWN'
  item.statusReason = reason
  saveCertificates()
  demoEvent(item, { type: item.status, fromStatus: from, toStatus: item.status, reason, previousExpiryDate: null, newExpiryDate: null, relatedCertificateNumber: null })
  return { ...item }
}

/** Suspends an issued certificate (the reason is kept on the record). */
export function suspendCertificate(certificateId: string, reason: string): Promise<CertificateRegisterItem> {
  return changeStatus(certificateId, 'suspend', reason)
}

/** Withdraws an issued or suspended certificate (the reason is kept on the record). */
export function withdrawCertificate(certificateId: string, reason: string): Promise<CertificateRegisterItem> {
  return changeStatus(certificateId, 'withdraw', reason)
}

/* ── Reinstate, reissue, extend, history ──────────────────────────────── */

export type CertificateEventType = 'ISSUED' | 'SUSPENDED' | 'REINSTATED' | 'WITHDRAWN' | 'REISSUED' | 'SUPERSEDED' | 'EXTENDED'

export interface CertificateHistoryEvent {
  id: string
  certificateNumber: string
  type: CertificateEventType
  fromStatus: CertificateStatus | null
  toStatus: CertificateStatus
  reason: string
  previousExpiryDate: string | null
  newExpiryDate: string | null
  relatedCertificateNumber: string | null
  by: string
  at: string
}

export interface CertificateHistory {
  certificateId: string
  certificateNumber: string
  version: number
  versions: Array<{
    id: string
    certificateNumber: string
    version: number
    status: CertificateStatus
    scope: string
    issueDate: string | null
    expiryDate: string | null
    reissueReason: string | null
  }>
  events: CertificateHistoryEvent[]
}

export interface ReissueCertificatePayload {
  reason: string
  /** New scope wording; empty keeps the current one. */
  scope?: string
  /** YYYY-MM-DD; default the current expiry (cannot be later). */
  expiryDate?: string
}

const DEMO_EVENTS_KEY = 'certificateEvents'
const demoEvents = () => loadState<CertificateHistoryEvent[]>(DEMO_EVENTS_KEY, () => [])
const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) })

function demoEvent(cert: CertificateRegisterItem, event: Omit<CertificateHistoryEvent, 'id' | 'certificateNumber' | 'by' | 'at'>) {
  const list = demoEvents()
  list.push({ ...event, id: `ev-${Date.now()}-${list.length}`, certificateNumber: cert.certificateNumber, by: 'CAB Admin', at: new Date().toISOString() })
  saveState(DEMO_EVENTS_KEY, list)
}

/** Reinstates a suspended certificate; the client is notified. */
export async function reinstateCertificate(certificateId: string, reason: string): Promise<CertificateRegisterItem> {
  if (!isDemoMode()) return authorizedRequest<CertificateRegisterItem>(`${certificatePath(certificateId)}/reinstate`, post({ reason }))
  await delay()
  const item = findDemo(certificateId)
  if (!item) throw new Error('Certificate not found.')
  if (item.status !== 'SUSPENDED') throw new Error('Only a suspended certificate can be reinstated.')
  item.status = 'ISSUED'
  item.statusReason = reason
  saveCertificates()
  demoEvent(item, { type: 'REINSTATED', fromStatus: 'SUSPENDED', toStatus: 'ISSUED', reason, previousExpiryDate: null, newExpiryDate: null, relatedCertificateNumber: null })
  demoNotify('client', 'certificate_reinstated', { ref: item.certificateNumber }, '/portal/certificates', item.clientId)
  return { ...item }
}

/** Issues a new version of an issued certificate; the current one becomes SUPERSEDED. */
export async function reissueCertificate(certificateId: string, payload: ReissueCertificatePayload): Promise<CertificateRegisterItem> {
  if (!isDemoMode()) {
    return authorizedRequest<CertificateRegisterItem>(`${certificatePath(certificateId)}/reissue`, post({
      reason: payload.reason,
      ...(payload.scope?.trim() ? { scope: payload.scope.trim() } : {}),
      ...(payload.expiryDate ? { expiryDate: payload.expiryDate } : {}),
    }))
  }
  await delay()
  const item = findDemo(certificateId)
  if (!item) throw new Error('Certificate not found.')
  if (item.status !== 'ISSUED') throw new Error('Only an issued certificate can be reissued.')
  const version = (item.version ?? 1) + 1
  const next: CertificateRegisterItem = {
    ...item,
    id: `${item.id}-r${version}`,
    certificateNumber: `${item.certificateNumber.replace(/-R\d+$/, '')}-R${version}`,
    scope: payload.scope?.trim() || item.scope,
    issuedAt: new Date().toISOString(),
    validUntil: payload.expiryDate ? new Date(`${payload.expiryDate}T00:00:00Z`).toISOString() : item.validUntil,
    version,
    statusReason: payload.reason,
  }
  item.status = 'SUPERSEDED'
  item.statusReason = `Superseded by ${next.certificateNumber}: ${payload.reason}`
  all().unshift(next)
  saveCertificates()
  demoEvent(item, { type: 'SUPERSEDED', fromStatus: 'ISSUED', toStatus: 'SUPERSEDED', reason: payload.reason, previousExpiryDate: null, newExpiryDate: null, relatedCertificateNumber: next.certificateNumber })
  demoEvent(next, { type: 'REISSUED', fromStatus: null, toStatus: 'ISSUED', reason: payload.reason, previousExpiryDate: null, newExpiryDate: next.validUntil?.slice(0, 10) ?? null, relatedCertificateNumber: item.certificateNumber })
  demoNotify('client', 'certificate_issued', { ref: next.certificateNumber }, '/portal/certificates', item.clientId)
  return { ...next }
}

/** Extends the validity of an issued or suspended certificate (at most six months). */
export async function extendCertificate(certificateId: string, expiryDate: string, reason: string): Promise<CertificateRegisterItem> {
  if (!isDemoMode()) return authorizedRequest<CertificateRegisterItem>(`${certificatePath(certificateId)}/extend`, post({ expiryDate, reason }))
  await delay()
  const item = findDemo(certificateId)
  if (!item) throw new Error('Certificate not found.')
  if (item.status !== 'ISSUED' && item.status !== 'SUSPENDED') throw new Error('Only an issued or suspended certificate can be extended.')
  const previous = item.validUntil?.slice(0, 10) ?? null
  if (previous && expiryDate <= previous) throw new Error('The new expiry date must be after the current one.')
  item.validUntil = new Date(`${expiryDate}T00:00:00Z`).toISOString()
  item.statusReason = reason
  saveCertificates()
  demoEvent(item, { type: 'EXTENDED', fromStatus: item.status, toStatus: item.status, reason, previousExpiryDate: previous, newExpiryDate: expiryDate, relatedCertificateNumber: null })
  return { ...item }
}

/** Versions and status events of a certificate. */
export async function getCertificateHistory(certificateId: string): Promise<CertificateHistory> {
  if (!isDemoMode()) return authorizedRequest<CertificateHistory>(`${certificatePath(certificateId)}/history`)
  await delay(150)
  const item = findDemo(certificateId)
  if (!item) throw new Error('Certificate not found.')
  const base = item.certificateNumber.replace(/-R\d+$/, '')
  const versions = all()
    .filter((c) => c.certificateNumber === base || c.certificateNumber.startsWith(`${base}-R`))
    .sort((a, b) => (a.version ?? 1) - (b.version ?? 1))
  const numbers = new Set(versions.map((v) => v.certificateNumber))
  return {
    certificateId: item.id,
    certificateNumber: item.certificateNumber,
    version: item.version ?? 1,
    versions: versions.map((v) => ({
      id: v.id,
      certificateNumber: v.certificateNumber,
      version: v.version ?? 1,
      status: v.status,
      scope: v.scope,
      issueDate: v.status === 'DRAFT' ? null : v.issuedAt.slice(0, 10),
      expiryDate: v.validUntil?.slice(0, 10) ?? null,
      reissueReason: (v.version ?? 1) > 1 ? v.statusReason ?? null : null,
    })),
    events: demoEvents().filter((e) => numbers.has(e.certificateNumber)),
  }
}

