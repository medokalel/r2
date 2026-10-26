import * as Popover from '@radix-ui/react-popover'
import { useTranslation } from 'react-i18next'
import { AppIcon, InfoIcon } from '@/components/icons'
import { useDirection } from '@/context/direction/useDirection'
import { cn } from '@/lib/utils'

interface DashboardInfoButtonProps {
  /** Indicator name, used for the accessible label. */
  title: string
  /** What the indicator counts and where the number comes from. */
  text: string
  className?: string
}

/** Small "i" button that explains a dashboard indicator; works on tap and on hover devices alike. */
export function DashboardInfoButton({ title, text, className }: DashboardInfoButtonProps) {
  const { t } = useTranslation()
  const { dir } = useDirection()
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={t('cab.dashboard.info.aboutIndicator', { name: title, defaultValue: 'About {{name}}' })}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-primary-25 hover:text-primary focus-visible:outline-2 focus-visible:outline-focus',
            className
          )}
        >
          <AppIcon icon={InfoIcon} size={16} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          dir={dir}
          side="bottom"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          onClick={(event) => event.stopPropagation()}
          className="z-50 w-72 max-w-[calc(100vw-24px)] rounded-lg border border-primary-100 bg-primary-25 p-4 text-body-sm leading-[1.6] text-neutral-800 shadow-elevated"
        >
          <p className="mb-1 text-body-sm font-semibold text-primary">{title}</p>
          <p>{text}</p>
          <Popover.Arrow className="fill-primary-25" width={14} height={7} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
