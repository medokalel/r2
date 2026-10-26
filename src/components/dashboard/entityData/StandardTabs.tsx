import { useTranslation } from 'react-i18next'
import {
  fieldStandardTabActiveClassName,
  fieldStandardTabClassName,
  fieldStandardTabInactiveClassName,
} from '@/components/ui'
import type { StandardKey } from '@/components/dashboard/entityData/fieldTypes'
import { WesternDigits } from '@/components/WesternDigits'
import { cn } from '@/lib/utils'

interface StandardTabsProps {
  standards: StandardKey[]
  activeStandard: StandardKey
  onChange: (standard: StandardKey) => void
  /**
   * Selection count per standard. When provided, each tab shows a badge so
   * the user can tell at a glance which certificates still need choices.
   */
  counts?: Record<string, number>
}

export function StandardTabs({
  standards,
  activeStandard,
  onChange,
  counts,
}: StandardTabsProps) {
  const { t } = useTranslation()

  return (
    <div className="inline-flex self-start rounded-lg border border-neutral-100 bg-neutral-50 p-1">
      {standards.map((standard) => {
        const isActive = activeStandard === standard
        const count = counts?.[standard]
        return (
          <button
            key={standard}
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(standard)}
            className={cn(
              fieldStandardTabClassName,
              'flex items-center gap-2',
              isActive ? fieldStandardTabActiveClassName : fieldStandardTabInactiveClassName
            )}
          >
            <WesternDigits>
              {t(`accreditation.entityData.field.standards.${standard}`)}
            </WesternDigits>
            {counts && (
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-caption font-semibold',
                  count
                    ? 'bg-success-50 text-success-600'
                    : 'bg-warning-50 text-warning-700'
                )}
                title={
                  count
                    ? undefined
                    : t('accreditation.entityData.field.tabNeedsSelection')
                }
              >
                <WesternDigits>{String(count ?? 0)}</WesternDigits>
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
