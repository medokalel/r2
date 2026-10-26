/**
 * Excel import (data migration) types, shared by the data layer (`lib/api/importsApi.ts`),
 * the entity catalogue (`lib/imports/entities.ts`), the in-browser engine used by the preview
 * and the import wizard. The JSON shapes follow the API contract of `/api/v1/cab/imports`.
 */

export const IMPORT_ENTITY_KEYS = [
  'clients',
  'client_sites',
  'contacts',
  'personnel',
  'trainings',
  'certificates',
  'certification_cycles',
  'audit_plans',
  'nonconformities',
  'invoices',
  'fee_items',
  'accreditation_scope',
  'checklists',
] as const

export type ImportEntityKey = (typeof IMPORT_ENTITY_KEYS)[number]

/**
 * Definition variant: `audit_plan_sections` is the one-plan template of the Build audit plan page.
 * It is sent to the API as entity `audit_plans` with `context.auditPlanId`.
 */
export type ImportDefinitionKey = ImportEntityKey | 'audit_plan_sections'

export type ImportColumnType =
  | 'text'
  | 'longtext'
  | 'email'
  | 'phone'
  | 'date'
  | 'time'
  | 'number'
  | 'integer'
  | 'money'
  | 'enum'
  | 'list'
  | 'country'
  | 'boolean'

export interface ImportAllowedValue {
  value: string
  labelEn: string
  labelAr: string
}

/** Where a column's allowed values come from when they depend on the CAB's own data. */
export type ImportListSource =
  | 'countries'
  | 'currencies'
  | 'standards'
  | 'roles'
  | 'clients'
  | 'personnel'
  | 'iafCodes'

/** A column of a template. `key` is the technical key written in the hidden key row. */
export interface ImportColumn {
  key: string
  labelEn: string
  labelAr: string
  type: ImportColumnType
  /** Identity field: without it the record cannot be created (row is `invalid`). */
  required?: boolean
  /** Needed later: the record is created without it and flagged `partial`. */
  later?: boolean
  /** Required only when another column holds one of the values (e.g. agenda rows of a plan template). */
  requiredIf?: { field: string; in: string[] }
  /** Needed later only when another column holds one of the values. */
  laterIf?: { field: string; in: string[] }
  /** Fixed allowed values (enum / list). */
  allowed?: ImportAllowedValue[]
  /** Allowed values taken from the CAB's data. */
  listSource?: ImportListSource
  /** List column whose items are free text (no allowed values). */
  freeList?: boolean
  /** Example value written in the example row. */
  example: string
  hintEn?: string
  hintAr?: string
  /** Max characters for text. */
  max?: number
}

/** GET /cab/imports/entities item. */
export interface ImportEntityInfo {
  key: ImportDefinitionKey
  labelEn: string
  labelAr: string
  descriptionEn?: string
  descriptionAr?: string
  route: string
  templateFileName?: string
  templateVersion?: string
  contextRequired?: string[]
  columns: Array<{
    key: string
    labelEn: string
    labelAr: string
    required: boolean
    importance?: 'required' | 'recommended' | 'optional'
    type: string
    allowed?: string[]
    allowedAr?: string[]
    hintEn?: string
    hintAr?: string
    fieldId?: string
  }>
}

export type ImportRowStatus = 'ready' | 'partial' | 'invalid' | 'duplicate'
export type ImportRowOutcome = 'created' | 'updated' | 'skipped' | 'failed'

export interface ImportRowIssue {
  field: string
  code: string
  message: string
}

export interface ImportPreviewRow {
  rowNumber: number
  status: ImportRowStatus
  completeness: number
  values: Record<string, unknown>
  missing: string[]
  errors: ImportRowIssue[]
  warnings: ImportRowIssue[]
  matchedExistingId?: string | null
  /** Rows of one record (invoice lines) share a group key. */
  groupKey?: string | null
  /** After the commit. */
  outcome?: ImportRowOutcome
  recordId?: string | null
  outcomeMessage?: string | null
}

export interface ImportTotals {
  rows: number
  ready: number
  partial: number
  invalid: number
  duplicates: number
}

export type ImportBatchStatus = 'preview' | 'committing' | 'committed' | 'expired' | 'failed'

export interface ImportPreview {
  importId: string
  /** `audit_plan_sections` for the one-plan import. */
  entity: ImportDefinitionKey
  fileName: string
  templateVersion: string | null
  expectedTemplateVersion?: string
  templateOutdated?: boolean
  status?: ImportBatchStatus
  context?: ImportContext
  createdAt?: string
  createdBy?: string | null
  expiresAt?: string
  totals: ImportTotals
  completeness: number
  columnsRecognised: string[]
  columnsMissing: string[]
  columnsUnknown?: string[]
  rows: ImportPreviewRow[]
  /** Set once committed (GET /cab/imports/:importId). */
  result?: ImportResult | null
}

export type ImportCommitMode = 'complete_only' | 'include_partial'

export interface ImportCommitOptions {
  mode: ImportCommitMode
  /** Rows that match an existing record: skip (default) or update it. */
  duplicates?: 'skip' | 'update'
  /** Clients only: portal welcome e-mail to each created client (default true). */
  sendWelcomeEmails?: boolean
}

/**
 * A record created from a partial row that still misses fields. In a commit result `id` is the
 * record id; in GET /cab/imports/incomplete `id` is the list entry and `recordId` the record.
 */
export interface ImportIncompleteRecord {
  id: string
  recordId?: string
  entity: ImportDefinitionKey
  entityLabelEn?: string
  entityLabelAr?: string
  /** Owner record (organization of a site, employee of a training, plan of a section); preview only. */
  parentId?: string | null
  label: string
  completeness: number
  missing: string[]
  editRoute: string
  fieldIds: string[]
  importId?: string | null
  createdAt?: string
  resolvedAt?: string | null
}

export interface ImportResult {
  importId: string
  entity?: ImportDefinitionKey
  created: number
  updated: number
  skipped: number
  failed: number
  invalid?: number
  mode?: ImportCommitMode
  duplicates?: 'skip' | 'update'
  incompleteRecords: ImportIncompleteRecord[]
  rows?: Array<{ rowNumber: number; outcome: ImportRowOutcome; recordId: string | null; message: string | null; status: ImportRowStatus }>
}

export interface ImportHistoryItem {
  id: string
  entity: ImportDefinitionKey
  fileName: string
  createdAt: string
  createdBy: string | null
  status: ImportBatchStatus
  totals: ImportTotals
  completeness?: number
  committedAt?: string | null
  result?: { created: number; updated: number; skipped: number; failed: number } | null
}

/** GET /cab/imports/:importId: the preview with its row outcomes and the result. */
export type ImportBatchDetail = ImportPreview

export interface MigrationEntityStatus {
  entity: ImportEntityKey
  labelEn?: string
  labelAr?: string
  imported: number
  updated: number
  incomplete: number
  status: 'not_started' | 'in_progress' | 'completed'
  progress: number
  lastImport: { id: string; fileName: string; createdAt: string; status: ImportBatchStatus; result: ImportHistoryItem['result'] } | null
}

/** GET /cab/imports/migration-status. */
export interface MigrationStatus {
  entities: MigrationEntityStatus[]
  overall: { entities: number; started: number; completed: number; imported: number; incomplete: number; progress: number; startedProgress: number }
}

/** Optional context sent with a preview (multipart field `context`, JSON). */
export interface ImportContext {
  auditPlanId?: string
}
