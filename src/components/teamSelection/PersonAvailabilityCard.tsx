import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  UNAVAILABILITY_REASONS,
  addUnavailability,
  deleteUnavailability,
  getTeamProfile,
  listUnavailability,
  saveTeamProfile,
  type TeamProfile,
  type Unavailability,
  type UnavailabilityReason,
} from '@/lib/api/teamSelectionApi'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/format/dates'
import { workflowErrorMessage } from '@/lib/workflowErrors'
import { toast } from '@/lib/toast'

const LANGUAGES = ['ar', 'en', 'fr', 'tr', 'ur', 'hi']
const inputClass = 'h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm focus:border-primary focus:outline-none'

/**
 * Availability of one person (competence profile): leave / unavailable periods used by team
 * validation, and the languages and base location used to rank team candidates.
 */
export function PersonAvailabilityCard({ personId }: { personId: string }) {
  const { t } = useTranslation()
  const [entries, setEntries] = useState<Unavailability[] | null>(null)
  const [profile, setProfile] = useState<TeamProfile | null>(null)
  const [form, setForm] = useState({ startDate: '', endDate: '', reason: 'LEAVE' as UnavailabilityReason, notes: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [reloadKey, setReloadKey] = useState(0)
  const load = useCallback(() => setReloadKey((n) => n + 1), [])

  useEffect(() => {
    let alive = true
    Promise.all([listUnavailability(personId), getTeamProfile(personId)]).then(
      ([list, prof]) => {
        if (!alive) return
        setEntries(list)
        setProfile(prof)
      },
      (err) => alive && setError(workflowErrorMessage(err, t)),
    )
    return () => {
      alive = false
    }
  }, [personId, reloadKey, t])

  const add = async () => {
    setBusy(true)
    setError(null)
    try {
      const created = await addUnavailability(personId, form)
      toast.success(t('team.availability.added'))
      if (created.affectedPlans?.length) toast.warning(t('team.availability.affected', { plans: created.affectedPlans.map((p) => p.planNumber).join(', ') }))
      setForm({ startDate: '', endDate: '', reason: 'LEAVE', notes: '' })
      load()
    } catch (err) {
      setError(workflowErrorMessage(err, t))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (entry: Unavailability) => {
    try {
      setEntries(await deleteUnavailability(personId, entry.id))
    } catch (err) {
      setError(workflowErrorMessage(err, t))
    }
  }

  const saveProfile = async () => {
    if (!profile) return
    try {
      setProfile(await saveTeamProfile(personId, { languages: profile.languages, baseCity: profile.baseCity, baseCountry: profile.baseCountry }))
      toast.success(t('team.profile.saved'))
    } catch (err) {
      setError(workflowErrorMessage(err, t))
    }
  }

  const validDates = Boolean(form.startDate && form.endDate && form.endDate >= form.startDate)

  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-neutral-100 bg-white p-4 sm:p-5" aria-labelledby={`availability-${personId}`}>
      <div>
        <h2 id={`availability-${personId}`} className="text-body font-bold text-neutral-900">
          {t('team.availability.title')}
        </h2>
        <p className="text-caption text-neutral-600">{t('team.availability.subtitle')}</p>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-error-50 px-3 py-2 text-caption text-error-700">
          {error}
        </p>
      )}

      {entries === null ? (
        <p className="text-caption text-neutral-600">{t('team.panel.loading')}</p>
      ) : entries.length === 0 ? (
        <p className="text-caption text-neutral-600">{t('team.availability.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-100 px-3 py-2">
              <div className="min-w-0">
                <p className="text-body-sm font-semibold text-neutral-900">
                  {t(`team.reasons.${u.reason}`)} · {formatDate(u.startDate)} / {formatDate(u.endDate)}
                </p>
                {u.notes && <p className="text-caption text-neutral-600">{u.notes}</p>}
              </div>
              <button type="button" onClick={() => void remove(u)} className="text-caption font-semibold text-error-600 hover:underline">
                {t('team.availability.delete')}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (validDates && !busy) void add()
        }}
      >
        <label className="flex flex-col gap-1 text-caption font-semibold text-neutral-800">
          {t('team.availability.from')}
          <input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-caption font-semibold text-neutral-800">
          {t('team.availability.to')}
          <input type="date" required min={form.startDate || undefined} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-caption font-semibold text-neutral-800">
          {t('team.availability.reason')}
          <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value as UnavailabilityReason })} className={inputClass}>
            {UNAVAILABILITY_REASONS.map((r) => (
              <option key={r} value={r}>
                {t(`team.reasons.${r}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-caption font-semibold text-neutral-800">
          {t('team.availability.notes')}
          <input value={form.notes} maxLength={1000} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} />
        </label>
        <div className="sm:col-span-2 lg:col-span-4">
          <Button type="submit" size="md" disabled={!validDates || busy}>
            {t('team.availability.add')}
          </Button>
        </div>
      </form>

      {profile && (
        <div className="flex flex-col gap-3 border-t border-neutral-100 pt-4">
          <h3 className="text-body-sm font-semibold text-neutral-900">{t('team.profile.title')}</h3>
          <fieldset className="flex flex-wrap gap-3">
            <legend className="mb-1 text-caption font-semibold text-neutral-800">{t('team.profile.languages')}</legend>
            {LANGUAGES.map((lang) => (
              <label key={lang} className="flex items-center gap-1.5 text-caption text-neutral-800">
                <input
                  type="checkbox"
                  checked={profile.languages.includes(lang)}
                  onChange={(e) => setProfile({ ...profile, languages: e.target.checked ? [...profile.languages, lang] : profile.languages.filter((l) => l !== lang) })}
                />
                {t(`team.languages.${lang}`)}
              </label>
            ))}
          </fieldset>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-caption font-semibold text-neutral-800">
              {t('team.profile.city')}
              <input value={profile.baseCity} maxLength={100} onChange={(e) => setProfile({ ...profile, baseCity: e.target.value })} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-caption font-semibold text-neutral-800">
              {t('team.profile.country')}
              <input value={profile.baseCountry} maxLength={100} onChange={(e) => setProfile({ ...profile, baseCountry: e.target.value })} className={inputClass} />
            </label>
          </div>
          <div>
            <Button type="button" variant="outline" size="md" onClick={() => void saveProfile()}>
              {t('team.profile.save')}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
