import { useTranslation } from 'react-i18next'
import { EntityTypeIcon } from '@/components/auth/EntityTypeIcon'
import { ENTITY_TYPE_OPTIONS, type EntityType } from '@/lib/entityTypes'
import { cn } from '@/lib/utils'

export type { EntityType }

interface EntityTypeOptionProps {
  selected: EntityType | null
  onSelect: (type: EntityType) => void
}

export function EntityTypeOption({ selected, onSelect }: EntityTypeOptionProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4 w-full">
      {ENTITY_TYPE_OPTIONS.map(({ type, labelKey }) => {
        const isSelected = selected === type
        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={cn(
              'flex w-full items-center gap-4 rounded-md border border-neutral-300 bg-white px-4 py-4',
              'text-start transition-colors hover:border-neutral-400',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              isSelected && 'border-primary bg-primary-subtle'
            )}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary-subtle">
              <EntityTypeIcon className="text-primary" />
            </div>
            <span className="text-body-1 text-neutral-900">{t(labelKey)}</span>
          </button>
        )
      })}
    </div>
  )
}
