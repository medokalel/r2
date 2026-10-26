import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Logout, ShieldSecurity } from 'iconsax-reactjs'
import { AppIcon, MenuIcon } from '@/components/icons'
import { useDirection } from '@/context/direction/useDirection'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { HelpButton } from '@/components/help/HelpButton'
import { clearAuthSession, getAuthSession, getPlatformRole } from '@/lib/authStorage'
import { abilityForPlatformPath, platformCan } from '@/lib/subscriptionFeatures'
import { PLATFORM_NAV } from '@/lib/platformNav'
import { PLATFORM_ROUTES } from '@/lib/platformRoutes'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

// The console navigation lives in '@/lib/platformNav' (shared with iHelp).
const NAV = PLATFORM_NAV

/** iCASCO wordmark: the brand gradient under a Montserrat / GE SS Two lockup. */
export function PlatformWordmark({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="flex min-w-0 items-center gap-2.5" dir="ltr">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-md text-body font-bold text-white"
        style={{ background: 'linear-gradient(135deg, #1236A5 0%, #005FAE 55%, #008C8A 100%)' }}
        aria-hidden
      >
        i
      </span>
      {!compact && (
        <span className="flex min-w-0 flex-col leading-tight">
          <img src="/icasco-wordmark.svg" alt="iCASCO" width={110} height={18} className="h-[18px] w-auto self-start" />
          <span className="truncate text-caption font-semibold uppercase tracking-[0.14em] text-warning-500">{t('platform.brand.console')}</span>
        </span>
      )}
    </div>
  )
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation()
  const role = getPlatformRole()
  const items = NAV.filter((item) => !item.ability || platformCan(role, item.ability))
  return (
    <nav className="flex flex-col gap-1" aria-label={t('platform.nav.label')}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-body-3-medium transition-colors',
              isActive ? 'bg-primary text-white' : 'text-text-tertiary hover:bg-bg-brand-light hover:text-primary',
            )
          }
        >
          <AppIcon icon={item.icon} size={20} className="shrink-0" />
          <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  )
}

function SignedInAs({ onSignOut }: { onSignOut: () => void }) {
  const { t } = useTranslation()
  const session = getAuthSession()
  const role = getPlatformRole(session)
  return (
    <div className="border-t border-neutral-100 pt-4">
      <p className="truncate text-body-3-medium text-neutral-900" dir="ltr" style={{ textAlign: 'start' }}>
        {session?.user?.email}
      </p>
      {role && <p className="mt-0.5 text-caption font-medium text-accent-teal">{t(`platform.roles.${role}`)}</p>}
      <button
        type="button"
        onClick={onSignOut}
        className="mt-3 flex w-full items-center gap-3 rounded-lg px-1 py-2 text-error-500 transition-colors hover:text-error-600"
      >
        <AppIcon icon={Logout} size={20} className="shrink-0" />
        <span className="text-body-3-medium">{t('nav.logout')}</span>
      </button>
    </div>
  )
}

function NoAccess() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <div className="mx-auto mt-10 max-w-lg rounded-lg border border-neutral-100 bg-white p-8 text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary-25 text-primary">
        <AppIcon icon={ShieldSecurity} size={24} />
      </div>
      <h1 className="text-section-title text-text-primary">{t('platform.noAccess.title')}</h1>
      <p className="mt-2 text-body-sm text-neutral-600">{t('platform.noAccess.body')}</p>
      <button type="button" onClick={() => navigate(PLATFORM_ROUTES.dashboard)} className="mt-5 text-body-sm font-semibold text-primary hover:underline">
        {t('platform.noAccess.back')}
      </button>
    </div>
  )
}

/** Shell of the platform console: brand sidebar (drawer on phones and tablets), top bar, role-checked content. */
export function PlatformLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const { dir } = useDirection()
  const location = useLocation()
  const navigate = useNavigate()
  const [drawerPath, setDrawerPath] = useState<string | null>(null)
  const drawerOpen = drawerPath === location.pathname
  const role = getPlatformRole()
  const ability = abilityForPlatformPath(location.pathname)
  const allowed = !ability || platformCan(role, ability)

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerPath(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  const signOut = () => {
    clearAuthSession()
    navigate(ROUTES.login, { replace: true })
  }

  return (
    <div dir={dir} className="flex min-h-screen bg-neutral-25">
      <aside className="sticky top-0 hidden h-screen w-[var(--sidebar-width)] shrink-0 flex-col gap-6 overflow-y-auto border-e border-border-default bg-white px-4 py-6 lg:flex">
        <div className="px-2">
          <PlatformWordmark />
        </div>
        <div className="flex-1">
          <SidebarNav />
        </div>
        <SignedInAs onSignOut={signOut} />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-[1000] lg:hidden">
          <div className="absolute inset-0 bg-surface-overlay/50" onClick={() => setDrawerPath(null)} aria-hidden />
          <aside
            id="platform-drawer"
            className="absolute inset-y-0 start-0 flex w-[280px] max-w-[85vw] flex-col gap-6 overflow-y-auto bg-white px-4 py-6 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-2 px-2">
              <PlatformWordmark />
              <button
                type="button"
                onClick={() => setDrawerPath(null)}
                aria-label={t('common.close')}
                className="flex size-9 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="flex-1">
              <SidebarNav onNavigate={() => setDrawerPath(null)} />
            </div>
            <SignedInAs onSignOut={signOut} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-neutral-100 bg-white/95 px-3 backdrop-blur sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerPath(drawerOpen ? null : location.pathname)}
              aria-label={t('nav.menu', 'Menu')}
              aria-controls="platform-drawer"
              aria-expanded={drawerOpen}
              className="flex size-10 shrink-0 items-center justify-center rounded-md text-neutral-800 hover:bg-primary-25 hover:text-primary lg:hidden"
            >
              <AppIcon icon={MenuIcon} size={24} />
            </button>
            <div className="lg:hidden">
              <PlatformWordmark compact />
            </div>
            <span className="hidden truncate rounded-full bg-warning-500/10 px-3 py-1 text-caption font-semibold text-warning-700 sm:inline-flex">
              {t('platform.brand.badge')}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <HelpButton />
            <LanguageToggle variant="icon" showChevron={false} />
            {role && (
              <span className="hidden rounded-full bg-accent-teal/10 px-3 py-1 text-caption font-semibold text-accent-teal md:inline-flex">
                {t(`platform.roles.${role}`)}
              </span>
            )}
          </div>
        </header>
        <main className="flex min-w-0 flex-1 flex-col gap-5 page-main pb-16">{allowed ? children : <NoAccess />}</main>
      </div>
    </div>
  )
}
