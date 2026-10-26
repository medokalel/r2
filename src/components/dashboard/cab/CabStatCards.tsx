import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  AppIcon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  PendingBurstIcon,
  SearchIcon,
  ShieldIcon,
  UserIcon,
  WalletIcon,
} from '@/components/icons'
import { DashboardInfoButton } from '@/components/dashboard/cab/DashboardInfoButton'
import { STAT_HREF, type CabDashboardStatInsight, type CabDashboardStatKey, type CabDashboardStats } from '@/lib/api/cabDashboardApi'
import { cn } from '@/lib/utils'
import { notSet } from '@/lib/emptyValue'

interface CabStatCardConfig {
  key: CabDashboardStatKey
  labelKey: string
  bgColor: string
  iconColor: string
  icon: typeof FileTextIcon
  /** True for the freelancer payables card: the main value is an EGP amount, not a plain count. */
  currencyValue?: boolean
}

const statCards: CabStatCardConfig[] = [
  { key: 'newApplications', labelKey: 'cab.dashboard.stats.newApplications', bgColor: 'bg-primary-50', iconColor: 'text-primary-hover', icon: FileTextIcon },
  { key: 'pendingReviews', labelKey: 'cab.dashboard.stats.pendingReviews', bgColor: 'bg-warning-50', iconColor: 'text-warning-700', icon: EyeIcon },
  { key: 'upcomingAudits', labelKey: 'cab.dashboard.stats.upcomingAudits', bgColor: 'bg-primary-25', iconColor: 'text-focus', icon: PendingBurstIcon },
  { key: 'technicalReviewsPending', labelKey: 'cab.dashboard.stats.technicalReviewsPending', bgColor: 'bg-primary-25', iconColor: 'text-primary', icon: SearchIcon },
  { key: 'decisionsPending', labelKey: 'cab.dashboard.stats.decisionsPending', bgColor: 'bg-success-50', iconColor: 'text-success-700', icon: ShieldIcon },
  { key: 'certificatesToIssue', labelKey: 'cab.dashboard.stats.certificatesToIssue', bgColor: 'bg-primary-50', iconColor: 'text-primary-hover', icon: DownloadIcon },
  { key: 'outstandingPayments', labelKey: 'cab.dashboard.stats.outstandingPayments', bgColor: 'bg-error-100', iconColor: 'text-error-600', icon: WalletIcon },
  { key: 'freelancerPayablesEgp', labelKey: 'cab.dashboard.stats.freelancerPayables', bgColor: 'bg-neutral-100', iconColor: 'text-neutral-800', icon: UserIcon, currencyValue: true },
]

const toneClass: Record<NonNullable<CabDashboardStatInsight['tone']>, string> = {
  neutral: 'text-text-secondary',
  warning: 'text-warning-700',
  danger: 'text-error-600',
  success: 'text-success-700',
}

interface CabStatCardsProps {
  stats: CabDashboardStats | null
  loading: boolean
}

/**
 * Key indicators. Each card counts live records, says where things stand
 * (oldest waiting item, next date, overdue amount) and opens the module that
 * holds those records; the "i" button explains what is counted.
 */
export function CabStatCards({ stats, loading }: CabStatCardsProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const formatParams = (params?: Record<string, string | number>) => {
    if (!params) return undefined
    const out: Record<string, string | number> = { ...params }
    if (typeof params.date === 'string') {
      out.date = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }).format(new Date(params.date))
    }
    return out
  }

  return (
    <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {statCards.map(({ key, labelKey, bgColor, iconColor, icon: Icon, currencyValue }) => {
        const value = stats?.[key]
        const insight = stats?.insights[key]
        const label = t(labelKey)
        const href = STAT_HREF[key]
        const open = () => navigate(href)

        return (
          <div
            key={key}
            role="link"
            tabIndex={0}
            data-stat={key}
            aria-label={`${label}: ${value ?? ''}`}
            onClick={open}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                open()
              }
            }}
            className="group flex cursor-pointer flex-col gap-3 rounded-lg border border-neutral-100 bg-white p-4 transition-[border-color,box-shadow] hover:border-primary-100 hover:shadow-card focus-visible:outline-2 focus-visible:outline-focus"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1">
                <p className="text-body-sm font-medium text-neutral-800">{label}</p>
                <DashboardInfoButton title={label} text={t(`cab.dashboard.info.${key}`)} />
              </div>
              <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-md', bgColor)}>
                <AppIcon icon={Icon} size={20} className={iconColor} />
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-[28px] font-bold leading-none text-neutral-900 tabular-nums">
                {loading || value === undefined ? notSet() : value.toLocaleString('en-US')}
              </span>
              {currencyValue && !loading && <span className="text-body-sm text-neutral-600">{t('cab.dashboard.stats.egp')}</span>}
            </div>

            <p className={cn('min-h-[2.6em] text-caption leading-[1.3] line-clamp-2', insight ? toneClass[insight.tone ?? 'neutral'] : 'text-text-secondary')}>
              {loading || !insight ? '' : t(`cab.dashboard.insights.${insight.key}`, formatParams(insight.params))}
            </p>

            <span className="mt-auto self-end text-body-sm font-semibold text-primary group-hover:text-primary-hover">
              {t(`cab.dashboard.open.${key}`)} <span aria-hidden className="inline-block rtl:-scale-x-100">→</span>
            </span>
          </div>
        )
      })}
    </div>
  )
}
