import { cn } from '@/lib/utils'
import { documentIconSources, type DocumentIconKey } from './documentIconSources'

export type { DocumentIconKey }

interface DocumentIconProps {
  icon: DocumentIconKey
  uploaded?: boolean
  className?: string
}

export function DocumentIcon({ icon, uploaded = false, className }: DocumentIconProps) {
  const src = documentIconSources[icon]

  return (
    <span
      className={cn(
        'shrink-0 bg-current',
        uploaded ? 'text-success-600' : 'text-primary',
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
