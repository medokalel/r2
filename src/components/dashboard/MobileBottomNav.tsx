import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Crown1, Lock1 } from 'iconsax-reactjs'
import {
  AppIcon,
  BuildingsIcon,
  CertificateBadgeIcon,
  FileTextIcon,
  SuccessCircleIcon,
  TaskSquareIcon,
  DashboardGridIcon,
  RequestsListIcon,
  UsersIcon,
  DocumentsSidebarIcon,
  WalletCardIcon,
  ShieldIcon,
  RenewalsIcon,
  ReceiptIcon,
  SettingsIcon,
  LogoutIcon,
  MoreIcon,
} from '@/components/icons'
import { useSubscription } from '@/hooks/useSubscription'
import { clearAuthSession, getAuthSession, isAuditClientSession } from '@/lib/authStorage'
import { ROUTES } from '@/lib/routes'
import { PORTAL_NAV, isPortalNavActive, showsPortalNav } from '@/lib/portalNav'
import { cn } from '@/lib/utils'

const primaryItems = [
  { icon: DashboardGridIcon, labelKey: 'nav.home', href: ROUTES.dashboard },
  { icon: RequestsListIcon, labelKey: 'accreditation.sidebar.requests', href: ROUTES.certificationRequests },
  { icon: UsersIcon, labelKey: 'accreditation.sidebar.users', href: ROUTES.users },
  { icon: DocumentsSidebarIcon, labelKey: 'accreditation.sidebar.documents' },
]

const moreItems = [
  { icon: WalletCardIcon, labelKey: 'accreditation.sidebar.payments', href: ROUTES.wallet },
  { icon: ShieldIcon, labelKey: 'accreditation.sidebar.accreditation' },
  { icon: RenewalsIcon, labelKey: 'accreditation.sidebar.renewals', href: ROUTES.periodicVisits },
  { icon: ReceiptIcon, labelKey: 'accreditation.sidebar.invoices', href: ROUTES.invoices },
  { icon: SettingsIcon, labelKey: 'nav.settings', href: ROUTES.companyProfile },
]

// CAB staff on shared pages (e.g. My profile): the main CAB modules, gated by the subscription.
const cabPrimaryItems = [
  { icon: DashboardGridIcon, labelKey: 'nav.home', href: ROUTES.workspace },
  { icon: UsersIcon, labelKey: 'cab.sidebar.auditClients', href: ROUTES.cabAuditClients },
  { icon: FileTextIcon, labelKey: 'cab.sidebar.applications', href: ROUTES.cabApplicationRegister },
  { icon: CertificateBadgeIcon, labelKey: 'cab.sidebar.certificates', href: ROUTES.cabCertificates },
]

const cabMoreItems = [
  { icon: TaskSquareIcon, labelKey: 'cab.sidebar.auditPlanning', href: ROUTES.cabAuditPlanning },
  { icon: SuccessCircleIcon, labelKey: 'cab.sidebar.decisions', href: ROUTES.cabDecisions },
  { icon: ReceiptIcon, labelKey: 'cab.sidebar.invoices', href: ROUTES.cabInvoices },
  { icon: BuildingsIcon, labelKey: 'cab.sidebar.companyProfile', href: ROUTES.cabCompanyProfile },
  { icon: Crown1, labelKey: 'subscription.menuItem', href: ROUTES.cabSubscription },
]

function isCabStaffSession(): boolean {
  const session = getAuthSession()
  return !isAuditClientSession(session) && (Boolean(session?.cab) || session?.organization?.type === 'CERTIFICATION_BODY')
}

export function MobileBottomNav() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  // Inside the client portal the bar uses the portal's own pages.
  const portalMode = showsPortalNav(location.pathname, isAuditClientSession())
  const cabMode = !portalMode && isCabStaffSession()
  const { isPathAllowed } = useSubscription()
  const locked = (href?: string) => Boolean(cabMode && href && !isPathAllowed(href))
  const label = (item: { labelKey: string; fallback?: string; href?: string }) => {
    const text = t(item.labelKey, item.fallback ? { defaultValue: item.fallback } : undefined)
    return locked(item.href) ? `${text} (${t('subscription.notInPlan')})` : text
  }
  const primary: Array<{ icon: typeof DashboardGridIcon; labelKey: string; href?: string; fallback?: string }> = portalMode ? PORTAL_NAV.slice(0, 4) : cabMode ? cabPrimaryItems : primaryItems
  const more: Array<{ icon: typeof DashboardGridIcon; labelKey: string; href?: string; fallback?: string }> = portalMode ? PORTAL_NAV.slice(4) : cabMode ? cabMoreItems : moreItems
  const activeFor = (href?: string) =>
    href
      ? portalMode
        ? isPortalNavActive(href, location.pathname)
        : cabMode
          ? location.pathname === href || location.pathname.startsWith(`${href}/`)
          : location.pathname === href
      : false
  const go = (href?: string) => {
    if (!href) return
    navigate(locked(href) ? ROUTES.cabSubscription : href)
  }

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex h-[64px] items-center justify-around border-t border-neutral-100 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label={t('nav.dashboard')}
      >
        {primary.map((item) => {
          const { icon, labelKey, href } = item
          const isActive = activeFor(href)
          return (
            <button
              key={labelKey}
              type="button"
              onClick={() => go(href)}
              aria-label={label(item)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex size-11 items-center justify-center rounded-lg',
                isActive ? 'bg-primary-25 text-primary' : 'text-neutral-600'
              )}
            >
              <AppIcon icon={icon} size={24} className={locked(href) ? 'opacity-50' : undefined} />
              {locked(href) && <AppIcon icon={Lock1} size={12} className="absolute end-1 top-1 rounded-full bg-white text-warning-500" aria-hidden />}
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label={t('common.more')}
          className="flex size-11 items-center justify-center rounded-lg text-neutral-600"
        >
          <AppIcon icon={MoreIcon} size={24} />
        </button>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-surface-overlay/50"
            onClick={() => setMoreOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-300" />
            <div className="flex flex-col gap-1">
              {more.map((item) => {
                const { icon, labelKey, href } = item
                return (
                <button
                  key={labelKey}
                  type="button"
                  onClick={() => {
                    setMoreOpen(false)
                    go(href)
                  }}
                  className="flex items-center gap-3 rounded-md px-3 py-3 text-neutral-800 hover:bg-neutral-50"
                >
                  <AppIcon icon={icon} size={22} className={locked(href) ? 'opacity-50' : undefined} />
                  <span className={cn('min-w-0 flex-1 text-start text-body-2-medium', locked(href) && 'text-neutral-600')}>{t(labelKey, item.fallback ? { defaultValue: item.fallback } : undefined)}</span>
                  {locked(href) && (
                    <span className="flex shrink-0 items-center gap-1 text-caption font-medium text-warning-700">
                      <AppIcon icon={Lock1} size={14} aria-hidden />
                      {t('subscription.notInPlan')}
                    </span>
                  )}
                </button>
                )
              })}
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false)
                  handleLogout()
                }}
                className="flex items-center gap-3 rounded-md px-3 py-3 text-error-500 hover:bg-error-50"
              >
                <AppIcon icon={LogoutIcon} size={22} />
                <span className="text-body-2-medium">{t('nav.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}