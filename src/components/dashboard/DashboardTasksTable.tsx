import { useTranslation } from 'react-i18next'
import type { DashboardTask, DashboardTaskStatus } from '@/lib/api/dashboardApi'
import { cn } from '@/lib/utils'
import { notSet } from '@/lib/emptyValue'

const statusStyles: Record<DashboardTaskStatus, string> = {
  urgent: 'bg-warning-50 text-warning-700',
  underReview: 'bg-neutral-50 text-neutral-700',
  pending: 'bg-primary-50 text-primary',
}

const procedureLabelKeys: Record<DashboardTask['taskType'], string> = {
  documentReview: 'dashboard.tasks.openDocument',
  contractProcessing: 'dashboard.tasks.sendContract',
  feeCollection: 'dashboard.tasks.sendMessage',
}

interface DashboardTasksTableProps {
  tasks: DashboardTask[]
  loading: boolean
  onViewAll?: () => void
  onProcedureClick?: (task: DashboardTask) => void
}

export function DashboardTasksTable({
  tasks,
  loading,
  onViewAll,
  onProcedureClick,
}: DashboardTasksTableProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-1 flex-col rounded-lg border border-neutral-100 bg-white py-5">
      <div className="mb-5 mt-1 mx-5 flex items-center justify-between gap-4">
        <h2 className="text-body-lg font-semibold text-neutral-900 @2xl:text-[24px]">
          {t('dashboard.tasks.title')}
        </h2>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="shrink-0 text-body-sm font-medium text-primary hover:underline @2xl:text-body"
          >
            {t('dashboard.tasks.viewAll')}
          </button>
        )}
      </div>

      {/* Table once the column has real room for it; cards below that */}
      <div className="hidden overflow-x-auto @2xl:block">
        <table className="w-full min-w-[640px] border-collapse text-center">
          <thead className="bg-primary text-white">
            <tr className="rounded-md bg-primary text-white">
              <th className="p-5 text-center text-body-sm font-medium">
                {t('dashboard.tasks.applicantName')}
              </th>
              <th className="p-5 text-center text-body-sm font-medium">
                {t('dashboard.tasks.taskType')}
              </th>
              <th className="p-5 text-center text-body-sm font-medium">
                {t('dashboard.tasks.statusHeader')}
              </th>
              <th className="p-5 text-center text-body-sm font-medium">
                {t('dashboard.tasks.procedures')}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-600">
                  {t('common.loading')}
                </td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-600">
                  {notSet()}
                </td>
              </tr>
            ) : (
              tasks.map((task, index) => (
                <tr
                  key={task.id}
                  className={cn(index % 2 === 1 && 'bg-neutral-25')}
                >
                  <td className="px-4 py-4">
                    <p className="text-body font-medium text-neutral-900">
                      {task.applicantName}
                    </p>
                    <p className="text-body-sm text-neutral-600">
                      {t('dashboard.tasks.companyCode')} {task.companyCode}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-body text-neutral-800">
                    {t(`dashboard.tasks.type.${task.taskType}`)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center justify-center rounded-sm px-3 py-1 text-caption font-medium whitespace-nowrap',
                        statusStyles[task.status]
                      )}
                    >
                      {t(`dashboard.tasks.status.${task.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => onProcedureClick?.(task)}
                      className="text-body-sm font-medium text-primary hover:underline"
                    >
                      {t(procedureLabelKeys[task.taskType])}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Cards: shown while the column is too narrow for the table */}
      <div className="mx-5 rounded-lg border border-neutral-100 bg-neutral-25 p-2 @2xl:hidden">
        {loading ? (
          <p className="py-6 text-center text-neutral-600">{t('common.loading')}</p>
        ) : tasks.length === 0 ? (
          <p className="py-6 text-center text-neutral-600">{notSet()}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-lg border border-neutral-100 bg-white p-4">
                <p className="text-body font-medium text-neutral-900">{task.applicantName}</p>
                <p className="text-body-sm text-neutral-600">
                  {t('dashboard.tasks.companyCode')} {task.companyCode}
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-body-sm text-neutral-800">
                    {t(`dashboard.tasks.type.${task.taskType}`)}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center justify-center rounded-sm px-3 py-1 text-caption font-medium whitespace-nowrap',
                      statusStyles[task.status]
                    )}
                  >
                    {t(`dashboard.tasks.status.${task.status}`)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onProcedureClick?.(task)}
                  className="mt-3 text-body-sm font-medium text-primary hover:underline"
                >
                  {t(procedureLabelKeys[task.taskType])} →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}