import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox, TextField } from '@/components/ui'
import { SetupSection } from '@/components/auth/cab/setup/CabSetupPrimitives'
import { SA_CATEGORY_OPTIONS } from '@/lib/api/saSetupApi'
import type { SaSetupStepProps } from '@/components/auth/sa/setup/types'

export function SaCategoriesStep({ form, onPatchSetup }: SaSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.saSetup

  const categoryOptions = useMemo(
    () => SA_CATEGORY_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  const toggleCategory = (value: string) => {
    onPatchSetup({
      categories: setup.categories.includes(value)
        ? setup.categories.filter((item) => item !== value)
        : [...setup.categories, value],
    })
  }

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <TextField
          id="sa-setup-category-owner"
          label={t('sa.setup.categories.categoryOwner')}
          required
          type="text"
          value={setup.categoryOwner}
          placeholder={t('sa.setup.categories.categoryOwnerPlaceholder')}
          onChange={(event) => onPatchSetup({ categoryOwner: event.target.value })}
        />
        <TextField
          id="sa-setup-custom-categories"
          label={t('sa.setup.categories.customCategories')}
          type="text"
          value={setup.customCategories}
          placeholder={t('sa.setup.categories.customCategoriesPlaceholder')}
          onChange={(event) => onPatchSetup({ customCategories: event.target.value })}
        />
      </div>

      <SetupSection title={t('sa.setup.categories.keyCategories')}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categoryOptions.map((category) => (
            <label
              key={category.value}
              className="flex cursor-pointer items-center gap-3 rounded-md border border-[var(--cab-border)] bg-white px-4 py-3 hover:border-primary-100"
            >
              <Checkbox
                checked={setup.categories.includes(category.value)}
                onChange={() => toggleCategory(category.value)}
                aria-label={category.label}
              />
              <span className="text-body-sm text-[var(--cab-ink)]">{category.label}</span>
            </label>
          ))}
        </div>
      </SetupSection>
    </div>
  )
}
