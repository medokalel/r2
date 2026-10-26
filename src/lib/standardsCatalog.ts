/**
 * Catalog of the schemes a CAB can offer, with the full title of each standard and the
 * certification-body requirement standard that goes with it (the "complementary" standard
 * the accreditation body assesses the CAB against, next to ISO/IEC 17021-1 or ISO/IEC 17065).
 *
 * This is data only: titles live in i18n under `standards.catalog.<id>` and
 * `standards.cbRequirements.<key>`; nothing here states clauses.
 *
 * `name` is what the CAB profile persists as `CabScheme.schemeName`. `legacyNames` are the
 * names older versions of the wizard saved, so profiles saved before keep matching.
 */

export type SchemeActivity =
  | 'MS_CERTIFICATION_BODY'
  | 'PRODUCT_PROCESS_SERVICE_CERTIFICATION_BODY'
  | 'PERSONNEL_CERTIFICATION_BODY'
  | 'INSPECTION_BODY'
  | 'TESTING_LABORATORY'
  | 'CALIBRATION_LABORATORY'

/** A certification-body requirement standard (e.g. ISO/IEC 17021-3 for QMS). */
export interface CbRequirementStandard {
  /** i18n key suffix under `standards.cbRequirements`. */
  key: string
  /** Published designation, never translated. */
  code: string
}

export interface StandardCatalogEntry {
  /** Stable id stored in the wizard form (e.g. `ISO_9001`). */
  id: string
  activity: SchemeActivity
  /** Persisted scheme name (e.g. `ISO 9001:2015`). */
  name: string
  /** Designation without the edition, shown as the headline (e.g. `ISO 9001`). Empty for non ISO schemes. */
  designation: string
  /** Edition year, when the scheme is a dated standard. */
  edition?: string
  /** Short form shown as a tag (QMS, EMS…). */
  abbreviation?: string
  /** CAB requirement standard that applies next to ISO/IEC 17021-1, if one exists. */
  cbRequirement?: CbRequirementStandard
  /** Older persisted names that mean the same scheme. */
  legacyNames?: string[]
}

const CB: Record<string, CbRequirementStandard> = {
  QMS: { key: 'iso17021_3', code: 'ISO/IEC 17021-3' },
  EMS: { key: 'iso17021_2', code: 'ISO/IEC 17021-2' },
  OHS: { key: 'iso17021_10', code: 'ISO/IEC 17021-10' },
  FSMS: { key: 'iso22003_1', code: 'ISO 22003-1' },
  ISMS: { key: 'iso27006_1', code: 'ISO/IEC 27006-1' },
  ENMS: { key: 'iso50003', code: 'ISO 50003' },
  BCMS: { key: 'iso17021_6', code: 'ISO/IEC 17021-6' },
  ABMS: { key: 'iso17021_9', code: 'ISO/IEC 17021-9' },
  MDQMS: { key: 'iafMd9', code: 'IAF MD 9' },
  SMS: { key: 'iso20000_6', code: 'ISO/IEC 20000-6' },
  RTS: { key: 'iso17021_7', code: 'ISO/IEC TS 17021-7' },
  FM: { key: 'iso17021_11', code: 'ISO/IEC TS 17021-11' },
}

/** Legacy label written by older builds: "<designation> <U+2014> <short name>". */
const EM_DASH = String.fromCharCode(0x2014)
const legacy = (designation: string, short: string) => `${designation} ${EM_DASH} ${short}`

export const STANDARDS_CATALOG: StandardCatalogEntry[] = [
  // Management system certification (ISO/IEC 17021-1)
  { id: 'ISO_9001', activity: 'MS_CERTIFICATION_BODY', name: 'ISO 9001:2015', designation: 'ISO 9001', edition: '2015', abbreviation: 'QMS', cbRequirement: CB.QMS, legacyNames: [legacy('ISO 9001', 'QMS')] },
  { id: 'ISO_14001', activity: 'MS_CERTIFICATION_BODY', name: 'ISO 14001:2015', designation: 'ISO 14001', edition: '2015', abbreviation: 'EMS', cbRequirement: CB.EMS, legacyNames: [legacy('ISO 14001', 'EMS')] },
  { id: 'ISO_45001', activity: 'MS_CERTIFICATION_BODY', name: 'ISO 45001:2018', designation: 'ISO 45001', edition: '2018', abbreviation: 'OH&S', cbRequirement: CB.OHS, legacyNames: [legacy('ISO 45001', 'OH&S')] },
  { id: 'ISO_22000', activity: 'MS_CERTIFICATION_BODY', name: 'ISO 22000:2018', designation: 'ISO 22000', edition: '2018', abbreviation: 'FSMS', cbRequirement: CB.FSMS, legacyNames: [legacy('ISO 22000', 'FSMS')] },
  { id: 'ISO_27001', activity: 'MS_CERTIFICATION_BODY', name: 'ISO/IEC 27001:2022', designation: 'ISO/IEC 27001', edition: '2022', abbreviation: 'ISMS', cbRequirement: CB.ISMS, legacyNames: [legacy('ISO 27001', 'ISMS'), 'ISO 27001:2022'] },
  { id: 'ISO_50001', activity: 'MS_CERTIFICATION_BODY', name: 'ISO 50001:2018', designation: 'ISO 50001', edition: '2018', abbreviation: 'EnMS', cbRequirement: CB.ENMS, legacyNames: [legacy('ISO 50001', 'EnMS')] },
  { id: 'ISO_22301', activity: 'MS_CERTIFICATION_BODY', name: 'ISO 22301:2019', designation: 'ISO 22301', edition: '2019', abbreviation: 'BCMS', cbRequirement: CB.BCMS, legacyNames: [legacy('ISO 22301', 'BCMS')] },
  { id: 'ISO_13485', activity: 'MS_CERTIFICATION_BODY', name: 'ISO 13485:2016', designation: 'ISO 13485', edition: '2016', abbreviation: 'MD QMS', cbRequirement: CB.MDQMS, legacyNames: [legacy('ISO 13485', 'Medical devices QMS')] },
  { id: 'ISO_37001', activity: 'MS_CERTIFICATION_BODY', name: 'ISO 37001:2016', designation: 'ISO 37001', edition: '2016', abbreviation: 'ABMS', cbRequirement: CB.ABMS, legacyNames: [legacy('ISO 37001', 'Anti-bribery')] },
  { id: 'ISO_41001', activity: 'MS_CERTIFICATION_BODY', name: 'ISO 41001:2018', designation: 'ISO 41001', edition: '2018', abbreviation: 'FM', cbRequirement: CB.FM, legacyNames: [legacy('ISO 41001', 'Facility management')] },
  { id: 'ISO_20000_1', activity: 'MS_CERTIFICATION_BODY', name: 'ISO/IEC 20000-1:2018', designation: 'ISO/IEC 20000-1', edition: '2018', abbreviation: 'SMS', cbRequirement: CB.SMS },
  { id: 'ISO_39001', activity: 'MS_CERTIFICATION_BODY', name: 'ISO 39001:2012', designation: 'ISO 39001', edition: '2012', abbreviation: 'RTS', cbRequirement: CB.RTS },
  { id: 'ISO_21001', activity: 'MS_CERTIFICATION_BODY', name: 'ISO 21001:2018', designation: 'ISO 21001', edition: '2018', abbreviation: 'EOMS' },

  // Product, process and service certification (ISO/IEC 17065)
  { id: 'SASO_QUALITY_MARK', activity: 'PRODUCT_PROCESS_SERVICE_CERTIFICATION_BODY', name: 'SASO Quality Mark', designation: '' },
  { id: 'SABER_PRODUCT_COC', activity: 'PRODUCT_PROCESS_SERVICE_CERTIFICATION_BODY', name: 'SABER / Product CoC', designation: '' },
  { id: 'CE_MARKING', activity: 'PRODUCT_PROCESS_SERVICE_CERTIFICATION_BODY', name: 'CE Marking', designation: '' },
  { id: 'GOST_R', activity: 'PRODUCT_PROCESS_SERVICE_CERTIFICATION_BODY', name: 'GOST R', designation: '' },
  { id: 'ENERGY_EFFICIENCY', activity: 'PRODUCT_PROCESS_SERVICE_CERTIFICATION_BODY', name: 'Energy Efficiency', designation: '' },

  // Personnel certification (ISO/IEC 17024)
  { id: 'WELDING_PERSONNEL', activity: 'PERSONNEL_CERTIFICATION_BODY', name: 'Welding personnel certification', designation: '' },
  { id: 'NDT_PERSONNEL', activity: 'PERSONNEL_CERTIFICATION_BODY', name: 'NDT personnel certification', designation: '' },
  { id: 'AUDITOR_CERTIFICATION', activity: 'PERSONNEL_CERTIFICATION_BODY', name: 'Auditor certification', designation: '' },
  { id: 'HSE_PERSONNEL', activity: 'PERSONNEL_CERTIFICATION_BODY', name: 'HSE personnel certification', designation: '' },

  // Inspection (ISO/IEC 17020)
  { id: 'PRE_SHIPMENT_INSPECTION', activity: 'INSPECTION_BODY', name: 'Pre-shipment inspection', designation: '' },
  { id: 'THIRD_PARTY_INSPECTION', activity: 'INSPECTION_BODY', name: 'Third-party inspection', designation: '' },
  { id: 'LIFTING_EQUIPMENT', activity: 'INSPECTION_BODY', name: 'Lifting equipment inspection', designation: '' },
  { id: 'PRESSURE_VESSELS', activity: 'INSPECTION_BODY', name: 'Pressure vessel inspection', designation: '' },

  // Testing and calibration (ISO/IEC 17025)
  { id: 'CHEMICAL_TESTING', activity: 'TESTING_LABORATORY', name: 'Chemical testing', designation: '' },
  { id: 'MECHANICAL_TESTING', activity: 'TESTING_LABORATORY', name: 'Mechanical testing', designation: '' },
  { id: 'MICROBIOLOGICAL_TESTING', activity: 'TESTING_LABORATORY', name: 'Microbiological testing', designation: '' },
  { id: 'ELECTRICAL_TESTING', activity: 'TESTING_LABORATORY', name: 'Electrical testing', designation: '' },
  { id: 'DIMENSIONAL_CALIBRATION', activity: 'CALIBRATION_LABORATORY', name: 'Dimensional calibration', designation: '' },
  { id: 'ELECTRICAL_CALIBRATION', activity: 'CALIBRATION_LABORATORY', name: 'Electrical calibration', designation: '' },
  { id: 'TEMPERATURE_CALIBRATION', activity: 'CALIBRATION_LABORATORY', name: 'Temperature calibration', designation: '' },
  { id: 'MASS_CALIBRATION', activity: 'CALIBRATION_LABORATORY', name: 'Mass and volume calibration', designation: '' },
]

/** CAB accreditation standard per activity (the base requirement shown before the complementary one). */
export const ACTIVITY_BASE_STANDARD: Record<SchemeActivity, string> = {
  MS_CERTIFICATION_BODY: 'ISO/IEC 17021-1',
  PRODUCT_PROCESS_SERVICE_CERTIFICATION_BODY: 'ISO/IEC 17065',
  PERSONNEL_CERTIFICATION_BODY: 'ISO/IEC 17024',
  INSPECTION_BODY: 'ISO/IEC 17020',
  TESTING_LABORATORY: 'ISO/IEC 17025',
  CALIBRATION_LABORATORY: 'ISO/IEC 17025',
}

const byId = new Map(STANDARDS_CATALOG.map((entry) => [entry.id, entry]))

export function getCatalogEntry(id: string): StandardCatalogEntry | undefined {
  return byId.get(id)
}

/** i18n key of the full title of a catalog scheme (`.title` and `.subtitle`). */
export const standardTitleKey = (entry: StandardCatalogEntry) => `standards.catalog.${entry.id}`

/** i18n key of a certification-body requirement standard title. */
export const cbRequirementTitleKey = (cb: CbRequirementStandard) => `standards.cbRequirements.${cb.key}`

/** The number part of an ISO designation: "ISO/IEC 27001:2022" gives "27001", "ISO/IEC 20000-1" gives "20000-1". */
export function isoStandardKey(text: string): string | null {
  const match = String(text ?? '').trim().match(/^ISO(?:\/IEC)?\s*(?:TS\s*)?(\d{4,5}(?:-\d+)?)/i)
  return match ? match[1] : null
}

/**
 * Finds the catalog scheme a stored or typed name means: the catalog id, the current name,
 * a legacy name, or any ISO designation of the same standard ("ISO 9001", "ISO 9001:2015").
 */
export function matchCatalogScheme(nameOrId: string): StandardCatalogEntry | undefined {
  const value = String(nameOrId ?? '').trim()
  if (!value) return undefined
  const direct = byId.get(value)
  if (direct) return direct
  const lower = value.toLowerCase()
  const exact = STANDARDS_CATALOG.find(
    (entry) => entry.name.toLowerCase() === lower || entry.legacyNames?.some((name) => name.toLowerCase() === lower),
  )
  if (exact) return exact
  const key = isoStandardKey(value)
  if (!key) return undefined
  return STANDARDS_CATALOG.find((entry) => entry.designation && isoStandardKey(entry.designation) === key)
}

/** True when two scheme names refer to the same standard (exact match or same catalog scheme). */
export function isSameScheme(a: string, b: string): boolean {
  if (a.trim() === b.trim()) return true
  const left = matchCatalogScheme(a)
  return Boolean(left && left === matchCatalogScheme(b))
}

/**
 * Display form of a stored scheme name: legacy names become the current catalog name
 * (so "ISO 9001" with a dash suffix shows as "ISO 9001:2015"); anything else is returned as is.
 */
export function schemeDisplayName(name: string): string {
  const value = String(name ?? '').trim()
  const entry = STANDARDS_CATALOG.find((item) => item.legacyNames?.includes(value))
  return entry ? entry.name : value
}

/** Schemes for the given CAB activities (all MS schemes when none match). */
export function catalogForActivities(activities: string[]): StandardCatalogEntry[] {
  const matched = STANDARDS_CATALOG.filter((entry) => activities.includes(entry.activity))
  return matched.length > 0 ? matched : STANDARDS_CATALOG.filter((entry) => entry.activity === 'MS_CERTIFICATION_BODY')
}
