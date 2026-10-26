import { useTranslation } from 'react-i18next'
import { AppIcon, BuildingIcon, SuccessCircleIcon } from '@/components/icons'
import { useProfileForm } from './ProfileFormContext'

export function CompanySummaryBanner({ incompleteKey = 'incompleteBranches' }: { incompleteKey?: string }) {
  const { t } = useTranslation()
  const { form } = useProfileForm()

  return (
    <div className="flex items-center gap-4 rounded-lg border border-neutral-100 bg-white p-5">
      {/* Company icon */}
      <div className="flex size-[64px] shrink-0 items-center justify-center rounded-lg bg-primary-25">
        <AppIcon icon={BuildingIcon} size={32} className="text-primary" />
      </div>

      {/* Name + badge row, then tags */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-body-lg font-medium leading-[1.6] text-neutral-900">
            {form.organizationName || t('companyProfile.title')}
          </p>
          <div className="flex shrink-0 items-center gap-2 rounded-md bg-success-25 px-3 py-1.5">
            <AppIcon icon={SuccessCircleIcon} size={16} className="shrink-0 text-success-600" />
            <p className="text-body-sm font-medium leading-[1.6] text-success-600">
              {t(`companyProfile.completedSteps.${incompleteKey}`)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {form.industries.map((s) => (
            <span
              key={s}
              className="rounded-md bg-primary-25 px-3 py-1 text-body-sm font-normal text-primary"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
