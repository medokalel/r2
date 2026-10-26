/**
 * Mutable demo records built from `dataset.ts`, plus the lifecycle actions that
 * keep them linked (accepting a quotation updates the offer, raises the
 * invoice and drafts the Stage 1 audit plan; granting a decision prepares the
 * certificate; issuing it opens the certification cycle …).
 *
 * Used by the mocked API modules and by the preview mock server, so a change
 * made on one screen shows on every screen that reads the same record.
 */
import { parseDisplayDate } from '@/lib/format/dates'
import type { ApplicationResponse, InformationRequiredItem } from '@/lib/api/certificationApplicationApi'
import type { ApplicationComment, SectionReview, ReviewSectionKey } from '@/lib/api/cabApplicationReviewApi'
import type {
  AuditStandardOption, CabPricingConfig, CreateQuotationPayload, Quotation, QuotationCalculationPayload, QuotationEvent, QuotationPreview,
} from '@/lib/api/cabQuotationApi'
import type { OfferItem, OfferStatus } from '@/lib/api/cabOffersApi'
import type { CabInvoiceItem } from '@/lib/api/cabInvoiceRegisterApi'
import type { AuditPlan, AgendaActivity } from '@/lib/api/cabAuditPlanningApi'
import type { NonconformityItem } from '@/lib/api/cabNonconformitiesApi'
import type { DecisionDetail } from '@/lib/api/cabDecisionsApi'
import type { CertificateRegisterItem } from '@/lib/api/cabCertificatesApi'
import type { CertificationCycle, CertificationCycleDetail } from '@/lib/api/cabCertificationApi'
import type { ContactItem } from '@/lib/api/cabContactsApi'
import type { CompetencePerson } from '@/lib/api/cabCompetenceApi'
import type { CabEmployee } from '@/lib/api/cabEmployeesApi'
import type { AppUser } from '@/lib/api/usersApi'
import type { AppNotification, NotificationAudience } from '@/lib/api/notificationsApi'
import type { OrganizationProfileData } from '@/lib/api/organizationProfileApi'
import type { WalletTransaction } from '@/lib/api/walletApi'
import { loadState, saveState } from '@/lib/api/demo/demoStore'
import { AUDIT_TIME_STANDARDS, AuditTimeError } from '@/lib/auditTime/calculator'
import { draftQuotation, payloadFromInputs } from '@/lib/auditTime/quotationDraft'
import { standardCodesOf } from '@/lib/quotationForm'
import {
  APPLICATIONS, CERTIFICATES, CLIENTS, DEMO_CAB, PEOPLE, PORTAL_CLIENT_ID, QUOTE_BASIS, STANDARDS,
  addDays, client, contactName, fmtDate, fmtDateTime, isoDate, daysFromToday, nowIso, person,
  primaryContact, standardLabel,
  type DemoApplication, type DemoClient, type DemoStage, type DemoStandardCode,
} from '@/lib/api/demo/dataset'
import { notSet, rangeText, splitClause } from '@/lib/emptyValue'

/* ───────────────────────── Applications ───────────────────────── */

export interface AppRecord extends ApplicationResponse {
  id: string
  orderNumber: string
  organizationId: string
  organization: { id: string; name: string; city?: string | null }
  stage: DemoStage
  standard: DemoStandardCode
}

function toAppRecord(a: DemoApplication): AppRecord {
  const c = client(a.clientId)
  const pc = primaryContact(c)
  const std = STANDARDS[a.standard]
  const sites = c.sites.filter((s) => a.sitesInScope.includes(s.id))
  const docs = a.status === 'DRAFT' ? [] : [
    { documentType: 'COMMERCIAL_REGISTER' as const, fileUrl: '/demo-docs/sample.pdf', fileName: `CR-${c.crNumber}.pdf`, originalName: `Commercial Register ${c.tradeName}.pdf`, mimeType: 'application/pdf', fileSize: 412_000, uploadedAt: a.submittedAt },
    { documentType: 'ORGANIZATION_CHART' as const, fileUrl: '/demo-docs/sample.pdf', fileName: 'org-chart.pdf', originalName: `${c.tradeName} Organization Chart.pdf`, mimeType: 'application/pdf', fileSize: 238_000, uploadedAt: a.submittedAt },
    { documentType: 'QUALITY_MANUAL' as const, fileUrl: '/demo-docs/sample.pdf', fileName: 'manual.pdf', originalName: `${std.name} Manual.pdf`, mimeType: 'application/pdf', fileSize: 1_204_000, uploadedAt: a.submittedAt },
    { documentType: 'AUTHORIZATION_LETTER' as const, fileUrl: '/demo-docs/sample.pdf', fileName: 'authorization.pdf', originalName: 'Authorization Letter.pdf', mimeType: 'application/pdf', fileSize: 96_000, uploadedAt: a.submittedAt },
  ]
  return {
    id: a.id,
    orderNumber: a.orderNumber,
    organizationId: c.id,
    organization: { id: c.id, name: c.name, city: c.city },
    status: a.status,
    stage: a.stage,
    standard: a.standard,
    submittedAt: a.submittedAt,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    legalInfo: {
      organizationName: c.name, website: c.website, auditSiteAddress: sites[0]?.address ?? c.address, headOfficeAddress: c.address,
      commercialRegisterNumber: c.crNumber, allProductionLinesIncluded: true, country: c.countryCode, city: c.city, email: pc.email,
      representativeName: contactName(pc), jobTitle: pc.role, organizationNature: c.legalCapacity, mobile: `${pc.phonePrefix} ${pc.phone}`,
      requestType: a.requestType, mainActivity: c.activity,
    },
    operationalInfo: { fieldOfWork: c.industry, economicActivity: c.activity, productsServices: a.scope, annualCapacity: notSet(), technicalSpecifications: `${std.sector} sector, IAF ${std.iafCodes.join(', ')}` },
    consultantInfo: { usedConsultant: false, systemLanguage: c.countryCode === 'EG' ? 'EN' : 'AR', easyAccess: true, usesSubcontractors: false, safetyProcedures: true, designActivity: false, currentSystems: [] },
    declarationInfo: { certificateNameEn: c.name, certificateNameAr: c.nameAr, certificateAddressEn: c.address, certificateAddressAr: c.addressAr, certificateScopeEn: a.scope, certificateScopeAr: a.scopeAr, agreed: a.status !== 'DRAFT' },
    branches: sites.map((s) => ({ sourceBranchId: s.id, branchName: s.name, address: s.address, employees: s.employees, employeesInScope: s.employees, shifts: 2, workingHours: '08:00 to 17:00', productionLines: 2, weeklyHoliday: c.countryCode === 'SA' ? 'Friday' : 'Friday', integratedSystem: false, centralManagement: true, activities: c.activity, products: a.scope })),
    certificates: [{ certificateCode: a.standard, certificateName: standardLabel(a.standard), sectors: [{ sectorName: std.sector, iafCodes: std.iafCodes.map((code) => ({ code, critical: false })) }], answers: [] }],
    documents: docs,
  }
}

export function apps(): AppRecord[] {
  return loadState('applications', () => APPLICATIONS.map(toAppRecord))
}
export function saveApps(): void { saveState('applications', apps()) }

export function findApp(idOrNumber?: string | null): AppRecord | undefined {
  if (!idOrNumber) return undefined
  const needle = idOrNumber.toLowerCase()
  return apps().find((a) => a.id.toLowerCase() === needle || a.orderNumber.toLowerCase() === needle)
}

export function appsOfClient(clientId: string): AppRecord[] {
  return apps().filter((a) => a.organizationId === clientId)
}

let draftSeq = 153
export function createApplicationRecord(clientId: string, payload: Partial<ApplicationResponse> = {}): AppRecord {
  const c = clientRecord(clientId)
  const id = `a9000${draftSeq}-7d1e-4b5a-8c01-000000000${draftSeq}`
  const stdCode = (payload.certificates?.[0]?.certificateCode as DemoStandardCode) || 'ISO 9001'
  const base = toAppRecord({
    id, orderNumber: `APP-0${draftSeq}`, clientId: c.id, standard: STANDARDS[stdCode] ? stdCode : 'ISO 9001', requestType: 'NEW', status: 'DRAFT', stage: 'draft',
    scope: c.activity, scopeAr: c.activity, sitesInScope: c.sites.map((s) => s.id), employeesInScope: c.employees,
    createdAt: nowIso(), submittedAt: null, updatedAt: nowIso(), leadAuditorId: null, teamIds: [],
  })
  draftSeq += 1
  const record: AppRecord = { ...base, ...payload, id: base.id, orderNumber: base.orderNumber, status: 'DRAFT', stage: 'draft', organization: base.organization, organizationId: c.id }
  apps().unshift(record)
  saveApps()
  return record
}

export function updateApplicationDraft(idOrNumber: string, payload: Partial<ApplicationResponse>): AppRecord | undefined {
  const app = findApp(idOrNumber)
  if (!app) return undefined
  Object.assign(app, payload, { updatedAt: nowIso() })
  saveApps()
  return app
}

export function submitApplicationRecord(idOrNumber: string): AppRecord | undefined {
  const app = findApp(idOrNumber)
  if (!app) return undefined
  app.status = 'SUBMITTED'
  app.stage = 'received'
  app.submittedAt = nowIso()
  app.updatedAt = app.submittedAt
  saveApps()
  notify('cab', 'application_received', { ref: app.orderNumber, client: app.organization.name }, `/cab/applications/${app.id}/receipt`)
  return app
}

export function setApplicationStatus(idOrNumber: string, status: AppRecord['status'], stage?: DemoStage): AppRecord | undefined {
  const app = findApp(idOrNumber)
  if (!app) return undefined
  app.status = status
  if (stage) app.stage = stage
  else if (status === 'UNDER_REVIEW') app.stage = app.stage === 'informationRequired' ? 'informationRequired' : 'review'
  else if (status === 'APPROVED') app.stage = 'technicalFeasibility'
  else if (status === 'REJECTED') app.stage = 'rejected'
  app.updatedAt = nowIso()
  saveApps()
  return app
}

/* ───────────────── Review sections, comments, information required ───────────────── */

const SECTIONS: ReviewSectionKey[] = ['legalInfo', 'operationalInfo', 'consultantInfo', 'declarationInfo', 'branches', 'certificates', 'documents']

interface ReviewState {
  sections: Record<string, Partial<Record<ReviewSectionKey, string>>>
  comments: Record<string, ApplicationComment[]>
  ir: Record<string, InformationRequiredItem[]>
}

const reviewer = person('emp-0006')
const reviewerRef = { id: reviewer.userId, fullName: reviewer.name }

function seedReviews(): ReviewState {
  const state: ReviewState = { sections: {}, comments: {}, ir: {} }
  for (const a of APPLICATIONS) {
    const done = ['APPROVED', 'QUOTATION_CREATED', 'QUOTATION_ISSUED', 'QUOTATION_ACCEPTED'].includes(a.status)
    if (done) state.sections[a.id] = Object.fromEntries(SECTIONS.map((k) => [k, 'COMPLETED']))
    if (a.orderNumber === 'APP-0148') {
      state.sections[a.id] = { legalInfo: 'COMPLETED', operationalInfo: 'COMPLETED', consultantInfo: 'COMPLETED', declarationInfo: 'COMPLETED', branches: 'PARTIALLY_COMPLETED', certificates: 'COMPLETED', documents: 'PARTIALLY_COMPLETED' }
      state.comments[a.id] = [
        { id: 'cm-0148-1', sectionKey: 'branches', content: '[status:partiallyComplete] Please confirm the number of shifts and the headcount per shift at the Al Sulay mill.', isInternal: true, createdBy: reviewerRef, createdAt: '2026-10-07T10:20:00Z', updatedAt: '2026-10-07T10:20:00Z' },
        { id: 'cm-0148-2', sectionKey: 'documents', content: '[status:partiallyComplete] The organization chart is missing. Please upload the current approved version.', isInternal: true, createdBy: reviewerRef, createdAt: '2026-10-07T10:24:00Z', updatedAt: '2026-10-07T10:24:00Z' },
      ]
      state.ir[a.id] = [
        { id: 'ir-0148-1', applicationId: a.id, informationItem: 'Please confirm the number of shifts and the headcount per shift at the Al Sulay mill.', referenceClause: 'branches', requestedBy: reviewerRef, requestedOn: '2026-10-07T10:20:00Z', dueDate: '2026-10-14T10:20:00Z', priority: 'MEDIUM', status: 'SUBMITTED',
          responses: [{ id: 'rs-0148-1', response: 'Two shifts (06:00 to 14:00 and 14:00 to 22:00) with 55 and 45 staff respectively; maintenance runs on Saturdays.', submittedBy: { id: 'cnt-0801', fullName: 'Abdullah Kareem' }, submittedOn: '2026-10-12T08:45:00Z', status: 'SUBMITTED', attachments: [] }] },
        { id: 'ir-0148-2', applicationId: a.id, informationItem: 'The organization chart is missing. Please upload the current approved version.', referenceClause: 'documents', requestedBy: reviewerRef, requestedOn: '2026-10-07T10:24:00Z', dueDate: '2026-10-28T10:24:00Z', priority: 'HIGH', status: 'PENDING', responses: [] },
        { id: 'ir-0148-3', applicationId: a.id, informationItem: 'Provide the latest internal audit report and management review minutes.', referenceClause: 'ISO 9001 §9.2 / §9.3', requestedBy: reviewerRef, requestedOn: '2026-10-14T16:30:00Z', dueDate: '2026-10-30T00:00:00Z', priority: 'LOW', status: 'PENDING', responses: [] },
      ]
    }
    if (done) {
      state.comments[a.id] = [{ id: `cm-${a.orderNumber}-ok`, sectionKey: null, content: 'All application sections verified against the submitted documents. Ready for technical feasibility.', isInternal: true, createdBy: reviewerRef, createdAt: a.submittedAt ?? a.createdAt, updatedAt: a.submittedAt ?? a.createdAt }]
    }
  }
  return state
}

export function reviews(): ReviewState { return loadState('reviews', seedReviews) }
function saveReviews() { saveState('reviews', reviews()) }

export function reviewMetadata(appId: string) {
  const app = findApp(appId)
  const id = app?.id ?? appId
  const sections = reviews().sections[id] ?? {}
  const sectionReviewsByKey: Partial<Record<ReviewSectionKey, SectionReview | null>> = {}
  for (const key of SECTIONS) {
    const status = sections[key]
    sectionReviewsByKey[key] = status ? { applicationId: id, sectionKey: key, status, reviewStatus: status, reviewedBy: reviewer.name, reviewedAt: app?.updatedAt ?? null } : null
  }
  return { applicationId: id, status: app?.status, sectionReviewsByKey, comments: reviews().comments[id] ?? [], sectionReviews: Object.values(sectionReviewsByKey).filter(Boolean) }
}

export function setSectionReview(appId: string, key: ReviewSectionKey, status: string): SectionReview {
  const id = findApp(appId)?.id ?? appId
  const state = reviews()
  state.sections[id] = { ...(state.sections[id] ?? {}), [key]: status }
  const app = findApp(id)
  if (app && status === 'PARTIALLY_COMPLETED' && app.stage !== 'informationRequired') {
    app.stage = 'informationRequired'
    saveApps()
    notify('client', 'information_requested', { ref: app.orderNumber }, '/portal/applications', app.organizationId)
  }
  saveReviews()
  return { applicationId: id, sectionKey: key, status, reviewStatus: status, reviewedBy: reviewer.name, reviewedAt: nowIso() }
}

export function addComment(appId: string, body: { sectionKey?: string | null; content?: string; isInternal?: boolean }): ApplicationComment {
  const id = findApp(appId)?.id ?? appId
  const state = reviews()
  const comment: ApplicationComment = {
    id: `cm-${Date.now()}`, sectionKey: (body.sectionKey as ReviewSectionKey) ?? null, content: body.content ?? '', isInternal: body.isInternal ?? true,
    createdBy: { id: DEMO_CAB.admin.id, fullName: DEMO_CAB.admin.name }, createdAt: nowIso(), updatedAt: nowIso(),
  }
  state.comments[id] = [...(state.comments[id] ?? []), comment]
  saveReviews()
  return comment
}

export function informationRequired(appId: string): InformationRequiredItem[] {
  const id = findApp(appId)?.id ?? appId
  return reviews().ir[id] ?? []
}

export function addInformationRequired(appId: string, body: { informationItem: string; referenceClause?: string; dueDate?: string; priority?: string }): InformationRequiredItem {
  const app = findApp(appId)
  const id = app?.id ?? appId
  const item: InformationRequiredItem = {
    id: `ir-${Date.now()}`, applicationId: id, informationItem: body.informationItem, referenceClause: body.referenceClause ?? null,
    requestedBy: { id: DEMO_CAB.admin.id, fullName: DEMO_CAB.admin.name }, requestedOn: nowIso(), dueDate: body.dueDate ?? addDays(nowIso(), 7),
    priority: body.priority ?? 'MEDIUM', status: 'PENDING', responses: [],
  }
  const state = reviews()
  state.ir[id] = [...(state.ir[id] ?? []), item]
  saveReviews()
  if (app) {
    app.stage = 'informationRequired'
    if (app.status === 'SUBMITTED') app.status = 'UNDER_REVIEW'
    saveApps()
    notify('client', 'information_requested', { ref: app.orderNumber }, '/portal/applications', app.organizationId)
  }
  return item
}

export function respondInformationRequired(appId: string, irId: string, body: { response?: string | null; attachments?: Array<{ fileUrl: string; fileName?: string | null; originalName?: string | null }> }) {
  const app = findApp(appId)
  const id = app?.id ?? appId
  const item = (reviews().ir[id] ?? []).find((x) => x.id === irId)
  if (!item) return null
  const c = app ? client(app.organizationId) : undefined
  const pc = c ? primaryContact(c) : undefined
  const response = {
    id: `rs-${Date.now()}`, response: body.response ?? null, submittedBy: { id: pc?.id ?? 'client', fullName: pc ? contactName(pc) : 'Client' },
    submittedOn: nowIso(), status: 'SUBMITTED', attachments: (body.attachments ?? []).map((a, i) => ({ id: `att-${Date.now()}-${i}`, fileUrl: a.fileUrl, fileName: a.fileName ?? null, originalName: a.originalName ?? null })),
  }
  item.responses.push(response)
  item.status = 'SUBMITTED'
  saveReviews()
  if (app) notify('cab', 'information_responded', { ref: app.orderNumber, client: app.organization.name }, `/cab/applications/${app.id}/information-required`)
  return response
}

/* ───────────────────────── Quotations ───────────────────────── */

const PRICING: CabPricingConfig[] = [
  { id: 'pc-default', standardId: null, dailyRate: '3000.00', taxRate: '0.1500', currency: 'SAR', isDefault: true, isActive: true, standard: null },
]
export function pricingConfigs(): CabPricingConfig[] { return loadState('pricing', () => PRICING.map((p) => ({ ...p }))) }
export function savePricing() { saveState('pricing', pricingConfigs()) }

const AUDIT_STANDARD_NAMES: Record<string, string> = {
  ISO_9001: 'ISO 9001:2015', ISO_14001: 'ISO 14001:2015', ISO_45001: 'ISO 45001:2018', ISO_13485: 'ISO 13485:2016',
  ISO_27001: 'ISO/IEC 27001:2022', ISO_50001: 'ISO 50001:2018', ISO_22000: 'ISO 22000:2018',
}
/** Demo copy of GET /audit-engine/standards. */
export function auditStandardsDemo(): AuditStandardOption[] {
  return Object.entries(AUDIT_TIME_STANDARDS).map(([code, def]) => ({ id: `std-${code}`, code, name: AUDIT_STANDARD_NAMES[code] ?? code, complexityRequired: Boolean(def.complexities) }))
}

/** One active global rate stays the default currency (the oldest). */
function ensureDefaultPricing(list: CabPricingConfig[]) {
  const globals = list.filter((p) => p.isActive && p.standardId === null)
  if (globals.length && !globals.some((p) => p.isDefault)) globals[0].isDefault = true
}

/** Demo copy of POST /cab/pricing-config: upsert by (standard, currency); isDefault moves the default currency. */
export function upsertPricingRecord(payload: { dailyRate: number; currency: string; taxRate?: number; standardId?: string | null; isDefault?: boolean }): CabPricingConfig | null {
  const list = pricingConfigs()
  const standardId = payload.standardId ?? null
  const standard = standardId ? auditStandardsDemo().find((s) => s.id === standardId) : null
  if (standardId && !standard) return null
  if (payload.isDefault && !standardId) list.forEach((p) => { p.isDefault = false })
  let row = list.find((p) => p.standardId === standardId && p.currency === payload.currency)
  if (!row) {
    row = { id: `pc-${Date.now()}-${list.length}`, standardId, standard: standard ? { id: standard.id, code: standard.code, name: standard.name } : null, currency: payload.currency, dailyRate: '0.00', taxRate: '0.0000', isDefault: false, isActive: true }
    list.push(row)
  }
  row.dailyRate = Number(payload.dailyRate).toFixed(2)
  row.taxRate = Number(payload.taxRate ?? 0).toFixed(4)
  row.isActive = true
  if (payload.isDefault !== undefined && !standardId) row.isDefault = payload.isDefault
  ensureDefaultPricing(list)
  savePricing()
  return row
}

/** Demo copy of DELETE /cab/pricing-config/:id. */
export function deactivatePricingRecord(id: string): boolean {
  const list = pricingConfigs()
  const row = list.find((p) => p.id === id)
  if (!row) return false
  row.isActive = false
  row.isDefault = false
  ensureDefaultPricing(list)
  savePricing()
  return true
}

function buildQuotation(app: AppRecord, status: Quotation['status'], createdAt: string): Quotation {
  const c = client(app.organizationId)
  const basis = QUOTE_BASIS[app.orderNumber] ?? { stage1Days: 1.5, stage2Days: 3, survDays: 2, dailyRate: 3000, travel: 1500 }
  // One block per standard: initial (Stage 1 + Stage 2) or recertification for a renewal,
  // surveillance 1 and 2, then recertification at the end of the 3-year cycle.
  const half = (n: number) => Math.round(n * 2) / 2
  let seq = 0
  const ev = (code: string, type: QuotationEvent['auditEventType'], days: number): QuotationEvent => ({
    id: `${app.orderNumber}-${code.replace(/[^A-Za-z0-9]+/g, '')}-${type}`, standardCode: code, auditEventType: type, sequenceOrder: ++seq, auditDays: days.toFixed(1),
    dailyRate: basis.dailyRate.toFixed(2), auditFee: (days * basis.dailyRate).toFixed(2), manualOverride: false, policyVerificationStatus: 'VERIFIED',
  })
  const blocks = [{ code: app.standard as string, stage1Days: basis.stage1Days, stage2Days: basis.stage2Days, survDays: basis.survDays }, ...(basis.extraStandards ?? [])]
  const events = blocks.flatMap((b) =>
    b.stage1Days > 0
      ? [ev(b.code, 'STAGE_1', b.stage1Days), ev(b.code, 'STAGE_2', b.stage2Days), ev(b.code, 'SURVEILLANCE_1', b.survDays), ev(b.code, 'SURVEILLANCE_2', b.survDays), ev(b.code, 'RECERTIFICATION', half(((b.stage1Days + b.stage2Days) * 2) / 3))]
      : [ev(b.code, 'RECERTIFICATION', b.stage2Days), ev(b.code, 'SURVEILLANCE_1', b.survDays), ev(b.code, 'SURVEILLANCE_2', b.survDays)],
  )
  const initialDays = events.filter((e) => e.auditEventType === 'STAGE_1' || e.auditEventType === 'STAGE_2').reduce((sum, e) => sum + Number(e.auditDays), 0)
  const totalDays = events.reduce((s, e) => s + Number(e.auditDays), 0)
  const totalFee = totalDays * basis.dailyRate
  const extras = [{ name: 'Certificate issuance & registration', cost: 1200 }]
  const extrasTotal = extras.reduce((s, x) => s + x.cost, 0)
  const taxRate = c.countryCode === 'SA' ? 0.15 : 0.14
  const net = totalFee + basis.travel + extrasTotal
  const tax = net * taxRate
  return {
    id: `q-${app.orderNumber.toLowerCase()}`, applicationId: app.id, quotationNumber: `QT-${app.orderNumber.slice(4)}`, status, cabName: DEMO_CAB.name,
    standardCodesUsed: blocks.map((b) => b.code), employeeCountUsed: (app.branches ?? []).reduce((s, b) => s + (b.employeesInScope ?? 0), 0) || c.employees,
    currency: c.currency, dailyRate: basis.dailyRate.toFixed(2), initialAuditDays: initialDays.toFixed(1), initialAuditFee: (initialDays * basis.dailyRate).toFixed(2),
    totalAuditDays: totalDays.toFixed(1), totalAuditFee: totalFee.toFixed(2), travelExpenses: basis.travel.toFixed(2), additionalItems: extras,
    additionalItemsTotal: extrasTotal.toFixed(2), startDate: isoDate(createdAt), offerEndDate: isoDate(addDays(createdAt, 30)), taxRate: taxRate.toFixed(4),
    taxAmount: tax.toFixed(2), totalAmount: (net + tax).toFixed(2), isProvisional: false, provisionalDisclaimer: null, events, createdAt, updatedAt: createdAt,
  }
}

const QUOTE_SEED: Array<[string, Quotation['status'], string]> = [
  ['APP-0141', 'ACCEPTED', '2026-03-16T09:00:00Z'],
  ['APP-0142', 'ACCEPTED', '2026-05-20T09:00:00Z'],
  ['APP-0143', 'ACCEPTED', '2026-04-28T09:00:00Z'],
  ['APP-0144', 'ACCEPTED', '2026-07-25T09:00:00Z'],
  ['APP-0145', 'ISSUED', '2026-10-12T14:00:00Z'],
  ['APP-0146', 'CREATED', '2026-10-19T11:00:00Z'],
]

export function quotations(): Quotation[] {
  return loadState('quotations.v2', () => QUOTE_SEED.map(([no, status, at]) => buildQuotation(toAppRecord(APPLICATIONS.find((a) => a.orderNumber === no)!), status, at)))
}
function saveQuotations() { saveState('quotations.v2', quotations()) }

export function findQuotation(id: string): Quotation | undefined {
  return quotations().find((q) => q.id === id || q.quotationNumber === id)
}

/** Days and prices of a quotation for the application, from the shared audit-time calculator. */
function draftFor(app: AppRecord, payload: QuotationCalculationPayload) {
  return draftQuotation({
    standards: standardCodesOf(app),
    branches: app.branches ?? [],
    certificates: app.certificates ?? [],
    actor: { name: 'CAB Admin', role: 'CAB_ADMIN' },
    fallbackEmployees: client(app.organizationId).employees,
    requestType: (app.legalInfo as { requestType?: string } | undefined)?.requestType ?? null,
    payload,
    pricing: pricingConfigs(),
  })
}

/** Demo copy of POST /cab/certification-applications/:id/quotation/preview. */
export function previewQuotationFor(appId: string, payload: QuotationCalculationPayload): QuotationPreview | null {
  const app = findApp(appId)
  if (!app) return null
  const d = draftFor(app, payload)
  return {
    applicationId: app.id, currency: d.currency, taxRate: d.taxRate.toFixed(4), employeeCount: d.employees, standards: d.perStandard,
    totalAuditDays: d.totalDays.toFixed(2), totalAuditFee: d.totalFee.toFixed(2), warnings: d.warnings, calculation: { inputs: d.inputs, breakdown: d.breakdown },
  }
}

/** Demo copy of POST /cab/certification-applications/:id/quotation. */
export function createQuotationFor(appId: string, payload: Partial<CreateQuotationPayload>): Quotation | null {
  const app = findApp(appId)
  if (!app) return null
  const d = draftFor(app, payload)
  const q = buildQuotation(app, 'CREATED', nowIso())
  q.id = `q-${app.orderNumber.toLowerCase()}-${Date.now()}`
  q.events = d.events.map((e, index): QuotationEvent => ({
    id: `${q.id}-${e.standardCode}-${e.auditEventType}`, standardCode: e.standardCode, auditEventType: e.auditEventType, sequenceOrder: index + 1,
    auditDays: e.days.toFixed(1), dailyRate: e.dailyRate.toFixed(2), auditFee: e.fee.toFixed(2), manualOverride: false, policyVerificationStatus: 'VERIFIED',
    calculatedDays: e.days.toFixed(1), overrideReason: null, overriddenAt: null,
  }))
  q.cycleType = d.inputs.cycleType
  q.standardCodesUsed = d.breakdown.standards.map((s) => s.standardCode)
  q.employeeCountUsed = d.employees
  q.currency = d.currency
  q.dailyRate = d.perStandard[0].dailyRate
  q.taxRate = d.taxRate.toFixed(4)
  q.travelExpenses = Number(payload.travelExpenses ?? 0).toFixed(2)
  q.additionalItems = payload.additionalItems ?? []
  q.offerEndDate = payload.offerEndDate ?? null
  q.isProvisional = false
  q.provisionalDisclaimer = null
  q.calculation = { inputs: d.inputs, breakdown: d.breakdown }
  q.dayOverrides = []
  q.classificationOverrides = d.classificationRecords.map((r, index) => ({ id: `${q.id}-class-${index + 1}`, ...r, createdAt: nowIso() }))
  recomputeQuotation(q)
  quotations().unshift(q)
  saveQuotations()
  setApplicationStatus(app.id, 'QUOTATION_CREATED', 'quotation')
  upsertOfferFromQuotation(q, 'pending_approval')
  notify('cab', 'quotation_pending_approval', { ref: app.orderNumber, discount: '0%' }, `/cab/applications/${app.id}/quotation`)
  return q
}

/**
 * Demo copy of POST /cab/quotations/:id/recalculate: the current application data, the stored
 * inputs (replaced by the ones sent) and a recalculation entry with the totals before and after.
 */
export function recalculateQuotationFor(id: string, payload: QuotationCalculationPayload & { reason: string }): Quotation | null {
  const q = findQuotation(id)
  const app = q ? findApp(q.applicationId) : undefined
  if (!q || !app) return null
  if (q.status !== 'CREATED' && q.status !== 'DRAFT') {
    throw new AuditTimeError('QUOTATION_LOCKED', `QUOTATION_LOCKED: a ${q.status.toLowerCase()} quotation cannot be recalculated. Cancel it and create a revised quotation instead.`)
  }
  const { reason, ...inputs } = payload
  const d = draftFor(app, { ...payloadFromInputs(q.calculation?.inputs), ...inputs })
  const before = { days: q.totalAuditDays, fee: q.totalAuditFee, amount: q.totalAmount }
  const reset = q.events.filter((e) => e.manualOverride).length
  q.events = d.events.map((e, index): QuotationEvent => ({
    id: q.events.find((x) => x.standardCode === e.standardCode && x.auditEventType === e.auditEventType)?.id ?? `${q.id}-${e.standardCode}-${e.auditEventType}`,
    standardCode: e.standardCode, auditEventType: e.auditEventType, sequenceOrder: index + 1, auditDays: e.days.toFixed(1), dailyRate: e.dailyRate.toFixed(2),
    auditFee: e.fee.toFixed(2), manualOverride: false, policyVerificationStatus: 'VERIFIED', calculatedDays: e.days.toFixed(1), overrideReason: null, overriddenAt: null,
  }))
  q.cycleType = d.inputs.cycleType
  q.standardCodesUsed = d.breakdown.standards.map((s) => s.standardCode)
  q.employeeCountUsed = d.employees
  q.calculation = { inputs: d.inputs, breakdown: d.breakdown }
  q.classificationOverrides = [...(q.classificationOverrides ?? []), ...d.classificationRecords.map((r, index) => ({ id: `${q.id}-class-r${Date.now()}-${index}`, ...r, createdAt: nowIso() }))]
  recomputeQuotation(q)
  q.recalculations = [{
    id: `${q.id}-recalc-${Date.now()}`, reason: reason.trim(), beforeTotalAuditDays: before.days, afterTotalAuditDays: q.totalAuditDays,
    beforeTotalAuditFee: before.fee, afterTotalAuditFee: q.totalAuditFee, beforeTotalAmount: before.amount, afterTotalAmount: q.totalAmount,
    manualOverridesReset: reset, approvalStatusBefore: null, changedByName: 'CAB Admin', createdAt: nowIso(),
  }, ...(q.recalculations ?? [])]
  saveQuotations()
  upsertOfferFromQuotation(q)
  return q
}

export function recomputeQuotation(q: Quotation): void {
  const extras = q.additionalItems.reduce((s, x) => s + Number(x.cost || 0), 0)
  const fee = q.events.reduce((s, e) => s + Number(e.auditFee), 0)
  const initial = q.events.filter((e) => e.auditEventType === 'STAGE_1' || e.auditEventType === 'STAGE_2')
  q.initialAuditDays = initial.reduce((s, e) => s + Number(e.auditDays), 0).toFixed(1)
  q.initialAuditFee = initial.reduce((s, e) => s + Number(e.auditFee), 0).toFixed(2)
  q.totalAuditDays = q.events.reduce((s, e) => s + Number(e.auditDays), 0).toFixed(1)
  q.totalAuditFee = fee.toFixed(2)
  q.additionalItemsTotal = extras.toFixed(2)
  const net = fee + Number(q.travelExpenses) + extras
  q.taxAmount = (net * Number(q.taxRate)).toFixed(2)
  q.totalAmount = (net + Number(q.taxAmount)).toFixed(2)
  q.updatedAt = nowIso()
}

export function updateQuotationRecord(id: string, patch: { travelExpenses?: number; taxRate?: number; additionalItems?: Array<{ name: string; cost: number }>; offerEndDate?: string | null }): Quotation | null {
  const q = findQuotation(id)
  if (!q) return null
  if (patch.travelExpenses !== undefined) q.travelExpenses = Number(patch.travelExpenses).toFixed(2)
  if (patch.taxRate !== undefined) q.taxRate = Number(patch.taxRate).toFixed(4)
  if (patch.additionalItems) q.additionalItems = patch.additionalItems
  if (patch.offerEndDate !== undefined) q.offerEndDate = patch.offerEndDate
  recomputeQuotation(q)
  saveQuotations()
  upsertOfferFromQuotation(q)
  return q
}

/**
 * Demo copy of PATCH /cab/quotations/:id/events/:eventId: `days` null resets to the calculated
 * days. Every change is logged in `dayOverrides`.
 */
export function overrideQuotationEvent(id: string, eventId: string, days: number | null, reason?: string): Quotation | null {
  const q = findQuotation(id)
  const ev = q?.events.find((e) => e.id === eventId)
  if (!q || !ev) return null
  if (q.status !== 'CREATED' && q.status !== 'DRAFT') throw new AuditTimeError('QUOTATION_LOCKED', 'Only CREATED quotation events can be overridden.')
  const calculated = ev.calculatedDays != null ? Number(ev.calculatedDays) : null
  if (days === null && calculated === null) {
    throw new AuditTimeError('NOTHING_TO_RESET', 'This event has no calculated days to reset to (quotation created before the audit-time engine).')
  }
  const fromDays = Number(ev.auditDays)
  const toDays = days === null ? (calculated as number) : days
  const note = reason?.trim() || (days === null ? 'Reset to the calculated days' : 'Manual override')
  ev.auditDays = toDays.toFixed(1)
  ev.auditFee = (toDays * Number(ev.dailyRate)).toFixed(2)
  ev.manualOverride = calculated === null || toDays !== calculated
  ev.overrideReason = ev.manualOverride ? note : null
  ev.overriddenAt = ev.manualOverride ? nowIso() : null
  q.dayOverrides = [
    {
      id: `ovr-${Date.now()}`, eventId, standardCode: ev.standardCode, auditEventType: ev.auditEventType, fromDays: fromDays.toFixed(1), toDays: toDays.toFixed(1),
      calculatedDays: calculated === null ? null : calculated.toFixed(1), reason: note, changedByName: DEMO_CAB.admin.name, createdAt: nowIso(),
    },
    ...(q.dayOverrides ?? []),
  ]
  recomputeQuotation(q)
  saveQuotations()
  upsertOfferFromQuotation(q)
  return q
}

/** issue / accept / reject / cancel — and every linked record that follows. */
export function transitionQuotationRecord(id: string, action: 'issue' | 'accept' | 'reject' | 'cancel'): Quotation | null {
  const q = findQuotation(id)
  if (!q) return null
  const app = findApp(q.applicationId)
  const map = { issue: 'ISSUED', accept: 'ACCEPTED', reject: 'REJECTED', cancel: 'CANCELLED' } as const
  q.status = map[action]
  q.updatedAt = nowIso()
  saveQuotations()
  if (!app) return q
  if (action === 'issue') {
    setApplicationStatus(app.id, 'QUOTATION_ISSUED', 'offer')
    upsertOfferFromQuotation(q, 'issued', 'Issued to client')
    notify('client', 'offer_awaiting_acceptance', { ref: offerNumberFor(app.orderNumber) }, '/portal/offers', app.organizationId)
  } else if (action === 'accept') {
    setApplicationStatus(app.id, 'QUOTATION_ACCEPTED', 'auditPlanning')
    upsertOfferFromQuotation(q, 'issued', 'Accepted by client')
    raiseInvoiceForQuotation(q)
    draftStage1Plan(app)
  } else if (action === 'reject') {
    setApplicationStatus(app.id, 'QUOTATION_REJECTED', 'offer')
    upsertOfferFromQuotation(q, 'rejected', 'Rejected by client')
  } else {
    setApplicationStatus(app.id, 'APPROVED', 'quotation')
    upsertOfferFromQuotation(q, 'void', 'Quotation cancelled')
  }
  return q
}

/* ───────────────────────── Offers ───────────────────────── */

const OFFER_LABEL: Record<OfferStatus, string> = { draft: 'Draft', pending_approval: 'Pending approval', approved: 'Approved', issued: 'Issued', rejected: 'Rejected', void: 'Void' }
export const offerStatusLabel = (s: OfferStatus) => OFFER_LABEL[s]
export const offerNumberFor = (appNumber: string) => `OF-${appNumber.slice(4)}`

function offerFromQuotation(q: Quotation, status: OfferStatus, history: OfferItem['history'] = []): OfferItem {
  const app = findApp(q.applicationId) ?? toAppRecord(APPLICATIONS.find((a) => a.id === q.applicationId)!)
  const c = client(app.organizationId)
  const pc = primaryContact(c)
  return {
    id: offerNumberFor(app.orderNumber).toLowerCase(), offerNumber: offerNumberFor(app.orderNumber), clientName: c.name, clientCode: c.code, country: c.country,
    primaryContact: contactName(pc), contactEmail: pc.email, relatedApplication: app.orderNumber, applicationStandard: standardLabel(app.standard),
    applicationScope: app.declarationInfo?.certificateScopeEn ?? '', currency: q.currency, validUntil: q.offerEndDate ?? isoDate(addDays(q.createdAt, 30)),
    paymentTerms: '50% on acceptance, 50% before the Stage 2 audit', notes: `Three-year certification cycle (${q.totalAuditDays} audit days) per ${q.quotationNumber}.`,
    fees: [
      ...q.events.map((e) => ({ id: e.id, description: `${e.auditEventType.replace('_', ' ').toLowerCase().replace(/^\w/, (m) => m.toUpperCase())} audit (${e.auditDays} days)`, amount: Number(e.auditFee) })),
      ...q.additionalItems.map((x, i) => ({ id: `x${i}`, description: x.name, amount: x.cost })),
    ],
    travelCosts: Number(q.travelExpenses) > 0 ? 'Reimbursed' : 'Included', optionalDiscount: 0, termsAttachmentName: `${DEMO_CAB.name}_Certification_Agreement.pdf`,
    approvalRoute: 'Commercial Approval', status, statusLabel: OFFER_LABEL[status], createdAt: isoDate(q.createdAt), history,
  }
}

function seedOffers(): OfferItem[] {
  const hist = (q: Quotation, accepted: boolean): OfferItem['history'] => [
    { action: 'Created from quotation', by: person('emp-0006').name, date: fmtDate(q.createdAt) },
    { action: 'Approved', by: person('emp-0005').name, date: fmtDate(addDays(q.createdAt, 1)) },
    { action: 'Issued to client', by: DEMO_CAB.admin.name, date: fmtDate(addDays(q.createdAt, 1)) },
    ...(accepted ? [{ action: 'Accepted by client', by: contactName(primaryContact(client(findAppSeed(q.applicationId).clientId))), date: fmtDate(addDays(q.createdAt, 4)) }] : []),
  ]
  return quotations().map((q) => {
    const status: OfferStatus = q.status === 'CREATED' ? 'pending_approval' : q.status === 'REJECTED' ? 'rejected' : q.status === 'CANCELLED' ? 'void' : 'issued'
    return offerFromQuotation(q, status, q.status === 'CREATED' ? [{ action: 'Created from quotation', by: person('emp-0006').name, date: fmtDate(q.createdAt) }] : hist(q, q.status === 'ACCEPTED'))
  })
}
const findAppSeed = (id: string) => APPLICATIONS.find((a) => a.id === id)!

export function offers(): OfferItem[] { return loadState('offers', seedOffers) }
export function saveOffers() { saveState('offers', offers()) }

function upsertOfferFromQuotation(q: Quotation, status?: OfferStatus, action?: string): void {
  const list = offers()
  const app = findApp(q.applicationId)
  if (!app) return
  const idx = list.findIndex((o) => o.relatedApplication === app.orderNumber)
  const prev = idx >= 0 ? list[idx] : undefined
  const next = offerFromQuotation(q, status ?? prev?.status ?? 'draft', prev?.history ?? [])
  if (action) next.history = [...(next.history ?? []), { action, by: action.includes('client') ? contactName(primaryContact(client(app.organizationId))) : DEMO_CAB.admin.name, date: fmtDate(nowIso()) }]
  if (idx >= 0) list[idx] = next
  else list.unshift(next)
  saveOffers()
}

/* ───────────────────────── Invoices ───────────────────────── */

function invoiceFor(params: {
  number: string; appNumber: string; issued: string; dueInDays: number; items: Array<{ name: string; description: string; amount: number }>;
  status: CabInvoiceItem['status']; paid: number; payments?: CabInvoiceItem['payments']
}): CabInvoiceItem {
  const app = APPLICATIONS.find((a) => a.orderNumber === params.appNumber)!
  const c = client(app.clientId)
  const pc = primaryContact(c)
  const taxPct = c.countryCode === 'SA' ? 15 : 14
  const net = params.items.reduce((s, i) => s + i.amount, 0)
  const amount = Math.round(net * (1 + taxPct / 100) * 100) / 100
  const paid = params.status === 'Paid' ? amount : params.paid
  return {
    id: params.number.toLowerCase(), invoiceNumber: params.number, clientName: c.name, clientCode: c.code, country: c.country,
    issuedDate: fmtDate(params.issued), dueDate: fmtDate(addDays(params.issued, params.dueInDays)), currency: c.currency, amount, paidAmount: paid,
    balance: Math.max(0, Math.round((amount - paid) * 100) / 100), status: params.status, organizationId: c.id, siteId: c.sites[0].id, contactId: pc.id,
    documentIds: [`doc-${offerNumberFor(params.appNumber)}`], relatedOrder: offerNumberFor(params.appNumber), orderStatus: 'Accepted', relatedApplication: params.appNumber,
    poReference: `PO-${c.code.slice(-3)}${params.number.slice(-3)}`, primaryContact: contactName(pc), contactEmail: pc.email,
    billingAddress: { name: c.name, line1: c.address.split(',')[0], cityArea: c.city, country: c.country },
    taxRate: { id: `vat-${c.countryCode.toLowerCase()}`, label: `VAT ${taxPct}%`, percentage: taxPct },
    items: params.items.map((i, n) => ({ id: String(n + 1), name: i.name, description: i.description, qty: 1, unitPrice: i.amount, amount: i.amount })),
    installments: [], attachments: [],
    payments: params.payments ?? (paid > 0 ? [{ id: `pay-${params.number}`, amount: paid, date: fmtDate(addDays(params.issued, 9)), method: 'Bank transfer', reference: `TRX-${params.number.slice(-4)}` }] : []),
  }
}

function seedInvoices(): CabInvoiceItem[] {
  return [
    invoiceFor({ number: 'INV-2026-0410', appNumber: 'APP-0144', issued: '2026-10-15T09:00:00Z', dueInDays: 30, status: 'Draft', paid: 0, items: [{ name: 'Stage 1 audit', description: 'ISO 45001 Stage 1 audit, 2 days (APP-0144)', amount: 6000 }, { name: 'Application fee', description: 'Application review and registration', amount: 1200 }] }),
    invoiceFor({ number: 'INV-2026-0405', appNumber: 'APP-0142', issued: '2026-09-28T09:00:00Z', dueInDays: 30, status: 'Partially paid', paid: 6000, items: [{ name: 'Stage 2 audit', description: 'ISO 14001 Stage 2 audit, 3 days (APP-0142)', amount: 9000 }, { name: 'Travel & accommodation', description: 'Riyadh and Dammam sites', amount: 2200 }] }),
    invoiceFor({ number: 'INV-2026-0402', appNumber: 'APP-0141', issued: '2026-10-20T09:00:00Z', dueInDays: 30, status: 'Issued', paid: 0, items: [{ name: 'Surveillance 1 (advance)', description: 'ISO 22000 surveillance audit 1 advance (APP-0141)', amount: 3200 }] }),
    invoiceFor({ number: 'INV-2026-0395', appNumber: 'APP-0146', issued: '2026-09-12T09:00:00Z', dueInDays: 15, status: 'Paid', paid: 0, items: [{ name: 'Renewal application fee', description: 'ISO 22000 recertification application (APP-0146)', amount: 1200 }] }),
    invoiceFor({ number: 'INV-2026-0391', appNumber: 'APP-0143', issued: '2026-09-16T09:00:00Z', dueInDays: 30, status: 'Unpaid', paid: 0, items: [{ name: 'Stage 1 & Stage 2 audit', description: 'ISO 9001 initial certification audits, 5.5 days (APP-0143)', amount: 52250 }] }),
    invoiceFor({ number: 'INV-2026-0388', appNumber: 'APP-0141', issued: '2026-03-24T09:00:00Z', dueInDays: 30, status: 'Paid', paid: 0, items: [{ name: 'Initial certification', description: 'ISO 22000 Stage 1 and Stage 2 audits, 4.5 days (APP-0141)', amount: 14400 }, { name: 'Certificate issuance', description: 'Registration and certificate', amount: 1200 }] }),
  ]
}

export function invoices(): CabInvoiceItem[] { return loadState('invoices', seedInvoices) }
export function saveInvoices() { saveState('invoices', invoices()) }

let invoiceSeq = 411
function raiseInvoiceForQuotation(q: Quotation): void {
  const app = findApp(q.applicationId)
  if (!app) return
  const appSeed = APPLICATIONS.find((a) => a.id === app.id)
  if (!appSeed) return
  const half = Math.round(Number(q.initialAuditFee ?? q.totalAuditFee) / 2)
  const inv = invoiceFor({ number: `INV-2026-0${invoiceSeq++}`, appNumber: app.orderNumber, issued: nowIso(), dueInDays: 30, status: 'Draft', paid: 0, items: [{ name: 'Advance payment (50%)', description: `${standardLabel(app.standard)} initial certification, per ${q.quotationNumber}`, amount: half }] })
  invoices().unshift(inv)
  saveInvoices()
}

/** Manual (service) draft invoice for an audit client, as POST /cab/invoices. Lines are added from the fee catalog later. */
export function createManualInvoiceRecord(clientId: string, currency: string, poReference?: string): CabInvoiceItem | null {
  const c = clientRecords().find((x) => x.id === clientId)
  if (!c) return null
  const pc = primaryContact(c)
  const number = `INV-2026-0${invoiceSeq++}`
  const issued = nowIso()
  const inv: CabInvoiceItem = {
    id: number.toLowerCase(), invoiceNumber: number, clientName: c.name, clientCode: c.code, country: c.country,
    issuedDate: fmtDate(issued), dueDate: fmtDate(addDays(issued, 30)), currency, amount: 0, paidAmount: 0, balance: 0, status: 'Draft',
    organizationId: c.id, siteId: c.sites[0]?.id ?? '', contactId: pc?.id ?? '', documentIds: [], relatedOrder: '', orderStatus: 'Manual',
    relatedApplication: '', poReference: poReference || undefined, primaryContact: pc ? contactName(pc) : '', contactEmail: pc?.email ?? '',
    billingAddress: { name: c.name, line1: c.address.split(',')[0], cityArea: c.city, country: c.country },
    items: [], installments: [], attachments: [], payments: [],
  }
  invoices().unshift(inv)
  saveInvoices()
  return inv
}

/* ───────────────────────── Audit plans ───────────────────────── */

function agenda(prefix: string, start: string, lead: string, team: string[]): AgendaActivity[] {
  const d1 = isoDate(start)
  const d2 = isoDate(addDays(start, 1))
  return [
    { id: `${prefix}-1`, date: d1, startTime: '08:30', endTime: '09:00', activity: 'Opening meeting', auditors: [lead], durationHours: 0.5 },
    { id: `${prefix}-2`, date: d1, startTime: '09:00', endTime: '11:00', activity: 'Context, leadership and policy (clauses 4 and 5)', auditors: [lead], durationHours: 2 },
    { id: `${prefix}-3`, date: d1, startTime: '11:00', endTime: '13:00', activity: 'Site tour and operational controls', auditors: team, durationHours: 2 },
    { id: `${prefix}-4`, date: d1, startTime: '14:00', endTime: '16:00', activity: 'Risks, objectives and planning (clause 6)', auditors: [team[team.length - 1]], durationHours: 2 },
    { id: `${prefix}-5`, date: d2, startTime: '09:00', endTime: '12:00', activity: 'Operations, monitoring and internal audit (clauses 8 and 9)', auditors: team, durationHours: 3 },
    { id: `${prefix}-6`, date: d2, startTime: '13:00', endTime: '14:00', activity: 'Closing meeting', auditors: [lead], durationHours: 1 },
  ]
}

function plan(p: { id: string; number: string; appNumber: string; stage: AuditPlan['stage']; start: string; days: number; status: AuditPlan['status']; leadId: string; teamIds: string[]; siteIdx?: number }): AuditPlan {
  const app = APPLICATIONS.find((a) => a.orderNumber === p.appNumber)
  const clientId = app?.clientId ?? CERTIFICATES.find((c) => c.applicationNumber === p.appNumber)!.clientId
  const std = app?.standard ?? CERTIFICATES.find((c) => c.applicationNumber === p.appNumber)!.standard
  const c = client(clientId)
  const pc = primaryContact(c)
  const site = c.sites[p.siteIdx ?? 0]
  const lead = person(p.leadId).name
  const team = p.teamIds.map((t) => person(t).name)
  return {
    id: p.id, planNumber: p.number, clientName: c.name, clientCode: c.code, country: c.country, stage: p.stage, applicationNumber: p.appNumber,
    standardName: `${STANDARDS[std].name} (${standardLabel(std)})`, reviewedDurationCode: `DUR-${p.appNumber.slice(4)}`, reviewedDurationDays: p.days,
    totalEffortHours: p.days * 8, siteCode: site.id, siteName: site.name, siteAddress: `${site.address}, ${c.country}`, primaryContactName: contactName(pc),
    primaryContactEmail: pc.email, primaryContactPhone: `${pc.phonePrefix} ${pc.phone}`, proposedStartDate: isoDate(p.start),
    proposedEndDate: isoDate(addDays(p.start, Math.max(0, Math.ceil(p.days) - 1))), durationDays: Math.ceil(p.days), timezone: c.countryCode === 'SA' ? 'Asia/Riyadh' : 'Africa/Cairo',
    leadAuditor: lead, auditTeam: team, auditObjectives: p.stage === 'Stage 1'
      ? 'Evaluate documented information, site conditions and readiness for the Stage 2 audit.'
      : p.stage === 'Stage 2' ? 'Evaluate the implementation and effectiveness of the management system against all requirements.'
        : 'Confirm continued conformity and effectiveness, and review changes since the last audit.',
    scopeSummary: app?.scope ?? c.activity, status: p.status, version: 1,
    siteAllocation: { siteCode: `${site.id} - ${c.city}`, siteName: site.name, onSitePersonnel: team, siteAddress: `${site.address}\n${c.country}` },
    remoteActivities: { enabled: p.stage === 'Stage 1', activities: p.stage === 'Stage 1' ? ['Document review'] : [], platform: 'Microsoft Teams', notes: '' },
    travelNotes: { details: `Team travels to ${c.city} the day before. Client arranges site access and PPE.` },
    teamDeclarations: { availabilityConfirmed: true, noConflictsDeclared: true, conflictNotes: `No consultancy or financial ties with ${c.name} in the past 3 years.` },
    agendaActivities: agenda(p.id, p.start, lead, team), createdAt: addDays(p.start, -21), updatedAt: addDays(p.start, -14),
  }
}

function seedPlans(): AuditPlan[] {
  return [
    plan({ id: 'plan-0266', number: 'AUD-0266', appNumber: 'APP-0144', stage: 'Stage 1', start: '2026-11-10T08:00:00Z', days: 2, status: 'Planned', leadId: 'emp-0001', teamIds: ['emp-0001', 'emp-0003'] }),
    plan({ id: 'plan-0267', number: 'AUD-0267', appNumber: 'APP-0144', stage: 'Stage 2', start: '2026-12-08T08:00:00Z', days: 4, status: 'Draft', leadId: 'emp-0001', teamIds: ['emp-0001', 'emp-0003'], siteIdx: 1 }),
    plan({ id: 'plan-0264', number: 'AUD-0264', appNumber: 'APP-0098', stage: 'Recertification', start: '2026-11-24T08:00:00Z', days: 3, status: 'Planned', leadId: 'emp-0002', teamIds: ['emp-0002', 'emp-0008'] }),
    plan({ id: 'plan-0262', number: 'AUD-0262', appNumber: 'APP-0142', stage: 'Stage 2', start: '2026-10-05T08:00:00Z', days: 3, status: 'Under review', leadId: 'emp-0001', teamIds: ['emp-0001', 'emp-0003'] }),
    plan({ id: 'plan-0258', number: 'AUD-0258', appNumber: 'APP-0143', stage: 'Stage 2', start: '2026-09-14T08:00:00Z', days: 3.5, status: 'Completed', leadId: 'emp-0004', teamIds: ['emp-0004', 'emp-0003'] }),
    plan({ id: 'plan-0251', number: 'AUD-0251', appNumber: 'APP-0141', stage: 'Stage 2', start: '2026-05-19T08:00:00Z', days: 3, status: 'Completed', leadId: 'emp-0002', teamIds: ['emp-0002', 'emp-0008'] }),
    plan({ id: 'plan-0270', number: 'AUD-0270', appNumber: 'APP-0141', stage: 'Surveillance 1', start: '2027-05-11T08:00:00Z', days: 2, status: 'Draft', leadId: 'emp-0002', teamIds: ['emp-0002'] }),
    plan({ id: 'plan-0271', number: 'AUD-0271', appNumber: 'APP-0102', stage: 'Surveillance 2', start: '2027-01-18T08:00:00Z', days: 1.5, status: 'Draft', leadId: 'emp-0001', teamIds: ['emp-0001'] }),
  ]
}

export function auditPlans(): AuditPlan[] { return loadState('auditPlans', seedPlans) }
export function saveAuditPlans(list?: AuditPlan[]) { saveState('auditPlans', list ?? auditPlans()) }

function draftStage1Plan(app: AppRecord): void {
  const list = auditPlans()
  if (list.some((p) => p.applicationNumber === app.orderNumber)) return
  const seed = APPLICATIONS.find((a) => a.id === app.id)
  const leadId = seed?.leadAuditorId ?? 'emp-0001'
  const next = plan({ id: `plan-${Date.now()}`, number: `AUD-0${272 + list.length}`, appNumber: app.orderNumber, stage: 'Stage 1', start: addDays(nowIso(), 21), days: 1.5, status: 'Draft', leadId, teamIds: seed?.teamIds.length ? seed.teamIds : [leadId] })
  list.unshift(next)
  saveAuditPlans()
}

/* ───────────────────────── Nonconformities ───────────────────────── */

function nc(p: { n: string; appNumber: string; auditNumber: string; cls: NonconformityItem['classification']; desc: string; raised: string; dueDays: number; status: NonconformityItem['status']; ownerId: string; actions: Array<[NonconformityItem['actions'][number]['stage'], string, NonconformityItem['actions'][number]['status']]> }): NonconformityItem {
  const app = APPLICATIONS.find((a) => a.orderNumber === p.appNumber)!
  const c = client(app.clientId)
  const pc = primaryContact(c)
  const due = addDays(p.raised, p.dueDays)
  const stageLabel = { correction: 'Correction', root_cause: 'Root cause analysis', corrective_action: 'Corrective action', verification: 'Verification' } as const
  const statusLabel = { open: 'Open', in_progress: 'In progress', submitted: 'Submitted', closed: 'Closed', overdue: 'Overdue' } as const
  const actLabel = { pending: 'Pending', submitted: 'Submitted', accepted: 'Accepted', rejected: 'Rejected' } as const
  const overdue = p.status !== 'closed' && daysFromToday(due) < 0
  return {
    id: p.n.toLowerCase(), ncId: p.n, findingId: `F-${p.n.slice(3)}`, auditId: p.auditNumber, clientName: c.name, clientId: c.code, country: c.country,
    classification: p.cls, classificationLabel: p.cls[0].toUpperCase() + p.cls.slice(1), description: p.desc, raisedDate: fmtDate(p.raised), raisedDateRaw: isoDate(p.raised),
    dueDate: fmtDate(due), dueDateRaw: isoDate(due), overdue, ownerName: person(p.ownerId).name, status: overdue ? 'overdue' : p.status,
    statusLabel: overdue ? 'Overdue' : statusLabel[p.status], primaryContactName: contactName(pc), primaryContactEmail: pc.email,
    actions: p.actions.map(([stage, description, status], i) => ({ id: `ca-${p.n}-${i + 1}`, stage, stageLabel: stageLabel[stage], description, ownerName: contactName(pc), dueDate: fmtDate(addDays(p.raised, 7 * (i + 1))), status, statusLabel: actLabel[status] })),
    attachments: p.status === 'open' ? [] : [{ id: `att-${p.n}`, name: `${p.n}_Corrective_Action_Evidence.pdf`, sizeLabel: '640 KB', uploadedBy: contactName(pc), uploadedAt: fmtDate(addDays(p.raised, 9)) }],
    history: [
      { id: `h-${p.n}-1`, text: `Nonconformity raised from finding F-${p.n.slice(3)} during ${p.auditNumber}`, by: person(p.ownerId).name, at: fmtDateTime(p.raised) },
      ...(p.status === 'submitted' || p.status === 'closed' ? [{ id: `h-${p.n}-2`, text: 'Client submitted corrective action response', by: contactName(pc), at: fmtDateTime(addDays(p.raised, 9)) }] : []),
      ...(p.status === 'closed' ? [{ id: `h-${p.n}-3`, text: 'Closed after verification', by: person(p.ownerId).name, at: fmtDateTime(addDays(p.raised, 14)) }] : []),
    ],
  }
}

function seedNcs(): NonconformityItem[] {
  return [
    nc({ n: 'NC-0412', appNumber: 'APP-0142', auditNumber: 'AUD-0262', cls: 'major', raised: '2026-10-07T13:00:00Z', dueDays: 30, status: 'submitted', ownerId: 'emp-0001',
      desc: 'Clause 6.1.2: Environmental aspects of the printing line (solvent emissions and waste inks) were not identified or evaluated for significance.',
      actions: [['correction', 'Add printing-line aspects to the register and evaluate significance.', 'submitted'], ['root_cause', 'Aspect register was not updated when the printing line was commissioned in 2025.', 'submitted'], ['corrective_action', 'Link the change-management procedure to the aspects review; train process owners.', 'submitted'], ['verification', 'Auditor to verify updated register and change records.', 'pending']] }),
    nc({ n: 'NC-0413', appNumber: 'APP-0142', auditNumber: 'AUD-0262', cls: 'minor', raised: '2026-10-07T13:30:00Z', dueDays: 30, status: 'open', ownerId: 'emp-0003',
      desc: 'Clause 9.1.2: Evaluation of compliance for the Dammam warehouse wastewater permit was not performed in 2026.',
      actions: [['correction', 'Perform the compliance evaluation for the Dammam permit.', 'pending'], ['root_cause', 'Analyse why the warehouse was not in the compliance calendar.', 'pending']] }),
    nc({ n: 'NC-0398', appNumber: 'APP-0143', auditNumber: 'AUD-0258', cls: 'minor', raised: '2026-09-16T12:00:00Z', dueDays: 30, status: 'closed', ownerId: 'emp-0004',
      desc: 'Clause 7.1.5: Calibration status of two centrifuges in the Nasr City laboratory was not identified.',
      actions: [['correction', 'Calibrate and label both centrifuges.', 'accepted'], ['root_cause', 'Equipment added outside the asset register.', 'accepted'], ['corrective_action', 'Asset register linked to purchasing approvals.', 'accepted'], ['verification', 'Calibration labels and register verified on site.', 'accepted']] }),
    nc({ n: 'NC-0420', appNumber: 'APP-0141', auditNumber: 'AUD-0251', cls: 'minor', raised: '2026-10-14T10:00:00Z', dueDays: 21, status: 'open', ownerId: 'emp-0002',
      desc: 'Clause 7.2: Competence records of two new line operators on the night shift were not available.',
      actions: [['correction', 'Complete and file the competence records of both operators.', 'pending'], ['root_cause', 'Analyse why onboarding records were not filed.', 'pending']] }),
    nc({ n: 'NC-0389', appNumber: 'APP-0141', auditNumber: 'AUD-0251', cls: 'minor', raised: '2026-05-21T12:00:00Z', dueDays: 21, status: 'closed', ownerId: 'emp-0002',
      desc: 'Clause 8.5.4: Allergen changeover cleaning on line 2 was not verified before the production run.',
      actions: [['correction', 'Re-cleaned line 2 and verified with ATP swabs.', 'accepted'], ['root_cause', 'Verification step missing from the night-shift checklist.', 'accepted'], ['corrective_action', 'Checklist updated; shift supervisors retrained.', 'accepted'], ['verification', 'Records of four changeovers reviewed.', 'accepted']] }),
  ]
}

export function ncs(): NonconformityItem[] { return loadState('nonconformities', seedNcs) }
export function saveNcs() { saveState('nonconformities', ncs()) }

export interface NcResponseDraft {
  correction: string; rootCause: string; correctiveAction: string; responsiblePerson: string; targetDate: string
  effectivenessReviewDate: string; effectivenessResult: 'not_reviewed' | 'effective' | 'partially_effective' | 'not_effective'; reviewerComments: string
  lastSavedAt: string | null; lastSavedBy: string | null
}

export function ncResponses(): Record<string, NcResponseDraft> {
  return loadState('ncResponses', () => {
    const map: Record<string, NcResponseDraft> = {}
    for (const item of seedNcs()) {
      const [correction = '', rootCause = '', correctiveAction = ''] = item.actions.map((a) => a.description)
      map[item.ncId] = {
        correction: item.status === 'open' ? '' : correction, rootCause: item.status === 'open' ? '' : rootCause, correctiveAction: item.status === 'open' ? '' : correctiveAction,
        responsiblePerson: item.primaryContactName, targetDate: item.dueDateRaw, effectivenessReviewDate: isoDate(addDays(item.dueDateRaw, 60)),
        effectivenessResult: item.status === 'closed' ? 'effective' : 'not_reviewed', reviewerComments: item.status === 'closed' ? 'Evidence reviewed and accepted.' : '',
        lastSavedAt: item.status === 'open' ? null : item.history[item.history.length - 1]?.at ?? null, lastSavedBy: item.status === 'open' ? null : item.primaryContactName,
      }
    }
    return map
  })
}
export function saveNcResponses() { saveState('ncResponses', ncResponses()) }

export function setNcStatus(ncId: string, status: NonconformityItem['status'], historyText: string, by: string): NonconformityItem | undefined {
  const item = ncs().find((x) => x.ncId === ncId || x.id === ncId)
  if (!item) return undefined
  item.status = status
  item.statusLabel = { open: 'Open', in_progress: 'In progress', submitted: 'Submitted', closed: 'Closed', overdue: 'Overdue' }[status]
  item.overdue = false
  item.history.push({ id: `h-${Date.now()}`, text: historyText, by, at: fmtDateTime(nowIso()) })
  if (status === 'closed') item.actions.forEach((a) => { a.status = 'accepted'; a.statusLabel = 'Accepted' })
  if (status === 'submitted') item.actions.forEach((a) => { if (a.status === 'pending') { a.status = 'submitted'; a.statusLabel = 'Submitted' } })
  saveNcs()
  // keep the decision's findings list in step with the register
  const decision = decisions().find((d) => d.findings.some((f) => f.id === item.findingId))
  if (decision) {
    decision.findings = decision.findings.map((f) => (f.id === item.findingId ? { ...f, status: status === 'closed' ? 'Closed' : 'Open' } : f))
    saveDecisions()
  }
  if (status === 'submitted') notify('cab', 'nonconformity_response_received', { ref: item.ncId, client: item.clientName }, `/cab/nonconformities/${item.id}/response`)
  return item
}

/* ───────────────────────── Decisions ───────────────────────── */

const MAKERS = [
  { id: 'dm-layla', name: person('emp-0005').name, authorized: true, independentFromAudit: true, roles: ['Certification Manager', 'Decision maker'] },
  { id: 'dm-hana', name: person('emp-0009').name, authorized: true, independentFromAudit: true, roles: ['Committee member', 'Decision maker'] },
  { id: 'dm-omar', name: person('emp-0001').name, authorized: true, independentFromAudit: false, roles: ['Lead Auditor'] },
  { id: 'dm-ahmed', name: person('emp-0006').name, authorized: false, independentFromAudit: true, roles: ['Reviewer'] },
]

function decision(p: { n: string; appNumber: string; received: string; status: DecisionDetail['reviewStatus']; makerId: string; techDone: boolean; recordedOutcome?: 'grant' }): DecisionDetail {
  const app = APPLICATIONS.find((a) => a.orderNumber === p.appNumber)!
  const c = client(app.clientId)
  const pc = primaryContact(c)
  const maker = MAKERS.find((m) => m.id === p.makerId)!
  const labels = { awaiting_technical_review: 'Awaiting technical review', ready_for_decision: 'Ready for decision', decided_granted: 'Granted', decided_deferred: 'Deferred', decided_refused: 'Refused' } as const
  const appNcs = seedNcs().filter((x) => APPLICATIONS.find((a) => a.orderNumber === p.appNumber) && x.auditId && seedPlans().find((pl) => pl.planNumber === x.auditId)?.applicationNumber === p.appNumber)
  const audit = seedPlans().find((pl) => pl.applicationNumber === p.appNumber && pl.stage === 'Stage 2')
  const lead = audit?.leadAuditor ?? person(app.leadAuditorId ?? 'emp-0001').name
  return {
    id: p.n.toLowerCase(), decisionId: p.n, applicationId: app.orderNumber, clientName: c.name, clientId: c.code, scheme: app.standard, country: c.country,
    receivedDate: fmtDate(p.received), receivedDateRaw: isoDate(p.received), dueDate: fmtDate(addDays(p.received, 30)), dueDateRaw: isoDate(addDays(p.received, 30)),
    reviewStatus: p.status, reviewStatusLabel: labels[p.status], decisionMakerName: maker.name, decisionMakerId: maker.id,
    clientCountry: c.country, primaryContactName: contactName(pc), primaryContactEmail: pc.email, primaryContactPhone: `${pc.phonePrefix} ${pc.phone}`,
    applicationScheme: `${STANDARDS[app.standard].name} (${standardLabel(app.standard)})`, currentStage: 'Certification decision',
    currentStageDetail: p.techDone ? 'Technical review completed' : 'Audit completed · Technical review pending', proposedScope: app.scope,
    evidence: [
      { id: `ev-${p.n}-1`, name: `Stage 2 Audit Report ${audit?.planNumber ?? app.orderNumber}`, docType: 'audit_report', docTypeLabel: 'Audit report', version: '1.0', date: isoDate(addDays(p.received, -3)), status: 'Final' },
      { id: `ev-${p.n}-2`, name: 'Technical Review Report', docType: 'technical_review', docTypeLabel: 'Technical review', version: '1.0', date: isoDate(p.received), status: p.techDone ? 'Final' : 'Partial' },
      { id: `ev-${p.n}-3`, name: 'Findings Register', docType: 'audit_findings', docTypeLabel: 'Audit findings', version: '1.0', date: isoDate(addDays(p.received, -3)), status: appNcs.some((x) => x.status !== 'closed') ? 'Open' : 'Final' },
      { id: `ev-${p.n}-4`, name: 'Corrective Action Responses', docType: 'client_submission', docTypeLabel: 'Client submission', version: '1.0', date: isoDate(p.received), status: appNcs.every((x) => x.status === 'closed') ? 'Final' : 'Partial' },
    ],
    findings: appNcs.map((x) => ({ id: x.findingId, requirement: splitClause(x.description).clause, description: splitClause(x.description).text, severity: x.classification === 'major' ? 'Major' : 'Minor', status: x.status === 'closed' ? 'Closed' : 'Open' })),
    recommendationBy: lead, recommendationDate: isoDate(addDays(p.received, -2)),
    recommendationText: appNcs.some((x) => x.status !== 'closed')
      ? `Grant certification once the open findings (${appNcs.filter((x) => x.status !== 'closed').map((x) => x.findingId).join(', ')}) are verified as closed.`
      : 'Grant certification. All findings closed and verified; scope confirmed on site.',
    technicalReviewCompleted: p.techDone,
    record: p.recordedOutcome
      ? { outcome: 'grant', rationale: 'All gates satisfied, findings closed, scope confirmed.', decisionMakerId: maker.id, decisionDate: isoDate(p.received), confirmedScope: app.scope, version: 1, recordedAt: fmtDateTime(p.received), recordedBy: maker.name, immutable: true }
      : { outcome: null, rationale: '', decisionMakerId: '', decisionDate: '', confirmedScope: app.scope, version: 1, recordedAt: null, recordedBy: null, immutable: false },
    decisionMakers: MAKERS.map((m) => ({ ...m })),
    activity: [
      { id: `a-${p.n}-1`, text: `Stage 2 audit completed (${audit?.planNumber ?? notSet()})`, by: lead, at: fmtDateTime(addDays(p.received, -3)) },
      { id: `a-${p.n}-2`, text: `Assigned to ${maker.name}`, by: 'System', at: fmtDateTime(p.received) },
      ...(p.recordedOutcome ? [{ id: `a-${p.n}-3`, text: 'Decision recorded: Grant', by: maker.name, at: fmtDateTime(p.received) }] : []),
    ],
  }
}

function seedDecisions(): DecisionDetail[] {
  return [
    decision({ n: 'DEC-0143', appNumber: 'APP-0143', received: '2026-10-02T09:00:00Z', status: 'ready_for_decision', makerId: 'dm-layla', techDone: true }),
    decision({ n: 'DEC-0142', appNumber: 'APP-0142', received: '2026-10-09T09:00:00Z', status: 'awaiting_technical_review', makerId: 'dm-hana', techDone: false }),
    decision({ n: 'DEC-0141', appNumber: 'APP-0141', received: '2026-06-10T09:00:00Z', status: 'decided_granted', makerId: 'dm-layla', techDone: true, recordedOutcome: 'grant' }),
  ]
}

export function decisions(): DecisionDetail[] { return loadState('decisions', seedDecisions) }
export function saveDecisions() { saveState('decisions', decisions()) }

/** Granting prepares the certificate draft and moves the application to certification. */
export function onDecisionGranted(d: DecisionDetail): void {
  const app = findApp(d.applicationId)
  if (app) { app.stage = 'decision'; saveApps() }
  const list = certificates()
  if (!list.some((c) => c.certificateNumber.endsWith(d.applicationId.slice(4)) && c.status !== 'WITHDRAWN')) {
    const seed = APPLICATIONS.find((a) => a.orderNumber === d.applicationId)
    if (seed) {
      const c = client(seed.clientId)
      list.unshift({ id: d.applicationId.slice(4).replace(/^0+/, ''), certificateNumber: certificateNumberFor(seed.standard, d.applicationId), clientId: c.code, clientName: c.name, standard: seed.standard, scope: seed.scope, status: 'DRAFT', countryCode: c.countryCode, issuedAt: nowIso(), validUntil: null })
      saveCertificates()
    }
  }
  if (app) notify('cab', 'decision_ready', { ref: d.applicationId }, '/cab/certificates')
}

/* ───────────────────────── Certificates & cycles ───────────────────────── */

const SCHEME_PREFIX: Record<DemoStandardCode, string> = { 'ISO 9001': 'QMS', 'ISO 14001': 'EMS', 'ISO 22000': 'FSM', 'ISO 45001': 'OHS', 'ISO/IEC 27001': 'ISM' }
const certificateNumberFor = (std: DemoStandardCode, appNumber: string) => `CAS-${SCHEME_PREFIX[std]}-${new Date().getFullYear()}-${appNumber.slice(4)}`

function seedCertificates(): CertificateRegisterItem[] {
  return CERTIFICATES.map((c) => {
    const cl = client(c.clientId)
    const app = APPLICATIONS.find((a) => a.orderNumber === c.applicationNumber)
    return { id: c.id, certificateNumber: c.number, clientId: cl.code, clientName: cl.name, standard: c.standard, scope: app?.scope ?? cl.activity, status: c.status, countryCode: cl.countryCode, issuedAt: c.issuedAt, validUntil: c.validUntil }
  })
}

export function certificates(): CertificateRegisterItem[] { return loadState('certificates', seedCertificates) }
export function saveCertificates() { saveState('certificates', certificates()) }

export function onCertificateIssued(cert: CertificateRegisterItem, issueDate: string, expiryDate: string): void {
  cert.status = 'ISSUED'
  cert.issuedAt = new Date(issueDate).toISOString()
  cert.validUntil = new Date(expiryDate).toISOString()
  saveCertificates()
  const cl = CLIENTS.find((c) => c.code === cert.clientId)
  const app = apps().find((a) => a.organizationId === cl?.id && a.standard === cert.standard)
  if (app) { app.stage = 'certified'; saveApps() }
  if (cl) {
    const cycleList = cycles()
    if (!cycleList.some((c) => c.certificate.certificateNumber === cert.certificateNumber)) {
      cycleList.unshift(cycleFor({ certNumber: cert.certificateNumber, clientId: cl.id, appNumber: app?.orderNumber ?? notSet(), standard: cert.standard as DemoStandardCode, issued: cert.issuedAt, expiry: cert.validUntil!, status: 'active' }))
      saveCycles()
    }
    notify('client', 'certificate_issued', { ref: cert.certificateNumber }, '/portal/certificates', cl.id)
  }
}

function cycleFor(p: { certNumber: string; clientId: string; appNumber: string; standard: DemoStandardCode; issued: string; expiry: string; status: CertificationCycleDetail['lifecycleStatus'] }): CertificationCycleDetail {
  const c = client(p.clientId)
  const pc = primaryContact(c)
  const s1 = addDays(p.issued, 330)
  const s2 = addDays(p.issued, 695)
  const rc = addDays(p.expiry, -90)
  const next = [s1, s2, rc].find((d) => daysFromToday(d) > -30) ?? rc
  const stageStatus = (d: string) => (daysFromToday(d) < -30 ? 'completed' : d === next ? 'upcoming' : 'pending') as 'completed' | 'upcoming' | 'pending'
  const statusLabel = { active: 'Active', upcoming: 'Upcoming', suspended: 'Suspended', expired: 'Expired' }[p.status]
  const nextType = next === rc ? 'recertification' : 'surveillance'
  const coordinator = person(p.standard === 'ISO 22000' ? 'emp-0002' : 'emp-0001').name
  const evt = (id: string, type: string, d: string, status: 'next' | 'planned' | 'completed') => ({ id, type, typeLabel: type === 'recertification' ? 'Recertification' : 'Surveillance', windowStart: fmtDate(addDays(d, -30)), windowEnd: fmtDate(addDays(d, 30)), status, statusLabel: status === 'next' ? 'Next' : status === 'planned' ? 'Planned' : 'Completed' })
  return {
    id: `cyc-${p.appNumber.slice(4)}`, cycleId: `CYC-${p.appNumber.slice(4)}`, applicationId: p.appNumber, clientId: c.code, organizationId: c.id, clientName: c.name,
    primaryContactName: contactName(pc), primaryContactEmail: pc.email, country: c.country, certificateStandard: p.standard, certificateStandardLabel: STANDARDS[p.standard].name,
    lifecycleStatus: p.status, lifecycleStatusLabel: statusLabel, cycleStartDate: fmtDate(p.issued), cycleEndDate: fmtDate(p.expiry), nextSurveillanceDue: fmtDate(next),
    nextSurveillanceDueInDays: daysFromToday(next),
    stages: [
      { id: 'initial', label: 'Initial Certification', date: fmtDate(p.issued), status: 'completed' },
      { id: 'surveillance-1', label: 'Surveillance 1', date: fmtDate(s1), status: stageStatus(s1) },
      { id: 'surveillance-2', label: 'Surveillance 2', date: fmtDate(s2), status: stageStatus(s2) },
      { id: 'recertification', label: 'Recertification', date: fmtDate(rc), status: stageStatus(rc) },
    ],
    upcomingActivities: [
      { id: `act-${p.appNumber}-1`, date: fmtDate(next), activity: nextType === 'recertification' ? 'Recertification Audit' : 'Surveillance Audit', type: 'Audit', status: 'Planned' },
      { id: `act-${p.appNumber}-2`, date: fmtDate(addDays(next, -21)), activity: 'Audit Plan Due', type: 'Task', status: 'Open' },
      { id: `act-${p.appNumber}-3`, date: fmtDate(addDays(next, -45)), activity: 'Send Information Request', type: 'Task', status: daysFromToday(addDays(next, -45)) < 0 ? 'Done' : 'Open' },
    ],
    cycleRangeLabel: rangeText(new Date(p.issued).getFullYear(), new Date(p.expiry).getFullYear()),
    cycleStatusLabel: p.status === 'suspended' ? 'Suspended' : 'In progress',
    initialCertificationDate: fmtDate(p.issued), certificationExpiryDate: fmtDate(p.expiry), primaryContactPhone: `${pc.phonePrefix} ${pc.phone}`,
    certificate: { certificateNumber: p.certNumber, standard: standardLabel(p.standard), standardLabel: STANDARDS[p.standard].name, status: p.status, statusLabel, validFrom: fmtDate(p.issued), validUntil: fmtDate(p.expiry) },
    nextEvent: { ...evt('evt-next', nextType, next, 'next'), dueInDays: daysFromToday(next), responsibleCoordinator: coordinator, scheduled: auditPlans().some((pl) => pl.applicationNumber === p.appNumber && pl.status !== 'Completed'), schedulingStatusLabel: auditPlans().some((pl) => pl.applicationNumber === p.appNumber && pl.status !== 'Completed') ? 'Scheduled' : 'Not yet scheduled' },
    upcomingEvents: [s1, s2, rc].filter((d) => daysFromToday(d) > -30).map((d, i) => evt(`evt-${i}`, d === rc ? 'recertification' : 'surveillance', d, d === next ? 'next' : 'planned')),
    recordGroups: [
      { id: 'scopeChanges', count: 0, records: [] },
      { id: 'siteChanges', count: c.sites.length > 1 ? 1 : 0, records: c.sites.length > 1 ? [{ id: `si-${p.appNumber}`, title: `Add ${c.sites[1].name}`, date: fmtDate(addDays(p.issued, 60)), status: 'Approved' }] : [] },
      { id: 'transfers', count: 0, records: [] },
      { id: 'suspensions', count: p.status === 'suspended' ? 1 : 0, highlightCount: p.status === 'suspended' ? 1 : undefined, records: p.status === 'suspended' ? [{ id: `su-${p.appNumber}`, title: 'Suspended: surveillance audit not performed within the window', date: fmtDate(addDays(p.issued, 400)), status: 'Open' }] : [] },
    ],
  }
}

function seedCycles(): CertificationCycleDetail[] {
  return CERTIFICATES.filter((c) => c.status === 'ISSUED' || c.status === 'SUSPENDED').map((c) =>
    cycleFor({ certNumber: c.number, clientId: c.clientId, appNumber: c.applicationNumber, standard: c.standard, issued: c.issuedAt, expiry: c.validUntil!, status: c.status === 'SUSPENDED' ? 'suspended' : 'active' }))
}

export function cycles(): CertificationCycleDetail[] { return loadState('cycles', seedCycles) }
export function saveCycles() { saveState('cycles', cycles()) }
export const cycleListItem = (d: CertificationCycleDetail): CertificationCycle => {
  const { id, cycleId, applicationId, clientId, clientName, primaryContactName, primaryContactEmail, country, certificateStandard, certificateStandardLabel, lifecycleStatus, lifecycleStatusLabel, cycleStartDate, cycleEndDate, nextSurveillanceDue, nextSurveillanceDueInDays, stages, upcomingActivities } = d
  return { id, cycleId, applicationId, clientId, clientName, primaryContactName, primaryContactEmail, country, certificateStandard, certificateStandardLabel, lifecycleStatus, lifecycleStatusLabel, cycleStartDate, cycleEndDate, nextSurveillanceDue, nextSurveillanceDueInDays, stages, upcomingActivities }
}

/* ───────────────────────── Contacts ───────────────────────── */

export function contacts(): ContactItem[] {
  return loadState('contacts', () => CLIENTS.flatMap((c) => c.contacts.map((x, i) => ({
    id: x.id, contactCode: `CNT-${x.id.slice(4)}`, clientName: c.name, clientCode: c.code, country: c.country, firstName: x.firstName, lastName: x.lastName,
    email: x.email, jobTitle: x.role, phoneNumber: x.phone, phonePrefix: x.phonePrefix, linkedSites: i === 0 ? c.sites.map((s) => s.id) : [c.sites[0].id],
    isPrimaryContact: x.isPrimary, isAuthorizedSignatory: x.isSignatory, inviteToPortal: x.portalAccess, status: (x.portalAccess || i === 0 ? 'active' : 'pending') as ContactItem['status'],
    createdAt: isoDate(c.createdAt),
  }))))
}
export function saveContacts() { saveState('contacts', contacts()) }

/* ───────────────────────── People ───────────────────────── */

export function employees(): CabEmployee[] {
  return loadState('employees', () => PEOPLE.map((p) => ({
    id: p.id, userId: p.userId, cabId: DEMO_CAB.id, professionalRole: p.jobRole, imageUrl: null, employmentStartDate: `${p.startDate}T00:00:00Z`, employmentEndDate: null,
    expiryDate: `${Number(p.startDate.slice(0, 4)) + 8}-${p.startDate.slice(5)}T00:00:00Z`, iafCodes: p.iafCodes, schemes: p.standards.map((s) => standardLabel(s)),
    status: 'ACTIVE', createdAt: `${p.startDate}T00:00:00Z`, updatedAt: '2026-10-01T00:00:00Z',
    user: { id: p.userId, fullName: p.name, email: p.email, phone: p.phone.split(' ').slice(1).join(' '), phoneCountryCode: p.phone.split(' ')[0], status: 'ACTIVE' },
  })))
}
export function saveEmployees() { saveState('employees', employees()) }

export function competencePeople(): CompetencePerson[] {
  return PEOPLE.map((p) => {
    const audits = auditPlans().filter((pl) => pl.auditTeam.includes(p.name) && pl.status === 'Completed')
    return {
      id: p.id, code: p.code, name: p.name, role: p.competenceRole, country: p.country, schemes: p.standards.map((s) => standardLabel(s)),
      authorizedScope: p.standards.length ? p.standards.map((s) => STANDARDS[s].name).join(', ') : 'Administrative (no audit scope)',
      expiryDate: `${Number(p.startDate.slice(0, 4)) + 8}-${p.startDate.slice(5)}`, status: p.standards.length ? 'Authorized' : 'Under review',
      employmentStartDate: p.startDate, iafCodes: p.iafCodes, qualifications: p.qualification, email: p.email, phone: p.phone, statusDot: 'Active',
      evaluation: p.standards.length ? {
        scheme: standardLabel(p.standards[0]), proposedSector: `IAF ${p.iafCodes[0] ?? notSet()}`, evaluationDate: '2026-01-15', evaluator: person('emp-0005').name,
        overallResult: 'Competent', comments: 'Meets education, training, audit-experience and witnessed-audit criteria.', highestQualification: p.qualification,
        fieldOfStudy: p.fieldOfStudy, relevantExperienceYears: p.experienceYears, sectorExperienceYears: Math.max(2, p.experienceYears - 4), additionalNotes: '',
        status: 'Authorized', lastSaved: '15 Jan 2026, 10:00',
      } : undefined,
      trainings: p.standards.map((s, i) => ({ id: `tr-${p.id}-${i}`, date: `202${3 + (i % 3)}-0${3 + i}-12`, course: `${s} Lead Auditor (IRCA/CQI certified)`, provider: 'CQI | IRCA approved training partner', result: 'Completed' as const })),
      auditLogs: audits.map((pl) => ({ id: `al-${p.id}-${pl.id}`, date: pl.proposedStartDate, client: pl.clientName, clientCode: pl.clientCode, activity: `${pl.stage} audit`, role: pl.leadAuditor === p.name ? 'Lead Auditor' : 'Auditor', result: 'Satisfactory' as const })),
      witnessings: p.competenceRole === 'Lead Auditor' ? [{ id: `w-${p.id}`, date: '2025-11-18', client: CLIENTS[4].name, clientCode: CLIENTS[4].code, auditType: 'Surveillance', witnessedBy: 'SAAC assessor', outcome: 'Positive' as const }] : [],
      restrictions: [],
    }
  })
}

export function orgUsers(): AppUser[] {
  return loadState('orgUsers', () => PEOPLE.slice(0, 7).map((p, i) => ({
    id: p.userId, fullName: p.name, role: p.jobRole.split('_').map((w) => w[0] + w.slice(1).toLowerCase()).join(' '),
    phoneCountryCode: p.phone.split(' ')[0], phoneNumber: p.phone.split(' ').slice(1).join(''), email: p.email,
    status: (i === 6 ? 'INVITED' : 'ACTIVE') as AppUser['status'], createdAt: `${p.startDate}T00:00:00Z`,
  })))
}
export function saveOrgUsers() { saveState('orgUsers', orgUsers()) }

/* ───────────────────────── Client profiles ───────────────────────── */

export function clientRecords(): DemoClient[] { return loadState('clients', () => CLIENTS.map((c) => JSON.parse(JSON.stringify(c)) as DemoClient)) }
export function saveClients() { saveState('clients', clientRecords()) }
export function clientRecord(id: string): DemoClient { return clientRecords().find((c) => c.id === id) ?? client(id) }

export function clientProfile(clientId: string): OrganizationProfileData {
  const c = clientRecord(clientId)
  const pc = primaryContact(c)
  return {
    status: 'COMPLETED', organizationName: c.name,
    originalRegistrationData: { activity: c.activity, legalCapacity: c.legalCapacity, city: c.city, address: c.address },
    profile: {
      organizationName: c.name, tradeName: c.tradeName, commercialRegisterNumber: c.crNumber, unifiedNumber: `70${c.crNumber.slice(0, 8)}`,
      authorizedPersonName: contactName(pc), email: pc.email, phoneCountryCode: pc.phonePrefix, phoneNumber: pc.phone.replace(/\s/g, ''),
      organizationStatus: 'ACTIVE', registrationDate: isoDate(c.createdAt), employeeCount: c.employees, industries: [c.industry], companySummary: c.activity,
      logoUrl: null, allProductionLinesActive: true,
    },
    address: { country: c.countryCode, city: c.city, street: c.address.split(',')[0], district: c.address.split(',')[1]?.trim() ?? null, postalCode: c.address.match(/\d{5}/)?.[0] ?? null },
    branches: c.sites.map((s) => ({ id: s.id, branchName: s.name, address: s.address, employeeCount: s.employees, industry: c.industry, branchType: 'PERMANENT' as const, branchManagerName: contactName(pc), phoneCountryCode: pc.phonePrefix, phoneNumber: pc.phone.replace(/\s/g, '') })),
    documents: [
      { id: `doc-${c.code}-cr`, documentType: 'COMMERCIAL_REGISTER', originalName: `Commercial Register ${c.crNumber}.pdf`, fileName: 'cr.pdf', fileUrl: '/demo-docs/sample.pdf', mimeType: 'application/pdf', fileSize: 412000, createdAt: c.createdAt },
      { id: `doc-${c.code}-tax`, documentType: 'TAX_CARD', originalName: 'Tax Card.pdf', fileName: 'tax.pdf', fileUrl: '/demo-docs/sample.pdf', mimeType: 'application/pdf', fileSize: 188000, createdAt: c.createdAt },
    ],
  }
}

/* ───────────────────────── Notifications ───────────────────────── */

type NotificationStore = Record<NotificationAudience, Array<AppNotification & { clientId?: string }>>

function seedNotifications(): NotificationStore {
  const ago = (m: number) => new Date(Date.now() - m * 60_000).toISOString()
  const portal = PORTAL_CLIENT_ID
  return {
    cab: [
      { id: 'n-101', type: 'application_received', params: { ref: 'APP-0149', client: CLIENTS[0].name }, link: `/cab/applications/${APPLICATIONS[8].id}/receipt`, createdAt: ago(40), read: false },
      { id: 'n-102', type: 'information_responded', params: { ref: 'APP-0148', client: CLIENTS[7].name }, link: `/cab/applications/${APPLICATIONS[7].id}/information-required`, createdAt: ago(95), read: false },
      { id: 'n-103', type: 'quotation_pending_approval', params: { ref: 'APP-0146', discount: '0%' }, link: `/cab/applications/${APPLICATIONS[5].id}/quotation`, createdAt: ago(60 * 5), read: false },
      { id: 'n-104', type: 'nonconformity_response_received', params: { ref: 'NC-0412', client: CLIENTS[1].name }, link: '/cab/nonconformities/nc-0412/response', createdAt: ago(60 * 20), read: true },
      { id: 'n-105', type: 'decision_ready', params: { ref: 'APP-0143' }, link: '/cab/decisions/dec-0143', createdAt: ago(60 * 26), read: true },
      { id: 'n-106', type: 'invoice_overdue', params: { ref: 'INV-2026-0391', client: CLIENTS[2].name, days: String(Math.max(1, -daysFromToday('2026-10-16T09:00:00Z'))) }, link: '/cab/invoices/inv-2026-0391', createdAt: ago(60 * 30), read: true },
      { id: 'n-107', type: 'application_received', params: { ref: 'APP-0150', client: CLIENTS[1].name }, link: `/cab/applications/${APPLICATIONS[9].id}/receipt`, createdAt: ago(60 * 48), read: true },
    ],
    client: [
      { id: 'c-201', type: 'invoice_due', params: { ref: 'INV-2026-0402', date: '2026-11-19' }, link: '/portal/invoices', createdAt: ago(60 * 3), read: false, clientId: portal },
      { id: 'c-202', type: 'certificate_issued', params: { ref: 'CAS-FSM-2026-0141' }, link: '/portal/certificates', createdAt: ago(60 * 24 * 130), read: true, clientId: portal },
      { id: 'c-203', type: 'audit_plan_to_confirm', params: { ref: 'AUD-0270', date: '2027-05-11' }, link: '/portal/audits', createdAt: ago(60 * 24 * 2), read: false, clientId: portal },
      { id: 'c-204', type: 'information_requested', params: { ref: 'APP-0149' }, link: '/portal/applications', createdAt: ago(60 * 26), read: true, clientId: portal },
    ],
  }
}

export function notificationStore(): NotificationStore { return loadState('notifications', seedNotifications) }
export function saveNotifications() { saveState('notifications', notificationStore()) }

export function notify(audience: NotificationAudience, type: AppNotification['type'], params: Record<string, string>, link: string, clientId?: string): void {
  const store = notificationStore()
  store[audience].unshift({ id: `${audience[0]}-${Date.now()}-${Math.round(Math.random() * 1000)}`, type, params, link, createdAt: nowIso(), read: false, clientId })
  saveNotifications()
}

/* ───────────────────────── Session helpers ───────────────────────── */

/** The audit client signed in, or null for CAB users. Reads the stored session without importing authStorage (avoids cycles). */
export function sessionClientId(): string | null {
  try {
    const raw = localStorage.getItem('icasco_auth_session') ?? sessionStorage.getItem('icasco_auth_session')
    if (!raw) return null
    const s = JSON.parse(raw) as { organization?: { id?: string; type?: string } | null }
    return s.organization?.type === 'AUDIT_CLIENT' ? s.organization.id ?? null : null
  } catch {
    return null
  }
}

/** For portal screens: keep only the signed-in client's rows. CAB users see everything. */
export function scopeToSession<T>(rows: T[], clientOf: (row: T) => string | undefined): T[] {
  const id = sessionClientId()
  if (!id) return rows
  const c = clientRecord(id)
  return rows.filter((row) => {
    const v = clientOf(row)
    return v === c.id || v === c.code || v === c.name
  })
}

/* ───────────────────────── Wallet (portal client) ───────────────────────── */

export function walletTransactions(): WalletTransaction[] {
  return loadState('wallet', () => {
    const id = PORTAL_CLIENT_ID
    const fmt = (iso: string) => new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).format(new Date(iso))
    return seedInvoices().filter((i) => i.organizationId === id && i.paidAmount > 0).map((i, n): WalletTransaction => ({
      id: `w-${i.id}`, transactionNumber: `TRX-${i.invoiceNumber.slice(4).replace('-', '')}-${String(n + 1).padStart(4, '0')}`,
      date: fmt(addDays((parseDisplayDate(i.issuedDate) ?? new Date()).toISOString(), 9)), statementTitle: i.items[0]?.name ?? 'Invoice payment', statementSubtitle: `${i.invoiceNumber} · ${i.relatedApplication}`,
      paymentMethod: 'bank_transfer' as const, amount: i.paidAmount, status: 'successful' as const,
    })).concat([{ id: 'w-topup-1', transactionNumber: 'TRX-20260801-0011', date: '08/01/2026', statementTitle: 'Recharge wallet balance', paymentMethod: 'mada', amount: 5000, status: 'successful' }])
  })
}
export function saveWallet() { saveState('wallet', walletTransactions()) }

/* ───────────────────────── Invoice side effects ───────────────────────── */

export function onInvoiceIssued(inv: CabInvoiceItem): void {
  notify('client', 'invoice_due', { ref: inv.invoiceNumber, date: inv.dueDate }, '/portal/invoices', inv.organizationId)
}

export function onInvoicePaymentRecorded(inv: CabInvoiceItem, amount: number): void {
  if (inv.organizationId === PORTAL_CLIENT_ID) {
    const list = walletTransactions()
    list.unshift({
      id: `w-${Date.now()}`, transactionNumber: `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(list.length + 1).padStart(4, '0')}`,
      date: new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).format(new Date()),
      statementTitle: inv.items[0]?.name ?? 'Invoice payment', statementSubtitle: `${inv.invoiceNumber} · ${inv.relatedApplication}`,
      paymentMethod: 'bank_transfer', amount, status: 'successful',
    })
    saveWallet()
  }
}
