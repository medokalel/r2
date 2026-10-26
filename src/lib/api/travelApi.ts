/**
 * Travel & logistics cost API (smart travel cost calculator).
 *
 * CAB (authenticate + CAB_ADMIN):
 *   GET  /cab/travel/policy                          → TravelPolicy
 *   PUT  /cab/travel/policy                          TravelPolicyInput → TravelPolicy
 *   GET  /cab/travel/providers/status?check          → TravelProviderStatus
 *   GET  /cab/travel/cities                          → TravelCity[]
 *   GET  /cab/travel/auditors?applicationId|quotationId|auditPlanId → TravelAuditor[]
 *   PUT  /cab/travel/auditors/:employeeProfileId/base { baseCity, baseCountry?, baseAirport? } → TravelAuditor
 *   GET  /cab/travel/context?applicationId|quotationId|auditPlanId → TravelContext
 *   POST /cab/travel/estimate                        TravelEstimateRequest → TravelEstimate (status PREVIEW)
 *   POST /cab/travel/estimates                       TravelEstimateRequest → TravelEstimate (DRAFT)
 *   GET  /cab/travel/estimates/:id                   → TravelEstimate
 *   POST /cab/travel/estimates/:id/refresh           { mode?, startDate?, endDate?, sites?, team? }
 *   POST /cab/travel/estimates/:id/select-option     { optionKey }
 *   POST /cab/travel/estimates/:id/lines             { category, label, quantity, unitAmount, justification, documentRef? }
 *   POST /cab/travel/estimates/:id/lines/:lineId/adjust  { quantity?, unitAmount?, justification } | { reset: true }
 *   POST /cab/travel/estimates/:id/lines/:lineId/remove  { justification }
 *   POST /cab/travel/estimates/:id/approve           { note? }
 *   POST /cab/travel/estimates/:id/actuals           { lines: [{ lineId, actualAmount|null, note? }] }
 *
 * Price status of every line: LIVE (connected production provider, with retrieval time and expiry),
 * CACHED, ADVANCE_ESTIMATE, BENCHMARK (assumption shown), POLICY (confirmed CAB rate), MANUAL (who / why)
 * or DEMO (sample data). In the preview (demo mode) every call runs on lib/api/demo/travelDemo.ts, whose
 * provider offers are DEMO and never LIVE.
 */

import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import * as demo from '@/lib/api/demo/travelDemo'

export type TravelMode = 'ONSITE' | 'REMOTE' | 'HYBRID'
export type PriceStatus = 'LIVE' | 'CACHED' | 'ADVANCE_ESTIMATE' | 'BENCHMARK' | 'POLICY' | 'MANUAL' | 'DEMO'
export const PRICE_STATUSES: PriceStatus[] = ['LIVE', 'CACHED', 'ADVANCE_ESTIMATE', 'BENCHMARK', 'POLICY', 'MANUAL', 'DEMO']
export type TravelCategory =
  | 'FLIGHT'
  | 'TRAIN'
  | 'GROUND'
  | 'AIRPORT_TRANSFER'
  | 'LOCAL_TRANSPORT'
  | 'ACCOMMODATION'
  | 'PER_DIEM'
  | 'VISA'
  | 'INSURANCE'
  | 'OTHER'
  | 'CONTINGENCY'
export const EXTRA_CATEGORIES: TravelCategory[] = ['OTHER', 'FLIGHT', 'TRAIN', 'GROUND', 'AIRPORT_TRANSFER', 'LOCAL_TRANSPORT', 'ACCOMMODATION', 'PER_DIEM', 'VISA', 'INSURANCE']
export type LegMode = 'LOCAL' | 'GROUND' | 'TRAIN' | 'FLIGHT'
export type EstimateStatus = 'PREVIEW' | 'DRAFT' | 'APPROVED' | 'SUPERSEDED'
export type Horizon = 'PAST' | 'LIVE_WINDOW' | 'ADVANCE' | 'BEYOND_HORIZON'

export interface TravelScope {
  applicationId?: string
  quotationId?: string
  auditPlanId?: string
}

export interface ResolvedPlace {
  city: string | null
  country: string | null
  iata: string | null
  latitude?: number
  longitude?: number
  source: string
}

export interface TravelSiteInput {
  key?: string
  name: string
  address?: string
  city?: string
  country?: string
  latitude?: number | null
  longitude?: number | null
  auditDays?: number | null
  onsite?: boolean
  resolved?: ResolvedPlace | null
}

export interface TravelTeamInput {
  key?: string
  employeeProfileId?: string | null
  name: string
  role?: string | null
  baseCity?: string
  baseCountry?: string
  baseAirport?: string
  base?: { city: string | null; country: string | null; iata: string | null; source: string } | null
}

export interface TravelEstimateRequest extends TravelScope {
  mode?: TravelMode
  startDate?: string
  endDate?: string
  currency?: string
  sites?: TravelSiteInput[]
  team?: TravelTeamInput[]
  selectedOption?: string
}

export interface TravelLine {
  id: string
  key: string
  category: TravelCategory
  label: string
  auditorName: string | null
  quantity: number
  unit: string
  unitAmount: number
  amount: number
  status: PriceStatus
  source: string
  retrievedAt: string | null
  expiresAt: string | null
  cacheAgeMinutes: number | null
  assumption: string | null
  originalAmount: number | null
  originalCurrency: string | null
  fxRate: number | null
  fxSource: string | null
  fxDate: string | null
  offerRef: string | null
  meta: Record<string, unknown>
  manual: boolean
  adjusted: boolean
  calculatedAmount: number | null
  calculatedStatus: PriceStatus | null
  adjustedByName: string | null
  adjustedAt: string | null
  adjustmentReason: string | null
  adjustmentNeedsApproval: boolean
  actualAmount: number | null
  actualNote: string | null
  actualRecordedAt: string | null
  variance: number | null
}

export interface TravelLegAlternative {
  mode: LegMode
  feasible: boolean
  hours: number | null
  approxCost: number | null
  reason: string | null
  status: PriceStatus | null
}

export interface TravelLeg {
  groupKey: string
  from: string
  to: string
  date: string
  mode: LegMode
  distanceKm: number | null
  hours: number | null
  alternatives: TravelLegAlternative[]
}

export interface TravelOption {
  key: string
  label: string
  recommended: boolean
  legs: TravelLeg[]
  groups: Array<{ key: string; base: string; members: string[]; tripStart: string; tripEnd: string; tripDays: number }>
  lines: Array<Omit<TravelLine, 'id' | 'manual' | 'adjusted' | 'calculatedAmount' | 'calculatedStatus' | 'adjustedByName' | 'adjustedAt' | 'adjustmentReason' | 'adjustmentNeedsApproval' | 'actualAmount' | 'actualNote' | 'actualRecordedAt' | 'variance'>>
  subtotal: number
  contingency: number
  total: number
  travelHours: number
}

export interface TravelEvent {
  id: string
  action: string
  actorName: string | null
  details: Record<string, unknown>
  createdAt: string
}

export interface TravelEstimate {
  id: string | null
  estimateNumber: string | null
  status: EstimateStatus
  mode: TravelMode
  currency: string
  startDate: string
  endDate: string
  applicationId: string | null
  quotationId: string | null
  auditPlanId: string | null
  selectedOption: string | null
  options: TravelOption[]
  lines: TravelLine[]
  subtotal: number
  contingency: number
  totalEstimated: number
  totalActual: number | null
  variance: number | null
  variancePct: number | null
  priceConfirmed: boolean
  priceLabel: string
  validUntil: string
  expired: boolean
  bookBy: string | null
  horizon: Horizon | null
  pricedAt: string | null
  stale: boolean
  staleReason: string | null
  staleSince: string | null
  approvedAt: string | null
  approvedByName: string | null
  needsSecondApproval: boolean
  canApprove: boolean | null
  assumptions: string[]
  warnings: string[]
  inputs: { sites: TravelSiteInput[]; team: TravelTeamInput[] }
  reimbursable: Array<{ description: string; amount: number }>
  events: TravelEvent[]
  createdAt: string | null
  updatedAt: string | null
}

export interface TravelEstimateSummary {
  id: string
  estimateNumber: string
  status: EstimateStatus
  totalEstimated: number
  totalActual: number | null
  currency: string
  priceConfirmed: boolean
  validUntil: string
  stale: boolean
  auditPlanId: string | null
  quotationId: string | null
  createdAt: string
}

export interface TravelContext {
  applicationId: string | null
  quotationId: string | null
  auditPlanId: string | null
  mode: TravelMode
  startDate: string
  endDate: string
  currency: string
  policyCurrency: string
  samplesPending: number
  sites: TravelSiteInput[]
  team: TravelTeamInput[]
  quotedTravel: number | null
  planTravelNotes: string | null
  estimates: TravelEstimateSummary[]
}

export interface TravelPolicySettings {
  economyMaxFlightHours: number
  longFlightCabin: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS'
  carVsFlightKm: number
  maxGroundHours: number
  groundSpeedKmh: number
  roadFactor: number
  carRentalPerDay: number
  fuelPerKm: number
  passengersPerCar: number
  localTransportPerDay: number
  airportTransferDefault: number
  airportOverheadHours: number
  travelBufferDays: number
  earlyArrivalThresholdHours: number
  lateReturnThresholdHours: number
  localRadiusKm: number
  combineSitesKm: number
  contingencyPct: number
  insurancePct: number
  insuranceDomestic: boolean
  perDiemOnLocalAudits: boolean
  defaultHotelRate: number
  defaultPerDiem: number
  flightBaseFare: number
  flightPerKm: number
  premiumEconomyMultiplier: number
  businessMultiplier: number
  liveWindowDays: number
  bookingHorizonDays: number
  benchmarkAnnualIncreasePct: number
  quoteValidityDays: number
  adjustmentApprovalThreshold: number
  bookingLeadDays: number
  maxExtraHoursForSaving: number
}

export interface TravelCountryRate {
  country: string
  perDiem: number
  hotelCap: number
  visaFee: number
  note?: string
  sample: boolean
}

export interface TravelCityCap {
  cityKey: string
  hotelCap: number
  sample: boolean
}

export interface TravelRailRoute {
  from: string
  to: string
  fare: number
  hours: number
  operator: string
  sample: boolean
}

export interface TravelPolicyInput {
  currency: string
  settings: TravelPolicySettings
  countries: TravelCountryRate[]
  cities: TravelCityCap[]
  railRoutes: TravelRailRoute[]
}

export interface TravelPolicy extends TravelPolicyInput {
  isDefault: boolean
  samplesPending: number
  updatedAt: string | null
  updatedByName: string | null
}

export interface TravelProvider {
  kind: 'flights' | 'hotels' | 'transfers' | 'rail' | 'fx' | 'maps'
  provider: string | null
  label: string | null
  configured: boolean
  mode: string | null
  live: boolean
  reachable: boolean | null
  message: string | null
}

export interface TravelProviderStatus {
  checkedAt: string
  checked: boolean
  providers: TravelProvider[]
}

export interface TravelCity {
  key: string
  name: string
  nameAr: string
  country: string
  iata: string | null
  latitude: number
  longitude: number
}

export interface TravelAuditor {
  employeeProfileId: string
  name: string
  role: string | null
  baseCity: string | null
  baseCountry: string | null
  baseAirport: string | null
  located: boolean
  distanceKm: number | null
}

const json = (method: string, body?: unknown): RequestInit => ({ method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })

const scopeQuery = (scope: TravelScope) => {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(scope)) if (value) qs.set(key, value)
  return qs.toString()
}

export function getTravelPolicy(): Promise<TravelPolicy> {
  if (isDemoMode()) return demo.getPolicy()
  return authorizedRequest<TravelPolicy>('/cab/travel/policy')
}

export function saveTravelPolicy(policy: TravelPolicyInput): Promise<TravelPolicy> {
  if (isDemoMode()) return demo.savePolicy(policy)
  return authorizedRequest<TravelPolicy>('/cab/travel/policy', json('PUT', policy))
}

export function getTravelProviderStatus(check = false): Promise<TravelProviderStatus> {
  if (isDemoMode()) return demo.providerStatus(check)
  return authorizedRequest<TravelProviderStatus>(`/cab/travel/providers/status${check ? '?check=true' : ''}`)
}

export function listTravelCities(): Promise<TravelCity[]> {
  if (isDemoMode()) return demo.listCities()
  return authorizedRequest<TravelCity[]>('/cab/travel/cities')
}

export function listTravelAuditors(scope: TravelScope = {}): Promise<TravelAuditor[]> {
  if (isDemoMode()) return demo.listAuditors()
  const qs = scopeQuery(scope)
  return authorizedRequest<TravelAuditor[]>(`/cab/travel/auditors${qs ? `?${qs}` : ''}`)
}

export function saveAuditorBase(employeeProfileId: string, body: { baseCity: string; baseCountry?: string; baseAirport?: string }): Promise<TravelAuditor> {
  if (isDemoMode()) return demo.saveAuditorBase(employeeProfileId, body)
  return authorizedRequest<TravelAuditor>(`/cab/travel/auditors/${encodeURIComponent(employeeProfileId)}/base`, json('PUT', body))
}

/** Prefilled inputs of a record; `seed` feeds the preview (demo mode) with what the page already shows. */
export function getTravelContext(scope: TravelScope, seed?: Partial<TravelContext>): Promise<TravelContext> {
  if (isDemoMode()) return demo.getContext(scope, seed)
  return authorizedRequest<TravelContext>(`/cab/travel/context?${scopeQuery(scope)}`)
}

export function previewTravelEstimate(body: TravelEstimateRequest): Promise<TravelEstimate> {
  if (isDemoMode()) return demo.preview(body)
  return authorizedRequest<TravelEstimate>('/cab/travel/estimate', json('POST', body))
}

export function createTravelEstimate(body: TravelEstimateRequest): Promise<TravelEstimate> {
  if (isDemoMode()) return demo.create(body)
  return authorizedRequest<TravelEstimate>('/cab/travel/estimates', json('POST', body))
}

export function getTravelEstimate(id: string): Promise<TravelEstimate> {
  if (isDemoMode()) return demo.get(id)
  return authorizedRequest<TravelEstimate>(`/cab/travel/estimates/${encodeURIComponent(id)}`)
}

export function refreshTravelEstimate(id: string, body: Partial<TravelEstimateRequest> = {}): Promise<TravelEstimate> {
  if (isDemoMode()) return demo.refresh(id, body)
  return authorizedRequest<TravelEstimate>(`/cab/travel/estimates/${encodeURIComponent(id)}/refresh`, json('POST', body))
}

export function selectTravelOption(id: string, optionKey: string): Promise<TravelEstimate> {
  if (isDemoMode()) return demo.selectOption(id, optionKey)
  return authorizedRequest<TravelEstimate>(`/cab/travel/estimates/${encodeURIComponent(id)}/select-option`, json('POST', { optionKey }))
}

export function adjustTravelLine(id: string, lineId: string, body: { quantity?: number; unitAmount?: number; justification: string } | { reset: true }): Promise<TravelEstimate> {
  if (isDemoMode()) return demo.adjust(id, lineId, body)
  return authorizedRequest<TravelEstimate>(`/cab/travel/estimates/${encodeURIComponent(id)}/lines/${encodeURIComponent(lineId)}/adjust`, json('POST', body))
}

export function addTravelLine(id: string, body: { category: TravelCategory; label: string; quantity: number; unitAmount: number; justification: string; documentRef?: string }): Promise<TravelEstimate> {
  if (isDemoMode()) return demo.addLine(id, body)
  return authorizedRequest<TravelEstimate>(`/cab/travel/estimates/${encodeURIComponent(id)}/lines`, json('POST', body))
}

export function removeTravelLine(id: string, lineId: string, justification: string): Promise<TravelEstimate> {
  if (isDemoMode()) return demo.removeLine(id, lineId)
  return authorizedRequest<TravelEstimate>(`/cab/travel/estimates/${encodeURIComponent(id)}/lines/${encodeURIComponent(lineId)}/remove`, json('POST', { justification }))
}

export function approveTravelEstimate(id: string, note?: string): Promise<TravelEstimate> {
  if (isDemoMode()) return demo.approve(id)
  return authorizedRequest<TravelEstimate>(`/cab/travel/estimates/${encodeURIComponent(id)}/approve`, json('POST', note ? { note } : {}))
}

export function recordTravelActuals(id: string, lines: Array<{ lineId: string; actualAmount: number | null; note?: string }>): Promise<TravelEstimate> {
  if (isDemoMode()) return demo.recordActuals(id, lines)
  return authorizedRequest<TravelEstimate>(`/cab/travel/estimates/${encodeURIComponent(id)}/actuals`, json('POST', { lines }))
}
