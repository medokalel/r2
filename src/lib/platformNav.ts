import { Buildings2, Category2, Crown1, Profile2User, Receipt21, Setting2, ShieldSecurity, Speaker } from 'iconsax-reactjs'
import type { AppIconComponent } from '@/components/icons'
import type { PlatformAbility } from '@/lib/subscriptionFeatures'
import { PLATFORM_ROUTES } from '@/lib/platformRoutes'

/**
 * Navigation of the iCASCO platform console. The console sidebar renders it, and iHelp builds
 * its platform sections from it, so a console page added here appears in the help center.
 */
export interface PlatformNavItem {
  to: string
  labelKey: string
  icon: AppIconComponent
  ability: PlatformAbility | null
  end?: boolean
}

export const PLATFORM_NAV: PlatformNavItem[] = [
  { to: PLATFORM_ROUTES.dashboard, labelKey: 'platform.nav.dashboard', icon: Category2, ability: null, end: true },
  { to: PLATFORM_ROUTES.tenants, labelKey: 'platform.nav.tenants', icon: Buildings2, ability: 'viewTenants' },
  { to: PLATFORM_ROUTES.plans, labelKey: 'platform.nav.plans', icon: Crown1, ability: 'viewPlans' },
  { to: PLATFORM_ROUTES.invoices, labelKey: 'platform.nav.invoices', icon: Receipt21, ability: 'money' },
  { to: PLATFORM_ROUTES.announcements, labelKey: 'platform.nav.announcements', icon: Speaker, ability: 'announcements' },
  { to: PLATFORM_ROUTES.staff, labelKey: 'platform.nav.staff', icon: Profile2User, ability: 'staff' },
  { to: PLATFORM_ROUTES.auditLog, labelKey: 'platform.nav.auditLog', icon: ShieldSecurity, ability: 'auditLog' },
  { to: PLATFORM_ROUTES.settings, labelKey: 'platform.nav.settings', icon: Setting2, ability: 'settings' },
]
