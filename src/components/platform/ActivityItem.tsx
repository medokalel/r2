import { useTranslation } from 'react-i18next'
import type { AuditRow } from '@/lib/api/platformTypes'
import { usePlatformFormat } from '@/components/platform/usePlatformFormat'

/** One audit entry as a sentence: "<actor> · <action> · <target>". */
export function ActivityItem({ row }: { row: AuditRow }) {
  const { t } = useTranslation()
  const f = usePlatformFormat()
  return (
    <li className="flex min-w-0 items-start gap-3 py-3">
      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent-teal" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-body-sm text-neutral-800">
          <span className="font-semibold">{row.actorName ?? row.actorUserId}</span>
          <span className="text-neutral-500"> · </span>
          {t(`platform.auditActions.${row.action.replace(/\./g, '_')}`, { defaultValue: row.action })}
          {row.targetName && (
            <>
              <span className="text-neutral-500"> · </span>
              <span className="font-medium">{row.targetName}</span>
            </>
          )}
        </p>
        {row.reason && <p className="mt-0.5 truncate text-body-sm text-neutral-600">“{row.reason}”</p>}
        <p className="mt-0.5 text-caption text-neutral-500">{f.dateTime(row.createdAt)}</p>
      </div>
    </li>
  )
}
