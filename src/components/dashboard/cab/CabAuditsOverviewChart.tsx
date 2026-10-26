import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip as ChartTooltip, XAxis } from 'recharts'
import type { AuditsOverviewEntry } from '@/lib/api/cabDashboardApi'
import { CardFooterLink } from '@/components/ui/CardFooterLink'
import { DashboardInfoButton } from '@/components/dashboard/cab/DashboardInfoButton'
import { ROUTES } from '@/lib/routes'

/** Planned audits are handled in audit planning; the rest in audit reporting. */
const BUCKET_HREF: Record<string, string> = {
  planned: ROUTES.cabAuditPlanning,
  inProgress: ROUTES.cabAuditReporting,
  completed: ROUTES.cabAuditReporting,
  reportFinalization: ROUTES.cabAuditReporting,
}

interface CabAuditsOverviewChartProps {
  entries: AuditsOverviewEntry[]
  footerLink?: { label: string; onClick: () => void }
}

export function CabAuditsOverviewChart({ entries, footerLink }: CabAuditsOverviewChartProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const title = t('cab.dashboard.auditsOverview.title')

  const data = entries.map((entry) => ({
    ...entry,
    label: t(`cab.dashboard.auditsOverview.stages.${entry.stageKey}`),
  }))
  const open = (payload?: { stageKey?: string }) => {
    const href = payload?.stageKey ? BUCKET_HREF[payload.stageKey] : undefined
    if (href) navigate(href)
  }

  return (
    <div className="flex flex-col rounded-lg border border-neutral-100 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <h3 className="text-body font-semibold text-neutral-900">{title}</h3>
          <DashboardInfoButton title={title} text={t('cab.dashboard.info.auditsOverview')} />
        </div>
        <div className="flex items-center gap-3 text-caption text-neutral-600">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-primary" />
            {t('cab.dashboard.auditsOverview.stage1')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-primary-100" />
            {t('cab.dashboard.auditsOverview.stage2')}
          </span>
        </div>
      </div>

      <div className="h-[220px]" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} barCategoryGap="28%" margin={{ top: 18, right: 4, left: 4, bottom: 0 }}>
            <XAxis reversed={i18n.dir() === 'rtl'} dataKey="label" axisLine={false} tickLine={false} interval={0} tick={{ fontSize: 11, fill: '#666' }} />
            <ChartTooltip
              cursor={{ fill: '#f3f6fd' }}
              contentStyle={{ borderRadius: 12, border: '1px solid #d1dbfa', fontSize: 13 }}
              formatter={(value, name) => [value, name === 'stage1' ? t('cab.dashboard.auditsOverview.stage1') : t('cab.dashboard.auditsOverview.stage2')]}
              labelFormatter={(label) => `${label} · ${t('cab.dashboard.auditsOverview.clickToOpen')}`}
            />
            <Bar dataKey="stage1" fill="#1236a3" radius={[4, 4, 0, 0]} cursor="pointer" onClick={(bar) => open(bar?.payload)}>
              <LabelList dataKey="stage1" position="top" fontSize={11} fill="#1a1a1a" />
            </Bar>
            <Bar dataKey="stage2" fill="#d1dbfa" radius={[4, 4, 0, 0]} cursor="pointer" onClick={(bar) => open(bar?.payload)}>
              <LabelList dataKey="stage2" position="top" fontSize={11} fill="#1a1a1a" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {footerLink && <CardFooterLink label={footerLink.label} onClick={footerLink.onClick} />}
    </div>
  )
}
