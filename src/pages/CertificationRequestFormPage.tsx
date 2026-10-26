import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useValuesChanged } from '@/hooks/useValuesChanged'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { DashboardFooter } from '@/components/dashboard/DashboardFooter'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
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
import type { FieldPhase, SectorKey, StandardKey } from '@/components/dashboard/entityData/fieldTypes'
import { isSectionComplete } from '@/components/dashboard/entityData/applicationValidation'
import { useApplicationState } from '@/components/dashboard/entityData/useApplicationState'
import { ProcessStepper } from '@/components/dashboard/ProcessStepper'
import { AppLayout } from '@/components/layout/AppLayout'
import { ErrorState } from '@/components/ui'
import { toast } from '@/lib/toast'
import { useCertificationRequestFormTourSteps } from '@/config/auditeeTourSteps'
import { TourProvider } from '@/context/tour/TourProvider'
import { ROUTES } from '@/lib/routes'
import { isAuditClientSession } from '@/lib/authStorage'

const STATUS_VIEWS: EntityDataViewTab[] = ['approved', 'underReview', 'rejected']

const viewTabCopyKeys: Record<EntityDataViewTab, { title: string; subtitle: string }> = {
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
  feedback: {
    title: 'accreditation.entityData.feedback.pageTitle',
    subtitle: 'accreditation.entityData.feedback.pageSubtitle',
  },
  approved: { title: '', subtitle: '' },
  underReview: { title: '', subtitle: '' },
  rejected: { title: '', subtitle: '' },
}

export function CertificationRequestFormPage() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'
  const navigate = useNavigate()
  const tourSteps = useCertificationRequestFormTourSteps()
  const [activeSubSection, setActiveSubSection] = useState<EntityDataSubSection>('legalIdentity')
  const [activeViewTab, setActiveViewTab] = useState<EntityDataViewTab>('entityData')
  const [fieldPhase, setFieldPhase] = useState<FieldPhase>('sectors')
  // Which footer button triggered the in-flight save, so only that button
  // shows the loading state (Next and Save draft both call saveDraft)
  const [activeAction, setActiveAction] = useState<'next' | 'draft' | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const { contextValue, loading, saving, submitting, status, orderNumber, notification, loadError, reload, saveDraft, submit } =
    useApplicationState()
  const { form, update } = contextValue
  const [searchParams] = useSearchParams()
  const requestedView = searchParams.get('view')
  // Keeps the skeleton up until the landing tab is decided, so the form
  // chrome never flashes before switching to a status/feedback view
  const [viewReady, setViewReady] = useState(!searchParams.get('id'))

  // Land on the tab the listing asked for: "feedback" (follow up) opens the
  // feedback tab for submitted applications; a draft under construction opens
  // on the first form tab instead so the user can continue filling it
  // (Decided during render whenever loading/status/requested view change.)
  const landingInputsChanged = useValuesChanged([loading, requestedView, status])
  if (landingInputsChanged && !loading) {
    if (requestedView === 'feedback' && status !== 'DRAFT') {
      setActiveViewTab('feedback')
    } else if (status === 'SUBMITTED' || status === 'UNDER_REVIEW') {
      setActiveViewTab('underReview')
    } else if (status === 'APPROVED') {
      setActiveViewTab('approved')
    } else if (status === 'REJECTED') {
      setActiveViewTab('rejected')
    }
    setViewReady(true)
  }

  const selectedSectors = form.selectedSectors
  const selectedStandards = form.selectedStandards
  const setSelectedSectors = useCallback(
    (standard: StandardKey, sectors: SectorKey[]) =>
      update('selectedSectors', { ...form.selectedSectors, [standard]: sectors }),
    [form.selectedSectors, update]
  )
  const setSelectedStandards = useCallback(
    (standards: StandardKey[]) => update('selectedStandards', standards),
    [update]
  )
  const setSelectedCodes = useCallback(
    (codes: Record<string, string[]>) => update('selectedCodes', codes),
    [update]
  )

  const activeIndex = subSections.indexOf(activeSubSection)
  const copyKeys =
    activeViewTab === 'field' && fieldPhase === 'codes'
      ? {
          title: 'accreditation.entityData.field.codesTitle',
          subtitle: 'accreditation.entityData.field.pageSubtitle',
        }
      : viewTabCopyKeys[activeViewTab]

  const scrollToContent = useCallback(() => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleSubSectionChange = useCallback(
    (section: EntityDataSubSection) => {
      setActiveSubSection(section)
      scrollToContent()
    },
    [scrollToContent]
  )

  const handleViewTabChange = useCallback(
    (tab: EntityDataViewTab) => {
      setActiveViewTab(tab)
      if (tab !== 'field') {
        setFieldPhase('sectors')
      }
      scrollToContent()
    },
    [scrollToContent]
  )

  const handleBack = useCallback(() => {
    if (activeViewTab === 'field' && fieldPhase === 'codes') {
      setFieldPhase('sectors')
      scrollToContent()
      return
    }

    if (activeViewTab === 'feedback') {
      handleViewTabChange('documents')
      return
    }

    if (activeViewTab === 'documents') {
      handleViewTabChange('field')
      return
    }

    if (activeViewTab === 'field') {
      handleViewTabChange('entityData')
      return
    }

    if (activeIndex <= 0) return
    handleSubSectionChange(subSections[activeIndex - 1])
  }, [activeIndex, activeViewTab, fieldPhase, handleSubSectionChange, handleViewTabChange, scrollToContent])

  const handleNext = useCallback(async () => {
    setActiveAction('next')
    try {
      // The last form step submits the whole application instead of advancing
      if (activeViewTab === 'documents') {
        const submitted = await submit()
        if (submitted) handleViewTabChange('underReview')
        return
      }

      // Feedback is a terminal view — Next returns to the requests list
      if (activeViewTab === 'feedback') {
        // Audit clients come from the portal and go back to its applications list.
        navigate(isAuditClientSession() ? ROUTES.portalApplications : ROUTES.certificationRequests)
        return
      }

      // Every other step persists the draft before moving on
      const saved = await saveDraft()
      if (!saved) return

      if (activeViewTab === 'field' && fieldPhase === 'sectors') {
        setFieldPhase('codes')
        scrollToContent()
        return
      }

      if (activeViewTab === 'field' && fieldPhase === 'codes') {
        handleViewTabChange('documents')
        return
      }

      if (activeViewTab === 'entityData') {
        if (activeIndex >= subSections.length - 1) {
          handleViewTabChange('field')
          return
        }
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
    navigate,
    saveDraft,
    scrollToContent,
    submit,
  ])

  const handleSaveDraftClick = useCallback(async () => {
    setActiveAction('draft')
    try {
      await saveDraft()
    } finally {
      setActiveAction(null)
    }
  }, [saveDraft])

  const isFieldSectorsView = activeViewTab === 'field' && fieldPhase === 'sectors'
  const isStatusView = STATUS_VIEWS.includes(activeViewTab)
  const busy = saving || submitting

  // Submit validation requires every chosen standard to have at least one
  // sector and at least one IAF code of its own
  const standardsMissingSectors = selectedStandards.filter(
    (standard) => (selectedSectors[standard] ?? []).length === 0
  )
  const standardsMissingCodes = selectedStandards.filter(
    (standard) =>
      !Object.entries(form.selectedCodes).some(
        ([key, codes]) => key.startsWith(`${standard}:`) && codes.length > 0
      )
  )
  const anySectorSelected = Object.values(selectedSectors).some(
    (sectors) => sectors.length > 0
  )

  const footerBackDisabled =
    busy ||
    isStatusView ||
    (activeViewTab === 'entityData' && activeIndex === 0) ||
    (activeViewTab === 'field' && fieldPhase === 'sectors')

  const footerSaveDraftDisabled = busy || loading || isStatusView

  const footerNextDisabled =
    busy ||
    loading ||
    isStatusView ||
    (activeViewTab === 'entityData' && !isSectionComplete(activeSubSection, form)) ||
    (activeViewTab === 'field' &&
      fieldPhase === 'sectors' &&
      (!anySectorSelected || standardsMissingSectors.length > 0)) ||
    (activeViewTab === 'field' && fieldPhase === 'codes' && standardsMissingCodes.length > 0) ||
    (activeViewTab === 'documents' && !form.agreed)

  const footerNextLabel =
    busy && activeAction === 'next'
      ? t('common.loading')
      : activeViewTab === 'documents'
        ? t('accreditation.messages.submitRequest')
        : undefined

  const standardLabel = (standard: StandardKey) =>
    t(`accreditation.entityData.field.standards.${standard}`)
  const listSeparator = isRTL ? '، ' : ', '
  const missingHint =
    activeViewTab === 'field' && fieldPhase === 'sectors' && standardsMissingSectors.length > 0
      ? t('accreditation.entityData.field.missingSectorsHint', {
          standards: standardsMissingSectors.map(standardLabel).join(listSeparator),
        })
      : activeViewTab === 'field' && fieldPhase === 'codes' && standardsMissingCodes.length > 0
        ? t('accreditation.entityData.field.missingCodesHint', {
            standards: standardsMissingCodes.map(standardLabel).join(listSeparator),
          })
        : null

  // Save / submit results are shown as toasts instead of inside the footer.
  useEffect(() => {
    if (notification) toast[notification.type](notification.message)
  }, [notification])

  const footerStartContent = missingHint ? (
    <div className="flex min-w-0 flex-wrap items-center gap-3">
      {isFieldSectorsView && (
        <FieldSelectionSummary
          selectedSectors={[...new Set(Object.values(selectedSectors).flat())]}
        />
      )}
      <p className="min-w-0 rounded-md bg-warning-50 px-3 py-1.5 text-body-sm font-medium text-warning-700">
        {missingHint}
      </p>
    </div>
  ) : isFieldSectorsView ? (
    <FieldSelectionSummary
      selectedSectors={[...new Set(Object.values(selectedSectors).flat())]}
    />
  ) : undefined

  return (
    <TourProvider tourId="certification-request-form" steps={tourSteps}>
      <AppLayout>
        <ApplicationFormContext.Provider value={contextValue}>
          <DashboardTourStep steps={tourSteps} stepId="form-header">
            {/* Only the server assigns an order number (on submit); until then the request is "New request". */}
            <AccreditationHeader
              orderNumber={orderNumber ?? t('certificationRequestForm.newRequest', 'New request')}
            />
          </DashboardTourStep>
          <ProcessStepper activeStep={0} />

          <div ref={contentRef} className="flex flex-1 flex-col gap-5 overflow-auto page-main">
            {loadError ? (
              <div className="flex flex-1 items-center justify-center rounded-lg border border-neutral-100 bg-white p-5">
                <ErrorState
                  variant={loadError === 'rateLimit' ? 'rateLimit' : 'generic'}
                  title={loadError === 'rateLimit' ? t('errors.rateLimit.title') : undefined}
                  description={
                    loadError === 'rateLimit'
                      ? t('errors.rateLimit.description')
                      : loadError === 'notFound' || loadError === 'forbidden' || loadError === 'network'
                        ? t(`errors.${loadError}`)
                        : undefined
                  }
                  onRetry={reload}
                />
              </div>
            ) : loading || !viewReady ? (
              <div className="flex-1 rounded-lg border border-neutral-100 bg-white p-5">
                <ApplicationLoadingSkeleton />
              </div>
            ) : (
              <>
                {!isStatusView && copyKeys.title && (
                  <div className="space-y-2">
                    <h2 className="text-h3-semi text-neutral-900">{t(copyKeys.title)}</h2>
                    <p className={`text-body-2 text-neutral-700${isRTL ? ' font-normal' : ''}`}>{t(copyKeys.subtitle)}</p>
                  </div>
                )}

                <div className="flex flex-1 gap-5">
                  {!isStatusView && (
                    <EntityDataNav
                      activeSubSection={activeSubSection}
                      activeViewTab={activeViewTab}
                      onSubSectionChange={handleSubSectionChange}
                      onViewTabChange={handleViewTabChange}
                    />
                  )}
                  <div className="min-w-0 flex-1 rounded-lg border border-neutral-100 bg-white p-5">
                    <EntityDataForm
                      section={activeSubSection}
                      viewTab={activeViewTab}
                      fieldPhase={fieldPhase}
                      selectedSectors={selectedSectors}
                      onSelectedSectorsChange={setSelectedSectors}
                      selectedStandards={selectedStandards}
                      onSelectedStandardsChange={setSelectedStandards}
                      selectedCodes={form.selectedCodes}
                      onSelectedCodesChange={setSelectedCodes}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <DashboardFooter
            backDisabled={footerBackDisabled}
            nextDisabled={footerNextDisabled}
            nextLabel={footerNextLabel}
            startContent={footerStartContent}
            onBack={handleBack}
            onNext={handleNext}
            onSaveDraft={handleSaveDraftClick}
            saveDraftDisabled={footerSaveDraftDisabled}
            saveDraftLoading={saving && activeAction === 'draft'}
          />
        </ApplicationFormContext.Provider>
      </AppLayout>
    </TourProvider>
  )
}