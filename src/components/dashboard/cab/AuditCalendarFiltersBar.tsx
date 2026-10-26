import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { SelectField, DateRangePicker } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { AuditCalendarFiltersState } from '@/components/dashboard/cab/auditCalendarShared'

interface AuditCalendarFiltersBarProps {
  filters: AuditCalendarFiltersState
  className?: string
}

export function AuditCalendarFiltersBar({ filters, className }: AuditCalendarFiltersBarProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6', className)}>
      <div className="space-y-1.5">
        <p className="text-body-sm font-medium text-neutral-800">
          {t('cab.dashboard.auditCalendar.filters.dateRange')}
        </p>
        <DateRangePicker value={filters.dateRange} onChange={filters.setDateRange} className="[&_button]:h-11" />
      </div>
      <div className="space-y-1.5">
        <p className="text-body-sm font-medium text-neutral-800">
          {t('cab.dashboard.auditCalendar.filters.auditType')}
        </p>
        <SelectField
          value={filters.auditTypeFilter}
          onChange={filters.setAuditTypeFilter}
          options={filters.auditTypeOptions}
          placeholder={t('cab.dashboard.auditCalendar.filters.allTypes')}
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-body-sm font-medium text-neutral-800">
          {t('cab.dashboard.auditCalendar.filters.standard')}
        </p>
        <SelectField
          value={filters.standardFilter}
          onChange={filters.setStandardFilter}
          options={filters.standardOptions}
          placeholder={t('cab.dashboard.auditCalendar.filters.all')}
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-body-sm font-medium text-neutral-800">
          {t('cab.dashboard.auditCalendar.filters.auditStatus')}
        </p>
        <SelectField
          value={filters.statusFilter}
          onChange={filters.setStatusFilter}
          options={filters.statusFilterOptions}
          placeholder={t('cab.dashboard.auditCalendar.filters.allStatus')}
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-body-sm font-medium text-neutral-800">
          {t('cab.dashboard.auditCalendar.filters.auditorTeam')}
        </p>
        <SelectField
          value={filters.auditorFilter}
          onChange={filters.setAuditorFilter}
          options={filters.auditorOptions}
          placeholder={t('cab.dashboard.auditCalendar.filters.all')}
        />
      </div>
      <div className="flex items-end">
        <Button
          variant="secondary"
          className="h-11 w-full rounded-md"
          disabled={!filters.hasActiveFilters}
          onClick={filters.reset}
        >
          {t('cab.dashboard.auditCalendar.filters.reset')}
        </Button>
      </div>
    </div>
  )
}