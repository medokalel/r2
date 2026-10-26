import { useEffect, useMemo, useState } from 'react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { HeaderActions } from '@/components/dashboard/cab/CabHeader'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { enumLabel } from '@/lib/enumLabel'
import { CabLayout } from '@/components/layout/CabLayout'
import { markTourPending } from '@/context/tour/tourStorage'
import { WorkflowProgressCard as SharedWorkflowProgressCard } from '@/components/dashboard/cab/WorkflowProgressCard'
import {
  AppIcon,
  ArrowRightIcon,
  BuildingsIcon,
  CalendarIcon,
  CommentIcon,
  CorrectiveActionIcon,
  DownloadIcon,
  ExportIcon,
  FileTextIcon,
  HistoryIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/Button'
import {
  getCabApplicationTechnicalFeasibility,
  updateCabApplicationTechnicalFeasibility,
  type AssessmentStatus,
  type CabApplicationTechnicalFeasibility,
} from '@/lib/api/cabApplicationTechnicalFeasibilityApi'
import {
  ROUTES,
  cabApplicationInformationRequiredPath,
  cabApplicationQuotationPath,
  cabApplicationReceiptPath,
  cabApplicationReviewPath,
} from '@/lib/routes'
import { ActionMenu } from '@/components/dashboard/cab/workflow/ActionMenu'
import { DialogDateField, DialogTextArea, WorkflowDialog } from '@/components/dashboard/cab/workflow/WorkflowDialog'
import { TechnicalFeasibilityTeamDialog } from '@/components/dashboard/cab/TechnicalFeasibilityTeamDialog'
import { downloadFeasibilityPdf } from '@/lib/pdf/feasibilityPdf'
import { toast } from '@/lib/toast'
import { workflowErrorMessage } from '@/lib/workflowErrors'
import { cn } from '@/lib/utils'
import { useFitScale } from '@/lib/useFitScale'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { useApplicationTechnicalFeasibilityTourSteps } from '@/config/applicationTechnicalFeasibilityTourSteps'
import { buttonVariants } from '@/components/ui/buttonVariants'

type Translate = ReturnType<typeof useTranslation>['t']

const cardClassName = 'rounded-lg border border-neutral-100 bg-white'

type TabKey =
  | 'details'
  | 'documents'
  | 'reviewComments'
  | 'informationRequired'
  | 'technicalFeasibility'
  | 'history'

function StatusBadge({
  label,
  variant,
  pill = false,
  showCheck = true,
}: {
  label: string
  variant: 'inProgress' | 'feasible' | 'partial' | 'notFeasible' | 'neutral'
  pill?: boolean
  showCheck?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-overline font-bold',
        pill ? 'rounded-full px-2.5 py-0.5 text-caption font-semibold leading-none' : 'rounded-sm',
        variant === 'inProgress' && 'bg-primary-50 text-primary',
        variant === 'feasible' && 'bg-success-50 text-success-600',
        variant === 'partial' && 'bg-warning-50 text-warning-700',
        variant === 'notFeasible' && 'bg-error-50 text-error-500',
        variant === 'neutral' && 'bg-neutral-50 text-neutral-500'
      )}
    >
      {variant === 'feasible' && showCheck && <span aria-hidden>✓</span>}
      {label}
    </span>
  )
}

function assessmentVariant(status: AssessmentStatus): 'feasible' | 'partial' | 'notFeasible' | 'neutral' {
  if (status === 'feasible') return 'feasible'
  if (status === 'partiallyFeasible') return 'partial'
  if (status === 'notFeasible') return 'notFeasible'
  return 'neutral'
}

function SummaryField({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 shrink-0 items-start gap-2">
      {icon ? <span className="mt-0.5 shrink-0 text-primary">{icon}</span> : null}
      <div className="min-w-0 whitespace-nowrap">
        <p className="text-caption font-semibold text-neutral-500">{label}</p>
        <div className="text-body-sm font-bold leading-snug text-text-primary">{value}</div>
      </div>
    </div>
  )
}

function AvatarInitials({ initials, color = '#7c3aed', size = 'md' }: { initials: string; color?: string; size?: 'md' | 'lg' }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-bold text-white',
        size === 'lg' ? 'size-9 text-caption' : 'size-7 text-overline'
      )}
      style={{ backgroundColor: color }}
    >
      {initials}
    </span>
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

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={cn('shrink-0', className)} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function FeasibilityDonut({ percent }: { percent: number }) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="relative flex size-28 items-center justify-center">
      <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
        <circle cx="56" cy="56" r={radius} fill="none" stroke="#ececec" strokeWidth="10" />
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke="#16a34a"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[24px] font-bold text-success-600">{percent}%</span>
    </div>
  )
}

function AssessmentTable({ data, t }: { data: CabApplicationTechnicalFeasibility; t: Translate }) {
  const legend = [
    { key: 'feasible', color: 'bg-success-600' },
    { key: 'partiallyFeasible', color: 'bg-warning-500' },
    { key: 'notFeasible', color: 'bg-error-500' },
    { key: 'notApplicable', color: 'bg-neutral-500' },
  ] as const

  return (
    <section className={cn(cardClassName, 'min-w-0 overflow-hidden')}>
      <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
        <h2 className="text-body font-bold text-primary">
          {t('cab.applications.technicalFeasibility.assessment.title')}
        </h2>
      </div>
      <table className="w-full table-fixed border-collapse text-start [&_td:not(:last-child)]:border-r [&_td:not(:last-child)]:border-neutral-100 [&_th:not(:last-child)]:border-r [&_th:not(:last-child)]:border-white/20">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[26%]" />
            <col className="w-[14%]" />
            <col className="w-[38%]" />
          </colgroup>
          <thead>
            <tr className="bg-primary text-body-2-medium text-white">
              <th className="px-3 py-3.5 text-center">{t('cab.applications.technicalFeasibility.assessment.columns.area')}</th>
              <th className="px-3 py-3.5 text-center">{t('cab.applications.technicalFeasibility.assessment.columns.assessment')}</th>
              <th className="px-3 py-3.5 text-center">{t('cab.applications.technicalFeasibility.assessment.columns.status')}</th>
              <th className="px-3 py-3.5 text-center">{t('cab.applications.technicalFeasibility.assessment.columns.comments')}</th>
            </tr>
          </thead>
          <tbody>
            {data.assessments.map((row) => (
              <tr key={row.id} className="border-b border-neutral-100 text-caption text-text-primary last:border-b-0">
                <td className="px-3 py-3 font-semibold align-top">{t(`cab.applications.technicalFeasibility.assessment.areas.${row.areaKey}`)}</td>
                <td className="px-3 py-3 font-medium align-top break-words">{row.assessment}</td>
                <td className="px-3 py-3 text-center align-top">
                  <StatusBadge
                    label={t(`cab.applications.technicalFeasibility.assessment.status.${row.status}`)}
                    variant={assessmentVariant(row.status)}
                  />
                </td>
                <td className="px-3 py-3 font-medium align-top break-words text-text-primary">{row.comments}</td>
              </tr>
            ))}
          </tbody>
        </table>
      <div className="flex flex-wrap items-center gap-4 border-t border-neutral-100 px-4 py-3 text-caption font-semibold sm:px-5">
        <span className="text-text-primary">{t('cab.applications.technicalFeasibility.assessment.legend.title')}</span>
        {legend.map((item) => (
          <span key={item.key} className="flex items-center gap-1.5 text-text-primary">
            <span className={cn('size-2.5 rounded-full', item.color)} />
            {t(`cab.applications.technicalFeasibility.assessment.status.${item.key}`)}
          </span>
        ))}
      </div>
    </section>
  )
}

function CommentsSection({ data, t, onAdd }: { data: CabApplicationTechnicalFeasibility; t: Translate; onAdd: () => void }) {
  return (
    <section className={cn(cardClassName, 'min-w-0 p-4 sm:p-5')}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-body font-bold text-primary">
          {t('cab.applications.technicalFeasibility.comments.title')}
        </h2>
        <button type="button" onClick={onAdd} className="text-caption font-semibold text-primary hover:underline">
          + {t('cab.applications.technicalFeasibility.actions.addInternalComment')}
        </button>
      </div>
      <div className="space-y-4">
        {data.internalComments.map((comment) => (
          <div key={`${comment.author}-${comment.time}`}>
            <div className="flex flex-wrap items-center gap-2">
              <AvatarInitials initials={comment.initials} color={comment.color} />
              <span className="text-body-sm font-bold text-text-primary">{comment.author}</span>
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-overline font-semibold text-primary">
                {enumLabel(t, comment.role)}
              </span>
              <span className="text-caption font-medium text-neutral-500">
                {comment.date} {comment.time}
              </span>
            </div>
            <div className="mt-2 rounded-md border border-neutral-100 bg-neutral-25 px-4 py-3">
              <p className="text-caption leading-relaxed text-text-primary">{comment.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function AuditTeamCard({ data, t, onEdit }: { data: CabApplicationTechnicalFeasibility; t: Translate; onEdit?: () => void }) {
  return (
    <section className={cn(cardClassName, 'min-w-0 p-5')}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-body-sm font-bold text-primary">
          {t('cab.applications.technicalFeasibility.auditTeam.title')}
        </h3>
        {onEdit && (
          <button type="button" onClick={onEdit} className="text-caption font-semibold text-primary hover:underline">
            {t('cab.applications.technicalFeasibility.auditTeam.edit')}
          </button>
        )}
      </div>
      <ul className="space-y-4">
        {data.auditTeam.map((member) => (
          <li key={member.employeeId ?? member.name} className="flex items-start gap-3">
            <AvatarInitials initials={member.initials} color={member.color} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-body-sm font-bold text-text-primary">{member.name}</p>
                <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-overline font-semibold text-primary">
                  {t([`cab.applications.technicalFeasibility.auditTeam.roles.${member.roleKey}`, `team.feasibilityRoles.${member.roleKey}`])}
                </span>
              </div>
              <p className="mt-1 text-caption font-medium text-neutral-500">{member.certification}</p>
              <p className="text-caption font-medium text-neutral-500">
                {t('cab.applications.technicalFeasibility.auditTeam.experience', { value: member.experience })}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ResourcesCard({ data, t }: { data: CabApplicationTechnicalFeasibility; t: Translate }) {
  return (
    <section className={cn(cardClassName, 'min-w-0 p-5')}>
      <h3 className="mb-4 text-body-sm font-bold text-primary">
        {t('cab.applications.technicalFeasibility.resources.title')}
      </h3>
      <ul className="space-y-3">
        {data.resources.map((resource) => (
          <li key={resource.key} className="flex items-center justify-between gap-3 text-caption font-medium text-text-primary">
            <span>{t(`cab.applications.technicalFeasibility.resources.items.${resource.key}`)}</span>
            <StatusBadge
              label={t('cab.applications.technicalFeasibility.resources.available')}
              variant="feasible"
              pill
              showCheck={false}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

function RecommendationCard({ t, onProceed }: { t: Translate; onProceed: () => void }) {
  return (
    <section className="rounded-lg border border-primary-200 bg-primary-50 p-5">
      <div className="flex items-start gap-2.5">
        <InfoIcon className="mt-0.5 text-primary" />
        <div className="min-w-0">
          <h3 className="text-body-sm font-bold text-primary">
            {t('cab.applications.technicalFeasibility.recommendation.title')}
          </h3>
          <p className="mt-1.5 text-caption font-medium leading-snug text-text-primary">
            {t('cab.applications.technicalFeasibility.recommendation.text')}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onProceed}
        className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-5 w-full justify-center')}
      >
        {t('cab.applications.technicalFeasibility.actions.proceedToQuotation')}
        <AppIcon icon={ArrowRightIcon} size={14} className="text-primary" />
      </button>
    </section>
  )
}

function ReviewSummaryCard({ data, t }: { data: CabApplicationTechnicalFeasibility; t: Translate }) {
  return (
    <section className={cn(cardClassName, 'flex min-w-0 flex-col items-center p-4 sm:flex-row sm:items-center sm:gap-6')}>
      <div>
        <h3 className="mb-3 text-body-sm font-bold text-primary">
          {t('cab.applications.technicalFeasibility.reviewSummary.title')}
        </h3>
        <p className="text-caption font-semibold text-success-600">
          {t('cab.applications.technicalFeasibility.reviewSummary.feasibleCount', {
            count: data.feasibleCount,
            total: data.totalAssessments,
          })}
        </p>
      </div>
      <FeasibilityDonut percent={data.feasibilityPercent} />
    </section>
  )
}

function KeyInformationCard({ data, t }: { data: CabApplicationTechnicalFeasibility; t: Translate }) {
  return (
    <section className={cn(cardClassName, 'min-w-0 p-5')}>
      <h3 className="mb-4 text-body-sm font-bold text-primary">
        {t('cab.applications.technicalFeasibility.keyInformation.title')}
      </h3>
      <dl className="space-y-4 text-caption">
        <div>
          <dt className="font-semibold text-neutral-500">{t('cab.applications.technicalFeasibility.keyInformation.requestedOn')}</dt>
          <dd className="mt-0.5 font-bold text-text-primary">
            {data.requestedOnDate} {data.requestedOnTime}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-neutral-500">{t('cab.applications.technicalFeasibility.keyInformation.requestedBy')}</dt>
          <dd className="mt-0.5 font-bold text-text-primary">{data.requestedBy.name}</dd>
        </div>
        <div>
          <dt className="font-semibold text-neutral-500">{t('cab.applications.technicalFeasibility.keyInformation.dueDate')}</dt>
          <dd className="mt-0.5 font-bold text-text-primary">{data.assessmentDueDate}</dd>
        </div>
      </dl>
    </section>
  )
}

function WorkflowProgressSidebar({ data, t }: { data: CabApplicationTechnicalFeasibility; t: Translate }) {
  const steps = useMemo(
    () =>
      data.workflowSteps.map((step) => ({
        key: step.key,
        label: t(`cab.applications.technicalFeasibility.workflowSteps.${step.key}`),
        description: t(`cab.applications.technicalFeasibility.workflowStepDescriptions.${step.key}`),
        status: step.status,
      })),
    [data.workflowSteps, t]
  )

  return (
    <SharedWorkflowProgressCard
      steps={steps}
      title={t('cab.applications.receipt.sections.workflowProgress')}
      viewFullLabel={t('cab.applications.receipt.actions.viewFullWorkflow')}
      statusLabels={{
        completed: t('cab.applications.receipt.workflow.completed'),
        inProgress: t('cab.applications.receipt.workflow.inProgress'),
        pending: t('cab.applications.receipt.workflow.pending'),
      }}
    />
  )
}

type QuickAction = 'comment' | 'escalate' | 'dueDate'

function QuickActionsCard({ t, onAction, onRequestInformation }: { t: Translate; onAction: (action: QuickAction) => void; onRequestInformation: () => void }) {
  return (
    <section className={cn(cardClassName, 'flex min-w-0 flex-col gap-2 p-4')}>
      <h2 className="mb-1 text-body-sm font-bold text-text-primary">
        {t('cab.applications.technicalFeasibility.quickActions.title')}
      </h2>
      <button
        type="button"
        onClick={() => onAction('comment')}
        className="flex h-9 w-full items-center gap-2 rounded-md border border-primary-200 bg-primary-50 px-3 text-caption font-semibold text-primary hover:opacity-90"
      >
        <AppIcon icon={CommentIcon} size={14} />
        {t('cab.applications.technicalFeasibility.quickActions.addInternalComment')}
      </button>
      <button
        type="button"
        onClick={onRequestInformation}
        className="flex h-9 w-full items-center gap-2 rounded-md border border-neutral-100 bg-white px-3 text-caption font-semibold text-primary hover:opacity-90"
      >
        <AppIcon icon={ExportIcon} size={14} />
        {t('cab.applications.technicalFeasibility.quickActions.requestInformation', 'Request information from client')}
      </button>
      <button
        type="button"
        onClick={() => onAction('escalate')}
        className="flex h-9 w-full items-center gap-2 rounded-md border border-error-200 bg-error-50 px-3 text-caption font-semibold text-error-500 hover:opacity-90"
      >
        <AppIcon icon={CorrectiveActionIcon} size={14} />
        {t('cab.applications.technicalFeasibility.quickActions.escalate')}
      </button>
      <button
        type="button"
        onClick={() => onAction('dueDate')}
        className="flex h-9 w-full items-center gap-2 rounded-md border border-success-200 bg-success-50 px-3 text-caption font-semibold text-success-600 hover:opacity-90"
      >
        <AppIcon icon={CalendarIcon} size={18} />
        {t('cab.applications.technicalFeasibility.quickActions.extendDueDate')}
      </button>
    </section>
  )
}

function TabRedirect({ message, label, onOpen }: { message: string; label: string; onOpen: () => void }) {
  return (
    <section className={cn(cardClassName, 'flex min-h-[200px] flex-col items-center justify-center gap-3 p-6')}>
      <p className="text-center text-body-sm font-medium text-neutral-500">{message}</p>
      <Button type="button" variant="outline" size="sm" className="h-9 px-4" onClick={onOpen}>
        {label}
      </Button>
    </section>
  )
}

const TABS: TabKey[] = [
  'details',
  'documents',
  'reviewComments',
  'informationRequired',
  'technicalFeasibility',
  'history',
]

const TAB_LABEL_KEYS: Record<TabKey, string> = {
  details: 'cab.applications.review.tabs.applicationDetails',
  documents: 'cab.applications.review.tabs.documents',
  reviewComments: 'cab.applications.review.tabs.reviewComments',
  informationRequired: 'cab.sidebar.informationRequired',
  technicalFeasibility: 'cab.sidebar.technicalFeasibility',
  history: 'cab.applications.review.tabs.history',
}

export function CabApplicationTechnicalFeasibilityPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const scale = useFitScale()
  const { applicationId } = useParams()
  const [searchParams] = useSearchParams()
  const clientId = searchParams.get('clientId') ?? undefined
  const [data, setData] = useState<CabApplicationTechnicalFeasibility | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('technicalFeasibility')
  const [teamOpen, setTeamOpen] = useState(false)
  const [quick, setQuick] = useState<QuickAction | null>(null)
  const [quickText, setQuickText] = useState('')
  const [quickDate, setQuickDate] = useState('')
  const [quickBusy, setQuickBusy] = useState(false)
  const [quickError, setQuickError] = useState<string | null>(null)
  const [pdfBusy, setPdfBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    getCabApplicationTechnicalFeasibility(applicationId, clientId).then((result) => {
      if (!cancelled) {
        setData(result)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [applicationId, clientId])

  const tourSteps = useApplicationTechnicalFeasibilityTourSteps()

  if (loading || !data) {
    return (
      <CabLayout className="bg-white">
        <div className="flex flex-1 items-center justify-center p-6 text-body-sm text-neutral-600">
          {t('common.loading')}
        </div>
      </CabLayout>
    )
  }

  const proceedToQuotation = () =>
    navigate(cabApplicationQuotationPath(applicationId, clientId))

  // Edits need a real application (the guided tour without one shows the sample only).
  const editable = Boolean(applicationId)

  const openQuick = (action: QuickAction) => {
    setQuick(action)
    setQuickText('')
    setQuickDate('')
    setQuickError(null)
  }

  const runQuick = async () => {
    if (!quick || !applicationId) return
    setQuickBusy(true)
    setQuickError(null)
    try {
      const update =
        quick === 'dueDate'
          ? { assessmentDueDate: quickDate, comment: t('cab.applications.technicalFeasibility.quick.dueDateComment', { defaultValue: 'Assessment due date extended to {{date}}. {{reason}}', date: quickDate, reason: quickText.trim() }) }
          : quick === 'escalate'
            ? { comment: t('cab.applications.technicalFeasibility.quick.escalationComment', { defaultValue: 'Escalated to technical management: {{reason}}', reason: quickText.trim() }) }
            : { comment: quickText.trim() }
      setData(await updateCabApplicationTechnicalFeasibility(applicationId, update))
      toast.success(t('cab.applications.technicalFeasibility.quick.saved', 'Saved.'))
      setQuick(null)
    } catch (err) {
      setQuickError(workflowErrorMessage(err, t))
    } finally {
      setQuickBusy(false)
    }
  }

  const downloadAssessment = async () => {
    setPdfBusy(true)
    try {
      await downloadFeasibilityPdf(data, t, i18n.language)
    } catch (err) {
      toast.error(workflowErrorMessage(err, t))
    } finally {
      setPdfBusy(false)
    }
  }

  const quickTitles: Record<QuickAction, string> = {
    comment: t('cab.applications.technicalFeasibility.quickActions.addInternalComment'),
    escalate: t('cab.applications.technicalFeasibility.quickActions.escalate'),
    dueDate: t('cab.applications.technicalFeasibility.quickActions.extendDueDate'),
  }
  const quickValid = quick === 'dueDate' ? Boolean(quickDate) : quickText.trim().length >= 3

  return (
    <CabLayout
      className="bg-white"
      tourId="cab-application-technical-feasibility"
      tourSteps={tourSteps}
      onTourComplete={() => {
        markTourPending('cab-application-quotation')
        navigate(cabApplicationQuotationPath(applicationId, clientId))
      }}
    >
        <DashboardTourStep steps={tourSteps} stepId="header">
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-neutral-100 bg-white px-3 py-3 sm:gap-4 sm:px-5">
            <Breadcrumbs
              items={[
                { label: t('cab.applications.technicalFeasibility.breadcrumb.home'), to: ROUTES.workspace },
                { label: t('cab.applications.technicalFeasibility.breadcrumb.applications'), to: ROUTES.cabApplicationRegister },
                { label: String(data.applicationId ?? ''), to: `${ROUTES.cabApplicationRegister}?q=${encodeURIComponent(String(data.applicationId ?? ''))}` },
                { label: t('cab.applications.technicalFeasibility.breadcrumb.current') },
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
                      <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-section-title text-text-primary">
                          {t('cab.applications.technicalFeasibility.title')}
                        </h1>
                        <StatusBadge
                          label={t('cab.applications.technicalFeasibility.status.inProgress')}
                          variant="inProgress"
                          pill
                        />
                      </div>
                      <p className="mt-1.5 text-body-sm text-text-primary">
                        {t('cab.applications.technicalFeasibility.subtitle')}
                      </p>
                    </div>
                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pdfBusy}
                        onClick={() => void downloadAssessment()}
                        className="h-9 min-w-0 flex-1 gap-1.5 rounded-md border-neutral-100 px-3 text-caption font-medium text-text-primary sm:flex-none"
                      >
                        <AppIcon icon={DownloadIcon} size={16} />
                        {t('cab.applications.technicalFeasibility.actions.downloadAssessment')}
                      </Button>
                      <ActionMenu
                        label={t('cab.applications.technicalFeasibility.actions.moreActions')}
                        triggerClassName="h-9 text-caption"
                        items={[
                          {
                            key: 'review',
                            label: t('cab.applications.receipt.ack.viewApplication', 'View application'),
                            disabled: !editable,
                            onSelect: () => applicationId && navigate(cabApplicationReviewPath(applicationId, clientId)),
                          },
                          {
                            key: 'receipt',
                            label: t('cab.applications.informationRequired.more.receipt', 'Application receipt'),
                            disabled: !editable,
                            onSelect: () => applicationId && navigate(cabApplicationReceiptPath(applicationId, clientId)),
                          },
                          {
                            key: 'information',
                            label: t('cab.applications.receipt.ack.requestInformation', 'Request information'),
                            onSelect: () => navigate(cabApplicationInformationRequiredPath(applicationId, clientId)),
                          },
                        ]}
                      />
                      <Button className="h-9 w-full gap-1.5 rounded-md px-3 text-caption font-semibold sm:w-auto" onClick={proceedToQuotation}>
                        {t('cab.applications.technicalFeasibility.actions.proceedToQuotation')}
                        <AppIcon icon={ArrowRightIcon} size={14} className="text-white" />
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
                      <StatusBadge
                        label={t('cab.applications.technicalFeasibility.status.inProgress')}
                        variant="inProgress"
                        pill
                      />
                    </div>

                    <div className="mt-6 flex items-start gap-x-5 overflow-x-auto pb-1 xl:justify-between xl:gap-x-6">
                      <SummaryField icon={<ClientIcon />} label={t('cab.applications.technicalFeasibility.summary.client')} value={data.client} />
                      <SummaryField icon={<BoxIcon />} label={t('cab.applications.technicalFeasibility.summary.applicationType')} value={data.applicationType} />
                      <SummaryField icon={<GearIcon />} label={t('cab.applications.technicalFeasibility.summary.certificationBody')} value={data.certificationBody} />
                      <SummaryField icon={<ChecklistDocIcon />} label={t('cab.applications.technicalFeasibility.summary.standardScheme')} value={data.primaryStandard} />
                      <SummaryField
                        icon={<AppIcon icon={BuildingsIcon} size={18} />}
                        label={t('cab.applications.technicalFeasibility.summary.sites')}
                        value={String(data.sitesCount)}
                      />
                      <SummaryField
                        label={t('cab.applications.technicalFeasibility.summary.requestedOn')}
                        value={
                          <>
                            <span className="block">{data.requestedOnDate}</span>
                            <span className="block text-caption font-medium text-neutral-500">{data.requestedOnTime}</span>
                          </>
                        }
                      />
                      <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
                        <AvatarInitials initials={data.requestedBy.initials} color="#7c3aed" />
                        <div>
                          <p className="text-caption font-semibold text-neutral-500">
                            {t('cab.applications.technicalFeasibility.summary.requestedBy')}
                          </p>
                          <p className="text-body-sm font-bold leading-tight text-text-primary">{data.requestedBy.name}</p>
                          <p className="text-overline font-medium text-neutral-500">{enumLabel(t, data.requestedBy.role)}</p>
                        </div>
                      </div>
                    </div>
                  </section>
                </DashboardTourStep>

                <DashboardTourStep steps={tourSteps} stepId="tabs">
                  <div className="flex flex-wrap items-center gap-1 border-b border-neutral-100">
                    {TABS.map((tab) => {
                      const active = activeTab === tab
                      const badge = tab === 'documents' ? data.documentCount : undefined
                      return (
                        <button
                          key={tab}
                          type="button"
                          aria-selected={active}
                          onClick={() => setActiveTab(tab)}
                          className={cn(
                            'flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-body-sm font-semibold transition-colors',
                            active ? 'border-primary text-primary' : 'border-transparent text-text-primary hover:text-text-primary'
                          )}
                        >
                          {t(TAB_LABEL_KEYS[tab])}
                          {badge !== undefined && <span>({badge})</span>}
                          {tab === 'history' && <AppIcon icon={HistoryIcon} size={13} />}
                        </button>
                      )
                    })}
                  </div>
                </DashboardTourStep>

                {activeTab === 'technicalFeasibility' && (
                  <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="flex min-w-0 flex-col gap-4">
                      <DashboardTourStep steps={tourSteps} stepId="assessment-table">
                        <AssessmentTable data={data} t={t} />
                      </DashboardTourStep>
                      <DashboardTourStep steps={tourSteps} stepId="comments-section">
                        <CommentsSection data={data} t={t} onAdd={() => (editable ? openQuick('comment') : undefined)} />
                      </DashboardTourStep>
                      <DashboardTourStep steps={tourSteps} stepId="review-summary">
                        <ReviewSummaryCard data={data} t={t} />
                      </DashboardTourStep>
                    </div>
                    <DashboardTourStep steps={tourSteps} stepId="audit-team">
                      <div className="flex min-w-0 flex-col gap-4">
                        <AuditTeamCard data={data} t={t} onEdit={editable ? () => setTeamOpen(true) : undefined} />
                        <ResourcesCard data={data} t={t} />
                        <RecommendationCard t={t} onProceed={proceedToQuotation} />
                        <KeyInformationCard data={data} t={t} />
                      </div>
                    </DashboardTourStep>
                  </div>
                )}

                {activeTab !== 'technicalFeasibility' && (
                  <TabRedirect
                    message={t('cab.applications.technicalFeasibility.tabPlaceholder')}
                    label={
                      activeTab === 'informationRequired'
                        ? t('cab.sidebar.informationRequired')
                        : t('cab.applications.technicalFeasibility.openReview', 'Open application review')
                    }
                    onOpen={() =>
                      navigate(
                        activeTab === 'informationRequired'
                          ? cabApplicationInformationRequiredPath(applicationId, clientId)
                          : applicationId
                            ? cabApplicationReviewPath(applicationId, clientId)
                            : ROUTES.cabApplicationRegister,
                      )
                    }
                  />
                )}
              </div>

              <DashboardTourStep steps={tourSteps} stepId="workflow-progress">
                <div className="flex min-w-0 flex-col gap-4">
                  <WorkflowProgressSidebar data={data} t={t} />
                  {editable && (
                    <QuickActionsCard
                      t={t}
                      onAction={openQuick}
                      onRequestInformation={() => navigate(cabApplicationInformationRequiredPath(applicationId, clientId))}
                    />
                  )}
                </div>
              </DashboardTourStep>
            </div>
          </div>

          <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-5 py-4">
            <p className="text-caption text-text-primary">{t('cab.applications.technicalFeasibility.footer.copyright')}</p>
            <div className="flex items-center gap-4 text-caption">
              <Link to={ROUTES.privacyPolicy} className="font-semibold text-primary hover:underline">
                {t('cab.applications.technicalFeasibility.footer.privacyPolicy')}
              </Link>
              <span className="text-text-primary">{t('cab.applications.technicalFeasibility.footer.termsOfUse')}</span>
            </div>
          </footer>
        </div>
      </div>
      {applicationId && (
        <TechnicalFeasibilityTeamDialog
          open={teamOpen}
          applicationId={applicationId}
          data={data}
          onClose={() => setTeamOpen(false)}
          onSaved={(saved) => {
            setData(saved)
            toast.success(t('cab.applications.technicalFeasibility.team.saved', 'Audit team saved.'))
          }}
        />
      )}
      <WorkflowDialog
        open={quick !== null}
        title={quick ? quickTitles[quick] : ''}
        confirmLabel={t('common.save', 'Save')}
        confirmDisabled={!quickValid}
        busy={quickBusy}
        error={quickError}
        onConfirm={() => void runQuick()}
        onClose={() => setQuick(null)}
      >
        {quick === 'dueDate' && (
          <DialogDateField label={t('cab.applications.technicalFeasibility.quick.newDueDate', 'New due date')} required value={quickDate} onChange={setQuickDate} />
        )}
        <DialogTextArea
          id="tf-quick-text"
          label={
            quick === 'comment'
              ? t('cab.applications.technicalFeasibility.quick.comment', 'Comment')
              : quick === 'escalate'
                ? t('cab.applications.technicalFeasibility.quick.escalationReason', 'Reason for escalation')
                : t('cab.applications.technicalFeasibility.quick.reason', 'Reason (optional)')
          }
          required={quick !== 'dueDate'}
          value={quickText}
          onChange={setQuickText}
        />
      </WorkflowDialog>
    </CabLayout>
  )
}
