import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  AppIcon,
  CertificateBadgeIcon,
  CorrectiveActionIcon,
  FileReviewIcon,
  SuccessCircleIcon,
  WalletIcon,
} from '@/components/icons'
import type { CabActivityItem, CabActivityType } from '@/lib/api/cabDashboardApi'
import { enumLabel } from '@/lib/enumLabel'
import { cn } from '@/lib/utils'

const activityIconConfig: Record<CabActivityType, { icon: typeof CertificateBadgeIcon; bgColor: string; iconColor: string }> = {
  certificateIssued: { icon: CertificateBadgeIcon, bgColor: 'bg-success-100', iconColor: 'text-success-600' },
  auditCompleted: { icon: SuccessCircleIcon, bgColor: 'bg-primary-50', iconColor: 'text-primary-hover' },
  infoRequested: { icon: CorrectiveActionIcon, bgColor: 'bg-warning-50', iconColor: 'text-warning-700' },
  reviewAssigned: { icon: FileReviewIcon, bgColor: 'bg-primary-25', iconColor: 'text-primary' },
  paymentReceived: { icon: WalletIcon, bgColor: 'bg-primary-25', iconColor: 'text-focus' },
}

const bylineKeyByType: Record<CabActivityType, string> = {
  certificateIssued: 'cab.dashboard.recentActivity.byline.by',
  auditCompleted: 'cab.dashboard.recentActivity.byline.by',
  infoRequested: 'cab.dashboard.recentActivity.byline.by',
  reviewAssigned: 'cab.dashboard.recentActivity.byline.decisionMaker',
  paymentReceived: 'cab.dashboard.recentActivity.byline.plain',
}

function relativeTimeLabel(
  isoTimestamp: string,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime()
  const diffMinutes = Math.max(1, Math.round(diffMs / (60 * 1000)))
  if (diffMinutes < 60) return t('cab.dashboard.recentActivity.minutesAgo', { count: diffMinutes })
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours === 1) return t('cab.dashboard.recentActivity.hourAgo')
  if (diffHours < 24) return t('cab.dashboard.recentActivity.hoursAgo', { count: diffHours })
  const diffDays = Math.round(diffHours / 24)
  return t('cab.dashboard.recentActivity.daysAgo', { count: diffDays })
}

interface CabRecentActivityProps {
  activities: CabActivityItem[]
}

const PREVIEW_COUNT = 5

/** Latest events across the registers, newest first; each row opens its record. */
export function CabRecentActivity({ activities }: CabRecentActivityProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? activities : activities.slice(0, PREVIEW_COUNT)

  return (
    <div className="flex h-full flex-col rounded-lg border border-neutral-100 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-body font-semibold text-neutral-900">
          {t('cab.dashboard.recentActivity.title')}
        </h3>
      </div>

      <ul className="flex flex-col gap-1">
        {visible.map((activity) => {
          const { icon, bgColor, iconColor } = activityIconConfig[activity.type]
          return (
            <li key={activity.id}>
              <button
                type="button"
                onClick={() => navigate(activity.href)}
                className="flex w-full items-start gap-3 rounded-md p-1.5 text-start transition-colors hover:bg-primary-25"
              >
              <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', bgColor)}>
                <AppIcon icon={icon} size={16} className={iconColor} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-body-sm font-medium leading-[1.5] text-neutral-900">
                  {t(activity.titleKey, { entityName: activity.entityName, ...activity.params, stage: enumLabel(t, activity.params?.stage) })}
                </p>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  {activity.actorName && (
                    <span className="text-caption text-neutral-600">
                      {t(bylineKeyByType[activity.type], { value: activity.actorName })}
                    </span>
                  )}
                  <span className="shrink-0 text-caption text-neutral-500">
                    {relativeTimeLabel(activity.occurredAt, t)}
                  </span>
                </div>
              </div>
              </button>
            </li>
          )
        })}
      </ul>

      {activities.length > PREVIEW_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-auto self-center pt-2 text-body-sm font-semibold text-primary hover:text-primary-hover"
        >
          {expanded ? t('cab.dashboard.showLess') : t('cab.dashboard.showAllCount', { count: activities.length })}
        </button>
      )}
    </div>
  )
}