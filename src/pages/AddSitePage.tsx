import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { enumLabel } from '@/lib/enumLabel'
import { TickCircle } from 'iconsax-reactjs'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { DashboardFooter } from '@/components/dashboard/DashboardFooter'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { CountrySelectField } from '@/components/dashboard/CountrySelectField'
import { Button } from '@/components/ui/Button'
import { ErrorState, FormField, SelectField, TextField, Textarea, Checkbox } from '@/components/ui'
import { RadioGroup } from '@/components/ui/RadioGroup'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { Toggle } from '@/components/ui/Toggle'
import { PhoneInputRow } from '@/components/auth/CountryCodeSelect'
import { MailIcon, PhoneIcon, AirplaneIcon, TrainIcon, RoadIcon, InfoIcon } from '@/components/icons'
import { useFieldValidation } from '@/hooks/useFieldValidation'
import { isValidEmailFormat, isValidPhoneNumber } from '@/lib/validators'
import {
  SITE_MULTI_SITE_ROLE_OPTIONS,
  STANDARD_SCHEMA_OPTIONS,
  TRAVEL_REQUIREMENT_OPTIONS,
  PERMIT_ACCESS_OPTIONS,
  ESTIMATED_TRAVEL_TIME_OPTIONS,
  TYPE_OF_AUDIT_OPTIONS,
  SURVEILLANCE_CYCLE_OPTIONS,
} from '@/lib/api/applicationDraftApi'
import {
  getCabClientCertificationApplication,
  updateCabClientCertificationApplicationDraft,
  type CabCertificationApplication,
} from '@/lib/api/cabCertificationApplicationApi'
import type { ApplicationBranch } from '@/lib/api/certificationApplicationApi'
import {
  addSiteFormToBranch,
  canSaveAddSiteDraft,
  emptyAddSiteForm,
  isAddSiteFormComplete,
  otherSiteNames,
  type AddSiteForm,
  type AddSiteSection,
  type ManagementSystemType,
} from '@/lib/addSiteForm'
import type { CountryCode } from '@/lib/countries'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { getIafCodeOptions } from '@/lib/iafCodes'
import { ROUTES, cabApplicationSubmissionPath } from '@/lib/routes'
import { toast } from '@/lib/toast'
import { notSet } from '@/lib/emptyValue'

const TRAVEL_REQUIREMENT_ICONS = [AirplaneIcon, TrainIcon, RoadIcon]

const SITE_INDICATOR_ITEMS = [
  { key: 'airplaneRequired', icon: AirplaneIcon },
  { key: 'trainRequired', icon: TrainIcon },
  { key: 'airplaneTrainRequired', icon: RoadIcon },
  { key: 'permitAccessRequired', icon: InfoIcon },
  { key: 'includedInSampling', icon: TickCircle },
] as const

const BRANCH_KEYS = [
  'sourceBranchId',
  'branchName',
  'address',
  'employees',
  'employeesInScope',
  'shifts',
  'workingHours',
  'productionLines',
  'weeklyHoliday',
  'phase1ExpectedDate',
  'integratedSystem',
  'centralManagement',
  'activities',
  'products',
  'technicalCommunication',
  'siteDetails',
] as const satisfies readonly (keyof ApplicationBranch)[]

/** A stored branch as a draft payload: only API fields, without nulls the draft schema rejects. */
function branchPayload(branch: ApplicationBranch): ApplicationBranch {
  const out: Record<string, unknown> = {}
  for (const key of BRANCH_KEYS) {
    const value = branch[key]
    if (value !== null && value !== undefined) out[key] = value
  }
  return out as ApplicationBranch
}

/** The placeholder the application form stores when the client has no branches. */
const isPlaceholderBranch = (branch: ApplicationBranch) => branch.branchName === 'No Branch'

/**
 * CAB "Add site" page for a certification application draft
 * (`/cab/applications/draft/sites/new?clientId=…&id=…`). Collects the full site details,
 * stores them as a branch of the application (PATCH …/certification-applications/:id/draft)
 * and returns to the application submission flow. "Other sites covered" lists the sites
 * already on that application.
 */
export function AddSitePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const clientId = searchParams.get('clientId')
  const applicationId = searchParams.get('id')

  const [form, setForm] = useState<AddSiteForm>(() => emptyAddSiteForm())
  const [application, setApplication] = useState<CabCertificationApplication | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [saving, setSaving] = useState<'draft' | 'next' | null>(null)
  // Index of this site in the application's branch list once saved, so a second save updates it.
  const [savedIndex, setSavedIndex] = useState<number | null>(null)

  const missingContext = !clientId || !applicationId
  const loading = !missingContext && !application && !loadError

  useEffect(() => {
    if (!clientId || !applicationId) return
    let cancelled = false
    getCabClientCertificationApplication(clientId, applicationId)
      .then((app) => {
        if (!cancelled) setApplication(app)
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(getUserErrorMessage(error, t))
      })
    return () => {
      cancelled = true
    }
  }, [clientId, applicationId, reloadKey, t])

  const branches = useMemo(() => application?.branches ?? [], [application])
  const otherBranches = useMemo(
    () => branches.filter((_, index) => index !== savedIndex),
    [branches, savedIndex],
  )
  const otherSitesOptions = useMemo(
    () => otherSiteNames(otherBranches, form.location.name),
    [otherBranches, form.location.name],
  )
  const readOnly = Boolean(application && application.status !== 'DRAFT')

  const patch = <S extends AddSiteSection>(section: S, changes: Partial<AddSiteForm[S]>) =>
    setForm((previous) => ({ ...previous, [section]: { ...previous[section], ...changes } }))

  const translatedOptions = useCallback(
    (values: string[]) => values.map((value) => ({ value, label: enumLabel(t, value) })),
    [t],
  )

  const toggleTravelRequirement = (option: string) =>
    patch('travel', {
      requirements: form.travel.requirements.includes(option)
        ? form.travel.requirements.filter((item) => item !== option)
        : [...form.travel.requirements, option],
    })

  const { fieldProps } = useFieldValidation(form.contact, {
    email: (value) => (!isValidEmailFormat(value) ? t('validation.invalidEmail') : undefined),
    phone: (value) =>
      !isValidPhoneNumber(value, form.contact.phoneCountryCode) ? t('validation.invalidMobile') : undefined,
  })

  const canSave = isAddSiteFormComplete(form)
  const canSaveDraft = canSaveAddSiteDraft(form)
  const submissionPath =
    clientId && applicationId ? cabApplicationSubmissionPath(clientId, applicationId) : ROUTES.cabApplicationSubmission

  /** Stores this site on the application draft (appends it, or replaces it after the first save). */
  const persist = async (action: 'draft' | 'next'): Promise<boolean> => {
    if (!clientId || !applicationId || !application || readOnly) return false
    setSaving(action)
    try {
      const site = addSiteFormToBranch(form)
      const kept = otherBranches.filter((branch) => !isPlaceholderBranch(branch)).map(branchPayload)
      const saved = await updateCabClientCertificationApplicationDraft(clientId, applicationId, {
        branches: [...kept, site],
      })
      setApplication(saved)
      // The API does not promise an order for branches: find this site again by its name.
      const names = (saved.branches ?? []).map((branch) => branch.branchName)
      setSavedIndex(names.lastIndexOf(site.branchName))
      return true
    } catch (error) {
      toast.error(getUserErrorMessage(error, t))
      return false
    } finally {
      setSaving(null)
    }
  }

  const handleBack = () => navigate(submissionPath)

  const handleSaveDraft = async () => {
    if (!canSaveDraft) return
    if (await persist('draft')) {
      toast.success(t('cab.applicationDraft.sitesFacilities.addSitePage.savedDraft', 'Site saved to the application draft.'))
    }
  }

  const handleNext = async () => {
    if (!canSave) return
    if (await persist('next')) {
      toast.success(t('cab.applicationDraft.sitesFacilities.addSitePage.saved', 'Site added to the application.'))
      navigate(submissionPath)
    }
  }

  if (missingContext || loadError || readOnly) {
    return (
      <CabLayout>
        <CabHeader title={t('cab.applicationDraft.title')} notificationCount={3} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 page-main">
          {loadError ? (
            <ErrorState
              description={loadError}
              onRetry={() => {
                setLoadError(null)
                setReloadKey((key) => key + 1)
              }}
            />
          ) : (
            <div className="max-w-[520px] space-y-4 rounded-lg border border-neutral-100 bg-white p-6 text-center">
              <p className="text-body-1-medium text-neutral-900">
                {readOnly
                  ? t('cab.applicationDraft.sitesFacilities.addSitePage.notDraft', 'This application has been submitted, so its sites can no longer be changed here.')
                  : t('cab.applicationDraft.sitesFacilities.addSitePage.noApplication', 'Open this page from an application draft to add a site to it.')}
              </p>
              <Button variant="primary" onClick={() => navigate(submissionPath)}>
                {t('cab.applicationDraft.sitesFacilities.addSitePage.backToApplication', 'Back to the application')}
              </Button>
            </div>
          )}
        </div>
      </CabLayout>
    )
  }

  return (
    <CabLayout>
      <CabHeader title={t('cab.applicationDraft.title')} notificationCount={3} />

      <div className="flex flex-1 flex-col gap-5 overflow-auto page-main">
        <div className="space-y-1">
          <h2 className="text-h3-semi text-neutral-900">
            {t('cab.applicationDraft.sitesFacilities.addNewSite')}
          </h2>
          <p className="text-body-2 text-neutral-600">
            {t('cab.applicationDraft.sitesFacilities.addNewSiteSubtitle')}
          </p>
          {application && (
            <p className="text-body-3 text-neutral-600">
              {t('cab.applicationDraft.sitesFacilities.addSitePage.forApplication', {
                defaultValue: 'Application: {{client}}',
                client: application.organization?.name ?? application.legalInfo?.organizationName ?? notSet(),
              })}
            </p>
          )}
        </div>

        {loading ? (
          <p className="py-10 text-center text-body-2 text-neutral-600">{t('common.loading')}</p>
        ) : (
          <>
        <SectionHeading
          title={t('cab.applicationDraft.sitesFacilities.addSitePage.sections.siteLocationDetails')}
          accordion
        >
          <div className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-3">
              <FormField label={t('cab.applicationDraft.sitesFacilities.modal.siteName')} required>
                <TextField
                  type="text"
                  value={form.location.name}
                  onChange={(e) => patch('location', { name: e.target.value })}
                  placeholder={t('cab.applicationDraft.sitesFacilities.modal.siteNamePlaceholder')}
                />
              </FormField>
              <FormField label={t('cab.applicationDraft.sitesFacilities.addSitePage.roleInMultiSite')} required>
                <SelectField
                  value={form.location.role}
                  options={translatedOptions(SITE_MULTI_SITE_ROLE_OPTIONS)}
                  onChange={(value) => patch('location', { role: value })}
                  placeholder={t('cab.applicationDraft.sitesFacilities.addSitePage.roleInMultiSitePlaceholder')}
                />
              </FormField>
              <FormField label={t('cab.applicationDraft.sitesFacilities.modal.country')} required>
                <CountrySelectField
                  value={form.location.country}
                  onChange={(code) => patch('location', { country: code })}
                />
              </FormField>
            </div>

            <FormField label={t('cab.applicationDraft.sitesFacilities.addSitePage.employees', 'Employees at this site')} required>
              <TextField
                type="text"
                inputMode="numeric"
                value={form.location.employees}
                onChange={(e) => patch('location', { employees: e.target.value })}
                placeholder={t('cab.applicationDraft.sitesFacilities.addSitePage.employeesPlaceholder', 'e.g. 45')}
                error={
                  form.location.employees.trim() && !/^\d{1,6}$/.test(form.location.employees.trim())
                    ? t('cab.applicationDraft.sitesFacilities.addSitePage.employeesInvalid', 'Enter a whole number.')
                    : undefined
                }
              />
            </FormField>

            <FormField label={t('cab.applicationDraft.sitesFacilities.modal.address')} required>
              <Textarea
                rows={4}
                value={form.location.address}
                onChange={(e) => patch('location', { address: e.target.value })}
                placeholder={t('cab.applicationDraft.sitesFacilities.modal.addressPlaceholder')}
              />
            </FormField>
          </div>
        </SectionHeading>

        <SectionHeading
          title={t('cab.applicationDraft.sitesFacilities.addSitePage.sections.managementSystemScope')}
          accordion
        >
          <div className="space-y-5">
            <FormField label={t('cab.applicationDraft.sitesFacilities.addSitePage.managementSystemType')} required>
              <RadioGroup
                name="managementSystemType"
                value={form.managementScope.type}
                onChange={(value) => patch('managementScope', { type: value as ManagementSystemType })}
                options={[
                  {
                    value: 'INTEGRATED',
                    label: t(
                      'cab.applicationDraft.sitesFacilities.addSitePage.managementSystemTypeOptions.integrated'
                    ),
                  },
                  {
                    value: 'SINGLE',
                    label: t('cab.applicationDraft.sitesFacilities.addSitePage.managementSystemTypeOptions.single'),
                  },
                  {
                    value: 'SEPARATE',
                    label: t(
                      'cab.applicationDraft.sitesFacilities.addSitePage.managementSystemTypeOptions.separate'
                    ),
                  },
                ]}
              />
            </FormField>

            <FormField label={t('cab.applicationDraft.sitesFacilities.addSitePage.applicableStandards')} required>
              <MultiSelect
                tags={form.managementScope.standards}
                options={STANDARD_SCHEMA_OPTIONS.map((s) => s.name)}
                onChange={(tags) => patch('managementScope', { standards: tags })}
                placeholder={t('cab.applicationDraft.sitesFacilities.addSitePage.applicableStandardsPlaceholder')}
              />
            </FormField>

            <FormField label={t('cab.applicationDraft.sitesFacilities.addSitePage.siteScopeActivities')} required>
              <Textarea
                rows={3}
                value={form.managementScope.scopeActivities}
                onChange={(e) => patch('managementScope', { scopeActivities: e.target.value })}
                placeholder={t('cab.applicationDraft.sitesFacilities.addSitePage.siteScopeActivitiesPlaceholder')}
              />
            </FormField>
          </div>
        </SectionHeading>

        <SectionHeading
          title={t('cab.applicationDraft.sitesFacilities.addSitePage.sections.travelAccess')}
          accordion
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
              {TRAVEL_REQUIREMENT_OPTIONS.map((option, index) => {
                const Icon = TRAVEL_REQUIREMENT_ICONS[index]
                return (
                  <label key={option} className="flex cursor-pointer items-center gap-2">
                    <Checkbox
                      checked={form.travel.requirements.includes(option)}
                      onChange={() => toggleTravelRequirement(option)}
                    />
                    <Icon size={18} variant="Linear" className="text-neutral-600" />
                    <span className="text-body-2 text-neutral-800">{enumLabel(t, option)}</span>
                  </label>
                )
              })}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label={t('cab.applicationDraft.sitesFacilities.addSitePage.permitAccess')} required>
                <SelectField
                  value={form.travel.permitAccess}
                  options={translatedOptions(PERMIT_ACCESS_OPTIONS)}
                  onChange={(value) => patch('travel', { permitAccess: value })}
                  placeholder={t('cab.applicationDraft.sitesFacilities.addSitePage.selectOption')}
                />
              </FormField>
              <FormField
                label={t('cab.applicationDraft.sitesFacilities.addSitePage.estimatedTravelTime')}
                required
              >
                <SelectField
                  value={form.travel.estimatedTravelTime}
                  options={translatedOptions(ESTIMATED_TRAVEL_TIME_OPTIONS)}
                  onChange={(value) => patch('travel', { estimatedTravelTime: value })}
                  placeholder={t('cab.applicationDraft.sitesFacilities.addSitePage.selectOption')}
                />
              </FormField>
            </div>

            <FormField label={t('cab.applicationDraft.sitesFacilities.addSitePage.transportationNotes')}>
              <Textarea
                rows={3}
                value={form.travel.notes}
                onChange={(e) => patch('travel', { notes: e.target.value })}
                placeholder={t('cab.applicationDraft.sitesFacilities.addSitePage.transportationNotesPlaceholder')}
              />
            </FormField>
          </div>
        </SectionHeading>

        <SectionHeading title={t('auditCalc.addSite.title', 'Multi-site audit time (IAF MD 1)')} accordion>
          <div className="space-y-5">
            <p className="text-caption text-text-secondary">{t('auditCalc.addSite.hint', 'Used by the quotation: the IAF codes suggest the risk category, and the answers below decide whether the site can be sampled or is audited individually.')}</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label={t('auditCalc.sites.iafCodes', 'IAF codes')}>
                <MultiSelect
                  tags={form.register.iafCodes}
                  options={getIafCodeOptions().map((option) => ({ value: option.value.replace('IAF_', ''), label: option.label }))}
                  onChange={(iafCodes) => patch('register', { iafCodes })}
                  searchable
                  searchPlaceholder={t('common.search')}
                />
              </FormField>
              <FormField label={t('auditCalc.sites.type', 'Site type')}>
                <SelectField
                  value={form.register.siteType}
                  options={[{ value: 'PERMANENT', label: t('auditCalc.sites.permanent', 'Permanent') }, { value: 'TEMPORARY', label: t('auditCalc.sites.temporarySite', 'Temporary') }]}
                  onChange={(value) => patch('register', { siteType: value as 'PERMANENT' | 'TEMPORARY' })}
                />
              </FormField>
              <FormField label={t('auditCalc.addSite.temporaryEmployees', 'Temporary personnel')}>
                <TextField type="text" inputMode="numeric" value={form.register.temporaryEmployees}
                  onChange={(e) => patch('register', { temporaryEmployees: e.target.value })} />
              </FormField>
            </div>
            <div className="flex flex-col gap-3">
              {([
                ['sameProcesses', t('auditCalc.sites.sameProcesses', 'Same processes as the other sites')],
                ['isNewSite', t('auditCalc.sites.isNew', 'New site')],
                ['auditIndividually', t('auditCalc.sites.individual', 'Audit this site individually')],
              ] as const).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="text-body-2-medium text-neutral-900">{label}</span>
                  <Toggle checked={form.register[key]} onChange={(checked) => patch('register', { [key]: checked })} aria-label={label} />
                </div>
              ))}
            </div>
            {form.register.auditIndividually && (
              <FormField label={t('auditCalc.sites.individualReason', 'Why this site is audited individually')} required>
                <TextField value={form.register.individualAuditReason} maxLength={500}
                  onChange={(e) => patch('register', { individualAuditReason: e.target.value })} />
              </FormField>
            )}
          </div>
        </SectionHeading>

        <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
          <SectionHeading
            title={t('cab.applicationDraft.sitesFacilities.addSitePage.sections.samplingSurveillance')}
            accordion
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-body-2-medium text-neutral-900">
                  {t('cab.applicationDraft.sitesFacilities.addSitePage.includeInSampling')}
                </span>
                <Toggle
                  checked={form.sampling.includeInSampling}
                  onChange={(checked) => patch('sampling', { includeInSampling: checked })}
                  aria-label={t('cab.applicationDraft.sitesFacilities.addSitePage.includeInSampling')}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label={t('cab.applicationDraft.sitesFacilities.addSitePage.expectedSamples')}
                  required
                >
                  <TextField
                    type="text"
                    inputMode="numeric"
                    value={form.sampling.expectedSamples}
                    onChange={(e) => patch('sampling', { expectedSamples: e.target.value })}
                    placeholder={t('cab.applicationDraft.sitesFacilities.addSitePage.expectedSamplesPlaceholder')}
                  />
                </FormField>
                <FormField label={t('cab.applicationDraft.sitesFacilities.addSitePage.typeOfAudit')} required>
                  <SelectField
                    value={form.sampling.typeOfAudit}
                    options={translatedOptions(TYPE_OF_AUDIT_OPTIONS)}
                    onChange={(value) => patch('sampling', { typeOfAudit: value })}
                    placeholder={t('cab.applicationDraft.sitesFacilities.addSitePage.selectOption')}
                  />
                </FormField>
                <FormField label={t('cab.applicationDraft.sitesFacilities.addSitePage.surveillanceCycle')}>
                  <SelectField
                    value={form.sampling.surveillanceCycle}
                    options={translatedOptions(SURVEILLANCE_CYCLE_OPTIONS)}
                    onChange={(value) => patch('sampling', { surveillanceCycle: value })}
                    placeholder={t(
                      'cab.applicationDraft.sitesFacilities.addSitePage.surveillanceCyclePlaceholder'
                    )}
                  />
                </FormField>
                <FormField label={t('cab.applicationDraft.sitesFacilities.addSitePage.otherSitesCovered')}>
                  <MultiSelect
                    tags={form.sampling.otherSitesCovered}
                    options={otherSitesOptions}
                    onChange={(tags) => patch('sampling', { otherSitesCovered: tags })}
                    placeholder={t(
                      'cab.applicationDraft.sitesFacilities.addSitePage.otherSitesCoveredPlaceholder'
                    )}
                  />
                </FormField>
              </div>
            </div>
          </SectionHeading>

          <SectionHeading
            title={t('cab.applicationDraft.sitesFacilities.addSitePage.sections.contactPerson')}
            accordion
          >
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label={t('cab.applicationDraft.sitesFacilities.addSitePage.primaryContactName')}
                  required
                >
                  <TextField
                    type="text"
                    value={form.contact.name}
                    onChange={(e) => patch('contact', { name: e.target.value })}
                    placeholder={t('cab.applicationDraft.sitesFacilities.modal.contactNamePlaceholder')}
                  />
                </FormField>
                <FormField label={t('cab.applicationDraft.sitesFacilities.addSitePage.designation')}>
                  <TextField
                    type="text"
                    value={form.contact.designation}
                    onChange={(e) => patch('contact', { designation: e.target.value })}
                    placeholder={t('cab.applicationDraft.sitesFacilities.addSitePage.designationPlaceholder')}
                  />
                </FormField>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label={t('cab.applicationDraft.sitesFacilities.addSitePage.phoneNumber')} required>
                  <PhoneInputRow
                    rowClassName="gap-3"
                    value={form.contact.phoneCountryCode}
                    onChange={(code: CountryCode) => patch('contact', { phoneCountryCode: code })}
                    aria-label={t('cab.applicationDraft.sitesFacilities.addSitePage.phoneNumber')}
                  >
                    <div className="min-w-0 flex-1">
                      <TextField
                        type="tel"
                        icon={PhoneIcon}
                        value={form.contact.phone}
                        onChange={(e) => patch('contact', { phone: e.target.value })}
                        placeholder="5XXXXXXXX"
                        {...fieldProps('phone')}
                      />
                    </div>
                  </PhoneInputRow>
                </FormField>
                <FormField label={t('cab.applicationDraft.sitesFacilities.modal.contactEmail')} required>
                  <TextField
                    type="email"
                    icon={MailIcon}
                    value={form.contact.email}
                    onChange={(e) => patch('contact', { email: e.target.value })}
                    {...fieldProps('email')}
                  />
                </FormField>
              </div>
            </div>
          </SectionHeading>
        </div>

        <div className="rounded-lg border border-neutral-100 bg-white p-5">
          <h3 className="mb-4 text-body-1-medium text-neutral-900">
            {t('cab.applicationDraft.sitesFacilities.addSitePage.sections.siteIndicators')}
          </h3>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {SITE_INDICATOR_ITEMS.map(({ key, icon: Icon }) => (
              <div key={key} className="flex items-center gap-2 text-body-3 text-neutral-700">
                <Icon size={18} variant="Linear" className="text-primary" />
                <span>{t(`cab.applicationDraft.sitesFacilities.addSitePage.siteIndicators.${key}`)}</span>
              </div>
            ))}
          </div>
        </div>
          </>
        )}
      </div>

      <DashboardFooter
        onBack={handleBack}
        backDisabled={saving !== null}
        onSaveDraft={() => void handleSaveDraft()}
        saveDraftDisabled={!canSaveDraft || saving !== null || loading}
        saveDraftLoading={saving === 'draft'}
        onNext={() => void handleNext()}
        nextDisabled={!canSave || saving !== null || loading}
        nextLabel={saving === 'next' ? t('common.loading') : t('common.save')}
      />
    </CabLayout>
  )
}
