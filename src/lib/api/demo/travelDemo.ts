/**
 * Demo branch of the travel cost API (preview only). A compact copy of the server engine:
 * flights, hotels and transfers are sample offers with status DEMO (never LIVE); rail, car, local
 * transport, per diem, visa, insurance and contingency come from the sample travel policy
 * (BENCHMARK until confirmed, POLICY once confirmed). Saved estimates live in the demo store.
 */

import { loadState, saveState, updateState, wait, clone } from '@/lib/api/demo/demoStore'
import type {
  LegMode,
  PriceStatus,
  TravelAuditor,
  TravelCategory,
  TravelCity,
  TravelContext,
  TravelEstimate,
  TravelEstimateRequest,
  TravelLine,
  TravelOption,
  TravelPolicy,
  TravelPolicyInput,
  TravelProviderStatus,
  TravelScope,
} from '@/lib/api/travelApi'

// ── Reference data ────────────────────────────────────────────────────────────

const CITIES: TravelCity[] = [
  { key: 'riyadh', name: 'Riyadh', nameAr: 'الرياض', country: 'SA', iata: 'RUH', latitude: 24.7136, longitude: 46.6753 },
  { key: 'jeddah', name: 'Jeddah', nameAr: 'جدة', country: 'SA', iata: 'JED', latitude: 21.5433, longitude: 39.1728 },
  { key: 'makkah', name: 'Makkah', nameAr: 'مكة المكرمة', country: 'SA', iata: 'JED', latitude: 21.3891, longitude: 39.8579 },
  { key: 'madinah', name: 'Madinah', nameAr: 'المدينة المنورة', country: 'SA', iata: 'MED', latitude: 24.5247, longitude: 39.5692 },
  { key: 'dammam', name: 'Dammam', nameAr: 'الدمام', country: 'SA', iata: 'DMM', latitude: 26.4207, longitude: 50.0888 },
  { key: 'khobar', name: 'Al Khobar', nameAr: 'الخبر', country: 'SA', iata: 'DMM', latitude: 26.2794, longitude: 50.2083 },
  { key: 'jubail', name: 'Jubail', nameAr: 'الجبيل', country: 'SA', iata: 'DMM', latitude: 27.0046, longitude: 49.646 },
  { key: 'tabuk', name: 'Tabuk', nameAr: 'تبوك', country: 'SA', iata: 'TUU', latitude: 28.3838, longitude: 36.555 },
  { key: 'abha', name: 'Abha', nameAr: 'أبها', country: 'SA', iata: 'AHB', latitude: 18.2465, longitude: 42.5117 },
  { key: 'dubai', name: 'Dubai', nameAr: 'دبي', country: 'AE', iata: 'DXB', latitude: 25.2048, longitude: 55.2708 },
  { key: 'cairo', name: 'Cairo', nameAr: 'القاهرة', country: 'EG', iata: 'CAI', latitude: 30.0444, longitude: 31.2357 },
  { key: 'alexandria', name: 'Alexandria', nameAr: 'الإسكندرية', country: 'EG', iata: 'HBE', latitude: 31.2001, longitude: 29.9187 },
  { key: 'istanbul', name: 'Istanbul', nameAr: 'إسطنبول', country: 'TR', iata: 'IST', latitude: 41.0082, longitude: 28.9784 },
]

const RAIL = [
  { from: 'jeddah', to: 'makkah', fare: 60, hours: 0.6, operator: 'Haramain High Speed Railway' },
  { from: 'jeddah', to: 'madinah', fare: 175, hours: 2, operator: 'Haramain High Speed Railway' },
  { from: 'makkah', to: 'madinah', fare: 200, hours: 2.3, operator: 'Haramain High Speed Railway' },
  { from: 'riyadh', to: 'dammam', fare: 140, hours: 4.3, operator: 'Saudi Arabia Railways (SAR)' },
  { from: 'cairo', to: 'alexandria', fare: 25, hours: 2.5, operator: 'Egyptian National Railways' },
]

const SETTINGS: TravelPolicy['settings'] = {
  economyMaxFlightHours: 6, longFlightCabin: 'BUSINESS', carVsFlightKm: 450, maxGroundHours: 5, groundSpeedKmh: 90, roadFactor: 1.25,
  carRentalPerDay: 220, fuelPerKm: 0.3, passengersPerCar: 3, localTransportPerDay: 150, airportTransferDefault: 150, airportOverheadHours: 2.5,
  travelBufferDays: 1, earlyArrivalThresholdHours: 3, lateReturnThresholdHours: 6, localRadiusKm: 60, combineSitesKm: 150, contingencyPct: 10,
  insurancePct: 2, insuranceDomestic: false, perDiemOnLocalAudits: false, defaultHotelRate: 450, defaultPerDiem: 250, flightBaseFare: 250,
  flightPerKm: 0.45, premiumEconomyMultiplier: 1.6, businessMultiplier: 2.8, liveWindowDays: 60, bookingHorizonDays: 330,
  benchmarkAnnualIncreasePct: 5, quoteValidityDays: 14, adjustmentApprovalThreshold: 1000, bookingLeadDays: 21, maxExtraHoursForSaving: 2,
}

const seedPolicy = (): TravelPolicy => ({
  currency: 'SAR',
  settings: { ...SETTINGS },
  countries: [
    { country: 'SA', perDiem: 300, hotelCap: 650, visaFee: 535, note: 'Visit e-visa incl. medical insurance (sample)', sample: true },
    { country: 'AE', perDiem: 350, hotelCap: 750, visaFee: 350, note: '30-day visit visa (sample)', sample: true },
    { country: 'EG', perDiem: 220, hotelCap: 500, visaFee: 95, note: 'Visa on arrival / e-visa, USD 25 (sample)', sample: true },
    { country: 'TR', perDiem: 280, hotelCap: 600, visaFee: 0, note: 'Depends on nationality (sample)', sample: true },
  ],
  cities: [
    { cityKey: 'riyadh', hotelCap: 700, sample: true },
    { cityKey: 'jeddah', hotelCap: 650, sample: true },
    { cityKey: 'dubai', hotelCap: 850, sample: true },
  ],
  railRoutes: RAIL.map((r) => ({ ...r, sample: true })),
  isDefault: true,
  samplesPending: 0,
  updatedAt: null,
  updatedByName: null,
})

const DEMO_AUDITORS: TravelAuditor[] = [
  { employeeProfileId: 'demo-emp-1', name: 'Omar Haddad', role: 'LEAD_AUDITOR', baseCity: 'Riyadh', baseCountry: 'SA', baseAirport: 'RUH', located: true, distanceKm: null },
  { employeeProfileId: 'demo-emp-2', name: 'Sara Al Qahtani', role: 'AUDITOR', baseCity: 'Jeddah', baseCountry: 'SA', baseAirport: 'JED', located: true, distanceKm: null },
  { employeeProfileId: 'demo-emp-3', name: 'Mahmoud Fathy', role: 'AUDITOR', baseCity: 'Cairo', baseCountry: 'EG', baseAirport: 'CAI', located: true, distanceKm: null },
]

const POLICY_KEY = 'travel.policy'
const ESTIMATES_KEY = 'travel.estimates'
const AUDITORS_KEY = 'travel.auditors'

const policyNow = () => {
  const p = loadState<TravelPolicy>(POLICY_KEY, seedPolicy)
  return { ...p, samplesPending: [...p.countries, ...p.cities, ...p.railRoutes].filter((r) => r.sample).length }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type Place = { city: string; key: string; country: string; iata: string | null; lat: number; lng: number }

const fold = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[ً-ٟ]/g, '').replace(/[إأآ]/g, 'ا')
const resolve = (text?: string | null): Place | null => {
  if (!text) return null
  const folded = ` ${fold(text).replace(/[^\p{L}\p{N}]+/gu, ' ')} `
  const city = CITIES.find((c) => [c.key, c.name, c.nameAr].some((n) => folded.includes(` ${fold(n)} `)))
  return city ? { city: city.name, key: city.key, country: city.country, iata: city.iata, lat: city.latitude, lng: city.longitude } : null
}
const km = (a: Place, b: Place) => {
  const r = (d: number) => (d * Math.PI) / 180
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)))
}
const r2 = (n: number) => Math.round(n * 100) / 100
const today = () => new Date().toISOString().slice(0, 10)
const addDays = (iso: string, n: number) => new Date(new Date(`${iso}T00:00:00Z`).getTime() + n * 86_400_000).toISOString().slice(0, 10)
const daysBetween = (a: string, b: string) => Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86_400_000)
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, 7)

type DemoLine = TravelOption['lines'][number]

const line = (key: string, category: TravelCategory, label: string, quantity: number, unitAmount: number, status: PriceStatus, source: string, assumption: string | null, auditorName: string | null = null): DemoLine => ({
  key, category, label, auditorName, quantity, unit: 'item', unitAmount: r2(unitAmount), amount: r2(quantity * unitAmount), status, source,
  retrievedAt: status === 'DEMO' ? new Date().toISOString() : null, expiresAt: null, cacheAgeMinutes: null, assumption,
  originalAmount: null, originalCurrency: null, fxRate: null, fxSource: null, fxDate: null, offerRef: status === 'DEMO' ? `DEMO-${hash(key)}` : null, meta: {},
})

const DEMO_SOURCE = 'Demo offer (sample data, not a market price)'

/** Same steps as the server engine, for one stop per city (sites within 150 km combined). */
function price(body: TravelEstimateRequest, sites: NonNullable<TravelEstimateRequest['sites']>, team: NonNullable<TravelEstimateRequest['team']>) {
  const policy = policyNow()
  const s = policy.settings
  const warnings: string[] = []
  const assumptions: string[] = []
  const mode = body.mode ?? 'ONSITE'
  const start = body.startDate ?? addDays(today(), 35)
  const end = body.endDate ?? start
  const span = daysBetween(start, end) + 1
  const country = (c: string) => policy.countries.find((x) => x.country === c)
  const rate = (row: { sample: boolean } | undefined, value: number | undefined, fallback: number, label: string): [number, PriceStatus, string] =>
    row && value !== undefined ? [value, row.sample ? 'BENCHMARK' : 'POLICY', row.sample ? `Sample ${label} value; the CAB must confirm it in the travel policy. Not an official rate.` : ''] : [fallback, 'BENCHMARK', `No ${label} rate in the travel policy; default used.`]

  const onsite = mode === 'REMOTE' ? [] : sites.filter((x) => mode !== 'HYBRID' || x.onsite !== false)
  if (!onsite.length) {
    assumptions.push(mode === 'REMOTE' ? 'Remote audit: no physical travel, so no travel costs.' : 'Hybrid audit without on-site sites: no physical travel.')
    return { options: [{ key: 'remote', label: 'Remote', recommended: true, legs: [], groups: [], lines: [], subtotal: 0, contingency: 0, total: 0, travelHours: 0 }] as TravelOption[], warnings, assumptions, start, end, policy }
  }
  const stops: Array<{ place: Place; names: string[]; days: number }> = []
  for (const site of onsite) {
    const place = resolve(site.city) ?? resolve(site.address) ?? resolve(site.name)
    if (!place) { warnings.push(`Site "${site.name}" has no known location; its travel is not priced. Add the city or map pin.`); continue }
    const stop = stops.find((x) => km(x.place, place) <= s.combineSitesKm)
    if (stop) stop.names.push(site.name)
    else stops.push({ place, names: [site.name], days: 0 })
  }
  const members = team.map((m) => {
    const known = DEMO_AUDITORS.find((a) => a.name === m.name)
    const base = resolve(m.baseCity) ?? resolve(known?.baseCity) ?? resolve('Riyadh')
    if (!m.baseCity && !known) assumptions.push(`${m.name}: base city not set, the CAB office city (Riyadh) is used.`)
    return { name: m.name, base: base as Place }
  })
  if (!stops.length || !members.length) {
    if (!members.length) warnings.push('No auditor with a base location: add the audit team to price travel.')
    return { options: [] as TravelOption[], warnings, assumptions, start, end, policy }
  }
  const per = Math.max(1, Math.floor(span / stops.length))
  stops.forEach((st, i) => { st.days = i === stops.length - 1 ? Math.max(1, span - per * (stops.length - 1)) : per })
  if (stops.length < onsite.length) assumptions.push(`${onsite.length} sites combined into ${stops.length} stop${stops.length > 1 ? 's' : ''} (sites within ${s.combineSitesKm} km share one trip).`)

  const groups: Array<{ base: Place; names: string[] }> = []
  for (const m of members) {
    const g = groups.find((x) => km(x.base, m.base) <= s.localRadiusKm)
    if (g) g.names.push(m.name)
    else groups.push({ base: m.base, names: [m.name] })
  }

  const options: TravelOption[] = []
  for (const [strategy, label] of [['recommended', 'Recommended'], ['cheapest', 'Lowest cost'], ['fastest', 'Fastest']] as const) {
    const lines: DemoLine[] = []
    const legs: TravelOption['legs'] = []
    const optionGroups: TravelOption['groups'] = []
    let hoursTotal = 0
    for (const [gi, g] of groups.entries()) {
      const pax = g.names.length
      const cars = Math.ceil(pax / s.passengersPerCar)
      const names = g.names.join(', ')
      const points = [g.base, ...stops.map((x) => x.place), g.base]
      let tripStart = start
      let tripEnd = end
      let drives = false
      for (let i = 0; i < points.length - 1; i += 1) {
        const a = points[i]
        const b = points[i + 1]
        const dist = km(a, b)
        const road = r2(dist * s.roadFactor)
        const roadHours = r2(road / s.groundSpeedKmh)
        const date = i === 0 ? start : i === points.length - 2 ? end : addDays(start, per * i - 1)
        if (dist <= s.localRadiusKm) {
          legs.push({ groupKey: `group-${gi + 1}`, from: a.city, to: b.city, date, mode: 'LOCAL', distanceKm: road, hours: roadHours, alternatives: [{ mode: 'LOCAL', feasible: true, hours: roadHours, approxCost: 0, reason: null, status: null }] })
          continue
        }
        const rail = RAIL.find((x) => (x.from === a.key && x.to === b.key) || (x.from === b.key && x.to === a.key))
        const fare = Math.round(380 + (hash(`${a.iata}${b.iata}`) % 700))
        const alts: Array<{ mode: LegMode; feasible: boolean; hours: number; cost: number; reason: string | null }> = [
          { mode: 'GROUND', feasible: roadHours <= s.maxGroundHours, hours: roadHours, cost: r2(cars * (s.fuelPerKm * road + s.carRentalPerDay)), reason: roadHours <= s.maxGroundHours ? null : `Road trip of ${roadHours} h exceeds the ${s.maxGroundHours} h policy limit.` },
        ]
        if (rail) alts.push({ mode: 'TRAIN', feasible: true, hours: rail.hours + 1, cost: rail.fare * pax + 2 * cars * s.airportTransferDefault, reason: null })
        if (a.iata && b.iata && a.iata !== b.iata && (road > s.carVsFlightKm || roadHours > s.maxGroundHours)) {
          alts.push({ mode: 'FLIGHT', feasible: true, hours: r2(dist / 750 + 0.5 + s.airportOverheadHours), cost: fare * pax + 2 * cars * 165, reason: null })
        }
        if (!alts.some((x) => x.feasible)) alts[0].feasible = true
        const feasible = alts.filter((x) => x.feasible)
        const fastest = [...feasible].sort((x, y) => x.hours - y.hours)[0]
        const choice = strategy === 'fastest' ? fastest : strategy === 'cheapest' ? [...feasible].sort((x, y) => x.cost - y.cost)[0] : [...feasible].filter((x) => x.hours <= fastest.hours + s.maxExtraHoursForSaving).sort((x, y) => x.cost - y.cost)[0]
        const threshold = i === points.length - 2 ? s.lateReturnThresholdHours : s.earlyArrivalThresholdHours
        const shifted = choice.hours > threshold ? (i === 0 ? addDays(start, -s.travelBufferDays) : i === points.length - 2 ? addDays(end, s.travelBufferDays) : date) : date
        if (i === 0) tripStart = shifted
        if (i === points.length - 2) tripEnd = shifted
        hoursTotal += choice.hours * pax
        legs.push({ groupKey: `group-${gi + 1}`, from: a.city, to: b.city, date: shifted, mode: choice.mode, distanceKm: road, hours: choice.hours, alternatives: alts.map((x) => ({ mode: x.mode, feasible: x.feasible, hours: x.hours, approxCost: x.cost, reason: x.reason, status: x.mode === 'FLIGHT' ? 'DEMO' : x.mode === 'GROUND' ? null : 'BENCHMARK' })) })
        const route = `${a.city} → ${b.city}`
        if (choice.mode === 'FLIGHT') {
          lines.push(line(`g${gi}:FLIGHT:${i}`, 'FLIGHT', `Flight ${a.iata} → ${b.iata}, ${shifted} (economy)`, pax, fare, 'DEMO', DEMO_SOURCE, 'Sample offer for demonstration; not a market price.', names))
          lines.push(line(`g${gi}:AIRPORT_TRANSFER:${i}`, 'AIRPORT_TRANSFER', `Airport transfers ${route} (2 rides × ${cars})`, 2 * cars, 165, 'DEMO', DEMO_SOURCE, 'Sample offer for demonstration; not a market price.', names))
        } else if (choice.mode === 'TRAIN' && rail) {
          lines.push(line(`g${gi}:TRAIN:${i}`, 'TRAIN', `Train ${route}, ${shifted}`, pax, rail.fare, 'BENCHMARK', `Rail benchmark: ${rail.operator}`, `Economy one-way benchmark fare ${rail.fare} SAR (sample value to be confirmed by the CAB); no rail booking API connected.`, names))
          lines.push(line(`g${gi}:LOCAL_TRANSPORT:station:${i}`, 'LOCAL_TRANSPORT', `Station transfers ${route} (2 rides × ${cars})`, 2 * cars, s.airportTransferDefault, 'BENCHMARK', 'Travel policy transfer default', `Station transfers at ${s.airportTransferDefault} SAR per ride.`, names))
        } else {
          drives = true
          lines.push(line(`g${gi}:GROUND:${i}`, 'GROUND', `Road trip ${route}, ${road} km, ${shifted}`, cars, s.fuelPerKm * road, 'BENCHMARK', 'Great-circle distance × road factor 1.25', `Fuel and tolls at ${s.fuelPerKm} SAR per km over ${road} km.`, names))
        }
      }
      const tripDays = daysBetween(tripStart, tripEnd) + 1
      if (drives) lines.push(line(`g${gi}:GROUND:rental`, 'GROUND', `Car rental, ${tripDays} days × ${cars}`, tripDays * cars, s.carRentalPerDay, 'BENCHMARK', 'Travel policy car rental rate', `Car rental at ${s.carRentalPerDay} SAR per day.`, names))
      else lines.push(line(`g${gi}:LOCAL_TRANSPORT:daily`, 'LOCAL_TRANSPORT', `Local transport, ${span} audit days × ${cars}`, span * cars, s.localTransportPerDay, 'BENCHMARK', 'Travel policy local transport rate', `Local transport at ${s.localTransportPerDay} SAR per vehicle per audit day.`, names))
      const away = stops.filter((x) => km(x.place, g.base) > s.localRadiusKm)
      if (away.length) {
        const nights = daysBetween(tripStart, tripEnd)
        const stop = away[0]
        const cap = policy.cities.find((c) => c.cityKey === stop.place.key)?.hotelCap ?? country(stop.place.country)?.hotelCap ?? s.defaultHotelRate
        const offer = Math.min(cap, 330 + (hash(stop.place.key) % 360))
        if (nights > 0) lines.push(line(`g${gi}:ACCOMMODATION:${stop.place.key}`, 'ACCOMMODATION', `Hotel ${stop.place.city}, ${nights} night${nights > 1 ? 's' : ''} × ${pax}`, nights * pax, offer, 'DEMO', DEMO_SOURCE, `Sample offer for demonstration; policy cap ${cap} SAR per night.`, names))
        const c = country(stop.place.country)
        const [pd, pdStatus, pdNote] = rate(c, c?.perDiem, s.defaultPerDiem, 'per diem')
        lines.push(line(`g${gi}:PER_DIEM:${stop.place.country}`, 'PER_DIEM', `Per diem ${stop.place.country}, ${tripDays} days × ${pax}`, tripDays * pax, pd, pdStatus, `Travel policy per diem (${stop.place.country})`, pdNote, names))
        const foreign = [...new Set(away.map((x) => x.place.country).filter((x) => x !== g.base.country))]
        for (const fc of foreign) {
          const row = country(fc)
          const [fee, feeStatus, feeNote] = rate(row, row?.visaFee, 0, 'visa fee')
          if (fee > 0) lines.push(line(`g${gi}:VISA:${fc}`, 'VISA', `Visa ${fc} × ${pax} (if required for the auditor's nationality)`, pax, fee, feeStatus, `Travel policy visa fee (${fc})`, feeNote, names))
        }
        if (foreign.length && s.insurancePct > 0) {
          const base = lines.filter((x) => x.key.startsWith(`g${gi}:`)).reduce((sum, x) => sum + x.amount, 0)
          lines.push(line(`g${gi}:INSURANCE`, 'INSURANCE', `Travel insurance, ${s.insurancePct}% of trip costs`, 1, (base * s.insurancePct) / 100, 'POLICY', 'Travel policy insurance rate', `${s.insurancePct}% of ${r2(base)} SAR.`, names))
        }
      }
      optionGroups.push({ key: `group-${gi + 1}`, base: g.base.city, members: g.names, tripStart, tripEnd, tripDays })
    }
    const signature = legs.map((x) => x.mode).join('|')
    if (options.some((o) => o.legs.map((x) => x.mode).join('|') === signature)) continue
    const subtotal = r2(lines.reduce((sum, x) => sum + x.amount, 0))
    const contingency = r2((subtotal * s.contingencyPct) / 100)
    lines.push(line('CONTINGENCY', 'CONTINGENCY', `Contingency ${s.contingencyPct}%`, 1, contingency, 'POLICY', 'Travel policy contingency', `${s.contingencyPct}% of ${subtotal} SAR for fare and rate changes.`))
    options.push({ key: strategy, label, recommended: strategy === 'recommended', legs, groups: optionGroups, lines, subtotal, contingency, total: r2(subtotal + contingency), travelHours: r2(hoursTotal) })
  }
  return { options, warnings, assumptions, start, end, policy }
}

type Stored = TravelEstimate & { scope: TravelScope; request: TravelEstimateRequest }

const toLine = (l: DemoLine, i: number): TravelLine => ({
  ...l, id: `demo-line-${i}-${hash(l.key)}`, manual: false, adjusted: false, calculatedAmount: null, calculatedStatus: null, adjustedByName: null, adjustedAt: null,
  adjustmentReason: null, adjustmentNeedsApproval: false, actualAmount: null, actualNote: null, actualRecordedAt: null, variance: null,
})

function totals(e: TravelEstimate) {
  const policy = policyNow()
  const cont = e.lines.find((l) => l.category === 'CONTINGENCY')
  const subtotal = r2(e.lines.filter((l) => l.category !== 'CONTINGENCY').reduce((s, l) => s + l.amount, 0))
  if (cont && !cont.adjusted) { cont.unitAmount = r2((subtotal * policy.settings.contingencyPct) / 100); cont.amount = cont.unitAmount }
  e.subtotal = subtotal
  e.contingency = cont?.amount ?? 0
  e.totalEstimated = r2(subtotal + e.contingency)
  const actual = e.lines.filter((l) => l.actualAmount !== null)
  e.totalActual = actual.length ? r2(actual.reduce((s, l) => s + (l.actualAmount ?? 0), 0)) : null
  const recorded = r2(actual.reduce((s, l) => s + l.amount, 0))
  e.variance = e.totalActual === null ? null : r2(e.totalActual - recorded)
  e.variancePct = e.variance === null || !recorded ? null : r2((e.variance / recorded) * 100)
  for (const l of e.lines) l.variance = l.actualAmount === null ? null : r2(l.actualAmount - l.amount)
  e.priceConfirmed = e.lines.length > 0 && e.lines.every((l) => l.status === 'LIVE' || l.status === 'POLICY')
  e.priceLabel = e.priceConfirmed ? 'Confirmed prices' : 'Estimate, not a confirmed price'
  e.reimbursable = e.lines.filter((l) => (l.actualAmount ?? 0) > 0).map((l) => ({ description: l.label, amount: l.actualAmount ?? 0 }))
  e.needsSecondApproval = e.lines.some((l) => l.adjustmentNeedsApproval)
}

function build(body: TravelEstimateRequest, status: TravelEstimate['status'], previous?: Stored): Stored {
  const ctx = previous?.request ?? body
  const sites = body.sites ?? ctx.sites ?? [{ name: 'Head office', address: 'Industrial City, Jeddah' }]
  const team = body.team ?? ctx.team ?? [{ name: 'Omar Haddad' }]
  const run = price({ ...ctx, ...body }, sites, team)
  const option = run.options.find((o) => o.key === (body.selectedOption ?? previous?.selectedOption)) ?? run.options[0]
  const horizonDays = daysBetween(today(), run.start)
  const horizon = horizonDays < 0 ? 'PAST' : horizonDays <= run.policy.settings.liveWindowDays ? 'LIVE_WINDOW' : horizonDays <= run.policy.settings.bookingHorizonDays ? 'ADVANCE' : 'BEYOND_HORIZON'
  const assumptions = [...run.assumptions, 'Preview data: flights, hotels and transfers are demo offers, never live prices.', `Tickets assumed booked ${run.policy.settings.bookingLeadDays} days before travel.`]
  const e: Stored = {
    id: previous?.id ?? null, estimateNumber: previous?.estimateNumber ?? null, status, mode: body.mode ?? ctx.mode ?? 'ONSITE', currency: 'SAR', startDate: run.start, endDate: run.end,
    applicationId: ctx.applicationId ?? null, quotationId: ctx.quotationId ?? null, auditPlanId: ctx.auditPlanId ?? null,
    selectedOption: option?.key ?? null, options: run.options, lines: (option?.lines ?? []).map(toLine), subtotal: 0, contingency: 0, totalEstimated: 0,
    totalActual: null, variance: null, variancePct: null, priceConfirmed: false, priceLabel: '', validUntil: addDays(today(), run.policy.settings.quoteValidityDays),
    expired: false, bookBy: addDays(run.start, -run.policy.settings.bookingLeadDays), horizon, pricedAt: new Date().toISOString(), stale: false, staleReason: null, staleSince: null,
    approvedAt: null, approvedByName: null, needsSecondApproval: false, canApprove: status === 'DRAFT', assumptions, warnings: run.warnings,
    inputs: { sites: sites.map((x) => ({ ...x, resolved: (() => { const p = resolve(x.city) ?? resolve(x.address) ?? resolve(x.name); return p ? { city: p.city, country: p.country, iata: p.iata, source: 'city table' } : null })() })), team: team.map((m) => ({ ...m, base: { city: resolve(m.baseCity)?.city ?? DEMO_AUDITORS.find((a) => a.name === m.name)?.baseCity ?? 'Riyadh', country: 'SA', iata: null, source: 'employee profile' } })) },
    reimbursable: [], events: previous?.events ?? [], createdAt: previous?.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString(),
    scope: { applicationId: ctx.applicationId, quotationId: ctx.quotationId, auditPlanId: ctx.auditPlanId }, request: { ...ctx, ...body, sites, team },
  }
  totals(e)
  return e
}

const store = () => loadState<Stored[]>(ESTIMATES_KEY, () => [])
const event = (e: Stored, action: string, details: Record<string, unknown> = {}) => e.events.unshift({ id: `ev-${Date.now()}-${e.events.length}`, action, actorName: 'Demo CAB Admin', details, createdAt: new Date().toISOString() })
const mutate = async (id: string, fn: (e: Stored) => void): Promise<TravelEstimate> => {
  await wait(150)
  return updateState(ESTIMATES_KEY, () => [] as Stored[], (list) => {
    const e = list.find((x) => x.id === id)
    if (!e) throw new Error('Travel estimate not found.')
    fn(e)
    totals(e)
    e.canApprove = e.status === 'DRAFT' && !e.stale
    e.updatedAt = new Date().toISOString()
    return clone(e)
  })
}

// ── API ───────────────────────────────────────────────────────────────────────

export async function getPolicy(): Promise<TravelPolicy> {
  await wait(120)
  return clone(policyNow())
}

export async function savePolicy(input: TravelPolicyInput): Promise<TravelPolicy> {
  await wait(200)
  const next: TravelPolicy = { ...input, isDefault: false, samplesPending: 0, updatedAt: new Date().toISOString(), updatedByName: 'Demo CAB Admin' }
  saveState(POLICY_KEY, next)
  return clone(policyNow())
}

export async function providerStatus(check: boolean): Promise<TravelProviderStatus> {
  await wait(check ? 400 : 100)
  const demoRow = (kind: TravelProviderStatus['providers'][number]['kind'], label: string) => ({ kind, provider: 'amadeus', label, configured: true, mode: 'mock', live: false, reachable: check ? true : null, message: 'Preview: demo offers, never live prices.' })
  return {
    checkedAt: new Date().toISOString(),
    checked: check,
    providers: [
      demoRow('flights', 'Amadeus Self-Service'),
      demoRow('hotels', 'Amadeus Self-Service'),
      demoRow('transfers', 'Amadeus Self-Service'),
      { kind: 'rail', provider: null, label: null, configured: false, mode: null, live: false, reachable: null, message: 'Not connected: benchmark rates are used.' },
      { kind: 'fx', provider: 'peg', label: 'Official USD peg', configured: false, mode: null, live: false, reachable: null, message: 'Only the official USD pegs and FX_STATIC_RATES are used.' },
      { kind: 'maps', provider: 'haversine', label: 'Great-circle distance', configured: true, mode: null, live: false, reachable: null, message: 'Road distance is estimated from coordinates (road factor of the travel policy).' },
    ],
  }
}

export async function listCities(): Promise<TravelCity[]> {
  await wait(60)
  return clone(CITIES)
}

export async function listAuditors(): Promise<TravelAuditor[]> {
  await wait(100)
  return clone(loadState(AUDITORS_KEY, () => DEMO_AUDITORS))
}

export async function saveAuditorBase(id: string, body: { baseCity: string; baseCountry?: string; baseAirport?: string }): Promise<TravelAuditor> {
  await wait(150)
  const place = resolve(body.baseCity)
  if (!place) throw new Error('Choose a city from the list.')
  return updateState(AUDITORS_KEY, () => clone(DEMO_AUDITORS), (list) => {
    let a = list.find((x) => x.employeeProfileId === id)
    if (!a) { a = { employeeProfileId: id, name: id, role: null, baseCity: null, baseCountry: null, baseAirport: null, located: false, distanceKm: null }; list.push(a) }
    Object.assign(a, { baseCity: place.city, baseCountry: place.country, baseAirport: body.baseAirport || place.iata, located: true })
    return clone(a)
  })
}

export async function getContext(scope: TravelScope, seed: Partial<TravelContext> = {}): Promise<TravelContext> {
  await wait(120)
  const start = seed.startDate ?? addDays(today(), 35)
  const policy = policyNow()
  return {
    applicationId: scope.applicationId ?? null,
    quotationId: scope.quotationId ?? null,
    auditPlanId: scope.auditPlanId ?? null,
    mode: seed.mode ?? 'ONSITE',
    startDate: start,
    endDate: seed.endDate ?? addDays(start, 1),
    currency: seed.currency ?? 'SAR',
    policyCurrency: 'SAR',
    samplesPending: policy.samplesPending,
    sites: (seed.sites?.length ? seed.sites : [{ name: 'Head office', address: 'Industrial City, Jeddah' }]).map((x) => {
      const p = resolve(x.city) ?? resolve(x.address) ?? resolve(x.name)
      return { ...x, onsite: x.onsite ?? true, resolved: p ? { city: p.city, country: p.country, iata: p.iata, source: 'city table' } : null }
    }),
    team: seed.team?.length ? seed.team : [{ name: 'Omar Haddad', role: 'Lead Auditor' }],
    quotedTravel: seed.quotedTravel ?? null,
    planTravelNotes: null,
    estimates: store()
      .filter((e) => (scope.auditPlanId ? e.scope.auditPlanId === scope.auditPlanId : scope.quotationId ? e.scope.quotationId === scope.quotationId : e.scope.applicationId === scope.applicationId && !e.scope.quotationId))
      .map((e) => ({ id: e.id ?? '', estimateNumber: e.estimateNumber ?? '', status: e.status, totalEstimated: e.totalEstimated, totalActual: e.totalActual, currency: e.currency, priceConfirmed: e.priceConfirmed, validUntil: e.validUntil, stale: e.stale, auditPlanId: e.auditPlanId, quotationId: e.quotationId, createdAt: e.createdAt ?? '' }))
      .reverse(),
  }
}

export async function preview(body: TravelEstimateRequest): Promise<TravelEstimate> {
  await wait(300)
  const e = build(body, 'PREVIEW')
  return clone({ ...e, canApprove: null })
}

export async function create(body: TravelEstimateRequest): Promise<TravelEstimate> {
  await wait(300)
  return updateState(ESTIMATES_KEY, () => [] as Stored[], (list) => {
    const e = build(body, 'DRAFT')
    e.id = `demo-trv-${Date.now()}`
    e.estimateNumber = `TRV-${String(list.length + 1).padStart(4, '0')}`
    event(e, 'CREATED', { total: e.totalEstimated })
    list.push(e)
    return clone(e)
  })
}

export async function get(id: string): Promise<TravelEstimate> {
  await wait(100)
  const e = store().find((x) => x.id === id)
  if (!e) throw new Error('Travel estimate not found.')
  return clone(e)
}

export async function refresh(id: string, body: Partial<TravelEstimateRequest>): Promise<TravelEstimate> {
  await wait(250)
  return updateState(ESTIMATES_KEY, () => [] as Stored[], (list) => {
    const i = list.findIndex((x) => x.id === id)
    if (i < 0) throw new Error('Travel estimate not found.')
    const prev = list[i]
    const next = build({ ...prev.request, ...body }, 'DRAFT', prev)
    const manual = prev.lines.filter((l) => l.manual)
    next.lines.push(...manual)
    totals(next)
    event(next, Object.keys(body).length ? 'RECALCULATED' : 'REFRESHED', { previousTotal: prev.totalEstimated })
    list[i] = next
    return clone(next)
  })
}

export const selectOption = (id: string, optionKey: string) =>
  mutate(id, (e) => {
    const option = e.options.find((o) => o.key === optionKey)
    if (!option) throw new Error('Unknown itinerary option.')
    e.selectedOption = optionKey
    e.lines = [...option.lines.map(toLine), ...e.lines.filter((l) => l.manual)]
    e.status = 'DRAFT'
    e.approvedAt = null
    e.approvedByName = null
    event(e, 'OPTION_SELECTED', { to: optionKey })
  })

export const adjust = (id: string, lineId: string, body: { quantity?: number; unitAmount?: number; justification: string } | { reset: true }) =>
  mutate(id, (e) => {
    const l = e.lines.find((x) => x.id === lineId)
    if (!l) throw new Error('Line not found.')
    if ('reset' in body) {
      if (l.calculatedAmount === null) return
      l.amount = l.calculatedAmount
      l.unitAmount = r2(l.calculatedAmount / (l.quantity || 1))
      l.status = l.calculatedStatus ?? 'BENCHMARK'
      Object.assign(l, { calculatedAmount: null, calculatedStatus: null, adjusted: false, adjustedByName: null, adjustedAt: null, adjustmentReason: null, adjustmentNeedsApproval: false })
      event(e, 'ADJUSTMENT_RESET', { label: l.label })
    } else {
      const baseline = l.calculatedAmount ?? l.amount
      if (l.calculatedAmount === null) { l.calculatedAmount = l.amount; l.calculatedStatus = l.status }
      l.quantity = body.quantity ?? l.quantity
      l.unitAmount = body.unitAmount ?? l.unitAmount
      l.amount = r2(l.quantity * l.unitAmount)
      l.status = 'MANUAL'
      Object.assign(l, { adjusted: true, adjustedByName: 'Demo CAB Admin', adjustedAt: new Date().toISOString(), adjustmentReason: body.justification, adjustmentNeedsApproval: Math.abs(l.amount - baseline) > policyNow().settings.adjustmentApprovalThreshold })
      event(e, 'ADJUSTED', { label: l.label, from: baseline, to: l.amount, justification: body.justification })
    }
    e.status = 'DRAFT'
  })

export const addLine = (id: string, body: { category: TravelCategory; label: string; quantity: number; unitAmount: number; justification: string; documentRef?: string }) =>
  mutate(id, (e) => {
    const l = toLine(line(`manual:${Date.now()}`, body.category, body.label, body.quantity, body.unitAmount, 'MANUAL', body.documentRef ? `Documented by Demo CAB Admin: ${body.documentRef}` : 'Entered by Demo CAB Admin', body.justification), e.lines.length)
    Object.assign(l, { manual: true, adjustedByName: 'Demo CAB Admin', adjustedAt: new Date().toISOString(), adjustmentReason: body.justification })
    e.lines.push(l)
    e.status = 'DRAFT'
    event(e, 'LINE_ADDED', { label: body.label, amount: l.amount, justification: body.justification })
  })

export const removeLine = (id: string, lineId: string) =>
  mutate(id, (e) => {
    const l = e.lines.find((x) => x.id === lineId)
    if (!l?.manual) throw new Error('Calculated lines cannot be removed; adjust them to 0 with a justification.')
    e.lines = e.lines.filter((x) => x.id !== lineId)
    e.status = 'DRAFT'
    event(e, 'LINE_REMOVED', { label: l.label })
  })

export const approve = (id: string) =>
  mutate(id, (e) => {
    if (e.stale) throw new Error('Refresh the estimate first.')
    e.status = 'APPROVED'
    e.approvedAt = new Date().toISOString()
    e.approvedByName = 'Demo CAB Admin'
    e.canApprove = false
    for (const l of e.lines) l.adjustmentNeedsApproval = false
    event(e, 'APPROVED', { total: e.totalEstimated })
  })

export const recordActuals = (id: string, rows: Array<{ lineId: string; actualAmount: number | null; note?: string }>) =>
  mutate(id, (e) => {
    for (const row of rows) {
      const l = e.lines.find((x) => x.id === row.lineId)
      if (!l) continue
      l.actualAmount = row.actualAmount
      l.actualNote = row.note ?? null
      l.actualRecordedAt = row.actualAmount === null ? null : new Date().toISOString()
    }
    event(e, 'ACTUALS_RECORDED', { lines: rows.length })
  })
