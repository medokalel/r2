import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AppIcon, LogoutIcon } from '@/components/icons'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { clearAuthSession } from '@/lib/authStorage'
import { ROUTES } from '@/lib/routes'

export function AbDashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuthSession()
    navigate(ROUTES.login, { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex items-center justify-end gap-3 p-6">
        <LanguageToggle variant="icon" />
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-body-3-medium text-error-700 transition-colors hover:bg-neutral-50 hover:text-error-600"
        >
          <AppIcon icon={LogoutIcon} size={18} />
          {t('nav.logout')}
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        <div className="w-full max-w-lg rounded-lg border border-dashed border-primary-100 bg-white px-8 py-14 shadow-sm">
          <p className="mb-2 text-body-2-medium text-primary">{t('ab.dashboard.title')}</p>
          <h1 className="text-page-title text-text-primary">{t('ab.dashboard.comingSoonTitle')}</h1>
          <p className="mt-4 text-body-2 text-neutral-600">{t('ab.dashboard.comingSoonDescription')}</p>
        </div>
      </main>
    </div>
  )
}
