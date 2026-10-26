import { useCallback, useEffect, useMemo, useState } from 'react'
import { useValuesChanged } from '@/hooks/useValuesChanged'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { HeaderActions } from '@/components/dashboard/cab/CabHeader'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { ApplicationSummaryCard } from '@/components/dashboard/cab/ApplicationSummaryCard'
import { isQuotationReviewComplete } from '@/lib/api/cabApplicationQuotationApi'
import { ApplicationPicker } from '@/components/dashboard/cab/ApplicationPicker'
import { WorkflowProgressCard } from '@/components/dashboard/cab/WorkflowProgressCard'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/TextField'
import { FormLabel } from '@/components/ui/FormField'
import {
  AppIcon,
  CommentIcon,
  CorrectiveActionIcon,
  DownloadIcon,
  ExportIcon,
  EyeIcon,
  FileTextIcon,
  HistoryIcon,
} from '@/components/icons'
import { markTourPending } from '@/context/tour/tourStorage'
import { useApplicationReviewTourSteps } from '@/config/applicationReviewTourSteps'
import { displaySpecAnswer } from '@/components/dashboard/entityData/applicationSampleFill'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { toast } from '@/lib/toast'
import type { ApplicationDocument, ApplicationResponse } from '@/lib/api/certificationApplicationApi'
import {
  REVIEW_SECTIONS,
  SECTION_STATUSES,
  applyAllSectionReviews,
  createSectionComment,
  decodeSectionComment,
  getCabApplication,
  listApplicationComments,
  listSectionReviews,
  persistSectionReviewStatus,
  startCabApplicationReview,
  updateCabApplicationStatus,
  type ApplicationComment,
  type ReviewSectionKey,
  type SectionStatus,
} from '@/lib/api/cabApplicationReviewApi'
import { createCabInformationRequired } from '@/lib/api/cabApplicationInformationRequiredApi'
import {
  dueDateOnlyOneWeekFromRequestedOn,
  syncReviewSectionWithInformationRequired,
  syncReviewSectionsWithInformationRequired,
} from '@/lib/api/irReviewSectionSync'
import { APPLICATION_STATUS_LABEL_KEYS, APPLICATION_STATUS_STYLES } from '@/lib/applicationStatus'
import { getAuthSession, getAuthToken } from '@/lib/authStorage'
import {
  ROUTES,
  cabApplicationInformationRequiredPath,
  cabApplicationQuotationPath,
  cabApplicationReviewPath,
  cabApplicationTechnicalFeasibilityPath,
} from '@/lib/routes'
import { buildCabWorkflowSteps } from '@/lib/workflowSteps'
import { downloadFieldsDocument } from '@/lib/tableTools'
import { useFitScale } from '@/lib/useFitScale'
import { cn } from '@/lib/utils'
import { notSet } from '@/lib/emptyValue'

const cardClassName = 'rounded-lg border border-neutral-100 bg-white'
const MAX_COMMENT = 4900

type TabKey =
  | 'applicationDetails'
  | 'reviewChecklist'
  | 'documents'
  | 'reviewComments'
  | 'internalComments'
  | 'history'

const TABS: TabKey[] = [
  'applicationDetails',
  'reviewChecklist',
  'documents',
  'reviewComments',
  'internalComments',
  'history',
]

const TAB_LABEL_KEYS: Record<TabKey, string> = {
  applicationDetails: 'cab.applications.review.tabs.applicationDetails',
  reviewChecklist: 'cab.applications.review.tabs.reviewChecklist',
  documents: 'cab.applications.review.tabs.documents',
  reviewComments: 'cab.applications.review.tabs.reviewComments',
  internalComments: 'cab.applications.review.tabs.internalComments',
  history: 'cab.applications.review.tabs.history',
}

const STATUS_COLORS: Record<SectionStatus, string> = {
  complete: '#22c55e',
  partiallyComplete: '#D4A017',
  incomplete: '#e74c3c',
  notApplicable: '#9ca3af',
}

function StatusPill({ status }: { status: SectionStatus | null }) {
  const { t } = useTranslation()
  if (!status) {
    return <span className="text-caption text-neutral-500">{t('cab.applications.review.flow.notReviewed')}</span>
  }
  const color = STATUS_COLORS[status]
  return (
    <span className="inline-flex items-center gap-1.5 text-caption font-semibold" style={{ color }}>
      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      {t(`cab.applications.review.checklist.status.${status}`)}
    </span>
  )
}

function latestCommentText(list: ApplicationComment[] = []): string {
  for (let i = list.length - 1; i >= 0; i--) {
    const text = decodeSectionComment(list[i].content).text.trim()
    if (text) return text
  }
  return ''
}

function humanize(key: string) {
  const spaced = key.replace(/([A-Z])/g, ' $1')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}


const HIDDEN_REVIEW_KEYS = new Set([
  'id',
  'applicationId',
  'organizationId',
  'sourceBranchId',
  'createdAt',
  'updatedAt',
  'questionKey',
  'questionType',
  'fileUrl',
  'mimeType',
])

function fieldLabel(key: string, t: (key: string, options?: { defaultValue?: string }) => string) {
  return t(`cab.applications.review.flow.fields.${key}`, { defaultValue: humanize(key) })
}

function exportValueText(value: unknown, t: (key: string) => string): string {
  if (value === null || value === undefined || value === '') return notSet()
  if (typeof value === 'boolean') return t(value ? 'common.yes' : 'common.no')
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    if (value.length === 0) return notSet()
    return value.map((item) => exportValueText(item, t)).join('\n')
  }
  if (isRecord(value)) {
    const rows = Object.entries(value).filter(
      ([key, item]) => !HIDDEN_REVIEW_KEYS.has(key) && item !== undefined && item !== null && item !== '',
    )
    if (rows.length === 0) return notSet()
    return rows.map(([key, item]) => `${fieldLabel(key, t)}: ${exportValueText(item, t)}`).join('\n')
  }
  return String(value)
}

function applicationExportFields(
  application: ApplicationResponse,
  extras: { statusLabel: string; certificationBody: string; primaryStandard: string },
  t: (key: string, options?: { defaultValue?: string }) => string,
) {
  const fields: { label: string; value: string }[] = [
    { label: t('cab.applications.review.summary.client'), value: application.legalInfo?.organizationName || notSet() },
    { label: t('accreditation.orderNumber', { defaultValue: 'Order number' }), value: application.orderNumber || application.id },
    { label: t('cab.applications.review.summary.applicationType'), value: application.legalInfo?.requestType || notSet() },
    { label: t('cab.applications.review.summary.certificationBody'), value: extras.certificationBody },
    { label: t('cab.applications.review.summary.primaryStandard'), value: extras.primaryStandard },
    { label: t('cab.applications.review.summary.receivedOn'), value: application.submittedAt || application.createdAt || notSet() },
    { label: t('cab.applicationRegister.columns.status', { defaultValue: 'Status' }), value: extras.statusLabel },
  ]
  REVIEW_SECTIONS.forEach((section) => {
    fields.push({
      label: t(`cab.applications.review.flow.sections.${section}`),
      value: exportValueText(application[section], t),
    })
  })
  return fields
}

function formatScalar(value: unknown, t: (key: string) => string) {
  if (value === null || value === undefined || value === '') return notSet()
  if (typeof value === 'boolean') return t(value ? 'common.yes' : 'common.no')
  return String(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function IafCodeList({ codes }: { codes: unknown }) {
  const { t } = useTranslation()
  if (!Array.isArray(codes) || codes.length === 0) return <span>{notSet()}</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {codes.map((item, index) => {
        const code = isRecord(item) ? String(item.code ?? notSet()) : String(item)
        const critical = isRecord(item) ? Boolean(item.critical) : false
        return (
          <span
            key={`${code}-${index}`}
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-caption font-semibold',
              critical ? 'bg-error-50 text-error-500' : 'bg-primary-50 text-primary',
            )}
          >
            {code}
            <span className="ms-1 font-medium opacity-80">
              · {t(critical ? 'cab.applications.review.flow.criticalYes' : 'cab.applications.review.flow.criticalNo')}
            </span>
          </span>
        )
      })}
    </div>
  )
}

function SectorCards({ sectors }: { sectors: unknown }) {
  const { t } = useTranslation()
  if (!Array.isArray(sectors) || sectors.length === 0) return <p className="text-body-sm text-neutral-600">{notSet()}</p>
  return (
    <div className="flex flex-col gap-2">
      {sectors.map((sector, index) => {
        const record: Record<string, unknown> = isRecord(sector) ? sector : { sectorName: sector }
        return (
          <div key={index} className="rounded-md border border-neutral-50 bg-neutral-25 px-3 py-2.5">
            <p className="text-body-sm font-semibold capitalize text-text-primary">
              {formatScalar(record.sectorName, t)}
            </p>
            <div className="mt-1.5">
              <IafCodeList codes={record.iafCodes} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AnswerList({ answers }: { answers: unknown }) {
  const { t } = useTranslation()
  if (!Array.isArray(answers) || answers.length === 0) return <p className="text-body-sm text-neutral-600">{notSet()}</p>
  return (
    <div className="overflow-hidden rounded-md border border-neutral-100">
      <table className="w-full border-collapse text-start">
        <thead>
          <tr className="bg-primary-25 text-caption font-bold text-text-primary">
            <th className="px-3 py-2">{t('cab.applications.review.flow.fields.question')}</th>
            <th className="px-3 py-2">{t('cab.applications.review.flow.fields.answer')}</th>
          </tr>
        </thead>
        <tbody>
          {answers.map((item, index) => {
            const record: Record<string, unknown> = isRecord(item) ? item : { answer: item }
            const answer = displaySpecAnswer(
              typeof record.questionKey === 'string' ? record.questionKey : undefined,
              record.answer,
            )
            return (
              <tr key={index} className="border-t border-neutral-100 align-top text-body-sm">
                <td className="px-3 py-2 text-text-primary">{formatScalar(record.questionLabel ?? record.questionKey, t)}</td>
                <td className="px-3 py-2 font-semibold text-text-primary">{formatScalar(answer, t)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function CurrentSystemList({ systems }: { systems: unknown }) {
  const { t } = useTranslation()
  if (!Array.isArray(systems) || systems.length === 0) return <span>{notSet()}</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {systems.map((item, index) => {
        const record: Record<string, unknown> = isRecord(item) ? item : { name: item }
        const label = [record.name, record.code].filter(Boolean).join(' · ') || notSet()
        return (
          <span key={index} className="inline-flex rounded-full bg-primary-50 px-2.5 py-1 text-caption font-semibold text-primary">
            {label}
            {record.certifiedSince ? (
              <span className="ms-1 font-medium text-primary/70">
                · {t('cab.applications.review.flow.fields.certifiedSince')} {String(record.certifiedSince)}
              </span>
            ) : null}
          </span>
        )
      })}
    </div>
  )
}

function ReviewValue({ value, fieldKey }: { value: unknown; fieldKey?: string }) {
  const { t } = useTranslation()
  if (fieldKey === 'sectors') return <SectorCards sectors={value} />
  if (fieldKey === 'answers') return <AnswerList answers={value} />
  if (fieldKey === 'currentSystems') return <CurrentSystemList systems={value} />
  if (fieldKey === 'iafCodes') return <IafCodeList codes={value} />
  if (fieldKey === 'documents' || (Array.isArray(value) && asDocuments(value).length > 0 && asDocuments(value).length === value.length)) {
    return <DocumentFileList documents={asDocuments(value)} />
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span>{notSet()}</span>
    if (value.every((item) => item == null || typeof item !== 'object')) {
      return <span>{value.map((item) => formatScalar(item, t)).join(', ')}</span>
    }
    return (
      <div className="flex flex-col gap-3">
        {value.map((item, index) => (
          <div key={index} className="rounded-lg border border-neutral-100 bg-white p-4">
            {isRecord(item) ? <Entries data={item} /> : <p className="text-body-sm">{formatScalar(item, t)}</p>}
          </div>
        ))}
      </div>
    )
  }
  if (isRecord(value)) return <Entries data={value} />
  return <span>{formatScalar(value, t)}</span>
}

function Entries({ data }: { data: Record<string, unknown> }) {
  const { t } = useTranslation()
  const rows = Object.entries(data).filter(
    ([key, value]) => !HIDDEN_REVIEW_KEYS.has(key) && value !== undefined && value !== null && value !== '',
  )
  if (rows.length === 0) {
    return <p className="text-body-sm text-neutral-600">{t('cab.applications.review.flow.noSectionData')}</p>
  }
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
      {rows.map(([key, value]) => {
        const wide = key === 'sectors' || key === 'answers' || key === 'currentSystems' || Array.isArray(value) || isRecord(value)
        return (
          <div key={key} className={cn('min-w-0', wide && 'sm:col-span-2')}>
            <dt className="text-caption font-bold text-text-primary">{fieldLabel(key, t)}</dt>
            <dd className="mt-1.5 break-words text-body-sm text-text-primary">
              <ReviewValue value={value} fieldKey={key} />
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

function formatFileSize(bytes?: number | null) {
  if (!bytes || bytes <= 0) return notSet()
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDocumentType(type?: string | null) {
  if (!type) return notSet()
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function documentName(doc: ApplicationDocument) {
  return doc.originalName || doc.fileName || formatDocumentType(doc.documentType)
}

function resolveFileUrl(url?: string | null) {
  if (!url) return ''
  if (/^(https?:|blob:|data:)/i.test(url)) return url
  if (url.startsWith('/')) return `${window.location.origin}${url}`
  return url
}

function isPreviewable(doc: ApplicationDocument) {
  const mime = doc.mimeType ?? ''
  const url = doc.fileUrl ?? ''
  return mime.includes('pdf') || mime.startsWith('image/') || /\.(pdf|png|jpe?g|gif|webp)$/i.test(url)
}

function asDocuments(value: unknown): ApplicationDocument[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is ApplicationDocument => isRecord(item) && Boolean(item.fileUrl || item.fileName || item.originalName))
}

function openDocument(doc: ApplicationDocument) {
  const url = resolveFileUrl(doc.fileUrl)
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
}

async function fetchDocumentBlob(url: string): Promise<Blob> {
  const headers = new Headers()
  const token = getAuthToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(url, { headers })
  if (!response.ok) throw new Error(String(response.status))
  return response.blob()
}

function DocumentFileList({ documents }: { documents: ApplicationDocument[] }) {
  const { t, i18n } = useTranslation()
  const [preview, setPreview] = useState<ApplicationDocument | null>(null)
  const [blobUrl, setBlobUrl] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)

  // Reset/prime the preview in the render where the selected document changes;
  // the effect below only sets state once the download settles.
  const previewChanged = useValuesChanged([preview])
  if (previewChanged) {
    if (preview?.fileUrl) setPreviewLoading(true)
    else setBlobUrl('')
  }

  useEffect(() => {
    if (!preview?.fileUrl) return
    let objectUrl = ''
    let cancelled = false
    fetchDocumentBlob(resolveFileUrl(preview.fileUrl))
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setBlobUrl(objectUrl)
      })
      .catch(() => {
        if (!cancelled) {
          setPreview(null)
          openDocument(preview)
        }
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false)
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [preview])

  if (documents.length === 0) {
    return <p className="text-body-sm text-neutral-600">{t('cab.applications.review.flow.noSectionData')}</p>
  }

  const previewUrl = blobUrl
  const previewImage = Boolean(
    preview?.mimeType?.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(preview?.fileUrl ?? ''),
  )

  const downloadDocument = async (doc: ApplicationDocument) => {
    const url = resolveFileUrl(doc.fileUrl)
    if (!url) return
    try {
      const blob = await fetchDocumentBlob(url)
      const href = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = href
      link.download = documentName(doc)
      link.click()
      URL.revokeObjectURL(href)
    } catch {
      openDocument(doc)
    }
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {documents.map((doc, index) => {
          const url = resolveFileUrl(doc.fileUrl)
          return (
            <li
              key={`${url || doc.fileName || index}`}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-100 bg-neutral-25 px-4 py-3"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary">
                <AppIcon icon={FileTextIcon} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-sm font-semibold text-text-primary">{documentName(doc)}</p>
                <p className="text-caption text-neutral-600">
                  {formatDocumentType(doc.documentType)}
                  {' · '}
                  {formatFileSize(doc.fileSize)}
                  {doc.uploadedAt ? ` · ${new Date(doc.uploadedAt).toLocaleString(i18n.language)}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!url}
                  onClick={() => (isPreviewable(doc) ? setPreview(doc) : openDocument(doc))}
                >
                  <AppIcon icon={EyeIcon} size={14} />
                  {t('common.view')}
                </Button>
                <Button variant="outline" size="sm" disabled={!url} onClick={() => void downloadDocument(doc)}>
                  <AppIcon icon={DownloadIcon} size={14} />
                  {t('common.download')}
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
      {preview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface-overlay/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={documentName(preview)}
          onClick={() => setPreview(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
              <p className="min-w-0 truncate text-body-sm font-semibold">{documentName(preview)}</p>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => openDocument(preview)}>
                  {t('common.view')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPreview(null)}>
                  {t('common.close')}
                </Button>
              </div>
            </div>
            <div className="flex min-h-[60vh] items-center justify-center bg-neutral-50">
              {previewLoading ? (
                <p className="text-body-sm text-neutral-600">{t('common.loading')}</p>
              ) : previewUrl && previewImage ? (
                <img src={previewUrl} alt={documentName(preview)} className="mx-auto max-h-[75vh] max-w-full object-contain" />
              ) : previewUrl ? (
                <iframe title={documentName(preview)} src={previewUrl} className="h-[75vh] w-full border-0 bg-white" />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function ReviewDonut({ percent }: { percent: number }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference
  return (
    <div className="relative flex size-20 shrink-0 items-center justify-center">
      <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#ececec" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="#16a34a"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-body font-bold text-success-600">{percent}%</span>
    </div>
  )
}

function hasVisibleReviewFields(value: unknown): boolean {
  if (value == null || value === '') return false
  if (!isRecord(value)) return true
  return Object.entries(value).some(
    ([key, item]) => !HIDDEN_REVIEW_KEYS.has(key) && item !== undefined && item !== null && item !== '',
  )
}

function SectionData({ value, section }: { value: unknown; section?: ReviewSectionKey }) {
  const { t } = useTranslation()
  if (section === 'documents' || (Array.isArray(value) && asDocuments(value).length > 0 && asDocuments(value).length === value.length)) {
    return <DocumentFileList documents={asDocuments(value)} />
  }
  if (Array.isArray(value) && value.length > 0) {
    const items = value.filter(hasVisibleReviewFields)
    if (items.length === 0) {
      return <p className="text-body-sm text-neutral-600">{t('cab.applications.review.flow.noSectionData')}</p>
    }
    return (
      <div className="flex flex-col gap-4">
        {items.map((item, index) => (
          <div key={index} className="rounded-lg border border-neutral-100 p-4">
            <Entries data={typeof item === 'object' && item ? (item as Record<string, unknown>) : { value: item }} />
          </div>
        ))}
      </div>
    )
  }
  if (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0) {
    return <Entries data={value as Record<string, unknown>} />
  }
  return <p className="text-body-sm text-neutral-600">{t('cab.applications.review.flow.noSectionData')}</p>
}

function ReviewFlow({ applicationId }: { applicationId: string }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const clientId = searchParams.get('clientId') ?? undefined
  const scale = useFitScale()
  const tourSteps = useApplicationReviewTourSteps()
  const [application, setApplication] = useState<ApplicationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [comments, setComments] = useState<ApplicationComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentsError, setCommentsError] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('applicationDetails')
  const [sectionIndex, setSectionIndex] = useState(0)
  const [status, setStatus] = useState<SectionStatus | ''>('')
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deciding, setDeciding] = useState<'approve' | 'reject' | null>(null)
  const [reviewDecision, setReviewDecision] = useState('technicalFeasibility')
  const [sectionStatuses, setSectionStatuses] = useState<Partial<Record<ReviewSectionKey, SectionStatus>>>({})

  // State is only set from the promise callbacks, so this is safe to start from an effect.
  const loadComments = useCallback(
    (): Promise<ApplicationComment[]> =>
      listApplicationComments(applicationId)
        .then((list) => {
          setComments(list)
          setCommentsError(false)
          return list
        })
        .catch(() => {
          setCommentsError(true)
          return [] as ApplicationComment[]
        })
        .finally(() => setCommentsLoading(false)),
    [applicationId],
  )

  useEffect(() => {
    let cancelled = false
    getCabApplication(applicationId)
      .then((data) => !cancelled && setApplication(data))
      .catch((e) => !cancelled && setLoadError(getUserErrorMessage(e, t, { fallbackKey: 'cab.applications.review.flow.loadError' })))
      .finally(() => !cancelled && setLoading(false))
    loadComments()
    listSectionReviews(applicationId).then((reviews) => {
      if (cancelled) return
      setSectionStatuses(reviews)
      syncReviewSectionsWithInformationRequired(applicationId, reviews)
    })
    return () => {
      cancelled = true
    }
  }, [applicationId, loadComments, t])

  const bySection = useMemo(() => {
    const map = new Map<ReviewSectionKey, ApplicationComment[]>()
    comments.forEach((c) => c.sectionKey && map.set(c.sectionKey, [...(map.get(c.sectionKey) ?? []), c]))
    return map
  }, [comments])

  const applySectionDraft = useCallback(
    (index: number, list: ApplicationComment[], statuses: Partial<Record<ReviewSectionKey, SectionStatus>>) => {
      const key = REVIEW_SECTIONS[index]
      setStatus(statuses[key] ?? '')
      setText(latestCommentText(list.filter((comment) => comment.sectionKey === key)))
    },
    [],
  )

  // Load the current section's saved status/text into the draft fields in the
  // render where the comments, statuses or section change (once comments loaded).
  const draftSourceChanged = useValuesChanged([applySectionDraft, comments, commentsLoading, sectionIndex, sectionStatuses])
  if (draftSourceChanged && !commentsLoading) {
    applySectionDraft(sectionIndex, comments, sectionStatuses)
  }

  const workflowSteps = useMemo(() => buildCabWorkflowSteps(t, 'applicationReview'), [t])

  if (loading) return <p className="p-6 text-body-sm text-neutral-600">{t('common.loading')}</p>
  if (loadError || !application) {
    return (
      <p role="alert" className="p-6 text-body-sm text-error-700">
        {loadError ?? t('cab.applications.review.flow.loadError')}
      </p>
    )
  }

  const section = REVIEW_SECTIONS[sectionIndex]
  const isLast = sectionIndex === REVIEW_SECTIONS.length - 1
  const statusError = submitted && !status
  const textError = submitted && !text.trim()
  const applicationNumber = application.orderNumber ?? application.id
  const clientName = application.legalInfo?.organizationName || notSet()
  const applicationType = application.legalInfo?.requestType || notSet()
  const namedBody = application.certificates
    ?.flatMap((certificate) => certificate.answers ?? [])
    .find((answer) => answer.questionKey?.endsWith('.certifyingBody'))
    ?.answer
  const certificationBody =
    getAuthSession()?.organization?.name?.trim() ||
    (typeof namedBody === 'string' && namedBody.trim().toLowerCase() !== 'sample response'
      ? namedBody.trim()
      : '') ||
    'CASCO'
  const primaryStandard =
    application.certificates?.[0]?.certificateName || application.certificates?.[0]?.certificateCode || notSet()
  // The API has no Quotation status; derive the displayed stage from saved reviews.
  const quotationReady = isQuotationReviewComplete(application.status, sectionStatuses)
  const statusLabel = quotationReady
    ? t('cab.quotationEditor.status')
    : t(`cab.applicationRegister.status.${APPLICATION_STATUS_LABEL_KEYS[application.status]}`)
  const statusClassName = quotationReady
    ? APPLICATION_STATUS_STYLES.UNDER_REVIEW
    : APPLICATION_STATUS_STYLES[application.status]
  const receivedOn = application.submittedAt || application.createdAt
  const documents = application.documents ?? []
  const publicComments = comments.filter((comment) => !comment.isInternal)
  const internalComments = comments.filter((comment) => comment.isInternal)

  const selectSection = (index: number) => {
    setSectionIndex(index)
    applySectionDraft(index, comments, sectionStatuses)
    setSubmitted(false)
  }

  const save = async () => {
    setSubmitted(true)
    if (!status || !text.trim()) return
    setSaving(true)
    try {
      if (application.status === 'SUBMITTED') {
        const started = await startCabApplicationReview(applicationId)
        setApplication({ ...application, status: started.status })
      } else if (application.status === 'REJECTED' || application.status === 'APPROVED') {
        const reopened = await updateCabApplicationStatus(
          applicationId,
          'UNDER_REVIEW',
          'Review resumed after section status change.',
        )
        setApplication({ ...application, status: reopened.status })
      }
      await persistSectionReviewStatus(applicationId, section, status)
      const nextStatuses = { ...sectionStatuses, [section]: status }
      setSectionStatuses(nextStatuses)
      await createSectionComment(applicationId, section, text)
      syncReviewSectionWithInformationRequired(applicationId, section, status === 'partiallyComplete')
      if (status === 'partiallyComplete') {
        try {
          await createCabInformationRequired(applicationId, {
            informationItem: text.trim(),
            referenceClause: section,
            dueDate: dueDateOnlyOneWeekFromRequestedOn(new Date().toISOString()),
            priority: 'MEDIUM',
          })
        } catch {
          // Review status is already saved; the IR page also reads partial sections.
        }
      }
      const list = await loadComments()
      if (isLast) {
        setActiveTab('reviewChecklist')
        applySectionDraft(sectionIndex, list, nextStatuses)
      } else {
        setSectionIndex(sectionIndex + 1)
        applySectionDraft(sectionIndex + 1, list, nextStatuses)
      }
      setSubmitted(false)
    } catch (e) {
      toast.error(getUserErrorMessage(e, t, { fallbackKey: 'cab.applications.review.flow.saveError' }))
    } finally {
      setSaving(false)
    }
  }

  const applyDecisionToAllSections = async (nextStatus: SectionStatus, comment: string) => {
    if (application.status === 'SUBMITTED') {
      const started = await startCabApplicationReview(applicationId)
      setApplication({ ...application, status: started.status })
    } else if (application.status === 'REJECTED' || application.status === 'APPROVED') {
      const reopened = await updateCabApplicationStatus(
        applicationId,
        'UNDER_REVIEW',
        'Review resumed after section status change.',
      )
      setApplication({ ...application, status: reopened.status })
    }
    await applyAllSectionReviews(applicationId, nextStatus, comment)
    const nextStatuses = Object.fromEntries(REVIEW_SECTIONS.map((key) => [key, nextStatus])) as Partial<
      Record<ReviewSectionKey, SectionStatus>
    >
    setSectionStatuses(nextStatuses)
    syncReviewSectionsWithInformationRequired(applicationId, nextStatuses)
    const list = await loadComments()
    applySectionDraft(sectionIndex, list, nextStatuses)
    setStatus(nextStatus)
    setText(latestCommentText(list.filter((commentItem) => commentItem.sectionKey === REVIEW_SECTIONS[sectionIndex])))
  }

  const approveCompleteness = async () => {
    setDeciding('approve')
    try {
      await applyDecisionToAllSections('complete', 'Done')
      navigate(cabApplicationTechnicalFeasibilityPath(applicationId, clientId))
    } catch (e) {
      toast.error(getUserErrorMessage(e, t, { fallbackKey: 'cab.applications.review.flow.saveError' }))
    } finally {
      setDeciding(null)
    }
  }

  const rejectApplication = async () => {
    setDeciding('reject')
    try {
      await applyDecisionToAllSections('incomplete', t('cab.applications.review.reviewActions.rejectComment'))
      const rejected = await updateCabApplicationStatus(applicationId, 'REJECTED', 'Application rejected after review.')
      setApplication({ ...application, status: rejected.status })
    } catch (e) {
      toast.error(getUserErrorMessage(e, t, { fallbackKey: 'cab.applications.review.flow.saveError' }))
    } finally {
      setDeciding(null)
    }
  }

  return (
    <>
      <DashboardTourStep steps={tourSteps} stepId="header">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-neutral-100 bg-white px-3 py-3 sm:gap-4 sm:px-5">
          <Breadcrumbs
              items={[
                { label: t('cab.applications.review.breadcrumb.home'), to: ROUTES.workspace },
                { label: t('cab.applications.review.breadcrumb.applications'), to: ROUTES.cabApplicationRegister },
                { label: String(applicationNumber ?? ''), to: `${ROUTES.cabApplicationRegister}?q=${encodeURIComponent(String(applicationNumber ?? ''))}` },
                { label: t('cab.applications.review.breadcrumb.current') },
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
                          {t('cab.applications.review.title')}
                        </h1>
                        <span className={cn('rounded-full px-2.5 py-0.5 text-caption font-semibold', statusClassName)}>
                          {statusLabel}
                        </span>
                      </div>
                      <p className="mt-1.5 text-body-sm text-text-primary">{t('cab.applications.review.subtitle')}</p>
                    </div>
                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-1.5 rounded-md border-neutral-100 px-3 text-caption font-medium text-text-primary"
                        onClick={() =>
                          downloadFieldsDocument(
                            `${applicationNumber}-application.html`,
                            `${t('cab.applications.review.title')} ${applicationNumber}`,
                            applicationExportFields(
                              application,
                              {
                                statusLabel,
                                certificationBody,
                                primaryStandard,
                              },
                              t,
                            ),
                          )
                        }
                      >
                        <AppIcon icon={DownloadIcon} size={16} />
                        {t('cab.applications.review.actions.downloadApplication')}
                      </Button>
                      <Button
                        className="h-9 gap-1.5 rounded-md px-3 text-caption font-semibold"
                        onClick={() => navigate(cabApplicationTechnicalFeasibilityPath(applicationId, clientId))}
                      >
                        <AppIcon icon={ExportIcon} size={14} />
                        {t('cab.applications.review.actions.sendForTechnicalFeasibility')}
                      </Button>
                    </div>
                  </div>
                </DashboardTourStep>

                <DashboardTourStep steps={tourSteps} stepId="summary-card">
                  <ApplicationSummaryCard
                    applicationNumber={applicationNumber}
                    clientName={clientName}
                    applicationType={applicationType}
                    certificationBody={certificationBody}
                    primaryStandard={primaryStandard}
                    receivedOn={receivedOn}
                    statusLabel={statusLabel}
                    statusClassName={statusClassName}
                  />
                </DashboardTourStep>

                <DashboardTourStep steps={tourSteps} stepId="tabs">
                  <div className="flex flex-wrap items-center gap-1 border-b border-neutral-100">
                    {TABS.map((tab) => {
                      const active = activeTab === tab
                      const badge = tab === 'documents' ? documents.length : undefined
                      return (
                        <button
                          key={tab}
                          type="button"
                          aria-selected={active}
                          onClick={() => setActiveTab(tab)}
                          className={cn(
                            'flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-body-sm font-semibold transition-colors',
                            active ? 'border-primary text-primary' : 'border-transparent text-text-primary hover:text-text-primary',
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

                {activeTab === 'applicationDetails' && (
                  <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
                    <nav className={cn(cardClassName, 'flex flex-col p-2')} aria-label={t('cab.applications.review.tabs.applicationDetails')}>
                      {REVIEW_SECTIONS.map((key, index) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => selectSection(index)}
                          aria-current={index === sectionIndex ? 'step' : undefined}
                          className={cn(
                            'flex flex-col items-start gap-1 rounded-md px-3 py-2.5 text-start',
                            index === sectionIndex && 'bg-primary-50',
                          )}
                        >
                          <span className="text-body-sm font-semibold text-text-primary">
                            {index + 1}. {t(`cab.applications.review.flow.sections.${key}`)}
                          </span>
                          <StatusPill status={sectionStatuses[key] ?? null} />
                        </button>
                      ))}
                    </nav>

                    <section className={cn(cardClassName, 'min-w-0 p-4 sm:p-6')}>
                      <h2 className="mb-4 text-body font-bold text-text-primary">
                        {t(`cab.applications.review.flow.sections.${section}`)}
                      </h2>
                      <SectionData value={application[section]} section={section} />
                      <div className="mt-6 grid gap-4 border-t border-neutral-100 pt-5">
                        <div>
                          <SelectField
                            id="section-status"
                            label={t('cab.applications.review.flow.statusLabel')}
                            required
                            value={status}
                            onChange={(v) => setStatus(v as SectionStatus)}
                            placeholder={t('cab.applications.review.flow.statusPlaceholder')}
                            options={SECTION_STATUSES.map((s) => ({
                              value: s,
                              label: t(`cab.applications.review.checklist.status.${s}`),
                            }))}
                          />
                          {statusError && (
                            <p className="mt-1 text-small-light text-error-700">{t('cab.applications.review.flow.statusRequired')}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <FormLabel htmlFor="section-comment" required>
                            {t('cab.applications.review.flow.commentLabel')}
                          </FormLabel>
                          <Textarea
                            id="section-comment"
                            rows={4}
                            maxLength={MAX_COMMENT}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={t('cab.applications.review.flow.commentPlaceholder')}
                          />
                          {textError && (
                            <p className="text-caption text-error-700">{t('cab.applications.review.flow.commentRequired')}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap justify-end gap-3">
                          <Button variant="outline" disabled={saving || sectionIndex === 0} onClick={() => selectSection(sectionIndex - 1)}>
                            {t('common.back')}
                          </Button>
                          <Button variant="primary" disabled={saving} onClick={() => void save()}>
                            {saving
                              ? t('common.saving')
                              : isLast
                                ? t('cab.applications.review.flow.saveFinish')
                                : t('cab.applications.review.flow.saveContinue')}
                          </Button>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === 'reviewChecklist' && (
                  <DashboardTourStep steps={tourSteps} stepId="checklist-table">
                    <div className="flex flex-col gap-4">
                    <section className={cn(cardClassName, 'min-w-0 overflow-hidden p-3 sm:p-5')}>
                      <div className="mb-4 flex items-center justify-between gap-2">
                        <h2 className="text-body font-bold text-text-primary">{t('cab.applications.review.checklist.title')}</h2>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={commentsLoading}
                          onClick={() => {
                            setCommentsLoading(true)
                            void loadComments()
                          }}
                        >
                          {t('cab.applications.review.flow.refresh')}
                        </Button>
                      </div>
                      {commentsError ? (
                        <p role="alert" className="text-body-sm text-error-700">
                          {t('cab.applications.review.flow.commentsError')}
                        </p>
                      ) : commentsLoading ? (
                        <p className="text-body-sm text-neutral-600">{t('common.loading')}</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[720px] table-fixed border-collapse text-start">
                            <colgroup>
                              <col className="w-[5%]" />
                              <col className="w-[20%]" />
                              <col className="w-[18%]" />
                              <col className="w-[57%]" />
                            </colgroup>
                            <thead>
                              <tr className="bg-primary text-caption font-bold text-white">
                                <th className="px-3 py-3.5 text-center">{t('cab.applications.review.checklist.columns.number')}</th>
                                <th className="px-4 py-3.5 text-start">{t('cab.applications.review.checklist.columns.area')}</th>
                                <th className="px-4 py-3.5 text-start">{t('cab.applications.review.checklist.columns.status')}</th>
                                <th className="px-4 py-3.5 text-start">{t('cab.applications.review.checklist.columns.comments')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {REVIEW_SECTIONS.map((key, index) => {
                                const list = bySection.get(key) ?? []
                                return (
                                  <tr key={key} className="border-b border-neutral-50 align-top text-caption text-text-primary">
                                    <td className="px-3 py-3 text-center font-semibold">{index + 1}</td>
                                    <td className="px-4 py-3 font-bold">{t(`cab.applications.review.flow.sections.${key}`)}</td>
                                    <td className="px-4 py-3">
                                      <StatusPill status={sectionStatuses[key] ?? null} />
                                    </td>
                                    <td className="px-4 py-3">
                                      {list.length === 0 ? (
                                        <span className="text-neutral-500">{notSet()}</span>
                                      ) : (
                                        <ul className="flex flex-col gap-2">
                                          {list.map((c) => (
                                            <li key={c.id} className="break-words">
                                              <p className="whitespace-pre-line">{decodeSectionComment(c.content).text}</p>
                                              <p className="text-overline text-neutral-600">
                                                {c.createdBy.fullName} · {new Date(c.createdAt).toLocaleString(i18n.language)}
                                              </p>
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>

                    {(() => {
                      const scoredStatuses = REVIEW_SECTIONS.map((key) => sectionStatuses[key] ?? null)
                      const scored = scoredStatuses.filter((item): item is SectionStatus => Boolean(item) && item !== 'notApplicable')
                      const completeCount = scored.filter((item) => item === 'complete').length
                      const partialCount = scored.filter((item) => item === 'partiallyComplete').length
                      const reviewPercent = scored.length
                        ? Math.round(((completeCount + partialCount * 0.5) / scored.length) * 100)
                        : 0
                      const summaryKey =
                        scored.length === 0
                          ? 'emptySummary'
                          : completeCount === scored.length
                            ? 'completeSummary'
                            : reviewPercent >= 50
                              ? 'partialSummary'
                              : 'incompleteSummary'
                      const latestComment = [...comments].sort(
                        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                      )[0]
                      const commentPreview = comments.slice(-3).reverse()
                      const validDocs = documents.filter((doc) => Boolean(doc.fileUrl))
                      const pendingDocs = documents.filter((doc) => !doc.fileUrl)

                      const applyDecision = (value: string) => {
                        setReviewDecision(value)
                        if (value === 'technicalFeasibility') {
                          navigate(cabApplicationTechnicalFeasibilityPath(applicationId, clientId))
                        } else if (value === 'informationRequired') {
                          navigate(cabApplicationInformationRequiredPath(applicationId, clientId))
                        } else if (value === 'quotation') {
                          navigate(cabApplicationQuotationPath(applicationId, clientId))
                        }
                      }

                      return (
                        <>
                          <div className="flex flex-wrap items-center gap-4 px-1 text-caption font-semibold text-text-primary">
                            {SECTION_STATUSES.map((item) => (
                              <span key={item} className="inline-flex items-center gap-1.5">
                                <span className="size-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[item] }} />
                                {t(`cab.applications.review.checklist.status.${item}`)}
                              </span>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                            <section className={cn(cardClassName, 'p-4 sm:p-5')}>
                              <h3 className="text-body-sm font-bold text-text-primary">{t('cab.applications.review.overallReview.title')}</h3>
                              <div className="mt-4 flex items-start gap-3">
                                <ReviewDonut percent={reviewPercent} />
                                <p className="text-caption leading-relaxed text-text-primary">
                                  {t(`cab.applications.review.overallReview.${summaryKey}`)}
                                </p>
                              </div>
                              <div className="mt-5">
                                <SelectField
                                  id="review-decision"
                                  label={t('cab.applications.review.overallReview.decisionLabel')}
                                  value={reviewDecision}
                                  onChange={applyDecision}
                                  options={[
                                    {
                                      value: 'technicalFeasibility',
                                      label: t('cab.applications.review.overallReview.decisions.technicalFeasibility'),
                                    },
                                    {
                                      value: 'informationRequired',
                                      label: t('cab.applications.review.overallReview.decisions.informationRequired'),
                                    },
                                    {
                                      value: 'quotation',
                                      label: t('cab.applications.review.overallReview.decisions.quotation'),
                                    },
                                    {
                                      value: 'hold',
                                      label: t('cab.applications.review.overallReview.decisions.hold'),
                                    },
                                  ]}
                                />
                              </div>
                            </section>

                            <section className={cn(cardClassName, 'p-4 sm:p-5')}>
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="text-body-sm font-bold text-text-primary">{t('cab.applications.review.reviewerComments.title')}</h3>
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('internalComments')}
                                  className="text-caption font-semibold text-primary hover:underline"
                                >
                                  {t('cab.applications.review.reviewerComments.addInternal')}
                                </button>
                              </div>
                              <div className="mt-4 rounded-md border border-warning-200 bg-warning-50 px-3 py-3">
                                <p className="text-caption font-bold text-text-primary">{t('cab.applications.review.reviewerComments.alertTitle')}</p>
                                {commentPreview.length === 0 ? (
                                  <p className="mt-2 text-caption text-text-primary">{t('cab.applications.review.reviewerComments.empty')}</p>
                                ) : (
                                  <ul className="mt-2 list-disc space-y-1 ps-4 text-caption text-text-primary">
                                    {commentPreview.map((comment) => (
                                      <li key={comment.id}>{decodeSectionComment(comment.content).text}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                              {latestComment && (
                                <div className="mt-4 flex items-start gap-2">
                                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-overline font-bold text-white">
                                    {latestComment.createdBy.fullName
                                      .split(' ')
                                      .map((part) => part[0])
                                      .join('')
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </span>
                                  <div>
                                    <p className="text-caption font-bold text-text-primary">{latestComment.createdBy.fullName}</p>
                                    <p className="text-overline text-neutral-600">
                                      {new Date(latestComment.createdAt).toLocaleString(i18n.language)}
                                    </p>
                                  </div>
                                </div>
                              )}
                              <p className="mt-3 text-caption text-text-primary">{t('cab.applications.review.reviewerComments.waitingNote')}</p>
                            </section>

                            <section className={cn(cardClassName, 'p-4 sm:p-5')}>
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="text-body-sm font-bold text-text-primary">{t('cab.applications.review.documentsOverview.title')}</h3>
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('documents')}
                                  className="text-caption font-semibold text-primary hover:underline"
                                >
                                  {t('cab.applications.review.documentsOverview.viewAll')}
                                </button>
                              </div>
                              <ul className="mt-4 flex flex-col gap-2.5">
                                {documents.length === 0 ? (
                                  <li className="text-caption text-neutral-600">{t('cab.applications.review.flow.noSectionData')}</li>
                                ) : (
                                  documents.slice(0, 6).map((doc, index) => (
                                    <li key={`${doc.fileUrl ?? doc.fileName ?? index}`} className="flex items-start justify-between gap-3 text-caption">
                                      <span className="min-w-0">
                                        <span className="block font-semibold text-text-primary">{documentName(doc)}</span>
                                        <span className="text-caption text-neutral-600">{formatFileSize(doc.fileSize)}</span>
                                      </span>
                                      {doc.fileUrl ? (
                                        <button
                                          type="button"
                                          onClick={() => openDocument(doc)}
                                          className="shrink-0 font-semibold text-primary hover:underline"
                                        >
                                          {t('common.view')}
                                        </button>
                                      ) : (
                                        <span className="shrink-0 font-semibold text-warning-700">
                                          {t('cab.applications.review.documentsOverview.pending')}
                                        </span>
                                      )}
                                    </li>
                                  ))
                                )}
                              </ul>
                              <p className="mt-4 text-caption font-semibold text-text-primary">
                                {t('cab.applications.review.documentsOverview.total')}: {documents.length}
                                {' · '}
                                {t('cab.applications.review.documentsOverview.valid')}: {validDocs.length}
                                {' · '}
                                {t('cab.applications.review.documentsOverview.expired')}: 0
                                {' · '}
                                {t('cab.applications.review.documentsOverview.pending')}: {pendingDocs.length}
                              </p>
                            </section>
                          </div>

                          <div className="flex items-start gap-3 rounded-lg border border-info-100 bg-primary-25 px-4 py-3">
                            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-primary text-caption font-bold text-primary">
                              !
                            </span>
                            <div>
                              <p className="text-caption font-bold text-text-primary">{t('cab.applications.review.notesTitle')}</p>
                              <p className="mt-1 text-caption leading-relaxed text-text-primary">
                                {t('cab.applications.review.notesBanner')}
                              </p>
                            </div>
                          </div>
                        </>
                      )
                    })()}
                    </div>
                  </DashboardTourStep>
                )}

                {activeTab === 'documents' && (
                  <section className={cn(cardClassName, 'min-w-0 overflow-hidden p-3 sm:p-5')}>
                    <h2 className="mb-4 text-body font-bold text-text-primary">{t('cab.applications.review.documentsSection.title')}</h2>
                    <DocumentFileList documents={documents} />
                  </section>
                )}

                {(activeTab === 'reviewComments' || activeTab === 'internalComments') && (
                  <section className={cn(cardClassName, 'min-w-0 p-4 sm:p-6')}>
                    <h2 className="mb-4 text-body font-bold text-text-primary">
                      {t(
                        activeTab === 'internalComments'
                          ? 'cab.applications.review.tabs.internalComments'
                          : 'cab.applications.review.reviewerComments.title',
                      )}
                    </h2>
                    {(activeTab === 'internalComments' ? internalComments : publicComments.length ? publicComments : comments).length === 0 ? (
                      <p className="text-body-sm text-neutral-600">{t('cab.applications.review.flow.noSectionData')}</p>
                    ) : (
                      <ul className="flex flex-col gap-4">
                        {(activeTab === 'internalComments' ? internalComments : publicComments.length ? publicComments : comments).map((c) => (
                          <li key={c.id} className="rounded-lg border border-neutral-100 p-4">
                            <p className="text-caption font-semibold text-text-primary">
                              {c.sectionKey ? t(`cab.applications.review.flow.sections.${c.sectionKey}`) : t('cab.applications.review.tabs.reviewComments')}
                            </p>
                            <p className="mt-2 whitespace-pre-line text-body-sm text-text-primary">{decodeSectionComment(c.content).text}</p>
                            <p className="mt-2 text-overline text-neutral-600">
                              {c.createdBy.fullName} · {new Date(c.createdAt).toLocaleString(i18n.language)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}

                {activeTab === 'history' && (
                  <section className={cn(cardClassName, 'min-w-0 overflow-hidden p-3 sm:p-5')}>
                    <h2 className="mb-4 text-body font-bold text-text-primary">{t('cab.applications.review.historySection.title')}</h2>
                    {comments.length === 0 ? (
                      <p className="text-body-sm text-neutral-600">{t('cab.applications.review.flow.noSectionData')}</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] border-collapse text-start">
                          <thead>
                            <tr className="bg-primary text-caption font-bold text-white">
                              <th className="px-4 py-3.5">{t('cab.applications.review.historySection.columns.dateTime')}</th>
                              <th className="px-4 py-3.5">{t('cab.applications.review.historySection.columns.by')}</th>
                              <th className="px-4 py-3.5">{t('cab.applications.review.historySection.columns.action')}</th>
                              <th className="px-4 py-3.5">{t('cab.applications.review.historySection.columns.details')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {comments.map((c) => (
                              <tr key={c.id} className="border-b border-neutral-50 text-caption">
                                <td className="px-4 py-3">{new Date(c.createdAt).toLocaleString(i18n.language)}</td>
                                <td className="px-4 py-3">{c.createdBy.fullName}</td>
                                <td className="px-4 py-3">{t('cab.applications.review.actions.addComment')}</td>
                                <td className="px-4 py-3">{decodeSectionComment(c.content).text}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                )}
              </div>

              <DashboardTourStep steps={tourSteps} stepId="workflow-progress" className="w-full shrink-0 xl:w-[340px]">
                <div className="flex flex-col gap-4">
                  <WorkflowProgressCard
                    className="w-full lg:w-full"
                    steps={workflowSteps}
                    title={t('cab.applications.review.workflow.completed')}
                    viewFullLabel={t('cab.applications.review.actions.viewFullWorkflow')}
                    statusLabels={{
                      completed: t('cab.applications.review.workflow.completed'),
                      inProgress: t('cab.applications.review.workflow.inProgress'),
                      pending: t('cab.applications.review.workflow.pending'),
                    }}
                  />
                  <section className={cn(cardClassName, 'p-4')}>
                    <h3 className="mb-3 text-body font-semibold text-text-primary">{t('cab.applications.review.reviewActions.title')}</h3>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        disabled={Boolean(deciding)}
                        onClick={() => navigate(cabApplicationInformationRequiredPath(applicationId, clientId))}
                        className="flex h-9 w-full items-center gap-2 rounded-md border border-primary-200 bg-primary-50 px-3 text-caption font-semibold text-primary disabled:opacity-60"
                      >
                        <AppIcon icon={CommentIcon} size={14} />
                        {t('cab.applications.review.reviewActions.requestInformation')}
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(deciding)}
                        onClick={() => void approveCompleteness()}
                        className="flex h-9 w-full items-center gap-2 rounded-md border border-success-200 bg-success-50 px-3 text-caption font-semibold text-success-600 disabled:opacity-60"
                      >
                        <AppIcon icon={ExportIcon} size={14} />
                        {deciding === 'approve'
                          ? t('cab.applications.review.reviewActions.approving')
                          : t('cab.applications.review.reviewActions.approveCompleteness')}
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(deciding)}
                        onClick={() => void rejectApplication()}
                        className="flex h-9 w-full items-center gap-2 rounded-md border border-error-200 bg-error-50 px-3 text-caption font-semibold text-error-500 disabled:opacity-60"
                      >
                        <AppIcon icon={CorrectiveActionIcon} size={14} />
                        {deciding === 'reject'
                          ? t('cab.applications.review.reviewActions.rejecting')
                          : t('cab.applications.review.reviewActions.rejectApplication')}
                      </button>
                    </div>
                  </section>
                </div>
              </DashboardTourStep>
            </div>
          </div>

          <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 bg-white px-3 py-3 sm:px-6">
            <p className="text-caption text-text-primary">{t('cab.applications.review.footer.copyright')}</p>
            <div className="flex items-center gap-4 text-caption">
              <Link to={ROUTES.privacyPolicy} className="text-primary hover:underline">
                {t('cab.applications.review.footer.privacyPolicy')}
              </Link>
              <span className="text-text-primary">{t('cab.applications.review.footer.termsOfUse')}</span>
            </div>
          </footer>
        </div>
      </div>
    </>
  )
}

export function CabApplicationReviewPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { applicationId } = useParams()
  const tourSteps = useApplicationReviewTourSteps()

  return (
    <CabLayout
      className="bg-white"
      tourId="cab-application-review"
      tourSteps={tourSteps}
      onTourComplete={
        applicationId
          ? () => {
              markTourPending('cab-application-information-required')
              navigate(cabApplicationInformationRequiredPath(applicationId))
            }
          : undefined
      }
    >
      {applicationId ? (
        <ReviewFlow key={applicationId} applicationId={applicationId} />
      ) : (
        <>
          <CabHeader title={t('cab.applications.review.title')} notificationCount={2} />
          <div className="flex flex-1 flex-col gap-5 overflow-auto page-main">
            <ApplicationPicker
              title={t('cab.applications.review.selectApplication')}
              hint={t('cab.applications.review.selectApplicationHint')}
              actionLabel={t('cab.applications.review.openSelected')}
              allowedStatuses={['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']}
              onSelect={(application) => navigate(cabApplicationReviewPath(application.id))}
            />
          </div>
        </>
      )}
    </CabLayout>
  )
}
