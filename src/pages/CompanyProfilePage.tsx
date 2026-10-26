import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/AppLayout'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { Button } from '@/components/ui/Button'
import { toast } from '@/lib/toast'
import { ProfileFormContext } from '@/components/dashboard/companyProfile/ProfileFormContext'
import { Breadcrumb, Stepper } from '@/components/dashboard/companyProfile/Primitives'
import {
  BasicDataStep,
  AddressStep,
  BranchesStep,
  OfficialDocsStep,
} from '@/components/dashboard/companyProfile/steps'
import { ProfileLoadingSkeleton } from '@/components/dashboard/companyProfile/ProfileLoadingSkeleton'
import { STEPS, type StepKey } from '@/components/dashboard/companyProfile/types'
import { isStepComplete } from '@/components/dashboard/companyProfile/validation'
import { useCompanyProfileState } from '@/components/dashboard/companyProfile/useCompanyProfileState'

export function CompanyProfilePage() {
  const { t } = useTranslation()
  const [activeStep, setActiveStep] = useState<StepKey>('basicData')
  const { contextValue, loading, saving, submitting, notification, saveDraft, submitProfile } =
    useCompanyProfileState()

  // Save / submit results are shown as toasts.
  useEffect(() => {
    if (notification) toast[notification.type](notification.message)
  }, [notification])

  const stepData = {
    form: contextValue.form,
    branches: contextValue.branches,
    documents: contextValue.documents,
  }

  const isLastStep = activeStep === STEPS[STEPS.length - 1]
  const currentStepComplete = isStepComplete(activeStep, stepData)
  const allStepsComplete = STEPS.every((step) => isStepComplete(step, stepData))

  const goNext = () => {
    const idx = STEPS.indexOf(activeStep)
    if (idx < STEPS.length - 1) setActiveStep(STEPS[idx + 1])
  }

  const goBack = () => {
    const idx = STEPS.indexOf(activeStep)
    if (idx > 0) setActiveStep(STEPS[idx - 1])
  }

  return (
    <AppLayout>
      <AccreditationHeader titleKey="companyProfile.title" />

      <ProfileFormContext.Provider value={contextValue}>
        <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto page-main">
          <Breadcrumb />

          <div className="flex flex-col gap-1">
            <h2 className="text-[24px] font-medium leading-[1.6] tracking-[-0.6px] text-neutral-900">
              {t('companyProfile.title')}
            </h2>
            <p className="text-body-lg font-light leading-[1.6] text-neutral-700">
              {t(`companyProfile.stepSubtitles.${activeStep}`)}
            </p>
          </div>

          <Stepper activeStep={activeStep} onStepClick={setActiveStep} />

          {loading ? (
            <ProfileLoadingSkeleton />
          ) : (
            <>
              {activeStep === 'basicData' && <BasicDataStep />}
              {activeStep === 'address' && <AddressStep />}
              {activeStep === 'branches' && <BranchesStep />}
              {activeStep === 'officialDocs' && <OfficialDocsStep />}
            </>
          )}
        </div>

        <footer className="flex shrink-0 flex-col gap-3 border-t border-neutral-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0 flex-1" />
          <div className="flex flex-wrap gap-3">
            <Button
              variant="tertiary"
              size="lg"
              onClick={saveDraft}
              disabled={saving || loading}
              className="min-w-[120px] flex-1 bg-primary-25 sm:min-w-[180px] sm:flex-none"
            >
              {saving ? t('common.loading') : t('companyProfile.footer.saveDraft')}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={goBack}
              disabled={activeStep === STEPS[0]}
              className="min-w-[120px] flex-1 sm:min-w-[180px] sm:flex-none"
            >
              {t('companyProfile.footer.back')}
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={isLastStep ? submitProfile : goNext}
              disabled={
                loading ||
                submitting ||
                (isLastStep ? !allStepsComplete : !currentStepComplete)
              }
              className="min-w-[120px] flex-1 sm:min-w-[180px] sm:flex-none"
            >
              {isLastStep
                ? submitting
                  ? t('common.loading')
                  : t('companyProfile.footer.submit')
                : t('companyProfile.footer.next')}
            </Button>
          </div>
        </footer>
      </ProfileFormContext.Provider>
    </AppLayout>
  )
}