import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthStepActions } from '@/components/auth/AuthStepActions'
import { OnboardingFlowShell } from '@/components/auth/OnboardingFlowShell'
import { OrgScopeTypeStep } from '@/components/auth/OrgScopeTypeStep'
import { OnboardingModulesStep } from '@/components/auth/OnboardingModulesStep'
import { AuditeeOrgDetailsStep } from '@/components/auth/auditee/AuditeeOrgDetailsStep'
import { AuditeeLocationStep } from '@/components/auth/auditee/AuditeeLocationStep'
import { AuditeeBrandingStep } from '@/components/auth/auditee/AuditeeBrandingStep'
import {
  emptyAuditeeOnboardingForm,
  isOrgTypeStepComplete,
  isOrgDetailsStepComplete,
  isModulesStepComplete,
  isLocationStepComplete,
  isBrandingStepComplete,
  type AuditeeOnboardingForm,
} from '@/lib/auditeeOnboardingForm'
import { saveAuditeeOnboardingProfile } from '@/lib/api/auditeeOnboardingApi'
import { mapOrgScopeToBackendType } from '@/lib/orgScopeBackendMapping'
import type { OrgScopeCategory } from '@/lib/api/onboardingOrgScopeApi'
import { getAuthSession } from '@/lib/authStorage'
import { markAuditeeOnboardingComplete } from '@/lib/auditeeOnboardingStatus'
import { ROUTES } from '@/lib/routes'

type OnboardingStep = 0 | 1 | 2 | 3 | 4 | 5 | 6

export function AuditeeOnboardingFlow() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<OnboardingStep>(0)
  const [form, setForm] = useState<AuditeeOnboardingForm>(emptyAuditeeOnboardingForm)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (getAuthSession()?.organization?.type !== 'CONSULTATION_BODY') {
      navigate(ROUTES.dashboard, { replace: true })
    }
  }, [navigate])

  const patch = (f: Partial<AuditeeOnboardingForm>) => setForm((prev) => ({ ...prev, ...f }))

  const handleFinish = async () => {
    if (isSaving) return
    setIsSaving(true)
    setSaveError(null)
    try {
      await saveAuditeeOnboardingProfile({
        organizationType: mapOrgScopeToBackendType(form.scopeCategory as OrgScopeCategory),
        scopeCategory: form.scopeCategory,
        scopeAreas: form.scopeAreas,
        modules: form.modules,
        legalEntityName: form.legalEntityName,
        tradingName: form.tradingName,
        registrationNumber: form.registrationNumber,
        website: form.website,
        country: form.country,
        city: form.city,
        address: form.address,
        languages: form.languages,
        theme: form.theme,
        logoUrl: form.logoUrl,
        includeLogoInEmails: form.includeLogoInEmails,
        displayLogoOnCertificates: form.displayLogoOnCertificates,
        colorPaletteIndex: form.colorPaletteIndex,
        customColor: form.customColor,
      })
      const organizationId = getAuthSession()?.organization?.id
      if (organizationId) markAuditeeOnboardingComplete(organizationId)
      setStep(6)
    } catch {
      setSaveError(t('errors.generic'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleNext = () => {
    if (step === 5) {
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
              ? !isBrandingStepComplete(form) || isSaving
              : false

  const orgDisplayName = form.tradingName || form.legalEntityName

  return (
    <OnboardingFlowShell
      step={step}
      introStep={0}
      successStep={6}
      firstFormStep={1}
      lastFormStep={5}
      wideSteps={[1, 3]}
      brandingStep={5}
      intro={{
        title: t('auditee.onboarding.intro.title'),
        description: t('auditee.onboarding.intro.description'),
        estimatedTimeValue: t('auditee.onboarding.intro.estimatedTimeValue'),
        estimatedTimeLabel: t('auditee.onboarding.intro.estimatedTimeLabel'),
        estimatedTimeDescription: t('auditee.onboarding.intro.estimatedTimeDescription'),
        howItWorksLabel: t('auditee.onboarding.intro.howItWorksLabel'),
        howItWorksValue: t('auditee.onboarding.intro.howItWorksValue'),
        cta: t('auditee.onboarding.intro.cta'),
      }}
      success={{
        title: t('auditee.onboarding.success.title'),
        description: t('auditee.onboarding.success.description', { name: orgDisplayName }),
        back: t('auditee.onboarding.success.back'),
        cta: t('auditee.onboarding.success.cta'),
      }}
      onIntroStart={() => setStep(1)}
      onSuccessBack={() => setStep(5)}
      onSuccessContinue={() => navigate(ROUTES.dashboard)}
      error={saveError && step === 5 ? <p className="text-small-light text-error-700 mt-4">{saveError}</p> : null}
      actions={
        <AuthStepActions
          className="ms-auto mt-6 w-full sm:max-w-[328px]"
          onBack={handleBack}
          onNext={handleNext}
          nextLabel={step === 5 && isSaving ? t('common.saving') : t('common.next')}
          nextDisabled={nextDisabled}
          showBack
        />
      }
    >
      {step === 1 && <OrgScopeTypeStep form={form} onPatch={patch} />}
      {step === 2 && <AuditeeOrgDetailsStep form={form} onPatch={patch} />}
      {step === 3 && <OnboardingModulesStep form={form} onPatch={patch} />}
      {step === 4 && <AuditeeLocationStep form={form} onPatch={patch} />}
      {step === 5 && <AuditeeBrandingStep form={form} onPatch={patch} />}
    </OnboardingFlowShell>
  )
}
