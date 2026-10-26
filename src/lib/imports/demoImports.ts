/**
 * PREVIEW ONLY: the import API played in the browser on the shared demo store, so the preview
 * works end to end without a backend. Each function mirrors one endpoint of `/api/v1/cab/imports`
 * (see lib/api/importsApi.ts) and returns the same JSON shapes, with the same rules
 * (lib/imports/engine.ts): templates come from the in-repo xlsx writer, uploads are read with
 * read-excel-file or the CSV parser, and committed rows are written into the demo collections the
 * screens read.
 */
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { clone, loadState, saveState, wait } from '@/lib/api/demo/demoStore'
import { DEMO_CAB, STANDARDS, standardLabel, type DemoClient, type DemoStandardCode } from '@/lib/api/demo/dataset'
import {
  auditPlans,
  certificates,
  clientRecords,
  contacts,
  cycles,
  employees,
  invoices,
  ncs,
  saveCertificates,
  saveClients,
  saveContacts,
  saveCycles,
  saveEmployees,
  saveInvoices,
  saveNcs,
} from '@/lib/api/demo/records'
import { getAuthSession } from '@/lib/authStorage'
import { getCountryOptions } from '@/lib/countries'
import { IAF_CODES_LIST } from '@/lib/iafCodes'
import { isCriticalIafCode } from '@/lib/criticalCodeExams'
import { CAB_PROFESSIONAL_ROLES, type CabEmployee } from '@/lib/api/cabEmployeesApi'
import { SUPPORTED_CURRENCIES, createFeeItem, listFeeItems, updateFeeItem, type FeeCurrency } from '@/lib/api/feeItemsApi'
import { fetchAuditPlanById, saveAuditPlan, type AgendaActivity, type AuditPlan } from '@/lib/api/cabAuditPlanningApi'
import { createCertificationCycle } from '@/lib/api/cabCertificationApi'
import { fetchCompetencePerson, listCompetencePersons, updateCompetencePerson } from '@/lib/api/cabCompetenceApi'
import { getCabProfile, saveCabSetupDraft } from '@/lib/api/cabApi'
import { fetchMySubscription } from '@/lib/api/subscriptionApi'
import { createChecklist, emptyChecklistItem, getChecklist, listChecklists, updateChecklist, type ChecklistItemData, type ChecklistStageKey, type ChecklistTemplate } from '@/lib/api/checklistsApi'
import type { CabInvoiceItem } from '@/lib/api/cabInvoiceRegisterApi'
import type { NonconformityItem } from '@/lib/api/cabNonconformitiesApi'
import type { CertificateRegisterItem } from '@/lib/api/cabCertificatesApi'
import type { ContactItem } from '@/lib/api/cabContactsApi'
import {
  definitionForEntity,
  fieldIdOf,
  importDefinition,
  IMPORT_DEFINITIONS,
  IMPORT_TEMPLATE_VERSION,
  MIGRATION_ORDER,
  recordEditRoute,
  type ImportDefinition,
} from '@/lib/imports/entities'
import { cellText, evaluateImport, naturalKeyOf, rowCompleteness, rowsToCommit, type ImportEngineContext } from '@/lib/imports/engine'
import { buildErrorsBlob, buildTemplateBlob, ImportFileError, readImportFile, type ParsedImportFile } from '@/lib/imports/workbook'
import type {
  ImportAllowedValue,
  ImportBatchDetail,
  ImportCommitOptions,
  ImportContext,
  ImportDefinitionKey,
  ImportEntityInfo,
  ImportEntityKey,
  ImportHistoryItem,
  ImportIncompleteRecord,
  ImportListSource,
  ImportPreview,
  ImportResult,
  MigrationEntityStatus,
  MigrationStatus,
} from '@/lib/imports/types'

/* ── Stored batches and records to complete ─────────────────────────── */

interface DemoBatch {
  id: string
  definitionKey: ImportDefinitionKey
  preview: ImportPreview
  /** Cell text of each row, for the errors file. */
  raw: Record<number, Record<string, string>>
}

/** One entry of `import_incomplete_records`: `id` is the entry, `recordId` the record. */
type DemoIncomplete = ImportIncompleteRecord & { recordId: string }

const BATCHES = 'import-batches.v2'
const INCOMPLETE = 'import-incomplete.v2'
const batches = () => loadState<DemoBatch[]>(BATCHES, () => [])
const incompleteStore = () => loadState<DemoIncomplete[]>(INCOMPLETE, () => [])
const saveBatches = () => saveState(BATCHES, batches())
const saveIncomplete = () => saveState(INCOMPLETE, incompleteStore())

const RETENTION_MS = 7 * 86_400_000
const MAX_ROWS = 5000
const now = () => new Date().toISOString()
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))
const num = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const list = (v: unknown) => (Array.isArray(v) ? (v as string[]) : [])
const fmt = (iso: string) => (iso ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${iso.slice(0, 10)}T00:00:00Z`)) : '')
const addMonths = (iso: string, months: number) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + months)
  return d.toISOString().slice(0, 10)
}

/** An error shaped like the API's (`code` + readable message), mapped to text by the wizard. */
function apiError(code: string, message: string): Error {
  return Object.assign(new Error(message), { code })
}

const FILE_ERROR_CODES: Record<string, string> = {
  FILE_TOO_LARGE: 'IMPORT_FILE_TYPE',
  FILE_TYPE: 'IMPORT_FILE_TYPE',
  XLS_NOT_SUPPORTED: 'IMPORT_XLS_PREVIEW',
  FILE_UNREADABLE: 'IMPORT_FILE_UNREADABLE',
  NO_COLUMNS: 'IMPORT_NO_COLUMNS',
  WRONG_TEMPLATE: 'IMPORT_WRONG_TEMPLATE',
}

function splitPhone(e164: string): { prefix: string; number: string } {
  const parsed = parsePhoneNumberFromString(e164)
  if (parsed) return { prefix: `+${parsed.countryCallingCode}`, number: String(parsed.nationalNumber) }
  return { prefix: '', number: e164 }
}

/* ── Lists and lookups from the demo store ──────────────────────────── */

const ROLE_AR: Record<string, string> = {
  GENERAL_MANAGER: 'المدير العام',
  APPLICATIONS_RECEIVER: 'مستلم الطلبات',
  TECHNICAL_MANAGER: 'المدير الفني',
  CERTIFICATION_MANAGER: 'مدير منح الشهادات',
  BUSINESS_DEVELOPMENT_MANAGER: 'مدير تطوير الأعمال',
  LEAD_AUDITOR: 'قائد فريق التدقيق',
  AUDITOR: 'مدقق',
  ACCOUNTANT: 'محاسب',
  COMMITTEE_MEMBER: 'عضو لجنة',
  FREELANCE_AUDITOR: 'مدقق مستقل',
}

function demoLists(): Partial<Record<ImportListSource, ImportAllowedValue[]>> {
  const ar = new Map(getCountryOptions('ar').map((c) => [c.code, c.name]))
  return {
    countries: getCountryOptions('en').map((c) => ({ value: c.code, labelEn: c.name, labelAr: ar.get(c.code) ?? c.name })),
    currencies: SUPPORTED_CURRENCIES.map((c) => ({ value: c, labelEn: c, labelAr: c })),
    // Value "ISO 9001:2015"; the bare code "ISO 9001" matches too.
    standards: (Object.keys(STANDARDS) as DemoStandardCode[]).map((code) => ({ value: standardLabel(code), labelEn: code, labelAr: STANDARDS[code].nameAr })),
    roles: CAB_PROFESSIONAL_ROLES.map((r) => ({ value: r.value, labelEn: r.label, labelAr: ROLE_AR[r.value] ?? r.label })),
    clients: clientRecords().map((c) => ({ value: c.name, labelEn: c.code, labelAr: c.nameAr || c.name })),
    personnel: employees().map((e) => ({ value: e.user.fullName, labelEn: e.user.email, labelAr: e.user.fullName })),
    iafCodes: IAF_CODES_LIST.map((c) => ({ value: c.code, labelEn: `IAF ${c.code}`, labelAr: `IAF ${c.code}` })),
  }
}

function clientMap(): Map<string, string> {
  const map = new Map<string, string>()
  for (const c of clientRecords()) {
    for (const key of [c.name, c.nameAr, c.code, c.tradeName, c.crNumber]) if (key) map.set(norm(key), c.id)
  }
  return map
}

function personnelMap(): Map<string, string> {
  const map = new Map<string, string>()
  for (const e of employees()) {
    map.set(norm(e.user.email), e.id)
    if (e.user.fullName) map.set(norm(e.user.fullName), e.id)
  }
  return map
}

const clientById = (id: string) => clientRecords().find((c) => c.id === id)
const standardOf = (text: string) => text.match(/ISO(?:\/IEC)? \d+(?::\d{4})?/)?.[0] ?? text
const asStandardLabel = (text: string) => {
  const code = (Object.keys(STANDARDS) as DemoStandardCode[]).find((c) => text === c || text.startsWith(`${c}:`))
  return code ? standardLabel(code) : text
}

/** Natural keys of the records that already exist, per definition. */
async function existingKeys(definition: ImportDefinition): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const put = (values: Record<string, unknown>, id: string) => {
    const key = naturalKeyOf(definition, values)
    if (key) map.set(key, id)
  }
  switch (definition.key) {
    case 'clients':
      clientRecords().forEach((c) => put({ legalName: c.name }, c.id))
      break
    case 'client_sites':
      clientRecords().forEach((c) => c.sites.forEach((s) => put({ client: c.name, siteName: s.name }, s.id)))
      break
    case 'contacts':
      contacts().forEach((x) => put({ client: x.clientName, email: x.email }, x.id))
      break
    case 'personnel':
      employees().forEach((e) => put({ email: e.user.email }, e.id))
      break
    case 'trainings': {
      const people = await listCompetencePersons('en')
      people.forEach((p) => (p.trainings ?? []).forEach((tr) => put({ person: p.email, course: tr.course, date: tr.date }, `${p.id}#${tr.id}`)))
      break
    }
    case 'certificates':
      certificates().forEach((c) => put({ certificateNumber: c.certificateNumber }, c.id))
      break
    case 'certification_cycles':
      cycles().forEach((c) => put({ certificateNumber: c.certificate.certificateNumber }, c.id))
      break
    case 'audit_plans':
      auditPlans().forEach((p) => put({ client: p.clientName, standard: standardOf(p.standardName), stage: p.stage, startDate: p.proposedStartDate }, p.id))
      break
    case 'nonconformities':
      ncs().forEach((n) => put({ reference: n.ncId }, n.id))
      break
    case 'invoices':
      invoices().forEach((i) => put({ invoiceNumber: i.invoiceNumber }, i.id))
      break
    case 'fee_items':
      ;(await listFeeItems({ includeInactive: true })).forEach((f) => f.code && put({ code: f.code }, f.id))
      break
    case 'checklists':
      for (const c of await cabChecklistsWithItems()) (c.items ?? []).forEach((i) => i.id && put({ checklistCode: c.code, clause: i.clause, title: i.title }, i.id))
      break
    case 'accreditation_scope': {
      const { cab } = await getCabProfile()
      cab.schemes.forEach((s) => (s.approvedScopeCodes ?? []).forEach((code) => put({ scheme: s.schemeName, scopeCode: code }, `${s.id ?? s.schemeName}#${code}`)))
      break
    }
    default:
      break
  }
  return map
}

async function engineContext(definition: ImportDefinition): Promise<ImportEngineContext> {
  const ctx: ImportEngineContext = {
    lists: demoLists(),
    existing: await existingKeys(definition),
    clients: clientMap(),
    personnel: personnelMap(),
    certificates: new Map(certificates().map((c) => [norm(c.certificateNumber), c.id])),
    isCriticalIafCode,
  }
  if (definition.key === 'certificates') {
    try {
      const sub = await fetchMySubscription()
      ctx.certificateLimit = { active: sub.limits.certificates.active, limit: sub.limits.certificates.limit }
    } catch {
      // Unknown plan: no cap in the preview.
    }
  }
  return ctx
}

const resultTotals = (r: ImportResult | null | undefined) => (r ? { created: r.created, updated: r.updated, skipped: r.skipped, failed: r.failed } : null)

/* ── Endpoints ──────────────────────────────────────────────────────── */

export async function demoListEntities(): Promise<ImportEntityInfo[]> {
  await wait(80)
  return (Object.keys(IMPORT_DEFINITIONS) as ImportDefinitionKey[]).map((key) => {
    const d = IMPORT_DEFINITIONS[key]
    return {
      key,
      labelEn: d.labelEn,
      labelAr: d.labelAr,
      descriptionEn: d.descriptionEn,
      descriptionAr: d.descriptionAr,
      route: d.route,
      templateFileName: `iCASCO_${key}_template_${IMPORT_TEMPLATE_VERSION}.xlsx`,
      templateVersion: IMPORT_TEMPLATE_VERSION,
      contextRequired: key === 'audit_plan_sections' ? ['auditPlanId'] : [],
      columns: d.columns.map((c) => ({
        key: c.key,
        labelEn: c.labelEn,
        labelAr: c.labelAr,
        required: Boolean(c.required),
        importance: c.required ? 'required' : c.later ? 'recommended' : 'optional',
        type: c.type,
        allowed: c.allowed?.map((a) => a.labelEn),
        allowedAr: c.allowed?.map((a) => a.labelAr),
        fieldId: fieldIdOf(d, c.key),
      })),
    }
  })
}

export async function demoTemplate(definitionKey: ImportDefinitionKey, lang: 'en' | 'ar'): Promise<Blob> {
  await wait(60)
  return buildTemplateBlob(importDefinition(definitionKey), lang, demoLists())
}

export async function demoPreview(entity: ImportEntityKey, file: File, context: ImportContext = {}): Promise<ImportPreview> {
  const definition = definitionForEntity(entity, context)
  let parsed: ParsedImportFile
  try {
    parsed = await readImportFile(definition, file)
  } catch (err) {
    if (err instanceof ImportFileError) throw apiError(FILE_ERROR_CODES[err.code] ?? 'IMPORT_FILE_UNREADABLE', err.message)
    throw err
  }
  if (!parsed.rows.length) throw apiError('IMPORT_NO_ROWS', 'The file has no rows to import.')
  if (parsed.rows.length > MAX_ROWS) throw apiError('IMPORT_TOO_MANY_ROWS', 'The file has more than 5000 rows.')
  const ctx = await engineContext(definition)
  const evaluated = evaluateImport(definition, parsed.rows, ctx, parsed.recognised)
  const id = `imp-${Date.now().toString(36)}`
  const preview: ImportPreview = {
    ...evaluated,
    importId: id,
    entity: definition.key,
    fileName: file.name,
    templateVersion: parsed.templateVersion,
    expectedTemplateVersion: IMPORT_TEMPLATE_VERSION,
    templateOutdated: Boolean(parsed.templateVersion) && parsed.templateVersion !== IMPORT_TEMPLATE_VERSION,
    status: 'preview',
    context,
    createdAt: now(),
    createdBy: getAuthSession()?.user?.email ?? DEMO_CAB.admin.name,
    expiresAt: new Date(Date.now() + RETENTION_MS).toISOString(),
    columnsUnknown: [],
    result: null,
  }
  if (definition.repeatedKeyIsLine) {
    for (const row of preview.rows) row.groupKey = naturalKeyOf(definition, row.values) || null
  }
  const raw: DemoBatch['raw'] = {}
  for (const row of parsed.rows) raw[row.rowNumber] = Object.fromEntries(Object.entries(row.raw).map(([k, v]) => [k, cellText(v)]))
  batches().unshift({ id, definitionKey: definition.key, preview: clone(preview), raw })
  batches().splice(30)
  saveBatches()
  await wait(250)
  return preview
}

function findBatch(importId: string): DemoBatch {
  const batch = batches().find((b) => b.id === importId)
  if (!batch) throw apiError('IMPORT_EXPIRED', 'This import has expired. Upload the file again.')
  return batch
}

export async function demoCommit(importId: string, options: ImportCommitOptions): Promise<ImportResult> {
  const batch = findBatch(importId)
  if (batch.preview.status === 'committed') throw apiError('IMPORT_ALREADY_COMMITTED', 'This import was already committed.')
  const definition = importDefinition(batch.definitionKey)
  const context = batch.preview.context ?? {}
  const update = options.duplicates === 'update'
  const chosen = rowsToCommit(batch.preview.rows, options.mode, update)
  const chosenNumbers = new Set(chosen.map((r) => r.rowNumber))
  const result: ImportResult = {
    importId,
    entity: definition.key,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    invalid: batch.preview.rows.filter((r) => r.status === 'invalid').length,
    mode: options.mode,
    duplicates: update ? 'update' : 'skip',
    incompleteRecords: [],
    rows: [],
  }

  // Invoices: rows sharing an invoice number are lines of the same invoice.
  const groups: Array<typeof chosen> = []
  if (definition.repeatedKeyIsLine) {
    const byKey = new Map<string, typeof chosen>()
    for (const row of chosen) {
      const key = naturalKeyOf(definition, row.values)
      if (!byKey.has(key)) byKey.set(key, [])
      byKey.get(key)!.push(row)
    }
    groups.push(...byKey.values())
  } else chosen.forEach((row) => groups.push([row]))

  type Outcome = { outcome: 'created' | 'updated' | 'skipped' | 'failed'; recordId: string | null; message: string | null }
  const outcomes = new Map<number, Outcome>()
  for (const group of groups) {
    const row = group[0]
    const duplicate = row.status === 'duplicate'
    try {
      const applied = await applyRow(definition, context, row.values, group.map((r) => r.values), duplicate ? row.matchedExistingId ?? null : null)
      if (!applied) throw new Error('Not processed.')
      group.forEach((r, i) => outcomes.set(r.rowNumber, { outcome: duplicate ? 'updated' : 'created', recordId: applied.id, message: i ? `Line of the record of row ${row.rowNumber}.` : null }))
      if (duplicate) result.updated += 1
      else result.created += 1
      const missing = duplicate ? [] : (applied.missing ?? row.missing).filter((field) => !definition.columns.find((c) => c.key === field)?.required)
      if (missing.length) {
        result.incompleteRecords.push({
          entity: definition.key,
          id: applied.id,
          parentId: applied.parentId ?? null,
          label: applied.label,
          completeness: rowCompleteness(definition, row.values).percent,
          missing,
          editRoute: recordEditRoute(definition, applied),
          fieldIds: missing.map((f) => fieldIdOf(definition, f)),
        })
      }
    } catch (err) {
      console.error('[iCASCO] demo import row failed', err)
      group.forEach((r) => outcomes.set(r.rowNumber, { outcome: 'failed', recordId: null, message: err instanceof Error ? err.message : 'Failed' }))
      result.failed += 1
    }
  }
  for (const row of batch.preview.rows) {
    if (!chosenNumbers.has(row.rowNumber)) {
      outcomes.set(row.rowNumber, { outcome: 'skipped', recordId: null, message: null })
      result.skipped += 1
    }
    const o = outcomes.get(row.rowNumber) as Outcome
    row.outcome = o.outcome
    row.recordId = o.recordId
    row.outcomeMessage = o.message
    result.rows?.push({ rowNumber: row.rowNumber, outcome: o.outcome, recordId: o.recordId, message: o.message, status: row.status })
  }

  const store = incompleteStore()
  for (const record of result.incompleteRecords) {
    const existing = store.findIndex((r) => r.entity === record.entity && r.recordId === record.id)
    if (existing >= 0) store.splice(existing, 1)
    store.unshift({ ...record, id: `inc-${Date.now().toString(36)}-${store.length}`, recordId: record.id, importId, createdAt: now(), resolvedAt: null })
  }
  saveIncomplete()
  batch.preview.status = 'committed'
  batch.preview.result = { ...result, rows: undefined }
  saveBatches()
  await wait(300)
  return result
}

export async function demoHistory(entity?: ImportEntityKey): Promise<ImportHistoryItem[]> {
  await wait(60)
  return batches()
    .filter((b) => !entity || b.preview.entity === entity)
    .map((b) => ({
      id: b.id,
      entity: b.preview.entity,
      fileName: b.preview.fileName,
      createdAt: b.preview.createdAt ?? now(),
      createdBy: b.preview.createdBy ?? null,
      status: b.preview.status ?? 'preview',
      totals: b.preview.totals,
      completeness: b.preview.completeness,
      committedAt: b.preview.result ? b.preview.createdAt ?? null : null,
      result: resultTotals(b.preview.result),
    }))
}

export async function demoBatch(importId: string): Promise<ImportBatchDetail> {
  await wait(60)
  return clone(findBatch(importId).preview)
}

export async function demoErrorsFile(importId: string, lang: 'en' | 'ar', describe: Parameters<typeof buildErrorsBlob>[3]): Promise<Blob> {
  const batch = findBatch(importId)
  const definition = importDefinition(batch.definitionKey)
  const rows = batch.preview.rows.filter((r) => r.status !== 'ready' || r.outcome === 'failed').map((r) => ({ ...r, raw: batch.raw[r.rowNumber] ?? {} }))
  return buildErrorsBlob(definition, rows, lang, describe)
}

/** Re-reads the open records to complete from the demo store (fields filled since leave the list). */
async function recomputeIncomplete(): Promise<DemoIncomplete[]> {
  const store = incompleteStore()
  let changed = false
  for (const record of store) {
    if (record.resolvedAt) continue
    const missing = await currentMissing(record)
    if (missing === null || missing.length === 0) {
      record.resolvedAt = now()
      changed = true
    } else if (missing.length !== record.missing.length) {
      const definition = importDefinition(record.entity)
      record.missing = missing
      record.fieldIds = missing.map((f) => fieldIdOf(definition, f))
      changed = true
    }
  }
  if (changed) saveIncomplete()
  return store.filter((r) => !r.resolvedAt)
}

export async function demoIncomplete(entity?: ImportDefinitionKey, status: 'open' | 'resolved' | 'all' = 'open'): Promise<ImportIncompleteRecord[]> {
  await wait(80)
  const open = await recomputeIncomplete()
  const rows = status === 'open' ? open : incompleteStore().filter((r) => status === 'all' || r.resolvedAt)
  return rows
    .filter((r) => !entity || r.entity === entity)
    .map((r) => ({ ...clone(r), entityLabelEn: importDefinition(r.entity).labelEn, entityLabelAr: importDefinition(r.entity).labelAr }))
}

export async function demoResolveIncomplete(id: string): Promise<ImportIncompleteRecord> {
  await wait(80)
  const record = incompleteStore().find((r) => r.id === id)
  if (!record) throw apiError('NOT_FOUND', 'Record to complete not found.')
  if (!record.resolvedAt) {
    record.resolvedAt = now()
    saveIncomplete()
  }
  return clone(record)
}

export async function demoMigrationStatus(): Promise<MigrationStatus> {
  await wait(120)
  const open = await recomputeIncomplete()
  const committed = batches().filter((b) => b.preview.status === 'committed' && b.preview.result)
  const entities: MigrationEntityStatus[] = MIGRATION_ORDER.map((entity) => {
    const mine = committed.filter((b) => b.preview.entity === entity)
    const imported = mine.reduce((sum, b) => sum + (b.preview.result?.created ?? 0), 0)
    const updated = mine.reduce((sum, b) => sum + (b.preview.result?.updated ?? 0), 0)
    const incomplete = open.filter((r) => r.entity === entity).length
    const last = batches().find((b) => b.preview.entity === entity)
    const definition = IMPORT_DEFINITIONS[entity]
    return {
      entity,
      labelEn: definition.labelEn,
      labelAr: definition.labelAr,
      imported,
      updated,
      incomplete,
      status: !imported && !updated ? 'not_started' : incomplete ? 'in_progress' : 'completed',
      progress: imported ? Math.round(((imported - Math.min(incomplete, imported)) / imported) * 100) : updated ? 100 : 0,
      lastImport: last
        ? { id: last.id, fileName: last.preview.fileName, createdAt: last.preview.createdAt ?? now(), status: last.preview.status ?? 'preview', result: resultTotals(last.preview.result) }
        : null,
    }
  })
  const started = entities.filter((e) => e.status !== 'not_started')
  return {
    entities,
    overall: {
      entities: entities.length,
      started: started.length,
      completed: entities.filter((e) => e.status === 'completed').length,
      imported: entities.reduce((s, e) => s + e.imported, 0),
      incomplete: entities.reduce((s, e) => s + e.incomplete, 0),
      progress: Math.round(entities.reduce((s, e) => s + e.progress, 0) / entities.length),
      startedProgress: started.length ? Math.round(started.reduce((s, e) => s + e.progress, 0) / started.length) : 0,
    },
  }
}

/* ── Writing rows into the demo store ───────────────────────────────── */

interface Applied {
  id: string
  parentId?: string | null
  label: string
  /** Fields still missing after the write (defaults filled in), when different from the row's. */
  missing?: string[]
}

const labelOf = (definition: ImportDefinition, values: Record<string, unknown>) =>
  definition.labelColumns.map((k) => str(values[k])).filter(Boolean).join(' · ')

async function applyRow(
  definition: ImportDefinition,
  context: ImportContext,
  values: Record<string, unknown>,
  lines: Array<Record<string, unknown>>,
  existingId: string | null,
): Promise<Applied | null> {
  const label = labelOf(definition, values)
  switch (definition.key) {
    case 'clients':
      return { id: applyClient(values, existingId), label }
    case 'client_sites': {
      const c = clientById(str(values.organizationId))
      if (!c) throw new Error('CLIENT_NOT_FOUND')
      const site = existingId ? c.sites.find((s) => s.id === existingId) : undefined
      const patch = { name: str(values.siteName), address: str(values.address), employees: num(values.employeeCount) }
      if (site) Object.assign(site, Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== '' && v !== 0)))
      else c.sites.push({ id: `SITE-${Date.now().toString(36).toUpperCase()}${c.sites.length}`, ...patch })
      saveClients()
      return { id: site?.id ?? c.sites[c.sites.length - 1].id, parentId: c.id, label }
    }
    case 'contacts':
      return { id: applyContact(values, existingId), label }
    case 'personnel':
      return { id: applyEmployee(values, existingId), label }
    case 'trainings': {
      const employeeId = str(values.employeeId)
      const person = await fetchCompetencePerson(employeeId)
      if (!person) throw new Error('PERSON_NOT_FOUND')
      const trainings = [...(person.trainings ?? [])]
      const entry = { id: `tr-imp-${Date.now().toString(36)}${trainings.length}`, date: str(values.date), course: str(values.course), provider: str(values.provider), result: str(values.result) as 'Completed' | 'Pending' | 'Failed' }
      const index = existingId ? trainings.findIndex((t) => `${person.id}#${t.id}` === existingId) : -1
      if (index >= 0) trainings[index] = { ...trainings[index], ...entry, id: trainings[index].id }
      else trainings.unshift(entry)
      await updateCompetencePerson(employeeId, { trainings })
      return { id: `${person.id}#${index >= 0 ? trainings[index].id : entry.id}`, parentId: person.id, label }
    }
    case 'certificates':
      return { id: applyCertificate(values, existingId), label }
    case 'certification_cycles': {
      const initial = str(values.initialCertificationDate)
      const s1 = str(values.surveillance1DueDate) || addMonths(initial, 12)
      const s2 = str(values.surveillance2DueDate) || addMonths(initial, 24)
      const recert = str(values.recertificationDueDate) || addMonths(initial, 33)
      const notes = [str(values.notes), `Surveillance 1 due ${s1} · Surveillance 2 due ${s2} · Recertification due ${recert}`].filter(Boolean).join('\n')
      if (existingId) {
        const cycle = cycles().find((c) => c.id === existingId)
        if (cycle) {
          cycle.notes = notes
          cycle.initialCertificationDate = fmt(initial)
          saveCycles()
        }
        return { id: existingId, label }
      }
      const created = await createCertificationCycle({
        certificateId: str(values.certificateId),
        type: values.cycleType === 'recertification' ? 'recertification' : 'initial',
        initialCertificationDate: initial,
        notes,
      })
      const stored = cycles().find((c) => c.id === created.id)
      const next = [s1, s2, recert].find((d) => d >= new Date().toISOString().slice(0, 10)) ?? recert
      if (stored) {
        stored.nextSurveillanceDue = fmt(next)
        stored.nextSurveillanceDueInDays = Math.round((new Date(`${next}T00:00:00Z`).getTime() - Date.now()) / 86400000)
        saveCycles()
      }
      // Missing due dates were filled with the standard 12 / 24 / 33 months.
      return { id: created.id, label, missing: [] }
    }
    case 'audit_plans':
      return { id: await applyPlan(values, existingId), label }
    case 'audit_plan_sections':
      return applySection(values, context.auditPlanId ?? '', label)
    case 'nonconformities':
      return { id: applyNc(values, existingId), label }
    case 'invoices':
      return { id: applyInvoice(values, lines, existingId), label }
    case 'fee_items': {
      const input = {
        code: str(values.code) || null,
        name: str(values.name),
        nameAr: str(values.nameAr) || null,
        defaultAmount: num(values.defaultAmount),
        currency: str(values.currency) as FeeCurrency,
        unit: str(values.unit) || null,
        description: str(values.description) || null,
        ...(typeof values.isActive === 'boolean' ? { isActive: values.isActive } : {}),
        ...(typeof values.sortOrder === 'number' ? { sortOrder: values.sortOrder } : {}),
      }
      const item = existingId ? await updateFeeItem(existingId, input) : await createFeeItem(input)
      return { id: item.id, label }
    }
    case 'checklists':
      return { id: await applyChecklistItem(values, existingId), label }
    case 'accreditation_scope': {
      const { cab } = await getCabProfile()
      const schemes = clone(cab.schemes)
      const name = asStandardLabel(str(values.scheme))
      let scheme = schemes.find((s) => s.schemeName === name || standardOf(s.schemeName) === standardOf(name))
      if (!scheme) {
        scheme = { schemeName: name, location: str(values.location) || null, approvedScopeCodes: [] }
        schemes.push(scheme)
      }
      const code = str(values.scopeCode)
      scheme.approvedScopeCodes = Array.from(new Set([...(scheme.approvedScopeCodes ?? []), code]))
      await saveCabSetupDraft({ schemes })
      return { id: `${scheme.id ?? scheme.schemeName}#${code}`, label }
    }
    default:
      return null
  }
}

function applyClient(values: Record<string, unknown>, existingId: string | null): string {
  const records = clientRecords()
  const phone = str(values.contactPhone) ? splitPhone(str(values.contactPhone)) : { prefix: '', number: '' }
  const countryCode = str(values.country)
  const country = countryCode === 'EG' ? 'Egypt' : 'Saudi Arabia'
  const address = [str(values.buildingNumber), str(values.street), str(values.district), str(values.postalCode)].filter(Boolean).join(', ')
  if (existingId) {
    const c = records.find((r) => r.id === existingId)
    if (c) {
      const set = <K extends keyof DemoClient>(key: K, value: DemoClient[K] | '' | 0) => {
        if (value !== '' && value !== 0) c[key] = value as DemoClient[K]
      }
      set('tradeName', str(values.tradeName))
      set('crNumber', str(values.registrationNumber))
      set('city', str(values.city))
      set('address', address)
      set('legalCapacity', str(values.legalCapacity))
      set('industry', list(values.industries)[0] ?? '')
      set('activity', str(values.activity))
      set('employees', num(values.employeeCount))
      set('website', str(values.website))
      const pc = c.contacts.find((x) => x.isPrimary) ?? c.contacts[0]
      if (pc && phone.number) Object.assign(pc, { phonePrefix: phone.prefix, phone: phone.number })
      saveClients()
      return c.id
    }
  }
  const n = records.length + 1
  const id = `c1a${String(n).padStart(5, '0')}-${Date.now().toString(16).slice(-4)}-4c1a-9b11-${String(Date.now()).slice(-12)}`
  const [firstName, ...rest] = (str(values.contactName) || str(values.contactEmail).split('@')[0]).split(/\s+/)
  const created: DemoClient = {
    id,
    code: id.replace(/-/g, '').slice(0, 8).toUpperCase(),
    name: str(values.legalName),
    nameAr: '',
    tradeName: str(values.tradeName),
    legalCapacity: str(values.legalCapacity),
    industry: list(values.industries)[0] ?? '',
    activity: str(values.activity),
    country,
    countryCode: countryCode === 'EG' ? 'EG' : 'SA',
    city: str(values.city),
    address,
    addressAr: '',
    crNumber: str(values.registrationNumber),
    website: str(values.website),
    employees: num(values.employeeCount),
    currency: countryCode === 'EG' ? 'EGP' : 'SAR',
    contacts: [
      {
        id: `cnt-imp-${Date.now().toString(36)}${n}`,
        firstName: firstName ?? '',
        lastName: rest.join(' '),
        role: str(values.contactJobTitle) || 'Primary contact',
        email: str(values.contactEmail),
        phonePrefix: phone.prefix,
        phone: phone.number,
        isPrimary: true,
        isSignatory: true,
        portalAccess: true,
      },
    ],
    sites: [],
    createdAt: now(),
  }
  records.unshift(created)
  saveClients()
  return id
}

function applyContact(values: Record<string, unknown>, existingId: string | null): string {
  const c = clientById(str(values.organizationId))
  if (!c) throw new Error('CLIENT_NOT_FOUND')
  const phone = str(values.phone) ? splitPhone(str(values.phone)) : { prefix: '', number: '' }
  const status = str(values.status).toLowerCase() as ContactItem['status'] | ''
  const patch: Partial<ContactItem> = {
    firstName: str(values.firstName),
    lastName: str(values.lastName),
    email: str(values.email),
    jobTitle: str(values.jobTitle),
    phonePrefix: phone.prefix,
    phoneNumber: phone.number,
    isPrimaryContact: values.isPrimary === true,
    isAuthorizedSignatory: values.isSignatory === true,
  }
  const store = contacts()
  const existing = existingId ? store.find((x) => x.id === existingId) : undefined
  if (existing) {
    for (const [k, value] of Object.entries(patch)) if (value !== '' && value !== undefined) (existing as unknown as Record<string, unknown>)[k] = value
    saveContacts()
    return existing.id
  }
  const id = `cnt-imp-${Date.now().toString(36)}${store.length}`
  const linked = list(values.sites)
    .map((name) => c.sites.find((s) => norm(s.name) === norm(name))?.id)
    .filter((x): x is string => Boolean(x))
  store.unshift({
    id,
    contactCode: `CNT-${String(store.length + 1).padStart(4, '0')}`,
    clientId: c.id,
    clientName: c.name,
    clientCode: c.code,
    country: c.country,
    linkedSites: linked.length ? linked : c.sites[0] ? [c.sites[0].id] : [],
    status: status || 'active',
    createdAt: now().slice(0, 10),
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    phonePrefix: '',
    phoneNumber: '',
    isPrimaryContact: false,
    isAuthorizedSignatory: false,
    inviteToPortal: false,
    ...patch,
  })
  saveContacts()
  return id
}

function applyEmployee(values: Record<string, unknown>, existingId: string | null): string {
  const store = employees()
  const phone = str(values.phone) ? splitPhone(str(values.phone)) : null
  const start = str(values.employmentStartDate)
  const schemes = list(values.schemes).map(asStandardLabel)
  const role = (str(values.jobTitle) || null) as CabEmployee['professionalRole']
  const existing = existingId ? store.find((e) => e.id === existingId) : undefined
  if (existing) {
    if (role) existing.professionalRole = role
    if (start) existing.employmentStartDate = `${start}T00:00:00Z`
    if (schemes.length) existing.schemes = Array.from(new Set([...existing.schemes, ...schemes]))
    if (list(values.iafCodes).length) existing.iafCodes = Array.from(new Set([...existing.iafCodes, ...list(values.iafCodes)]))
    if (phone) Object.assign(existing.user, { phone: phone.number, phoneCountryCode: phone.prefix })
    existing.updatedAt = now()
    saveEmployees()
    return existing.id
  }
  const id = `emp-imp-${Date.now().toString(36)}${store.length}`
  store.unshift({
    id,
    userId: `usr-${id}`,
    cabId: DEMO_CAB.id,
    professionalRole: role,
    imageUrl: null,
    employmentStartDate: start ? `${start}T00:00:00Z` : null,
    employmentEndDate: str(values.employmentEndDate) ? `${str(values.employmentEndDate)}T00:00:00Z` : null,
    expiryDate: str(values.authorizationExpiry) ? `${str(values.authorizationExpiry)}T00:00:00Z` : null,
    iafCodes: list(values.iafCodes),
    schemes,
    status: str(values.status) || 'ACTIVE',
    createdAt: now(),
    updatedAt: now(),
    user: { id: `usr-${id}`, fullName: str(values.fullName), email: str(values.email), phone: phone?.number ?? null, phoneCountryCode: phone?.prefix ?? null, status: 'ACTIVE' },
  })
  saveEmployees()
  return id
}

function applyCertificate(values: Record<string, unknown>, existingId: string | null): string {
  const c = clientById(str(values.organizationId))
  if (!c) throw new Error('CLIENT_NOT_FOUND')
  const status = str(values.status)
  const expiry = str(values.expiryDate)
  const item: CertificateRegisterItem = {
    id: existingId ?? `cert-imp-${Date.now().toString(36)}${certificates().length}`,
    certificateNumber: str(values.certificateNumber),
    clientId: c.code,
    clientName: c.name,
    standard: asStandardLabel(str(values.standard)),
    scope: str(values.scope),
    // EXPIRED is not a stored status: an issued certificate whose expiry date has passed shows as expired.
    status: status === 'EXPIRED' ? 'ISSUED' : (status as CertificateRegisterItem['status']),
    countryCode: c.countryCode,
    issuedAt: `${str(values.issueDate)}T00:00:00Z`,
    validUntil: expiry ? `${expiry}T00:00:00Z` : null,
    version: 1,
    statusReason: str(values.statusReason) || (status === 'EXPIRED' ? 'Expired (migrated record)' : 'Migrated from the previous system'),
  }
  const store = certificates()
  const index = existingId ? store.findIndex((x) => x.id === existingId) : -1
  if (index >= 0) store[index] = { ...store[index], ...item, id: store[index].id }
  else store.unshift(item)
  saveCertificates()
  return item.id
}

async function applyPlan(values: Record<string, unknown>, existingId: string | null): Promise<string> {
  const c = clientById(str(values.organizationId))
  if (!c) throw new Error('CLIENT_NOT_FOUND')
  const standard = asStandardLabel(str(values.standard))
  const code = standardOf(standard).split(':')[0] as DemoStandardCode
  const standardName = STANDARDS[code] ? `${STANDARDS[code].name} (${standard})` : standard
  const start = str(values.startDate)
  const end = str(values.endDate)
  const days = Math.max(1, Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1)
  const lead = str(values.leadAuditor)
  const team = list(values.auditTeam)
  const site = c.sites.find((s) => norm(s.name) === norm(str(values.siteName)))
  const pc = c.contacts.find((x) => x.isPrimary) ?? c.contacts[0]
  const siteName = site?.name ?? str(values.siteName)
  const siteAddress = str(values.siteAddress) || site?.address || ''
  const fields: Partial<AuditPlan> = {
    organizationId: c.id,
    clientName: c.name,
    clientCode: c.code,
    country: c.country,
    stage: str(values.stage) as AuditPlan['stage'],
    standardName,
    reviewedDurationDays: days,
    totalEffortHours: days * 8,
    siteCode: site?.id ?? '',
    siteName,
    siteAddress,
    proposedStartDate: start,
    proposedEndDate: end,
    durationDays: days,
    leadAuditor: lead,
    auditTeam: team.length ? team : lead ? [lead] : [],
    auditObjectives: str(values.objectives),
    scopeSummary: str(values.scope),
    siteAllocation: { siteCode: site?.id ?? '', siteName, onSitePersonnel: team, siteAddress },
  }
  // Update: only the imported fields, never the agenda or the declarations.
  if (existingId) return (await saveAuditPlan({ ...fields, id: existingId })).id
  return (
    await saveAuditPlan({
      ...fields,
      applicationNumber: '',
      reviewedDurationCode: '',
      primaryContactName: pc ? `${pc.firstName} ${pc.lastName}`.trim() : '',
      primaryContactEmail: pc?.email ?? '',
      primaryContactPhone: pc ? `${pc.phonePrefix} ${pc.phone}`.trim() : '',
      timezone: c.countryCode === 'EG' ? 'Africa/Cairo' : 'Asia/Riyadh',
      status: 'Draft',
      remoteActivities: { enabled: false, activities: [], platform: '', notes: '' },
      travelNotes: { details: '' },
      teamDeclarations: { availabilityConfirmed: false, noConflictsDeclared: false },
      agendaActivities: [],
    })
  ).id
}

async function applySection(values: Record<string, unknown>, planRef: string, label: string): Promise<Applied> {
  const plan = await fetchAuditPlanById(planRef)
  if (!plan) throw new Error('PLAN_NOT_FOUND')
  const section = str(values.section)
  if (section === 'agenda') {
    const start = str(values.startTime)
    const end = str(values.endTime)
    const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
    const activity: AgendaActivity = {
      id: `act-imp-${Date.now().toString(36)}${plan.agendaActivities.length}`,
      date: str(values.date),
      startTime: start,
      endTime: end,
      activity: str(values.activity),
      auditors: list(values.auditors),
      durationHours: num(values.durationHours, Math.max(0, Math.round(((minutes(end) - minutes(start)) / 60) * 100) / 100)),
    }
    const agendaActivities = [...plan.agendaActivities, activity].sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
    await saveAuditPlan({ id: plan.id, agendaActivities, totalEffortHours: agendaActivities.reduce((s, a) => s + a.durationHours, 0) })
    return { id: `${plan.id}#${activity.id}`, parentId: plan.id, label }
  }
  if (section === 'site') {
    const siteName = str(values.siteName)
    const siteAddress = str(values.siteAddress) || plan.siteAllocation.siteAddress
    const personnel = list(values.onSitePersonnel)
    await saveAuditPlan({
      id: plan.id,
      siteName,
      siteAddress,
      siteAllocation: { siteCode: str(values.siteCode) || plan.siteAllocation.siteCode, siteName, siteAddress, onSitePersonnel: personnel.length ? personnel : plan.siteAllocation.onSitePersonnel },
    })
    return { id: `${plan.id}#site`, parentId: plan.id, label }
  }
  if (section === 'remote') {
    const remote = plan.remoteActivities
    await saveAuditPlan({
      id: plan.id,
      remoteActivities: {
        enabled: values.remoteEnabled !== false,
        activities: Array.from(new Set([...remote.activities, ...list(values.remoteActivities)])),
        platform: str(values.remotePlatform) || remote.platform,
        notes: [remote.notes, str(values.remoteNotes)].filter(Boolean).join('\n'),
      },
    })
    return { id: `${plan.id}#remote`, parentId: plan.id, label }
  }
  await saveAuditPlan({ id: plan.id, travelNotes: { details: [plan.travelNotes.details, str(values.travelDetails)].filter(Boolean).join('\n') } })
  return { id: `${plan.id}#travel`, parentId: plan.id, label }
}

function applyNc(values: Record<string, unknown>, existingId: string | null): string {
  const c = clientById(str(values.organizationId))
  if (!c) throw new Error('CLIENT_NOT_FOUND')
  const grade = str(values.grade).toLowerCase() as NonconformityItem['classification']
  const statusValue = (str(values.status) || 'OPEN').toLowerCase() as NonconformityItem['status']
  const due = str(values.dueDate)
  const raised = str(values.raisedDate) || now().slice(0, 10)
  const overdue = statusValue !== 'closed' && due < now().slice(0, 10)
  const labels: Record<string, string> = { open: 'Open', in_progress: 'In progress', submitted: 'Submitted', closed: 'Closed', overdue: 'Overdue' }
  const pc = c.contacts.find((x) => x.isPrimary) ?? c.contacts[0]
  const number = str(values.reference) || `NC-IMP-${String(ncs().length + 1).padStart(4, '0')}`
  const clause = str(values.clause)
  const item: NonconformityItem = {
    id: existingId ?? number.toLowerCase(),
    ncId: number,
    findingId: `F-${number}`,
    auditId: str(values.auditReference),
    clientName: c.name,
    clientId: c.code,
    country: c.country,
    classification: grade,
    classificationLabel: grade.charAt(0).toUpperCase() + grade.slice(1),
    description: clause ? `Clause ${clause}: ${str(values.description)}` : str(values.description),
    raisedDate: fmt(raised),
    raisedDateRaw: raised,
    dueDate: fmt(due),
    dueDateRaw: due,
    overdue,
    ownerName: str(values.owner) || (pc ? `${pc.firstName} ${pc.lastName}` : ''),
    status: overdue ? 'overdue' : statusValue,
    statusLabel: overdue ? labels.overdue : labels[statusValue] ?? statusValue,
    primaryContactName: pc ? `${pc.firstName} ${pc.lastName}` : '',
    primaryContactEmail: pc?.email ?? '',
    actions: [],
    attachments: [],
    history: [{ id: `h-${number}-imp`, text: 'Imported from the previous system', by: DEMO_CAB.admin.name, at: fmt(now()) }],
  }
  const store = ncs()
  const index = existingId ? store.findIndex((x) => x.id === existingId) : -1
  if (index >= 0) store[index] = { ...store[index], ...item, id: store[index].id, actions: store[index].actions, history: store[index].history }
  else store.unshift(item)
  saveNcs()
  return item.id
}

function applyInvoice(values: Record<string, unknown>, lines: Array<Record<string, unknown>>, existingId: string | null): string {
  const c = clientById(str(values.organizationId))
  if (!c) throw new Error('CLIENT_NOT_FOUND')
  const items = lines.map((line, i) => {
    const qty = num(line.quantity, 1) || 1
    const unitPrice = num(line.unitPrice)
    return { id: `line-imp-${i + 1}`, name: str(line.description), description: str(line.lineDetails), qty, unitPrice, amount: Math.round(qty * unitPrice * 100) / 100 }
  })
  const subtotal = items.reduce((s, i) => s + i.amount, 0)
  const rate = typeof values.taxPercent === 'number' ? values.taxPercent : null
  const total = Math.round(subtotal * (1 + (rate ?? 0) / 100) * 100) / 100
  const paid = Math.min(total, num(values.paidAmount))
  const draft = values.status === 'DRAFT'
  const status: CabInvoiceItem['status'] = draft ? 'Draft' : paid >= total && total > 0 ? 'Paid' : paid > 0 ? 'Partially paid' : 'Unpaid'
  const pc = c.contacts.find((x) => x.isPrimary) ?? c.contacts[0]
  const issue = str(values.issueDate)
  const due = str(values.dueDate)
  const number = str(values.invoiceNumber)
  const item: CabInvoiceItem = {
    id: existingId ?? number.toLowerCase(),
    invoiceNumber: number,
    clientName: c.name,
    clientCode: c.code,
    country: c.country,
    issuedDate: fmt(issue),
    dueDate: due ? fmt(due) : '',
    currency: str(values.currency),
    amount: total,
    paidAmount: paid,
    balance: Math.round((total - paid) * 100) / 100,
    status,
    organizationId: c.id,
    siteId: c.sites[0]?.id ?? '',
    contactId: pc?.id ?? '',
    documentIds: [],
    relatedOrder: '',
    orderStatus: 'Imported',
    relatedApplication: '',
    poReference: str(values.poReference) || undefined,
    primaryContact: pc ? `${pc.firstName} ${pc.lastName}` : '',
    contactEmail: pc?.email ?? '',
    billingAddress: { name: c.name, line1: c.address.split(',')[0] ?? '', cityArea: c.city, country: c.country },
    taxRate: rate === null ? undefined : { id: `rate-${rate}`, label: `VAT (${rate}%)`, percentage: rate },
    items,
    installments: [],
    attachments: [],
    payments:
      paid > 0
        ? [{ id: `pay-imp-${number}`, amount: paid, date: fmt(str(values.paymentDate) || issue), method: str(values.paymentMethod) || 'Imported', reference: str(values.paymentReference) || number, note: 'Paid before migration' }]
        : [],
  }
  const store = invoices()
  const index = existingId ? store.findIndex((x) => x.id === existingId) : -1
  if (index >= 0) store[index] = { ...store[index], ...item, id: store[index].id }
  else store.unshift(item)
  saveInvoices()
  return item.id
}

/** CAB checklists with their items (the import works item by item). */
async function cabChecklistsWithItems(): Promise<ChecklistTemplate[]> {
  const list = await listChecklists({ source: 'cab', includeArchived: true })
  return Promise.all(list.map((c) => getChecklist(c.id as string)))
}

const splitPrompts = (v: unknown) => str(v).split(/\n|\|/).map((x) => x.trim()).filter(Boolean)

/** One checklist item row: appended to (or replacing an item of) the CAB checklist with that code. */
async function applyChecklistItem(values: Record<string, unknown>, existingId: string | null): Promise<string> {
  const code = str(values.checklistCode).trim().toUpperCase().replace(/\s+/g, '-')
  const item: ChecklistItemData = {
    ...emptyChecklistItem(),
    code: str(values.itemCode),
    clause: str(values.clause),
    title: str(values.title),
    titleAr: str(values.titleAr),
    requirement: str(values.requirement),
    requirementAr: str(values.requirementAr),
    guidance: str(values.guidance),
    guidanceAr: str(values.guidanceAr),
    evidencePrompts: splitPrompts(values.evidencePrompts),
    evidencePromptsAr: splitPrompts(values.evidencePromptsAr),
    stages: (Array.isArray(values.stages) ? values.stages : []) as ChecklistStageKey[],
    samplingHint: str(values.samplingHint),
    mandatory: typeof values.mandatory === 'boolean' ? values.mandatory : true,
  }
  const all = await cabChecklistsWithItems()
  const owner = all.find((c) => c.code === code)
  let saved: ChecklistTemplate
  if (!owner) {
    saved = await createChecklist({ code, name: str(values.checklistName) || code, standardCode: str(values.standardCode) || 'CUSTOM', kind: 'CUSTOM', items: [item] })
  } else {
    const items = owner.items ?? []
    const next = existingId && items.some((i) => i.id === existingId) ? items.map((i) => (i.id === existingId ? { ...item, id: i.id, code: i.code } : i)) : [...items, item]
    saved = await updateChecklist(owner.id as string, { items: next })
  }
  const found = (saved.items ?? []).find((i) => (existingId ? i.id === existingId : i.clause === item.clause && i.title === item.title))
  return found?.id ?? saved.id ?? code
}

/* ── Is an imported record still incomplete? ────────────────────────── */

/**
 * Fields still missing on the stored record; null when the record no longer exists.
 */
async function currentMissing(record: DemoIncomplete): Promise<string[] | null> {
  const has = (value: unknown) => value !== undefined && value !== null && value !== '' && value !== 0 && !(Array.isArray(value) && value.length === 0)
  // Fields the preview does not store stay missing until the record is dismissed.
  const keep = (present: Record<string, unknown>) => record.missing.filter((field) => !(field in present) || !has(present[field]))
  const id = record.recordId
  switch (record.entity) {
    case 'clients': {
      const c = clientById(id)
      if (!c) return null
      const pc = c.contacts.find((x) => x.isPrimary) ?? c.contacts[0]
      return keep({
        tradeName: c.tradeName,
        registrationNumber: c.crNumber,
        activity: c.activity,
        employeeCount: c.employees,
        country: c.countryCode,
        city: c.city,
        contactName: pc ? `${pc.firstName} ${pc.lastName}`.trim() : '',
        contactPhone: pc?.phone,
      })
    }
    case 'client_sites': {
      const site = clientById(record.parentId ?? '')?.sites.find((s) => s.id === id)
      return site ? keep({ address: site.address, employeeCount: site.employees }) : null
    }
    case 'contacts': {
      const x = contacts().find((c) => c.id === id)
      return x ? keep({ jobTitle: x.jobTitle, phone: x.phoneNumber }) : null
    }
    case 'personnel': {
      const e = employees().find((x) => x.id === id)
      return e ? keep({ phone: e.user.phone, jobTitle: e.professionalRole, schemes: e.schemes, iafCodes: e.iafCodes, employmentStartDate: e.employmentStartDate }) : null
    }
    case 'trainings': {
      const [personId, trainingId] = id.split('#')
      const person = await fetchCompetencePerson(personId)
      const training = person?.trainings?.find((t) => t.id === trainingId)
      return training ? keep({ provider: training.provider }) : null
    }
    case 'certificates': {
      const cert = certificates().find((x) => x.id === id)
      if (!cert) return null
      const cycle = cycles().find((c) => c.certificate.certificateNumber === cert.certificateNumber)
      return keep({ initialCertificationDate: cycle?.initialCertificationDate })
    }
    case 'audit_plans': {
      const plan = auditPlans().find((p) => p.id === id)
      return plan ? keep({ leadAuditor: plan.leadAuditor, scope: plan.scopeSummary }) : null
    }
    case 'audit_plan_sections': {
      const [planId, part] = id.split('#')
      const plan = auditPlans().find((p) => p.id === planId)
      if (!plan) return null
      if (part === 'remote') return keep({ remoteActivities: plan.remoteActivities.activities, remotePlatform: plan.remoteActivities.platform })
      if (part === 'site') return keep({ siteAddress: plan.siteAllocation.siteAddress, onSitePersonnel: plan.siteAllocation.onSitePersonnel })
      if (part === 'travel') return keep({})
      const activity = plan.agendaActivities.find((a) => a.id === part)
      return activity ? keep({ auditors: activity.auditors }) : null
    }
    case 'nonconformities': {
      const nc = ncs().find((x) => x.id === id)
      return nc ? keep({ reference: nc.ncId, raisedDate: nc.raisedDateRaw, owner: nc.ownerName }) : null
    }
    case 'invoices': {
      const inv = invoices().find((x) => x.id === id)
      return inv ? keep({ dueDate: inv.dueDate, taxPercent: inv.taxRate ? inv.taxRate.percentage + 1 : null }) : null
    }
    case 'fee_items': {
      const item = (await listFeeItems({ includeInactive: true })).find((f) => f.id === id)
      return item ? keep({ nameAr: item.nameAr, code: item.code, unit: item.unit }) : null
    }
    case 'checklists': {
      for (const c of await cabChecklistsWithItems()) {
        const item = (c.items ?? []).find((i) => i.id === id)
        if (item) return keep({ checklistName: c.name, standardCode: c.standardCode, titleAr: item.titleAr, requirementAr: item.requirementAr })
      }
      return null
    }
    default:
      return keep({})
  }
}
