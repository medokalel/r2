import { useTranslation } from 'react-i18next'
import {
  HeaderDateTime,
  HeaderDivider,
  headerBarClassName,
  headerTitleClassName,
} from '@/components/dashboard/HeaderParts'
import { MobileMenuButton } from '@/components/dashboard/MobileMenuButton'
import { NotificationsBell } from '@/components/dashboard/NotificationsBell'
import { UserMenu } from '@/components/dashboard/UserMenu'
import { HelpButton } from '@/components/help/HelpButton'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { SubscriptionBanners } from '@/components/subscription/SubscriptionBanners'
import { SubscriptionErrorNotice } from '@/components/subscription/SubscriptionErrorNotice'
import { useOptionalTour } from '@/context/TourContext'

interface CabHeaderProps {
  title?: string
  subtitle?: string
  notificationCount?: number
  logoClassName?: string
}

/** Dashboard header built to Figma "Header" (5003:20256): title | date-time | bell | language | user.
 *  Below it: subscription banners (read-only, iCASCO support session, announcements). */
export function CabHeader({
  title,
  subtitle,
  notificationCount = 0,
  logoClassName = 'h-10 w-auto object-contain sm:h-12',
}: CabHeaderProps) {
  const { t } = useTranslation()
  // Only set on pages that actually run a tour (e.g. the dashboard) — this
  // header is shared with onboarding screens that don't, so the button stays
  // hidden there instead of crashing.
  const tour = useOptionalTour()

  return (
    <>
    <header className={headerBarClassName}>
      <div className="flex min-w-0 items-center gap-2">
        <MobileMenuButton />
        <div className="min-w-0">
        {title ? (
          <h1 className={`${headerTitleClassName} truncate`}>{title}</h1>
        ) : (
          <img src="/icasco-logo.svg" alt={t('common.appName')} className={logoClassName} />
        )}
        {subtitle && <p className="text-body-3 text-text-secondary">{subtitle}</p>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <HeaderDateTime className="hidden xl:flex" />
        <HeaderDivider className="hidden xl:block" />
        <HeaderActions notificationCount={notificationCount} onStartTour={tour?.startTour} />
      </div>
    </header>
    <SubscriptionBanners />
    <SubscriptionErrorNotice />
    </>
  )
}

/** Right side of every header: notifications, language and the account menu (profile, sign out, tour). */
export function HeaderActions({ notificationCount = 0, onStartTour }: { notificationCount?: number; onStartTour?: () => void }) {
  const tour = useOptionalTour()
  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-4">
      {/* Figma header has no tour button; the tour lives in the account menu. */}
      {/* iHelp: opens the guide of the current page. */}
      <HelpButton />
      <NotificationsBell fallbackCount={notificationCount} />
      <HeaderDivider className="hidden xs:block" />
      <LanguageToggle variant="icon" showChevron={false} />
      <HeaderDivider className="hidden xs:block" />
      <UserMenu onStartTour={onStartTour ?? tour?.startTour} />
    </div>
  )
}
