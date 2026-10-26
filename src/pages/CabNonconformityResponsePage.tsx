import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { activityText } from '@/lib/activityText'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { AppLayout } from '@/components/layout/AppLayout'
import type { TourStepConfig } from '@/context/TourContext'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useNonconformityResponseTourSteps } from '@/config/nonconformityResponseTourSteps'
import { NonconformityStatusBadge } from '@/components/dashboard/cab/NonconformityStatusBadge'
import { EvidenceUploadField } from '@/components/dashboard/cab/EvidenceUploadField'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/TextField'
import { DatePicker } from '@/components/ui/DatePicker'
import { FormLabel } from '@/components/ui/FormField'
import { ErrorState } from '@/components/ui/ErrorState'
import {
  AppIcon,
  ArrowRightIcon,
  ExternalLinkIcon,
  HistoryIcon,
  InfoIcon,
  LinkIcon,
  MoreIcon,
  RefreshIcon,
  SuccessCircleIcon,
} from '@/components/icons'
import {
  EFFECTIVENESS_RESULTS,
  EVIDENCE_ACCEPT,
  EVIDENCE_MAX_BYTES,
  RESPONSE_TABS,
  RESPONSE_TEXT_LIMIT,
  closeAfterVerification,
  deleteResponseEvidence,
  getNonconformityResponse,
  isResponseComplete,
  requestRevision,
  saveResponseDraft,
  submitResponse,
  uploadResponseEvidence,
  type EffectivenessResult,
  type EvidenceFile,
  type NonconformityResponse,
  type ResponseDraftInput,
  type ResponseTab,
} from '@/lib/api/cabNonconformityResponseApi'
import type { NonconformityStatus } from '@/lib/api/cabNonconformitiesApi'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { displayCountry } from '@/lib/localizeCountry'
import { notSet } from '@/lib/emptyValue'
import { pageTabClassName, pageTabListClassName } from '@/components/ui/pageTabs'

const cardClassName = 'rounded-lg border border-neutral-100 bg-white'

function Chevron() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-neutral-500 rtl-flip"
      aria-hidden
    >
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function RailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-body-sm text-neutral-600">{label}</span>
      <span className="text-end text-body-sm font-medium text-neutral-900">{value || notSet()}</span>
    </div>
  )
}

/** Textarea + live counter, shared by the three narrative fields and the reviewer comment. */
function CountedTextarea({
  id,
  label,
  required,
  value,
  placeholder,
  disabled,
  error,
  onChange,
}: {
  id: string
  label: string
  required?: boolean
  value: string
  placeholder?: string
  disabled?: boolean
  error?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <FormLabel htmlFor={id} required={required}>
        {label}
      </FormLabel>
      <div className="relative">
        <Textarea
          id={id}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={RESPONSE_TEXT_LIMIT}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          className={cn('min-h-[92px] pb-8', error && 'border-error-500 focus:border-error-500 focus:ring-error-500')}
        />
        <span className="pointer-events-none absolute bottom-2.5 end-3 text-caption text-neutral-500" dir="ltr">
          {value.length}/{RESPONSE_TEXT_LIMIT}
        </span>
      </div>
      {error && <p className="text-caption text-error-700">{error}</p>}
    </div>
  )
}

/** CAB pages use the CAB shell (with the page tour); the client portal uses the portal shell. */
function ResponseShell({
  client,
  tourSteps,
  children,
}: {
  client: boolean
  tourSteps?: TourStepConfig[]
  children: React.ReactNode
}) {
  if (client) return <AppLayout>{children}</AppLayout>
  return tourSteps ? (
    <CabLayout tourId="cab-nonconformity-response" tourSteps={tourSteps}>
      {children}
    </CabLayout>
  ) : (
    <CabLayout>{children}</CabLayout>
  )
}

/**
 * Corrective-action response workspace.
 *  - variant "cab" (/cab/nonconformities/:ncId/response): CAB staff edit, request a revision or close.
 *  - variant "client" (/portal/findings/:ncId/respond): the audit client answers the finding and
 *    submits it; reviewer fields are read-only and the reviewer actions are hidden.
 */
export function CabNonconformityResponsePage({ variant = 'cab' }: { variant?: 'cab' | 'client' } = {}) {
  const { ncId } = useParams<{ ncId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const tourSteps = useNonconformityResponseTourSteps()
  const isClient = variant === 'client'
  const registerPath = isClient ? ROUTES.portalFindings : ROUTES.cabNonconformities

  const [response, setResponse] = useState<NonconformityResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)

  const [tab, setTab] = useState<ResponseTab>('corrective_action')
  const [detailsOpen, setDetailsOpen] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  const [draft, setDraft] = useState<ResponseDraftInput | null>(null)
  const [evidence, setEvidence] = useState<EvidenceFile[]>([])
  const [status, setStatus] = useState<NonconformityStatus>('open')
  const [lastSaved, setLastSaved] = useState<{ at: string; by: string } | null>(null)

  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(false)

  const objectUrlsRef = useRef<string[]>([])

  useEffect(() => {
    if (!ncId) return
    let cancelled = false

    getNonconformityResponse(ncId)
      .then((data) => {
        if (cancelled) return
        if (!data) {
          setLoadFailed(true)
          return
        }
        setLoadFailed(false)
        setResponse(data)
        setEvidence(data.evidence)
        setStatus(data.nonconformity.status)
        setLastSaved(
          data.lastSavedAt && data.lastSavedBy ? { at: data.lastSavedAt, by: data.lastSavedBy } : null,
        )
        setDraft({
          correction: data.correction,
          rootCause: data.rootCause,
          correctiveAction: data.correctiveAction,
          responsiblePerson: data.responsiblePerson,
          targetDate: data.targetDate,
          effectivenessReviewDate: data.effectivenessReviewDate,
          effectivenessResult: data.effectivenessResult,
          reviewerComments: data.reviewerComments,
        })
      })
      .catch((error) => {
        console.error('Failed to load nonconformity response:', error)
        if (!cancelled) setLoadFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [ncId])

  // Revoke preview URLs created for locally-added evidence on unmount.
  useEffect(
    () => () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      objectUrlsRef.current = []
    },
    [],
  )

  const patch = useCallback((changes: Partial<ResponseDraftInput>) => {
    setDraft((previous) => (previous ? { ...previous, ...changes } : previous))
  }, [])

  const complete = useMemo(
    () => (draft ? isResponseComplete(draft, evidence) : false),
    [draft, evidence],
  )

  // A client cannot change a response the CAB is reviewing.
  const readOnly = status === 'closed' || (isClient && status === 'submitted')
  // Effectiveness review and reviewer comments are written by the CAB only.
  const reviewerReadOnly = readOnly || isClient
  const busy = pendingAction !== null

  const fieldError = (value: string) =>
    showErrors && !value.trim() ? t('cab.nonconformityResponse.errors.required') : undefined

  const runAction = async (
    key: string,
    action: () => Promise<{ savedAt: string; savedBy: string; status: NonconformityStatus }>,
  ) => {
    setPendingAction(key)
    try {
      const result = await action()
      setLastSaved({ at: result.savedAt, by: result.savedBy })
      setStatus(result.status)
    } catch (error) {
      console.error(`Nonconformity response action "${key}" failed:`, error)
    } finally {
      setPendingAction(null)
    }
  }

  const handleSaveDraft = () => {
    if (!ncId || !draft) return
    void runAction('save', () => saveResponseDraft(ncId, draft))
  }

  const handleSubmit = () => {
    if (!ncId || !draft) return
    if (!complete) {
      setShowErrors(true)
      return
    }
    setShowErrors(false)
    void runAction('submit', () => submitResponse(ncId, draft))
  }

  const handleRequestRevision = () => {
    if (!ncId || !draft) return
    void runAction('revision', () => requestRevision(ncId, draft.reviewerComments))
  }

  const handleClose = () => {
    if (!ncId || !draft) return
    void runAction('close', () => closeAfterVerification(ncId, draft.reviewerComments))
  }

  const handleAddEvidence = async (files: File[]) => {
    if (!ncId) return
    let current = evidence
    for (const file of files) {
      try {
        const uploaded = await uploadResponseEvidence(ncId, file, current)
        if (uploaded.url?.startsWith('blob:')) objectUrlsRef.current.push(uploaded.url)
        current = [...current, uploaded]
        setEvidence(current)
      } catch (error) {
        console.error(`Evidence upload "${file.name}" failed:`, error)
      }
    }
  }

  const handleDeleteEvidence = async (id: string) => {
    if (!ncId) return
    try {
      await deleteResponseEvidence(ncId, id)
    } catch (error) {
      console.error('Evidence delete failed:', error)
      return
    }
    setEvidence((previous) => {
      const target = previous.find((item) => item.id === id)
      if (target?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(target.url)
        objectUrlsRef.current = objectUrlsRef.current.filter((url) => url !== target.url)
      }
      return previous.filter((item) => item.id !== id)
    })
  }

  const statusLabel = (value: NonconformityStatus) => t(`cab.nonconformities.status.${value}`)

  const parseDate = (value: string) => (value ? new Date(value) : undefined)
  const toIso = (date: Date) => date.toISOString().slice(0, 10)

  if (loading) {
    return (
      <ResponseShell client={isClient}>
        <CabHeader title={t('cab.nonconformityResponse.title')} notificationCount={3} />
        <main className="flex flex-1 items-center justify-center p-6">
          <p className="text-body text-neutral-600">{t('common.loading')}</p>
        </main>
      </ResponseShell>
    )
  }

  if (loadFailed || !response || !draft) {
    return (
      <ResponseShell client={isClient}>
        <CabHeader title={t('cab.nonconformityResponse.title')} notificationCount={3} />
        <main className="flex flex-1 items-center justify-center p-6">
          <ErrorState
            title={t('cab.nonconformityResponse.notFound')}
            description={t('cab.nonconformityResponse.notFoundHint')}
            retryLabel={t('cab.nonconformityResponse.backToRegister')}
            onRetry={() => navigate(registerPath)}
          />
        </main>
      </ResponseShell>
    )
  }

  const { nonconformity } = response

  return (
    <ResponseShell client={isClient} tourSteps={tourSteps}>
      <CabHeader title={t('cab.nonconformityResponse.title')} notificationCount={3} />

      <main className="flex flex-1 overflow-auto">
        <div
          className={cn(
            'grid min-w-0 flex-1 grid-cols-1 items-start gap-5 p-6',
            // The portal sidebar is wider than the CAB rail, so the client view needs more room before splitting.
            isClient ? '2xl:grid-cols-[minmax(0,1fr)_320px]' : 'xl:grid-cols-[minmax(0,1fr)_320px]',
          )}
        >
          <div className="flex min-w-0 flex-col gap-5">
            <nav className="flex min-w-0 flex-wrap items-center gap-2 text-body-sm" aria-label={t('common.breadcrumb')}>
              <Link to={registerPath} className="font-light text-neutral-500 hover:text-primary">
                {isClient ? t('portal.nav.findings', 'Findings') : t('cab.nonconformities.title')}
              </Link>
              <Chevron />
              <Link to={registerPath} className="font-light text-neutral-500 hover:text-primary">
                {nonconformity.ncId}
              </Link>
              <Chevron />
              <span className="font-medium text-neutral-800">{t('cab.nonconformityResponse.title')}</span>
            </nav>

            {/* Page header */}
            <CabTourStep steps={tourSteps} stepId="nc-response-header">
              <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-page-title text-text-primary" dir="ltr">
                      {nonconformity.ncId}
                    </h1>
                    <NonconformityStatusBadge status={status} label={statusLabel(status)} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm text-neutral-700">
                    <span className="font-medium text-neutral-900">{nonconformity.clientName}</span>
                    <span className="text-neutral-300">|</span>
                    <span>
                      {t('cab.nonconformities.table.client')}:{' '}
                      {isClient ? (
                        <span dir="ltr">{nonconformity.clientId}</span>
                      ) : (
                        <Link
                          to={`/cab/clients/${nonconformity.clientId}`}
                          className="text-primary hover:underline"
                          dir="ltr"
                        >
                          {nonconformity.clientId}
                        </Link>
                      )}
                    </span>
                    <span className="text-neutral-300">|</span>
                    <span>{displayCountry(nonconformity.country)}</span>
                    <span className="text-neutral-300">|</span>
                    <span dir="ltr">
                      {t('cab.nonconformityResponse.fields.application')}: {response.applicationId}
                    </span>
                  </div>
                </div>

                <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
                  <Button
                    variant="outline"
                    icon={<AppIcon icon={ExternalLinkIcon} size={18} />}
                    iconPosition="end"
                    onClick={() => navigate(isClient ? ROUTES.portalApplications : ROUTES.cabApplicationRegister)}
                    className="h-11 flex-1 text-body-sm sm:flex-none"
                  >
                    {t('cab.nonconformityResponse.viewApplication')}
                  </Button>
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setMenuOpen((open) => !open)}
                      onBlur={() => window.setTimeout(() => setMenuOpen(false), 120)}
                      aria-expanded={menuOpen}
                      aria-label={t('cab.nonconformityResponse.moreActions')}
                      className="flex size-11 items-center justify-center rounded-md border border-primary-500 bg-white text-primary-500 transition-colors hover:bg-primary-50"
                    >
                      <AppIcon icon={MoreIcon} size={20} />
                    </button>
                    {menuOpen && (
                      <div className="absolute end-0 top-[calc(100%+4px)] z-10 min-w-[200px] overflow-hidden rounded-md border border-neutral-100 bg-white py-1 shadow-lg">
                        {isClient ? null : (
                          <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              setMenuOpen(false)
                              navigate(ROUTES.cabAuditReporting)
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-start text-body-sm text-neutral-800 transition-colors hover:bg-neutral-25"
                          >
                            <AppIcon icon={LinkIcon} size={16} className="text-neutral-500" />
                            {t('cab.nonconformityResponse.viewFinding')}
                          </button>
                        )}
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setMenuOpen(false)
                            setTab('activity')
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-start text-body-sm text-neutral-800 transition-colors hover:bg-neutral-25"
                        >
                          <AppIcon icon={HistoryIcon} size={16} className="text-neutral-500" />
                          {t('cab.nonconformityResponse.tabs.activity')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CabTourStep>

            {/* Tabs */}
            <CabTourStep steps={tourSteps} stepId="nc-response-tabs">
              <div
                className={pageTabListClassName}
                role="tablist"
                aria-label={t('cab.nonconformityResponse.tabsLabel')}
              >
                {RESPONSE_TABS.map((tabId) => (
                  <button
                    key={tabId}
                    type="button"
                    role="tab"
                    aria-selected={tab === tabId}
                    onClick={() => setTab(tabId)}
                    className={pageTabClassName(tab === tabId)}
                  >
                    {t(`cab.nonconformityResponse.tabs.${tabId}`)}
                  </button>
                ))}
              </div>
            </CabTourStep>

            {/* ---------- Tab content ---------- */}
            <div
              className={cn(
                'grid min-w-0 grid-cols-1 gap-5',
                isClient ? 'xl:grid-cols-[minmax(0,1fr)_minmax(0,400px)]' : 'lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]',
              )}
            >
                {tab === 'corrective_action' && (
                  <>
                    {/* Response form */}
                    <CabTourStep steps={tourSteps} stepId="nc-response-form">
                      <section className={cn(cardClassName, 'min-w-0 space-y-5 p-5')}>
                        {/* Read-only original finding */}
                        <div className="flex flex-col gap-3 rounded-md bg-neutral-25 p-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-body-sm font-medium text-neutral-900">
                              {t('cab.nonconformityResponse.fields.originalFinding')}
                            </p>
                            <p className="mt-1.5 text-body-sm leading-relaxed text-neutral-700">
                              {response.originalFinding}
                            </p>
                          </div>
                          <div className="shrink-0 border-neutral-100 sm:border-s sm:ps-4">
                            <p className="text-caption text-neutral-600">
                              {t('cab.nonconformities.fields.raisedDate')}
                            </p>
                            <p className="mt-0.5 text-body-sm font-medium text-neutral-900">
                              {response.findingRaisedDate}
                            </p>
                          </div>
                        </div>

                        <CountedTextarea
                          id="nc-correction"
                          label={t('cab.nonconformityResponse.fields.correction')}
                          required
                          value={draft.correction}
                          disabled={readOnly || busy}
                          error={fieldError(draft.correction)}
                          placeholder={t('cab.nonconformityResponse.placeholders.correction')}
                          onChange={(value) => patch({ correction: value })}
                        />

                        <CountedTextarea
                          id="nc-root-cause"
                          label={t('cab.nonconformityResponse.fields.rootCause')}
                          required
                          value={draft.rootCause}
                          disabled={readOnly || busy}
                          error={fieldError(draft.rootCause)}
                          placeholder={t('cab.nonconformityResponse.placeholders.rootCause')}
                          onChange={(value) => patch({ rootCause: value })}
                        />

                        <CountedTextarea
                          id="nc-corrective-action"
                          label={t('cab.nonconformityResponse.fields.correctiveAction')}
                          required
                          value={draft.correctiveAction}
                          disabled={readOnly || busy}
                          error={fieldError(draft.correctiveAction)}
                          placeholder={t('cab.nonconformityResponse.placeholders.correctiveAction')}
                          onChange={(value) => patch({ correctiveAction: value })}
                        />

                        <EvidenceUploadField
                          label={t('cab.nonconformityResponse.fields.evidence')}
                          required
                          files={evidence}
                          accept={EVIDENCE_ACCEPT}
                          maxSizeBytes={EVIDENCE_MAX_BYTES}
                          hint={t('cab.nonconformityResponse.evidence.hint')}
                          disabled={readOnly || busy}
                          error={
                            showErrors && evidence.length === 0
                              ? t('cab.nonconformityResponse.errors.evidenceRequired')
                              : undefined
                          }
                          onSelectFiles={(files) => void handleAddEvidence(files)}
                          onDeleteFile={(id) => void handleDeleteEvidence(id)}
                          onOpenFile={(file) => file.url && window.open(file.url, '_blank', 'noopener')}
                        />
                      </section>
                    </CabTourStep>

                    {/* More details */}
                    <CabTourStep steps={tourSteps} stepId="nc-response-more-details">
                      <section className={cn(cardClassName, 'min-w-0 self-start p-5')}>
                        <button
                          type="button"
                          onClick={() => setDetailsOpen((open) => !open)}
                          aria-expanded={detailsOpen}
                          className="flex w-full items-center gap-2 text-start"
                        >
                          <AppIcon
                            icon={ArrowRightIcon}
                            size={18}
                            className={cn(
                              'shrink-0 text-neutral-600 transition-transform rtl-flip',
                              detailsOpen ? '-rotate-90' : 'rotate-90',
                            )}
                          />
                          <span className="text-body-lg font-medium text-neutral-900">
                            {t('cab.nonconformityResponse.moreDetails')}
                          </span>
                        </button>

                        {detailsOpen && (
                          <div className="mt-5 space-y-5">
                            <SelectField
                              id="nc-responsible"
                              label={t('cab.nonconformityResponse.fields.responsiblePerson')}
                              required
                              value={draft.responsiblePerson}
                              disabled={readOnly || busy}
                              options={response.responsibleOptions}
                              placeholder={t('cab.nonconformityResponse.placeholders.responsiblePerson')}
                              onChange={(value) => patch({ responsiblePerson: value })}
                            />

                            <div className="space-y-2">
                              <FormLabel required>{t('cab.nonconformityResponse.fields.targetDate')}</FormLabel>
                              <DatePicker
                                value={parseDate(draft.targetDate)}
                                disabled={readOnly || busy}
                                onChange={(date) => patch({ targetDate: toIso(date) })}
                                placeholder={t('cab.nonconformityResponse.placeholders.date')}
                              />
                              {showErrors && !draft.targetDate && (
                                <p className="text-caption text-error-700">
                                  {t('cab.nonconformityResponse.errors.required')}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <FormLabel>{t('cab.nonconformities.table.status')}</FormLabel>
                              <div>
                                <NonconformityStatusBadge status={status} label={statusLabel(status)} />
                              </div>
                            </div>

                            <div className="space-y-5 border-t border-neutral-100 pt-5">
                              <p className="text-body-lg font-medium text-neutral-900">
                                {t('cab.nonconformityResponse.effectivenessReview')}
                              </p>

                              <div className="space-y-2">
                                <FormLabel>
                                  {t('cab.nonconformityResponse.fields.effectivenessReviewDate')}
                                </FormLabel>
                                <DatePicker
                                  value={parseDate(draft.effectivenessReviewDate)}
                                  disabled={reviewerReadOnly || busy}
                                  onChange={(date) => patch({ effectivenessReviewDate: toIso(date) })}
                                  placeholder={t('cab.nonconformityResponse.placeholders.date')}
                                />
                              </div>

                              <SelectField
                                id="nc-effectiveness"
                                label={t('cab.nonconformityResponse.fields.effectivenessResult')}
                                value={draft.effectivenessResult}
                                disabled={reviewerReadOnly || busy}
                                options={EFFECTIVENESS_RESULTS.map((result) => ({
                                  value: result,
                                  label: t(`cab.nonconformityResponse.effectiveness.${result}`),
                                }))}
                                onChange={(value) =>
                                  patch({ effectivenessResult: value as EffectivenessResult })
                                }
                              />

                              <CountedTextarea
                                id="nc-comments"
                                label={t('cab.nonconformityResponse.fields.comments')}
                                value={draft.reviewerComments}
                                disabled={reviewerReadOnly || busy}
                                placeholder={t('cab.nonconformityResponse.placeholders.comments')}
                                onChange={(value) => patch({ reviewerComments: value })}
                              />
                            </div>
                          </div>
                        )}
                      </section>
                    </CabTourStep>
                  </>
                )}

                {tab === 'activity' && (
                  <section className={cn(cardClassName, 'min-w-0 p-5 lg:col-span-2')}>
                    {response.activity.length === 0 ? (
                      <p className="py-8 text-center text-body-sm text-neutral-500">
                        {t('cab.nonconformityResponse.noActivity')}
                      </p>
                    ) : (
                      <ul className="space-y-4">
                        {response.activity.map((entry) => (
                          <li key={entry.id} className="flex items-start gap-3">
                            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary">
                              <AppIcon icon={HistoryIcon} size={16} />
                            </span>
                            <div className="min-w-0">
                              <p className="text-body-sm font-medium text-neutral-900">{activityText(t, entry.text)}</p>
                              <p className="mt-0.5 text-caption text-neutral-600">
                                {entry.by}
                                <span className="mx-2 text-neutral-300">|</span>
                                {entry.at}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}

                {tab === 'related' && (
                  <section className={cn(cardClassName, 'min-w-0 p-5 lg:col-span-2')}>
                    <ul className="space-y-2">
                      {response.related.map((record) => (
                        <li
                          key={record.id}
                          className="flex items-center justify-between gap-3 rounded-md border border-neutral-100 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="text-caption text-neutral-600">
                              {t(`cab.nonconformityResponse.related.${record.id}`, { defaultValue: record.label })}
                            </p>
                            <p className="mt-0.5 text-body-sm font-medium text-primary" dir="ltr">
                              {record.reference}
                            </p>
                          </div>
                          <AppIcon icon={LinkIcon} size={18} className="shrink-0 text-neutral-500" />
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {tab === 'attachments' && (
                  <section className={cn(cardClassName, 'min-w-0 p-5 lg:col-span-2')}>
                    <EvidenceUploadField
                      label={t('cab.nonconformityResponse.fields.evidence')}
                      files={evidence}
                      accept={EVIDENCE_ACCEPT}
                      maxSizeBytes={EVIDENCE_MAX_BYTES}
                      hint={t('cab.nonconformityResponse.evidence.hint')}
                      disabled={readOnly || busy}
                      onSelectFiles={(files) => void handleAddEvidence(files)}
                      onDeleteFile={(id) => void handleDeleteEvidence(id)}
                      onOpenFile={(file) => file.url && window.open(file.url, '_blank', 'noopener')}
                    />
                  </section>
                )}
            </div>

          </div>

          {/* ---------- Right rail ---------- */}
          <aside className="flex min-w-0 flex-col gap-5 xl:sticky xl:top-0">
            {/* Status summary */}
            <section className={cn(cardClassName, 'p-5')}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-body font-medium text-neutral-900">
                  {t('cab.nonconformityResponse.statusCard')}
                </h2>
                <NonconformityStatusBadge status={status} label={statusLabel(status)} />
              </div>

              <div className="mt-4">
                <p className="text-body font-bold text-neutral-900" dir="ltr">
                  {nonconformity.ncId}
                </p>
                <p className="mt-0.5 text-body-sm font-medium text-neutral-900">
                  {nonconformity.clientName}
                </p>
                <p className="mt-2 text-body-sm text-neutral-600">
                  {t('cab.nonconformities.table.client')}:{' '}
                  <span dir="ltr">{nonconformity.clientId}</span>
                </p>
                <p className="text-body-sm text-neutral-600">
                  {t('cab.nonconformityResponse.fields.application')}:{' '}
                  <span dir="ltr">{response.applicationId}</span>
                </p>
                <p className="text-body-sm text-neutral-600">{displayCountry(nonconformity.country)}</p>
              </div>

              <div className="mt-4 border-t border-neutral-100 pt-3">
                <RailRow
                  label={t('cab.nonconformities.fields.raisedDate')}
                  value={response.findingRaisedDate}
                />
                <RailRow
                  label={t('cab.nonconformityResponse.fields.targetClosureDate')}
                  value={response.targetClosureDate}
                />
                <RailRow
                  label={t('cab.nonconformityResponse.fields.daysOpen')}
                  value={String(response.daysOpen)}
                />
              </div>
            </section>

            <CabTourStep steps={tourSteps} stepId="nc-response-actions">
              <div className="flex flex-col gap-5">
                {/* Your response */}
                <section className={cn(cardClassName, 'p-5')}>
                  <h2 className="text-body font-medium text-neutral-900">
                    {t('cab.nonconformityResponse.yourResponse')}
                  </h2>

                  <div className="mt-3">
                    <RailRow
                      label={t('cab.nonconformityResponse.lastSaved')}
                      value={lastSaved?.at ?? t('cab.nonconformityResponse.neverSaved')}
                    />
                    {lastSaved && (
                      <RailRow label={t('cab.nonconformityResponse.savedBy')} value={lastSaved.by} />
                    )}
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    <Button
                      variant="primary"
                      icon={
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path
                            d="M5 4h10.2L20 8.8V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 1-2Z M8 4v5h7 M8 20v-5h8v5"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      }
                      disabled={readOnly || busy}
                      onClick={handleSaveDraft}
                      className="h-11 w-full text-body-sm"
                    >
                      {pendingAction === 'save'
                        ? t('common.loading')
                        : t('cab.nonconformityResponse.saveDraft')}
                    </Button>

                    <Button
                      variant="outline"
                      icon={
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path
                            d="M21 3 10.5 13.5M21 3l-6.8 18-3.7-7.5L3 9.8 21 3Z"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      }
                      disabled={readOnly || busy}
                      onClick={handleSubmit}
                      className="h-11 w-full text-body-sm"
                    >
                      {pendingAction === 'submit'
                        ? t('common.loading')
                        : t('cab.nonconformityResponse.submitResponse')}
                    </Button>
                  </div>
                </section>

                {/* Reviewer action (CAB only) */}
                {isClient ? null : (
                  <section className={cn(cardClassName, 'p-5')}>
                    <h2 className="text-body font-medium text-neutral-900">
                      {t('cab.nonconformityResponse.reviewerAction')}
                    </h2>

                    <div className="mt-3 flex items-start gap-2.5 rounded-md bg-primary-25 p-3">
                      <AppIcon icon={InfoIcon} size={18} className="mt-0.5 shrink-0 text-neutral-600" />
                      <p className="text-body-sm leading-relaxed text-neutral-700">
                        {t('cab.nonconformityResponse.reviewerHint')}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-col gap-3">
                      <Button
                        variant="outline"
                        icon={<AppIcon icon={RefreshIcon} size={18} />}
                        disabled={readOnly || busy}
                        onClick={handleRequestRevision}
                        className="h-11 w-full text-body-sm"
                      >
                        {pendingAction === 'revision'
                          ? t('common.loading')
                          : t('cab.nonconformityResponse.requestRevision')}
                      </Button>

                      <Button
                        variant="primary"
                        icon={<AppIcon icon={SuccessCircleIcon} size={18} />}
                        disabled={readOnly || busy}
                        onClick={handleClose}
                        className="h-11 w-full text-body-sm"
                      >
                        {pendingAction === 'close'
                          ? t('common.loading')
                          : t('cab.nonconformityResponse.closeAfterVerification')}
                      </Button>
                    </div>
                  </section>
                )}
              </div>
            </CabTourStep>
          </aside>
        </div>
      </main>
    </ResponseShell>
  )
}

/** Client portal route (/portal/findings/:ncId/respond): the audit client answers a nonconformity. */
export function ClientNonconformityResponsePage() {
  return <CabNonconformityResponsePage variant="client" />
}
