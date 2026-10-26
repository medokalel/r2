import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EntityDataNavIconProps {
  className?: string
}

function NavIconSvg({
  className,
  viewBox = '0 0 24 24',
  children,
}: EntityDataNavIconProps & { children: ReactNode; viewBox?: string }) {
  return (
    <svg
      className={cn('size-5 shrink-0', className)}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {children}
    </svg>
  )
}

export function EntityDataNavEntityIcon({ className }: EntityDataNavIconProps) {
  return (
    <NavIconSvg className={className} viewBox="0 0 20 20">
      <path d="M10 8.33301H10.0083" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11.667H10.0083" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 5H10.0083" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.332 8.33301H13.3404" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.332 11.667H13.3404" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.332 5H13.3404" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.66797 8.33301H6.6763" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.66797 11.667H6.6763" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.66797 5H6.6763" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 18.3333V15.8333C7.5 15.3731 7.8731 15 8.33333 15H11.6667C12.1269 15 12.5 15.3731 12.5 15.8333V18.3333" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.9987 1.66699H14.9987C15.9192 1.66699 16.6654 2.41318 16.6654 3.33366V16.667C16.6654 17.5875 15.9192 18.3337 14.9987 18.3337H4.9987C4.07822 18.3337 3.33203 17.5875 3.33203 16.667V3.33366C3.33203 2.41318 4.07822 1.66699 4.9987 1.66699V1.66699" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    </NavIconSvg>
  )
}

export function EntityDataNavFieldIcon({ className }: EntityDataNavIconProps) {
  return (
    <NavIconSvg className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5.75" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.25" fill="currentColor" />
    </NavIconSvg>
  )
}

export function EntityDataNavDocumentsIcon({ className }: EntityDataNavIconProps) {
  return (
    <NavIconSvg className={className}>
      <path
        d="M22 11v6c0 4-1 5-5 5H7c-4 0-5-1-5-5V7c0-4 1-5 5-5h1.5c1.5 0 1.83.44 2.4 1.2l1.5 2c.38.5.6.8 1.6.8h3c4 0 5 1 5 5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
      />
    </NavIconSvg>
  )
}

export function EntityDataNavFeedbackIcon({ className }: EntityDataNavIconProps) {
  return (
    <NavIconSvg className={className}>
      <path
        d="M16 2H8C4 2 2 4 2 8v13c0 .55.45 1 1 1h13c4 0 6-2 6-6V8c0-4-2-6-6-6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m12.91 7.84-5.19 5.19c-.2.2-.39.59-.43.87l-.28 1.98c-.1.72.4 1.22 1.12 1.12l1.98-.28c.28-.04.67-.23.87-.43l5.19-5.19c.89-.89 1.32-1.93 0-3.25-1.32-1.33-2.36-.91-3.26-.01Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.17 8.58a4.688 4.688 0 0 0 3.25 3.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </NavIconSvg>
  )
}
