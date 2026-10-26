/**
 * IAF codes and the economic-sector icons (public/field-sectors/*.svg) used across the app:
 * the field-sectors picker, the personnel register chips and the CAB accredited scope.
 */
import type { SectorKey } from '@/components/dashboard/entityData/fieldTypes'
import { iafDigits } from '@/lib/criticalCodeExams'

/** IAF code (two digits) to the economic-sector icon used in the field-sectors picker. */
export const IAF_SECTOR: Record<string, SectorKey> = {
  '01': 'agriculture', '02': 'miningAndQuarrying', '03': 'food',
  '04': 'industrialProduction', '05': 'industrialProduction', '06': 'industrialProduction',
  '07': 'paperAndPrinting', '08': 'paperAndPrinting', '09': 'paperAndPrinting',
  '10': 'energySupplies', '11': 'nuclearSector', '12': 'chemicalIndustries',
  '13': 'pharmaceuticalSector', '14': 'chemicalIndustries', '15': 'metalsAndBuildingMaterials',
  '16': 'metalsAndBuildingMaterials', '17': 'metalsAndBuildingMaterials', '18': 'mechanicalIndustries',
  '19': 'mechanicalIndustries', '20': 'mechanicalIndustries', '21': 'aviationAndSpace',
  '22': 'mechanicalIndustries', '23': 'industrialProduction', '24': 'transportationAndWaste',
  '25': 'energySupplies', '26': 'energySupplies', '27': 'energySupplies',
  '28': 'constructionAndBuilding', '29': 'services', '30': 'services',
  '31': 'transportationAndWaste', '32': 'services', '33': 'services', '34': 'services',
  '35': 'services', '36': 'services', '37': 'services', '38': 'healthSector', '39': 'services',
}

/** Sector of any IAF code form ("IAF_29", "29", "EA 29"), or undefined. */
export function iafSectorKey(code: string): SectorKey | undefined {
  return IAF_SECTOR[iafDigits(code)]
}

/** Stored form used by the CAB scope picker ("IAF_29") for any IAF code form. */
export function toIafValue(code: string): string {
  const digits = iafDigits(code)
  return /^\d{2}$/.test(digits) ? `IAF_${digits}` : code
}
