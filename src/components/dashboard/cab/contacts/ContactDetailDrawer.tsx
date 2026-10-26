import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/Button'
import { SelectField, TextField } from '@/components/ui'
import { WorkflowDialog } from '@/components/dashboard/cab/workflow/WorkflowDialog'
import {
  deleteContact,
  getContactClients,
  updateContact,
  type ContactClientOption,
  type ContactItem,
  type UpdateContactInput,
} from '@/lib/api/cabContactsApi'
import { isValidEmailFormat as isValidEmail } from '@/lib/validators'
import { toast } from '@/lib/toast'
import { workflowErrorMessage } from '@/lib/workflowErrors'
import { displayCountry } from '@/lib/localizeCountry'
import { notSet } from '@/lib/emptyValue'

interface Props {
  contact: ContactItem | null
  onClose: () => void
  /** The contact was saved (updated item) or deleted (null). */
  onChanged: (contact: ContactItem | null) => void
  /** Open straight in edit mode (deep link from "Complete" in the import wizard). */
  initialEditing?: boolean
}

type Form = Required<Omit<UpdateContactInput, 'status'>> & { status: ContactItem['status'] }

const toForm = (c: ContactItem): Form => ({
  firstName: c.firstName,
  lastName: c.lastName,
  email: c.email,
  jobTitle: c.jobTitle,
  phonePrefix: c.phonePrefix,
  phoneNumber: c.phoneNumber,
  linkedSites: [...c.linkedSites],
  isPrimaryContact: c.isPrimaryContact,
  isAuthorizedSignatory: c.isAuthorizedSignatory,
  inviteToPortal: c.inviteToPortal,
  status: c.status,
})

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-caption text-neutral-600">{label}</dt>
      <dd className="mt-0.5 break-words text-body-sm font-semibold text-neutral-900">{value || notSet()}</dd>
    </div>
  )
}

/** Contact detail (side panel) opened from the contacts list, with edit and delete. */
export function ContactDetailDrawer({ contact, onClose, onChanged, initialEditing = false }: Props) {
  return (
    <Dialog.Root open={contact !== null} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-surface-overlay/50" />
        <Dialog.Content aria-describedby={undefined} className="fixed inset-y-0 end-0 z-40 flex w-full max-w-[520px] flex-col bg-white shadow-2xl focus:outline-none">
          {contact && <ContactPanel key={contact.id} contact={contact} onClose={onClose} onChanged={onChanged} initialEditing={initialEditing} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function ContactPanel({ contact, onClose, onChanged, initialEditing }: { contact: ContactItem; onClose: () => void; onChanged: Props['onChanged']; initialEditing: boolean }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(initialEditing)
  const [form, setForm] = useState<Form>(() => toForm(contact))
  const [clients, setClients] = useState<ContactClientOption[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    getContactClients()
      .then((list) => {
        if (!cancelled) setClients(list)
      })
      .catch(() => {
        if (!cancelled) setClients([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const client = clients.find((c) => c.id === contact.clientId || c.code === contact.clientCode)
  const siteName = (id: string, index: number) => client?.sites.find((s) => s.id === id)?.name ?? contact.linkedSiteNames?.[index] ?? id
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((prev) => ({ ...prev, [key]: value }))
  const valid = form.firstName.trim() && form.lastName.trim() && isValidEmail(form.email.trim())

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const saved = await updateContact(contact.id, { ...form, email: form.email.trim(), firstName: form.firstName.trim(), lastName: form.lastName.trim() })
      toast.success(t('cab.contacts.detail.saved', 'Contact saved.'))
      setEditing(false)
      onChanged(saved)
    } catch (err) {
      setError(workflowErrorMessage(err, t))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    setDeleting(true)
    try {
      await deleteContact(contact.id)
      toast.success(t('cab.contacts.detail.deleted', 'Contact deleted.'))
      setConfirmDelete(false)
      onChanged(null)
      onClose()
    } catch (err) {
      setError(workflowErrorMessage(err, t))
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  const yesNo = (value: boolean) => (value ? t('common.yes', 'Yes') : t('common.no', 'No'))
  const statusLabel = (s: ContactItem['status']) => t(`cab.contacts.status.${s}`, s)

  return (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
        <div className="min-w-0">
          <Dialog.Title className="text-body-lg font-bold text-neutral-900">
            {contact.firstName} {contact.lastName}
          </Dialog.Title>
          <p className="mt-1 text-body-sm text-neutral-600">
            {contact.contactCode} · {contact.clientName}
          </p>
        </div>
        <Dialog.Close asChild>
          <button type="button" aria-label={t('common.close', 'Close')} className="flex size-9 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 hover:bg-neutral-50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </Dialog.Close>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {!editing ? (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Row label={t('cab.contacts.detail.jobTitle', 'Job title')} value={contact.jobTitle} />
            <Row label={t('cab.contacts.detail.status', 'Status')} value={statusLabel(contact.status)} />
            <Row label={t('cab.contacts.detail.email', 'E-mail')} value={<span dir="ltr">{contact.email}</span>} />
            <Row label={t('cab.contacts.detail.phone', 'Phone')} value={<span dir="ltr">{[contact.phonePrefix, contact.phoneNumber].filter(Boolean).join(' ')}</span>} />
            <Row label={t('cab.contacts.detail.client', 'Client')} value={`${contact.clientName} (${contact.clientCode})`} />
            <Row label={t('cab.contacts.detail.country', 'Country')} value={displayCountry(contact.country)} />
            <div className="sm:col-span-2">
              <Row label={t('cab.contacts.detail.sites', 'Linked sites')} value={contact.linkedSites.map(siteName).join(', ')} />
            </div>
            <Row label={t('cab.contacts.detail.primary', 'Primary contact')} value={yesNo(contact.isPrimaryContact)} />
            <Row label={t('cab.contacts.detail.signatory', 'Authorised signatory')} value={yesNo(contact.isAuthorizedSignatory)} />
            <Row label={t('cab.contacts.detail.portal', 'Portal access')} value={yesNo(contact.inviteToPortal)} />
            <Row label={t('cab.contacts.detail.created', 'Created')} value={contact.createdAt?.slice(0, 10)} />
          </dl>
        ) : (
          <form
            id="contact-edit-form"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault()
              if (valid && !saving) void save()
            }}
          >
            <TextField id="contact-first" label={t('cab.contacts.detail.firstName', 'First name')} required value={form.firstName} maxLength={100} onChange={(e) => set('firstName', e.target.value)} />
            <TextField id="contact-last" label={t('cab.contacts.detail.lastName', 'Last name')} required value={form.lastName} maxLength={100} onChange={(e) => set('lastName', e.target.value)} />
            <TextField
              id="contact-email"
              type="email"
              dir="ltr"
              label={t('cab.contacts.detail.email', 'E-mail')}
              required
              value={form.email}
              error={form.email.trim() && !isValidEmail(form.email.trim()) ? t('validation.invalidEmail', 'Enter a valid e-mail address.') : undefined}
              onChange={(e) => set('email', e.target.value)}
            />
            <TextField id="contact-job-title" label={t('cab.contacts.detail.jobTitle', 'Job title')} value={form.jobTitle} maxLength={150} onChange={(e) => set('jobTitle', e.target.value)} />
            <TextField id="contact-prefix" dir="ltr" label={t('cab.contacts.detail.prefix', 'Country code')} value={form.phonePrefix} maxLength={6} onChange={(e) => set('phonePrefix', e.target.value)} />
            <TextField id="contact-phone" dir="ltr" label={t('cab.contacts.detail.phone', 'Phone')} value={form.phoneNumber} maxLength={20} onChange={(e) => set('phoneNumber', e.target.value)} />
            <SelectField
              id="contact-status"
              label={t('cab.contacts.detail.status', 'Status')}
              value={form.status}
              options={(['active', 'inactive', 'pending'] as const).map((s) => ({ value: s, label: statusLabel(s) }))}
              onChange={(value) => set('status', value as ContactItem['status'])}
            />
            {client && client.sites.length > 0 && (
              <fieldset className="sm:col-span-2">
                <legend className="mb-2 text-body-sm font-medium text-neutral-900">{t('cab.contacts.detail.sites', 'Linked sites')}</legend>
                <div className="flex flex-col gap-2">
                  {client.sites.map((site) => (
                    <label key={site.id} className="flex items-center gap-2 text-body-sm">
                      <input
                        type="checkbox"
                        checked={form.linkedSites.includes(site.id)}
                        onChange={(e) => set('linkedSites', e.target.checked ? [...form.linkedSites, site.id] : form.linkedSites.filter((id) => id !== site.id))}
                      />
                      {site.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <div className="flex flex-col gap-2 sm:col-span-2">
              {(
                [
                  ['isPrimaryContact', t('cab.contacts.detail.primary', 'Primary contact')],
                  ['isAuthorizedSignatory', t('cab.contacts.detail.signatory', 'Authorised signatory')],
                  ['inviteToPortal', t('cab.contacts.detail.portal', 'Portal access')],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-body-sm">
                  <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)} />
                  {label}
                </label>
              ))}
            </div>
          </form>
        )}
        {error && (
          <p role="alert" className="mt-4 rounded-md bg-error-50 px-3 py-2 text-body-sm text-error-600">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-wrap justify-between gap-2 border-t border-neutral-100 px-5 py-4">
        <Button type="button" variant="destructive" size="sm" className="h-10 px-4" onClick={() => setConfirmDelete(true)}>
          {t('cab.contacts.detail.delete', 'Delete')}
        </Button>
        {editing ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 px-4"
              onClick={() => {
                setForm(toForm(contact))
                setEditing(false)
                setError(null)
              }}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" form="contact-edit-form" size="sm" className="h-10 px-4" disabled={!valid || saving}>
              {saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
            </Button>
          </div>
        ) : (
          <Button type="button" size="sm" className="h-10 px-4" onClick={() => setEditing(true)}>
            {t('cab.contacts.detail.edit', 'Edit contact')}
          </Button>
        )}
      </div>

      <WorkflowDialog
        open={confirmDelete}
        title={t('cab.contacts.detail.delete', 'Delete')}
        description={t('cab.contacts.detail.confirmDelete', { defaultValue: 'Delete {{name}}? This cannot be undone.', name: `${contact.firstName} ${contact.lastName}` })}
        confirmLabel={t('cab.contacts.detail.delete', 'Delete')}
        tone="destructive"
        busy={deleting}
        onConfirm={() => void remove()}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  )
}
