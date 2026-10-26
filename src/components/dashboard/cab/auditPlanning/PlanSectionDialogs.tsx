import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DialogTextArea, WorkflowDialog } from '@/components/dashboard/cab/workflow/WorkflowDialog'
import { TextField } from '@/components/ui/TextField'
import { SelectField } from '@/components/ui/Select'
import { Toggle } from '@/components/ui/Toggle'
import { Button } from '@/components/ui/Button'
import { getContactClients, type ContactClientOption } from '@/lib/api/cabContactsApi'
import { saveAuditPlanSection, type AuditPlan, type RemoteActivities, type SiteAllocation } from '@/lib/api/cabAuditPlanningApi'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { toast } from '@/lib/toast'

/**
 * Edit dialogs for the site allocation, remote activities and travel notes cards of the Build
 * audit plan page. Each saves its section with PATCH /cab/audit-plans/:id/sections/:section and
 * hands the saved plan back.
 */

export type PlanSection = 'site' | 'remote' | 'travel'

interface Props {
  plan: AuditPlan
  section: PlanSection | null
  /** Team names offered as on-site personnel. */
  team: string[]
  onClose: () => void
  onSaved: (plan: AuditPlan) => void
}

const OTHER = '__other__'
const PLATFORMS = ['Microsoft Teams', 'Zoom', 'Google Meet']

export function PlanSectionDialogs({ plan, section, team, onClose, onSaved }: Props) {
  if (!section) return null
  // Keyed so each opening starts from the plan's current values.
  return <SectionDialog key={`${section}-${plan.updatedAt}`} plan={plan} section={section} team={team} onClose={onClose} onSaved={onSaved} />
}

function SectionDialog({ plan, section, team, onClose, onSaved }: Props & { section: PlanSection }) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Site allocation
  const [site, setSite] = useState<SiteAllocation>(() => ({ ...plan.siteAllocation, onSitePersonnel: [...(plan.siteAllocation?.onSitePersonnel ?? [])] }))
  const [sites, setSites] = useState<ContactClientOption['sites']>([])
  // Remote activities
  const [remote, setRemote] = useState<RemoteActivities>(() => ({ ...plan.remoteActivities, activities: [...(plan.remoteActivities?.activities ?? [])] }))
  const [newActivity, setNewActivity] = useState('')
  // Travel
  const [travel, setTravel] = useState(plan.travelNotes?.details ?? '')

  useEffect(() => {
    if (section !== 'site') return
    let cancelled = false
    getContactClients()
      .then((clients) => {
        if (cancelled) return
        const client = clients.find((c) => c.id === plan.organizationId || c.code === plan.clientCode || c.name === plan.clientName)
        setSites(client?.sites ?? [])
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [section, plan.organizationId, plan.clientCode, plan.clientName])

  const knownSite = sites.find((s) => s.name === site.siteName || s.id === site.siteCode)
  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const saved =
        section === 'site'
          ? await saveAuditPlanSection(plan.id, 'site', { siteCode: site.siteCode, siteName: site.siteName, siteAddress: site.siteAddress, onSitePersonnel: site.onSitePersonnel })
          : section === 'remote'
            ? await saveAuditPlanSection(plan.id, 'remote', { enabled: remote.enabled, activities: remote.activities, platform: remote.platform, notes: remote.notes })
            : await saveAuditPlanSection(plan.id, 'travel', { details: travel })
      toast.success(t('imports.planSections.saved'))
      onSaved(saved)
    } catch (caught) {
      setError(getUserErrorMessage(caught, t))
    } finally {
      setBusy(false)
    }
  }

  const title = t(`imports.planSections.${section}.title`)
  const addActivity = () => {
    const value = newActivity.trim()
    if (!value || remote.activities.includes(value)) return
    setRemote((r) => ({ ...r, activities: [...r.activities, value] }))
    setNewActivity('')
  }

  return (
    <WorkflowDialog
      open
      size="lg"
      title={title}
      confirmLabel={t('imports.planSections.save')}
      busy={busy}
      error={error}
      confirmDisabled={section === 'site' && !site.siteName.trim()}
      onConfirm={() => void save()}
      onClose={onClose}
    >
      {section === 'site' && (
        <div className="flex flex-col gap-4" data-testid="plan-site-dialog">
          {sites.length > 0 && (
            <SelectField
              id="plan-dialog-site-choice"
              label={t('imports.planSections.site.site')}
              value={knownSite ? knownSite.id : OTHER}
              options={[...sites.map((s) => ({ value: s.id, label: s.name })), { value: OTHER, label: t('imports.planSections.site.otherSite') }]}
              onChange={(value) => {
                const picked = sites.find((s) => s.id === value)
                if (picked) setSite((s) => ({ ...s, siteCode: picked.id, siteName: picked.name }))
              }}
            />
          )}
          <TextField id="plan-dialog-site-name" label={t('imports.planSections.site.siteName')} required value={site.siteName} maxLength={160} onChange={(e) => setSite((s) => ({ ...s, siteName: e.target.value }))} />
          <DialogTextArea id="plan-dialog-site-address" label={t('imports.planSections.site.address')} value={site.siteAddress} rows={2} maxLength={300} onChange={(value) => setSite((s) => ({ ...s, siteAddress: value }))} />
          {team.length > 0 && (
            <fieldset>
              <legend className="mb-2 text-body-sm font-medium text-neutral-800">{t('imports.planSections.site.personnel')}</legend>
              <div className="flex flex-wrap gap-2">
                {team.map((name) => {
                  const on = site.onSitePersonnel.includes(name)
                  return (
                    <button
                      key={name}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setSite((s) => ({ ...s, onSitePersonnel: on ? s.onSitePersonnel.filter((n) => n !== name) : [...s.onSitePersonnel, name] }))}
                      className={on ? 'rounded-full bg-primary px-3 py-1.5 text-caption font-semibold text-white' : 'rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-caption font-medium text-neutral-700 hover:border-primary'}
                    >
                      {name}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          )}
        </div>
      )}

      {section === 'remote' && (
        <div className="flex flex-col gap-4" data-testid="plan-remote-dialog">
          <label className="flex items-center gap-3 text-body-sm font-medium text-neutral-800">
            <Toggle checked={remote.enabled} onChange={(enabled) => setRemote((r) => ({ ...r, enabled }))} aria-label={t('imports.planSections.remote.enabled')} size="sm" />
            {t('imports.planSections.remote.enabled')}
          </label>
          <div>
            <p className="mb-2 text-body-sm font-medium text-neutral-800">{t('imports.planSections.remote.activities')}</p>
            <div className="flex flex-wrap gap-2">
              {remote.activities.map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 py-1 ps-3 pe-1 text-caption font-medium text-neutral-800">
                  {item}
                  <button
                    type="button"
                    aria-label={t('imports.planSections.remote.remove', { item })}
                    onClick={() => setRemote((r) => ({ ...r, activities: r.activities.filter((a) => a !== item) }))}
                    className="flex size-5 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-200"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <TextField
                id="plan-dialog-remote-new"
                value={newActivity}
                maxLength={300}
                placeholder={t('imports.planSections.remote.addPlaceholder')}
                onChange={(e) => setNewActivity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addActivity()
                  }
                }}
                className="min-w-0 flex-1"
              />
              <Button type="button" variant="secondary" size="md" onClick={addActivity} disabled={!newActivity.trim()}>
                {t('imports.planSections.remote.add')}
              </Button>
            </div>
          </div>
          <SelectField
            id="plan-dialog-remote-platform"
            label={t('imports.planSections.remote.platform')}
            value={remote.platform || PLATFORMS[0]}
            options={Array.from(new Set([...(remote.platform ? [remote.platform] : []), ...PLATFORMS]))}
            onChange={(platform) => setRemote((r) => ({ ...r, platform }))}
          />
          <DialogTextArea id="plan-dialog-remote-notes" label={t('imports.planSections.remote.notes')} value={remote.notes} rows={3} onChange={(notes) => setRemote((r) => ({ ...r, notes }))} />
        </div>
      )}

      {section === 'travel' && (
        <div className="flex flex-col gap-2" data-testid="plan-travel-dialog">
          <DialogTextArea id="plan-dialog-travel-details" label={t('imports.planSections.travel.details')} value={travel} rows={6} onChange={setTravel} />
          <p className="text-caption text-neutral-600">{t('imports.planSections.travel.hint')}</p>
        </div>
      )}
    </WorkflowDialog>
  )
}
