import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useTranslation } from 'react-i18next'
import { useDirection } from '@/context/direction/useDirection'
import { cn } from '@/lib/utils'

export interface ActionMenuItem {
  key: string
  label: string
  onSelect: () => void
  disabled?: boolean
  /** Why the item is disabled (shown under the label). */
  hint?: string
  tone?: 'default' | 'destructive'
}

interface ActionMenuProps {
  items: ActionMenuItem[]
  /** Visible trigger text; omitted → a "•••" icon button labelled `ariaLabel`. */
  label?: string
  ariaLabel?: string
  triggerClassName?: string
  align?: 'start' | 'end'
  /** Optional heading rendered at the top of the menu. */
  heading?: string
}

/** Dropdown of actions used for row menus and "More actions" buttons on the CAB workflow screens. */
export function ActionMenu({ items, label, ariaLabel, triggerClassName, align = 'end', heading }: ActionMenuProps) {
  const { t } = useTranslation()
  const { dir } = useDirection()
  return (
    <DropdownMenu.Root dir={dir}>
      <DropdownMenu.Trigger asChild>
        {label ? (
          <button
            type="button"
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-md border border-neutral-100 bg-white px-3 text-body-sm font-medium text-neutral-800 transition hover:bg-neutral-50',
              triggerClassName,
            )}
          >
            <span>{label}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            aria-label={ariaLabel ?? t('common.moreActions', 'More actions')}
            className={cn(
              'inline-flex size-9 items-center justify-center rounded-md text-neutral-700 transition hover:bg-neutral-100',
              triggerClassName,
            )}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
        )}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={4}
          className="z-50 min-w-[220px] max-w-[min(320px,calc(100vw-24px))] rounded-md border border-neutral-100 bg-white p-1 shadow-lg"
        >
          {heading && <DropdownMenu.Label className="px-3 py-2 text-caption font-semibold text-neutral-600">{heading}</DropdownMenu.Label>}
          {items.map((item) => (
            <DropdownMenu.Item
              key={item.key}
              disabled={item.disabled}
              onSelect={() => item.onSelect()}
              className={cn(
                'flex cursor-pointer select-none flex-col items-start gap-0.5 rounded-sm px-3 py-2 text-start text-body-sm outline-none',
                'data-[highlighted]:bg-primary-50 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60',
                item.tone === 'destructive' ? 'text-error-600' : 'text-neutral-800',
              )}
            >
              <span className="font-medium">{item.label}</span>
              {item.disabled && item.hint && <span className="text-caption font-normal text-neutral-600">{item.hint}</span>}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
