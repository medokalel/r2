import { useTranslation } from 'react-i18next'
import {
  AppIcon,
  CorrespondenceSentIcon,
  DocumentReceivedIcon,
  StatusChangedIcon,
  StatusReviewIcon,
  type AppIconComponent,
} from '@/components/icons'
import type { DashboardActivity, DashboardActivityType } from '@/lib/api/dashboardApi'
import { cn } from '@/lib/utils'
import { notSet } from '@/lib/emptyValue'

const activityIconConfig: Record <
  DashboardActivityType,
  { icon: AppIconComponent; bgColor: string }
> = {
  documentReceived: { icon: DocumentReceivedIcon, bgColor: 'bg-success-100' },
  correspondenceSent: { icon: StatusChangedIcon, bgColor: 'bg-primary-50' },
  statusChanged: { icon: StatusReviewIcon, bgColor: 'bg-warning-50' },
}

function relativeTimeLabel(
  isoTimestamp: string,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime()
  const diffMinutes = Math.max(1, Math.round(diffMs / (60 * 1000)))
  if (diffMinutes < 60) return t('dashboard.activities.minutesAgo', { count: diffMinutes })
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours === 1) return t('dashboard.activities.hourAgo')
  return t('dashboard.activities.hoursAgo', { count: diffHours })
}

/**
 * Renders the detail sentence with the entity name highlighted, e.g.
 * "Insurance certificate uploaded by <Food Solutions Company>".
 * The translated string always contains the entity name verbatim once
 * (from the {{entityName}} interpolation), so a plain split is enough —
 * no need for react-i18next's <Trans> component just for this.
 */
function detailWithHighlightedEntity(detail: string, entityName: string) {
  const index = detail.indexOf(entityName)
  if (index === -1) return detail
  return (
    <>
      {detail.slice(0, index)}
      <span className="font-medium text-primary">{entityName}</span>
      {detail.slice(index + entityName.length)}
    </>
  )
}

interface DashboardActivitiesProps {
  activities: DashboardActivity[]
  loading: boolean
  onViewAll?: () => void
}

export function DashboardActivities({ activities, loading, onViewAll }: DashboardActivitiesProps) {
  const { t } = useTranslation()

  return (
    <div className="flex w-full flex-col rounded-lg border border-neutral-100 bg-white @7xl:max-w-[400px]">
      <div className="mb-4 flex items-center border border-neutral-100 border-t-0 border-s-0 border-e-0 gap-2 rounded-t-lg bg-primary-25 p-6">
        <AppIcon icon={CorrespondenceSentIcon} size={32} className="text-primary" />
        <h2 className="text-[24px] font-semibold text-neutral-900">
          {t('dashboard.activities.title')}
        </h2>
      </div>

      <div className="flex flex-1 flex-col p-6 overflow-y-auto">
        {loading ? (
          <p className="py-6 text-center text-neutral-600">{t('common.loading')}</p>
        ) : activities.length === 0 ? (
          <p className="py-6 text-center text-neutral-600">{notSet()}</p>
        ) : (
          activities.map((activity, index) => {
            const { icon, bgColor } = activityIconConfig[activity.type]
            const isLast = index === activities.length - 1
            const detail = t(`${activity.titleKey}.detail`, { entityName: activity.entityName })

            return (
              <div key={activity.id} className="flex gap-3">
                {/* Icon badge + connecting timeline line down to the next item */}
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-md',
                      bgColor
                    )}
                  >
                    <AppIcon icon={icon} size={26} />
                  </span>
                  {!isLast && <span className="my-1 w-px flex-1 bg-neutral-100" />}
                </div>

                <div className={cn('min-w-0 flex-1', isLast ? 'pb-1' : 'pb-6')}>
                  <p className="text-body-sm text-neutral-600">
                    {relativeTimeLabel(activity.occurredAt, t)}
                  </p>
                  <p className="text-body font-semibold leading-[1.6] text-neutral-900">
                    {t(`${activity.titleKey}.title`)}
                  </p>
                  <p className="text-body-sm leading-[1.6] text-neutral-700">
                    {detailWithHighlightedEntity(detail, activity.entityName)}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="mb-4 flex h-14 w-[calc(100%-45px)] items-center justify-center self-center rounded-md bg-primary-25 text-body font-semibold transition-colors hover:bg-primary-50"
        >
          {t('dashboard.activities.viewAll')}
        </button>
      )}
    </div>
  )
}