import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { AppIcon, MenuIcon } from '@/components/icons'
import { useOptionalCabSidebar } from '@/context/cabSidebar/useCabSidebar'

/** Opens the sidebar as a drawer below the md breakpoint, where the sidebar is hidden. */
export function MobileMenuButton() {
  const { t } = useTranslation()
  const location = useLocation()
  const sidebar = useOptionalCabSidebar()
  if (!sidebar) return null
  const open = sidebar.mobileOpenPath === location.pathname

  return (
    <button
      type="button"
      onClick={() => sidebar.setMobileOpenPath(open ? null : location.pathname)}
      aria-label={t('nav.menu', 'Menu')}
      aria-controls="cab-sidebar"
      aria-expanded={open}
      className="flex size-10 shrink-0 items-center justify-center rounded-md text-neutral-800 hover:bg-primary-25 hover:text-primary md:hidden"
    >
      <AppIcon icon={MenuIcon} size={26} />
    </button>
  )
}
