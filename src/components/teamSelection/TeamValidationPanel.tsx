import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TeamAlternative, TeamIssue, TeamValidation } from '@/lib/api/teamSelectionApi'
import { SeverityChip } from '@/components/teamSelection/TeamBadges'
import { ROLE_KEY, useLocalized } from '@/components/teamSelection/teamSelectionUi'
import { cn } from '@/lib/utils'

interface Props {
  validation: TeamValidation
  readOnly?: boolean
  onUseAlternative: (issue: TeamIssue, alternative: TeamAlternative) => void
  onRequestException: (issue: TeamIssue) => void
}

/**
 * Real-time validation result: a blocking banner (each issue explained, with qualified alternatives
 * and, for non-mandatory issues, an exception request) and the warnings underneath.
 */
export function TeamValidationPanel({ validation, readOnly, onUseAlternative, onRequestException }: Props) {
  const { t } = useTranslation()
  const loc = useLocalized()
  const [showInfo, setShowInfo] = useState(false)
  const all = [...validation.teamIssues, ...validation.members.flatMap((m) => m.issues)]
  const blocking = all.filter((i) => i.severity === 'block' && !i.excepted)
  const warnings = all.filter((i) => i.severity === 'warn' || (i.severity === 'block' && i.excepted))
  const infos = all.filter((i) => i.severity === 'info')

  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      {blocking.length > 0 ? (
        <section role="alert" className="relative rounded-md border border-error-200 bg-error-50 p-4 ps-6">
          <span aria-hidden className="absolute inset-y-4 start-3 w-1 rounded-xs bg-error-500" />
          <p className="text-body-sm font-semibold text-error-700">{t('team.validation.blockedTitle', { count: blocking.length })}</p>
          <p className="mt-0.5 text-caption text-neutral-700">
            {validation.mandatoryBlockingCount > 0 ? t('team.validation.blockedMandatory') : t('team.validation.blockedOverridable')}
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            {blocking.map((i, index) => (
              <li key={`${i.code}-${i.personId}-${index}`} className="flex flex-col gap-2 rounded-md bg-white p-3">
                <div className="flex items-start gap-2">
                  <SeverityChip issue={i} />
                  <p className="text-body-sm text-neutral-900">{loc(i.message)}</p>
                </div>
                {!readOnly && (i.alternatives.length > 0 || i.overridable) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {i.alternatives.length > 0 && <span className="text-caption text-neutral-600">{t('team.validation.alternatives')}</span>}
                    {i.alternatives.map((a) => (
                      <button
                        key={a.personId}
                        type="button"
                        onClick={() => onUseAlternative(i, a)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-25 px-3 py-1 text-caption font-semibold text-primary hover:bg-primary-50"
                      >
                        {t('team.validation.use', { name: a.name, role: t(`team.roles.${ROLE_KEY[a.role]}`) })}
                        <span className="font-normal text-neutral-600" dir="ltr">
                          {a.score}
                        </span>
                      </button>
                    ))}
                    {i.overridable && (
                      <button type="button" onClick={() => onRequestException(i)} className="text-caption font-semibold text-primary underline underline-offset-4">
                        {t('team.validation.requestException')}
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section role="status" className="relative rounded-md border border-success-200 bg-success-25 p-4 ps-6">
          <span aria-hidden className="absolute inset-y-4 start-3 w-1 rounded-xs bg-success-500" />
          <p className="text-body-sm font-semibold text-success-700">{t('team.validation.readyTitle')}</p>
          <p className="mt-0.5 text-caption text-neutral-700">{t('team.validation.readyHint', { count: warnings.length })}</p>
        </section>
      )}

      {warnings.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {warnings.map((i, index) => (
            <li key={`${i.code}-${i.personId}-${index}`} className="flex items-start gap-2 text-caption text-neutral-800">
              <SeverityChip issue={i} />
              <span>{loc(i.message)}</span>
            </li>
          ))}
        </ul>
      )}

      {infos.length > 0 && (
        <div>
          <button type="button" className="text-caption font-semibold text-primary underline-offset-4 hover:underline" aria-expanded={showInfo} onClick={() => setShowInfo((v) => !v)}>
            {showInfo ? t('team.validation.hideNotes') : t('team.validation.showNotes', { count: infos.length })}
          </button>
          {showInfo && (
            <ul className="mt-2 flex flex-col gap-1.5">
              {infos.map((i, index) => (
                <li key={`${i.code}-${index}`} className={cn('flex items-start gap-2 text-caption text-neutral-700')}>
                  <SeverityChip issue={i} />
                  <span>{loc(i.message)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
