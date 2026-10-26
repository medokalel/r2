import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { WorkQueueItem, WorkQueuePriority } from '@/lib/api/cabDashboardApi'
import { DashboardInfoButton } from '@/components/dashboard/cab/DashboardInfoButton'
import { enumLabel } from '@/lib/enumLabel'
import { cn } from '@/lib/utils'

const priorityStyles: Record<WorkQueuePriority, string> = {
  high: 'bg-error-100 text-error-600',
  medium: 'bg-warning-50 text-warning-700',
  low: 'bg-success-100 text-success-600',
}

const PREVIEW_COUNT = 5

interface CabWorkQueueProps {
  items: WorkQueueItem[]
}

/** Open tasks built from the live records; each row opens the record it is about. */
export function CabWorkQueue({ items }: CabWorkQueueProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const title = t('cab.dashboard.workQueue.title')
  const today = new Date().toISOString().slice(0, 10)
  const visible = expanded ? items : items.slice(0, PREVIEW_COUNT)

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language, { month: 'short', day: '2-digit' }).format(new Date(iso))

  return (
    <div className="flex h-full flex-col rounded-lg border border-neutral-100 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <h3 className="text-body font-semibold text-neutral-900">{title}</h3>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-25 px-1.5 text-caption font-semibold text-primary tabular-nums">
            {items.length}
          </span>
          <DashboardInfoButton title={title} text={t('cab.dashboard.info.workQueue')} />
        </div>
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-body-sm text-text-secondary">{t('cab.dashboard.workQueue.empty')}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-100">
          {visible.map((item) => {
            const overdue = item.dueDate < today
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => navigate(item.href)}
                  className="flex w-full items-start justify-between gap-3 rounded-md px-1 py-3 text-start transition-colors hover:bg-primary-25"
                >
                  <div className="min-w-0">
                    <p className="truncate text-body-sm font-semibold text-neutral-900">{t(item.titleKey)}</p>
                    <p className="truncate text-body-sm text-neutral-600">{item.tag ? `${item.clientName} · ${enumLabel(t, item.tag)}` : item.clientName}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={cn('rounded-full px-2 py-0.5 text-caption font-medium', priorityStyles[item.priority])}>
                      {t(`cab.dashboard.workQueue.priority.${item.priority}`)}
                    </span>
                    <span className={cn('text-caption tabular-nums', overdue ? 'font-semibold text-error-600' : 'text-neutral-600')}>
                      {overdue ? t('cab.dashboard.workQueue.overdueSince', { date: formatDate(item.dueDate) }) : t('cab.dashboard.workQueue.dueOn', { date: formatDate(item.dueDate) })}
                    </span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {items.length > PREVIEW_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-auto self-center pt-2 text-body-sm font-semibold text-primary hover:text-primary-hover"
        >
          {expanded ? t('cab.dashboard.showLess') : t('cab.dashboard.showAllCount', { count: items.length })}
        </button>
      )}
    </div>
  )
}
