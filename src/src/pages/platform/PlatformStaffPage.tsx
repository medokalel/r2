import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AddCircleIcon, AppIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/Select'
import { ConfirmActionDialog } from '@/components/dashboard/ConfirmActionDialog'
import { FormDialog } from '@/components/platform/FormDialog'
import { DataTable, ErrorBlock, FieldLabel, LoadingBlock, MobileCard, MobileCards, PageHeader } from '@/components/platform/PlatformUi'
import { cellClass, inputClassName, rowClass } from '@/components/platform/platformStyles'
import { usePlatformFormat } from '@/components/platform/usePlatformFormat'
import { useLoader } from '@/components/platform/useLoader'
import { inviteStaff, listStaff, updateStaff } from '@/lib/api/platformApi'
import { PLATFORM_ROLES, type PlatformRole, type StaffUser } from '@/lib/api/platformTypes'
import { getAuthSession } from '@/lib/authStorage'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { PLATFORM_ROUTES } from '@/lib/platformRoutes'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const STATUS_STYLE: Record<StaffUser['status'], string> = {
  ACTIVE: 'bg-success-50 text-success-700',
  PENDING: 'bg-warning-500/10 text-warning-700',
  SUSPENDED: 'bg-neutral-100 text-neutral-600',
}

export function PlatformStaffPage() {
  const { t } = useTranslation()
  const f = usePlatformFormat()
  const me = getAuthSession()?.user?.email?.toLowerCase()
  const { data, loading, error, reload } = useLoader(listStaff, [])
  const [inviting, setInviting] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<PlatformRole>('PLATFORM_SUPPORT')
  const [toggling, setToggling] = useState<StaffUser | null>(null)

  const changeRole = async (user: StaffUser, next: PlatformRole) => {
    try {
      await updateStaff(user.id, { role: next })
      toast.success(t('platform.staff.roleChanged'))
      reload()
    } catch (err) {
      toast.error(getUserErrorMessage(err, t))
    }
  }

  const statusBadge = (u: StaffUser) => <span className={cn('rounded-sm px-2.5 py-1 text-caption font-medium', STATUS_STYLE[u.status])}>{t(`platform.userStatus.${u.status}`)}</span>
  const roleSelect = (u: StaffUser) => (
    <SelectField value={u.role} onChange={(v) => void changeRole(u, v as PlatformRole)} disabled={u.email.toLowerCase() === me} options={PLATFORM_ROLES.map((r) => ({ value: r, label: t(`platform.roles.${r}`) }))} />
  )
  const toggleButton = (u: StaffUser) =>
    u.email.toLowerCase() === me ? (
      <span className="text-caption text-neutral-500">{t('platform.staff.you')}</span>
    ) : (
      <Button variant={u.status === 'SUSPENDED' ? 'outline' : 'destructive'} size="sm" onClick={() => setToggling(u)}>
        {u.status === 'SUSPENDED' ? t('platform.staff.reactivate') : t('platform.staff.deactivate')}
      </Button>
    )

  return (
    <>
      <PageHeader
        title={t('platform.staff.title')}
        subtitle={t('platform.staff.subtitle')}
        crumbs={[{ label: t('platform.nav.dashboard'), to: PLATFORM_ROUTES.dashboard }, { label: t('platform.staff.title') }]}
        actions={
          <Button
            variant="primary"
            icon={<AppIcon icon={AddCircleIcon} size={20} />}
            onClick={() => {
              setName('')
              setEmail('')
              setRole('PLATFORM_SUPPORT')
              setInviting(true)
            }}
            className="w-full sm:w-auto"
          >
            {t('platform.staff.invite')}
          </Button>
        }
      />
      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {PLATFORM_ROLES.map((r) => (
          <div key={r} className="rounded-lg border border-neutral-100 bg-white p-4">
            <p className="text-body-sm font-semibold text-neutral-900">{t(`platform.roles.${r}`)}</p>
            <p className="mt-1 text-body-sm text-neutral-600">{t(`platform.roleHints.${r}`)}</p>
          </div>
        ))}
      </section>
      <section className="flex flex-col gap-4 rounded-lg border border-neutral-100 bg-white p-5">
        {error ? <ErrorBlock message={getUserErrorMessage(error, t)} onRetry={reload} /> : null}
        {loading && !data ? (
          <LoadingBlock />
        ) : (
          <>
            <DataTable minWidth={900} head={[t('platform.staff.name'), t('platform.staff.email'), t('platform.staff.role'), t('platform.common.status'), t('platform.staff.lastLogin'), <span key="a" className="sr-only">{t('platform.common.actions')}</span>]}>
              {(data ?? []).map((u, index) => (
                <tr key={u.id} className={rowClass(index)}>
                  <td className={`${cellClass} font-medium text-neutral-900`}>{u.name}</td>
                  <td className={cellClass}><span dir="ltr">{u.email}</span></td>
                  <td className={`${cellClass} w-[220px]`}>{roleSelect(u)}</td>
                  <td className={cellClass}>{statusBadge(u)}</td>
                  <td className={cellClass}>{u.lastLoginAt ? f.dateTime(u.lastLoginAt) : t('platform.staff.never')}</td>
                  <td className={cellClass}>{toggleButton(u)}</td>
                </tr>
              ))}
            </DataTable>
            <MobileCards>
              {(data ?? []).map((u) => (
                <MobileCard key={u.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-body font-semibold text-neutral-900">{u.name}</p>
                      <p className="truncate text-body-sm text-neutral-600" dir="ltr" style={{ textAlign: 'start' }}>{u.email}</p>
                    </div>
                    {statusBadge(u)}
                  </div>
                  <div className="mt-3">{roleSelect(u)}</div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-caption text-neutral-600">{u.lastLoginAt ? f.dateTime(u.lastLoginAt) : t('platform.staff.never')}</span>
                    {toggleButton(u)}
                  </div>
                </MobileCard>
              ))}
            </MobileCards>
          </>
        )}
      </section>

      <FormDialog
        open={inviting}
        title={t('platform.staff.inviteTitle')}
        description={t('platform.staff.inviteBody')}
        submitLabel={t('platform.staff.sendInvite')}
        canSubmit={name.trim().length > 1 && EMAIL.test(email.trim())}
        onClose={() => setInviting(false)}
        onSubmit={async () => {
          await inviteStaff({ name: name.trim(), email: email.trim(), role })
          toast.success(t('platform.staff.invited', { email: email.trim() }))
          reload()
        }}
      >
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="st-name" required>{t('platform.staff.name')}</FieldLabel>
          <input id="st-name" className={inputClassName} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="st-email" required>{t('platform.staff.email')}</FieldLabel>
          <input id="st-email" type="email" dir="ltr" className={inputClassName} value={email} onChange={(e) => setEmail(e.target.value)} maxLength={160} />
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel>{t('platform.staff.role')}</FieldLabel>
          <SelectField value={role} onChange={(v) => setRole(v as PlatformRole)} options={PLATFORM_ROLES.map((r) => ({ value: r, label: t(`platform.roles.${r}`) }))} />
        </div>
      </FormDialog>

      <ConfirmActionDialog
        open={toggling !== null}
        title={toggling?.status === 'SUSPENDED' ? t('platform.staff.reactivateTitle', { name: toggling.name }) : t('platform.staff.deactivateTitle', { name: toggling?.name ?? '' })}
        description={toggling?.status === 'SUSPENDED' ? t('platform.staff.reactivateBody') : t('platform.staff.deactivateBody')}
        confirmLabel={toggling?.status === 'SUSPENDED' ? t('platform.staff.reactivate') : t('platform.staff.deactivate')}
        destructive={toggling?.status !== 'SUSPENDED'}
        onClose={() => setToggling(null)}
        onConfirm={async () => {
          if (!toggling) return
          try {
            await updateStaff(toggling.id, { status: toggling.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' })
          } catch (err) {
            throw new Error(getUserErrorMessage(err, t), { cause: err })
          }
          toast.success(t('platform.staff.updated'))
          reload()
        }}
      />
    </>
  )
}
