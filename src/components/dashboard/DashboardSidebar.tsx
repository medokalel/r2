import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AppIcon,
  DashboardGridIcon,
  DocumentsSidebarIcon,
  LogoutIcon,
  ReceiptIcon,
  RenewalsIcon,
  RequestsListIcon,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
  WalletCardIcon,
} from '@/components/icons'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { clearAuthSession, getAuthSession, isAuditClientSession } from '@/lib/authStorage'
import { ROUTES } from '@/lib/routes'
import { PORTAL_NAV, isPortalNavActive, showsPortalNav } from '@/lib/portalNav'
import { cn } from '@/lib/utils'

const navItems: { icon: typeof DashboardGridIcon; labelKey: string; href?: string }[] = [
  { icon: DashboardGridIcon, labelKey: 'nav.dashboard', href: ROUTES.dashboard },
  { icon: RequestsListIcon, labelKey: 'accreditation.sidebar.requests', href: ROUTES.certificationRequests },
  { icon: UsersIcon, labelKey: 'accreditation.sidebar.users', href: ROUTES.users },
  { icon: WalletCardIcon, labelKey: 'accreditation.sidebar.payments', href: ROUTES.wallet },
  { icon: DocumentsSidebarIcon, labelKey: 'accreditation.sidebar.documents' },
  { icon: ShieldIcon, labelKey: 'accreditation.sidebar.accreditation' },
  { icon: RenewalsIcon, labelKey: 'accreditation.sidebar.renewals', href: ROUTES.periodicVisits },
  { icon: ReceiptIcon, labelKey: 'accreditation.sidebar.invoices', href: ROUTES.invoices },
  { icon: SettingsIcon, labelKey: 'nav.settings', href: ROUTES.companyProfile },
]

export function DashboardSidebar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const session = getAuthSession()
  const displayName = session?.organization?.name ?? ''
  // Inside the client portal every link stays under /portal (works for clients and for CAB staff viewing it).
  const portalMode = showsPortalNav(location.pathname, isAuditClientSession())
  const handleLogout = () => {
    clearAuthSession()
    navigate(ROUTES.login, { replace: true })
  }

  return (
    <aside className="hidden min-h-screen w-[var(--sidebar-width)] shrink-0 flex-col border-e border-border-default bg-white px-4 py-6 md:flex">
      <div className="mb-7 flex h-[137px] shrink-0 items-center justify-center">
        <img
          src="/icasco-logo.svg"
          alt={t('common.appName')}
          width={114}
          height={93}
          className="h-[93px] w-[114px] object-contain"
        />
      </div>

      <nav
        className="flex min-h-0 flex-1 flex-col gap-2"
        aria-label={t('nav.dashboard')}
      >
        {(portalMode ? PORTAL_NAV : navItems).map(({ icon, labelKey, href, ...rest }) => {
          const fallback = 'fallback' in rest ? (rest.fallback as string) : undefined
          const active = Boolean(
            href &&
              (portalMode
                ? isPortalNavActive(href, location.pathname)
                : location.pathname === href ||
                  (href !== ROUTES.dashboard && location.pathname.startsWith(`${href}/`)))
          )

          return (
            <button
              key={labelKey}
              type="button"
              disabled={!href}
              onClick={() => href && navigate(href)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-12 w-full items-center gap-3 rounded-md px-3 text-start text-body-2 font-medium transition-colors',
                active
                  ? 'bg-primary text-white'
                  : 'text-text-tertiary hover:bg-bg-brand-light hover:text-primary',
                !href && 'cursor-default'
              )}
            >
              <AppIcon icon={icon} size={24} className="shrink-0" />
              <span className="truncate">{t(labelKey, fallback ? { defaultValue: fallback } : undefined)}</span>
            </button>
          )
        })}

        <button
          type="button"
          onClick={handleLogout}
          className="mt-auto flex h-12 w-full items-center gap-4 rounded-lg px-4 text-start text-body-lg text-error-500 transition-colors hover:bg-error-50"
        >
          <AppIcon icon={LogoutIcon} size={24} className="shrink-0" />
          <span>{t('nav.logout')}</span>
        </button>
      </nav>

      <UserAvatar
        alt={displayName}
        className="size-[53px] self-center"
      />
      
    </aside>
  )
}