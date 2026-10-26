import type { SectorKey } from '@/components/dashboard/entityData/fieldTypes'

export const sectorIconSources: Record<SectorKey, string> = {
  agriculture: '/field-sectors/food.svg',
  miningAndQuarrying: '/field-sectors/metals-and-building-materials.svg',
  food: '/field-sectors/food.svg',
  mechanicalIndustries: '/field-sectors/mechanical-industries.svg',
  paperAndPrinting: '/field-sectors/paper-and-printing.svg',
  metalsAndBuildingMaterials: '/field-sectors/metals-and-building-materials.svg',
  constructionAndBuilding: '/field-sectors/construction-and-building.svg',
  industrialProduction: '/field-sectors/industrial-production.svg',
  chemicalIndustries: '/field-sectors/chemical-industries.svg',
  energySupplies: '/field-sectors/energy-supplies.svg',
  transportationAndWaste: '/field-sectors/transportation-and-waste.svg',
  services: '/field-sectors/services.svg',
  nuclearSector: '/field-sectors/nuclear-sector.svg',
  pharmaceuticalSector: '/field-sectors/pharmaceutical-sector.svg',
  aviationAndSpace: '/field-sectors/aviation-and-space.svg',
  healthSector: '/field-sectors/health-sector.svg',
}
