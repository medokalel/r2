import { useTranslation } from 'react-i18next'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { AppLayout } from '@/components/layout/AppLayout'
import { TourProvider } from '@/context/tour/TourProvider'
import type { TourStepConfig } from '@/context/tour/tourTypes'
import { cn } from '@/lib/utils'

interface PortalLayoutProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
  tourId?: string
  tourSteps?: TourStepConfig[]
  notificationCount?: number
}

/** Client portal shell: the portal navigation (same as every /portal page), the shared header and the page body. */
export function PortalLayout({
  children,
  className,
  title,
  subtitle,
  tourId,
  tourSteps,
  notificationCount = 3,
}: PortalLayoutProps) {
  const { t } = useTranslation()
  const page = (
    <AppLayout>
      <CabHeader
        title={title ?? t('portal.title', 'Client Portal')}
        subtitle={subtitle}
        notificationCount={notificationCount}
      />
      <main className={cn('flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto page-main', className)}>
        {children}
      </main>
    </AppLayout>
  )
  return tourId && tourSteps ? (
    <TourProvider tourId={tourId} steps={tourSteps}>
      {page}
    </TourProvider>
  ) : (
    page
  )
}
