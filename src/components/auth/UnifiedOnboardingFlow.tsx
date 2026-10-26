import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthStepActions } from '@/components/auth/AuthStepActions'
import { OnboardingFlowShell } from '@/components/auth/OnboardingFlowShell'
import { OrgScopeTypeStep } from '@/components/auth/OrgScopeTypeStep'
import { OnboardingModulesStep } from '@/components/auth/OnboardingModulesStep'
import { AbProfileStep } from '@/components/auth/ab/setup/AbProfileStep'
import { AbLocationsStep } from '@/components/auth/ab/setup/AbLocationsStep'
import { AbRecognitionStatusStep } from '@/components/auth/ab/setup/AbRecognitionStatusStep'
import { AbRecognitionRecordsStep } from '@/components/auth/ab/setup/AbRecognitionRecordsStep'
import { AbProgrammesStep } from '@/components/auth/ab/setup/AbProgrammesStep'
import { AbProgrammeScopeStep } from '@/components/auth/ab/setup/AbProgrammeScopeStep'
import { AbSymbolsStep } from '@/components/auth/ab/setup/AbSymbolsStep'
import { AbCertificateStep } from '@/components/auth/ab/setup/AbCertificateStep'
import { AbKeyRolesStep } from '@/components/auth/ab/setup/AbKeyRolesStep'
import { AbReviewActivateStep } from '@/components/auth/ab/setup/AbReviewActivateStep'
import { AbOrgDetailsStep } from '@/components/auth/ab/AbOrgDetailsStep'
import { AbLocationStep } from '@/components/auth/ab/AbLocationStep'
import { AbBrandingStep } from '@/components/auth/ab/AbBrandingStep'
import { IaProfileStep } from '@/components/auth/ia/setup/IaProfileStep'
import { IaStructureStep } from '@/components/auth/ia/setup/IaStructureStep'
import { IaUniverseStep } from '@/components/auth/ia/setup/IaUniverseStep'
import { IaCriteriaStep } from '@/components/auth/ia/setup/IaCriteriaStep'
import { IaRiskStep } from '@/components/auth/ia/setup/IaRiskStep'
import { IaProgrammeStep } from '@/components/auth/ia/setup/IaProgrammeStep'
import { IaFindingsStep } from '@/components/auth/ia/setup/IaFindingsStep'
import { IaTemplatesStep } from '@/components/auth/ia/setup/IaTemplatesStep'
import { IaRolesStep } from '@/components/auth/ia/setup/IaRolesStep'
import { IaReviewActivateStep } from '@/components/auth/ia/setup/IaReviewActivateStep'
import { SoProfileStep } from '@/components/auth/so/setup/SoProfileStep'
import { SoLocationStep } from '@/components/auth/so/setup/SoLocationStep'
import { SoFamiliesStep } from '@/components/auth/so/setup/SoFamiliesStep'
import { SoSchemesStep } from '@/components/auth/so/setup/SoSchemesStep'
import { SoActivitiesStep } from '@/components/auth/so/setup/SoActivitiesStep'
import { SoScopeStep } from '@/components/auth/so/setup/SoScopeStep'
import { SoApprovalStep } from '@/components/auth/so/setup/SoApprovalStep'
import { SoMarksStep } from '@/components/auth/so/setup/SoMarksStep'
import { SoRolesStep } from '@/components/auth/so/setup/SoRolesStep'
import { SoReviewActivateStep } from '@/components/auth/so/setup/SoReviewActivateStep'
import { SaProfileStep } from '@/components/auth/sa/setup/SaProfileStep'
import { SaLocationsStep } from '@/components/auth/sa/setup/SaLocationsStep'
import { SaCategoriesStep } from '@/components/auth/sa/setup/SaCategoriesStep'
import { SaRiskStep } from '@/components/auth/sa/setup/SaRiskStep'
import { SaQualificationStep } from '@/components/auth/sa/setup/SaQualificationStep'
import { SaAuditTypesStep } from '@/components/auth/sa/setup/SaAuditTypesStep'
import { SaScoringStep } from '@/components/auth/sa/setup/SaScoringStep'
import { SaFindingsStep } from '@/components/auth/sa/setup/SaFindingsStep'
import { SaRolesStep } from '@/components/auth/sa/setup/SaRolesStep'
import { SaReviewActivateStep } from '@/components/auth/sa/setup/SaReviewActivateStep'
import { CabProfileStep } from '@/components/auth/cab/setup/CabProfileStep'
import { CabLocationsStep } from '@/components/auth/cab/setup/CabLocationsStep'
import { CabAccreditationStatusStep } from '@/components/auth/cab/setup/CabAccreditationStatusStep'
import { CabAccreditationRecordsStep } from '@/components/auth/cab/setup/CabAccreditationRecordsStep'
import { CabSchemesServicesStep } from '@/components/auth/cab/setup/CabSchemesServicesStep'
import { CabScopeStep } from '@/components/auth/cab/setup/CabScopeStep'
import { CabMarksStep } from '@/components/auth/cab/setup/CabMarksStep'
import { CabCertificateStep } from '@/components/auth/cab/setup/CabCertificateStep'
import { CabReviewActivateStep } from '@/components/auth/cab/setup/CabReviewActivateStep'
import { CabSetupShell } from '@/components/auth/cab/setup/CabSetupShell'
import { AuditeeOrgDetailsStep } from '@/components/auth/auditee/AuditeeOrgDetailsStep'
import { AuditeeLocationStep } from '@/components/auth/auditee/AuditeeLocationStep'
import { AuditeeBrandingStep } from '@/components/auth/auditee/AuditeeBrandingStep'
import { OnboardingSummaryStep } from '@/components/auth/OnboardingSummaryStep'
import { saveOrganizationProfile } from '@/lib/api/organizationProfileApi'
import { completeCabSetup, getCabProfile, saveCabSetupDraft } from '@/lib/api/cabApi'
import { ApiError } from '@/lib/api/client'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { toast } from '@/lib/toast'
import { completePendingRegistration, completePendingCabRegistration } from '@/lib/completePendingRegistration'
import { clearPendingRegistration, hasPendingRegistration, loadPendingRegistration } from '@/lib/pendingRegistrationStorage'
import type { OrgScopeCategory } from '@/lib/api/onboardingOrgScopeApi'
import type { OrganizationType } from '@/lib/api/authApi'
import { getAuthSession, getAuthToken, getPostLoginRedirect, patchAuthOrganizationType, patchCabSetupCompleted } from '@/lib/authStorage'
import { mergeCabProfileIntoForm, mapFormToCabSetupDraft } from '@/lib/cabSetupMapper'
import { markCabWorkflowTourPending } from '@/config/cabTourSequence'
import { getCabId, isCabAdminSession, markCabOnboardingComplete } from '@/lib/cabOnboardingStatus'
import { clearOnboardingDraft, loadOnboardingDraft, saveOnboardingDraft } from '@/lib/onboardingDraftStorage'
import { mapOrgScopeToBackendType } from '@/lib/orgScopeBackendMapping'
import { markOnboardingComplete } from '@/lib/onboardingStatus'
import { ROUTES } from '@/lib/routes'
import {
  emptyUnifiedOnboardingForm,
  isBrandingStepComplete,
  isLocationStepComplete,
  isModulesStepComplete,
  isOrgDetailsStepComplete,
  isOrgTypeStepComplete,
  isSharedWebsiteValid,
  syncCabTypeFromScopeAreas,
  syncAbTypeFromScopeAreas,
  scopeCategoryToEntityType,
  type UnifiedOnboardingForm,
} from '@/lib/unifiedOnboardingForm'
import {
  emptySoSetupForm,
  isSoActivitiesStepComplete,
  isSoApprovalStepComplete,
  isSoFamiliesStepComplete,
  isSoLocationStepComplete,
  isSoMarksStepComplete,
  isSoProfileStepComplete,
  isSoRolesStepComplete,
  isSoSchemesStepComplete,
  isSoScopeStepComplete,
  type SoSetupForm,
} from '@/lib/soSetupForm'
import {
  emptySaSetupForm,
  isSaAuditTypesStepComplete,
  isSaCategoriesStepComplete,
  isSaFindingsStepComplete,
  isSaLocationsStepComplete,
  isSaProfileStepComplete,
  isSaQualificationStepComplete,
  isSaRiskStepComplete,
  isSaRolesStepComplete,
  isSaScoringStepComplete,
  type SaSetupForm,
} from '@/lib/saSetupForm'
import {
  emptyIaSetupForm,
  isIaCriteriaStepComplete,
  isIaFindingsStepComplete,
  isIaProfileStepComplete,
  isIaProgrammeStepComplete,
  isIaRiskStepComplete,
  isIaRolesStepComplete,
  isIaStructureStepComplete,
  isIaTemplatesStepComplete,
  isIaUniverseStepComplete,
  type IaSetupForm,
} from '@/lib/iaSetupForm'
import {
  emptyAbSetupForm,
  isAbCertificateStepComplete,
  isAbKeyRolesStepComplete,
  isAbLocationsStepComplete,
  isAbProfileStepComplete,
  isAbProgrammesStepComplete,
  isAbRecognitionRecordsStepComplete,
  isAbRecognitionStatusStepComplete,
  isAbScopeStepComplete,
  isAbSymbolsStepComplete,
  type AbSetupForm,
} from '@/lib/abSetupForm'
import {
  emptyCabSetupForm,
  hydratePrimaryContactPhoneFields,
  normalizeCabSetupForm,
  parsePrimaryContactPhone,
  isAccreditationRecordsStepComplete,
  isAccreditationStatusStepComplete,
  isCabSetupReadyToActivate,
  isCertificateStepComplete,
  isLocationsStepComplete,
  isMarksStepComplete,
  isProfileStepComplete,
  isSchemesStepComplete,
  isScopeStepComplete,
  type CabSetupForm,
} from '@/lib/cabSetupForm'

function syncBackendOrganizationType(scopeCategory: OrgScopeCategory): OrganizationType {
  const backendType = mapOrgScopeToBackendType(scopeCategory)
  patchAuthOrganizationType(backendType)
  return backendType
}

type SetupDeck = 'cab' | 'ab' | 'ia' | 'so' | 'sa'

/**
 * Which 10-screen deck a scope category runs, or null for the short route.
 * Keyed on scope category, not backend entity type — Scheme Owner shares
 * ACCREDITATION_BODY and Supplier Audits shares CONSULTATION_BODY, and neither
 * has a deck of its own.
 */
function getSetupDeck(scopeCategory: OrgScopeCategory | ''): SetupDeck | null {
  switch (scopeCategory) {
    case 'CONFORMITY_ASSESSMENT_BODY':
      return 'cab'
    case 'ACCREDITATION_BODY':
      return 'ab'
    case 'INTERNAL_AUDITS':
      return 'ia'
    case 'SCHEME_OWNER':
      return 'so'
    case 'SUPPLIER_AUDITS':
      return 'sa'
    default:
      return null
  }
}

/**
 * The CAB path runs 9 setup screens from the CAB onboarding deck at steps 2-10
 * (step 1 is always the shared org-scope picker). Other entity types keep the
 * shorter details → modules → location → branding → summary route.
 */
const CAB_SETUP_SCREEN_COUNT = 9
const CAB_FIRST_SETUP_STEP = 2
const CAB_REVIEW_STEP = CAB_FIRST_SETUP_STEP + CAB_SETUP_SCREEN_COUNT - 1 // 10

/** i18n namespace per CAB setup screen, in deck order — drives the shell heading. */
const CAB_SETUP_SCREEN_KEYS = [
  'profile',
  'locations',
  'accreditationStatus',
  'accreditationRecords',
  'schemes',
  'scope',
  'marks',
  'certificate',
  'review',
] as const

/** i18n namespace per AB setup screen, in deck order. */
const AB_SETUP_SCREEN_KEYS = [
  'profile',
  'locations',
  'recognitionStatus',
  'recognitionRecords',
  'programmes',
  'scope',
  'symbols',
  'certificate',
  'roles',
  'review',
] as const

/** i18n namespace per Internal Audit setup screen, in deck order. */
const IA_SETUP_SCREEN_KEYS = [
  'profile',
  'structure',
  'universe',
  'criteria',
  'risk',
  'programme',
  'findings',
  'templates',
  'roles',
  'review',
] as const

/** i18n namespace per Scheme Owner setup screen, in deck order. */
const SO_SETUP_SCREEN_KEYS = [
  'profile',
  'location',
  'families',
  'schemes',
  'activities',
  'scope',
  'approval',
  'marks',
  'roles',
  'review',
] as const

/** i18n namespace per Supplier Audit setup screen, in deck order. */
const SA_SETUP_SCREEN_KEYS = [
  'profile',
  'locations',
  'categories',
  'risk',
  'qualification',
  'auditTypes',
  'scoring',
  'findings',
  'roles',
  'review',
] as const

function getBrandingStep(deck: SetupDeck | null) {
  return deck ? 8 : 5
}

function getSummaryStep(deck: SetupDeck | null) {
  return deck ? CAB_REVIEW_STEP : getBrandingStep(deck) + 1
}

function getSuccessStep(deck: SetupDeck | null) {
  return getSummaryStep(deck) + 1
}

function getRegistrationEmail(): string {
  return (
    getAuthSession()?.user?.email?.trim() ||
    loadPendingRegistration()?.email?.trim() ||
    ''
  )
}

function getRegistrationPrimaryContactPhone(): string {
  return (
    getAuthSession()?.user?.phone?.trim() ||
    loadPendingRegistration()?.phone?.trim() ||
    ''
  )
}

function withRegistrationEmail<T extends { primaryContactEmail: string }>(setup: T): T {
  if (setup.primaryContactEmail.trim()) return setup
  const email = getRegistrationEmail()
  return email ? { ...setup, primaryContactEmail: email } : setup
}

function withRegistrationCabContactDefaults(
  cabSetup: UnifiedOnboardingForm['cabSetup'],
): UnifiedOnboardingForm['cabSetup'] {
  let next = withRegistrationEmail(hydratePrimaryContactPhoneFields(normalizeCabSetupForm(cabSetup)))

  if (!next.primaryContactPhoneNumber.trim()) {
    const registrationPhone = getRegistrationPrimaryContactPhone()
    if (registrationPhone) {
      const parsed = parsePrimaryContactPhone(registrationPhone)
      next = hydratePrimaryContactPhoneFields({
        ...next,
        primaryContactPhoneCountryCode: parsed.countryCode,
        primaryContactPhoneNumber: parsed.number,
        primaryContactPhone: registrationPhone,
      })
    }
  }

  return next
}

function withRegistrationAbContactDefaults(
  abSetup: UnifiedOnboardingForm['abSetup'],
): UnifiedOnboardingForm['abSetup'] {
  let next = withRegistrationEmail(abSetup)
  if (!next.primaryContactPhone.trim()) {
    const phone = getRegistrationPrimaryContactPhone()
    if (phone) next = { ...next, primaryContactPhone: phone }
  }
  return next
}

function getDraftKey(): string {
  const session = getAuthSession()
  const orgId = session?.organization?.id
  if (orgId) return orgId

  const cabId = getCabId()
  if (cabId) return cabId

  const userEmail = session?.user?.email?.trim()
  if (userEmail) return `user_${userEmail}`

  const pendingEmail = loadPendingRegistration()?.email?.trim()
  if (pendingEmail) return `pending_${pendingEmail}`

  return 'anonymous'
}

function createInitialState(): { form: UnifiedOnboardingForm; step: number } {
  const draftKey = getDraftKey()
  const draftResult = loadOnboardingDraft(draftKey)
  const draft = draftResult?.form ?? null
  const savedStep = draftResult?.step ?? 0

  const scopeCategory = draft?.scopeCategory ?? ''
  const sessionType = getAuthSession()?.organization?.type
  const entityType =
    scopeCategory !== ''
      ? scopeCategoryToEntityType(scopeCategory as OrgScopeCategory)
      : draft?.entityType ||
        (sessionType && sessionType !== 'AUDIT_CLIENT' ? sessionType : '') ||
        ''

  const initialForm: UnifiedOnboardingForm = {
    ...emptyUnifiedOnboardingForm,
    ...draft,
    entityType,
    scopeCategory,
    scopeAreas: draft?.scopeAreas ?? [],
    modules: draft?.modules ?? [],
    cabType: draft?.cabType ?? draft?.scopeAreas ?? [],
    abType: draft?.abType ?? draft?.scopeAreas ?? [],
    logoUrl: draft?.logoUrl ?? null,
    // Older drafts predate the CAB setup block — merge so new keys get defaults.
    cabSetup: withRegistrationCabContactDefaults({
      ...emptyCabSetupForm,
      ...draft?.cabSetup,
    }),
    abSetup: withRegistrationAbContactDefaults({ ...emptyAbSetupForm, ...draft?.abSetup }),
    iaSetup: withRegistrationEmail({ ...emptyIaSetupForm, ...draft?.iaSetup }),
    soSetup: withRegistrationEmail({ ...emptySoSetupForm, ...draft?.soSetup }),
    saSetup: withRegistrationEmail({ ...emptySaSetupForm, ...draft?.saSetup }),
  }

  return {
    form: initialForm,
    step: savedStep,
  }
}

export function UnifiedOnboardingFlow() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [initial] = useState(createInitialState)
  const [step, setStep] = useState(initial.step)
  const [form, setForm] = useState<UnifiedOnboardingForm>(initial.form)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingFocusFieldId, setPendingFocusFieldId] = useState<string | null>(null)
  /** True when the user was already logged in before this onboarding session started. */
  const hadAuthAtStartRef = useRef(Boolean(getAuthToken()))

  const draftKey = getDraftKey()
  const deck = getSetupDeck(form.scopeCategory as OrgScopeCategory | '')

  useEffect(() => {
    if (getAuthToken()) {
      clearPendingRegistration()
    }
  }, [])

  useEffect(() => {
    if (!pendingFocusFieldId) return
    const timer = window.setTimeout(() => {
      const root = document.getElementById(pendingFocusFieldId)
      if (root) {
        root.scrollIntoView({ behavior: 'smooth', block: 'center' })
        const focusable = root.matches('input,textarea,select,button,[tabindex]')
          ? root
          : root.querySelector<HTMLElement>('input,textarea,select,button,[tabindex]')
        ;(focusable ?? root).focus?.()
      }
      setPendingFocusFieldId(null)
    }, 200)
    return () => window.clearTimeout(timer)
  }, [step, pendingFocusFieldId])

  useEffect(() => {
    if (!getAuthToken() || !isCabAdminSession()) return

    let cancelled = false
    void (async () => {
      try {
        const { cab } = await getCabProfile()
        if (cancelled) return

        if (cab.setupCompleted) {
          patchCabSetupCompleted(true)
          return
        }

        setForm((prev) => {
          const merged = mergeCabProfileIntoForm(prev, cab)
          const next =
            merged.scopeCategory
              ? merged
              : {
                  ...merged,
                  scopeCategory: 'CONFORMITY_ASSESSMENT_BODY' as const,
                  entityType: 'CERTIFICATION_BODY' as const,
                  scopeAreas:
                    merged.cabSetup.activities.length > 0 ? merged.cabSetup.activities : merged.scopeAreas,
                }

          return {
            ...next,
            cabSetup: withRegistrationCabContactDefaults(next.cabSetup),
          }
        })
      } catch {
        // Keep the local draft when the profile cannot be loaded yet.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!draftKey) return
    saveOnboardingDraft(draftKey, form, step)
  }, [form, step, draftKey])

  const patch = (fields: Partial<UnifiedOnboardingForm>) => {
    setForm((prev) => {
      const next = { ...prev, ...fields }

      if ('scopeCategory' in fields) {
        next.entityType = fields.scopeCategory
          ? mapOrgScopeToBackendType(fields.scopeCategory)
          : ''
      }

      next.cabType = syncCabTypeFromScopeAreas(next)
      next.abType = syncAbTypeFromScopeAreas(next)

      // The CAB activity on setup screen 1 starts from whatever the org-scope
      // screen selected, so the user confirms rather than re-picks it.
      if ('scopeAreas' in fields && next.entityType === 'CERTIFICATION_BODY') {
        next.cabSetup = { ...next.cabSetup, activities: [...next.scopeAreas] }
      }

      return next
    })

    if (fields.scopeCategory) {
      syncBackendOrganizationType(fields.scopeCategory)
    }
  }

  /** Writes into the CAB-only block without disturbing the shared fields. */
  const patchSetup = (fields: Partial<CabSetupForm>) => {
    setForm((prev) => ({ ...prev, cabSetup: { ...prev.cabSetup, ...fields } }))
  }

  /** Same, for the AB-only block. */
  const patchAbSetup = (fields: Partial<AbSetupForm>) => {
    setForm((prev) => ({ ...prev, abSetup: { ...prev.abSetup, ...fields } }))
  }

  /** Same, for the Internal Audit block. */
  const patchIaSetup = (fields: Partial<IaSetupForm>) => {
    setForm((prev) => ({ ...prev, iaSetup: { ...prev.iaSetup, ...fields } }))
  }

  /** Same, for the Scheme Owner block. */
  const patchSoSetup = (fields: Partial<SoSetupForm>) => {
    setForm((prev) => ({ ...prev, soSetup: { ...prev.soSetup, ...fields } }))
  }

  /** Same, for the Supplier Audit block. */
  const patchSaSetup = (fields: Partial<SaSetupForm>) => {
    setForm((prev) => ({ ...prev, saSetup: { ...prev.saSetup, ...fields } }))
  }

  const finishOnboarding = (activeDeck: SetupDeck | null) => {
    const cabId = getCabId()
    if (cabId) markCabOnboardingComplete(cabId)
    const orgId = getAuthSession()?.organization?.id
    if (orgId) markOnboardingComplete(orgId)
    clearOnboardingDraft(draftKey)
    setStep(getSuccessStep(activeDeck))
  }

  const persistCabSetupDraft = async () => {
    let existing: Awaited<ReturnType<typeof getCabProfile>>['cab'] | null
    try {
      existing = (await getCabProfile()).cab
    } catch {
      existing = null
    }

    await saveCabSetupDraft(mapFormToCabSetupDraft(form, existing))

    try {
      const { cab } = await getCabProfile()
      setForm((prev) => mergeCabProfileIntoForm(prev, cab))
    } catch {
      // Keep the local form if the profile cannot be reloaded.
    }
  }

  const handleFinish = async () => {
    if (isSaving || !form.entityType || !form.scopeCategory) return

    if (!getAuthToken()) {
      toast.error(t('onboarding.shared.errors.loginRequired'))
      return
    }

    setIsSaving(true)

    try {
      if (deck === 'cab') {
        if (!isCabAdminSession()) {
          toast.error(t('onboarding.shared.errors.notCabAdmin'))
          return
        }
        if (!isCabSetupReadyToActivate(form.cabSetup, {
          legalEntityName: form.legalEntityName,
          tradingName: form.tradingName,
          registrationNumber: form.registrationNumber,
          website: form.website,
          country: form.country,
          city: form.city,
          address: form.address,
          languages: form.languages,
        })) {
          toast.error(t('cab.setup.review.issues.cannotActivate'))
          return
        }
        await persistCabSetupDraft()
        await completeCabSetup()
        patchCabSetupCompleted(true)
        markCabWorkflowTourPending()
        finishOnboarding(deck)
        return
      }

      // Persist only fields shared with the legacy registration flow.
      // All newer onboarding-only fields remain in the local draft.
      await saveOrganizationProfile({
        profile: {
          organizationName: form.legalEntityName,
        },
        address: {
          country: form.country,
          city: form.city,
          street: form.address,
        },
      })

      finishOnboarding(deck)
    } catch (error) {
      // Existing accounts (logged in before onboarding) should not be blocked
      // if profile save fails — they can update details later in company profile.
      if (hadAuthAtStartRef.current && getAuthToken() && deck !== 'cab') {
        finishOnboarding(deck)
        return
      }

      if (error instanceof ApiError && error.status === 401) {
        toast.error(t('onboarding.shared.errors.loginRequired'))
        return
      }

      toast.error(getUserErrorMessage(error, t))
    } finally {
      setIsSaving(false)
    }
  }

  const handleNext = async () => {
    const summaryStep = getSummaryStep(deck)
    if (step === summaryStep) {
      void handleFinish()
      return
    }

    if (step === 1 && hasPendingRegistration() && !getAuthToken()) {
      if (isSaving || !isOrgTypeStepComplete(form) || !form.scopeCategory) return
      setIsSaving(true)
      try {
        if (form.scopeCategory === 'CONFORMITY_ASSESSMENT_BODY') {
          await completePendingCabRegistration()
          setForm((prev) => ({
            ...prev,
            cabSetup: withRegistrationCabContactDefaults(prev.cabSetup),
          }))
        } else {
          const entityType = mapOrgScopeToBackendType(form.scopeCategory)
          await completePendingRegistration(entityType)
        }
        setStep(2)
      } catch (error) {
        toast.error(getUserErrorMessage(error, t))
      } finally {
        setIsSaving(false)
      }
      return
    }

    if (deck === 'cab' && step >= CAB_FIRST_SETUP_STEP && step < CAB_REVIEW_STEP && getAuthToken() && isCabAdminSession()) {
      if (cabStepBlocked(step)) return
      setIsSaving(true)
      try {
        await persistCabSetupDraft()
        setStep((current) => current + 1)
      } catch (error) {
        toast.error(getUserErrorMessage(error, t))
      } finally {
        setIsSaving(false)
      }
      return
    }

    setStep((current) => current + 1)
  }

  const handleBack = () => {
    if (step <= 1) return
    setStep((current) => current - 1)
  }

  const brandingStep = getBrandingStep(deck)
  const summaryStep = getSummaryStep(deck)

  /** Per-screen gate for the 9-screen CAB path (steps 2-10). */
  const cabStepBlocked = (currentStep: number): boolean => {
    const setup = form.cabSetup
    switch (currentStep) {
      case 2:
        return (
          !isProfileStepComplete(setup, form.legalEntityName, form.registrationNumber, form.tradingName) ||
          !isSharedWebsiteValid(form)
        )
      case 3:
        return !isLocationsStepComplete(setup, form.country, form.city, form.address, form.languages)
      case 4:
        return !isAccreditationStatusStepComplete(setup)
      case 5:
        return !isAccreditationRecordsStepComplete(setup)
      case 6:
        return !isSchemesStepComplete(setup)
      case 7:
        return !isScopeStepComplete(setup)
      case 8:
        return !isMarksStepComplete(setup)
      case 9:
        return !isCertificateStepComplete(setup)
      case CAB_REVIEW_STEP:
        return (
          isSaving ||
          !isCabSetupReadyToActivate(setup, {
            legalEntityName: form.legalEntityName,
            tradingName: form.tradingName,
            registrationNumber: form.registrationNumber,
            website: form.website,
            country: form.country,
            city: form.city,
            address: form.address,
            languages: form.languages,
          })
        )
      default:
        return false
    }
  }

  /** Per-screen gate for the 10-screen AB path (steps 2-11). */
  const abStepBlocked = (currentStep: number): boolean => {
    const setup = form.abSetup
    switch (currentStep) {
      case 2:
        return !isAbProfileStepComplete(setup, form.legalEntityName) || !isSharedWebsiteValid(form)
      case 3:
        return !isAbLocationsStepComplete(setup, form.country, form.city, form.address, form.languages)
      case 4:
        return !isAbRecognitionStatusStepComplete(setup)
      case 5:
        return !isAbRecognitionRecordsStepComplete(setup)
      case 6:
        return !isAbProgrammesStepComplete(setup)
      case 7:
        return !isAbScopeStepComplete(setup)
      case 8:
        return !isAbSymbolsStepComplete(setup)
      case 9:
        return !isAbCertificateStepComplete(setup)
      case 10:
        return !isAbKeyRolesStepComplete(setup)
      case CAB_REVIEW_STEP:
        return isSaving
      default:
        return false
    }
  }

  /** Per-screen gate for the 10-screen Internal Audit path (steps 2-11). */
  const iaStepBlocked = (currentStep: number): boolean => {
    const setup = form.iaSetup
    switch (currentStep) {
      case 2:
        return !isIaProfileStepComplete(setup, form.legalEntityName) || !isSharedWebsiteValid(form)
      case 3:
        return !isIaStructureStepComplete(setup, form.country, form.city)
      case 4:
        return !isIaUniverseStepComplete(setup)
      case 5:
        return !isIaCriteriaStepComplete(setup)
      case 6:
        return !isIaRiskStepComplete(setup)
      case 7:
        return !isIaProgrammeStepComplete(setup)
      case 8:
        return !isIaFindingsStepComplete(setup)
      case 9:
        return !isIaTemplatesStepComplete(setup)
      case 10:
        return !isIaRolesStepComplete(setup)
      case CAB_REVIEW_STEP:
        return isSaving
      default:
        return false
    }
  }

  /** Per-screen gate for the 10-screen Scheme Owner path (steps 2-11). */
  const soStepBlocked = (currentStep: number): boolean => {
    const setup = form.soSetup
    switch (currentStep) {
      case 2:
        return !isSoProfileStepComplete(setup, form.legalEntityName) || !isSharedWebsiteValid(form)
      case 3:
        return !isSoLocationStepComplete(setup, form.country, form.city, form.address)
      case 4:
        return !isSoFamiliesStepComplete(setup)
      case 5:
        return !isSoSchemesStepComplete(setup)
      case 6:
        return !isSoActivitiesStepComplete(setup)
      case 7:
        return !isSoScopeStepComplete(setup)
      case 8:
        return !isSoApprovalStepComplete(setup)
      case 9:
        return !isSoMarksStepComplete(setup)
      case 10:
        return !isSoRolesStepComplete(setup)
      case CAB_REVIEW_STEP:
        return isSaving
      default:
        return false
    }
  }

  /** Per-screen gate for the 10-screen Supplier Audit path (steps 2-11). */
  const saStepBlocked = (currentStep: number): boolean => {
    const setup = form.saSetup
    switch (currentStep) {
      case 2:
        return !isSaProfileStepComplete(setup, form.legalEntityName) || !isSharedWebsiteValid(form)
      case 3:
        return !isSaLocationsStepComplete(setup, form.country, form.city)
      case 4:
        return !isSaCategoriesStepComplete(setup)
      case 5:
        return !isSaRiskStepComplete(setup)
      case 6:
        return !isSaQualificationStepComplete(setup)
      case 7:
        return !isSaAuditTypesStepComplete(setup)
      case 8:
        return !isSaScoringStepComplete(setup)
      case 9:
        return !isSaFindingsStepComplete(setup)
      case 10:
        return !isSaRolesStepComplete(setup)
      case CAB_REVIEW_STEP:
        return isSaving
      default:
        return false
    }
  }

  const nextDisabled =
    step === 1
      ? !isOrgTypeStepComplete(form) || isSaving
      : deck === 'so'
        ? soStepBlocked(step)
      : deck === 'sa'
        ? saStepBlocked(step)
      : deck === 'ia'
        ? iaStepBlocked(step)
      : deck === 'ab'
        ? abStepBlocked(step)
      : deck === 'cab'
        ? cabStepBlocked(step)
        : step === 2
          ? !isOrgDetailsStepComplete(form)
          : step === 3
            ? !isModulesStepComplete(form)
            : step === 4
              ? !isLocationStepComplete(form)
              : step === brandingStep
                ? !isBrandingStepComplete(form)
                : step === summaryStep
                  ? isSaving
                  : false

  const orgDisplayName = form.tradingName || form.legalEntityName
  const successStep = getSuccessStep(deck)

  /** "Save & continue later" — persist CAB drafts to PATCH /cab-setup/draft, then exit. */
  const handleSaveAndExit = async () => {
    if (deck === 'cab' && getAuthToken() && isCabAdminSession()) {
      setIsSaving(true)
      try {
        await persistCabSetupDraft()
        const session = getAuthSession()
        navigate(session ? getPostLoginRedirect(session) : ROUTES.login)
      } catch (error) {
        toast.error(getUserErrorMessage(error, t))
      } finally {
        setIsSaving(false)
      }
      return
    }

    navigate(getAuthToken() ? ROUTES.dashboard : ROUTES.login)
  }

  const renderDetailsAndBeyond = () => {
    if (deck === 'cab') {
      // Screens 1-10 of the CAB onboarding deck, in deck order.
      const setupProps = { form, onPatch: patch, onPatchSetup: patchSetup }
      return (
        <>
          {step === 2 && <CabProfileStep {...setupProps} />}
          {step === 3 && <CabLocationsStep {...setupProps} />}
          {step === 4 && <CabAccreditationStatusStep {...setupProps} />}
          {step === 5 && <CabAccreditationRecordsStep {...setupProps} />}
          {step === 6 && <CabSchemesServicesStep {...setupProps} />}
          {step === 7 && <CabScopeStep {...setupProps} />}
          {step === 8 && <CabMarksStep {...setupProps} />}
          {step === 9 && <CabCertificateStep {...setupProps} />}
          {step === CAB_REVIEW_STEP && (
            <CabReviewActivateStep
              form={form}
              onGoToStep={(targetStep, fieldId) => {
                setStep(targetStep)
                if (fieldId) setPendingFocusFieldId(fieldId)
              }}
            />
          )}
        </>
      )
    }

    if (deck === 'ab') {
      // Screens 1-10 of the AB onboarding deck, in deck order.
      const abProps = { form, onPatch: patch, onPatchSetup: patchAbSetup }
      return (
        <>
          {step === 2 && <AbProfileStep {...abProps} />}
          {step === 3 && <AbLocationsStep {...abProps} />}
          {step === 4 && <AbRecognitionStatusStep {...abProps} />}
          {step === 5 && <AbRecognitionRecordsStep {...abProps} />}
          {step === 6 && <AbProgrammesStep {...abProps} />}
          {step === 7 && <AbProgrammeScopeStep {...abProps} />}
          {step === 8 && <AbSymbolsStep {...abProps} />}
          {step === 9 && <AbCertificateStep {...abProps} />}
          {step === 10 && <AbKeyRolesStep {...abProps} />}
          {step === CAB_REVIEW_STEP && (
            <AbReviewActivateStep form={form} onGoToStep={setStep} />
          )}
        </>
      )
    }

    if (deck === 'so') {
      // Screens 1-10 of the Scheme Owner onboarding deck, in deck order.
      const soProps = { form, onPatch: patch, onPatchSetup: patchSoSetup }
      return (
        <>
          {step === 2 && <SoProfileStep {...soProps} />}
          {step === 3 && <SoLocationStep {...soProps} />}
          {step === 4 && <SoFamiliesStep {...soProps} />}
          {step === 5 && <SoSchemesStep {...soProps} />}
          {step === 6 && <SoActivitiesStep {...soProps} />}
          {step === 7 && <SoScopeStep {...soProps} />}
          {step === 8 && <SoApprovalStep {...soProps} />}
          {step === 9 && <SoMarksStep {...soProps} />}
          {step === 10 && <SoRolesStep {...soProps} />}
          {step === CAB_REVIEW_STEP && (
            <SoReviewActivateStep form={form} onGoToStep={setStep} />
          )}
        </>
      )
    }

    if (deck === 'sa') {
      // Screens 1-10 of the Supplier Audit onboarding deck, in deck order.
      const saProps = { form, onPatch: patch, onPatchSetup: patchSaSetup }
      return (
        <>
          {step === 2 && <SaProfileStep {...saProps} />}
          {step === 3 && <SaLocationsStep {...saProps} />}
          {step === 4 && <SaCategoriesStep {...saProps} />}
          {step === 5 && <SaRiskStep {...saProps} />}
          {step === 6 && <SaQualificationStep {...saProps} />}
          {step === 7 && <SaAuditTypesStep {...saProps} />}
          {step === 8 && <SaScoringStep {...saProps} />}
          {step === 9 && <SaFindingsStep {...saProps} />}
          {step === 10 && <SaRolesStep {...saProps} />}
          {step === CAB_REVIEW_STEP && (
            <SaReviewActivateStep form={form} onGoToStep={setStep} />
          )}
        </>
      )
    }

    if (deck === 'ia') {
      // Screens 1-10 of the Internal Audit onboarding deck, in deck order.
      const iaProps = { form, onPatch: patch, onPatchSetup: patchIaSetup }
      return (
        <>
          {step === 2 && <IaProfileStep {...iaProps} />}
          {step === 3 && <IaStructureStep {...iaProps} />}
          {step === 4 && <IaUniverseStep {...iaProps} />}
          {step === 5 && <IaCriteriaStep {...iaProps} />}
          {step === 6 && <IaRiskStep {...iaProps} />}
          {step === 7 && <IaProgrammeStep {...iaProps} />}
          {step === 8 && <IaFindingsStep {...iaProps} />}
          {step === 9 && <IaTemplatesStep {...iaProps} />}
          {step === 10 && <IaRolesStep {...iaProps} />}
          {step === CAB_REVIEW_STEP && (
            <IaReviewActivateStep form={form} onGoToStep={setStep} />
          )}
        </>
      )
    }

    if (form.entityType === 'ACCREDITATION_BODY') {
      // Non-deck scopes that map to AB (Scheme Owner) keep the short route.
      return (
        <>
          {step === 2 && <AbOrgDetailsStep form={form} onPatch={patch} />}
          {step === 3 && <OnboardingModulesStep form={form} onPatch={patch} />}
          {step === 4 && <AbLocationStep form={form} onPatch={patch} />}
          {step === 5 && <AbBrandingStep form={form} onPatch={patch} />}
          {step === 6 && <OnboardingSummaryStep form={form} />}
        </>
      )
    }

    if (form.entityType === 'CONSULTATION_BODY') {
      return (
        <>
          {step === 2 && <AuditeeOrgDetailsStep form={form} onPatch={patch} />}
          {step === 3 && <OnboardingModulesStep form={form} onPatch={patch} />}
          {step === 4 && <AuditeeLocationStep form={form} onPatch={patch} />}
          {step === 5 && <AuditeeBrandingStep form={form} onPatch={patch} />}
          {step === 6 && <OnboardingSummaryStep form={form} />}
        </>
      )
    }

    return null
  }

  // The CAB path renders the deck's own chrome (topbar, progress rail, footer)
  // rather than the shared onboarding shell.
  if (deck && step >= CAB_FIRST_SETUP_STEP && step <= CAB_REVIEW_STEP) {
    const screenIndex = step - CAB_FIRST_SETUP_STEP
    const ns = deck
    const screenKeysByDeck = {
      cab: CAB_SETUP_SCREEN_KEYS,
      ab: AB_SETUP_SCREEN_KEYS,
      ia: IA_SETUP_SCREEN_KEYS,
      so: SO_SETUP_SCREEN_KEYS,
      sa: SA_SETUP_SCREEN_KEYS,
    } as const
    const screenKey = screenKeysByDeck[deck][screenIndex]

    return (
      <CabSetupShell
        badge={t(`${ns}.setup.badge`)}
        current={screenIndex + 1}
        total={CAB_SETUP_SCREEN_COUNT}
        title={t(`${ns}.setup.${screenKey}.title`)}
        subtitle={t(`${ns}.setup.${screenKey}.subtitle`)}
        onBack={handleBack}
        onNext={handleNext}
        nextLabel={
          step === CAB_REVIEW_STEP
            ? isSaving
              ? t('common.saving')
              : t(`${ns}.setup.review.activate`)
            : t('common.next')
        }
        nextDisabled={nextDisabled}
        onSaveAndExit={handleSaveAndExit}
      >
        {renderDetailsAndBeyond()}
      </CabSetupShell>
    )
  }

  return (
    <OnboardingFlowShell
      step={step}
      introStep={0}
      successStep={successStep}
      firstFormStep={1}
      lastFormStep={summaryStep}
      wideSteps={[1, 3]}
      brandingStep={brandingStep}
      intro={{
        title: t('onboarding.shared.intro.title'),
        description: t('onboarding.shared.intro.description'),
        estimatedTimeLabel: t('onboarding.shared.intro.estimatedTimeLabel'),
        estimatedTimeValue: t('onboarding.shared.intro.estimatedTimeValue'),
        estimatedTimeDescription: t('onboarding.shared.intro.estimatedTimeDescription'),
        howItWorksLabel: t('onboarding.shared.intro.howItWorksLabel'),
        howItWorksValue: t('onboarding.shared.intro.howItWorksValue'),
        cta: t('onboarding.shared.intro.cta'),
      }}
      onIntroStart={() => setStep(1)}
      success={{
        title: t('onboarding.shared.success.title'),
        description: t('onboarding.shared.success.description', { name: orgDisplayName }),
        back: t('onboarding.shared.success.back'),
        cta: t('onboarding.shared.success.cta'),
      }}
      onSuccessBack={() => setStep(summaryStep)}
      onSuccessContinue={() => {
        const session = getAuthSession()
        if (session?.organization?.id) {
          markOnboardingComplete(session.organization.id)
        }
        if (session?.cab?.setupCompleted || deck === 'cab' || (form.entityType as string) === 'CERTIFICATION_BODY') {
          navigate(ROUTES.workspace)
          return
        }
        navigate(
          form.entityType === 'ACCREDITATION_BODY'
            ? ROUTES.abDashboard
            : ROUTES.dashboard
        )
      }}
      actions={
        step >= 1 && step <= summaryStep ? (
          <AuthStepActions
            className="ms-auto mt-6 w-full sm:max-w-[328px]"
            onBack={handleBack}
            onNext={handleNext}
            nextLabel={
              step === 1 && isSaving
                ? t('register.creatingAccount')
                : step === summaryStep && isSaving
                  ? t('common.saving')
                  : t('common.next')
            }
            nextDisabled={nextDisabled}
            showBack={step > 1}
            onSaveAndExit={undefined}
            saveAndExitLabel={t('common.saveAndContinueLater')}
          />
        ) : null
      }
    >
      {step === 1 && <OrgScopeTypeStep form={form} onPatch={patch} />}
      {step >= 2 && renderDetailsAndBeyond()}
    </OnboardingFlowShell>
  )
}
