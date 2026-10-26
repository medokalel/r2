import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui'
import {
  SetupChipGroup,
  SetupNote,
  SetupSection,
} from '@/components/auth/cab/setup/CabSetupPrimitives'
import { IA_PROCESS_OPTIONS, IA_STANDARD_OPTIONS } from '@/lib/api/iaSetupApi'
import type { IaSetupStepProps } from '@/components/auth/ia/setup/types'

export function IaUniverseStep({ form, onPatchSetup }: IaSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.iaSetup

  const processOptions = useMemo(
    () => IA_PROCESS_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  const toggleStandard = (value: string) => {
    onPatchSetup({
      standards: setup.standards.includes(value)
        ? setup.standards.filter((item) => item !== value)
        : [...setup.standards, value],
    })
  }

  const toggleProcess = (value: string) => {
    onPatchSetup({
      processes: setup.processes.includes(value)
        ? setup.processes.filter((item) => item !== value)
        : [...setup.processes, value],
    })
  }

  return (
    <div className="w-full space-y-6">
      <SetupSection title={t('ia.setup.universe.standardsLabel')}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {IA_STANDARD_OPTIONS.map((standard) => (
            <label
              key={standard.value}
              className="flex cursor-pointer items-center gap-3 rounded-md border border-[var(--cab-border)] bg-white px-4 py-3 hover:border-primary-100"
            >
              <Checkbox
                checked={setup.standards.includes(standard.value)}
                onChange={() => toggleStandard(standard.value)}
                aria-label={standard.label}
              />
              <span className="text-body-sm text-[var(--cab-ink)]">{standard.label}</span>
            </label>
          ))}
        </div>
      </SetupSection>

      <SetupSection title={t('ia.setup.universe.processesLabel')}>
        <SetupChipGroup
          options={processOptions}
          selected={setup.processes}
          onToggle={toggleProcess}
        />
      </SetupSection>

      <SetupNote>{t('ia.setup.universe.note')}</SetupNote>
    </div>
  )
}
