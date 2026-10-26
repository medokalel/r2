import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useDirection } from '@/context/direction/useDirection'
import { useTranslation } from 'react-i18next'
import { AppIcon, GlobeIcon } from '@/components/icons'

function LanguageChevronIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
import { cn } from '@/lib/utils'

// A language is not a country, so no flags: each option shows its own name and a short mark.
const languages = [
  { code: 'ar' as const, label: 'العربية', short: 'ع', dir: 'rtl' as const },
  { code: 'en' as const, label: 'English', short: 'EN', dir: 'ltr' as const },
]

interface LanguageToggleProps {
  variant?: 'default' | 'icon'
  /** Hides the dropdown chevron in "icon" variant. Defaults to true (existing behavior everywhere). */
  showChevron?: boolean
  className?: string
}

function CheckMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M4.5 10.5L8 14L15.5 6"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LanguageToggle({ variant = 'default', showChevron = true, className }: LanguageToggleProps) {
  const { lang, setLanguage } = useDirection()
  const { t } = useTranslation()

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {variant === 'icon' ? (
          <button
            type="button"
            className={cn(
              'inline-flex size-10 shrink-0 items-center justify-center gap-0.5 sm:gap-1',
              'text-neutral-800 hover:text-primary transition-colors',
              'rounded-md',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              className
            )}
            aria-label={t('common.language')}
          >
            {showChevron && (
              <LanguageChevronIcon size={18} className="size-[16px] sm:size-[18px]" />
            )}
            <AppIcon icon={GlobeIcon} size={32} className="size-[28px] sm:size-8" />
          </button>
        ) : (
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-3 py-2',
              'text-small-medium text-neutral-700 hover:bg-neutral-50 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              className
            )}
            aria-label={t('common.language')}
          >
            <AppIcon icon={GlobeIcon} size={20} />
            <span lang={lang}>{lang === 'ar' ? 'العربية' : 'English'}</span>
            <LanguageChevronIcon size={18} />
          </button>
        )}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={cn(
            'z-50 min-w-[180px] overflow-hidden rounded-lg border border-neutral-100 bg-white p-1.5',
            'shadow-card',
            'data-[state=open]:animate-[fadeInScale_0.14s_ease-out]'
          )}
          sideOffset={8}
          align="end"
          collisionPadding={18}
        >
          {languages.map(({ code, label, short, dir }) => {
            const active = lang === code
            return (
              <DropdownMenu.Item
                key={code}
                onSelect={() => setLanguage(code)}
                className={cn(
                  'flex cursor-pointer select-none items-center gap-3 rounded-md px-2.5 py-2',
                  'outline-none transition-colors',
                  active
                    ? 'bg-primary-25'
                    : 'hover:bg-neutral-25 focus:bg-neutral-25'
                )}
              >
                <span
                  className={cn(
                    'flex h-7 min-w-9 shrink-0 items-center justify-center rounded-sm px-1.5 text-caption font-semibold leading-none',
                    active ? 'bg-primary text-white' : 'bg-neutral-50 text-neutral-800',
                    code === 'ar' && '[font-family:var(--font-arabic)] text-body-sm'
                  )}
                  dir={dir}
                  aria-hidden
                >
                  {short}
                </span>
                <span
                  className={cn(
                    'min-w-0 flex-1 text-body-sm font-medium',
                    active ? 'text-primary' : 'text-neutral-900',
                    code === 'ar' && '[font-family:var(--font-arabic)]'
                  )}
                  lang={code}
                >
                  {label}
                </span>
                {active && (
                  <span className="shrink-0 text-primary" aria-hidden>
                    <CheckMark />
                  </span>
                )}
              </DropdownMenu.Item>
            )
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
