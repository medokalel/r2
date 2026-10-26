import { useTranslation } from 'react-i18next'
import { AddCircleIcon, AppIcon, DownloadIcon, EyeIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

interface QuickAction {
  key: string
  icon: typeof AddCircleIcon
  bgColor: string
  iconColor: string
  titleKey: string
  descriptionKey: string
  onClick?: () => void
}

interface CabQuickActionsProps {
  onNewApplication?: () => void
  onAssignReview?: () => void
  onIssueCertificate?: () => void
}

export function CabQuickActions({
  onNewApplication,
  onAssignReview,
  onIssueCertificate,
}: CabQuickActionsProps) {
  const { t } = useTranslation()

  const actions: QuickAction[] = [
    {
      key: 'newApplication',
      icon: AddCircleIcon,
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-hover',
      titleKey: 'cab.dashboard.quickActions.newApplication.title',
      descriptionKey: 'cab.dashboard.quickActions.newApplication.description',
      onClick: onNewApplication,
    },
    {
      key: 'assignReview',
      icon: EyeIcon,
      bgColor: 'bg-warning-50',
      iconColor: 'text-warning-700',
      titleKey: 'cab.dashboard.quickActions.assignReview.title',
      descriptionKey: 'cab.dashboard.quickActions.assignReview.description',
      onClick: onAssignReview,
    },
    {
      key: 'issueCertificate',
      icon: DownloadIcon,
      bgColor: 'bg-primary-25',
      iconColor: 'text-primary',
      titleKey: 'cab.dashboard.quickActions.issueCertificate.title',
      descriptionKey: 'cab.dashboard.quickActions.issueCertificate.description',
      onClick: onIssueCertificate,
    },
  ]

  return (
    <div className="flex h-full flex-col rounded-lg border border-neutral-100 bg-white p-5">
      <h3 className="mb-3 text-body font-semibold text-neutral-900">
        {t('cab.dashboard.quickActions.title')}
      </h3>

      <div className="flex flex-col gap-3">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={action.onClick}
            className="flex items-center gap-3 rounded-lg border border-neutral-100 p-3 text-start transition-colors hover:bg-neutral-50"
          >
            <span
              className={cn('flex size-10 shrink-0 items-center justify-center rounded-md', action.bgColor)}
            >
              <AppIcon icon={action.icon} size={20} className={action.iconColor} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-body-sm font-semibold text-neutral-900">{t(action.titleKey)}</p>
              <p className="truncate text-caption text-neutral-600">{t(action.descriptionKey)}</p>
            </div>
            <span aria-hidden className="inline-block shrink-0 text-neutral-500 rtl:-scale-x-100">→</span>
          </button>
        ))}
      </div>
    </div>
  )
}