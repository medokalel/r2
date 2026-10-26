import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { FieldPhase, SectorKey, StandardKey } from '@/components/dashboard/entityData/fieldTypes'
import { EntityDataFieldCodesStep } from '@/components/dashboard/entityData/EntityDataFieldCodesStep'
import { EntityDataFieldSectorsStep } from '@/components/dashboard/entityData/EntityDataFieldSectorsStep'

interface EntityDataFieldStepProps {
  phase: FieldPhase
  /** Sector selections per standard — each tab keeps its own list. */
  selectedSectors: Record<string, SectorKey[]>
  onSelectedSectorsChange: (standard: StandardKey, sectors: SectorKey[]) => void
  selectedStandards?: StandardKey[]
  selectedCodes: Record<string, string[]>
  onSelectedCodesChange: (codes: Record<string, string[]>) => void
}

export function EntityDataFieldStep({
  phase,
  selectedSectors,
  onSelectedSectorsChange,
  selectedStandards,
  selectedCodes,
  onSelectedCodesChange,
}: EntityDataFieldStepProps) {
  const { t } = useTranslation()

  // Tabs are limited to what the user picked in "Required Standard Specification"
  const availableStandards = selectedStandards ?? []

  const [activeStandard, setActiveStandard] = useState<StandardKey | undefined>(
    availableStandards[0]
  )
  const effectiveStandard = activeStandard && availableStandards.includes(activeStandard)
    ? activeStandard
    : availableStandards[0]

  if (!effectiveStandard) {
    return (
      <p className="rounded-md bg-neutral-50 p-5 text-body-2 text-neutral-700">
        {t('accreditation.entityData.field.noStandardsSelected')}
      </p>
    )
  }

  const activeSectors = selectedSectors[effectiveStandard] ?? []

  // Per-tab selection counts so users can see which certificates still need choices
  const sectorCounts = Object.fromEntries(
    availableStandards.map((standard) => [
      standard,
      (selectedSectors[standard] ?? []).length,
    ])
  )
  const codeCounts = Object.fromEntries(
    availableStandards.map((standard) => [
      standard,
      Object.entries(selectedCodes)
        .filter(([key]) => key.startsWith(`${standard}:`))
        .reduce((total, [, codes]) => total + codes.length, 0),
    ])
  )

  if (phase === 'codes') {
    return (
      <EntityDataFieldCodesStep
        selectedSectors={activeSectors}
        availableStandards={availableStandards}
        activeStandard={effectiveStandard}
        onActiveStandardChange={setActiveStandard}
        selectedCodes={selectedCodes}
        onSelectedCodesChange={onSelectedCodesChange}
        standardCounts={codeCounts}
      />
    )
  }

  return (
    <EntityDataFieldSectorsStep
      availableStandards={availableStandards}
      activeStandard={effectiveStandard}
      onActiveStandardChange={setActiveStandard}
      selectedSectors={activeSectors}
      onSelectedSectorsChange={(sectors) =>
        onSelectedSectorsChange(effectiveStandard, sectors)
      }
      standardCounts={sectorCounts}
    />
  )
}