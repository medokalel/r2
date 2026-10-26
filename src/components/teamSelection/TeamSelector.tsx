import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  TEAM_ROLES,
  getTeamRecommendations,
  validateTeam,
  type TeamAlternative,
  type TeamCandidate,
  type TeamIssue,
  type TeamRole,
  type TeamScope,
  type TeamValidationResult,
} from '@/lib/api/teamSelectionApi'
import { CandidateCard } from '@/components/teamSelection/CandidateCard'
import { CoverageMatrix } from '@/components/teamSelection/CoverageMatrix'
import { ExceptionDialog } from '@/components/teamSelection/ExceptionDialog'
import { TeamValidationPanel } from '@/components/teamSelection/TeamValidationPanel'
import { Avatar } from '@/components/teamSelection/TeamBadges'
import { ROLE_KEY } from '@/components/teamSelection/teamSelectionUi'
import { pageTabClassName, pageTabListClassName } from '@/components/ui/pageTabs'
import { workflowErrorMessage } from '@/lib/workflowErrors'
import { cn } from '@/lib/utils'

export interface TeamDraftMember {
  personId: string | null
  name: string
  role: TeamRole
}

interface Props {
  scope: TeamScope
  value: TeamDraftMember[]
  onChange: (team: TeamDraftMember[]) => void
  /** Role slots offered (default: all five). */
  roles?: TeamRole[]
  /** Called after every validation (null while the team is empty or loading). */
  onValidation?: (result: TeamValidationResult | null) => void
  readOnly?: boolean
  /** Change it to reload recommendations and validation (e.g. after an exception was decided). */
  refreshKey?: number
}

const STATUS_DOT = { ok: 'bg-success-500', warn: 'bg-warning-500', block: 'bg-error-500' } as const

/** Adds or moves a person into `role`; the team leader slot holds one person. */
function placeMember(team: TeamDraftMember[], member: TeamDraftMember): TeamDraftMember[] {
  const others = team.filter((m) => (member.personId ? m.personId !== member.personId : m.name !== member.name))
  const rest = member.role === 'TEAM_LEADER' ? others.filter((m) => m.role !== 'TEAM_LEADER') : others
  return [...rest, member]
}

/**
 * Competence-based team selector: role slots, ranked recommendations with explanations, real-time
 * validation (competence, availability, impartiality), alternatives, exception requests and the
 * coverage matrix. Controlled: the parent owns the team and saves it.
 */
export function TeamSelector({ scope, value, onChange, roles = TEAM_ROLES, onValidation, readOnly, refreshKey = 0 }: Props) {
  const { t } = useTranslation()
  const [activeRole, setActiveRole] = useState<TeamRole>(roles[0])
  const [candidates, setCandidates] = useState<TeamCandidate[] | null>(null)
  const [recError, setRecError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showIneligible, setShowIneligible] = useState(false)
  const [validation, setValidation] = useState<TeamValidationResult | null>(null)
  const [validating, setValidating] = useState(false)
  const [exceptionIssue, setExceptionIssue] = useState<TeamIssue | null>(null)
  const [reload, setReload] = useState(0)
  const [observerName, setObserverName] = useState('')
  const onValidationRef = useRef(onValidation)
  useEffect(() => {
    onValidationRef.current = onValidation
  }, [onValidation])

  const scopeKey = `${scope.auditPlanId ?? ''}|${scope.applicationId ?? ''}`
  const teamKey = JSON.stringify(value.map((m) => [m.personId, m.name, m.role]))

  // Recommendations for the active slot.
  useEffect(() => {
    let alive = true
    const load = async () => {
      setCandidates(null)
      setRecError(null)
      try {
        const res = await getTeamRecommendations(scope, activeRole)
        if (alive) setCandidates(res.candidates)
      } catch (err) {
        if (alive) setRecError(workflowErrorMessage(err, t))
      }
    }
    void load()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scopeKey stands for scope
  }, [scopeKey, activeRole, reload, refreshKey, t])

  // Real-time validation of the whole team (debounced).
  useEffect(() => {
    let alive = true
    const timer = window.setTimeout(async () => {
      setValidating(true)
      try {
        const team = JSON.parse(teamKey) as Array<[string | null, string, TeamRole]>
        const res = await validateTeam(scope, team.map(([personId, name, role]) => ({ personId, name, role })))
        if (!alive) return
        setValidation(res)
        onValidationRef.current?.(res)
      } catch {
        if (!alive) return
        setValidation(null)
        onValidationRef.current?.(null)
      } finally {
        if (alive) setValidating(false)
      }
    }, 300)
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scopeKey stands for scope
  }, [scopeKey, teamKey, reload, refreshKey])

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (candidates ?? []).filter((c) => (showIneligible || c.eligible || value.some((m) => m.personId === c.personId)) && (!term || c.name.toLowerCase().includes(term)))
  }, [candidates, search, showIneligible, value])
  const hiddenCount = (candidates ?? []).filter((c) => !c.eligible).length

  const statusOf = (m: TeamDraftMember) => validation?.members.find((r) => (m.personId ? r.personId === m.personId : r.name === m.name) && r.role === m.role)?.status
  const add = (member: TeamDraftMember) => onChange(placeMember(value, member))
  const remove = (member: TeamDraftMember) => onChange(value.filter((m) => m !== member))
  const useAlternative = (issue: TeamIssue, alt: TeamAlternative) => {
    const without = issue.personId ? value.filter((m) => m.personId !== issue.personId) : value
    onChange(placeMember(without, { personId: alt.personId, name: alt.name, role: alt.role }))
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {validation && (
        <dl className="flex flex-wrap gap-x-6 gap-y-2 rounded-md bg-neutral-25 px-4 py-3 text-caption">
          <div>
            <dt className="text-neutral-500">{t('team.context.client')}</dt>
            <dd className="font-semibold text-neutral-900">{validation.context.clientName}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">{t('team.context.standards')}</dt>
            <dd className="font-semibold text-neutral-900" dir="ltr">
              {validation.context.standards.map((s) => s.label).join(', ') || t('team.context.none')}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">{t('team.context.codes')}</dt>
            <dd className="flex flex-wrap gap-1" dir="ltr">
              {validation.context.iafCodes.length ? (
                validation.context.iafCodes.map((c) => (
                  <span key={c.code} className={cn('rounded-xs px-1.5 py-0.5 font-semibold', c.critical ? 'bg-warning-50 text-warning-800' : 'bg-primary-50 text-primary')}>
                    {c.code}
                  </span>
                ))
              ) : (
                <span className="font-semibold text-neutral-900">{t('team.context.none')}</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">{t('team.context.dates')}</dt>
            <dd className="font-semibold text-neutral-900" dir="ltr">
              {validation.context.startDate ? `${validation.context.startDate} / ${validation.context.endDate}` : t('team.context.noDates')}
            </dd>
          </div>
        </dl>
      )}

      {/* Role slots with the selected people */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => {
          const members = value.filter((m) => m.role === role)
          return (
            <section key={role} aria-label={t(`team.roles.${ROLE_KEY[role]}`)} className={cn('flex min-w-0 flex-col gap-2 rounded-md border p-3', activeRole === role ? 'border-primary bg-primary-25' : 'border-neutral-100 bg-white')}>
              <button type="button" onClick={() => setActiveRole(role)} className="flex items-center justify-between gap-2 text-start">
                <span className="text-body-sm font-semibold text-neutral-900">{t(`team.slots.${ROLE_KEY[role]}`)}</span>
                <span className="text-caption text-neutral-500">{t(`team.slotHints.${ROLE_KEY[role]}`)}</span>
              </button>
              {members.length === 0 ? (
                <p className="text-caption text-neutral-500">{t('team.slots.empty')}</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {members.map((m) => {
                    const status = statusOf(m)
                    return (
                      <li key={m.personId ?? m.name} className="inline-flex max-w-full items-center gap-2 rounded-full border border-neutral-100 bg-white py-1 pe-1 ps-2 text-caption">
                        <span className={cn('size-2 shrink-0 rounded-full', status ? STATUS_DOT[status] : 'bg-neutral-300')} aria-hidden />
                        <span className="truncate font-medium text-neutral-900">{m.name}</span>
                        {status && <span className="sr-only">{t(`team.memberStatus.${status}`)}</span>}
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => remove(m)}
                            aria-label={t('team.slots.remove', { name: m.name })}
                            className="flex size-6 items-center justify-center rounded-full text-neutral-500 hover:bg-error-50 hover:text-error-600"
                          >
                            ×
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )
        })}
      </div>

      {validation ? (
        <TeamValidationPanel validation={validation} readOnly={readOnly} onUseAlternative={useAlternative} onRequestException={setExceptionIssue} />
      ) : (
        validating && <p className="text-caption text-neutral-600">{t('team.validation.checking')}</p>
      )}

      {!readOnly && (
        <section className="flex min-w-0 flex-col gap-3" aria-label={t('team.recommended.title')}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className={pageTabListClassName} role="tablist" aria-label={t('team.recommended.forRole')}>
              {roles.map((role) => (
                <button key={role} type="button" role="tab" aria-selected={activeRole === role} className={pageTabClassName(activeRole === role)} onClick={() => setActiveRole(role)}>
                  {t(`team.roles.${ROLE_KEY[role]}`)}
                </button>
              ))}
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('team.recommended.search')}
              aria-label={t('team.recommended.search')}
              className="h-10 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm focus:border-primary focus:outline-none sm:w-60"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-body-sm font-semibold text-neutral-900">{t('team.recommended.title')}</h3>
            {hiddenCount > 0 && (
              <label className="flex items-center gap-2 text-caption text-neutral-700">
                <input type="checkbox" checked={showIneligible} onChange={(e) => setShowIneligible(e.target.checked)} />
                {t('team.recommended.showIneligible', { count: hiddenCount })}
              </label>
            )}
          </div>
          {recError && (
            <p role="alert" className="rounded-md bg-error-50 px-3 py-2 text-caption text-error-600">
              {recError}{' '}
              <button type="button" className="font-semibold underline" onClick={() => setReload((n) => n + 1)}>
                {t('errors.retry', 'Retry')}
              </button>
            </p>
          )}
          {!candidates && !recError && <p className="text-caption text-neutral-600">{t('team.recommended.loading')}</p>}
          {candidates && shown.length === 0 && <p className="text-caption text-neutral-600">{t('team.recommended.empty')}</p>}
          {shown.length > 0 && (
            <ul className="flex flex-col gap-2">
              {shown.map((c) => (
                <CandidateCard
                  key={c.personId}
                  candidate={c}
                  role={activeRole}
                  selected={value.some((m) => m.personId === c.personId && m.role === activeRole)}
                  onAdd={() => add({ personId: c.personId, name: c.name, role: activeRole })}
                />
              ))}
            </ul>
          )}
          {activeRole === 'OBSERVER' && (
            <form
              className="flex flex-col gap-2 rounded-md border border-dashed border-neutral-200 p-3 sm:flex-row sm:items-center"
              onSubmit={(e) => {
                e.preventDefault()
                if (!observerName.trim()) return
                add({ personId: null, name: observerName.trim(), role: 'OBSERVER' })
                setObserverName('')
              }}
            >
              <Avatar name={observerName || '?'} tone="muted" />
              <input
                value={observerName}
                onChange={(e) => setObserverName(e.target.value)}
                maxLength={200}
                placeholder={t('team.observer.placeholder')}
                aria-label={t('team.observer.label')}
                className="h-10 min-w-0 flex-1 rounded-md border border-neutral-100 bg-white px-3 text-body-sm focus:border-primary focus:outline-none"
              />
              <button type="submit" disabled={!observerName.trim()} className="h-10 rounded-md border border-primary px-3 text-caption font-semibold text-primary disabled:opacity-50">
                {t('team.observer.add')}
              </button>
            </form>
          )}
        </section>
      )}

      {validation && (
        <section className="flex flex-col gap-2" aria-label={t('team.coverage.title')}>
          <h3 className="text-body-sm font-semibold text-neutral-900">{t('team.coverage.title')}</h3>
          <CoverageMatrix coverage={validation.coverage} />
        </section>
      )}

      <ExceptionDialog scope={scope} issue={exceptionIssue} onClose={() => setExceptionIssue(null)} onRequested={() => setReload((n) => n + 1)} />
    </div>
  )
}
