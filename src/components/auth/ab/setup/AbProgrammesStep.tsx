import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox, TextField } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import {
  SetupAddLink,
  SetupChipGroup,
  SetupRecordCard,
  SetupSection,
} from '@/components/auth/cab/setup/CabSetupPrimitives'
import {
  AB_JURISDICTION_OPTIONS,
  AB_LIFECYCLE_OPTIONS,
  AB_PROGRAMME_OPTIONS,
} from '@/lib/api/abSetupApi'
import { createAbCustomProgramme, type AbCustomProgramme } from '@/lib/abSetupForm'
import type { AbSetupStepProps } from '@/components/auth/ab/setup/types'

export function AbProgrammesStep({ form, onPatchSetup }: AbSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.abSetup

  const lifecycleOptions = useMemo(
    () => AB_LIFECYCLE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const jurisdictionOptions = useMemo(
    () => AB_JURISDICTION_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  const toggleProgramme = (value: string) => {
    onPatchSetup({
      programmes: setup.programmes.includes(value)
        ? setup.programmes.filter((programme) => programme !== value)
        : [...setup.programmes, value],
    })
  }

  const toggleLifecycle = (value: string) => {
    onPatchSetup({
      lifecycle: setup.lifecycle.includes(value)
        ? setup.lifecycle.filter((item) => item !== value)
        : [...setup.lifecycle, value],
    })
  }

  const updateCustomProgramme = (id: string, fields: Partial<AbCustomProgramme>) => {
    onPatchSetup({
      customProgrammes: setup.customProgrammes.map((programme) =>
        programme.id === id ? { ...programme, ...fields } : programme
      ),
    })
  }

  return (
    <div className="w-full space-y-6">
      <SetupSection title={t('ab.setup.programmes.programmesLabel')}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {AB_PROGRAMME_OPTIONS.map((programme) => (
            <label
              key={programme.value}
              className="flex cursor-pointer items-center gap-3 rounded-md border border-[var(--cab-border)] bg-white px-4 py-3 hover:border-primary-100"
            >
              <Checkbox
                checked={setup.programmes.includes(programme.value)}
                onChange={() => toggleProgramme(programme.value)}
                aria-label={programme.label}
              />
              <span className="text-body-sm text-[var(--cab-ink)]">{programme.label}</span>
            </label>
          ))}
        </div>
      </SetupSection>

      <SetupSection
        title={t('ab.setup.programmes.customLabel')}
        action={
          <SetupAddLink
            label={t('ab.setup.programmes.addCustom')}
            onClick={() =>
              onPatchSetup({ customProgrammes: [...setup.customProgrammes, createAbCustomProgramme()] })
            }
          />
        }
      >
        {setup.customProgrammes.length === 0 ? (
          <p className="text-caption text-[var(--cab-muted)]">{t('ab.setup.programmes.customEmpty')}</p>
        ) : (
          <div className="space-y-4">
            {setup.customProgrammes.map((programme, index) => (
              <SetupRecordCard
                key={programme.id}
                title={t('ab.setup.programmes.customTitle', { index: index + 1 })}
                removeLabel={t('common.delete')}
                onRemove={() =>
                  onPatchSetup({
                    customProgrammes: setup.customProgrammes.filter((item) => item.id !== programme.id),
                  })
                }
              >
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                  <TextField
                    id={`ab-setup-custom-prog-name-${programme.id}`}
                    label={t('ab.setup.programmes.customName')}
                    required
                    type="text"
                    value={programme.name}
                    placeholder={t('ab.setup.programmes.customNamePlaceholder')}
                    onChange={(event) => updateCustomProgramme(programme.id, { name: event.target.value })}
                  />
                  <TextField
                    id={`ab-setup-custom-prog-owner-${programme.id}`}
                    label={t('ab.setup.programmes.customOwner')}
                    type="text"
                    value={programme.owner}
                    placeholder={t('ab.setup.programmes.customOwnerPlaceholder')}
                    onChange={(event) => updateCustomProgramme(programme.id, { owner: event.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                  <TextField
                    id={`ab-setup-custom-prog-doc-${programme.id}`}
                    label={t('ab.setup.programmes.customDocument')}
                    type="text"
                    value={programme.normativeDocument}
                    placeholder={t('ab.setup.programmes.customDocumentPlaceholder')}
                    onChange={(event) =>
                      updateCustomProgramme(programme.id, { normativeDocument: event.target.value })
                    }
                  />
                  <TextField
                    id={`ab-setup-custom-prog-version-${programme.id}`}
                    label={t('ab.setup.programmes.customVersion')}
                    type="text"
                    value={programme.version}
                    placeholder={t('ab.setup.programmes.customVersionPlaceholder')}
                    onChange={(event) => updateCustomProgramme(programme.id, { version: event.target.value })}
                  />
                </div>
              </SetupRecordCard>
            ))}
          </div>
        )}
      </SetupSection>

      <SetupSection title={t('ab.setup.programmes.lifecycleLabel')}>
        <SetupChipGroup
          options={lifecycleOptions}
          selected={setup.lifecycle}
          onToggle={toggleLifecycle}
        />
      </SetupSection>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <SearchableSelect
          id="ab-setup-market"
          label={t('ab.setup.programmes.market')}
          value={setup.marketJurisdiction}
          onChange={(marketJurisdiction) => onPatchSetup({ marketJurisdiction })}
          options={jurisdictionOptions}
          placeholder={t('ab.setup.programmes.marketPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <TextField
          id="ab-setup-regulator"
          label={t('ab.setup.programmes.regulator')}
          type="text"
          value={setup.regulator}
          placeholder={t('ab.setup.programmes.regulatorPlaceholder')}
          onChange={(event) => onPatchSetup({ regulator: event.target.value })}
        />
      </div>
    </div>
  )
}
