import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { Crown1, MessageQuestion } from 'iconsax-reactjs'
import {
  AppIcon,
  BuildingsIcon,
  LogoutIcon,
  SettingsIcon,
  TourGuideIcon,
  UserIcon,
} from '@/components/icons'
import { ACCOUNT_UPDATED_EVENT, getCachedAccount, type AccountProfile } from '@/lib/api/accountApi'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { clearAuthSession, getAuthSession, isAuditClientSession } from '@/lib/authStorage'
import { clearPendingRegistration } from '@/lib/pendingRegistrationStorage'
import { ROUTES } from '@/lib/routes'

// Plain join: tailwind-merge would drop design-system size classes next to a text colour.
const cx = (...a: Array<string | false | null | undefined>) => a.filter(Boolean).join(' ')

interface UserMenuProps {
  /** Starts the page tour when the page has one. */
  onStartTour?: () => void
}

/** Account area of the header: avatar, name and role, and a menu with profile, settings, tour and sign-out. */
export function UserMenu({ onStartTour }: UserMenuProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const session = getAuthSession()
  const [open, setOpen] = useState(false)
  const [confirmOut, setConfirmOut] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const [account, setAccount] = useState<AccountProfile>(getCachedAccount)
  useEffect(() => {
    const onUpdate = (event: Event) => setAccount((event as CustomEvent<AccountProfile>).detail)
    window.addEventListener(ACCOUNT_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(ACCOUNT_UPDATED_EVENT, onUpdate)
  }, [])
  const email = session?.user?.email ?? ''
  const displayName = account.fullName || email
  const orgName = session?.organization?.name ?? ''
  const rawRole = (session?.role?.name ?? session?.user?.role?.name ?? '').toUpperCase()
  const roleLabel = rawRole ? t(`userMenu.roles.${rawRole}`, { defaultValue: rawRole.replace(/_/g, ' ') }) : ''
  const isClient = location.pathname.startsWith('/portal') || isAuditClientSession(session)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
        setConfirmOut(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setConfirmOut(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const go = (path: string) => {
    setOpen(false)
    navigate(path)
  }

  const logout = () => {
    clearAuthSession()
    clearPendingRegistration()
    navigate(ROUTES.login, { replace: true })
  }

  const items: Array<{ key: string; icon: typeof SettingsIcon; label: string; onClick: () => void }> = [
    { key: 'me', icon: UserIcon, label: t('userMenu.myProfile', 'My profile'), onClick: () => go(ROUTES.accountProfile) },
    {
      key: 'profile',
      icon: BuildingsIcon,
      label: isClient ? t('userMenu.companyProfile') : t('userMenu.cabProfile', 'CAB Profile'),
      onClick: () => go(isClient ? ROUTES.portalCompanyProfile : ROUTES.cabCompanyProfile),
    },
    ...(!isClient
      ? [
          { key: 'subscription', icon: Crown1, label: t('subscription.menuItem'), onClick: () => go(ROUTES.cabSubscription) },
          { key: 'settings', icon: SettingsIcon, label: t('userMenu.bodySetup'), onClick: () => go(ROUTES.cabOnboarding) },
        ]
      : []),
    { key: 'help', icon: MessageQuestion, label: t('help.menu.item'), onClick: () => go(ROUTES.help) },
    ...(onStartTour
      ? [{ key: 'tour', icon: TourGuideIcon, label: t('cab.header.takeTour'), onClick: () => { setOpen(false); onStartTour() } }]
      : []),
  ]

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          setConfirmOut(false)
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('userMenu.open', { name: email })}
        className={cx(
          'flex items-center gap-6 rounded-md p-1 transition-colors hover:bg-neutral-25',
          open && 'bg-neutral-25',
        )}
      >
        {/* Figma Header: name in Body 1 Medium, role in Body 2 Regular, then the avatar */}
        <span className="hidden min-w-0 max-w-[16rem] flex-col items-end text-end lg:flex">
          <span className="w-full truncate text-body-1-medium text-text-primary">{displayName}</span>
          {roleLabel && <span className="w-full truncate text-body-2 text-text-secondary">{roleLabel}</span>}
        </span>
        <UserAvatar src={account.avatarUrl} alt="" className="size-12 border-2 border-neutral-100 sm:size-14 2xl:size-[91px]" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t('userMenu.title')}
          className="absolute end-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-neutral-100 bg-white shadow-card"
        >
          <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3">
            <UserAvatar src={account.avatarUrl} alt="" className="size-11 border-2 border-neutral-100" />
            <div className="min-w-0">
              <p className="truncate text-body-3-medium text-neutral-900">{displayName}</p>
              {displayName !== email && <p className="truncate text-caption text-neutral-600" dir="ltr">{email}</p>}
              {orgName && <p className="truncate text-body-3 text-neutral-600">{orgName}</p>}
              {roleLabel && <p className="mt-0.5 text-caption font-medium text-primary">{roleLabel}</p>}
            </div>
          </div>

          <ul className="py-1">
            {items.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={item.onClick}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-start text-body-3 text-neutral-800 hover:bg-neutral-50 focus-visible:bg-neutral-50"
                >
                  <AppIcon icon={item.icon} size={18} />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="border-t border-neutral-100 p-2">
            {confirmOut ? (
              <div className="rounded-md bg-error-50 p-3">
                <p className="text-body-3 text-neutral-800">{t('userMenu.logoutConfirm')}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-md bg-error-500 px-3 py-1.5 text-body-3-medium text-white hover:opacity-90"
                  >
                    {t('nav.logout')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmOut(false)}
                    className="rounded-md px-3 py-1.5 text-body-3 text-neutral-800 hover:bg-white"
                  >
                    {t('userMenu.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                role="menuitem"
                onClick={() => setConfirmOut(true)}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-start text-body-3 text-error-500 hover:bg-error-50"
              >
                <AppIcon icon={LogoutIcon} size={18} />
                <span>{t('nav.logout')}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
