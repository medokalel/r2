import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/Button'
import { FormField, SelectField, TextField } from '@/components/ui'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { PhoneInputRow } from '@/components/auth/CountryCodeSelect'
import { MailIcon, PhoneIcon } from '@/components/icons'
import type { CountryCode } from '@/lib/countries'
import { useFieldValidation } from '@/hooks/useFieldValidation'
import { isValidEmailFormat, isValidPhoneNumber } from '@/lib/validators'
import { SITE_TYPE_OPTIONS, SITE_ACTIVITY_OPTIONS } from '@/lib/api/applicationDraftApi'
import type { Site } from '@/lib/sitesFacilitiesForm'

interface AddSiteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (site: Site) => void
}

const emptyState = {
  name: '',
  siteType: '',
  address: '',
  country: '',
  employees: '',
  activities: [] as string[],
  contactName: '',
  contactPhone: '',
  contactEmail: '',
}

export function AddSiteModal({ open, onOpenChange, onAdd }: AddSiteModalProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState(emptyState)
  const [contactCountryCode, setContactCountryCode] = useState<CountryCode>('EG')

  const patch = (f: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...f }))

  const { fieldProps } = useFieldValidation(form, {
  contactEmail: (value) => (!isValidEmailFormat(value) ? t('validation.invalidEmail') : undefined),
  contactPhone: (value) =>
    !isValidPhoneNumber(value, contactCountryCode) ? t('validation.invalidMobile') : undefined,
})

  const canAdd = Boolean(
    form.name.trim() &&
      form.siteType &&
      form.address.trim() &&
      form.employees.trim() &&
      form.activities.length > 0 &&
      form.contactName.trim() &&
      form.contactPhone.trim() &&
      isValidPhoneNumber(form.contactPhone, contactCountryCode) &&
      form.contactEmail.trim() &&
      isValidEmailFormat(form.contactEmail)
  )

  const reset = () => {
    setForm(emptyState)
    setContactCountryCode('EG')
  }

  const handleAdd = () => {
    if (!canAdd) return
    onAdd({
      id: crypto.randomUUID(),
      name: form.name.trim(),
      siteType: form.siteType,
      address: form.address.trim(),
      country: form.country.trim(),
      activities: form.activities,
      employees: Number(form.employees) || 0,
      contact: {
        name: form.contactName.trim(),
        phone: form.contactPhone.trim(),
        email: form.contactEmail.trim(),
      },
    })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed start-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(600px,calc(100vw-40px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[var(--radius-lg)] bg-white shadow-[var(--shadow-card)] focus:outline-none rtl:translate-x-1/2"
        >
          <div className="flex shrink-0 items-center justify-between px-6 pt-6">
            <Dialog.Title className="text-[20px] font-semibold text-neutral-900">
              {t('cab.applicationDraft.sitesFacilities.addNewSite')}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t('common.close')}
                className="flex size-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-900 hover:border-neutral-400"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label={t('cab.applicationDraft.sitesFacilities.modal.siteName')} required>
                <TextField
                  type="text"
                  value={form.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  placeholder={t('cab.applicationDraft.sitesFacilities.modal.siteNamePlaceholder')}
                />
              </FormField>
              <FormField label={t('cab.applicationDraft.sitesFacilities.modal.siteType')} required>
                <SelectField
                  value={form.siteType}
                  options={SITE_TYPE_OPTIONS}
                  onChange={(value) => patch({ siteType: value })}
                  placeholder={t('cab.applicationDraft.sitesFacilities.modal.siteTypePlaceholder')}
                />
              </FormField>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label={t('cab.applicationDraft.sitesFacilities.modal.address')} required>
                <TextField
                  type="text"
                  value={form.address}
                  onChange={(e) => patch({ address: e.target.value })}
                  placeholder={t('cab.applicationDraft.sitesFacilities.modal.addressPlaceholder')}
                />
              </FormField>
              <FormField label={t('cab.applicationDraft.sitesFacilities.modal.country')}>
                <TextField type="text" value={form.country} onChange={(e) => patch({ country: e.target.value })} />
              </FormField>
            </div>

            <FormField label={t('cab.applicationDraft.sitesFacilities.modal.employees')} required>
              <TextField
                type="text"
                inputMode="numeric"
                value={form.employees}
                onChange={(e) => patch({ employees: e.target.value })}
                placeholder={t('cab.applicationDraft.sitesFacilities.modal.employeesPlaceholder')}
              />
            </FormField>

            <FormField label={t('cab.applicationDraft.sitesFacilities.modal.activitiesScope')} required>
              <MultiSelect
                tags={form.activities}
                options={SITE_ACTIVITY_OPTIONS}
                onChange={(tags) => patch({ activities: tags })}
                placeholder={t('cab.applicationDraft.sitesFacilities.modal.activitiesScopePlaceholder')}
              />
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label={t('cab.applicationDraft.sitesFacilities.modal.contactName')} required>
                <TextField
                  type="text"
                  value={form.contactName}
                  onChange={(e) => patch({ contactName: e.target.value })}
                  placeholder={t('cab.applicationDraft.sitesFacilities.modal.contactNamePlaceholder')}
                />
              </FormField>
              <FormField label={t('cab.applicationDraft.sitesFacilities.modal.contactEmail')} required>
                <TextField
                  type="email"
                  icon={MailIcon}
                  value={form.contactEmail}
                  onChange={(e) => patch({ contactEmail: e.target.value })}
                  {...fieldProps('contactEmail')}
                />
              </FormField>
            </div>

            <FormField label={t('cab.applicationDraft.sitesFacilities.modal.contactPhone')} required>
              <PhoneInputRow
                rowClassName="gap-3"
                value={contactCountryCode}
                onChange={setContactCountryCode}
                aria-label={t('cab.applicationDraft.sitesFacilities.modal.contactPhone')}
              >
                <div className="min-w-0 flex-1">
                  <TextField
                    type="tel"
                    icon={PhoneIcon}
                    value={form.contactPhone}
                    onChange={(e) => patch({ contactPhone: e.target.value })}
                    placeholder="1XXXXXXXXX"
                    {...fieldProps('contactPhone')}
                  />
                </div>
              </PhoneInputRow>
            </FormField>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-alabaster-150 px-6 py-4">
            <Button variant="tertiary" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" disabled={!canAdd} onClick={handleAdd}>
              {t('cab.applicationDraft.sitesFacilities.addNewSite')}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}