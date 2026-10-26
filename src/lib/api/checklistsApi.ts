/**
 * Checklist library: the iCASCO library (read-only, approved by the product owner on 25 October 2026) and the
 * CAB's own checklists (copied from the library or written from scratch).
 *
 * Real endpoints (CAB, scoped to the signed-in CAB):
 *   GET    /cab/checklists?source&standardCode&search&includeArchived   → ChecklistTemplate[] (summaries)
 *   GET    /cab/checklists/library/:key                                → ChecklistTemplate (with items)
 *   POST   /cab/checklists   { fromLibrary | fromChecklistId | name, standardCode, items } → ChecklistTemplate
 *   GET    /cab/checklists/:id                                         → ChecklistTemplate
 *   PATCH  /cab/checklists/:id  { header fields, status, isDefault, items }   (items replace the list, version + 1)
 *   DELETE /cab/checklists/:id
 * Excel import entity: `checklists` (one row per item, grouped by checklist code).
 * In the preview (demo mode) the library comes from the same JSON files and CAB checklists live in the demo store.
 */

import { authorizedRequest } from '@/lib/api/authorizedClient'
import { clone, isDemoMode, loadState, saveState, wait } from '@/lib/api/demo/demoStore'
import { loadLibrary } from '@/lib/checklists/library'

export type ChecklistStageKey = 'stage1' | 'stage2' | 'surveillance' | 'recertification' | 'special'
export const CHECKLIST_STAGES: ChecklistStageKey[] = ['stage1', 'stage2', 'surveillance', 'recertification', 'special']
export type ChecklistKind = 'STANDARD' | 'IMS' | 'STAGE1_READINESS' | 'CUSTOM'

export interface ChecklistItemData {
  id: string | null
  code: string
  clause: string
  title: string
  titleAr: string
  requirement: string
  requirementAr: string
  guidance: string
  guidanceAr: string
  evidencePrompts: string[]
  evidencePromptsAr: string[]
  /** Empty = every stage. */
  stages: ChecklistStageKey[]
  samplingHint: string
  samplingHintAr: string
  mandatory: boolean
  /** Harmonized Structure clause (merged in the integrated view). */
  common: boolean
}

export interface ChecklistTemplate {
  /** null for a library checklist. */
  id: string | null
  /** Library key (e.g. "iso-9001"), null for a CAB checklist. */
  key: string | null
  source: 'library' | 'cab'
  code: string
  name: string
  nameAr: string
  description: string
  standardCode: string
  standardLabel: string
  kind: ChecklistKind
  version: string
  status: 'ACTIVE' | 'ARCHIVED'
  /** Library content waiting for the product owner's review (false: the library is approved). */
  draft: boolean
  /** Review status of a library checklist ("approved" since 25 October 2026); null or absent for CAB checklists. */
  reviewStatus?: 'draft' | 'approved' | null
  /** Approval date of a library checklist (YYYY-MM-DD). */
  approvedOn?: string | null
  isDefault: boolean
  reviewNote: { en: string; ar: string } | null
  sourceKey: string | null
  itemCount: number
  updatedAt: string | null
  /** Detail calls only. */
  items?: ChecklistItemData[]
}

export interface ChecklistFilters {
  source?: 'library' | 'cab'
  standardCode?: string
  search?: string
  includeArchived?: boolean
}

export interface ChecklistInput {
  fromLibrary?: string
  fromChecklistId?: string
  code?: string
  name?: string
  nameAr?: string
  description?: string
  standardCode?: string
  standardLabel?: string
  kind?: ChecklistKind
  isDefault?: boolean
  status?: 'ACTIVE' | 'ARCHIVED'
  items?: ChecklistItemData[]
}

/** Blank item for the editor. */
export const emptyChecklistItem = (): ChecklistItemData => ({
  id: null,
  code: '',
  clause: '',
  title: '',
  titleAr: '',
  requirement: '',
  requirementAr: '',
  guidance: '',
  guidanceAr: '',
  evidencePrompts: [],
  evidencePromptsAr: [],
  stages: [],
  samplingHint: '',
  samplingHintAr: '',
  mandatory: true,
  common: false,
})

/* ── Demo store ─────────────────────────────────────────────────────────── */

const DEMO_KEY = 'checklists.cab'
const cabChecklists = () => loadState<ChecklistTemplate[]>(DEMO_KEY, () => [])
const saveCab = (list: ChecklistTemplate[]) => saveState(DEMO_KEY, list)
const summary = ({ items, ...rest }: ChecklistTemplate): ChecklistTemplate => ({ ...rest, itemCount: items?.length ?? rest.itemCount })
const normalizeCode = (code: string) => code.trim().toUpperCase().replace(/\s+/g, '-')

function freeCode(base: string): string {
  const root = normalizeCode(base).slice(0, 40) || 'CHECKLIST'
  const taken = new Set(cabChecklists().map((c) => c.code))
  if (!taken.has(root)) return root
  for (let n = 2; ; n += 1) if (!taken.has(`${root}-${n}`)) return `${root}-${n}`
}

function withCodes(items: ChecklistItemData[], prefix: string): ChecklistItemData[] {
  const used = new Set<string>()
  return items.map((item, index) => {
    let code = item.code.trim()
    if (!code || used.has(code)) code = `${prefix}-${String(index + 1).padStart(2, '0')}`
    used.add(code)
    return { ...item, id: item.id ?? `ci-${Date.now()}-${index}`, code }
  })
}

function demoMatches(c: ChecklistTemplate, filters: ChecklistFilters): boolean {
  const q = filters.search?.trim().toLowerCase()
  return (
    (!filters.standardCode || c.standardCode === filters.standardCode) &&
    (filters.includeArchived || c.status === 'ACTIVE') &&
    (!q || [c.name, c.nameAr, c.code, c.standardLabel].some((v) => v.toLowerCase().includes(q)))
  )
}

/* ── Data layer ─────────────────────────────────────────────────────────── */

export async function listChecklists(filters: ChecklistFilters = {}): Promise<ChecklistTemplate[]> {
  if (!isDemoMode()) {
    const qs = new URLSearchParams()
    if (filters.source) qs.set('source', filters.source)
    if (filters.standardCode) qs.set('standardCode', filters.standardCode)
    if (filters.search?.trim()) qs.set('search', filters.search.trim())
    if (filters.includeArchived) qs.set('includeArchived', 'true')
    const query = qs.toString()
    return authorizedRequest<ChecklistTemplate[]>(`/cab/checklists${query ? `?${query}` : ''}`)
  }
  await wait(80)
  const library = filters.source === 'cab' ? [] : (await loadLibrary()).map(summary)
  const own = filters.source === 'library' ? [] : cabChecklists().map(summary)
  return [...library, ...own].filter((c) => demoMatches(c, filters))
}

export async function getLibraryChecklist(key: string): Promise<ChecklistTemplate> {
  if (!isDemoMode()) return authorizedRequest<ChecklistTemplate>(`/cab/checklists/library/${encodeURIComponent(key)}`)
  const found = (await loadLibrary()).find((c) => c.key === key)
  if (!found) throw new Error('Library checklist not found.')
  return clone(found)
}

export async function getChecklist(id: string): Promise<ChecklistTemplate> {
  if (!isDemoMode()) return authorizedRequest<ChecklistTemplate>(`/cab/checklists/${encodeURIComponent(id)}`)
  await wait(60)
  const found = cabChecklists().find((c) => c.id === id)
  if (!found) throw new Error('Checklist not found.')
  return clone(found)
}

export async function createChecklist(input: ChecklistInput): Promise<ChecklistTemplate> {
  if (!isDemoMode()) return authorizedRequest<ChecklistTemplate>('/cab/checklists', { method: 'POST', body: JSON.stringify(input) })
  await wait()
  let source: ChecklistTemplate | null = null
  if (input.fromLibrary) source = await getLibraryChecklist(input.fromLibrary)
  if (input.fromChecklistId) {
    const own = await getChecklist(input.fromChecklistId)
    source = { ...own, name: `${own.name} (copy)` }
  }
  const name = input.name ?? source?.name
  const standardCode = input.standardCode ?? source?.standardCode
  if (!name || !standardCode) throw new Error('Name and standard code are required.')
  const code = input.code ? normalizeCode(input.code) : freeCode(source?.sourceKey ?? standardCode)
  if (cabChecklists().some((c) => c.code === code)) throw new Error('Another checklist already uses this code.')
  const items = withCodes(input.items ?? source?.items ?? [], code.slice(0, 12))
  const created: ChecklistTemplate = {
    id: `cl-${Date.now()}`,
    key: null,
    source: 'cab',
    code,
    name,
    nameAr: input.nameAr ?? source?.nameAr ?? '',
    description: input.description ?? source?.description ?? '',
    standardCode,
    standardLabel: input.standardLabel ?? source?.standardLabel ?? '',
    kind: input.kind ?? source?.kind ?? 'CUSTOM',
    version: '1',
    status: 'ACTIVE',
    draft: false,
    isDefault: Boolean(input.isDefault),
    reviewNote: null,
    sourceKey: source?.sourceKey ?? null,
    itemCount: items.length,
    updatedAt: new Date().toISOString(),
    items,
  }
  const list = cabChecklists().map((c) => (created.isDefault && c.standardCode === standardCode ? { ...c, isDefault: false } : c))
  saveCab([...list, created])
  return clone(created)
}

export async function updateChecklist(id: string, input: ChecklistInput): Promise<ChecklistTemplate> {
  if (!isDemoMode()) return authorizedRequest<ChecklistTemplate>(`/cab/checklists/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) })
  await wait()
  const list = cabChecklists()
  const current = list.find((c) => c.id === id)
  if (!current) throw new Error('Checklist not found.')
  const next: ChecklistTemplate = {
    ...current,
    ...Object.fromEntries(Object.entries(input).filter(([k, v]) => v !== undefined && k !== 'items')),
    updatedAt: new Date().toISOString(),
  }
  if (input.items) {
    next.items = withCodes(input.items, current.code.slice(0, 12))
    next.itemCount = next.items.length
    next.version = String(Number(current.version) + 1)
  }
  if (next.status === 'ARCHIVED') next.isDefault = false
  saveCab(list.map((c) => (c.id === id ? next : next.isDefault && c.standardCode === next.standardCode ? { ...c, isDefault: false } : c)))
  return clone(next)
}

export async function deleteChecklist(id: string): Promise<void> {
  if (!isDemoMode()) {
    await authorizedRequest<{ id: string }>(`/cab/checklists/${encodeURIComponent(id)}`, { method: 'DELETE' })
    return
  }
  await wait()
  saveCab(cabChecklists().filter((c) => c.id !== id))
}

/** The CAB's ACTIVE default checklist for a standard, else the library one (used when an audit starts in the preview). */
export async function checklistSourceFor(standardCode: string): Promise<ChecklistTemplate | null> {
  const own = cabChecklists().find((c) => c.standardCode === standardCode && c.status === 'ACTIVE' && c.isDefault)
  if (own) return clone(own)
  const lib = (await loadLibrary()).find((c) => c.standardCode === standardCode)
  return lib ? clone(lib) : null
}

/** Library or CAB checklist by reference ("library:<key>" or a CAB checklist id) in the preview. */
export async function checklistByRef(ref: string): Promise<ChecklistTemplate> {
  return ref.startsWith('library:') ? getLibraryChecklist(ref.slice('library:'.length)) : getChecklist(ref)
}
