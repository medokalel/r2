import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import type { ClientProfile, PortalContactPatch, PortalSitePatch } from '@/lib/api/portalApi'
import { cn } from '@/lib/utils'

/* Row actions of the portal company profile: the "•••" menu and the edit / confirm dialogs. */

export interface RowMenuItem {
  label: string
  onSelect: () => void
  destructive?: boolean
  disabled?: boolean
}

/** The "•••" button of a table row, opening a short list of actions. */
export function RowMenu({ label, items }: { label: string; items: RowMenuItem[] }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          className="rounded-sm px-1.5 font-bold text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 focus-visible:outline-2 focus-visible:outline-primary"
        >
          •••
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={4} className="z-[70] min-w-[180px] rounded-md border border-neutral-100 bg-white p-1 shadow-lg">
          {items.map((item) => (
            <DropdownMenu.Item
              key={item.label}
              disabled={item.disabled}
              onSelect={item.onSelect}
              className={cn(
                'cursor-pointer rounded-sm px-3 py-2 text-body-sm outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40 data-[highlighted]:bg-neutral-25',
                item.destructive ? 'text-error-600' : 'text-neutral-800',
              )}
            >
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function DialogShell({ title, children, onClose, busy }: { title: string; children: ReactNode; onClose: () => void; busy: boolean }) {
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open && !busy) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-surface-overlay/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed start-1/2 top-1/2 z-50 flex max-h-[92vh] w-[min(460px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-lg bg-white p-5 shadow-2xl focus:outline-none rtl:translate-x-1/2 sm:p-6"
        >
          <Dialog.Title className="text-body font-bold text-neutral-900">{title}</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Actions({ busy, disabled, onClose, onSubmit, submitLabel, destructive }: {
  busy: boolean
  disabled?: boolean
  onClose: () => void
  onSubmit: () => void
  submitLabel: string
  destructive?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="flex justify-end gap-2 pt-1">
      <Button variant="tertiary" size="sm" disabled={busy} onClick={onClose}>
        {t('common.cancel')}
      </Button>
      <Button variant={destructive ? 'destructive' : undefined} size="sm" disabled={busy || disabled} onClick={onSubmit}>
        {busy ? t('portal.companyProfile.rowActions.saving') : submitLabel}
      </Button>
    </div>
  )
}

type Site = ClientProfile['sites'][number]
type Contact = ClientProfile['contacts'][number]

/** Edit a site's name, address and status (mount while editing). */
export function EditSiteDialog({ site, busy, onClose, onSave }: {
  site: Site
  busy: boolean
  onClose: () => void
  onSave: (patch: PortalSitePatch) => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(site.name)
  const [address, setAddress] = useState(site.address)
  const [status, setStatus] = useState<Site['status']>(site.status)
  const valid = name.trim() !== '' && address.trim() !== ''
  return (
    <DialogShell title={t('portal.companyProfile.rowActions.editSiteTitle', { name: site.name })} onClose={onClose} busy={busy}>
      <div className="space-y-3">
        <TextField label={t('portal.companyProfile.sites.colName')} required value={name} maxLength={200} onChange={(e) => setName(e.target.value)} />
        <TextField label={t('portal.companyProfile.sites.colAddress')} required value={address} maxLength={500} onChange={(e) => setAddress(e.target.value)} />
        <SelectField
          label={t('portal.companyProfile.sites.colStatus')}
          value={status}
          onChange={(value) => setStatus(value as Site['status'])}
          options={[
            { value: 'Active', label: t('portal.companyProfile.rowActions.statusActive') },
            { value: 'Inactive', label: t('portal.companyProfile.rowActions.statusInactive') },
          ]}
        />
      </div>
      <Actions
        busy={busy}
        disabled={!valid}
        onClose={onClose}
        submitLabel={t('portal.companyProfile.rowActions.save')}
        onSubmit={() => onSave({ name: name.trim(), address: address.trim(), status })}
      />
    </DialogShell>
  )
}

/** Edit a contact's name, business role and phone; the e-mail (their sign-in) is read-only. */
export function EditContactDialog({ contact, busy, onClose, onSave }: {
  contact: Contact
  busy: boolean
  onClose: () => void
  onSave: (patch: PortalContactPatch) => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(contact.name)
  const [role, setRole] = useState(contact.role)
  const [phone, setPhone] = useState(contact.phone)
  const phoneValid = /^\+?[0-9\s-]*$/.test(phone.trim())
  const valid = name.trim().length >= 2 && phoneValid
  return (
    <DialogShell title={t('portal.companyProfile.rowActions.editContactTitle', { name: contact.name })} onClose={onClose} busy={busy}>
      <div className="space-y-3">
        <TextField label={t('portal.companyProfile.contacts.colName')} required value={name} maxLength={150} onChange={(e) => setName(e.target.value)} />
        <TextField label={t('portal.companyProfile.contacts.colRole')} value={role} maxLength={150} onChange={(e) => setRole(e.target.value)} />
        <TextField
          label={t('portal.companyProfile.contacts.colPhone')}
          value={phone}
          dir="ltr"
          inputMode="tel"
          maxLength={30}
          error={phoneValid ? undefined : t('portal.companyProfile.rowActions.phoneInvalid')}
          onChange={(e) => setPhone(e.target.value)}
        />
        <TextField label={t('portal.companyProfile.contacts.colEmail')} value={contact.email} dir="ltr" disabled readOnly />
        <p className="text-caption text-neutral-600">{t('portal.companyProfile.rowActions.emailHint')}</p>
      </div>
      <Actions
        busy={busy}
        disabled={!valid}
        onClose={onClose}
        submitLabel={t('portal.companyProfile.rowActions.save')}
        onSubmit={() => onSave({ name: name.trim(), role: role.trim(), phone: phone.trim() })}
      />
    </DialogShell>
  )
}

/** Yes/no confirmation for a destructive row action. */
export function ConfirmRowDialog({ title, body, confirmLabel, busy, onClose, onConfirm }: {
  title: string
  body: string
  confirmLabel: string
  busy: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <DialogShell title={title} onClose={onClose} busy={busy}>
      <p className="text-body-sm leading-relaxed text-neutral-700">{body}</p>
      <Actions busy={busy} destructive onClose={onClose} onSubmit={onConfirm} submitLabel={confirmLabel} />
    </DialogShell>
  )
}
