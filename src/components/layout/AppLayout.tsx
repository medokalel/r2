import { useDirection } from '@/context/direction/useDirection'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { MobileBottomNav } from '@/components/dashboard/MobileBottomNav'
import { PageFeedback } from '@/components/dashboard/PageFeedback'
import { AssistantWidget } from '@/components/assistant/AssistantWidget'
import { PortalStaffBanner } from '@/components/dashboard/PortalStaffBanner'
import { getStoredPortalProfile } from '@/lib/api/portalApi'
import { CabSidebarContext } from '@/context/cabSidebar/cabSidebarContext'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { dir } = useDirection()

  return (
    // This shell has no sidebar drawer (the bottom bar navigates on phones), so the
    // header's menu button, which only drives the CAB drawer, stays hidden here.
    <CabSidebarContext.Provider value={null}>
    <div dir={dir} className="flex min-h-screen bg-neutral-25">
      <DashboardSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden pb-16 md:pb-0">
        <PortalStaffBanner clientName={getStoredPortalProfile().name} />
        {children}
        <PageFeedback />
        {/* Room for the assistant button so it never covers the end of the page. */}
        <div aria-hidden className="h-20 shrink-0" />
      </div>
      <AssistantWidget liftOnMobile />
      <MobileBottomNav />
    </div>
    </CabSidebarContext.Provider>
  )
}