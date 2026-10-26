import { cn } from '@/lib/utils'

interface BrandingPanelBackgroundProps {
  className?: string
}

export function BrandingPanelBackground({ className }: BrandingPanelBackgroundProps) {
  return (
    <>
      <div className={cn('absolute inset-0 bg-neutral-950', className)} aria-hidden />
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/casco-section-bg.png')" }}
        aria-hidden
      />
    </>
  )
}
