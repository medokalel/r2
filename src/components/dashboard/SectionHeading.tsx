import { useState, type ReactNode } from 'react'
import { SectionTitle } from '@/components/dashboard/SectionTitle'
import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  title: string
  /** Kept for call-site compatibility — all headings share one 18px bold style now */
  size?: 'default' | 'compact'
  accordion?: boolean
  children?: ReactNode
  defaultOpen?: boolean
  /** Extra controls (e.g. a "remove" button) rendered in the header, before the chevron */
  headerActions?: ReactNode
}

export function SectionHeading({
  title,
  accordion = false,
  children,
  defaultOpen = true,
  headerActions,
}: SectionHeadingProps) {
  const [open, setOpen] = useState(defaultOpen)

  const heading = (
    <div
      className={cn('flex items-center gap-3 py-4', accordion && 'cursor-pointer select-none')}
      onClick={accordion ? () => setOpen((prev) => !prev) : undefined}
      role={accordion ? 'button' : undefined}
      aria-expanded={accordion ? open : undefined}
    >
      <SectionTitle title={title} className="flex-1" />
      {headerActions && (
        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          {headerActions}
        </div>
      )}
      {accordion && (
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary transition-transform duration-200',
            open && 'rotate-180'
          )}
          aria-hidden
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </div>
  )

  if (!accordion) return heading

  return (
    <div
      className={cn(
        'rounded-lg border border-neutral-100 bg-white',
        open ? 'overflow-visible' : 'overflow-hidden'
      )}
    >
      <div className="px-5">{heading}</div>
      {open && children && (
        <>
          <div className="h-px bg-neutral-100" />
          <div className="bg-[rgba(102,102,102,0.04)] p-5">{children}</div>
        </>
      )}
    </div>
  )
}