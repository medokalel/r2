import * as Flags from 'country-flag-icons/react/3x2'
import { cn } from '@/lib/utils'

type FlagComponent = (props: React.SVGProps<SVGSVGElement> & { title?: string }) => React.ReactElement

/**
 * Country flag bundled with the app (3:2 SVG), so it renders offline and on every OS —
 * emoji flags do not render on Windows and remote flag images can be blocked.
 */
export function CountryFlag({ code, className, title }: { code: string; className?: string; title?: string }) {
  const Flag = (Flags as unknown as Record<string, FlagComponent | undefined>)[code.toUpperCase()]
  if (!Flag) {
    return <span className={cn('inline-block rounded-sm bg-neutral-100', className)} aria-hidden />
  }
  return <Flag title={title} aria-hidden={title ? undefined : true} className={cn('rounded-sm shadow-[0_0_0_1px_rgba(0,0,0,0.06)]', className)} />
}
