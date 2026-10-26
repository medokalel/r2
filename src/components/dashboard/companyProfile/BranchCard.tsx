import { useTranslation } from 'react-i18next'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Button } from '@/components/ui/Button'
import {
  AppIcon,
  MapPinIcon,
  PhoneIcon,
  TrashIcon,
  UserIcon,
  UsersIcon,
} from '@/components/icons'
import { LocationPicker } from '@/components/maps/LocationPicker'
import { cn } from '@/lib/utils'
import type { OrgBranch } from '@/lib/api/organizationProfileApi'

interface BranchCardProps {
  branch: OrgBranch
  onDelete: (id: string) => void
  onEdit: (branch: OrgBranch) => void
}

export function BranchCard({ branch, onDelete, onEdit }: BranchCardProps) {
  const { t } = useTranslation()
  const isPermanent = branch.branchType !== 'TEMPORARY'
  const sectors = branch.industry ? branch.industry.split(', ').filter(Boolean) : []
  const phone = `${branch.phoneCountryCode ?? ''}${branch.phoneNumber ?? ''}`
  const branchLocation =
    branch.latitude != null && branch.longitude != null
      ? { lat: branch.latitude, lng: branch.longitude }
      : null

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-lg border border-neutral-100 bg-white p-4">
      {/* Branch name + type badge at start, three-dots at end */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="text-body-lg font-medium leading-[1.6] text-neutral-900">{branch.branchName}</p>
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-caption font-medium leading-5',
              isPermanent ? 'bg-success-25 text-success-600' : 'bg-warning-100 text-warning-700'
            )}
          >
            {isPermanent ? t('companyProfile.addBranch.permanent') : t('companyProfile.addBranch.temporary')}
          </span>
        </div>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="shrink-0 rounded p-1 text-neutral-500 hover:text-neutral-700 focus-visible:outline-none data-[state=open]:text-neutral-700"
              aria-label={t('common.moreOptions')}
            >
              <svg width="4" height="16" viewBox="0 0 4 20" fill="currentColor">
                <circle cx="2" cy="2" r="2"/><circle cx="2" cy="10" r="2"/><circle cx="2" cy="18" r="2"/>
              </svg>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-32 rounded-md border border-neutral-300 bg-white p-1 shadow-lg"
              sideOffset={4}
              align="end"
            >
              <DropdownMenu.Item
                onSelect={() => onDelete(branch.id)}
                className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2 text-body-sm text-error-500 outline-none data-[highlighted]:bg-error-50"
              >
                <AppIcon icon={TrashIcon} size={16} className="shrink-0" />
                {t('common.delete')}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-caption text-neutral-700">{t('companyProfile.branchesCard.registryLabel')}</span>
        <span dir="ltr" className="whitespace-nowrap text-body-sm font-medium text-neutral-900"># {branch.commercialRegisterNumber}</span>
      </div>

      {/* Address — icon at start, text after */}
      <div className="flex items-center gap-1">
        <AppIcon icon={MapPinIcon} size={14} className="shrink-0 text-primary" />
        <span className="text-caption font-normal text-neutral-700">{branch.address}</span>
      </div>

      <LocationPicker
        readOnly
        value={branchLocation}
        className="h-[140px] w-full"
      />

      {/* Manager and phone — icons at start */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <AppIcon icon={UserIcon} size={14} className="text-neutral-800" />
          <span className="text-caption font-medium text-neutral-700">{branch.branchManagerName}</span>
        </div>
        <div className="h-3 w-px bg-neutral-300" />
        <div className="flex items-center gap-1">
          <AppIcon icon={PhoneIcon} size={14} className="text-neutral-800" />
          <span dir="ltr" className="text-caption font-medium text-neutral-700">{phone}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <AppIcon icon={UsersIcon} size={14} className="text-neutral-800" />
        <span className="text-caption text-neutral-700">{t('companyProfile.branchesCard.employeesLabel')}</span>
        <div className="h-3 w-px bg-neutral-300" />
        <span dir="ltr" className="text-caption font-medium text-neutral-900">{branch.employeeCount ?? 0}</span>
        <span className="text-caption text-neutral-900">{t('companyProfile.branchesCard.employeeUnit')}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {sectors.map((s) => (
          <span key={s} className="rounded-md bg-primary-25 px-2 py-1 text-caption font-normal text-primary">
            {s}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" className="flex-1" onClick={() => onEdit(branch)}>
          {t('companyProfile.branchesCard.edit')}
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => branch.googleMapUrl && window.open(branch.googleMapUrl, '_blank')}
          disabled={!branch.googleMapUrl}
        >
          {t('companyProfile.branchesCard.view')}
        </Button>
      </div>
    </div>
  )
}
