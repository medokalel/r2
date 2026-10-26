import { cn } from '@/lib/utils'

interface SectionTitleProps {
  title: string
  subtitle?: string
  className?: string
}

/**
 * Unified section header used across all pages:
 * primary vertical bar + 20px / weight-600 title, with an optional subtitle
 * the bar stretches to cover.
 */
export function SectionTitle({ title, subtitle, className }: SectionTitleProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span
        className={cn(
          'w-[5px] shrink-0 rounded-md bg-primary',
          subtitle ? 'self-stretch' : 'h-8'
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <h3 className="section-heading text-body-lg font-semibold leading-[1.6] text-primary">
          {title}
        </h3>
        {subtitle && (
          <p className="text-body-sm font-normal leading-[1.6] text-neutral-700">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
