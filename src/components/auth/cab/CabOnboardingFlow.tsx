import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthStepActions } from '@/components/auth/AuthStepActions'
import { OnboardingFlowShell } from '@/components/auth/OnboardingFlowShell'
import { OrgScopeTypeStep } from '@/components/auth/OrgScopeTypeStep'
import { OnboardingModulesStep } from '@/components/auth/OnboardingModulesStep'
import { CabOrgDetailsStep } from '@/components/auth/cab/CabOrgDetailsStep'
import { CabLocationStep } from '@/components/auth/cab/CabLocationStep'
import { CabAccreditationBodyStep } from '@/components/auth/cab/CabAccreditationBodyStep'
import { CabBrandingStep } from '@/components/auth/cab/CabBrandingStep'
import {
  emptyCabOnboardingForm,
  isOrgTypeStepComplete,
  isOrgDetailsStepComplete,
  isModulesStepComplete,
  isLocationStepComplete,
  isAccreditationBodyStepComplete,
  isBrandingStepComplete,
  type CabOnboardingForm,
} from '@/lib/cabOnboardingForm'
import { saveCabOnboardingProfile } from '@/lib/api/cabOnboardingApi'
import { mapOrgScopeToBackendType } from '@/lib/orgScopeBackendMapping'
import type { OrgScopeCategory } from '@/lib/api/onboardingOrgScopeApi'
import { getAuthSession } from '@/lib/authStorage'
import { markCabWorkflowTourPending } from '@/config/cabTourSequence'
import { markCabOnboardingComplete } from '@/lib/cabOnboardingStatus'
import { ROUTES } from '@/lib/routes'

type OnboardingStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export function CabOnboardingFlow() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<OnboardingStep>(0)
  const [form, setForm] = useState<CabOnboardingForm>(emptyCabOnboardingForm)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (getAuthSession()?.organization?.type !== 'CERTIFICATION_BODY') {
      navigate(ROUTES.dashboard, { replace: true })
    }
  }, [navigate])

  const patch = (f: Partial<CabOnboardingForm>) =>
    setForm((prev) => {
      const next = { ...prev, ...f }
      next.cabType = [...next.scopeAreas]
      return next
    })

  const handleFinish = async () => {
    if (isSaving) return
    setIsSaving(true)
    setSaveError(null)
    try {
      await saveCabOnboardingProfile({
        organizationType: mapOrgScopeToBackendType(form.scopeCategory as OrgScopeCategory),
        scopeCategory: form.scopeCategory,
        scopeAreas: form.scopeAreas,
        modules: form.modules,
        cabType: form.cabType.length > 0 ? form.cabType : form.scopeAreas,
        legalEntityName: form.legalEntityName,
        tradingName: form.tradingName,
        registrationNumber: form.registrationNumber,
        website: form.website,
        country: form.country,
        city: form.city,
        address: form.address,
        languages: form.languages,
        accreditationBody: form.accreditationBody,
        accreditationBodyOther: form.accreditationBodyOther,
        theme: form.theme,
        logoUrl: form.logoUrl,
        includeLogoInEmails: form.includeLogoInEmails,
        displayLogoOnCertificates: form.displayLogoOnCertificates,
        colorPaletteIndex: form.colorPaletteIndex,
        customColor: form.customColor,
      })
      const organizationId = getAuthSession()?.organization?.id
      if (organizationId) markCabOnboardingComplete(organizationId)
      markCabWorkflowTourPending()
      setStep(7)
    } catch {
      setSaveError(t('errors.generic'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleNext = () => {
    if (nextDisabled) return
    if (step === 6) {
      void handleFinish()
      return
    }
    setStep((s) => (s + 1) as OnboardingStep)
  }

  const handleBack = () => {
    if (step <= 1) return
    setStep((s) => (s - 1) as OnboardingStep)
  }

  const nextDisabled =
    step === 1
      ? !isOrgTypeStepComplete(form)
      : step === 2
        ? !isOrgDetailsStepComplete(form)
        : step === 3
          ? !isModulesStepComplete(form)
          : step === 4
            ? !isLocationStepComplete(form)
            : step === 5
              ? !isAccreditationBodyStepComplete(form)
              : step === 6
                ? !isBrandingStepComplete(form) || isSaving
                : false

  const orgDisplayName = form.tradingName || form.legalEntityName

  return (
    <OnboardingFlowShell
      step={step}
      introStep={0}
      successStep={7}
      firstFormStep={1}
      lastFormStep={6}
      wideSteps={[1, 3]}
      brandingStep={6}
      intro={{
        title: t('cab.onboarding.intro.title'),
        description: t('cab.onboarding.intro.description'),
        estimatedTimeValue: t('cab.onboarding.intro.estimatedTimeValue'),
        estimatedTimeLabel: t('cab.onboarding.intro.estimatedTimeLabel'),
        estimatedTimeDescription: t('cab.onboarding.intro.estimatedTimeDescription'),
        howItWorksLabel: t('cab.onboarding.intro.howItWorksLabel'),
        howItWorksValue: t('cab.onboarding.intro.howItWorksValue'),
        cta: t('cab.onboarding.intro.cta'),
      }}
      success={{
        title: t('cab.onboarding.success.title'),
        description: t('cab.onboarding.success.description', { name: orgDisplayName }),
        back: t('cab.onboarding.success.back'),
        cta: t('cab.onboarding.success.cta'),
      }}
      onIntroStart={() => setStep(1)}
      onSuccessBack={() => setStep(6)}
      onSuccessContinue={() => navigate(ROUTES.workspace)}
      error={saveError && step === 6 ? <p className="text-small-light text-error-700 mt-4">{saveError}</p> : null}
      actions={
        <AuthStepActions
          className="ms-auto mt-6 w-full sm:max-w-[328px]"
          onBack={handleBack}
          onNext={handleNext}
          nextLabel={step === 6 && isSaving ? t('common.saving') : t('common.next')}
          nextDisabled={nextDisabled}
          showBack
        />
      }
    >
      {step === 1 && <OrgScopeTypeStep form={form} onPatch={patch} />}
      {step === 2 && <CabOrgDetailsStep form={form} onPatch={patch} />}
      {step === 3 && <OnboardingModulesStep form={form} onPatch={patch} />}
      {step === 4 && <CabLocationStep form={form} onPatch={patch} />}
      {step === 5 && <CabAccreditationBodyStep form={form} onPatch={patch} />}
      {step === 6 && <CabBrandingStep form={form} onPatch={patch} />}
    </OnboardingFlowShell>
  )
}
