import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { getCountries, getCountryCallingCode } from 'libphonenumber-js'
import { PhoneInputRow, type CountryCode } from '@/components/auth/CountryCodeSelect'
import { AppIcon, EditIcon, PhoneIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { fieldHeightClassName, fieldInputClassName } from '@/components/ui/fieldStyles'
import { updateUser, type AppUser } from '@/lib/api/usersApi'
import { isValidPhoneNumber } from '@/lib/validators'
import { cn } from '@/lib/utils'

/** Best-effort reverse lookup: "+20" → "EG". Falls back to EG if no match. */
function countryCodeFromDialCode(dialCode: string | null): CountryCode {
  const digits = dialCode?.replace(/\D/g, '')
  if (!digits) return 'EG'
  const match = getCountries().find((code) => getCountryCallingCode(code) === digits)
  return (match as CountryCode) ?? 'EG'
}

function formToState(user: AppUser) {
  return {
    name: user.fullName ?? '',
    role: user.role ?? '',
    countryCode: countryCodeFromDialCode(user.phoneCountryCode),
    phone: user.phoneNumber ?? '',
  }
}

function isFormComplete(form: ReturnType<typeof formToState>): boolean {
  return Boolean(
    form.name.trim() &&
      form.role.trim() &&
      form.phone.trim() &&
      isValidPhoneNumber(form.phone, form.countryCode)
  )
}

function EditUserForm({
  user,
  onClose,
  onSaved,
}: {
  user: AppUser
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState(() => formToState(user))
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof ReturnType<typeof formToState>>(
    key: K,
    value: ReturnType<typeof formToState>[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }))

  const phoneError =
    form.phone.trim() && !isValidPhoneNumber(form.phone, form.countryCode)
      ? t('validation.invalidMobile')
      : undefined

  const onSubmit = async () => {
    setSaving(true)
    try {
      await updateUser(user.id, {
        fullName: form.name,
        role: form.role,
        phoneCountryCode: `+${getCountryCallingCode(form.countryCode)}`,
        phoneNumber: form.phone.replace(/\D/g, ''),
      })
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Fixed header: title at start, circular close at end */}
      <div className="flex shrink-0 items-center justify-between px-6 pt-5">
        <Dialog.Title className="text-[24px] font-semibold leading-[1.6] text-neutral-900">
          {t('users.editUserModal.title')}
        </Dialog.Title>
        <Dialog.Close asChild>
          <button
            type="button"
            aria-label={t('common.close')}
            className="flex size-10 items-center justify-center rounded-full border-2 border-text-primary text-text-primary transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </Dialog.Close>
      </div>

      {/* Scrollable body */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
        <TextField
          id="edit-user-name"
          label={t('users.addUserModal.username')}
          icon={EditIcon}
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder={t('users.addUserModal.usernamePlaceholder')}
        />

        <TextField
          id="edit-user-role"
          label={t('users.addUserModal.role')}
          icon={EditIcon}
          value={form.role}
          onChange={(e) => set('role', e.target.value)}
          placeholder={t('users.addUserModal.rolePlaceholder')}
        />

        <div className="space-y-2">
          <label className="block text-body font-medium text-neutral-900">
            {t('users.addUserModal.mobileNumber')}
          </label>
          <PhoneInputRow
            rowClassName="gap-3"
            value={form.countryCode}
            onChange={(code) => set('countryCode', code)}
            aria-label={t('register.countryCode')}
            className="border border-neutral-300"
          >
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-primary-500">
                <AppIcon icon={PhoneIcon} size={20} />
              </span>
              <input
                id="edit-user-phone"
                type="tel"
                lang="en"
                dir="ltr"
                placeholder={t('ui.phonePlaceholder')}
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                className={cn(
                  fieldInputClassName,
                  fieldHeightClassName,
                  'ps-12',
                  phoneError && 'border-error-400 focus-within:ring-error-400'
                )}
              />
            </div>
          </PhoneInputRow>
          {phoneError && <p className="text-caption text-error-700">{phoneError}</p>}
        </div>

        {/* Email is read-only here — UpdateOrganizationUserRequest doesn't
            accept it, so it can't be changed from this form. */}
        <TextField
          id="edit-user-email"
          type="email"
          label={t('users.addUserModal.email')}
          value={user.email}
          onChange={() => undefined}
          disabled
        />

        {/* Footer actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="tertiary"
            size="lg"
            className="flex-1 bg-error-50 text-error-500 hover:bg-error-100"
            onClick={onClose}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={onSubmit}
            disabled={saving || !isFormComplete(form)}
          >
            {saving ? t('common.loading') : t('users.editUserModal.save')}
          </Button>
        </div>
      </div>
    </>
  )
}

interface EditUserModalProps {
  user: AppUser | null
  onClose: () => void
  onSaved: () => void
}

/** "Edit user" dialog opened from the Users table row actions. */
export function EditUserModal({ user, onClose, onSaved }: EditUserModalProps) {
  return (
    <Dialog.Root open={user !== null} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-surface-overlay/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed start-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(560px,calc(100vw-40px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-card focus:outline-none rtl:translate-x-1/2"
        >
          {user && <EditUserForm key={user.id} user={user} onClose={onClose} onSaved={onSaved} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}