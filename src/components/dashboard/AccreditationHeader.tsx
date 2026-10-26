import { useTranslation } from 'react-i18next'
import { AppIcon, MailIcon } from '@/components/icons'
import {
  HeaderChip,
  HeaderDateTime,
  HeaderDivider,
  headerBarClassName,
  headerTitleClassName,
} from '@/components/dashboard/HeaderParts'
import { MobileMenuButton } from '@/components/dashboard/MobileMenuButton'
import { NotificationsBell } from '@/components/dashboard/NotificationsBell'
import { UserMenu } from '@/components/dashboard/UserMenu'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { useOptionalTour } from '@/context/tour/useTour'

interface AccreditationHeaderProps {
  titleKey?: string
  orderNumber?: string
  officerName?: string
  officerEmail?: string
}

/** Same Figma header as CabHeader, with the order number and assigned officer groups. */
export function AccreditationHeader({
  titleKey = 'accreditation.title',
  orderNumber,
  officerName,
  officerEmail,
}: AccreditationHeaderProps) {
  const { t } = useTranslation()
  // Only set on pages that actually run a tour (e.g. the dashboard) — this
  // header is shared by several pages that don't, so the button stays hidden there.
  const tour = useOptionalTour()

  return (
    <header className={headerBarClassName}>
      <div className="flex min-w-0 items-center gap-x-4 sm:gap-x-5">
        <MobileMenuButton />
        <img src="/icasco-logo.svg" alt={t('common.appName')} className="h-12 w-auto sm:h-16 md:hidden" />
        <h1 className={`hidden truncate md:block ${headerTitleClassName}`}>{t(titleKey)}</h1>

        {orderNumber && <HeaderDivider className="hidden md:block" />}
        {orderNumber && (
          <div className="hidden flex-col items-start gap-1 md:flex">
            <HeaderChip>{t('accreditation.orderNumber')}</HeaderChip>
            <p className="text-h3-semi text-text-primary whitespace-nowrap" dir="ltr">
              {orderNumber}
            </p>
          </div>
        )}

        {orderNumber && officerName && <HeaderDivider className="hidden 2xl:block" />}

        {officerName && (
          <div className="hidden flex-col items-start gap-1 2xl:flex">
            <HeaderChip>{t('accreditation.assignedOfficer')}</HeaderChip>
            <p className="text-body-2-medium text-text-primary whitespace-nowrap">{officerName}</p>
            {officerEmail && (
              <p className="flex items-center gap-1 text-body-3 text-primary whitespace-nowrap" dir="ltr">
                <AppIcon icon={MailIcon} size={14} />
                {officerEmail}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <HeaderDateTime labelKey="accreditation.timeAndDate" className="hidden xl:flex" />
        <HeaderDivider className="hidden xl:block" />

        {/* Figma header has no tour button; the tour lives in the account menu. */}

        <NotificationsBell />

        <HeaderDivider className="hidden xs:block" />

        <LanguageToggle variant="icon" showChevron={false} />

        <HeaderDivider className="hidden xs:block" />

        <UserMenu onStartTour={tour?.startTour} />
      </div>
    </header>
  )
}
