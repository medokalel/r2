import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { CardFooterLink } from '@/components/ui/CardFooterLink'
import { Tooltip } from '@/components/ui/Tooltip'
import { DashboardInfoButton } from '@/components/dashboard/cab/DashboardInfoButton'

interface DonutEntry {
  key: string
  count: number
  color: string
  /** Module that holds the records in this slice; makes the slice and legend row a link. */
  href?: string
}

interface CabDonutCardProps {
  title: string
  entries: DonutEntry[]
  labelPrefix: string
  totalLabel: string
  /** What the chart counts (shown from the "i" button). */
  info?: string
  /** i18n prefix for a one-line hint per slice, shown on hover. */
  hintPrefix?: string
  footerLink?: { label: string; onClick: () => void }
  /** Optional extra content rendered inside the same card, below the chart/legend. */
  footer?: ReactNode
}

export function CabDonutCard({ title, entries, labelPrefix, totalLabel, info, hintPrefix, footerLink, footer }: CabDonutCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const total = entries.reduce((sum, entry) => sum + entry.count, 0)
  const share = (count: number) => (total ? Math.round((count / total) * 100) : 0)

  return (
    <div className="flex flex-col rounded-lg border border-neutral-100 bg-white p-5">
      <div className="mb-4 flex items-center gap-1">
        <h3 className="text-body font-semibold text-neutral-900">{title}</h3>
        {info && <DashboardInfoButton title={title} text={info} />}
      </div>

      <div className="flex flex-1 flex-col items-center gap-5 min-[420px]:flex-row min-[420px]:items-center">
        <div className="relative size-[130px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={entries} dataKey="count" nameKey="key" innerRadius="70%" outerRadius="100%" paddingAngle={1} stroke="none">
                {entries.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={entry.color}
                    cursor={entry.href ? 'pointer' : undefined}
                    onClick={entry.href ? () => navigate(entry.href!) : undefined}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[28px] font-bold leading-none text-neutral-900">{total}</span>
            <span className="text-caption text-neutral-600">{totalLabel}</span>
          </div>
        </div>

        <ul className="flex w-full min-w-0 flex-1 flex-col gap-0.5">
          {entries.map((entry) => {
            const label = t(`${labelPrefix}.${entry.key}`)
            const hint = hintPrefix
              ? t(`${hintPrefix}.${entry.key}`, { count: entry.count, share: share(entry.count) })
              : undefined
            const row = (
              <button
                type="button"
                disabled={!entry.href}
                onClick={entry.href ? () => navigate(entry.href!) : undefined}
                className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-start text-caption transition-colors enabled:hover:bg-primary-25 disabled:cursor-default"
              >
                <span className="flex min-w-0 items-center gap-2 text-neutral-700">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="truncate">{label}</span>
                </span>
                <span className="flex shrink-0 items-baseline gap-1.5">
                  <span className="font-semibold text-neutral-900 tabular-nums">{entry.count}</span>
                  <span className="w-9 text-end text-caption text-neutral-600 tabular-nums">{share(entry.count)}%</span>
                </span>
              </button>
            )
            return <li key={entry.key}>{hint ? <Tooltip label={hint}>{row}</Tooltip> : row}</li>
          })}
        </ul>
      </div>

      {footer}

      {footerLink && <CardFooterLink label={footerLink.label} onClick={footerLink.onClick} />}
    </div>
  )
}
