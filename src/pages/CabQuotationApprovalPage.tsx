import { useEffect, useState } from 'react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { HeaderActions } from '@/components/dashboard/cab/CabHeader'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { activityText } from '@/lib/activityText'
import { enumLabel } from '@/lib/enumLabel'
import { CabLayout } from '@/components/layout/CabLayout'
import { markTourPending } from '@/context/tour/tourStorage'
import { WorkflowProgressCard } from '@/components/dashboard/cab/WorkflowProgressCard'
import { DashboardFooter } from '@/components/dashboard/DashboardFooter'
import {
  AppIcon,
  BuildingsIcon,
  CorrectiveActionIcon,
  FileTextIcon,
  HistoryIcon,
  MapPinIcon,
  PdfFileIcon,
  AddCircleIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { buildClientWorkflowSteps } from '@/lib/workflowSteps'
import { getCabQuotationApproval, type CabQuotationApproval } from '@/lib/api/cabQuotationApprovalApi'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { useFitScale } from '@/lib/useFitScale'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { useQuotationApprovalTourSteps } from '@/config/quotationApprovalTourSteps'

const cardClassName = 'rounded-lg border border-neutral-100 bg-white'

type TabKey =
  | 'details'
  | 'documents'
  | 'reviewComments'
  | 'informationRequired'
  | 'technicalFeasibility'
  | 'quotation'
  | 'quotationApproval'
  | 'history'

const TABS: TabKey[] = [
  'details',
  'documents',
  'reviewComments',
  'informationRequired',
  'technicalFeasibility',
  'quotation',
  'quotationApproval',
  'history',
]

const TAB_LABEL_KEYS: Record<TabKey, string> = {
  details: 'cab.applications.review.tabs.applicationDetails',
  documents: 'cab.applications.review.tabs.documents',
  reviewComments: 'cab.applications.review.tabs.reviewComments',
  informationRequired: 'cab.sidebar.informationRequired',
  technicalFeasibility: 'cab.sidebar.technicalFeasibility',
  quotation: 'cab.sidebar.quotation',
  quotationApproval: 'cab.sidebar.quotationApproval',
  history: 'cab.applications.review.tabs.history',
}

/** Small inline status pill — same shape used across the CAB application
 *  pages (quotation, review, receipt), kept local to match that convention. */
function StatusBadge({ label, variant, pill = false }: { label: string; variant: 'inProgress' | 'valid' | 'neutral'; pill?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-overline font-bold',
        pill ? 'rounded-full px-2.5 py-0.5 text-caption font-semibold leading-none' : 'rounded-sm',
        variant === 'inProgress' && 'bg-primary-50 text-primary',
        variant === 'valid' && 'bg-success-50 text-success-600',
        variant === 'neutral' && 'bg-neutral-50 text-text-primary'
      )}
    >
      {label}
    </span>
  )
}

function SummaryField({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 shrink-0 items-start gap-2">
      {icon ? <span className="mt-0.5 shrink-0 text-neutral-500">{icon}</span> : null}
      <div className="min-w-0 whitespace-nowrap">
        <p className="text-caption font-semibold text-neutral-500">{label}</p>
        <div className="text-body-sm font-bold leading-snug text-text-primary">{value}</div>
      </div>
    </div>
  )
}

function AvatarInitials({ initials, color = '#7c3aed' }: { initials: string; color?: string }) {
  return (
    <span
      className="flex size-7 shrink-0 items-center justify-center rounded-full text-overline font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {initials}
    </span>
  )
}


function CollapseChevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-500" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ClientIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function BoxIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3.5 7.5L12 3l8.5 4.5V16.5L12 21l-8.5-4.5V7.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M3.5 7.5L12 12l8.5-4.5M12 12v9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M19.4 13.5a7.5 7.5 0 0 0 0-3l1.9-1.5-2-3.4-2.3.7a7.4 7.4 0 0 0-2.6-1.5L14 2h-4l-.4 2.3a7.4 7.4 0 0 0-2.6 1.5l-2.3-.7-2 3.4L4.6 10.5a7.5 7.5 0 0 0 0 3l-1.9 1.5 2 3.4 2.3-.7c.75.66 1.63 1.17 2.6 1.5L10 22h4l.4-2.3a7.4 7.4 0 0 0 2.6-1.5l2.3.7 2-3.4-1.9-1.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChecklistDocIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6.5 3h8l4 4v13.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12.5l1.8 1.8 3.7-3.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SectionCard({
  title,
  children,
  collapsible = true,
}: {
  title: string
  children: React.ReactNode
  collapsible?: boolean
}) {
  return (
    <section className={cn(cardClassName, 'min-w-0 overflow-hidden p-4 sm:p-6')}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-body font-bold text-primary">
          <span className="h-5 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
          {title}
        </h2>
        {collapsible && (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-neutral-100 text-neutral-500">
            <CollapseChevron />
          </span>
        )}
      </div>
      {children}
    </section>
  )
}

function QuotationSummaryCard({ data, t }: { data: CabQuotationApproval; t: (key: string, opts?: Record<string, unknown>) => string }) {
  const rows: Array<{ label: string; value: React.ReactNode; strong?: boolean }> = [
    { label: t('cab.applications.quotationApproval.summary.quotationNo'), value: data.quotationNo },
    { label: t('cab.applications.quotationApproval.summary.version'), value: data.version },
    { label: t('cab.applications.quotationApproval.summary.preparedBy'), value: data.preparedBy },
    { label: t('cab.applications.quotationApproval.summary.preparedOn'), value: data.preparedOn, strong: true },
    {
      label: t('cab.applications.quotationApproval.summary.validUntil'),
      value: t('cab.applications.quotationApproval.summary.validUntilValue', {
        date: data.validUntil,
        days: data.validityDays,
      }),
      strong: true,
    },
    { label: t('cab.applications.quotationApproval.summary.currency'), value: data.currency, strong: true },
    {
      label: t('cab.applications.quotationApproval.summary.totalExclTaxes'),
      value: `${data.currency} ${data.totalExcludingTaxes}`,
      strong: true,
    },
    {
      label: t('cab.applications.quotationApproval.summary.taxes', { percent: data.taxesPercent }),
      value: `${data.currency} ${data.taxesAmount}`,
      strong: true,
    },
  ]

  return (
    <SectionCard title={t('cab.applications.quotationApproval.summary.title')}>
      <dl className="divide-y divide-neutral-50">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 py-2.5 text-body-sm">
            <dt className="text-text-primary">{row.label}</dt>
            <dd className={cn('text-end', row.strong ? 'font-bold text-text-primary' : 'text-text-primary')}>{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-dashed border-primary/40 bg-primary-25 px-4 py-3">
        <span className="text-body-sm font-bold text-primary">
          {t('cab.applications.quotationApproval.summary.totalInclTaxes')}
        </span>
        <span className="text-body-lg font-bold text-primary">
          {data.totalIncludingTaxes} <span className="text-caption font-medium">{data.currency}</span>
        </span>
      </div>
    </SectionCard>
  )
}

function AuditScopeCard({ data, t }: { data: CabQuotationApproval; t: (key: string) => string }) {
  return (
    <SectionCard title={t('cab.applications.quotationApproval.auditScope.title')}>
      <p className="text-body-sm leading-relaxed text-text-primary">{data.auditScopeDescription}</p>
      <h3 className="mt-4 text-body-sm font-bold text-text-primary">
        {t('cab.applications.quotationApproval.auditScope.includedInScope')}
      </h3>
      <ul className="mt-2.5 space-y-2">
        {data.includedInScope.map((item) => (
          <li key={item} className="flex items-start gap-2 text-body-sm text-text-primary">
            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-success-50 text-overline font-bold text-success-600">
              ✓
            </span>
            {item}
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}

function BreakdownTable({ data, t }: { data: CabQuotationApproval; t: (key: string) => string }) {
  return (
    <section className={cn(cardClassName, 'min-w-0 overflow-hidden')}>
      <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
        <h2 className="text-body font-bold text-text-primary">{t('cab.applications.quotationApproval.breakdown.title')}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-start">
          <thead>
            <tr className="bg-primary text-body-sm font-medium text-white">
              <th className="w-12 px-4 py-3 text-start">{t('cab.applications.quotationApproval.breakdown.columns.number')}</th>
              <th className="px-4 py-3 text-start">{t('cab.applications.quotationApproval.breakdown.columns.description')}</th>
              <th className="px-4 py-3 text-start">{t('cab.applications.quotationApproval.breakdown.columns.basis')}</th>
              <th className="px-4 py-3 text-start">{t('cab.applications.quotationApproval.breakdown.columns.quantity')}</th>
              <th className="px-4 py-3 text-end">{t('cab.applications.quotationApproval.breakdown.columns.rate')}</th>
              <th className="px-4 py-3 text-end">{t('cab.applications.quotationApproval.breakdown.columns.amount')}</th>
            </tr>
          </thead>
          <tbody>
            {data.lineItems.map((item, index) => (
              <tr
                key={item.id}
                className={cn('border-b border-neutral-100 text-body-sm text-text-primary', index % 2 === 1 && 'bg-neutral-25')}
              >
                <td className="px-4 py-3.5">{item.id}</td>
                <td className="px-4 py-3.5 font-semibold">{item.description}</td>
                <td className="px-4 py-3.5">{item.basis}</td>
                <td className="px-4 py-3.5">{item.quantity}</td>
                <td className="px-4 py-3.5 text-end">{item.rate}</td>
                <td className="px-4 py-3.5 text-end font-semibold">{item.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-2 px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between text-body-sm text-neutral-500">
          <span>{t('cab.applications.quotationApproval.breakdown.subTotal')}</span>
          <span className="font-semibold text-text-primary">{data.currency} {data.subTotal}</span>
        </div>
        <div className="flex items-center justify-between text-body-sm">
          <span className="text-neutral-500">
            {t('cab.applications.quotationApproval.breakdown.discount')} ({data.discountLabel})
          </span>
          <span className="font-semibold text-error-500">- {data.currency} {data.discountAmount}</span>
        </div>
        <div className="flex items-center justify-between border-t border-neutral-100 pt-2.5 text-body-sm font-bold text-primary">
          <span>{t('cab.applications.quotationApproval.breakdown.total')}</span>
          <span>{data.currency} {data.breakdownTotalExcludingTaxes}</span>
        </div>
      </div>
    </section>
  )
}

function SitesCard({ data, t }: { data: CabQuotationApproval; t: (key: string) => string }) {
  return (
    <section className={cn(cardClassName, 'min-w-0 p-4 sm:p-5')}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-body-sm font-bold text-text-primary">{t('cab.applications.quotationApproval.sites.title')}</h3>
        <button type="button" className="flex items-center gap-1 text-caption font-semibold text-primary hover:underline">
          <AppIcon icon={MapPinIcon} size={13} />
          {t('cab.applications.quotationApproval.sites.viewDetails')}
        </button>
      </div>
      <ul className="space-y-2.5">
        {data.sites.map((site, index) => (
          <li key={site.name} className="rounded-md bg-primary-25 p-3">
            <p className="text-caption font-bold text-text-primary">
              {index + 1}. {site.name}
            </p>
            <p className="mt-0.5 text-caption leading-relaxed text-neutral-500">{site.address}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ApprovalInformationCard({ data, t }: { data: CabQuotationApproval; t: (key: string) => string }) {
  return (
    <section className={cn(cardClassName, 'min-w-0 p-4 sm:p-5')}>
      <h3 className="mb-3 text-body-sm font-bold text-text-primary">{t('cab.applications.quotationApproval.approvalInfo.title')}</h3>
      <div className="space-y-2.5 text-body-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-neutral-500">{t('cab.applications.quotationApproval.approvalInfo.reviewStatus')}</span>
          <StatusBadge label={data.approval.reviewStatus} variant="inProgress" pill />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-neutral-500">{t('cab.applications.quotationApproval.approvalInfo.reviewedBy')}</span>
          <span className="font-semibold text-text-primary">{data.approval.reviewedBy}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-neutral-500">{t('cab.applications.quotationApproval.approvalInfo.reviewedOn')}</span>
          <span className="font-semibold text-text-primary">{data.approval.reviewedOn}</span>
        </div>
      </div>
      <p className="mt-3 text-caption font-semibold text-neutral-500">{t('cab.applications.quotationApproval.approvalInfo.comments')}</p>
      <p className="mt-1 rounded-md bg-success-50 px-3 py-2.5 text-caption leading-relaxed text-success-600">
        {data.approval.comments}
      </p>
    </section>
  )
}

function InternalCommentsCard({ data, t }: { data: CabQuotationApproval; t: (key: string) => string }) {
  return (
    <section className={cn(cardClassName, 'flex min-w-0 flex-col p-4 sm:p-5')}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-body-sm font-bold text-text-primary">{t('cab.applications.quotationApproval.internalComments.title')}</h3>
        <button type="button" className="flex items-center gap-1 text-caption font-semibold text-primary hover:underline">
          <AppIcon icon={AddCircleIcon} size={13} />
          {t('cab.applications.quotationApproval.internalComments.addComment')}
        </button>
      </div>
      <div className="space-y-4">
        {data.internalComments.map((comment) => (
          <div key={`${comment.author}-${comment.time}`}>
            <div className="flex flex-wrap items-center gap-1.5">
              <AvatarInitials initials={comment.initials} />
              <span className="text-caption font-bold text-text-primary">{comment.author}</span>
              <span className="rounded-full bg-success-50 px-2 py-0.5 text-overline font-semibold text-success-600">
                {enumLabel(t, comment.role)}
              </span>
              <span className="ms-auto text-overline font-medium text-neutral-500">
                {comment.date} {comment.time}
              </span>
            </div>
            <p className="mt-1.5 text-caption leading-relaxed text-text-primary">{comment.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ApprovalHistoryCard({ data, t }: { data: CabQuotationApproval; t: (key: string) => string }) {
  return (
    <section className={cn(cardClassName, 'min-w-0 p-4 sm:p-5')}>
      <h3 className="mb-3 text-body-sm font-bold text-text-primary">{t('cab.applications.quotationApproval.approvalHistory.title')}</h3>
      <ul className="space-y-4">
        {data.approvalHistory.map((entry) => (
          <li key={`${entry.author}-${entry.time}`}>
            <div className="flex flex-wrap items-center gap-1.5">
              <AvatarInitials initials={entry.initials} color="#1236a3" />
              <span className="text-caption font-bold text-text-primary">{entry.author}</span>
              <StatusBadge label={entry.tag} variant="valid" />
            </div>
            <p className="mt-1 text-overline font-medium text-neutral-500">
              {entry.date} {entry.time}
            </p>
            <p className="mt-1 text-caption leading-relaxed text-text-primary">{activityText(t, entry.text)}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ApprovalNoteCard({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-warning-200 bg-warning-50 p-4">
      <AppIcon icon={CorrectiveActionIcon} size={18} className="mt-0.5 shrink-0 text-warning-500" />
      <div>
        <p className="text-body-sm font-bold text-text-primary">{t('cab.applications.quotationApproval.note.title')}</p>
        <ul className="mt-2 space-y-1">
          {['item1', 'item2', 'item3'].map((item) => (
            <li key={item} className="text-caption leading-relaxed text-text-primary">
              · {t(`cab.applications.quotationApproval.note.${item}`)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function CabQuotationApprovalPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const scale = useFitScale()
  const [data, setData] = useState<CabQuotationApproval | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('quotationApproval')
  const tourSteps = useQuotationApprovalTourSteps()

  useEffect(() => {
    let cancelled = false
    getCabQuotationApproval().then((result) => {
      if (!cancelled) {
        setData(result)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading || !data) {
    return (
      <CabLayout className="bg-white">
        <div className="flex flex-1 items-center justify-center p-6 text-body-sm text-neutral-600">
          {t('common.loading')}
        </div>
      </CabLayout>
    )
  }

  return (
    <CabLayout
      className="bg-white"
      tourId="cab-quotation-approval"
      tourSteps={tourSteps}
      onTourComplete={() => {
        markTourPending('cab-dashboard')
        navigate(ROUTES.workspace)
      }}
    >
      <DashboardTourStep steps={tourSteps} stepId="header">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-neutral-100 bg-white px-3 py-3 sm:gap-4 sm:px-5">
          <Breadcrumbs
              items={[
                { label: t('cab.applications.quotationApproval.breadcrumb.home'), to: ROUTES.workspace },
                { label: t('cab.applications.quotationApproval.breadcrumb.applications'), to: ROUTES.cabApplicationRegister },
                { label: String(data.applicationId ?? ''), to: `${ROUTES.cabApplicationRegister}?q=${encodeURIComponent(String(data.applicationId ?? ''))}` },
                { label: t('cab.applications.quotationApproval.breadcrumb.quotation'), to: ROUTES.cabApplicationQuotation },
                { label: t('cab.applications.quotationApproval.breadcrumb.current') },
              ]}
            />

          <HeaderActions />
        </header>
      </DashboardTourStep>

      <div className="flex min-w-0 flex-1 overflow-hidden bg-white">
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-white">
          <div className="flex min-w-0 flex-col gap-4 p-3 sm:gap-5 sm:p-5 lg:p-6">
            <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="flex min-w-0 flex-col gap-4 sm:gap-5" style={{ zoom: scale }}>
                <DashboardTourStep steps={tourSteps} stepId="page-header">
                  <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 lg:flex-nowrap">
                    <div className="min-w-0 flex-1">
                      <h1 className="text-section-title text-text-primary">
                        {t('cab.applications.quotationApproval.title')}
                      </h1>
                      <p className="mt-1.5 text-body-sm text-text-primary">{t('cab.applications.quotationApproval.subtitle')}</p>
                    </div>
                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 min-w-0 flex-1 gap-1.5 rounded-md border-neutral-100 px-3 text-caption font-medium text-text-primary sm:flex-none"
                      >
                        <AppIcon icon={PdfFileIcon} size={16} className="text-error-500" />
                        {t('cab.applications.quotationApproval.actions.downloadPdf')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 min-w-0 flex-1 gap-1.5 rounded-md border-neutral-100 px-3 text-caption font-medium text-text-primary sm:flex-none"
                      >
                        {t('cab.applications.quotationApproval.actions.moreActions')}
                        <AppIcon icon={AddCircleIcon} size={14} />
                      </Button>
                    </div>
                  </div>
                </DashboardTourStep>

                <DashboardTourStep steps={tourSteps} stepId="summary-card">
                  <section className={cn(cardClassName, 'min-w-0 overflow-hidden p-4 sm:p-6')}>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex size-14 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary">
                        <AppIcon icon={FileTextIcon} size={28} />
                      </span>
                      <span className="text-[24px] font-bold leading-none text-text-primary sm:text-[28px]">{data.applicationId}</span>
                      <StatusBadge label={t('cab.applications.quotationApproval.status.inProgress')} variant="inProgress" pill />
                    </div>

                    <div className="mt-6 flex items-start gap-x-5 overflow-x-auto pb-1 xl:justify-between xl:gap-x-6">
                      <SummaryField icon={<ClientIcon />} label={t('cab.applications.quotationApproval.summaryBar.client')} value={data.client} />
                      <SummaryField icon={<BoxIcon />} label={t('cab.applications.quotationApproval.summaryBar.applicationType')} value={data.applicationType} />
                      <SummaryField icon={<GearIcon />} label={t('cab.applications.quotationApproval.summaryBar.certificationBody')} value={data.certificationBody} />
                      <SummaryField icon={<ChecklistDocIcon />} label={t('cab.applications.quotationApproval.summaryBar.standardScheme')} value={data.standardScheme} />
                      <SummaryField
                        icon={<AppIcon icon={BuildingsIcon} size={18} />}
                        label={t('cab.applications.quotationApproval.summaryBar.sites')}
                        value={t('cab.applications.quotationApproval.summaryBar.sitesValue', { count: data.sitesCount })}
                      />
                      <SummaryField
                        label={t('cab.applications.quotationApproval.summaryBar.requestedOn')}
                        value={
                          <>
                            <span className="block">{data.requestedOnDate}</span>
                            <span className="block text-caption font-medium text-neutral-500">{data.requestedOnTime}</span>
                          </>
                        }
                      />
                      <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
                        <AvatarInitials initials={data.assignedTo.initials} />
                        <div>
                          <p className="text-caption font-semibold text-neutral-500">{t('cab.applications.quotationApproval.summaryBar.assignedTo')}</p>
                          <p className="text-body-sm font-bold leading-tight text-text-primary">{data.assignedTo.name}</p>
                          <p className="text-overline font-medium text-neutral-500">({data.assignedTo.role})</p>
                        </div>
                      </div>
                    </div>
                  </section>
                </DashboardTourStep>

                <DashboardTourStep steps={tourSteps} stepId="tabs">
                  <div className="flex flex-wrap items-center gap-1 overflow-x-auto border-b border-neutral-100">
                    {TABS.map((tab) => {
                      const active = activeTab === tab
                      return (
                        <button
                          key={tab}
                          type="button"
                          aria-selected={active}
                          onClick={() => setActiveTab(tab)}
                          className={cn(
                            'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-body-sm font-semibold transition-colors',
                            active ? 'border-primary text-primary' : 'border-transparent text-text-primary hover:text-text-primary'
                          )}
                        >
                          {t(TAB_LABEL_KEYS[tab])}
                          {tab === 'documents' && <span>(7)</span>}
                          {tab === 'history' && <AppIcon icon={HistoryIcon} size={13} />}
                        </button>
                      )
                    })}
                  </div>
                </DashboardTourStep>

                {activeTab === 'quotationApproval' ? (
                  <>
                    <DashboardTourStep steps={tourSteps} stepId="quotation-summary">
                      <QuotationSummaryCard data={data} t={t} />
                    </DashboardTourStep>
                    <DashboardTourStep steps={tourSteps} stepId="audit-scope">
                      <AuditScopeCard data={data} t={t} />
                    </DashboardTourStep>
                    <DashboardTourStep steps={tourSteps} stepId="breakdown-table">
                      <BreakdownTable data={data} t={t} />
                    </DashboardTourStep>

                    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
                      <DashboardTourStep steps={tourSteps} stepId="sites-card">
                        <SitesCard data={data} t={t} />
                      </DashboardTourStep>
                      <DashboardTourStep steps={tourSteps} stepId="approval-info">
                        <ApprovalInformationCard data={data} t={t} />
                      </DashboardTourStep>
                    </div>

                    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
                      <DashboardTourStep steps={tourSteps} stepId="internal-comments">
                        <InternalCommentsCard data={data} t={t} />
                      </DashboardTourStep>
                      <ApprovalHistoryCard data={data} t={t} />
                    </div>

                    <DashboardTourStep steps={tourSteps} stepId="approval-note">
                      <ApprovalNoteCard t={t} />
                    </DashboardTourStep>
                  </>
                ) : (
                  <section className={cn(cardClassName, 'flex min-h-[200px] items-center justify-center p-6')}>
                    <p className="text-center text-body-sm font-medium text-neutral-500">
                      {t('cab.applications.quotationApproval.tabPlaceholder')}
                    </p>
                  </section>
                )}
              </div>

              <DashboardTourStep steps={tourSteps} stepId="workflow-steps">
                <WorkflowProgressCard
                  steps={buildClientWorkflowSteps(t, 'quotation')}
                  title={t('cab.clientRegistration.workflow.title')}
                  viewFullLabel={t('cab.clientRegistration.workflow.viewFull')}
                  statusLabels={{
                    completed: t('cab.applications.receipt.workflow.completed'),
                    inProgress: t('cab.clientRegistration.workflow.inProgress'),
                    pending: t('cab.clientRegistration.workflow.pending'),
                  }}
                />
              </DashboardTourStep>
            </div>
          </div>

          <DashboardTourStep steps={tourSteps} stepId="footer-actions">
            <DashboardFooter
              onSaveDraft={() => { }}
              onBack={() => { }}
              onNext={() => { }}
              backDisabled={false}
              nextLabel={t('cab.applications.quotationApproval.actions.sendApproval')}
            />
          </DashboardTourStep>
        </div>
      </div>
    </CabLayout>
  )
}
