import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Lock1 } from 'iconsax-reactjs'
import { useCabSidebar } from '@/context/CabSidebarContext'
import { useSubscription } from '@/hooks/useSubscription'
import { AppIcon, ChevronDownIcon, LogoutIcon } from '@/components/icons'
import { clearAuthSession, getAuthSession } from '@/lib/authStorage'
import { CAB_NAV_GROUPS, CAB_NAV_HOME, type CabNavItem } from '@/lib/cabNav'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { useOptionalTour } from '@/context/TourContext'

// The navigation itself lives in '@/lib/cabNav' (shared with iHelp, which builds its sections from it).
const homeItem = CAB_NAV_HOME
const navGroups = CAB_NAV_GROUPS

function matchesNavHref(pathname: string, href: string) {
  if (pathname === href) return true
  if (href === '/cab/applications/draft' && pathname.startsWith('/cab/applications/draft/')) {
    return true
  }
  if (href.startsWith('/cab/applications/')) {
    const lastSegment = href.split('/').pop()
    return pathname.startsWith('/cab/applications/') && pathname.endsWith(`/${lastSegment}`)
  }
  if (pathname.startsWith(`${href}/`)) return true
  return false
}

function isNavItemActive(item: CabNavItem, pathname: string): boolean {
  if (item.href && matchesNavHref(pathname, item.href)) return true
  return item.children?.some((child) => isNavItemActive(child, pathname)) ?? false
}

function getUserInitials(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return '?'
  const localPart = trimmed.includes('@') ? trimmed.split('@')[0] : trimmed
  const parts = localPart.split(/[.\s_-]+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  }
  return localPart.slice(0, 2).toUpperCase()
}

function getDisplayName(email: string): string {
  const localPart = email.split('@')[0] ?? email
  return localPart
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function CollapsedNavSubmenu({
  item,
  isOpen,
  active,
  pathname,
  onToggle,
  onClose,
  onNavigate,
}: {
  item: CabNavItem
  isOpen: boolean
  active: boolean
  pathname: string
  onToggle: () => void
  onClose: () => void
  onNavigate: (href: string) => void
}) {
  const { t } = useTranslation()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [flyoutPos, setFlyoutPos] = useState({ top: 0, left: 0 })

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return
    const update = () => {
      if (!triggerRef.current) return
      const rect = triggerRef.current.getBoundingClientRect()
      const isRtl = document.documentElement.dir === 'rtl'
      const width = 232
      setFlyoutPos({
        top: Math.min(Math.max(8, rect.top), window.innerHeight - 280),
        left: isRtl ? Math.max(8, rect.left - 12 - width) : rect.right + 12,
      })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [isOpen])

  const menuItems = [
    ...(item.href ? [{ labelKey: item.labelKey, href: item.href }] : []),
    ...(item.children ?? []).filter((child) => child.href !== item.href),
  ]

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        title={t(item.labelKey)}
        aria-label={t(item.labelKey)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={onToggle}
        className={cn(
          'relative flex items-center transition-colors',
          active
            ? 'size-11 justify-center rounded-lg bg-primary-25 text-primary'
            : 'size-8 justify-center text-neutral-600 hover:text-primary',
        )}
      >
        {item.icon && <AppIcon icon={item.icon} size={22} className="shrink-0" />}
      </button>
      {isOpen &&
        createPortal(
          <>
            <button
              type="button"
              aria-label={t('common.close')}
              className="fixed inset-0 z-[2000] cursor-default bg-transparent"
              onClick={onClose}
            />
            <div
              role="menu"
              aria-label={t(item.labelKey)}
              style={{ top: flyoutPos.top, left: flyoutPos.left }}
              className="fixed z-[2001] min-w-[220px] rounded-lg border border-neutral-100 bg-white py-1 shadow-lg"
            >
              <p className="px-3 py-2 text-caption font-semibold uppercase tracking-wide text-neutral-500">
                {t(item.labelKey)}
              </p>
              {menuItems.map((child) => {
                const childActive = Boolean(child.href && matchesNavHref(pathname, child.href))
                return (
                  <button
                    key={`${child.labelKey}-${child.href}`}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      if (child.href) onNavigate(child.href)
                      onClose()
                    }}
                    className={cn(
                      'flex w-full items-center px-3 py-2 text-start text-body-3-medium text-neutral-700 transition-colors hover:bg-primary-subtle hover:text-primary',
                      childActive && 'bg-primary-subtle text-primary',
                    )}
                  >
                    {t(child.labelKey)}
                  </button>
                )
              })}
            </div>
          </>,
          document.body,
        )}
    </div>
  )
}

export function CabSidebar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const session = getAuthSession()
  const { expanded, setExpanded, mobileOpenPath, setMobileOpenPath } = useCabSidebar()
  const tour = useOptionalTour()
  // Modules outside the CAB's plan stay visible with a lock and lead to "My subscription".
  const { isPathAllowed } = useSubscription()

  const activeStepId = tour?.isTourActive ? tour.activeStepId : null
  const isSidebarStepActive = Boolean(activeStepId && activeStepId.startsWith('sidebar-'))
  // Mobile drawer: open only on the route it was opened from, so any navigation closes it.
  const isMobileOpen = mobileOpenPath !== null && mobileOpenPath === location.pathname
  const isExpanded = expanded || isSidebarStepActive || isMobileOpen

  useEffect(() => {
    if (!isMobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpenPath(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isMobileOpen, setMobileOpenPath])

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navGroups.map((group) => [group.id, true])),
  )
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({})

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  const toggleSubmenu = (labelKey: string) => {
    setOpenSubmenus((prev) => {
      const nextOpen = !(prev[labelKey] ?? (isExpanded ? true : false))
      if (!isExpanded && nextOpen) {
        return { [labelKey]: true }
      }
      return { ...prev, [labelKey]: nextOpen }
    })
  }

  const closeSubmenu = (labelKey: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [labelKey]: false }))
  }

  const isActive = (item: CabNavItem) => isNavItemActive(item, location.pathname)

  const userEmail = session?.user?.email ?? ''
  const userName = getDisplayName(userEmail)
  const userRole = session?.role?.name ?? session?.user?.role?.name ?? ''
  const userInitials = getUserInitials(userEmail || userName)

  const renderItem = (item: CabNavItem, nested = false) => {
    const active = Boolean(item.href && matchesNavHref(location.pathname, item.href))
    const disabled = item.disabled || !item.href
    const locked = Boolean(item.href && !isPathAllowed(item.href))
    const label = locked ? `${t(item.labelKey)} (${t('subscription.notInPlan')})` : t(item.labelKey)

    const buttonElement = (
      <button
        key={`${item.labelKey}-${item.href ?? 'disabled'}`}
        type="button"
        title={label}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={() => item.href && navigate(locked ? ROUTES.cabSubscription : item.href)}
        className={cn(
          'relative flex items-center transition-colors',
          disabled && 'cursor-not-allowed opacity-50',
          isExpanded
            ? cn(
                'w-full rounded-md py-2 text-body-sm font-medium text-text-tertiary',
                nested ? 'gap-2 px-3 ps-9' : 'gap-3 px-3',
                !disabled && !active && 'hover:bg-bg-brand-light hover:text-primary',
                active && 'bg-primary text-white',
              )
            : cn(
                active
                  ? 'h-12 w-[72px] justify-center rounded-md bg-primary text-white 2xl:h-16 2xl:w-[93px]'
                  : 'size-10 justify-center rounded-md text-icon-primary hover:bg-bg-brand-light hover:text-primary',
                disabled && 'hover:text-neutral-700',
              ),
        )}
      >
        {item.icon && (
          <AppIcon icon={item.icon} size={isExpanded ? 20 : 22} className={cn('shrink-0', !isExpanded && '2xl:size-8', locked && 'opacity-50')} />
        )}
        {isExpanded && (
          <span className={cn('min-w-0 flex-1 truncate text-start text-body-3-medium', locked && 'opacity-60')}>
            {t(item.labelKey)}
          </span>
        )}
        {locked && (
          <AppIcon
            icon={Lock1}
            size={isExpanded ? 16 : 12}
            className={cn('shrink-0 text-warning-500', !isExpanded && 'absolute -end-1 -top-1 rounded-full bg-white')}
            aria-hidden
          />
        )}
      </button>
    )

    if (item.stepId) {
      return (
        <DashboardTourStep
          key={`${item.labelKey}-${item.href}`}
          stepId={item.stepId}
          className={cn('w-full', !isExpanded && 'flex justify-center')}
        >
          {buttonElement}
        </DashboardTourStep>
      )
    }

    return buttonElement
  }

  const renderSubmenu = (item: CabNavItem) => {
    const submenuKey = item.labelKey
    const isOpen = openSubmenus[submenuKey] ?? (isExpanded ? true : false)
    const active = isActive(item)

    if (!isExpanded) {
      return (
        <CollapsedNavSubmenu
          key={submenuKey}
          item={item}
          isOpen={isOpen}
          active={active}
          pathname={location.pathname}
          onToggle={() => toggleSubmenu(submenuKey)}
          onClose={() => closeSubmenu(submenuKey)}
          onNavigate={(href) => navigate(href)}
        />
      )
    }

    return (
      <div key={submenuKey} className="flex flex-col gap-1">
        <div
          className={cn(
            'flex w-full items-center rounded-lg text-neutral-600 transition-colors hover:bg-primary-subtle hover:text-primary',
            active && 'bg-primary-subtle text-primary',
          )}
        >
          <button
            type="button"
            onClick={() => (item.href ? navigate(item.href) : toggleSubmenu(submenuKey))}
            className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2"
            aria-current={item.href && matchesNavHref(location.pathname, item.href) ? 'page' : undefined}
          >
            {item.icon && <AppIcon icon={item.icon} size={20} className="shrink-0" />}
            <span className="min-w-0 flex-1 truncate text-start text-body-3-medium">
              {t(item.labelKey)}
            </span>
          </button>
          <button
            type="button"
            onClick={() => toggleSubmenu(submenuKey)}
            aria-expanded={isOpen}
            aria-label={t(item.labelKey)}
            className="flex shrink-0 items-center px-2 py-2"
          >
            <AppIcon
              icon={ChevronDownIcon}
              size={16}
              className={cn('shrink-0 transition-transform', isOpen && 'rotate-180')}
            />
          </button>
        </div>
        {isOpen && (
          <div className="flex flex-col gap-1">{item.children?.map((child) => renderItem(child, true))}</div>
        )}
      </div>
    )
  }

  const renderNavEntry = (item: CabNavItem) =>
    item.children?.length ? renderSubmenu(item) : renderItem(item)

  const renderCollapsedDivider = (groupId: string) => (
    <div key={`divider-${groupId}`} className="my-2 h-px w-8 shrink-0 bg-neutral-100" aria-hidden />
  )

  return (
    <>
    {isMobileOpen && (
      <div
        className="fixed inset-0 z-[1000] bg-surface-overlay/50 md:hidden"
        onClick={() => setMobileOpenPath(null)}
        aria-hidden
      />
    )}
    <aside
      id="cab-sidebar"
      aria-label={t('nav.menu', 'Menu')}
      className={cn(
        'relative hidden shrink-0 flex-col border-e border-border-default bg-white py-6 transition-[width] duration-300 ease-in-out',
        'md:flex md:w-[112px] md:items-center md:gap-6 2xl:w-[132px]',
        expanded
          ? 'lg:w-[var(--sidebar-width)] lg:items-stretch lg:gap-6 lg:px-4'
          : 'lg:w-[112px] lg:items-center lg:gap-6 2xl:w-[132px]',
        (isSidebarStepActive || isMobileOpen) &&
          '!flex fixed inset-y-0 start-0 z-[1001] w-[270px] max-w-[85vw] items-stretch gap-6 px-4 shadow-2xl overflow-y-auto md:relative md:inset-auto md:z-auto md:w-auto md:max-w-none md:shadow-none',
      )}
    >
      <div className="hidden shrink-0 w-full justify-end px-2 lg:flex">
        <button
          type="button"
          onClick={() =>
            setExpanded((prev) => {
              if (prev) setOpenSubmenus({})
              return !prev
            })
          }
          aria-expanded={expanded}
          aria-label={t(expanded ? 'accreditation.sidebar.collapse' : 'accreditation.sidebar.expand')}
          className={cn(
            'flex size-7 items-center justify-center',
            'rounded-md border border-neutral-300 bg-white text-neutral-700 shadow-sm',
            'transition-colors hover:border-neutral-400 hover:text-primary',
          )}
        >
          {expanded ? (
            <svg width="16" height="18" viewBox="0 0 16 18" fill="none" style={{ transform: 'scaleX(-1)' }}>
              <path d="M7.33447 12.667L11.3345 8.66699L7.33447 4.66699" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11.3332 8.66699H0.666504" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.9946 16.667C15.728 11.4803 15.728 5.85366 13.9946 0.666992" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
              <path d="M7.33447 12.667L11.3345 8.66699L7.33447 4.66699" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11.3332 8.66699H0.666504" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.9946 16.667C15.728 11.4803 15.728 5.85366 13.9946 0.666992" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      <div className={cn('shrink-0', isExpanded ? 'w-full px-4' : 'w-full max-w-[116px] px-1.5')}>
        <img
          src="/icasco-logo.svg"
          alt={t('common.appName')}
          width={114}
          height={93}
          className="h-[93px] w-full shrink-0 object-contain"
        />
      </div>

      <nav
        className={cn(
          'flex flex-1 flex-col overflow-y-auto',
          isExpanded ? 'w-full items-stretch gap-1 px-1' : 'w-full items-center gap-[clamp(0.25rem,1.2vh,1rem)]',
        )}
        aria-label={t('nav.home')}
      >
        {renderItem(homeItem)}

        {navGroups.map((group, groupIndex) => {
          const isOpen = openGroups[group.id] ?? true

          if (!isExpanded) {
            return (
              <div key={group.id} className="flex w-full flex-col items-center gap-[clamp(0.25rem,1.2vh,1rem)]">
                {groupIndex > 0 && renderCollapsedDivider(group.id)}
                {group.items.map((item) => renderNavEntry(item))}
              </div>
            )
          }

          return (
            <div key={group.id} className="mt-2">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-caption font-semibold text-neutral-700 transition-colors hover:text-primary"
              >
                <span className="flex min-w-0 flex-1 items-center gap-2 text-start">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-25 text-caption font-semibold text-primary tabular-nums">
                    {groupIndex + 1}
                  </span>
                  <span className="truncate">{t(group.labelKey)}</span>
                </span>
                <AppIcon
                  icon={ChevronDownIcon}
                  size={16}
                  className={cn('shrink-0 transition-transform', isOpen && 'rotate-180')}
                />
              </button>
              {isOpen && (
                <div className="mt-1 flex flex-col gap-1">{group.items.map(renderNavEntry)}</div>
              )}
            </div>
          )
        })}
      </nav>

      <div
        className={cn(
          'mt-4 shrink-0 border-t border-neutral-100 pt-4',
          isExpanded ? 'w-full px-3' : 'flex w-[70px] flex-col items-center',
        )}
      >
        {isExpanded ? (
          <>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-body-3-semibold text-primary">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-body-3-medium text-neutral-900">
                  {userName}
                  {userRole ? ` · ${t(`userMenu.roles.${userRole.toUpperCase()}`, { defaultValue: userRole.replace(/_/g, ' ') })}` : ''}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-error-500 transition-colors hover:text-error-600"
            >
              <AppIcon icon={LogoutIcon} size={20} className="shrink-0" />
              <span className="text-body-3-medium">{t('nav.logout')}</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleLogout}
            title={t('nav.logout')}
            aria-label={t('nav.logout')}
            className="flex size-11 items-center justify-center text-error-500 transition-colors hover:text-error-600"
          >
            <AppIcon icon={LogoutIcon} size={22} className="shrink-0" />
          </button>
        )}
      </div>
    </aside>
    </>
  )
}
