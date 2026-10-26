import { useTranslation } from 'react-i18next'
import { enumLabel } from '@/lib/enumLabel'
import { SectorIcon } from '@/components/icons/sectorIcons'
import { iafDigits } from '@/lib/criticalCodeExams'
import { resolveIafCodeSectorName } from '@/lib/iafCodes'
import { IAF_SECTOR } from '@/lib/iafSectors'
import { cn } from '@/lib/utils'
import { notSet } from '@/lib/emptyValue'

interface IafSectorChipsProps {
  codes?: string[] | null
  /** Shown as text when the person has no IAF codes. */
  fallback?: string
  /** Chips shown before "+N". */
  max?: number
  className?: string
}

/** IAF codes as chips: sector icon, code and sector name (full name on hover). */
export function IafSectorChips({ codes, fallback, max = 3, className }: IafSectorChipsProps) {
  const { t, i18n } = useTranslation()
  const list = Array.from(new Set((codes ?? []).map(iafDigits)))
  if (!list.length) return <span className="text-text-secondary">{fallback ? enumLabel(t, fallback) : notSet()}</span>

  const shown = list.slice(0, max)
  const hidden = list.slice(max)
  const name = (code: string) => resolveIafCodeSectorName(code, i18n.language) ?? code

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {shown.map((code) => (
        <span
          key={code}
          title={`IAF ${code} • ${name(code)}`}
          className="inline-flex max-w-[11rem] items-center gap-1.5 rounded-md border border-neutral-100 bg-white px-2 py-1"
        >
          {IAF_SECTOR[code] && <SectorIcon sector={IAF_SECTOR[code]} selected className="size-4" />}
          <span className="shrink-0 text-caption font-semibold text-primary tabular-nums">{code}</span>
          <span className="truncate text-caption text-text-secondary">{name(code)}</span>
        </span>
      ))}
      {hidden.length > 0 && (
        <span
          title={hidden.map((code) => `IAF ${code} • ${name(code)}`).join('\n')}
          className="inline-flex items-center rounded-md bg-primary-25 px-2 py-1 text-caption font-medium text-primary tabular-nums"
        >
          +{hidden.length}
        </span>
      )}
    </div>
  )
}
