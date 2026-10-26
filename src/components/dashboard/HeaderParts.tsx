import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

/**
 * Shared pieces of the dashboard header, built to Figma "Header" (iCASCO Main 5003:20256):
 * white bar, 2px Alabaster/150 bottom border, 20px padding, groups separated by 64px
 * vertical rules, 16px between groups.
 */

/** Outer bar shared by every dashboard header. */
export const headerBarClassName =
  'flex w-full shrink-0 items-center justify-between gap-x-4 gap-y-3 border-b-2 border-neutral-100 bg-white p-3 sm:p-5 2xl:min-h-32'

/** Page title: Figma English/H1 SemiBold, Primary blue/500. */
export const headerTitleClassName = 'text-h1 text-primary whitespace-nowrap'

/** Small label chip above a header value (Figma: Primary/50 fill, 4px radius, 12px Medium). */
export function HeaderChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="w-fit rounded-sm bg-primary-50 px-2 py-0.5 text-caption font-medium leading-normal text-primary">
      {children}
    </span>
  )
}

/** 64px vertical rule between header groups. */
export function HeaderDivider({ className }: { className?: string }) {
  return <div className={cn('h-12 w-px shrink-0 bg-neutral-100 2xl:h-16', className)} aria-hidden />
}

function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])
  return now
}

/** "Time and date" block: chip, then time | date in Body 2 Medium, Alabaster/800. */
export function HeaderDateTime({ labelKey = 'cab.header.timeAndDate', className }: { labelKey?: string; className?: string }) {
  const { t, i18n } = useTranslation()
  const now = useNow()
  const time = new Intl.DateTimeFormat(i18n.language, { hour: '2-digit', minute: '2-digit', hour12: true }).format(now)
  const parts = new Intl.DateTimeFormat(i18n.language, { day: '2-digit', month: 'long', year: 'numeric' }).formatToParts(now)
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const date = `${pick('day')} ${pick('month')} ${pick('year')}`

  return (
    <div className={cn('flex-col items-start gap-1', className)}>
      <HeaderChip>{t(labelKey)}</HeaderChip>
      <p className="flex items-center gap-1 text-body-2-medium text-neutral-800 whitespace-nowrap">
        <span>{time}</span>
        <span className="mx-0.5 h-[18px] w-px bg-neutral-100" aria-hidden />
        <span>{date}</span>
      </p>
    </div>
  )
}
