import { AppLayout } from '@/components/layout/AppLayout'
import { CabLayout } from '@/components/layout/CabLayout'
import type { TourStepConfig } from '@/context/tour/tourTypes'

interface CabOrPortalLayoutProps {
  /** Render the client-portal shell (portal navigation, no CAB tour) instead of the CAB shell. */
  portal: boolean
  children: React.ReactNode
  sidebarVariant?: string
  tourId?: string
  tourSteps?: TourStepConfig[]
}

/** Shell for pages shared by CAB staff and the client portal (offers, invoices). */
export function CabOrPortalLayout({ portal, children, sidebarVariant, tourId, tourSteps }: CabOrPortalLayoutProps) {
  if (portal) return <AppLayout>{children}</AppLayout>
  return (
    <CabLayout sidebarVariant={sidebarVariant} tourId={tourId} tourSteps={tourSteps}>
      {children}
    </CabLayout>
  )
}
