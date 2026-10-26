import { Navigate, Route, Routes } from 'react-router-dom'
import { PlatformLayout } from '@/components/platform/PlatformLayout'
import { PLATFORM_ROUTES } from '@/lib/platformRoutes'
import { PlatformAnnouncementsPage } from '@/pages/platform/PlatformAnnouncementsPage'
import { PlatformAuditLogPage } from '@/pages/platform/PlatformAuditLogPage'
import { PlatformDashboardPage } from '@/pages/platform/PlatformDashboardPage'
import { PlatformInvoicesPage } from '@/pages/platform/PlatformInvoicesPage'
import { PlatformPlanEditorPage } from '@/pages/platform/PlatformPlanEditorPage'
import { PlatformPlansPage } from '@/pages/platform/PlatformPlansPage'
import { PlatformSettingsPage } from '@/pages/platform/PlatformSettingsPage'
import { PlatformStaffPage } from '@/pages/platform/PlatformStaffPage'
import { PlatformTenantCreatePage } from '@/pages/platform/PlatformTenantCreatePage'
import { PlatformTenantDetailPage } from '@/pages/platform/PlatformTenantDetailPage'
import { PlatformTenantsPage } from '@/pages/platform/PlatformTenantsPage'

/** The iCASCO platform console, mounted at /platform/* (RequireAuth keeps everyone but platform staff out). */
export function PlatformApp() {
  return (
    <PlatformLayout>
      <Routes>
        <Route index element={<PlatformDashboardPage />} />
        <Route path="tenants" element={<PlatformTenantsPage />} />
        <Route path="tenants/new" element={<PlatformTenantCreatePage />} />
        <Route path="tenants/:tenantId" element={<PlatformTenantDetailPage />} />
        <Route path="plans" element={<PlatformPlansPage />} />
        <Route path="plans/:planId" element={<PlatformPlanEditorPage />} />
        <Route path="invoices" element={<PlatformInvoicesPage />} />
        <Route path="announcements" element={<PlatformAnnouncementsPage />} />
        <Route path="staff" element={<PlatformStaffPage />} />
        <Route path="audit-log" element={<PlatformAuditLogPage />} />
        <Route path="settings" element={<PlatformSettingsPage />} />
        <Route path="*" element={<Navigate to={PLATFORM_ROUTES.dashboard} replace />} />
      </Routes>
    </PlatformLayout>
  )
}
