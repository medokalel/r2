import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { useCabApplicationSubmissionState } from '@/components/dashboard/cab/useCabApplicationSubmissionState'
import { DashboardFooter } from '@/components/dashboard/DashboardFooter'
import { EntityDataForm } from '@/components/dashboard/EntityDataForm'
import { EntityDataNav } from '@/components/dashboard/EntityDataNav'
import {
  subSections,
  type EntityDataSubSection,
  type EntityDataViewTab,
} from '@/components/dashboard/entityDataNavSections'
import { ApplicationFormContext } from '@/components/dashboard/entityData/ApplicationFormContext'
import { ApplicationLoadingSkeleton } from '@/components/dashboard/entityData/ApplicationLoadingSkeleton'
import { FieldSelectionSummary } from '@/components/dashboard/entityData/FieldSelectionSummary'
import { isSectionComplete } from '@/components/dashboard/entityData/applicationValidation'
import type { FieldPhase, SectorKey, StandardKey } from '@/components/dashboard/entityData/fieldTypes'
import { ProcessStepper } from '@/components/dashboard/ProcessStepper'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useApplicationDraftTourSteps } from '@/config/applicationDraftTourSteps'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { startCabClientApplication } from '@/lib/api/cabCertificationApplicationApi'
import { deriveClientCode, listAllCabAuditClients, type CabAuditClientListItem } from '@/lib/api/clientRegistrationApi'
import {
  ROUTES,
  cabApplicationAddSitePath,
  cabApplicationReceiptPath,
  cabApplicationReviewPath,
  cabApplicationSubmissionPath,
} from '@/lib/routes'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const STATUS_VIEWS: EntityDataViewTab[] = ['approved', 'underReview', 'rejected']

const viewTabCopyKeys: Record<
  'entityData' | 'field' | 'documents',
  { title: string; subtitle: string }
> = {
  entityData: {
    title: 'accreditation.entityData.title',
    subtitle: 'accreditation.entityData.subtitle',
  },
  field: {
    title: 'accreditation.entityData.field.pageTitle',
    subtitle: 'accreditation.entityData.field.pageSubtitle',
  },
  documents: {
    title: 'accreditation.entityData.documents.pageTitle',
    subtitle: 'accreditation.entityData.documents.pageSubtitle',
  },
}

function ClientPicker() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [clients, setClients] = useState<CabAuditClientListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState('')

  useEffect(() => {
    let cancelled = false
    listAllCabAuditClients()
      .then((items) => {
        if (!cancelled) setClients(items)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setClients([])
        toast.error(getUserErrorMessage(err, t, { fallbackKey: 'cab.clientsPage.loadError' }))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [t])

  const options = useMemo(
    () =>
      clients.map((client) => {
        const location = client.city || client.address
        return {
          value: client.id,
          label: `${deriveClientCode(client.id)} · ${client.name}${location ? ` (${location})` : ''}`,
        }
      }),
    [clients],
  )

  const start = async () => {
    if (!selectedClientId) return
    setStarting(true)
    try {
      const application = await startCabClientApplication(selectedClientId)
      const fill = searchParams.get('fill') === '1'
      navigate(
        cabApplicationSubmissionPath(selectedClientId, application.id, { fill }),
        { replace: true },
      )
    } catch (caught) {
      toast.error(getUserErrorMessage(caught, t))
    } finally {
      setStarting(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-[640px] rounded-lg border border-neutral-100 bg-white p-6">
      <h2 className="text-body-lg font-semibold text-neutral-900">
        {t('cab.applicationSubmission.selectClient')}
      </h2>
      <p className="mb-5 mt-1 text-body-sm text-neutral-600">
        {t('cab.applicationSubmission.selectClientHint')}
      </p>
      <SearchableSelect
        value={selectedClientId}
        onChange={setSelectedClientId}
        options={options}
        placeholder={
          loading
            ? t('common.loading')
            : clients.length === 0
              ? t('cab.applicationSubmission.noClients')
              : t('cab.applicationSubmission.clientPlaceholder')
        }
        searchPlaceholder={t('cab.applicationSubmission.clientSearchPlaceholder')}
        disabled={loading || starting || clients.length === 0}
      />
      <Button
        variant="primary"
        className="mt-5 w-full"
        disabled={!selectedClientId || starting}
        onClick={() => void start()}
      >
        {starting ? t('common.loading') : t('cab.applicationSubmission.startApplication')}
      </Button>
    </section>
  )
}

export function CabApplicationSubmissionPage() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const selectedClientId = searchParams.get('clientId')
  const contentRef = useRef<HTMLDivElement>(null)
  const [activeSubSection, setActiveSubSection] = useState<EntityDataSubSection>('legalIdentity')
  const [activeViewTab, setActiveViewTab] = useState<EntityDataViewTab>('entityData')
  const [fieldPhase, setFieldPhase] = useState<FieldPhase>('sectors')
  const [activeAction, setActiveAction] = useState<'next' | 'draft' | null>(null)

  const {
    contextValue,
    form,
    update,
    clientId,
    applicationId,
    loading,
    status,
    orderNumber,
    saving,
    submitting,
    notification,
    loadError,
    reload,
    saveDraft,
    submit,
    fillData,
  } = useCabApplicationSubmissionState()

  const isReadOnly = status !== 'DRAFT'

  const selectedSectors = form.selectedSectors
  const selectedStandards = form.selectedStandards
  const activeIndex = subSections.indexOf(activeSubSection)
  const isStatusView = STATUS_VIEWS.includes(activeViewTab)
  const copyKeys =
    activeViewTab === 'field' && fieldPhase === 'codes'
      ? {
          title: 'accreditation.entityData.field.codesTitle',
          subtitle: 'accreditation.entityData.field.pageSubtitle',
        }
      : activeViewTab === 'entityData' || activeViewTab === 'field' || activeViewTab === 'documents'
        ? viewTabCopyKeys[activeViewTab]
        : { title: '', subtitle: '' }

  const scrollToContent = useCallback(() => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleSubSectionChange = useCallback(
    (section: EntityDataSubSection) => {
      setActiveSubSection(section)
      scrollToContent()
    },
    [scrollToContent],
  )

  const handleViewTabChange = useCallback(
    (tab: EntityDataViewTab) => {
      setActiveViewTab(tab)
      if (tab !== 'field') setFieldPhase('sectors')
      scrollToContent()
    },
    [scrollToContent],
  )

  const handleBack = useCallback(() => {
    if (activeViewTab === 'documents') {
      handleViewTabChange('field')
      return
    }
    if (activeViewTab === 'field' && fieldPhase === 'codes') {
      setFieldPhase('sectors')
      return
    }
    if (activeViewTab === 'field') {
      handleViewTabChange('entityData')
      return
    }
    if (activeIndex > 0) handleSubSectionChange(subSections[activeIndex - 1])
  }, [
    activeIndex,
    activeViewTab,
    fieldPhase,
    handleSubSectionChange,
    handleViewTabChange,
  ])

  const handleNext = useCallback(async () => {
    setActiveAction('next')
    try {
      if (isReadOnly) {
        if (activeViewTab === 'documents') {
          navigate(ROUTES.cabApplicationRegister)
          return
        }
        if (activeViewTab === 'field' && fieldPhase === 'sectors') {
          setFieldPhase('codes')
        } else if (activeViewTab === 'field') {
          handleViewTabChange('documents')
        } else if (activeIndex >= subSections.length - 1) {
          handleViewTabChange('field')
        } else {
          handleSubSectionChange(subSections[activeIndex + 1])
        }
        return
      }
      if (activeViewTab === 'documents') {
        const submitted = await submit()
        if (submitted) handleViewTabChange('underReview')
        return
      }
      const saved = await saveDraft()
      if (!saved) return
      if (activeViewTab === 'field' && fieldPhase === 'sectors') {
        setFieldPhase('codes')
      } else if (activeViewTab === 'field') {
        handleViewTabChange('documents')
      } else if (activeIndex >= subSections.length - 1) {
        handleViewTabChange('field')
      } else {
        handleSubSectionChange(subSections[activeIndex + 1])
      }
    } finally {
      setActiveAction(null)
    }
  }, [
    activeIndex,
    activeViewTab,
    fieldPhase,
    handleSubSectionChange,
    handleViewTabChange,
    isReadOnly,
    navigate,
    saveDraft,
    submit,
  ])

  const handleSaveDraft = useCallback(async () => {
    setActiveAction('draft')
    try {
      await saveDraft()
    } finally {
      setActiveAction(null)
    }
  }, [saveDraft])

  // The full "Add site" page stores the site on the saved draft, so unsaved edits are saved first.
  const handleAddSite = useCallback(async () => {
    const targetClient = clientId ?? selectedClientId
    if (!targetClient || !applicationId) return
    setActiveAction('draft')
    try {
      const saved = await saveDraft()
      if (saved) navigate(cabApplicationAddSitePath(targetClient, applicationId))
    } finally {
      setActiveAction(null)
    }
  }, [applicationId, clientId, navigate, saveDraft, selectedClientId])

  const setSelectedSectors = useCallback(
    (standard: StandardKey, sectors: SectorKey[]) =>
      update('selectedSectors', { ...form.selectedSectors, [standard]: sectors }),
    [form.selectedSectors, update],
  )
  const setSelectedStandards = useCallback(
    (standards: StandardKey[]) => update('selectedStandards', standards),
    [update],
  )
  const setSelectedCodes = useCallback(
    (codes: Record<string, string[]>) => update('selectedCodes', codes),
    [update],
  )

  const standardsMissingSectors = selectedStandards.filter(
    (standard) => (selectedSectors[standard] ?? []).length === 0,
  )
  const standardsMissingCodes = selectedStandards.filter(
    (standard) =>
      !Object.entries(form.selectedCodes).some(
        ([key, codes]) => key.startsWith(`${standard}:`) && codes.length > 0,
      ),
  )
  const anySectorSelected = Object.values(selectedSectors).some((sectors) => sectors.length > 0)
  const busy = saving || submitting
  const nextDisabled =
    busy ||
    loading ||
    isStatusView ||
    (!isReadOnly &&
      ((activeViewTab === 'entityData' && !isSectionComplete(activeSubSection, form)) ||
        (activeViewTab === 'field' &&
          fieldPhase === 'sectors' &&
          (!anySectorSelected || standardsMissingSectors.length > 0)) ||
        (activeViewTab === 'field' && fieldPhase === 'codes' && standardsMissingCodes.length > 0) ||
        (activeViewTab === 'documents' && !form.agreed)))

  const missingHint =
    activeViewTab === 'field' && fieldPhase === 'sectors' && standardsMissingSectors.length > 0
      ? t('accreditation.entityData.field.missingSectorsHint', {
          standards: standardsMissingSectors.join(isRTL ? '، ' : ', '),
        })
      : activeViewTab === 'field' && fieldPhase === 'codes' && standardsMissingCodes.length > 0
        ? t('accreditation.entityData.field.missingCodesHint', {
            standards: standardsMissingCodes.join(isRTL ? '، ' : ', '),
          })
        : null

  // Save / submit results are shown as toasts instead of inside the footer.
  useEffect(() => {
    if (notification) toast[notification.type](notification.message)
  }, [notification])

  const footerStartContent = missingHint && !isReadOnly ? (
    <p className="rounded-md bg-warning-50 px-3 py-1.5 text-body-sm font-medium text-warning-700">
      {missingHint}
    </p>
  ) : activeViewTab === 'field' && fieldPhase === 'sectors' ? (
    <FieldSelectionSummary
      selectedSectors={[...new Set(Object.values(selectedSectors).flat())]}
    />
  ) : undefined

  const workflowLinks =
    applicationId && (clientId || selectedClientId) ? (
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to={cabApplicationReviewPath(applicationId, clientId ?? selectedClientId ?? undefined)}
          className="rounded-md bg-primary px-6 py-3 text-body font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          {t('cab.applicationSubmission.reviewApplication')}
        </Link>
        <Link
          to={cabApplicationReceiptPath(applicationId, clientId ?? selectedClientId ?? undefined)}
          className="rounded-md border border-primary px-6 py-3 text-body font-semibold text-primary transition-colors hover:bg-primary-subtle"
        >
          {t('cab.applicationSubmission.viewReceipt')}
        </Link>
        <Link
          to={ROUTES.cabApplicationRegister}
          className="rounded-md px-6 py-3 text-body font-semibold text-neutral-700 hover:text-primary"
        >
          {t('cab.applicationSubmission.backToRegister')}
        </Link>
      </div>
    ) : null

  const tourSteps = useApplicationDraftTourSteps()

  return (
    <CabLayout
      sidebarVariant="applicationDraft"
      tourId="cab-application-draft"
      tourSteps={tourSteps}
    >
      <ApplicationFormContext.Provider value={contextValue}>
        <CabTourStep steps={tourSteps} stepId="header">
          <CabHeader
            title={
              isReadOnly
                ? t('cab.applicationSubmission.viewTitle')
                : t('cab.applicationSubmission.title')
            }
            notificationCount={3}
          />
        </CabTourStep>
        <CabTourStep steps={tourSteps} stepId="stepper">
          <ProcessStepper flow="certification" activeStep={isStatusView ? 1 : 0} />
        </CabTourStep>

        <div ref={contentRef} className="flex flex-1 flex-col gap-5 overflow-auto page-main">
          <nav className="flex flex-wrap items-center justify-between gap-3 text-body-sm">
            <div className="flex items-center gap-2">
              <Link to={ROUTES.cabApplicationRegister} className="text-neutral-500 hover:text-primary">
                {t('cab.applicationRegister.title')}
              </Link>
              <span className="text-neutral-500">/</span>
              <span className="font-medium text-neutral-800">
                {isReadOnly
                  ? t('cab.applicationSubmission.viewTitle')
                  : isStatusView
                    ? t('cab.applicationSubmission.submitted')
                    : t('cab.applicationSubmission.title')}
              </span>
              {orderNumber && (
                <span className="text-neutral-500" dir="ltr">
                  · {orderNumber}
                </span>
              )}
            </div>
            {selectedClientId && !isStatusView && !isReadOnly && (
              <div className="flex flex-wrap items-center gap-2">
                {applicationId &&
                  activeViewTab === 'entityData' &&
                  activeSubSection === 'scopeOfActivity' && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy || loading}
                      onClick={() => void handleAddSite()}
                    >
                      {t('cab.applicationSubmission.addSiteDetails', 'Add site with full details')}
                    </Button>
                  )}
                <Button variant="outline" size="sm" disabled={busy || loading} onClick={fillData}>
                  {t('cab.applicationRegister.fillData')}
                </Button>
              </div>
            )}
          </nav>

          {!selectedClientId ? (
            <ClientPicker />
          ) : loadError ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-neutral-100 bg-white p-5">
              <ErrorState
                variant={loadError === 'rateLimit' ? 'rateLimit' : 'generic'}
                description={
                  loadError === 'notFound' || loadError === 'forbidden' || loadError === 'network'
                    ? t(`errors.${loadError}`)
                    : undefined
                }
                onRetry={reload}
              />
            </div>
          ) : loading ? (
            <div className="flex-1 rounded-lg border border-neutral-100 bg-white p-5">
              <ApplicationLoadingSkeleton />
            </div>
          ) : (
            <>
              {!isStatusView && copyKeys.title && (
                <div className="space-y-2">
                  <h1 className="text-section-title text-text-primary">{t(copyKeys.title)}</h1>
                  <p className={cn('text-body-2 text-neutral-700', isRTL && 'font-normal')}>
                    {t(copyKeys.subtitle)}
                  </p>
                </div>
              )}

              <div className="flex flex-1 gap-5">
                {!isStatusView && (
                  <CabTourStep steps={tourSteps} stepId="workflow-progress">
                    <EntityDataNav
                      activeSubSection={activeSubSection}
                      activeViewTab={activeViewTab}
                      onSubSectionChange={handleSubSectionChange}
                      onViewTabChange={handleViewTabChange}
                    />
                  </CabTourStep>
                )}
                <CabTourStep steps={tourSteps} stepId="form-content" className="min-w-0 flex-1">
                  <div className="min-w-0 flex-1 rounded-lg border border-neutral-100 bg-white p-5">
                    <fieldset
                      disabled={isReadOnly}
                      className={cn(
                        'min-w-0 border-0 p-0',
                        isReadOnly && 'pointer-events-none opacity-90',
                      )}
                    >
                      <legend className="sr-only">
                        {isReadOnly
                          ? t('cab.applicationSubmission.viewTitle')
                          : t('cab.applicationSubmission.title')}
                      </legend>
                      <EntityDataForm
                        section={activeSubSection}
                        viewTab={activeViewTab}
                        fieldPhase={fieldPhase}
                        selectedSectors={selectedSectors}
                        onSelectedSectorsChange={isReadOnly ? () => undefined : setSelectedSectors}
                        selectedStandards={selectedStandards}
                        onSelectedStandardsChange={isReadOnly ? () => undefined : setSelectedStandards}
                        selectedCodes={form.selectedCodes}
                        onSelectedCodesChange={isReadOnly ? () => undefined : setSelectedCodes}
                      />
                    </fieldset>
                    {isStatusView && <div className="mt-6">{workflowLinks}</div>}
                  </div>
                </CabTourStep>
              </div>
            </>
          )}
        </div>

        {selectedClientId && !isStatusView && (
          <CabTourStep steps={tourSteps} stepId="action-buttons">
            <DashboardFooter
              backDisabled={
                busy ||
                (activeViewTab === 'entityData' && activeIndex === 0) ||
                (activeViewTab === 'field' && fieldPhase === 'sectors')
              }
              nextDisabled={nextDisabled}
              nextLabel={
                activeAction === 'next' && busy
                  ? t('common.loading')
                  : activeViewTab === 'documents'
                    ? isReadOnly
                      ? t('cab.applicationSubmission.backToRegister')
                      : t('accreditation.messages.submitRequest')
                    : undefined
              }
              startContent={footerStartContent}
              onBack={handleBack}
              onNext={handleNext}
              onSaveDraft={isReadOnly ? undefined : handleSaveDraft}
              saveDraftDisabled={busy || loading}
              saveDraftLoading={saving && activeAction === 'draft'}
            />
          </CabTourStep>
        )}
      </ApplicationFormContext.Provider>
    </CabLayout>
  )
}
