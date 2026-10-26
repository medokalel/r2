import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormLabel, TextField } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { DatePicker } from '@/components/ui/DatePicker'
import {
  SetupAddLink,
  SetupFileInput,
  SetupSection,
  SetupToggleRow,
} from '@/components/auth/cab/setup/CabSetupPrimitives'
import { SO_SCHEME_STATUS_OPTIONS, schemeStatusNeedsEffectiveDate } from '@/lib/api/soSetupApi'
import { createSoScheme, type SoSchemeRecord } from '@/lib/soSetupForm'
import { cn } from '@/lib/utils'
import type { SoSetupStepProps } from '@/components/auth/so/setup/types'

function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function fromIsoDate(value: string): Date | undefined {
  if (!value) return undefined
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

export function SoSchemesStep({ form, onPatchSetup }: SoSetupStepProps) {
  const { t } = useTranslation()
  const schemes = form.soSetup.schemes
  const [activeIndex, setActiveIndex] = useState(0)

  const statusOptions = useMemo(
    () => SO_SCHEME_STATUS_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  const active = schemes[Math.min(activeIndex, Math.max(schemes.length - 1, 0))]

  const update = (id: string, fields: Partial<SoSchemeRecord>) => {
    onPatchSetup({
      schemes: schemes.map((scheme) => (scheme.id === id ? { ...scheme, ...fields } : scheme)),
    })
  }

  const addScheme = () => {
    onPatchSetup({ schemes: [...schemes, createSoScheme()], schemeCount: schemes.length + 1 })
    setActiveIndex(schemes.length)
  }

  if (!active) {
    return (
      <div className="w-full">
        <SetupAddLink label={t('so.setup.schemes.addAnother')} onClick={addScheme} />
      </div>
    )
  }

  const needsEffectiveDate = schemeStatusNeedsEffectiveDate(active.status)

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {schemes.map((scheme, index) => (
          <button
            key={scheme.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={cn(
              'rounded-full border px-5 py-2 text-caption font-bold transition-colors',
              index === activeIndex
                ? 'border-[var(--cab-primary)] bg-[var(--cab-subtle)] text-[var(--cab-primary)]'
                : 'border-[var(--cab-border)] bg-white text-[var(--cab-muted)] hover:border-primary-100'
            )}
          >
            {scheme.code.trim() || t('so.setup.schemes.schemeTab', { index: index + 1 })}
          </button>
        ))}
        <SetupAddLink label={t('so.setup.schemes.addAnother')} onClick={addScheme} />
      </div>

      <SetupSection
        title={t('so.setup.schemes.schemeTab', { index: activeIndex + 1 })}
        action={
          schemes.length > 1 ? (
            <button
              type="button"
              onClick={() => {
                const next = schemes.filter((scheme) => scheme.id !== active.id)
                onPatchSetup({ schemes: next, schemeCount: Math.max(next.length, 1) })
                setActiveIndex(0)
              }}
              className="rounded-md px-2 py-1 text-caption font-bold text-error-500 hover:bg-error-50"
            >
              {t('common.delete')}
            </button>
          ) : null
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <TextField
              id={`so-setup-scheme-name-${active.id}`}
              label={t('so.setup.schemes.name')}
              required
              type="text"
              value={active.name}
              placeholder={t('so.setup.schemes.namePlaceholder')}
              onChange={(event) => update(active.id, { name: event.target.value })}
            />
            <TextField
              id={`so-setup-scheme-code-${active.id}`}
              label={t('so.setup.schemes.code')}
              required
              type="text"
              value={active.code}
              placeholder={t('so.setup.schemes.codePlaceholder')}
              onChange={(event) => update(active.id, { code: event.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <TextField
              id={`so-setup-scheme-version-${active.id}`}
              label={t('so.setup.schemes.version')}
              required
              type="text"
              value={active.version}
              placeholder={t('so.setup.schemes.versionPlaceholder')}
              onChange={(event) => update(active.id, { version: event.target.value })}
            />

            <SearchableSelect
              id={`so-setup-scheme-status-${active.id}`}
              label={t('so.setup.schemes.status')}
              required
              value={active.status}
              onChange={(status) => update(active.id, { status })}
              options={statusOptions}
              placeholder={t('so.setup.schemes.statusPlaceholder')}
              searchPlaceholder={t('common.search')}
            />

            {/* A draft scheme has no effective date yet. */}
            {needsEffectiveDate && (
              <div className="space-y-2">
                <FormLabel htmlFor={`so-setup-scheme-effective-${active.id}`} required>
                  {t('so.setup.schemes.effectiveDate')}
                </FormLabel>
                <DatePicker
                  value={fromIsoDate(active.effectiveDate)}
                  onChange={(date) => update(active.id, { effectiveDate: toIsoDate(date) })}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <FormLabel required>{t('so.setup.schemes.document')}</FormLabel>
            <SetupFileInput
              id={`so-setup-scheme-file-${active.id}`}
              fileName={active.documentFileName}
              onFileNameChange={(documentFileName) => update(active.id, { documentFileName })}
              selectLabel={t('so.setup.schemes.uploadPdf')}
              changeLabel={t('companyProfile.profileHeader.changeFile')}
              removeLabel={t('common.delete')}
            />
          </div>

          <div className="border-t border-[var(--cab-border)] pt-2">
            <SetupToggleRow
              label={t('so.setup.schemes.reviewReminders')}
              checked={active.reviewReminders}
              onChange={(reviewReminders) => update(active.id, { reviewReminders })}
            />
            <SetupToggleRow
              label={t('so.setup.schemes.keepPreviousVersions')}
              checked={active.keepPreviousVersions}
              onChange={(keepPreviousVersions) => update(active.id, { keepPreviousVersions })}
            />
          </div>
        </div>
      </SetupSection>
    </div>
  )
}
