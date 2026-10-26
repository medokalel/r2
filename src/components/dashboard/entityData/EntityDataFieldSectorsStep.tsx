import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, SearchOutlineIcon } from '@/components/icons'
import { SectorIcon } from '@/components/icons/sectorIcons'
import {
  fieldHeightClassName,
  fieldTitleClassName,
  TextField,
} from '@/components/ui'
import type { SectorKey, StandardKey } from '@/components/dashboard/entityData/fieldTypes'
import { MAX_FIELD_SELECTIONS, sectorsForStandard } from '@/components/dashboard/entityData/fieldTypes'
import { StandardTabs } from '@/components/dashboard/entityData/StandardTabs'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface EntityDataFieldSectorsStepProps {
  availableStandards: StandardKey[]
  activeStandard: StandardKey
  onActiveStandardChange: (standard: StandardKey) => void
  selectedSectors: SectorKey[]
  onSelectedSectorsChange: (sectors: SectorKey[]) => void
  standardCounts?: Record<string, number>
}

interface SectorCardProps {
  sectorKey: SectorKey
  title: string
  description: string
  selected: boolean
  disabled?: boolean
  onToggle: () => void
}

function SectorCard({ sectorKey, title, description, selected, disabled, onToggle }: SectorCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'flex w-full flex-col gap-3 rounded-lg border px-3 py-4 text-start text-body shadow-card transition-colors',
        selected
          ? 'border-primary-100 bg-primary-25'
          : 'border-neutral-100 bg-neutral-25 hover:border-neutral-400',
        disabled && 'cursor-not-allowed opacity-50 hover:border-neutral-100',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-md bg-white shadow-card"
        >
          <SectorIcon sector={sectorKey} selected={selected} />
        </span>
        <span
          className={cn(
            'flex size-5 shrink-0 items-center justify-center rounded border',
            selected ? 'border-primary bg-primary text-white' : 'border-neutral-400 bg-white'
          )}
          aria-hidden
        >
          {selected ? '✓' : ''}
        </span>
      </div>
      <div>
        <p className={cn(fieldTitleClassName, 'text-neutral-900')}>{title}</p>
        <p className="text-body-sm font-normal leading-[1.6] text-neutral-700">{description}</p>
      </div>
    </button>
  )
}

export function EntityDataFieldSectorsStep({
  availableStandards,
  activeStandard,
  onActiveStandardChange,
  selectedSectors,
  onSelectedSectorsChange,
  standardCounts,
}: EntityDataFieldSectorsStepProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')

  const sectorTitle = (key: SectorKey) => t(`accreditation.entityData.field.sectors.${key}.title`)
  const sectorDescription = (key: SectorKey) =>
    t(`accreditation.entityData.field.sectors.${key}.description`)

  const filteredSectors = useMemo(() => {
    // Clusters defined for the active standard per IAF MD 17
    const standardSectors = sectorsForStandard(activeStandard)
    const query = searchQuery.trim().toLowerCase()
    if (!query) return standardSectors

    const sectorTitle = (key: SectorKey) => t(`accreditation.entityData.field.sectors.${key}.title`)
    const sectorDescription = (key: SectorKey) =>
      t(`accreditation.entityData.field.sectors.${key}.description`)
    return standardSectors.filter((key) => {
      const title = sectorTitle(key).toLowerCase()
      const description = sectorDescription(key).toLowerCase()
      return title.includes(query) || description.includes(query)
    })
  }, [activeStandard, searchQuery, t])

  const atLimit = selectedSectors.length >= MAX_FIELD_SELECTIONS

  const toggleSector = (key: SectorKey) => {
    if (selectedSectors.includes(key)) {
      onSelectedSectorsChange(selectedSectors.filter((item) => item !== key))
      return
    }
    if (atLimit) return
    onSelectedSectorsChange([...selectedSectors, key].slice(0, MAX_FIELD_SELECTIONS))
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center gap-5">
        <div className="relative min-w-[280px] flex-1">
          <AppIcon
            icon={SearchOutlineIcon}
            size={24}
            className="pointer-events-none absolute start-6 top-1/2 -translate-y-1/2 text-primary"
          />
          <TextField
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="ps-14 pe-6"
          />
        </div>
        <Button
          type="button"
          variant="primary"
          className={cn(fieldHeightClassName, 'min-w-[120px] rounded-md')}
        >
          {t('accreditation.entityData.field.search')}
        </Button>
      </div>

      <StandardTabs
        standards={availableStandards}
        activeStandard={activeStandard}
        onChange={onActiveStandardChange}
        counts={standardCounts}
      />

      <p className="text-body-sm text-neutral-700">
        {t('accreditation.entityData.field.maxSectorsHint', { count: MAX_FIELD_SELECTIONS })}
      </p>

      <div className="sectors-grid grid gap-5 sm:grid-cols-2">
        {filteredSectors.map((key) => {
          const selected = selectedSectors.includes(key)
          return (
            <SectorCard
              key={key}
              sectorKey={key}
              title={sectorTitle(key)}
              description={sectorDescription(key)}
              selected={selected}
              disabled={atLimit && !selected}
              onToggle={() => toggleSector(key)}
            />
          )
        })}
      </div>
    </div>
  )
}
