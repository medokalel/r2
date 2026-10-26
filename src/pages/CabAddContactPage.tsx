import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useAddContactTourSteps } from '@/config/addContactTourSteps'
import { createContact, getContactClients, type ContactClientOption } from '@/lib/api/cabContactsApi'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { cn } from '@/lib/utils'
import { PhoneInputRow, type CountryCode } from '@/components/auth/CountryCodeSelect'
import { getCountryCallingCode } from 'libphonenumber-js'
import { displayCountry } from '@/lib/localizeCountry'
import { notSet } from '@/lib/emptyValue'
import { buttonVariants } from '@/components/ui/buttonVariants'

export function CabAddContactPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tourSteps = useAddContactTourSteps()

  // The preview starts with a sample contact filled in; the real app starts empty.
  const demo = isDemoMode()

  // Form State
  const [clients, setClients] = useState<ContactClientOption[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [firstName, setFirstName] = useState(demo ? 'Nada' : '')
  const [lastName, setLastName] = useState(demo ? 'Al-Saud' : '')
  const [email, setEmail] = useState(demo ? 'nada.alsaud@alnoor-foods.example' : '')
  const [jobTitle, setJobTitle] = useState(demo ? 'Food Safety Officer' : '')
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>('SA')
  const phonePrefix = `+${getCountryCallingCode(phoneCountry)}`
  const [phoneNumber, setPhoneNumber] = useState(demo ? '50 123 4567' : '')
  const [linkedSites, setLinkedSites] = useState<string[]>([])
  const [isPrimaryContact, setIsPrimaryContact] = useState(false)
  const [isAuthorizedSignatory, setIsAuthorizedSignatory] = useState(false)
  const [inviteToPortal, setInviteToPortal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // The CAB's audit clients and their sites, so a new contact links to a real client record.
  useEffect(() => {
    let cancelled = false
    getContactClients()
      .then((list) => {
        if (cancelled) return
        setClients(list)
        setSelectedClient((current) => current || list[0]?.id || '')
        if (demo && list[0]?.sites[0]) setLinkedSites([list[0].sites[0].id])
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [demo])

  const currentClient = clients.find((c) => c.id === selectedClient) ?? clients[0]
  // Demo sites carry readable ids (SITE-0101); real ones are UUIDs, so show their names.
  const siteLabel = (siteId: string) =>
    demo ? siteId : currentClient?.sites.find((site) => site.id === siteId)?.name ?? siteId

  const handleRemoveSite = (site: string) => {
    setLinkedSites((prev) => prev.filter((s) => s !== site))
  }

  const handleAddSite = (site: string) => {
    if (!linkedSites.includes(site)) {
      setLinkedSites((prev) => [...prev, site])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentClient) return
    setIsSubmitting(true)
    setError('')
    try {
      await createContact({
        clientId: currentClient.id,
        firstName,
        lastName,
        email,
        jobTitle,
        phoneNumber,
        phonePrefix,
        linkedSites,
        isPrimaryContact,
        isAuthorizedSignatory,
        inviteToPortal,
      })
      navigate('/cab/contacts')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CabLayout
      sidebarVariant="contacts"
      tourId="cab-add-contact"
      tourSteps={tourSteps}
    >
      <CabHeader
        title={t('cab.contacts.addContact', 'Add contact')}
        subtitle={t('cab.contacts.addContactSubtitle', 'Create a new contact for an existing client.')}
        notificationCount={3}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto page-main">
        {/* Page Header Bar */}
        <CabTourStep steps={tourSteps} stepId="add-contact-header">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-body-lg font-bold text-neutral-900">
                {t('cab.contacts.addContact', 'Add contact')}
              </h2>
              <p className="text-body-sm text-neutral-600 mt-0.5">
                {t('cab.contacts.addContactSubtitle', 'Create a new contact for an existing client.')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/cab/contacts')}
              className="flex h-11 items-center gap-2 rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>{t('cab.contacts.backToContacts', 'Back to contacts')}</span>
            </button>
          </div>
        </CabTourStep>

        {/* Main Form Container */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Client Association */}
          <CabTourStep steps={tourSteps} stepId="add-contact-client-association">
            <div className="rounded-lg border border-neutral-100 bg-white p-4 sm:p-6 shadow-none">
              <h3 className="text-body font-bold text-neutral-900 mb-4">
                {t('cab.contacts.sections.clientAssociation', 'Client association')}
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-1.5">
                  <label className="text-body-sm font-medium text-neutral-800">
                    {t('cab.contacts.fields.client', 'Client')} <span className="text-error-500">*</span>
                  </label>
                  <select
                    value={selectedClient}
                    onChange={(e) => {
                      setSelectedClient(e.target.value)
                      // Sites belong to one client.
                      setLinkedSites([])
                    }}
                    className="h-14 w-full rounded-md border border-neutral-100 bg-white px-4 text-body text-neutral-900 focus:border-focus focus:outline-none"
                    required
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.code} · {c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Client Info Preview Card */}
                <div className="lg:col-span-5 rounded-lg bg-primary-50/40 border border-primary-100 p-4">
                  <p className="text-body font-bold text-neutral-900">{currentClient?.name ?? notSet()}</p>
                  <p className="text-body-sm text-neutral-600 mt-0.5">
                    {currentClient?.code ?? notSet()} &nbsp;|&nbsp; {displayCountry(currentClient?.country) || notSet()}
                  </p>
                </div>
              </div>
            </div>
          </CabTourStep>

          {/* Section 2: Contact Details */}
          <CabTourStep steps={tourSteps} stepId="add-contact-details">
            <div className="rounded-lg border border-neutral-100 bg-white p-4 sm:p-6 shadow-none">
              <h3 className="text-body font-bold text-neutral-900 mb-4">
                {t('cab.contacts.sections.contactDetails', 'Contact details')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* First Name */}
                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium text-neutral-800">
                    {t('cab.contacts.fields.firstName', 'First name')} <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={t('ui.firstNamePlaceholder')}
                    required
                    className="h-14 w-full rounded-md border border-neutral-100 bg-white px-4 text-body text-neutral-900 placeholder:text-neutral-500 focus:border-focus focus:outline-none"
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium text-neutral-800">
                    {t('cab.contacts.fields.lastName', 'Last name')} <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={t('ui.lastNamePlaceholder')}
                    required
                    className="h-14 w-full rounded-md border border-neutral-100 bg-white px-4 text-body text-neutral-900 placeholder:text-neutral-500 focus:border-focus focus:outline-none"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-body-sm font-medium text-neutral-800">
                    {t('cab.contacts.fields.email', 'Email address')} <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sara@alnoor.example"
                    required
                    className="h-14 w-full rounded-md border border-neutral-100 bg-white px-4 text-body text-neutral-900 placeholder:text-neutral-500 focus:border-focus focus:outline-none"
                  />
                </div>

                {/* Job Title */}
                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium text-neutral-800">
                    {t('cab.contacts.fields.jobTitle', 'Job title')}
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder={t('ui.jobTitlePlaceholder')}
                    className="h-14 w-full rounded-md border border-neutral-100 bg-white px-4 text-body text-neutral-900 placeholder:text-neutral-500 focus:border-focus focus:outline-none"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium text-neutral-800">
                    {t('cab.contacts.fields.phoneNumber', 'Phone number')}
                  </label>
                  <PhoneInputRow
                    rowClassName="gap-2"
                    value={phoneCountry}
                    onChange={setPhoneCountry}
                    aria-label={t('cab.contacts.fields.phoneNumber', 'Phone number')}
                  >
                    <input
                      type="tel"
                      dir="ltr"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="50 123 4567"
                      className="h-14 min-w-0 flex-1 rounded-md border border-neutral-100 bg-white px-4 text-body text-neutral-900 placeholder:text-text-secondary focus:border-focus focus:outline-none"
                    />
                  </PhoneInputRow>
                </div>
              </div>
            </div>
          </CabTourStep>

          {/* Section 3: Additional details */}
          <CabTourStep steps={tourSteps} stepId="add-contact-additional">
            <div className="rounded-lg border border-neutral-100 bg-white p-4 sm:p-6 shadow-none">
              <h3 className="text-body font-bold text-neutral-900 mb-4">
                {t('cab.contacts.sections.additionalDetails', 'Additional details')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Linked site(s) */}
                <div className="space-y-2">
                  <label className="text-body-sm font-medium text-neutral-800">
                    {t('cab.contacts.fields.linkedSites', 'Linked site(s)')}
                  </label>
                  <div className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-md border border-neutral-100 bg-white p-2">
                    {linkedSites.map((site) => (
                      <span
                        key={site}
                        className="inline-flex items-center gap-1.5 rounded-sm bg-primary-50 px-2.5 py-1 text-body-sm font-semibold text-primary"
                      >
                        {siteLabel(site)}
                        <button
                          type="button"
                          onClick={() => handleRemoveSite(site)}
                          className="text-primary hover:text-error-500 font-bold ms-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddSite(e.target.value)
                          e.target.value = ''
                        }
                      }}
                      className="bg-transparent text-body-sm text-neutral-600 focus:outline-none cursor-pointer ms-1"
                    >
                      <option value="">+ {t('cab.contacts.addSite', 'Add Site')}</option>
                      {(currentClient?.sites ?? []).map((site) => (
                        <option key={site.id} value={site.id}>{demo ? `${site.id} · ${site.name}` : site.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Roles Checkboxes */}
                <div className="space-y-2">
                  <label className="text-body-sm font-medium text-neutral-800">
                    {t('cab.contacts.fields.roles', 'Roles')}
                  </label>
                  <div className="space-y-2.5 pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPrimaryContact}
                        onChange={(e) => setIsPrimaryContact(e.target.checked)}
                        className="size-4 rounded border-neutral-100 text-primary focus:ring-primary"
                      />
                      <span className="text-body-sm text-neutral-800">
                        {t('cab.contacts.roles.primaryContact', 'Primary contact')}
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAuthorizedSignatory}
                        onChange={(e) => setIsAuthorizedSignatory(e.target.checked)}
                        className="size-4 rounded border-neutral-100 text-primary focus:ring-primary"
                      />
                      <span className="text-body-sm text-neutral-800">
                        {t('cab.contacts.roles.authorizedSignatory', 'Authorized signatory')}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Invite to portal toggle */}
                <div className="md:col-span-2 pt-2 border-t border-neutral-100">
                  <label className="text-body-sm font-medium text-neutral-800 block mb-2">
                    {t('cab.contacts.fields.inviteToPortal', 'Invite to portal (optional)')}
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={inviteToPortal}
                      onClick={() => setInviteToPortal((prev) => !prev)}
                      className={cn(
                        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                        inviteToPortal ? 'bg-primary' : 'bg-neutral-400'
                      )}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                          inviteToPortal ? 'translate-x-5' : 'translate-x-0'
                        )}
                      />
                    </button>
                    <div>
                      <p className="text-body-sm font-medium text-neutral-800">
                        {inviteToPortal ? t('common.on', 'On') : t('common.off', 'Off')}
                      </p>
                      <p className="text-caption text-neutral-600">
                        {t('cab.contacts.inviteDesc', 'Send an invitation email to allow this contact to access the client portal.')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CabTourStep>

          {/* Form Action Footer */}
          <CabTourStep steps={tourSteps} stepId="add-contact-actions">
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              {error && (
                <p role="alert" className="me-auto text-body-sm text-error-600">
                  {error}
                </p>
              )}
              <button
                type="button"
                onClick={() => navigate('/cab/contacts')}
                className="h-11 rounded-md border border-neutral-100 bg-white px-5 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !currentClient}
                className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
              >
                {isSubmitting ? t('common.saving', 'Saving...') : t('cab.contacts.saveContact', 'Save contact')}
              </button>
            </div>
          </CabTourStep>
        </form>
      </div>
    </CabLayout>
  )
}

