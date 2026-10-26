import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormLabel } from '@/components/ui'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { fetchGovernorateOptions, type GovernorateOption } from '@/lib/governorates'
import {
  SetupFileInput,
  SetupRecordCard,
  SetupSection,
  SetupToggleRow,
} from '@/components/auth/cab/setup/CabSetupPrimitives'
import { getIafCodeOptions, getSchemeOptions } from '@/lib/api/cabSetupApi'
import { iafSectorKey, toIafValue } from '@/lib/iafSectors'
import { SectorIcon } from '@/components/icons/sectorIcons'
import { createScopeRecord, ensureScopeRecords, type CabScopeRecord } from '@/lib/cabSetupForm'
import type { CabSetupStepProps } from '@/components/auth/cab/setup/types'

const HEAD_OFFICE_ID = 'HEAD_OFFICE'

/** The same field-sector icon the personnel register and field-sectors picker show for an IAF code. */
function renderSectorIcon(code: string) {
  const sector = iafSectorKey(code)
  if (!sector) return null
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-white shadow-[inset_0_0_0_1px_var(--cab-border)]">
      <SectorIcon sector={sector} selected className="size-4" />
    </span>
  )
}

export function CabScopeStep({ form, onPatchSetup }: CabSetupStepProps) {
  const { t, i18n } = useTranslation()
  const { scopes, schemes, accreditationRecords, locations } = form.cabSetup

  /** Only schemes the CAB actually selected on the previous screen. */
  const schemeOptions = useMemo(() => {
    const all = getSchemeOptions(form.cabSetup.activities)
    const selected = all.filter((scheme) => schemes.includes(scheme.value))
    const custom = form.cabSetup.customSchemes
      .filter((scheme) => scheme.name.trim())
      .map((scheme) => ({ value: scheme.id, label: scheme.name }))
    return [...selected, ...custom]
  }, [form.cabSetup.activities, form.cabSetup.customSchemes, schemes])

  /** Active or applicant accreditation records are valid scope anchors. */
  const recordOptions = useMemo(
    () =>
      accreditationRecords
        .filter((record) => record.body)
        .map((record, index) => ({
          value: record.id,
          label: record.number.trim()
            ? `${record.body} / ${record.number}`
            : t('cab.setup.accreditationRecords.recordTab', { index: index + 1 }),
        })),
    [accreditationRecords, t]
  )

  // The head-office city is stored as a governorate id, so resolve its display name.
  const [governorates, setGovernorates] = useState<GovernorateOption[]>([])

  useEffect(() => {
    let cancelled = false
    // Both branches resolve asynchronously so the effect never sets state synchronously.
    const load = form.country
      ? fetchGovernorateOptions(form.country)
      : Promise.resolve<GovernorateOption[]>([])
    load.then((options) => {
      if (!cancelled) setGovernorates(options)
    })
    return () => {
      cancelled = true
    }
  }, [form.country])

  const locationOptions = useMemo(() => {
    const cityName = governorates.find((governorate) => governorate.id === form.city)?.name ?? ''
    const head = {
      value: HEAD_OFFICE_ID,
      label: cityName
        ? t('cab.setup.scope.headOfficeWithCity', { city: cityName })
        : t('cab.setup.scope.headOffice'),
    }
    const branches = locations
      .filter((location) => location.name.trim())
      .map((location) => ({ value: location.id, label: location.name }))
    return [head, ...branches]
  }, [form.city, governorates, locations, t])

  const iafOptions = useMemo(() => getIafCodeOptions(i18n.language), [i18n.language])

  const updateScope = (id: string, fields: Partial<CabScopeRecord>) => {
    onPatchSetup({
      scopes: scopes.map((scope) => (scope.id === id ? { ...scope, ...fields } : scope)),
    })
  }

  // Open with a scope card ready — same pattern as accreditation records.
  useEffect(() => {
    if (scopes.length > 0) return
    onPatchSetup({ scopes: ensureScopeRecords(1, []) })
  }, [scopes.length, onPatchSetup])

  return (
    <div className="w-full space-y-6">

      <div className="space-y-4">
        {scopes.map((scope, index) => (
          <SetupRecordCard
            key={scope.id}
            title={t('cab.setup.scope.scopeTitle', { index: index + 1 })}
            removeLabel={t('common.delete')}
            onRemove={
              scopes.length > 1
                ? () => onPatchSetup({ scopes: scopes.filter((item) => item.id !== scope.id) })
                : undefined
            }
          >
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <SearchableSelect
                id={`cab-setup-scope-scheme-${scope.id}`}
                label={t('cab.setup.scope.scheme')}
                required
                value={scope.scheme}
                onChange={(scheme) => updateScope(scope.id, { scheme })}
                options={schemeOptions}
                placeholder={t('cab.setup.scope.schemePlaceholder')}
                searchPlaceholder={t('common.search')}
              />
              <SearchableSelect
                id={`cab-setup-scope-record-${scope.id}`}
                label={t('cab.setup.scope.accreditationRecord')}
                value={scope.accreditationRecordId}
                onChange={(accreditationRecordId) => updateScope(scope.id, { accreditationRecordId })}
                options={recordOptions}
                placeholder={
                  recordOptions.length > 0
                    ? t('cab.setup.scope.accreditationRecordPlaceholder')
                    : t('cab.setup.scope.noAccreditationRecords')
                }
                searchPlaceholder={t('common.search')}
              />
            </div>

            <SearchableSelect
              id={`cab-setup-scope-location-${scope.id}`}
              label={t('cab.setup.scope.location')}
              required
              value={scope.locationId}
              onChange={(locationId) => updateScope(scope.id, { locationId })}
              options={locationOptions}
              placeholder={t('cab.setup.scope.locationPlaceholder')}
              searchPlaceholder={t('common.search')}
            />

            <div className="space-y-2">
              <FormLabel>{t('cab.setup.scope.codes')}</FormLabel>
              <MultiSelect
                tags={[...new Set(scope.codes.map(toIafValue))]}
                options={iafOptions}
                onChange={(codes) => updateScope(scope.id, { codes })}
                renderIcon={renderSectorIcon}
                layout="stacked"
                searchable
                placeholder={t('cab.setup.scope.codesPlaceholder')}
                searchPlaceholder={t('common.search')}
              />
            </div>
          </SetupRecordCard>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onPatchSetup({ scopes: [...scopes, createScopeRecord()] })}
        className="text-caption font-bold text-[var(--cab-primary)] hover:underline"
      >
        {t('cab.setup.scope.addScope')}
      </button>

      <SetupSection title={t('cab.setup.scope.uploadTitle')}>
        <p className="mb-3 text-caption text-[var(--cab-muted)]">{t('cab.setup.scope.uploadHint')}</p>
        <SetupFileInput
          id="cab-setup-scope-file"
          accept=".pdf,.xlsx,.xls"
          fileName={form.cabSetup.scopeFileName}
          onFileNameChange={(scopeFileName) => onPatchSetup({ scopeFileName })}
          selectLabel={t('register.selectFile')}
          changeLabel={t('companyProfile.profileHeader.changeFile')}
          removeLabel={t('common.delete')}
        />
      </SetupSection>

      <SetupSection>
        <SetupToggleRow
          label={t('cab.setup.scope.restrictApplications')}
          checked={form.cabSetup.restrictApplicationsToScope}
          onChange={(restrictApplicationsToScope) => onPatchSetup({ restrictApplicationsToScope })}
        />
        <SetupToggleRow
          label={t('cab.setup.scope.requireTechnicalReview')}
          checked={form.cabSetup.requireTechnicalReviewForExceptions}
          onChange={(requireTechnicalReviewForExceptions) =>
            onPatchSetup({ requireTechnicalReviewForExceptions })
          }
        />
      </SetupSection>
    </div>
  )
}
