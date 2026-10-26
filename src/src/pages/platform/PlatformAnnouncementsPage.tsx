import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AddCircleIcon, AppIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/Select'
import { ConfirmActionDialog } from '@/components/dashboard/ConfirmActionDialog'
import { FormDialog } from '@/components/platform/FormDialog'
import { EmptyState, ErrorBlock, FieldLabel, LoadingBlock, PageHeader } from '@/components/platform/PlatformUi'
import { inputClassName, textareaClassName } from '@/components/platform/platformStyles'
import { usePlatformFormat } from '@/components/platform/usePlatformFormat'
import { useLoader } from '@/components/platform/useLoader'
import { createAnnouncement, deleteAnnouncement, listAnnouncements, listPlans, listTenants, updateAnnouncement } from '@/lib/api/platformApi'
import type { Announcement, AnnouncementSeverity } from '@/lib/api/platformTypes'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { PLATFORM_ROUTES } from '@/lib/platformRoutes'
import { isAnnouncementActive } from '@/lib/subscriptionFeatures'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const toLocalInput = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function AnnouncementDialog({ editing, onClose, onSaved }: { editing: Announcement | 'new' | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation()
  const plans = useLoader(listPlans, [])
  const tenants = useLoader(() => listTenants(), [])
  const current = editing && editing !== 'new' ? editing : null
  const [key, setKey] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [scope, setScope] = useState<'ALL' | 'PLAN' | 'CAB'>('ALL')
  const [target, setTarget] = useState('')
  const [severity, setSeverity] = useState<AnnouncementSeverity>('INFO')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')

  // Load the record into the form each time the dialog opens for another one.
  const openKey = editing === null ? null : current?.id ?? 'new'
  if (openKey !== key) {
    setKey(openKey)
    const audience = current?.audience ?? 'ALL'
    const [s, ...rest] = audience.split(':')
    setTitle(current?.title ?? '')
    setBody(current?.body ?? '')
    setScope(s === 'PLAN' || s === 'CAB' ? s : 'ALL')
    setTarget(rest.join(':'))
    setSeverity(current?.severity ?? 'INFO')
    setStartsAt(toLocalInput(current?.startsAt ?? new Date().toISOString()))
    setEndsAt(toLocalInput(current?.endsAt ?? null))
  }

  const validDates = Boolean(startsAt) && (!endsAt || new Date(endsAt) > new Date(startsAt))
  const valid = title.trim().length > 0 && body.trim().length > 0 && validDates && (scope === 'ALL' || Boolean(target))

  return (
    <FormDialog
      open={editing !== null}
      wide
      title={current ? t('platform.announcements.editTitle') : t('platform.announcements.newTitle')}
      submitLabel={current ? t('platform.common.saveChanges') : t('platform.announcements.publish')}
      canSubmit={valid}
      onClose={onClose}
      onSubmit={async () => {
        const input = {
          title: title.trim(),
          body: body.trim(),
          audience: scope === 'ALL' ? 'ALL' : `${scope}:${target}`,
          severity,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        }
        if (current) await updateAnnouncement(current.id, input)
        else await createAnnouncement(input)
        toast.success(t('platform.announcements.saved'))
        onSaved()
      }}
    >
      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="ann-title" required>{t('platform.announcements.titleLabel')}</FieldLabel>
        <input id="ann-title" className={inputClassName} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      </div>
      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="ann-body" required>{t('platform.announcements.body')}</FieldLabel>
        <textarea id="ann-body" rows={4} className={textareaClassName} value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <FieldLabel>{t('platform.announcements.audience')}</FieldLabel>
          <SelectField
            value={scope}
            onChange={(v) => {
              setScope(v as 'ALL' | 'PLAN' | 'CAB')
              setTarget('')
            }}
            options={[
              { value: 'ALL', label: t('platform.announcements.audienceAll') },
              { value: 'PLAN', label: t('platform.announcements.audiencePlan') },
              { value: 'CAB', label: t('platform.announcements.audienceCab') },
            ]}
          />
        </div>
        {scope !== 'ALL' && (
          <div className="flex flex-col gap-2">
            <FieldLabel required>{scope === 'PLAN' ? t('platform.common.plan') : t('platform.invoices.tenant')}</FieldLabel>
            <SelectField
              value={target}
              onChange={setTarget}
              placeholder={t('platform.common.choose')}
              options={scope === 'PLAN' ? (plans.data ?? []).map((p) => ({ value: p.code, label: p.name })) : (tenants.data ?? []).map((row) => ({ value: row.id, label: row.name }))}
            />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <FieldLabel>{t('platform.announcements.severity')}</FieldLabel>
          <SelectField value={severity} onChange={(v) => setSeverity(v as AnnouncementSeverity)} options={(['INFO', 'WARNING'] as const).map((s) => ({ value: s, label: t(`platform.announcements.severities.${s}`) }))} />
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="ann-start" required>{t('platform.announcements.startsAt')}</FieldLabel>
          <input id="ann-start" type="datetime-local" dir="ltr" className={inputClassName} value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="ann-end">{t('platform.announcements.endsAt')}</FieldLabel>
          <input id="ann-end" type="datetime-local" dir="ltr" className={inputClassName} value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          {!validDates && startsAt && <p className="text-caption text-error-600">{t('platform.announcements.endAfterStart')}</p>}
        </div>
      </div>
    </FormDialog>
  )
}

export function PlatformAnnouncementsPage() {
  const { t } = useTranslation()
  const f = usePlatformFormat()
  const { data, loading, error, reload } = useLoader(listAnnouncements, [])
  const tenants = useLoader(() => listTenants(), [])
  const [editing, setEditing] = useState<Announcement | 'new' | null>(null)
  const [removing, setRemoving] = useState<Announcement | null>(null)

  const [now] = useState(() => Date.now())
  const phase = (a: Announcement) => (isAnnouncementActive(a, new Date(now)) ? 'live' : new Date(a.startsAt).getTime() > now ? 'scheduled' : 'ended')
  const audienceLabel = (audience: string) => {
    if (audience === 'ALL') return t('platform.announcements.audienceAll')
    const [scope, ...rest] = audience.split(':')
    return scope === 'PLAN' ? t('platform.announcements.audiencePlanValue', { plan: rest.join(':') }) : t('platform.announcements.audienceCabValue', { name: tenants.data?.find((row) => row.id === rest.join(':'))?.name ?? rest.join(':') })
  }

  return (
    <>
      <PageHeader
        title={t('platform.announcements.title')}
        subtitle={t('platform.announcements.subtitle')}
        crumbs={[{ label: t('platform.nav.dashboard'), to: PLATFORM_ROUTES.dashboard }, { label: t('platform.announcements.title') }]}
        actions={
          <Button variant="primary" icon={<AppIcon icon={AddCircleIcon} size={20} />} onClick={() => setEditing('new')} className="w-full sm:w-auto">
            {t('platform.announcements.new')}
          </Button>
        }
      />
      {error ? <ErrorBlock message={getUserErrorMessage(error, t)} onRetry={reload} /> : null}
      {loading && !data ? (
        <LoadingBlock />
      ) : (data ?? []).length === 0 ? (
        <EmptyState title={t('platform.announcements.empty')} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {(data ?? []).map((a) => {
            const p = phase(a)
            return (
              <article key={a.id} className="flex min-w-0 flex-col rounded-lg border border-neutral-100 bg-white p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn('rounded-sm px-2 py-0.5 text-caption font-semibold', a.severity === 'WARNING' ? 'bg-warning-50 text-warning-800' : 'bg-accent-blue/10 text-accent-blue')}>
                    {t(`platform.announcements.severities.${a.severity}`)}
                  </span>
                  <span className={cn('rounded-sm px-2 py-0.5 text-caption font-semibold', p === 'live' ? 'bg-success-50 text-success-700' : p === 'scheduled' ? 'bg-warning-500/10 text-warning-700' : 'bg-neutral-100 text-neutral-600')}>
                    {t(`platform.announcements.phase.${p}`)}
                  </span>
                  <span className="text-caption text-neutral-600">{audienceLabel(a.audience)}</span>
                </div>
                <h2 className="mt-3 text-body font-semibold text-neutral-900">{a.title}</h2>
                <p className="mt-1 whitespace-pre-line text-body-sm text-neutral-700">{a.body}</p>
                <p className="mt-3 text-caption text-neutral-600">
                  {f.dateTime(a.startsAt)} → {a.endsAt ? f.dateTime(a.endsAt) : t('platform.announcements.noEnd')}
                </p>
                <div className="mt-4 flex gap-2 border-t border-neutral-100 pt-3">
                  <Button variant="outline" size="sm" onClick={() => setEditing(a)}>
                    {t('platform.common.edit')}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setRemoving(a)}>
                    {t('platform.common.delete')}
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <AnnouncementDialog editing={editing} onClose={() => setEditing(null)} onSaved={reload} />
      <ConfirmActionDialog
        open={removing !== null}
        title={t('platform.announcements.deleteTitle', { title: removing?.title ?? '' })}
        description={t('platform.announcements.deleteBody')}
        confirmLabel={t('platform.common.delete')}
        destructive
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          if (!removing) return
          try {
            await deleteAnnouncement(removing.id)
          } catch (err) {
            throw new Error(getUserErrorMessage(err, t), { cause: err })
          }
          toast.success(t('platform.announcements.deleted'))
          reload()
        }}
      />
    </>
  )
}
