import { useTranslation } from 'react-i18next'
import { fieldTitleClassName } from '@/components/ui'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import type { SectorKey, StandardKey } from '@/components/dashboard/entityData/fieldTypes'
import { MAX_FIELD_SELECTIONS, codesForStandardSector, sectorsForStandard } from '@/components/dashboard/entityData/fieldTypes'
import { StandardTabs } from '@/components/dashboard/entityData/StandardTabs'
import { SectorIcon } from '@/components/icons/sectorIcons'
import { WesternDigits } from '@/components/WesternDigits'
import { cn } from '@/lib/utils'

interface EntityDataFieldCodesStepProps {
  selectedSectors: SectorKey[]
  availableStandards: StandardKey[]
  activeStandard: StandardKey
  onActiveStandardChange: (standard: StandardKey) => void
  /** Selections keyed by `${standard}:${sector}` so switching tabs doesn't mix codes. */
  selectedCodes: Record<string, string[]>
  onSelectedCodesChange: (codes: Record<string, string[]>) => void
  standardCounts?: Record<string, number>
}

interface IafCodeCardProps {
  sector: SectorKey
  title: string
  code: string
  critical?: boolean
  selected: boolean
  disabled?: boolean
  onToggle: () => void
}

function IafCodeCard({ sector, title, code, critical, selected, disabled, onToggle }: IafCodeCardProps) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'flex w-full flex-col rounded-lg border-2 p-2 text-start text-body transition-colors',
        critical
          ? 'border-error-500 shadow-md'
          : selected
            ? 'border-primary'
            : 'border-neutral-100',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <div
        className={cn(
          'flex flex-col gap-3 rounded-lg bg-neutral-25 p-3',
          critical && 'shadow-md'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-white shadow-card">
            <SectorIcon sector={sector} selected={selected} className="size-6" />
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

        <p className={cn('min-h-16', fieldTitleClassName, 'text-neutral-900')}>{title}</p>

        <div className="flex items-center justify-between gap-3">
          <span className="text-body-sm text-neutral-700">
            <span className="text-body font-semibold">IAF</span> {t('ui.codeLabel')}
          </span>
          <span
            className={cn(
              'min-w-[31px] rounded-xs px-1 text-center text-body font-semibold',
              critical ? 'bg-error-50 text-error-500' : 'bg-success-50 text-success-600'
            )}
          >
            <WesternDigits>{code}</WesternDigits>
          </span>
        </div>
      </div>
    </button>
  )
}

export function EntityDataFieldCodesStep({
  selectedSectors,
  availableStandards,
  activeStandard,
  onActiveStandardChange,
  selectedCodes,
  onSelectedCodesChange,
  standardCounts,
}: EntityDataFieldCodesStepProps) {
  const { t } = useTranslation()

  const sectorTitle = (sector: SectorKey) => t(`accreditation.entityData.field.sectors.${sector}.title`)

  const codeTitle = (descriptionKey: string) =>
    t(`accreditation.entityData.field.iafCodes.${descriptionKey}`)

  const selectionKey = (sector: SectorKey) => `${activeStandard}:${sector}`

  const selectedCountForStandard = Object.entries(selectedCodes)
    .filter(([key]) => key.startsWith(`${activeStandard}:`))
    .reduce((total, [, codes]) => total + codes.length, 0)
  const atLimit = selectedCountForStandard >= MAX_FIELD_SELECTIONS

  const toggleCode = (sector: SectorKey, code: string) => {
    const key = selectionKey(sector)
    const sectorCodes = selectedCodes[key] ?? []
    if (sectorCodes.includes(code)) {
      onSelectedCodesChange({
        ...selectedCodes,
        [key]: sectorCodes.filter((item) => item !== code),
      })
      return
    }
    if (atLimit) return
    onSelectedCodesChange({
      ...selectedCodes,
      [key]: [...sectorCodes, code],
    })
  }

  // Only sectors that exist as clusters of the active standard per IAF MD 17
  const visibleSectors = sectorsForStandard(activeStandard).filter((sector) =>
    selectedSectors.includes(sector)
  )

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-[28px] font-semibold leading-[1.6] text-neutral-900">
            {t('accreditation.entityData.field.codesTitle')}
          </h3>
          <p className="text-body-sm text-neutral-700">
            {t('accreditation.entityData.field.maxCodesHint', { count: MAX_FIELD_SELECTIONS })}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-[rgba(252,234,232,0.5)] px-3 py-3">
          <span className="size-2 shrink-0 rounded-full bg-error-500" aria-hidden />
          <p className="text-body font-medium text-neutral-700">
            {t('accreditation.entityData.field.criticalCodeNote')}
          </p>
        </div>
      </div>

      <StandardTabs
        standards={availableStandards}
        activeStandard={activeStandard}
        onChange={onActiveStandardChange}
        counts={standardCounts}
      />

      {visibleSectors.map((sector) => {
        const codes = codesForStandardSector(activeStandard, sector)
        if (codes.length === 0) return null

        return (
          <div key={sector} className="space-y-5">
            <SectionHeading title={sectorTitle(sector)} size="compact" />
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {codes.map((item) => {
                const selected = (selectedCodes[selectionKey(sector)] ?? []).includes(item.code)
                return (
                  <IafCodeCard
                    key={item.code}
                    sector={sector}
                    title={codeTitle(item.descriptionKey)}
                    code={item.code}
                    critical={item.critical}
                    selected={selected}
                    disabled={atLimit && !selected}
                    onToggle={() => toggleCode(sector, item.code)}
                  />
                )
              })}
            </div>
          </div>
        )
      })}

    </div>
  )
}
