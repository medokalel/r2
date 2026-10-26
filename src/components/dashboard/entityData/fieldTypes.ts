/**
 * Standards, technical clusters and IAF codes per IAF MD 17:2023
 * (Witnessing Activities for the Accreditation of Management Systems
 * Certification Bodies), Issue 2, Version 2 — sections 5, 6 and 7.
 */

export const standards = [
  'iso9001',
  'iso14001',
  'iso45001',
  'iso50001',
  'iso22000',
  'iso22301',
  'iso27001',
  'iso13485',
] as const

export type StandardKey = (typeof standards)[number]

/** Max economic sectors and IAF codes a user can pick per standard. */
export const MAX_FIELD_SELECTIONS = 2

export const standardLabels: Record<StandardKey, string> = {
  iso9001: 'ISO 9001',
  iso14001: 'ISO 14001',
  iso45001: 'ISO 45001',
  iso50001: 'ISO 50001',
  iso22000: 'ISO 22000',
  iso22301: 'ISO 22301',
  iso27001: 'ISO/IEC 27001',
  iso13485: 'ISO 13485',
}

export const sectorKeys = [
  'agriculture',
  'food',
  'mechanicalIndustries',
  'paperAndPrinting',
  'metalsAndBuildingMaterials',
  'constructionAndBuilding',
  'industrialProduction',
  'chemicalIndustries',
  'miningAndQuarrying',
  'energySupplies',
  'transportationAndWaste',
  'services',
  'nuclearSector',
  'pharmaceuticalSector',
  'aviationAndSpace',
  'healthSector',
] as const

export type SectorKey = (typeof sectorKeys)[number]

export type FieldPhase = 'sectors' | 'codes'

export interface IafCode {
  /** IAF code number as displayed, e.g. "03" */
  code: string
  /** i18n key under accreditation.entityData.field.iafCodes */
  descriptionKey: string
  /** Critical code per the "Critical code(s)" column of IAF MD 17 */
  critical?: boolean
}

export interface StandardCluster {
  sector: SectorKey
  codes: IafCode[]
}

export interface IafCodeItem {
  id: string
  code: string
  critical?: boolean
}

// Section 5 — Quality Management Systems (ISO 9001)
const ISO_9001_CLUSTERS: StandardCluster[] = [
  {
    sector: 'food',
    codes: [
      { code: '01', descriptionKey: 'agriculture' },
      { code: '03', descriptionKey: 'foodBeverage', critical: true },
      { code: '30', descriptionKey: 'hotels' },
    ],
  },
  {
    sector: 'mechanicalIndustries',
    codes: [
      { code: '17', descriptionKey: 'basicMetals' },
      { code: '18', descriptionKey: 'machinery' },
      { code: '19', descriptionKey: 'electrical' },
      { code: '20', descriptionKey: 'shipbuilding', critical: true },
      { code: '22', descriptionKey: 'otherTransport', critical: true },
    ],
  },
  {
    sector: 'paperAndPrinting',
    codes: [
      { code: '07', descriptionKey: 'paperProducts' },
      { code: '08', descriptionKey: 'publishing' },
      { code: '09', descriptionKey: 'printing', critical: true },
    ],
  },
  {
    sector: 'metalsAndBuildingMaterials',
    codes: [
      { code: '02', descriptionKey: 'mining', critical: true },
      { code: '15', descriptionKey: 'nonMetallic', critical: true },
      { code: '16', descriptionKey: 'concrete' },
    ],
  },
  {
    sector: 'constructionAndBuilding',
    codes: [
      { code: '28', descriptionKey: 'construction', critical: true },
      { code: '34', descriptionKey: 'engineering' },
    ],
  },
  {
    sector: 'industrialProduction',
    codes: [
      { code: '04', descriptionKey: 'textiles' },
      { code: '05', descriptionKey: 'leather', critical: true },
      { code: '06', descriptionKey: 'wood' },
      { code: '14', descriptionKey: 'rubberPlastic', critical: true },
      { code: '23', descriptionKey: 'otherManufacturing' },
    ],
  },
  {
    sector: 'chemicalIndustries',
    codes: [
      { code: '07', descriptionKey: 'pulpPaper' },
      { code: '10', descriptionKey: 'petroleum' },
      { code: '12', descriptionKey: 'chemicals', critical: true },
    ],
  },
  {
    sector: 'energySupplies',
    codes: [
      { code: '25', descriptionKey: 'electricity' },
      { code: '26', descriptionKey: 'gas', critical: true },
      { code: '27', descriptionKey: 'water' },
    ],
  },
  {
    sector: 'transportationAndWaste',
    codes: [
      { code: '24', descriptionKey: 'recycling', critical: true },
      { code: '31', descriptionKey: 'transport' },
      { code: '39', descriptionKey: 'otherSocial' },
    ],
  },
  {
    sector: 'services',
    codes: [
      { code: '29', descriptionKey: 'wholesale' },
      { code: '32', descriptionKey: 'financial' },
      { code: '33', descriptionKey: 'it', critical: true },
      { code: '35', descriptionKey: 'otherServices' },
      { code: '37', descriptionKey: 'education', critical: true },
      { code: '36', descriptionKey: 'publicAdmin' },
    ],
  },
  { sector: 'nuclearSector', codes: [{ code: '11', descriptionKey: 'nuclearFuel', critical: true }] },
  { sector: 'pharmaceuticalSector', codes: [{ code: '13', descriptionKey: 'pharmaceuticals', critical: true }] },
  { sector: 'aviationAndSpace', codes: [{ code: '21', descriptionKey: 'aerospace', critical: true }] },
  { sector: 'healthSector', codes: [{ code: '38', descriptionKey: 'health', critical: true }] },
]

// Section 6 — Environmental Management Systems (ISO 14001)
const ISO_14001_CLUSTERS: StandardCluster[] = [
  { sector: 'agriculture', codes: [{ code: '01', descriptionKey: 'agriculture', critical: true }] },
  {
    sector: 'food',
    codes: [
      { code: '03', descriptionKey: 'foodBeverage', critical: true },
      { code: '30', descriptionKey: 'hotels' },
    ],
  },
  {
    sector: 'mechanicalIndustries',
    codes: [
      { code: '17', descriptionKey: 'fabricatedMetal' },
      { code: '18', descriptionKey: 'machinery' },
      { code: '19', descriptionKey: 'electrical' },
      { code: '20', descriptionKey: 'shipbuilding', critical: true },
      { code: '21', descriptionKey: 'aerospace', critical: true },
      { code: '22', descriptionKey: 'otherTransport' },
    ],
  },
  {
    sector: 'paperAndPrinting',
    codes: [
      { code: '07', descriptionKey: 'paperProducts' },
      { code: '08', descriptionKey: 'publishing' },
      { code: '09', descriptionKey: 'printing', critical: true },
    ],
  },
  {
    sector: 'constructionAndBuilding',
    codes: [
      { code: '28', descriptionKey: 'construction', critical: true },
      { code: '34', descriptionKey: 'engineering' },
    ],
  },
  {
    sector: 'industrialProduction',
    codes: [
      { code: '04', descriptionKey: 'textiles', critical: true },
      { code: '05', descriptionKey: 'leather', critical: true },
      { code: '06', descriptionKey: 'wood' },
      { code: '23', descriptionKey: 'otherManufacturing' },
    ],
  },
  {
    sector: 'chemicalIndustries',
    codes: [
      { code: '07', descriptionKey: 'pulpPaper', critical: true },
      { code: '10', descriptionKey: 'petroleum', critical: true },
      { code: '12', descriptionKey: 'chemicals', critical: true },
      { code: '13', descriptionKey: 'pharmaceuticals', critical: true },
      { code: '14', descriptionKey: 'rubberPlastic' },
      { code: '15', descriptionKey: 'nonMetallic' },
      { code: '16', descriptionKey: 'concrete' },
      { code: '17', descriptionKey: 'baseMetals' },
    ],
  },
  { sector: 'miningAndQuarrying', codes: [{ code: '02', descriptionKey: 'mining', critical: true }] },
  {
    sector: 'energySupplies',
    codes: [
      { code: '25', descriptionKey: 'electricity', critical: true },
      { code: '26', descriptionKey: 'gas', critical: true },
      { code: '27', descriptionKey: 'water' },
    ],
  },
  {
    sector: 'transportationAndWaste',
    codes: [
      { code: '31', descriptionKey: 'transport' },
      { code: '24', descriptionKey: 'recycling', critical: true },
      { code: '39', descriptionKey: 'otherSocial', critical: true },
    ],
  },
  {
    sector: 'services',
    codes: [
      { code: '29', descriptionKey: 'wholesale', critical: true },
      { code: '32', descriptionKey: 'financial' },
      { code: '33', descriptionKey: 'it' },
      { code: '35', descriptionKey: 'otherServices', critical: true },
      { code: '36', descriptionKey: 'publicAdmin', critical: true },
      { code: '37', descriptionKey: 'education' },
    ],
  },
  { sector: 'nuclearSector', codes: [{ code: '11', descriptionKey: 'nuclearFuel', critical: true }] },
  { sector: 'healthSector', codes: [{ code: '38', descriptionKey: 'health', critical: true }] },
]

// Section 7 — Occupational Health & Safety Management Systems (ISO 45001)
const ISO_45001_CLUSTERS: StandardCluster[] = [
  { sector: 'agriculture', codes: [{ code: '01', descriptionKey: 'agriculture', critical: true }] },
  {
    sector: 'food',
    codes: [
      { code: '03', descriptionKey: 'foodBeverage', critical: true },
      { code: '30', descriptionKey: 'hotels' },
    ],
  },
  {
    sector: 'mechanicalIndustries',
    codes: [
      { code: '17', descriptionKey: 'fabricatedMetal' },
      { code: '18', descriptionKey: 'machinery' },
      { code: '19', descriptionKey: 'electrical' },
      { code: '20', descriptionKey: 'shipbuilding', critical: true },
      { code: '21', descriptionKey: 'aerospace', critical: true },
      { code: '22', descriptionKey: 'otherTransport' },
    ],
  },
  {
    sector: 'paperAndPrinting',
    codes: [
      { code: '07', descriptionKey: 'paperProducts' },
      { code: '08', descriptionKey: 'publishing' },
      { code: '09', descriptionKey: 'printing', critical: true },
    ],
  },
  {
    sector: 'constructionAndBuilding',
    codes: [
      { code: '28', descriptionKey: 'construction', critical: true },
      { code: '34', descriptionKey: 'engineering' },
    ],
  },
  {
    sector: 'industrialProduction',
    codes: [
      { code: '04', descriptionKey: 'textiles', critical: true },
      { code: '05', descriptionKey: 'leather', critical: true },
      { code: '06', descriptionKey: 'wood', critical: true },
      { code: '23', descriptionKey: 'otherManufacturing' },
    ],
  },
  {
    sector: 'chemicalIndustries',
    codes: [
      { code: '07', descriptionKey: 'pulpPaper', critical: true },
      { code: '10', descriptionKey: 'petroleum', critical: true },
      { code: '12', descriptionKey: 'chemicals', critical: true },
      { code: '13', descriptionKey: 'pharmaceuticals', critical: true },
      { code: '14', descriptionKey: 'rubberPlastic' },
      { code: '15', descriptionKey: 'nonMetallic' },
      { code: '16', descriptionKey: 'concrete', critical: true },
      { code: '17', descriptionKey: 'baseMetals', critical: true },
    ],
  },
  { sector: 'miningAndQuarrying', codes: [{ code: '02', descriptionKey: 'mining', critical: true }] },
  {
    sector: 'energySupplies',
    codes: [
      { code: '25', descriptionKey: 'electricity', critical: true },
      { code: '26', descriptionKey: 'gas', critical: true },
      { code: '27', descriptionKey: 'water' },
    ],
  },
  {
    sector: 'transportationAndWaste',
    codes: [
      { code: '31', descriptionKey: 'transport', critical: true },
      { code: '24', descriptionKey: 'recycling', critical: true },
      { code: '39', descriptionKey: 'otherSocial', critical: true },
    ],
  },
  {
    sector: 'services',
    codes: [
      { code: '29', descriptionKey: 'wholesale', critical: true },
      { code: '32', descriptionKey: 'financial' },
      { code: '33', descriptionKey: 'it' },
      { code: '35', descriptionKey: 'otherServices', critical: true },
      { code: '36', descriptionKey: 'publicAdmin', critical: true },
      { code: '37', descriptionKey: 'education' },
    ],
  },
  { sector: 'nuclearSector', codes: [{ code: '11', descriptionKey: 'nuclearFuel', critical: true }] },
  { sector: 'healthSector', codes: [{ code: '38', descriptionKey: 'health', critical: true }] },
]

export const STANDARD_CLUSTERS: Record<StandardKey, StandardCluster[]> = {
  iso9001: ISO_9001_CLUSTERS,
  iso14001: ISO_14001_CLUSTERS,
  iso45001: ISO_45001_CLUSTERS,
  // TEMPORARY: reusing ISO 9001's sector/IAF code table as a placeholder
  // until the real cluster data for these standards is provided.
  iso50001: ISO_9001_CLUSTERS,
  iso22000: ISO_9001_CLUSTERS,
  iso22301: ISO_9001_CLUSTERS,
  iso27001: ISO_9001_CLUSTERS,
  iso13485: ISO_9001_CLUSTERS,
}

export function sectorsForStandard(standard: StandardKey): SectorKey[] {
  return STANDARD_CLUSTERS[standard].map((cluster) => cluster.sector)
}

export function codesForStandardSector(
  standard: StandardKey,
  sector: SectorKey
): IafCode[] {
  return STANDARD_CLUSTERS[standard].find((cluster) => cluster.sector === sector)?.codes ?? []
}