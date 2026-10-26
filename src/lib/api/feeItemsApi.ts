/**
 * Fee-schedule catalog API — the CAB-managed list of billable fee items (name EN/AR, default
 * amount, currency, unit) offered when adding invoice line items, plus the CAB's invoice
 * currencies.
 *
 * CAB (CAB_ADMIN, scoped by the JWT):
 *   GET    /cab/fee-items?includeInactive&search   → FeeItem[]
 *   POST   /cab/fee-items                          → FeeItem
 *   PATCH  /cab/fee-items/:id                      → FeeItem
 *   DELETE /cab/fee-items/:id
 *   GET    /cab/fee-items/currencies               → FeeCurrencySettings
 *   PUT    /cab/fee-items/currencies { allowed }   → FeeCurrencySettings
 * Client (audit-client account, read-only):
 *   GET    /fee-items                              → FeeCatalog (active items + currencies)
 *
 * In the preview (demo mode) the catalog lives in the shared demo store.
 */

import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isAuditClientSession } from '@/lib/authStorage'
import { clone, isDemoMode, loadState, saveState, wait } from '@/lib/api/demo/demoStore'

export const SUPPORTED_CURRENCIES = ['SAR', 'EGP', 'USD', 'EUR', 'AED', 'GBP'] as const
export type FeeCurrency = (typeof SUPPORTED_CURRENCIES)[number]
export const DEFAULT_CURRENCIES: FeeCurrency[] = ['SAR', 'EGP', 'USD', 'EUR', 'AED']

export interface FeeItem {
  id: string
  code: string | null
  name: string
  nameAr: string | null
  description: string | null
  unit: string | null
  defaultAmount: number
  currency: FeeCurrency
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface FeeItemInput {
  code?: string | null
  name: string
  nameAr?: string | null
  description?: string | null
  unit?: string | null
  defaultAmount: number
  currency: FeeCurrency
  isActive?: boolean
  sortOrder?: number
}

export interface FeeCurrencySettings {
  allowed: FeeCurrency[]
  supported: FeeCurrency[]
}

/** What the "Add item" dialog needs: the items it may offer and the currencies it may use. */
export interface FeeCatalog {
  items: FeeItem[]
  currencies: FeeCurrency[]
}

// ── Demo store ───────────────────────────────────────────────────────────────

interface DemoFeeState {
  items: FeeItem[]
  allowed: FeeCurrency[]
}

const DEMO_KEY = 'fee-items'

function seedFeeState(): DemoFeeState {
  const at = '2026-10-01T08:00:00.000Z'
  const item = (
    id: string,
    code: string,
    name: string,
    nameAr: string,
    unit: string,
    defaultAmount: number,
    sortOrder: number,
  ): FeeItem => ({
    id,
    code,
    name,
    nameAr,
    description: null,
    unit,
    defaultAmount,
    currency: 'SAR',
    isActive: true,
    sortOrder,
    createdAt: at,
    updatedAt: at,
  })
  return {
    allowed: [...DEFAULT_CURRENCIES],
    items: [
      item('fee-0001', 'APP-FEE', 'Application review fee', 'رسوم مراجعة الطلب', 'per application', 1500, 0),
      item('fee-0002', 'S1-DAY', 'Stage 1 audit, per auditor day', 'تدقيق المرحلة الأولى، لكل يوم مدقق', 'per auditor day', 3000, 1),
      item('fee-0003', 'S2-DAY', 'Stage 2 audit, per auditor day', 'تدقيق المرحلة الثانية، لكل يوم مدقق', 'per auditor day', 3000, 2),
      item('fee-0004', 'CERT-ISS', 'Certificate issuance fee', 'رسوم إصدار الشهادة', 'per certificate', 750, 3),
      item('fee-0005', 'SURV-DAY', 'Surveillance audit, per auditor day', 'تدقيق المراقبة، لكل يوم مدقق', 'per auditor day', 2800, 4),
    ],
  }
}

const demoState = () => loadState<DemoFeeState>(DEMO_KEY, seedFeeState)
const saveDemo = (state: DemoFeeState) => saveState(DEMO_KEY, state)
const byOrder = (a: FeeItem, b: FeeItem) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt)
const ordered = (codes: FeeCurrency[]) => SUPPORTED_CURRENCIES.filter((code) => codes.includes(code))

function demoError(message: string): Error {
  return new Error(message)
}

function normalizeInput(input: Partial<FeeItemInput>): Partial<FeeItem> {
  const blank = (value: string | null | undefined) => (value == null || value.trim() === '' ? null : value.trim())
  const out: Partial<FeeItem> = {}
  if (input.name !== undefined) out.name = input.name.trim()
  if (input.nameAr !== undefined) out.nameAr = blank(input.nameAr)
  if (input.description !== undefined) out.description = blank(input.description)
  if (input.unit !== undefined) out.unit = blank(input.unit)
  if (input.code !== undefined) out.code = blank(input.code)?.toUpperCase() ?? null
  if (input.defaultAmount !== undefined) out.defaultAmount = Math.round(input.defaultAmount * 100) / 100
  if (input.currency !== undefined) out.currency = input.currency
  if (input.isActive !== undefined) out.isActive = input.isActive
  if (input.sortOrder !== undefined) out.sortOrder = input.sortOrder
  return out
}

function assertDemoItem(state: DemoFeeState, changes: Partial<FeeItem>, id?: string) {
  if (changes.currency && !state.allowed.includes(changes.currency)) {
    throw demoError(`Currency ${changes.currency} is not one of the CAB's invoice currencies.`)
  }
  if (changes.code && state.items.some((item) => item.code === changes.code && item.id !== id)) {
    throw demoError('Another fee item already uses this code.')
  }
}

// ── CAB catalog ──────────────────────────────────────────────────────────────

export async function listFeeItems(params: { includeInactive?: boolean; search?: string } = {}): Promise<FeeItem[]> {
  if (!isDemoMode()) {
    const qs = new URLSearchParams()
    if (params.includeInactive) qs.set('includeInactive', 'true')
    if (params.search?.trim()) qs.set('search', params.search.trim())
    const query = qs.toString()
    return authorizedRequest<FeeItem[]>(`/cab/fee-items${query ? `?${query}` : ''}`)
  }
  await wait(120)
  const search = params.search?.trim().toLowerCase()
  return clone(
    demoState()
      .items.filter((item) => params.includeInactive || item.isActive)
      .filter(
        (item) =>
          !search ||
          [item.name, item.nameAr ?? '', item.code ?? ''].some((value) => value.toLowerCase().includes(search)),
      )
      .sort(byOrder),
  )
}

export async function createFeeItem(input: FeeItemInput): Promise<FeeItem> {
  if (!isDemoMode()) {
    return authorizedRequest<FeeItem>('/cab/fee-items', { method: 'POST', body: JSON.stringify(input) })
  }
  await wait(120)
  const state = demoState()
  const changes = normalizeInput(input)
  assertDemoItem(state, changes)
  const now = new Date().toISOString()
  const item: FeeItem = {
    id: `fee-${Date.now().toString(36)}`,
    code: null,
    nameAr: null,
    description: null,
    unit: null,
    isActive: true,
    sortOrder: state.items.reduce((max, entry) => Math.max(max, entry.sortOrder), -1) + 1,
    createdAt: now,
    updatedAt: now,
    name: '',
    defaultAmount: 0,
    currency: 'SAR',
    ...changes,
  }
  state.items.push(item)
  saveDemo(state)
  return clone(item)
}

export async function updateFeeItem(id: string, input: Partial<FeeItemInput>): Promise<FeeItem> {
  if (!isDemoMode()) {
    return authorizedRequest<FeeItem>(`/cab/fee-items/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  }
  await wait(120)
  const state = demoState()
  const item = state.items.find((entry) => entry.id === id)
  if (!item) throw demoError('Fee item not found.')
  const changes = normalizeInput(input)
  assertDemoItem(state, changes, id)
  Object.assign(item, changes, { updatedAt: new Date().toISOString() })
  saveDemo(state)
  return clone(item)
}

export async function deleteFeeItem(id: string): Promise<void> {
  if (!isDemoMode()) {
    await authorizedRequest<null>(`/cab/fee-items/${encodeURIComponent(id)}`, { method: 'DELETE' })
    return
  }
  await wait(120)
  const state = demoState()
  state.items = state.items.filter((item) => item.id !== id)
  saveDemo(state)
}

// ── Currencies ───────────────────────────────────────────────────────────────

export async function getFeeCurrencies(): Promise<FeeCurrencySettings> {
  if (!isDemoMode()) return authorizedRequest<FeeCurrencySettings>('/cab/fee-items/currencies')
  await wait(80)
  return { allowed: ordered(demoState().allowed), supported: [...SUPPORTED_CURRENCIES] }
}

export async function updateFeeCurrencies(allowed: FeeCurrency[]): Promise<FeeCurrencySettings> {
  if (!isDemoMode()) {
    return authorizedRequest<FeeCurrencySettings>('/cab/fee-items/currencies', {
      method: 'PUT',
      body: JSON.stringify({ allowed }),
    })
  }
  await wait(120)
  const state = demoState()
  const used = [...new Set(state.items.filter((item) => item.isActive && !allowed.includes(item.currency)).map((item) => item.currency))]
  if (used.length > 0) {
    throw demoError(`Active fee items still use ${used.join(', ')}. Change or deactivate them first.`)
  }
  state.allowed = ordered(allowed)
  saveDemo(state)
  return { allowed: [...state.allowed], supported: [...SUPPORTED_CURRENCIES] }
}

// ── Catalog for the "Add item" dialog ───────────────────────────────────────

/** Active items + currencies: CAB staff read their own catalog, clients their CAB's. */
export async function getFeeCatalog(): Promise<FeeCatalog> {
  if (!isDemoMode()) {
    if (isAuditClientSession()) return authorizedRequest<FeeCatalog>('/fee-items')
    const [items, currencies] = await Promise.all([listFeeItems(), getFeeCurrencies()])
    return { items, currencies: currencies.allowed }
  }
  await wait(120)
  const state = demoState()
  return {
    items: clone(state.items.filter((item) => item.isActive).sort(byOrder)),
    currencies: ordered(state.allowed),
  }
}

/** Only CAB staff may manage the catalog (clients read it). */
export function canManageFeeCatalog(): boolean {
  return !isAuditClientSession()
}

/** Display name of an item in the current language. */
export function feeItemName(item: Pick<FeeItem, 'name' | 'nameAr'>, language: string): string {
  return language.startsWith('ar') && item.nameAr ? item.nameAr : item.name
}
