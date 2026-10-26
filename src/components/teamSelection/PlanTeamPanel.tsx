import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { confirmPlanTeam, getPlanTeam, type PlanTeam, type TeamValidation, type TeamValidationResult } from '@/lib/api/teamSelectionApi'
import { ApiError } from '@/lib/api/client'
import { TeamSelector, type TeamDraftMember } from '@/components/teamSelection/TeamSelector'
import { TeamExceptionsList } from '@/components/teamSelection/TeamExceptionsList'
import { TeamHistory } from '@/components/teamSelection/TeamHistory'
import { Button } from '@/components/ui/Button'
import { formatDateTime } from '@/lib/format/dates'
import { workflowErrorMessage } from '@/lib/workflowErrors'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

interface Props {
  /** Audit plan id or number. */
  planId: string
  /** After confirmation: the plan's team names (lead first) so the page keeps them in step. */
  onConfirmed?: (team: { leadAuditor: string; auditTeam: string[] }) => void
}

/**
 * "Audit team" card of the build-plan page: select, validate and confirm the team. The plan can be
 * sent or started only with a confirmed team that still passes the checks (enforced by the API).
 */
export function PlanTeamPanel({ planId, onConfirmed }: Props) {
  const { t } = useTranslation()
  const [data, setData] = useState<PlanTeam | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [team, setTeam] = useState<TeamDraftMember[]>([])
  const [validation, setValidation] = useState<TeamValidationResult | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blocked, setBlocked] = useState<TeamValidation | null>(null)
  const [tab, setTab] = useState<'exceptions' | 'history' | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [reloadKey, setReloadKey] = useState(0)
  const load = useCallback(() => setReloadKey((n) => n + 1), [])

  useEffect(() => {
    let alive = true
    getPlanTeam(planId).then(
      (view) => {
        if (!alive) return
        setData(view)
        setTeam(view.members)
        setLoadError(null)
        setRefreshKey((n) => n + 1)
      },
      (err) => alive && setLoadError(workflowErrorMessage(err, t)),
    )
    return () => {
      alive = false
    }
  }, [planId, reloadKey, t])

  if (loadError) {
    return (
      <section className="rounded-lg border border-neutral-100 bg-white p-5">
        <p role="alert" className="text-body-sm text-error-600">
          {loadError}{' '}
          <button type="button" className="font-semibold underline" onClick={load}>
            {t('errors.retry', 'Retry')}
          </button>
        </p>
      </section>
    )
  }
  if (!data) {
    return <section className="rounded-lg border border-neutral-100 bg-white p-5 text-body-sm text-neutral-600">{t('team.panel.loading')}</section>
  }

  const readOnly = data.status === 'Completed' || data.status === 'COMPLETED'
  const changed = JSON.stringify(team) !== JSON.stringify(data.members)
  const canConfirm = Boolean(validation?.canConfirm) && team.some((m) => m.role === 'TEAM_LEADER')
  const pending = data.exceptions.filter((e) => e.status === 'PENDING').length

  const confirm = async () => {
    setBusy(true)
    setError(null)
    setBlocked(null)
    try {
      const saved = await confirmPlanTeam(data.auditPlanId, team, note.trim() || undefined)
      setData(saved)
      setTeam(saved.members)
      setNote('')
      toast.success(t('team.panel.confirmed'))
      const lead = saved.members.find((m) => m.role === 'TEAM_LEADER')?.name ?? ''
      onConfirmed?.({ leadAuditor: lead, auditTeam: saved.members.filter((m) => m.role !== 'OBSERVER').map((m) => m.name) })
    } catch (err) {
      if (err instanceof ApiError && err.code === 'TEAM_BLOCKED' && err.details?.validation) setBlocked(err.details.validation as TeamValidation)
      setError(workflowErrorMessage(err, t))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="plan-team-selection" className="flex min-w-0 flex-col gap-4 rounded-lg border border-neutral-100 bg-white p-4 sm:p-5" aria-labelledby="plan-team-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 id="plan-team-title" className="text-body font-bold text-neutral-900">
            {t('team.panel.title')}
          </h3>
          <p className="text-caption text-neutral-600">{t('team.panel.subtitle')}</p>
        </div>
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 self-start rounded-full px-3 py-1 text-caption font-semibold',
            data.confirmed && !changed ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-800',
          )}
        >
          {data.confirmed && !changed
            ? t('team.panel.confirmedBadge', { name: data.confirmedBy ?? '', date: formatDateTime(data.confirmedAt) })
            : changed
              ? t('team.panel.unsaved')
              : t('team.panel.notConfirmed')}
        </span>
      </div>

      <TeamSelector scope={{ auditPlanId: data.auditPlanId }} value={team} onChange={setTeam} onValidation={setValidation} readOnly={readOnly} refreshKey={refreshKey} />

      {blocked && blocked.blockingCount > 0 && (
        <p role="alert" className="rounded-md bg-error-50 px-3 py-2 text-caption text-error-700">
          {t('team.panel.blockedByServer', { count: blocked.blockingCount })}
        </p>
      )}
      {error && !blocked && (
        <p role="alert" className="rounded-md bg-error-50 px-3 py-2 text-caption text-error-700">
          {error}
        </p>
      )}

      {!readOnly && (
        <div className="flex flex-col gap-3 border-t border-neutral-100 pt-4 sm:flex-row sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-caption font-semibold text-neutral-800" htmlFor="plan-team-note">
            {t('team.panel.note')}
            <input
              id="plan-team-note"
              value={note}
              maxLength={2000}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('team.panel.notePlaceholder')}
              className="h-11 rounded-md border border-neutral-100 px-3 text-body-sm font-normal focus:border-primary focus:outline-none"
            />
          </label>
          <Button type="button" size="md" disabled={!canConfirm || busy} onClick={() => void confirm()} className="w-full sm:w-auto">
            {busy ? t('common.saving', 'Saving...') : t('team.panel.confirm')}
          </Button>
        </div>
      )}
      {!readOnly && !canConfirm && validation && <p className="text-caption text-neutral-600">{t('team.panel.confirmDisabled')}</p>}

      <div className="flex flex-wrap gap-2">
        <button type="button" className="text-caption font-semibold text-primary underline-offset-4 hover:underline" aria-expanded={tab === 'exceptions'} onClick={() => setTab(tab === 'exceptions' ? null : 'exceptions')}>
          {t('team.panel.exceptions', { count: data.exceptions.length, pending })}
        </button>
        <span aria-hidden className="text-neutral-300">
          |
        </span>
        <button type="button" className="text-caption font-semibold text-primary underline-offset-4 hover:underline" aria-expanded={tab === 'history'} onClick={() => setTab(tab === 'history' ? null : 'history')}>
          {t('team.panel.history', { count: data.events.length })}
        </button>
      </div>
      {tab === 'exceptions' && <TeamExceptionsList exceptions={data.exceptions} personName={(id) => team.find((m) => m.personId === id)?.name ?? ''} onChanged={load} />}
      {tab === 'history' && <TeamHistory events={data.events} />}
    </section>
  )
}
