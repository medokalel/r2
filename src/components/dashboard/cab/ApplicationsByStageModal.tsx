import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { AppIcon, DownloadIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import type { ApplicationsByStageEntry } from '@/lib/api/cabDashboardApi'

interface ApplicationsByStageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entries: ApplicationsByStageEntry[]
}

export function ApplicationsByStageModal({ open, onOpenChange, entries }: ApplicationsByStageModalProps) {
  const { t } = useTranslation()
  const total = entries.reduce((sum, entry) => sum + entry.count, 0)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-surface-overlay/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed start-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(600px,calc(100vw-40px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-card focus:outline-none rtl:translate-x-1/2"
        >
          <div className="flex shrink-0 items-start justify-between px-6 pt-6">
            <Dialog.Title className="text-[28px] font-bold text-neutral-900">
              {t('cab.dashboard.applicationsByStage.title')}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t('common.close')}
                className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-neutral-900 text-neutral-900 hover:bg-neutral-50"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {/* Donut chart */}
            <div className="relative mx-auto mt-4 size-[260px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={entries}
                    dataKey="count"
                    nameKey="stageKey"
                    innerRadius="72%"
                    outerRadius="100%"
                    paddingAngle={1}
                    stroke="none"
                  >
                    {entries.map((entry) => (
                      <Cell key={entry.stageKey} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-heading-xl font-bold leading-none text-neutral-900">{total}</span>
                <span className="text-body text-neutral-500">{t('cab.dashboard.total')}</span>
              </div>
            </div>

            {/* Legend */}
            <ul className="mt-6 flex flex-col gap-3.5">
              {entries.map((entry) => (
                <li key={entry.stageKey} className="flex items-center justify-between gap-3 text-body">
                  <span className="flex min-w-0 items-center gap-2.5 text-neutral-800">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="truncate">{t(`cab.dashboard.applicationsByStage.stages.${entry.stageKey}`)}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-6">
                    <span className="text-neutral-500">
                      {total > 0 ? Math.round((entry.count / total) * 1000) / 10 : 0}%
                    </span>
                    <span className="w-6 text-end font-semibold text-neutral-900">{entry.count}</span>
                  </span>
                </li>
              ))}
            </ul>

            {/* Footer actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="secondary" className="h-11 gap-2 rounded-md px-5">
                {t('cab.dashboard.applicationsByStage.exportData')}
                <AppIcon icon={DownloadIcon} size={16} />
              </Button>
              <Dialog.Close asChild>
                <Button variant="primary" className="h-11 rounded-md px-5">
                  {t('common.close')}
                </Button>
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}