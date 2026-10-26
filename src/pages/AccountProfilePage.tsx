import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { PhoneInputRow, type CountryCode } from '@/components/auth/CountryCodeSelect'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { AppIcon, GlobeIcon, LockIcon, LogoutIcon, MailIcon, NotificationIcon, PhoneIcon, UserIcon } from '@/components/icons'
import { AppLayout } from '@/components/layout/AppLayout'
import { CabLayout } from '@/components/layout/CabLayout'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui'
import { Toggle } from '@/components/ui/Toggle'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { useDirection } from '@/context/direction/useDirection'
import { changePassword, getAccount, getCachedAccount, updateAccount, uploadAvatar, type AccountProfile } from '@/lib/api/accountApi'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationGroup,
  type NotificationPreferences,
} from '@/lib/api/notificationPreferencesApi'
import { clearAuthSession, getAuthSession, isAuditClientSession } from '@/lib/authStorage'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { clearPendingRegistration } from '@/lib/pendingRegistrationStorage'
import { ROUTES } from '@/lib/routes'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024

function Card({ icon, title, hint, children }: { icon: typeof UserIcon; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-100 bg-white p-4 shadow-card sm:p-6">
      <header className="mb-5 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary">
          <AppIcon icon={icon} size={20} />
        </span>
        <div>
          <h2 className="text-body-lg font-bold text-text-primary">{title}</h2>
          {hint && <p className="mt-0.5 text-body-sm text-text-secondary">{hint}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}

const GROUP_TEXT: Record<NotificationGroup, { title: string; hint: string }> = {
  requests: { title: 'Requests and approvals', hint: 'Offers to accept, audit plans to confirm or approve, information requested from you.' },
  findings: { title: 'Findings and corrective actions', hint: 'Nonconformity responses that are due or have been received.' },
  certification: { title: 'Certification', hint: 'Files ready for decision and certificates issued.' },
  billing: { title: 'Invoices and payments', hint: 'Invoices due and overdue.' },
  updates: { title: 'Application updates', hint: 'New applications and answers to information requests.' },
}

type Channel = 'email' | 'sms'

/** "My profile → Notifications": in-app is always on; email and SMS per type group, saved on each switch. */
function NotificationsCard({ hasPhone }: { hasPhone: boolean }) {
  const { t } = useTranslation()
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null)
  const [failed, setFailed] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getNotificationPreferences()
      .then((p) => {
        if (active) setPrefs(p)
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
    }
  }, [])

  const change = async (channel: Channel, group: NotificationGroup, value: boolean) => {
    if (!prefs) return
    const previous = prefs
    setPrefs({ ...prefs, [channel]: { ...prefs[channel], [group]: value } })
    setSaving(`${channel}-${group}`)
    try {
      setPrefs(await updateNotificationPreferences({ [channel]: { [group]: value } }))
      toast.success(t('account.notifications.saved', 'Notification settings saved.'))
    } catch (error) {
      setPrefs(previous)
      toast.error(getUserErrorMessage(error, t))
    } finally {
      setSaving(null)
    }
  }

  const channelLabel = (channel: Channel) => (channel === 'email' ? t('account.notifications.email', 'Email') : t('account.notifications.sms', 'SMS'))
  const notes: string[] = []
  if (prefs && !prefs.channels.email.available) notes.push(t('account.notifications.emailUnavailable', 'Email delivery is not set up on this server yet. Your choices are kept and apply once it is.'))
  if (prefs && !prefs.channels.sms.available) notes.push(t('account.notifications.smsUnavailable', 'SMS delivery is not set up on this server yet. Your choices are kept and apply once it is.'))
  if (prefs?.channels.sms.available && !prefs.channels.sms.phone && !hasPhone) notes.push(t('account.notifications.noPhone', 'Add your mobile number in Personal details to receive SMS.'))

  return (
    <Card icon={NotificationIcon} title={t('account.notifications.title', 'Notifications')} hint={t('account.notifications.hint', 'In-app notifications are always on. Choose what also reaches you by email or SMS.')}>
      {failed ? (
        <p role="alert" className="text-body-sm text-error-600">{t('account.notifications.loadError', 'We could not load your notification settings.')}</p>
      ) : !prefs ? (
        <div className="skeleton h-40 rounded-md" aria-hidden />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-2 text-caption">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-25 px-3 py-1 text-neutral-800">
              <AppIcon icon={MailIcon} size={14} />
              <span dir="ltr">{prefs.channels.email.address}</span>
            </span>
            {prefs.channels.sms.phone && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-25 px-3 py-1 text-neutral-800">
                <AppIcon icon={PhoneIcon} size={14} />
                <span dir="ltr">{prefs.channels.sms.phone}</span>
              </span>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-neutral-100">
            <div className="hidden grid-cols-[minmax(0,1fr)_88px_88px_88px] items-center gap-3 bg-neutral-25 px-4 py-2.5 text-caption font-semibold text-neutral-700 md:grid">
              <span>{t('account.notifications.type', 'Notification type')}</span>
              <span className="text-center">{t('account.notifications.inApp', 'In-app')}</span>
              <span className="text-center">{channelLabel('email')}</span>
              <span className="text-center">{channelLabel('sms')}</span>
            </div>
            <ul className="divide-y divide-neutral-100">
              {prefs.groups.map((group) => {
                const title = t(`account.notifications.groups.${group}.title`, GROUP_TEXT[group].title)
                return (
                  <li key={group} className="grid grid-cols-1 gap-3 px-4 py-3.5 md:grid-cols-[minmax(0,1fr)_88px_88px_88px] md:items-center">
                    <div className="min-w-0">
                      <p className="text-body-sm font-semibold text-text-primary">{title}</p>
                      <p className="mt-0.5 text-caption text-text-secondary">{t(`account.notifications.groups.${group}.hint`, GROUP_TEXT[group].hint)}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2 md:justify-center">
                      <span className="text-caption text-neutral-700 md:hidden">{t('account.notifications.inApp', 'In-app')}</span>
                      <span className="rounded-full bg-primary-50 px-2.5 py-1 text-caption font-semibold text-primary">{t('account.notifications.alwaysOn', 'Always on')}</span>
                    </div>
                    {(['email', 'sms'] as const).map((channel) => (
                      <div key={channel} className="flex items-center justify-between gap-2 md:justify-center">
                        <span className="text-caption text-neutral-700 md:hidden">{channelLabel(channel)}</span>
                        <Toggle
                          size="sm"
                          checked={prefs[channel][group]}
                          disabled={saving !== null}
                          onChange={(value) => void change(channel, group, value)}
                          aria-label={`${title}: ${channelLabel(channel)}`}
                        />
                      </div>
                    ))}
                  </li>
                )
              })}
            </ul>
          </div>
          {notes.length > 0 && (
            <ul className="mt-3 space-y-1 text-caption text-text-secondary">
              {notes.map((note) => (
                <li key={note}>• {note}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  )
}

/** "My profile": the signed-in person's own details, language, password and sign-out. Same page for every account type. */
export function AccountProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { lang, setLanguage } = useDirection()
  const session = getAuthSession()
  const isClient = isAuditClientSession(session)
  const [profile, setProfile] = useState<AccountProfile>(getCachedAccount)
  const [draft, setDraft] = useState<AccountProfile>(getCachedAccount)
  const [saving, setSaving] = useState(false)
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [confirmOut, setConfirmOut] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void getAccount().then((p) => {
      setProfile(p)
      setDraft(p)
    })
  }, [])

  const rawRole = (session?.role?.name ?? session?.user?.role?.name ?? '').toUpperCase()
  const roleLabel = rawRole ? t(`userMenu.roles.${rawRole}`, { defaultValue: rawRole.replace(/_/g, ' ') }) : ''
  const dirty = (['fullName', 'jobTitle', 'phone', 'phoneCountryCode'] as const).some((k) => draft[k] !== profile[k])
  const nameError = !draft.fullName.trim() ? t('account.errors.name', 'Enter your name.') : ''
  const phoneDigits = draft.phone.replace(/\D/g, '')
  const phoneError = phoneDigits && (phoneDigits.length < 7 || phoneDigits.length > 12) ? t('account.errors.phone', 'Enter a valid phone number.') : ''

  const run = async (request: () => Promise<AccountProfile>, patch: Partial<AccountProfile>, message: string) => {
    setSaving(true)
    try {
      const next = await request()
      setProfile(next)
      setDraft((d) => ({ ...d, ...patch, avatarUrl: next.avatarUrl }))
      toast.success(message)
    } catch (error) {
      toast.error(getUserErrorMessage(error, t))
    } finally {
      setSaving(false)
    }
  }

  const save = (patch: Partial<AccountProfile>, message: string) => run(() => updateAccount(patch), patch, message)

  const saveDetails = () => {
    if (nameError || phoneError) return
    void save(
      { fullName: draft.fullName.trim(), jobTitle: draft.jobTitle.trim(), phone: phoneDigits, phoneCountryCode: draft.phoneCountryCode },
      t('account.saved', 'Your profile is saved.'),
    )
  }

  const pickAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return toast.error(t('account.errors.imageType', 'Use a JPG, PNG or WebP image.'))
    if (file.size > MAX_AVATAR_BYTES) return toast.error(t('account.errors.imageSize', 'The image must be 2 MB or smaller.'))
    void run(() => uploadAvatar(file), {}, t('account.photoSaved', 'Photo updated.'))
  }

  const pwRules = [
    { ok: pw.next.length >= 8, label: t('account.password.ruleLength', 'At least 8 characters') },
    { ok: /[A-Z]/.test(pw.next) && /[a-z]/.test(pw.next), label: t('account.password.ruleCase', 'Upper and lower case letters') },
    { ok: /\d/.test(pw.next), label: t('account.password.ruleNumber', 'At least one number') },
  ]
  const submitPassword = async () => {
    setPwError('')
    if (!pw.current) return setPwError(t('account.password.errCurrent', 'Enter your current password.'))
    if (!pwRules.every((r) => r.ok)) return setPwError(t('account.password.errRules', 'The new password does not meet the rules.'))
    if (pw.next !== pw.confirm) return setPwError(t('account.password.errMatch', 'The two new passwords do not match.'))
    setPwSaving(true)
    try {
      await changePassword(pw.current, pw.next)
      setPw({ current: '', next: '', confirm: '' })
      toast.success(t('account.password.changed', 'Password changed.'))
    } catch (error) {
      setPwError(getUserErrorMessage(error, t))
    } finally {
      setPwSaving(false)
    }
  }

  const logout = () => {
    clearAuthSession()
    clearPendingRegistration()
    navigate(ROUTES.login, { replace: true })
  }

  const body = (
    <main className="flex flex-1 flex-col gap-5 overflow-auto page-main">
      {/* Identity card */}
      <section className="flex flex-col items-start gap-5 rounded-lg border border-neutral-100 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:p-6">
        <div className="relative">
          <UserAvatar src={profile.avatarUrl} alt="" className="size-24 border-4 border-primary-50 sm:size-28" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={saving}
            className="absolute -bottom-1 end-0 rounded-full bg-primary px-2.5 py-1 text-caption font-semibold text-white shadow-card hover:bg-primary-hover"
          >
            {t('account.changePhoto', 'Change')}
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pickAvatar} aria-label={t('account.changePhoto', 'Change photo')} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-page-title text-text-primary truncate">{profile.fullName || profile.email}</h1>
          <p className="mt-0.5 truncate text-body-sm text-text-secondary">{[profile.jobTitle, roleLabel].filter(Boolean).join(' · ')}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-caption">
            {session?.organization?.name && <span className="rounded-full bg-primary-25 px-3 py-1 font-medium text-primary">{session.organization.name}</span>}
            <span className="rounded-full bg-neutral-25 px-3 py-1 text-neutral-800" dir="ltr">{profile.email}</span>
          </div>
        </div>
        {profile.avatarUrl && (
          <button type="button" disabled={saving} onClick={() => void save({ avatarUrl: null }, t('account.photoRemoved', 'Photo removed.'))} className="text-body-sm font-medium text-error-600 hover:underline">
            {t('account.removePhoto', 'Remove photo')}
          </button>
        )}
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.618fr)_minmax(0,1fr)]">
        <Card icon={UserIcon} title={t('account.details.title', 'Personal details')} hint={t('account.details.hint', 'How your name and contact appear to your team and clients.')}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField id="acc-name" label={t('account.details.name', 'Full name')} value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} error={nameError || undefined} />
            <TextField id="acc-title" label={t('account.details.jobTitle', 'Job title')} value={draft.jobTitle} onChange={(e) => setDraft({ ...draft, jobTitle: e.target.value })} />
            <TextField id="acc-email" label={t('account.details.email', 'Email')} value={draft.email} disabled />
            <div>
              <span className="mb-1 block text-body-sm font-semibold text-text-primary">{t('account.details.phone', 'Phone')}</span>
              <PhoneInputRow
                rowClassName="gap-2"
                value={draft.phoneCountryCode as CountryCode}
                onChange={(code) => setDraft({ ...draft, phoneCountryCode: code })}
                aria-label={t('account.details.phone', 'Phone')}
              >
                <input
                  type="tel"
                  dir="ltr"
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  aria-invalid={Boolean(phoneError)}
                  placeholder="50 123 4567"
                  className={cn('h-14 min-w-0 flex-1 rounded-md border bg-white px-4 text-body focus:border-focus focus:outline-none', phoneError ? 'border-error-500' : 'border-neutral-100')}
                />
              </PhoneInputRow>
              {phoneError && <p className="mt-1 text-caption text-error-600">{phoneError}</p>}
            </div>
          </div>
          <p className="mt-3 text-caption text-text-secondary">{t('account.details.emailNote', 'Your email is your sign-in and cannot be changed here.')}</p>
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <Button variant="secondary" disabled={!dirty || saving} onClick={() => setDraft(profile)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button variant="primary" disabled={!dirty || saving || Boolean(nameError || phoneError)} onClick={saveDetails} className="min-w-[160px]">
              {saving ? t('common.saving') : t('account.saveChanges', 'Save changes')}
            </Button>
          </div>
        </Card>

        <div className="flex flex-col gap-5">
          <Card icon={GlobeIcon} title={t('account.language.title', 'Language')} hint={t('account.language.hint', 'The whole system switches, including right-to-left for Arabic.')}>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('account.language.title', 'Language')}>
              {(['ar', 'en'] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  role="radio"
                  aria-checked={lang === code}
                  onClick={() => {
                    setLanguage(code)
                    void updateAccount({ language: code }).catch(() => undefined)
                  }}
                  className={cn('h-12 rounded-md border text-body font-semibold transition-colors', lang === code ? 'border-primary bg-primary text-white' : 'border-neutral-100 bg-white text-neutral-800 hover:bg-primary-25')}
                >
                  {code === 'ar' ? 'العربية' : 'English'}
                </button>
              ))}
            </div>
          </Card>

          <Card icon={LogoutIcon} title={t('account.signOut.title', 'Sign out')} hint={t('account.signOut.hint', 'End your session on this device.')}>
            {confirmOut ? (
              <div className="rounded-md bg-error-50 p-3">
                <p className="text-body-sm text-neutral-800">{t('userMenu.logoutConfirm')}</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="primary" onClick={logout} className="bg-error-500 hover:bg-error-600">{t('nav.logout')}</Button>
                  <Button variant="secondary" onClick={() => setConfirmOut(false)}>{t('userMenu.cancel')}</Button>
                </div>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setConfirmOut(true)} className="w-full border-error-500 text-error-600 hover:bg-error-50">
                <AppIcon icon={LogoutIcon} size={18} />
                {t('nav.logout')}
              </Button>
            )}
          </Card>
        </div>
      </div>

      <NotificationsCard hasPhone={Boolean(profile.phone)} />

      <Card icon={LockIcon} title={t('account.password.title', 'Password')} hint={t('account.password.hint', 'Use a password you do not use anywhere else.')}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <TextField id="pw-current" type="password" autoComplete="current-password" label={t('account.password.current', 'Current password')} value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          <TextField id="pw-new" type="password" autoComplete="new-password" label={t('account.password.new', 'New password')} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          <TextField id="pw-confirm" type="password" autoComplete="new-password" label={t('account.password.confirm', 'Confirm new password')} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-caption">
          {pwRules.map((rule) => (
            <li key={rule.label} className={rule.ok ? 'text-success-700' : 'text-text-secondary'}>
              {rule.ok ? '✓' : '•'} {rule.label}
            </li>
          ))}
        </ul>
        {pwError && <p role="alert" className="mt-3 text-body-sm text-error-600">{pwError}</p>}
        <div className="mt-5 flex justify-end">
          <Button variant="primary" disabled={pwSaving || !pw.next} onClick={() => void submitPassword()} className="min-w-[180px]">
            {pwSaving ? t('common.saving') : t('account.password.submit', 'Change password')}
          </Button>
        </div>
      </Card>
    </main>
  )

  const title = t('account.title', 'My profile')
  return isClient ? (
    <AppLayout>
      <CabHeader title={title} />
      {body}
    </AppLayout>
  ) : (
    <CabLayout>
      <CabHeader title={title} />
      {body}
    </CabLayout>
  )
}
