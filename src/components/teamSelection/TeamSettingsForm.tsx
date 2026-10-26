import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getTeamSettings, updateTeamSettings, type TeamSettings } from '@/lib/api/teamSelectionApi'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { workflowErrorMessage } from '@/lib/workflowErrors'
import { toast } from '@/lib/toast'

const NUMBERS: Array<{ key: keyof TeamSettings; min: number; max: number }> = [
  { key: 'coolingOffMonths', min: 0, max: 120 },
  { key: 'travelBufferDays', min: 0, max: 14 },
  { key: 'workloadWindowDays', min: 7, max: 365 },
  { key: 'maxAuditDaysInWindow', min: 1, max: 365 },
  { key: 'declarationValidityMonths', min: 1, max: 36 },
  { key: 'expiryWarningDays', min: 0, max: 365 },
]
// exceptionSecondApprover: optional (product owner, 25 October 2026), off by default.
const FLAGS: Array<keyof TeamSettings> = ['requireAnnualDeclaration', 'requireAuditDeclaration', 'exceptionSecondApprover']

/** Team-selection rules of the CAB: cooling-off period, travel buffer, workload window, declarations, approvals. */
export function TeamSettingsForm({ onSaved }: { onSaved?: () => void }) {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<TeamSettings | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    getTeamSettings().then((s) => alive && setSettings(s), (err) => alive && setError(workflowErrorMessage(err, t)))
    return () => {
      alive = false
    }
  }, [t])

  if (!settings) return error ? <p role="alert" className="text-body-sm text-error-600">{error}</p> : <p className="text-caption text-neutral-600">{t('team.panel.loading')}</p>

  const valid = NUMBERS.every(({ key, min, max }) => Number(settings[key]) >= min && Number(settings[key]) <= max)
  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      setSettings(await updateTeamSettings(settings))
      toast.success(t('team.settings.saved'))
      onSaved?.()
    } catch (err) {
      setError(workflowErrorMessage(err, t))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      className="flex min-w-0 flex-col gap-5 rounded-lg border border-neutral-100 bg-white p-4 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid && !busy) void save()
      }}
    >
      <div>
        <h2 className="text-body font-bold text-neutral-900">{t('team.settings.title')}</h2>
        <p className="text-caption text-neutral-600">{t('team.settings.subtitle')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {NUMBERS.map(({ key, min, max }) => (
          <label key={key} className="flex flex-col gap-1 text-caption font-semibold text-neutral-800">
            {t(`team.settings.fields.${key}`)}
            <input
              type="number"
              min={min}
              max={max}
              value={Number(settings[key])}
              onChange={(e) => setSettings({ ...settings, [key]: Number(e.target.value) })}
              className="h-11 rounded-md border border-neutral-100 px-3 text-body-sm font-normal focus:border-primary focus:outline-none"
            />
            <span className="font-normal text-neutral-500">{t(`team.settings.hints.${key}`)}</span>
          </label>
        ))}
      </div>
      <fieldset className="flex flex-col gap-3">
        {FLAGS.map((key) => (
          <label key={key} className="flex items-start gap-2 text-body-sm text-neutral-800" data-testid={`team-setting-${key}`}>
            <Checkbox className="mt-0.5" checked={Boolean(settings[key])} onChange={() => setSettings({ ...settings, [key]: !settings[key] })} />
            <span>
              <span className="font-semibold">{t(`team.settings.fields.${key}`)}</span>
              <span className="block text-caption text-neutral-600">{t(`team.settings.hints.${key}`)}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {error && (
        <p role="alert" className="rounded-md bg-error-50 px-3 py-2 text-caption text-error-700">
          {error}
        </p>
      )}
      <div>
        <Button type="submit" size="md" disabled={!valid || busy}>
          {busy ? t('common.saving', 'Saving...') : t('team.settings.save')}
        </Button>
      </div>
    </form>
  )
}
