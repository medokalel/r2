import type { SectorKey } from '@/components/dashboard/entityData/fieldTypes'
import { sectorIconSources } from './sectorIconSources'
import { cn } from '@/lib/utils'

interface SectorIconProps {
  sector: SectorKey
  selected?: boolean
  className?: string
}

export function SectorIcon({ sector, selected = false, className }: SectorIconProps) {
  const src = sectorIconSources[sector]

  return (
    <span
      className={cn(
        'size-6 shrink-0 bg-current',
        selected ? 'text-primary' : 'text-neutral-600',
        className
      )}
      style={{
        maskImage: `url(${src})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskImage: `url(${src})`,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
      }}
      aria-hidden
    />
  )
}
