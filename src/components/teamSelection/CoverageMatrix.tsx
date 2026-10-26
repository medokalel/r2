import { useTranslation } from 'react-i18next'
import type { TeamCoverage } from '@/lib/api/teamSelectionApi'
import { ROLE_KEY } from '@/components/teamSelection/teamSelectionUi'
import { cn } from '@/lib/utils'

/**
 * Team coverage: standards and IAF codes in scope (rows) by team member (columns).
 * A = approved as auditor, E = technical expert (sector knowledge), blank = not covered.
 */
export function CoverageMatrix({ coverage }: { coverage: TeamCoverage }) {
  const { t } = useTranslation()
  const members = coverage.members.filter((m) => m.role !== 'OBSERVER')
  if (!members.length || (!coverage.standards.length && !coverage.iafCodes.length)) return null
  const rows = [
    ...coverage.standards.map((s) => ({ key: `s-${s.key}`, label: s.label, critical: false, cells: members.map((m) => (s.coveredBy.includes(m.personId ?? '') ? 'A' : '')), covered: s.coveredBy.length > 0 })),
    ...coverage.iafCodes.map((c) => ({
      key: `c-${c.code}`,
      label: `IAF ${c.code}`,
      critical: c.critical,
      cells: members.map((m) => {
        const hit = c.coveredBy.find((x) => x.personId === m.personId)
        return hit ? (hit.via === 'auditor' ? 'A' : 'E') : ''
      }),
      covered: c.coveredBy.length > 0,
    })),
  ]
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-md border border-neutral-100">
        <table className="w-full min-w-[420px] text-caption">
          <caption className="sr-only">{t('team.coverage.title')}</caption>
          <thead className="bg-neutral-25">
            <tr>
              <th scope="col" className="px-3 py-2 text-start font-semibold text-neutral-700">
                {t('team.coverage.scope')}
              </th>
              {members.map((m) => (
                <th key={m.personId ?? m.name} scope="col" className="px-2 py-2 text-center font-semibold text-neutral-700">
                  <span className="block max-w-[110px] truncate">{m.name}</span>
                  <span className="block text-overline font-normal text-neutral-500">{t(`team.roles.${ROLE_KEY[m.role]}`)}</span>
                </th>
              ))}
              <th scope="col" className="px-3 py-2 text-center font-semibold text-neutral-700">
                {t('team.coverage.status')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-neutral-50">
                <th scope="row" className="whitespace-nowrap px-3 py-2 text-start font-medium text-neutral-800" dir="ltr">
                  {row.label}
                  {row.critical && <span className="ms-1 rounded-xs bg-warning-50 px-1 text-overline text-warning-800">{t('team.coverage.critical')}</span>}
                </th>
                {row.cells.map((cell, i) => (
                  <td key={i} className="px-2 py-2 text-center">
                    {cell && (
                      <span
                        className={cn('inline-flex size-6 items-center justify-center rounded-full font-bold', cell === 'A' ? 'bg-primary-50 text-primary' : 'bg-info-50 text-info-700')}
                        title={cell === 'A' ? t('team.coverage.auditor') : t('team.coverage.expert')}
                      >
                        {cell === 'A' ? t('team.coverage.auditorShort') : t('team.coverage.expertShort')}
                      </span>
                    )}
                  </td>
                ))}
                <td className="px-3 py-2 text-center">
                  <span className={cn('rounded-xs px-1.5 py-0.5 text-overline font-semibold', row.covered ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700')}>
                    {row.covered ? t('team.coverage.covered') : t('team.coverage.missing')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-caption text-neutral-600">{t('team.coverage.legend')}</p>
    </div>
  )
}
