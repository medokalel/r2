import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { AppIcon, EyeIcon } from '@/components/icons'
import { getAuthSession, isAuditClientSession } from '@/lib/authStorage'
import { isPortalPath } from '@/lib/portalNav'
import { ROUTES } from '@/lib/routes'

/** Shown to CAB staff inside the client portal: says whose view this is and leads back to the CAB workspace. */
export function PortalStaffBanner({ clientName }: { clientName?: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const session = getAuthSession()
  if (!isPortalPath(location.pathname) || !session || isAuditClientSession(session)) return null

  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-3 border-b border-primary-100 bg-primary-25 px-3 py-2.5 text-body-sm sm:px-5">
      <span className="flex items-center gap-2 text-primary">
        <AppIcon icon={EyeIcon} size={16} />
        {clientName
          ? t('portal.staffBanner.viewingAs', { client: clientName, defaultValue: 'Client view: you are seeing the portal as {{client}} sees it.' })
          : t('portal.staffBanner.viewing', 'Client view: you are seeing the portal as your client sees it.')}
      </span>
      <button type="button" onClick={() => navigate(ROUTES.cabWorkspace)} className="font-semibold text-primary hover:text-primary-hover hover:underline">
        {t('portal.staffBanner.back', 'Back to CAB workspace')}
      </button>
    </div>
  )
}
