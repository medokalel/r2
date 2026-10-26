import { useTranslation } from 'react-i18next'
import { Checkbox, TextField } from '@/components/ui'
import { SetupNote, SetupSection } from '@/components/auth/cab/setup/CabSetupPrimitives'
import { SO_SCHEME_FAMILY_OPTIONS } from '@/lib/api/soSetupApi'
import { createSoScheme } from '@/lib/soSetupForm'
import type { SoSetupStepProps } from '@/components/auth/so/setup/types'

export function SoFamiliesStep({ form, onPatchSetup }: SoSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.soSetup

  const toggleFamily = (value: string) => {
    onPatchSetup({
      schemeFamilies: setup.schemeFamilies.includes(value)
        ? setup.schemeFamilies.filter((item) => item !== value)
        : [...setup.schemeFamilies, value],
    })
  }

  /** Keep the scheme list in step with the count so screen 4 opens ready. */
  const setSchemeCount = (raw: string) => {
    const parsed = Number(raw.replace(/\D/g, ''))
    const count = Math.min(Math.max(Number.isNaN(parsed) ? 1 : parsed, 1), 20)

    const schemes = [...setup.schemes]
    while (schemes.length < count) schemes.push(createSoScheme())
    schemes.length = count

    onPatchSetup({ schemeCount: count, schemes })
  }

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-[345px_1fr]">
        <TextField
          id="so-setup-scheme-count"
          label={t('so.setup.families.schemeCount')}
          required
          type="text"
          lang="en"
          dir="ltr"
          inputMode="numeric"
          value={String(setup.schemeCount)}
          onChange={(event) => setSchemeCount(event.target.value)}
        />
        <div />
      </div>

      <SetupSection title={t('so.setup.families.familiesLabel')}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SO_SCHEME_FAMILY_OPTIONS.map((family) => (
            <label
              key={family.value}
              className="flex cursor-pointer items-center gap-3 rounded-md border border-[var(--cab-border)] bg-white px-4 py-3 hover:border-primary-100"
            >
              <Checkbox
                checked={setup.schemeFamilies.includes(family.value)}
                onChange={() => toggleFamily(family.value)}
                aria-label={t(family.labelKey)}
              />
              <span className="text-body-sm text-[var(--cab-ink)]">{t(family.labelKey)}</span>
            </label>
          ))}
        </div>
      </SetupSection>

      <SetupNote>{t('so.setup.families.note')}</SetupNote>
    </div>
  )
}
