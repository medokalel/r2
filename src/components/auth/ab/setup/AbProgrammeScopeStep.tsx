import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormLabel } from '@/components/ui'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { fetchGovernorateOptions, type GovernorateOption } from '@/lib/governorates'
import {
  SetupAddLink,
  SetupFileInput,
  SetupRecordCard,
  SetupSection,
  SetupToggleRow,
} from '@/components/auth/cab/setup/CabSetupPrimitives'
import {
  AB_COOPERATION_BODY_OPTIONS,
  AB_PROGRAMME_OPTIONS,
  getArrangementOptions,
  getIafCodeOptions,
} from '@/lib/api/abSetupApi'
import { createAbProgrammeScope, type AbProgrammeScope } from '@/lib/abSetupForm'
import type { AbSetupStepProps } from '@/components/auth/ab/setup/types'

const HEADQUARTERS_ID = 'HEADQUARTERS'

export function AbProgrammeScopeStep({ form, onPatchSetup }: AbSetupStepProps) {
  const { t, i18n } = useTranslation()
  const setup = form.abSetup

  /** Only the programmes selected on the previous screen. */
  const programmeOptions = useMemo(() => {
    const selected = AB_PROGRAMME_OPTIONS.filter((programme) =>
      setup.programmes.includes(programme.value)
    )
    const custom = setup.customProgrammes
      .filter((programme) => programme.name.trim())
      .map((programme) => ({ value: programme.id, label: programme.name }))
    return [...selected, ...custom]
  }, [setup.customProgrammes, setup.programmes])

  /** Only arrangements that actually exist, labelled as the deck shows them. */
  const arrangementOptions = useMemo(
    () =>
      setup.recognitionRecords
        .filter((record) => record.cooperationBody)
        .map((record, index) => {
          const level = getArrangementOptions(record.cooperationBody).find(
            (option) => option.value === record.arrangement
          )
          const body = AB_COOPERATION_BODY_OPTIONS.find(
            (option) => option.value === record.cooperationBody
          )
          return {
            value: record.id,
            label:
              level?.label ??
              body?.value ??
              t('ab.setup.recognitionRecords.recordTab', { index: index + 1 }),
          }
        }),
    [setup.recognitionRecords, t]
  )

  // The headquarters city is stored as a governorate id, so resolve its name.
  const [governorates, setGovernorates] = useState<GovernorateOption[]>([])

  useEffect(() => {
    let cancelled = false
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

  const officeOptions = useMemo(() => {
    const cityName = governorates.find((governorate) => governorate.id === form.city)?.name ?? ''
    const headquarters = {
      value: HEADQUARTERS_ID,
      label: cityName
        ? t('ab.setup.scope.headquartersWithCity', { city: cityName })
        : t('ab.setup.scope.headquarters'),
    }
    const branches = setup.offices
      .filter((office) => office.name.trim())
      .map((office) => ({ value: office.id, label: office.name }))
    return [headquarters, ...branches]
  }, [form.city, governorates, setup.offices, t])

  const updateScope = (id: string, fields: Partial<AbProgrammeScope>) => {
    onPatchSetup({
      scopes: setup.scopes.map((scope) => (scope.id === id ? { ...scope, ...fields } : scope)),
    })
  }

  return (
    <div className="w-full space-y-6">
      {setup.scopes.length === 0 && (
        <p className="text-caption text-[var(--cab-muted)]">{t('ab.setup.scope.empty')}</p>
      )}

      <div className="space-y-4">
        {setup.scopes.map((scope, index) => (
          <SetupRecordCard
            key={scope.id}
            title={t('ab.setup.scope.scopeTitle', { index: index + 1 })}
            removeLabel={t('common.delete')}
            onRemove={
              setup.scopes.length > 1
                ? () => onPatchSetup({ scopes: setup.scopes.filter((item) => item.id !== scope.id) })
                : undefined
            }
          >
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              <SearchableSelect
                id={`ab-setup-scope-programme-${scope.id}`}
                label={t('ab.setup.scope.programme')}
                required
                value={scope.programme}
                onChange={(programme) => updateScope(scope.id, { programme })}
                options={programmeOptions}
                placeholder={t('ab.setup.scope.programmePlaceholder')}
                searchPlaceholder={t('common.search')}
              />
              <SearchableSelect
                id={`ab-setup-scope-arrangement-${scope.id}`}
                label={t('ab.setup.scope.arrangement')}
                value={scope.recognitionRecordId}
                onChange={(recognitionRecordId) => updateScope(scope.id, { recognitionRecordId })}
                options={arrangementOptions}
                placeholder={
                  arrangementOptions.length > 0
                    ? t('ab.setup.scope.arrangementPlaceholder')
                    : t('ab.setup.scope.noArrangements')
                }
                searchPlaceholder={t('common.search')}
              />
              <SearchableSelect
                id={`ab-setup-scope-office-${scope.id}`}
                label={t('ab.setup.scope.office')}
                required
                value={scope.officeId}
                onChange={(officeId) => updateScope(scope.id, { officeId })}
                options={officeOptions}
                placeholder={t('ab.setup.scope.officePlaceholder')}
                searchPlaceholder={t('common.search')}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>{t('ab.setup.scope.classifications')}</FormLabel>
              <MultiSelect
                tags={scope.classifications}
                options={getIafCodeOptions(i18n.language)}
                onChange={(classifications) => updateScope(scope.id, { classifications })}
                layout="stacked"
                searchable
                placeholder={t('ab.setup.scope.classificationsPlaceholder')}
                searchPlaceholder={t('common.search')}
              />
            </div>
          </SetupRecordCard>
        ))}
      </div>

      <SetupAddLink
        label={t('ab.setup.scope.addScope')}
        onClick={() => onPatchSetup({ scopes: [...setup.scopes, createAbProgrammeScope()] })}
      />

      <SetupSection title={t('ab.setup.scope.uploadTitle')}>
        <p className="mb-3 text-caption text-[var(--cab-muted)]">{t('ab.setup.scope.uploadHint')}</p>
        <SetupFileInput
          id="ab-setup-scope-file"
          accept=".pdf,.xlsx,.xls"
          fileName={setup.scopeFileName}
          onFileNameChange={(scopeFileName) => onPatchSetup({ scopeFileName })}
          selectLabel={t('register.selectFile')}
          changeLabel={t('companyProfile.profileHeader.changeFile')}
          removeLabel={t('common.delete')}
        />
      </SetupSection>

      <SetupSection>
        <SetupToggleRow
          label={t('ab.setup.scope.acceptOnlyActive')}
          checked={setup.acceptOnlyActiveProgrammes}
          onChange={(acceptOnlyActiveProgrammes) => onPatchSetup({ acceptOnlyActiveProgrammes })}
        />
        <SetupToggleRow
          label={t('ab.setup.scope.requireApproval')}
          checked={setup.requireApprovalForExtensions}
          onChange={(requireApprovalForExtensions) => onPatchSetup({ requireApprovalForExtensions })}
        />
      </SetupSection>
    </div>
  )
}
