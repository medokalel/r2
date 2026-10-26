import { cn } from '@/lib/utils'
import { AppIcon, type AppIconComponent } from '@/components/icons'

interface CabOptionCardProps {
  icon?: AppIconComponent
  title: string
  description?: string
  selected: boolean
  onSelect: () => void
  className?: string
  /** Compact single-line cards for multi-select area pickers. */
  compact?: boolean
}

/** Single-select card: org type, accreditation body, etc — dashed primary border when chosen. */
export function CabOptionCard({
  icon,
  title,
  description,
  selected,
  onSelect,
  className,
  compact = false,
}: CabOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative flex w-full rounded-md border-2 bg-white text-start',
        'transition-all duration-300 ease-out motion-safe:hover:shadow-sm motion-safe:active:scale-[0.98]',
        compact
          ? 'h-11 items-center px-3 pe-9'
          : 'flex-col items-start p-4 pe-10',
        selected
          ? 'onboarding-card-selected border-dashed border-primary bg-primary-subtle shadow-sm motion-safe:scale-[1.01]'
          : 'onboarding-card-deselected border-neutral-300 hover:border-neutral-400',
        className
      )}
    >
      {icon && !compact && (
        <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-primary-subtle">
          <AppIcon icon={icon} size={20} className="text-primary" />
        </div>
      )}
      <p
        className={cn(
          compact
            ? 'w-full truncate text-caption font-medium leading-none text-neutral-900'
            : 'text-body-sm font-semibold leading-[1.4] text-neutral-900'
        )}
      >
        {title}
      </p>
      {description && !compact && (
        <p className="mt-3 text-caption leading-[1.6] text-neutral-600">{description}</p>
      )}
      <span
        className={cn(
          'absolute flex size-4 shrink-0 items-center justify-center rounded-sm border text-overline leading-none text-white',
          'transition-all duration-300 ease-out',
          compact ? 'end-3 top-1/2 -translate-y-1/2' : 'end-4 top-4',
          selected
            ? 'scale-100 border-primary bg-primary opacity-100'
            : 'scale-75 border-neutral-400 bg-neutral-400 opacity-80'
        )}
        aria-hidden
      >
        ✓
      </span>
    </button>
  )
}
