import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { enumLabel } from '@/lib/enumLabel'
import { PortalLayout } from '@/components/layout/PortalLayout'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { usePortalCompanyProfileTourSteps } from '@/config/portalCompanyProfileTourSteps'
import { useOptionalTour } from '@/context/TourContext'
import {
  AppIcon,
  InfoIcon,
  CorrectiveActionIcon,
} from '@/components/icons'
import {
  addPortalSite,
  deletePortalDocument,
  deletePortalSite,
  getPortalProfile,
  getStoredPortalProfile,
  PORTAL_DOCUMENT_MIMES,
  PORTAL_DOCUMENT_TYPES,
  portalDocumentMaxBytes,
  removePortalContact,
  replacePortalDocument,
  saveStoredPortalProfile,
  updatePortalContact,
  updatePortalProfile,
  updatePortalSite,
  uploadPortalDocument,
  type ClientProfile,
  type PortalDocumentType,
} from '@/lib/api/portalApi'
import {
  ConfirmRowDialog,
  EditContactDialog,
  EditSiteDialog,
  RowMenu,
} from '@/components/portal/companyProfile/ProfileRowActions'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { toast as appToast } from '@/lib/toast'
import { getLocalizedSectorOptions } from '@/components/dashboard/companyProfile/constants'
import { localizeCountry } from '@/lib/localizeCountry'
import { cn } from '@/lib/utils'
import { notSet } from '@/lib/emptyValue'
import { pageTabClassName, pageTabListClassName } from '@/components/ui/pageTabs'
import { buttonVariants } from '@/components/ui/buttonVariants'

const MORE_TAB_TOUR_STEP = 'portal-profile-sites-contacts-docs'

export function PortalCompanyProfilePage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const tourSteps = usePortalCompanyProfileTourSteps()

  const [profile, setProfile] = useState<ClientProfile>(getStoredPortalProfile)
  const [activeTab, setActiveTab] = useState<'essentials' | 'more'>('essentials')
  // The guided tour's last step points at the "More details" content, so it shows that tab.
  const tour = useOptionalTour()
  const tourOnMoreTab = tour?.isTourActive === true && tour.activeStepId === MORE_TAB_TOUR_STEP
  const shownTab = tourOnMoreTab ? 'more' : activeTab
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showDiscard, setShowDiscard] = useState(false)

  // Modals
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [showAddSiteModal, setShowAddSiteModal] = useState(false)
  const [showAddContactModal, setShowAddContactModal] = useState(false)
  const [showAddDocModal, setShowAddDocModal] = useState(false)
  const [showLogoModal, setShowLogoModal] = useState(false)

  // Form Fields
  const [legalName, setLegalName] = useState(profile.legalName)
  const [countryOfInc, setCountryOfInc] = useState(profile.country)
  const [tradingName, setTradingName] = useState(profile.tradingName)
  const [industrySector, setIndustrySector] = useState(profile.industrySector)
  const [regNumber, setRegNumber] = useState(profile.registrationNumber)
  const [vatNumber, setVatNumber] = useState(profile.vatNumber ?? '')
  const [website, setWebsite] = useState(profile.website)

  // Address
  const [country, setCountry] = useState(profile.address.country)
  const [building, setBuilding] = useState(profile.address.building)
  const [city, setCity] = useState(profile.address.city)
  const [postalCode, setPostalCode] = useState(profile.address.postalCode)
  const [street, setStreet] = useState(profile.address.street)
  const [additionalLine, setAdditionalLine] = useState(profile.address.additionalLine)

  // New item modal states
  const [newSiteName, setNewSiteName] = useState('')
  const [newSiteAddress, setNewSiteAddress] = useState('')

  const [newContactName, setNewContactName] = useState('')
  const [newContactRole, setNewContactRole] = useState('')
  const [newContactEmail, setNewContactEmail] = useState('')
  const [newContactPhone, setNewContactPhone] = useState('')

  const [newDocName, setNewDocName] = useState('')
  const [newDocType, setNewDocType] = useState<PortalDocumentType>('COMMERCIAL_REGISTER')
  const [newDocFile, setNewDocFile] = useState<File | null>(null)

  // Row actions (sites, contacts, documents): one dialog at a time.
  type Site = ClientProfile['sites'][number]
  type Contact = ClientProfile['contacts'][number]
  type Doc = ClientProfile['documents'][number]
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [confirming, setConfirming] = useState<
    { kind: 'site'; item: Site } | { kind: 'contact'; item: Contact } | { kind: 'document'; item: Doc } | null
  >(null)
  const [rowBusy, setRowBusy] = useState(false)
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const [replaceTarget, setReplaceTarget] = useState<Doc | null>(null)

  // Copies a profile into the form fields (after loading or saving).
  const applyProfile = useCallback((p: ClientProfile) => {
    setProfile(p)
    setLegalName(p.legalName)
    setCountryOfInc(p.country)
    setTradingName(p.tradingName)
    setIndustrySector(p.industrySector)
    setRegNumber(p.registrationNumber)
    setVatNumber(p.vatNumber ?? '')
    setWebsite(p.website)
    setCountry(p.address.country)
    setBuilding(p.address.building)
    setCity(p.address.city)
    setPostalCode(p.address.postalCode)
    setStreet(p.address.street)
    setAdditionalLine(p.address.additionalLine)
  }, [])

  // Load the latest profile; never overwrite edits the user has already started.
  const dirtyRef = useRef(false)
  useEffect(() => {
    dirtyRef.current = isDirty
  }, [isDirty])
  useEffect(() => {
    let active = true
    getPortalProfile()
      .then((p) => {
        if (!active) return
        // The form fields keep their own state, so a mid-edit refresh only updates the rest.
        if (dirtyRef.current) setProfile(p)
        else applyProfile(p)
      })
      .catch((error: unknown) => active && appToast.error(getUserErrorMessage(error, t)))
    return () => {
      active = false
    }
  }, [applyProfile, t])

  const showToast = (msg: string) => {
    appToast.success(msg)
  }

  const markDirty = () => setIsDirty(true)

  // Same rule as the server: 15 digits starting and ending with 3 (optional).
  const vatError =
    vatNumber.trim() && !/^3\d{13}3$/.test(vatNumber.trim())
      ? t('companyProfile.basicDataCard.vatNumberError', 'VAT number must be 15 digits starting and ending with 3.')
      : ''

  const handleSave = async () => {
    if (saving) return
    if (vatError) {
      appToast.error(vatError)
      return
    }
    setSaving(true)
    try {
      const updated = await updatePortalProfile(profile, {
        legalName,
        tradingName,
        country: countryOfInc,
        industrySector,
        registrationNumber: regNumber,
        vatNumber: vatNumber.trim(),
        website,
        address: {
          country,
          building,
          city,
          postalCode,
          street,
          additionalLine,
        },
      })
      applyProfile(updated)
      setIsDirty(false)
      showToast(t('portal.companyProfile.savedToast', 'Company profile changes saved successfully.'))
    } catch (error) {
      appToast.error(getUserErrorMessage(error, t))
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (isDirty) {
      setShowDiscard(true)
    } else {
      navigate('/portal')
    }
  }

  const handleAddSite = async () => {
    if (!newSiteName.trim() || !newSiteAddress.trim() || saving) return
    setSaving(true)
    try {
      const updated = await addPortalSite(profile, { name: newSiteName.trim(), address: newSiteAddress.trim() })
      // Only the sites change here; unsaved edits in the form stay as they are.
      setProfile((current) => ({ ...current, sites: updated.sites }))
      setNewSiteName('')
      setNewSiteAddress('')
      setShowAddSiteModal(false)
      showToast(t('portal.companyProfile.siteDraftToast', 'Site draft added and saved to profile.'))
    } catch (error) {
      appToast.error(getUserErrorMessage(error, t))
    } finally {
      setSaving(false)
    }
  }

  const handleAddContact = () => {
    if (!newContactName.trim() || !newContactEmail.trim()) return
    const id = `CTC-00${profile.contacts.length + 1}`
    const updatedContacts = [
      ...profile.contacts,
      {
        id,
        name: newContactName.trim(),
        role: newContactRole.trim() || 'Representative',
        email: newContactEmail.trim(),
        phone: newContactPhone.trim(),
        isPrimary: false,
        hasPortalAccess: true,
        isSignatory: false,
      },
    ]
    const updated = { ...profile, contacts: updatedContacts }
    setProfile(updated)
    saveStoredPortalProfile(updated)
    setNewContactName('')
    setNewContactRole('')
    setNewContactEmail('')
    setNewContactPhone('')
    setShowAddContactModal(false)
    showToast(t('portal.companyProfile.contactDraftToast', 'Contact draft added and saved to profile.'))
  }

  /** Same file rules as the server: PDF, PNG or JPEG within the size limit. */
  const fileProblem = (file: File): string | null => {
    if (!PORTAL_DOCUMENT_MIMES.includes(file.type)) return t('portal.companyProfile.rowActions.fileType')
    if (file.size > portalDocumentMaxBytes()) {
      return t('portal.companyProfile.rowActions.fileSize', { size: portalDocumentMaxBytes() / (1024 * 1024) })
    }
    return null
  }

  const rowErrorText = (error: unknown): string => {
    const code = error instanceof Error ? error.message : ''
    if (code === 'SITE_IN_USE') return t('portal.companyProfile.rowActions.siteInUse')
    if (code === 'CONTACT_IS_OWNER') return t('portal.companyProfile.rowActions.contactIsOwner')
    if (code === 'CONTACT_IS_SELF') return t('portal.companyProfile.rowActions.contactIsSelf')
    return getUserErrorMessage(error, t)
  }

  /** Runs a row action; only the lists change, so unsaved edits in the form stay as they are. */
  const runRowAction = async (action: () => Promise<ClientProfile>, doneText: string): Promise<boolean> => {
    if (rowBusy) return false
    setRowBusy(true)
    try {
      const updated = await action()
      setProfile((current) => ({ ...current, sites: updated.sites, contacts: updated.contacts, documents: updated.documents, documentsSummary: updated.documentsSummary }))
      showToast(doneText)
      return true
    } catch (error) {
      appToast.error(rowErrorText(error))
      return false
    } finally {
      setRowBusy(false)
    }
  }

  const handleAddDocument = async () => {
    if (!newDocFile) return
    const problem = fileProblem(newDocFile)
    if (problem) {
      appToast.error(problem)
      return
    }
    const ok = await runRowAction(
      () => uploadPortalDocument(profile, { file: newDocFile, documentType: newDocType, name: newDocName }),
      t('portal.companyProfile.docUploadedToast', 'Document uploaded successfully.'),
    )
    if (ok) {
      setNewDocName('')
      setNewDocFile(null)
      setShowAddDocModal(false)
    }
  }

  const openDocument = (doc: Doc) => {
    if (!doc.fileUrl) {
      appToast.error(t('portal.companyProfile.rowActions.noFile'))
      return
    }
    const link = document.createElement('a')
    link.href = doc.fileUrl
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.download = doc.name
    link.click()
  }

  const startReplace = (doc: Doc) => {
    setReplaceTarget(doc)
    replaceInputRef.current?.click()
  }

  const handleReplaceFile = async (file: File | undefined) => {
    const target = replaceTarget
    setReplaceTarget(null)
    if (replaceInputRef.current) replaceInputRef.current.value = ''
    if (!file || !target) return
    const problem = fileProblem(file)
    if (problem) {
      appToast.error(problem)
      return
    }
    await runRowAction(
      () => replacePortalDocument(profile, target.id, file),
      t('portal.companyProfile.rowActions.documentReplaced', { name: target.name }),
    )
  }

  const confirmRemoval = async () => {
    if (!confirming) return
    const { kind, item } = confirming
    const ok = await runRowAction(
      () =>
        kind === 'site'
          ? deletePortalSite(profile, item.id)
          : kind === 'contact'
            ? removePortalContact(profile, item.id)
            : deletePortalDocument(profile, item.id),
      t(`portal.companyProfile.rowActions.${kind}Removed`, { name: item.name }),
    )
    if (ok) setConfirming(null)
  }

  return (
    <PortalLayout tourId="portal-profile-tour" tourSteps={tourSteps} title={t('portal.title', 'Client Portal')}>
      <div className="flex flex-col gap-5">
        {/* Top Actions & Breadcrumb Bar */}

        {/* Page Title & Top Actions Bar */}
        <CabTourStep steps={tourSteps} stepId="portal-profile-header">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-page-title text-text-primary">
                {t('portal.companyProfile.title', 'Update company profile')}
              </h1>
              <p className="text-body-sm text-neutral-600 font-medium mt-1">
                {t('portal.companyProfile.subtitle', {
                  clientCode: profile.clientCode,
                  appNumber: profile.activeApplication?.id ?? notSet(),
                  country: localizeCountry(profile.country, i18n.language),
                })}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {profile.hasPendingLegalChange && (
                <button
                  type="button"
                  onClick={() => setShowPendingModal(true)}
                  className="flex items-center gap-2 rounded-md bg-orange-50 px-3 py-2 text-body-sm font-bold text-orange-600 border border-warning-100 hover:bg-warning-100 transition-colors"
                >
                  <span>{t('portal.companyProfile.reviewPending', 'Review pending changes')}</span>
                  <span className="flex size-5 items-center justify-center rounded-full bg-orange-600 text-caption font-bold text-white">
                    1
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCancel}
                className="h-11 rounded-md border border-neutral-100 bg-white px-5 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
              >
                {t('portal.companyProfile.cancel', 'Cancel')}
              </button>

              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
              >
                {t('portal.companyProfile.saveChanges', 'Save changes')}
              </button>
            </div>
          </div>
        </CabTourStep>

        {/* Pending Changes Info Banner */}
        {profile.hasPendingLegalChange && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-primary-100 bg-info-50 p-4 text-body-sm text-neutral-800">
            <div className="flex items-start gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                <AppIcon icon={InfoIcon} size={16} />
              </div>
              <div>
                <p className="font-bold text-neutral-900">
                  {t('portal.companyProfile.pendingBanner.title', 'There are pending changes to your legal identity.')}
                </p>
                <p className="text-neutral-700 mt-0.5">
                  {t('portal.companyProfile.pendingBanner.desc', 'Your request to update the legal name is under review. You can still update other information.')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPendingModal(true)}
              className={cn(buttonVariants({ variant: 'secondary', size: 'md' }), 'self-start sm:self-center shrink-0')}
            >
              {t('portal.companyProfile.pendingBanner.viewDetails', 'View details')}
            </button>
          </div>
        )}

        {/* Tabs Bar */}
        <div role="tablist" aria-label={t('portal.companyProfile.tabs.label', 'Company profile sections')} className={pageTabListClassName}>
          {(['essentials', 'more'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              id={`portal-profile-tab-${tab}`}
              aria-selected={shownTab === tab}
              aria-controls={`portal-profile-panel-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={pageTabClassName(shownTab === tab)}
            >
              {tab === 'essentials'
                ? t('portal.companyProfile.tabs.essentials', 'Essentials')
                : t('portal.companyProfile.tabs.more', 'More details')}
            </button>
          ))}
        </div>
        <p className="-mt-2 text-body-sm text-neutral-600">
          {shownTab === 'essentials'
            ? t('portal.companyProfile.tabs.essentialsHint', 'Company identity, registered address and contacts.')
            : t('portal.companyProfile.tabs.moreHint', 'Sites and branches, official documents and account details.')}
        </p>

        {shownTab === 'essentials' ? (
          <div
            role="tabpanel"
            id="portal-profile-panel-essentials"
            aria-labelledby="portal-profile-tab-essentials"
            className="flex flex-col gap-5"
          >
        {/* Section 1: Logo & Company details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 4 cols: Logo Card */}
          <div className="lg:col-span-4 h-full">
            <CabTourStep steps={tourSteps} stepId="portal-profile-logo-card">
              <div className="rounded-lg border border-neutral-100 bg-white p-5 sm:p-6 shadow-sm space-y-4 h-full">
                <h2 className="text-body font-bold text-neutral-900">
                  {t('portal.companyProfile.logo.title', 'Logo')}
                </h2>

                <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-5 pt-1">
                  {/* Logo Box */}
                  <div className="flex flex-col items-center justify-center size-32 rounded-lg border border-info-100 bg-primary-25 p-3 text-center shrink-0 shadow-sm">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-success-600">
                      <path d="M24 4C24 4 12 16 12 28C12 34.6274 17.3726 40 24 40C30.6274 40 36 34.6274 36 28C36 16 24 4 24 4Z" fill="currentColor" fillOpacity="0.8"/>
                      <path d="M24 14V34M24 24L18 20M24 28L30 24" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                    <span className="text-caption font-extrabold uppercase tracking-tight text-neutral-800 mt-1 leading-none">
                      AL NOOR
                    </span>
                    <span className="text-overline text-neutral-600 font-medium tracking-tighter">
                      FOOD INDUSTRIES
                    </span>
                  </div>

                  <div className="space-y-2 text-center">
                    <button
                      type="button"
                      onClick={() => setShowLogoModal(true)}
                      className={cn(buttonVariants({ variant: 'secondary', size: 'md' }))}
                    >
                      {t('portal.companyProfile.logo.changeBtn', 'Change logo')}
                    </button>
                    <p>
                      <button
                        type="button"
                        onClick={() => showToast(t('portal.companyProfile.logoRequirementsToast', 'Requirements: PNG, JPG, or SVG up to 5MB. Minimum dimensions 200x200px.'))}
                        className="text-caption text-primary hover:underline font-medium"
                      >
                        {t('portal.companyProfile.logo.requirements', 'View upload requirements')}
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </CabTourStep>
          </div>

          {/* Right 8 cols: Company details */}
          <div className="lg:col-span-8 h-full">
            <CabTourStep steps={tourSteps} stepId="portal-profile-company-details">
              <div className="rounded-lg border border-neutral-100 bg-white p-5 sm:p-6 shadow-sm space-y-4 h-full">
                <h2 className="text-body font-bold text-neutral-900">
                  {t('portal.companyProfile.details.title', 'Company details')}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Legal Name */}
                  <div className="space-y-1.5 sm:col-span-1">
                    <div className="flex items-center justify-between">
                      <label className="text-body-sm font-medium text-neutral-800">
                        {t('portal.companyProfile.details.legalName', 'Legal name')}
                      </label>
                      {profile.hasPendingLegalChange && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-caption font-bold text-orange-600">
                          ⏱ {t('portal.companyProfile.details.changePending', 'Change pending')}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={legalName}
                      onChange={(e) => { setLegalName(e.target.value); markDirty(); }}
                      className="h-11 w-full rounded-md border border-neutral-100 bg-neutral-25 px-3.5 text-body-sm text-neutral-900 focus:border-primary focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Country of Incorporation */}
                  <div className="space-y-1.5">
                    <label className="text-body-sm font-medium text-neutral-800">
                      {t('portal.companyProfile.details.countryOfInc', 'Country of incorporation')}
                    </label>
                    <select
                      value={countryOfInc}
                      onChange={(e) => { setCountryOfInc(e.target.value); markDirty(); }}
                      className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3.5 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                    >
                      <option value="Saudi Arabia">{t('ui.country.SA')}</option>
                      <option value="United Arab Emirates">{t('ui.country.AE')}</option>
                      <option value="Egypt">{t('ui.country.EG')}</option>
                      <option value="Kuwait">{t('ui.country.KW')}</option>
                      <option value="Qatar">{t('ui.country.QA')}</option>
                    </select>
                  </div>

                  {/* Trading Name */}
                  <div className="space-y-1.5">
                    <label className="text-body-sm font-medium text-neutral-800">
                      {t('portal.companyProfile.details.tradingName', 'Trading name (if different)')}
                    </label>
                    <input
                      type="text"
                      value={tradingName}
                      onChange={(e) => { setTradingName(e.target.value); markDirty(); }}
                      className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3.5 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Industry Sector */}
                  <div className="space-y-1.5">
                    <label className="text-body-sm font-medium text-neutral-800">
                      {t('portal.companyProfile.details.industrySector', 'Industry sector')}
                    </label>
                    <select
                      value={industrySector}
                      onChange={(e) => { setIndustrySector(e.target.value); markDirty(); }}
                      className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3.5 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                    >
                      <option value="">{t('companyProfile.profileHeader.industrySectorLabel', 'Select Sector')}</option>
                      {getLocalizedSectorOptions(t).map((sec) => (
                        <option key={sec.value} value={sec.value}>
                          {sec.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Company Registration Number */}
                  <div className="space-y-1.5">
                    <label className="text-body-sm font-medium text-neutral-800">
                      {t('portal.companyProfile.details.regNumber', 'Company registration number')}
                    </label>
                    <input
                      type="text"
                      value={regNumber}
                      onChange={(e) => { setRegNumber(e.target.value); markDirty(); }}
                      className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3.5 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* VAT registration number */}
                  <div className="space-y-1.5">
                    <label htmlFor="portal-vat-number" className="text-body-sm font-medium text-neutral-800">
                      {t('companyProfile.basicDataCard.vatNumberLabel', 'VAT registration number')}
                    </label>
                    <input
                      id="portal-vat-number"
                      type="text"
                      dir="ltr"
                      inputMode="numeric"
                      placeholder="3XXXXXXXXXXXXX3"
                      value={vatNumber}
                      onChange={(e) => { setVatNumber(e.target.value.replace(/\D/g, '').slice(0, 15)); markDirty(); }}
                      aria-invalid={Boolean(vatError)}
                      aria-describedby="portal-vat-hint"
                      className={`h-11 w-full rounded-md border bg-white px-3.5 text-body-sm text-neutral-900 focus:border-primary focus:outline-none ${vatError ? 'border-error-500' : 'border-neutral-100'}`}
                    />
                    <p id="portal-vat-hint" className={`text-caption ${vatError ? 'text-error-600' : 'text-neutral-600'}`}>
                      {vatError || t('companyProfile.basicDataCard.vatNumberHint', 'Optional. Printed as the buyer VAT number on tax invoices (ZATCA).')}
                    </p>
                  </div>

                  {/* Website */}
                  <div className="space-y-1.5">
                    <label className="text-body-sm font-medium text-neutral-800">
                      {t('portal.companyProfile.details.website', 'Website')}
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => { setWebsite(e.target.value); markDirty(); }}
                      className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3.5 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </CabTourStep>
          </div>
        </div>

        {/* Section 2: Main address */}
        <CabTourStep steps={tourSteps} stepId="portal-profile-main-address">
          <div className="rounded-lg border border-neutral-100 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-body font-bold text-neutral-900">
              {t('portal.companyProfile.address.title', 'Main address')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-body-sm font-medium text-neutral-800">
                  {t('portal.companyProfile.address.country', 'Country')}
                </label>
                <select
                  value={country}
                  onChange={(e) => { setCountry(e.target.value); markDirty(); }}
                  className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3.5 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                >
                  <option value="Saudi Arabia">{t('ui.country.SA')}</option>
                  <option value="United Arab Emirates">{t('ui.country.AE')}</option>
                  <option value="Egypt">{t('ui.country.EG')}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-body-sm font-medium text-neutral-800">
                  {t('portal.companyProfile.address.building', 'Building')}
                </label>
                <input
                  type="text"
                  value={building}
                  onChange={(e) => { setBuilding(e.target.value); markDirty(); }}
                  className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3.5 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-body-sm font-medium text-neutral-800">
                  {t('portal.companyProfile.address.city', 'City')}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => { setCity(e.target.value); markDirty(); }}
                  className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3.5 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-body-sm font-medium text-neutral-800">
                  {t('portal.companyProfile.address.postalCode', 'Postal code')}
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => { setPostalCode(e.target.value); markDirty(); }}
                  className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3.5 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-body-sm font-medium text-neutral-800">
                  {t('portal.companyProfile.address.street', 'Street')}
                </label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => { setStreet(e.target.value); markDirty(); }}
                  className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3.5 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-body-sm font-medium text-neutral-800">
                  {t('portal.companyProfile.address.additionalLine', 'Additional address line')}
                </label>
                <input
                  type="text"
                  value={additionalLine}
                  onChange={(e) => { setAdditionalLine(e.target.value); markDirty(); }}
                  className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3.5 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>
        </CabTourStep>

        {/* Additional contacts */}
          {/* Additional contacts */}
          <div className="rounded-lg border border-neutral-100 bg-white shadow-sm overflow-hidden space-y-0">
            <div className="flex items-center justify-between p-5 pb-4 border-b border-neutral-100">
              <h2 className="text-body font-bold text-neutral-900">
                {t('portal.companyProfile.contacts.title', 'Additional contacts')}
              </h2>
              <button
                type="button"
                onClick={() => setShowAddContactModal(true)}
                className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
              >
                <span>{t('portal.companyProfile.contacts.addContact', '+ Add contact')}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-start text-body-sm">
                <thead>
                  <tr className="bg-primary text-white">
                    <th className="py-3 px-4 font-semibold text-start text-body-sm">
                      {t('portal.companyProfile.contacts.colName', 'Name')}
                    </th>
                    <th className="py-3 px-4 font-semibold text-start text-body-sm">
                      {t('portal.companyProfile.contacts.colRole', 'Role')}
                    </th>
                    <th className="py-3 px-4 font-semibold text-start text-body-sm">
                      {t('portal.companyProfile.contacts.colEmail', 'Email')}
                    </th>
                    <th className="py-3 px-4 font-semibold text-start text-body-sm">
                      {t('portal.companyProfile.contacts.colPhone', 'Phone')}
                    </th>
                    <th className="py-3 px-4 font-semibold text-start text-body-sm">
                      {t('portal.companyProfile.contacts.colPrimary', 'Primary')}
                    </th>
                    <th className="py-3 px-4 font-semibold text-end text-body-sm">
                      {t('portal.companyProfile.contacts.colActions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {profile.contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-primary-25 transition-colors">
                      <td className="py-3 px-4 font-bold text-neutral-900">{contact.name}</td>
                      <td className="py-3 px-4 text-neutral-700">{enumLabel(t, contact.role)}</td>
                      <td className="py-3 px-4">
                        <a href={`mailto:${contact.email}`} className="text-primary font-medium hover:underline">
                          {contact.email}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-neutral-800 whitespace-nowrap"><span dir="ltr">{contact.phone || notSet()}</span></td>
                      <td className="py-3 px-4">
                        {contact.isPrimary && (
                          <span className="inline-flex items-center justify-center rounded-sm bg-primary-50 px-2.5 py-1 text-caption font-medium text-primary whitespace-nowrap">
                            {t('portal.companyProfile.contacts.primaryBadge', 'Primary')}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-end">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingContact(contact)}
                            className="rounded-sm border border-primary px-2.5 py-1 text-caption font-bold text-primary hover:bg-primary-subtle"
                          >
                            {t('portal.companyProfile.contacts.edit', 'Edit')}
                          </button>
                          <RowMenu
                            label={t('portal.companyProfile.rowOptions', { name: contact.name, defaultValue: 'More options for {{name}}' })}
                            items={[
                              { label: t('portal.companyProfile.rowActions.editDetails'), onSelect: () => setEditingContact(contact) },
                              ...(contact.email ? [{ label: t('portal.companyProfile.rowActions.sendEmail'), onSelect: () => { window.location.href = `mailto:${contact.email}` } }] : []),
                              {
                                label: t('portal.companyProfile.rowActions.removeContact'),
                                destructive: true,
                                disabled: contact.isPrimary,
                                onSelect: () => setConfirming({ kind: 'contact', item: contact }),
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          </div>
        ) : (
          <div
            role="tabpanel"
            id="portal-profile-panel-more"
            aria-labelledby="portal-profile-tab-more"
          >
            <CabTourStep steps={tourSteps} stepId={MORE_TAB_TOUR_STEP}>
              <div className="space-y-6">
            {/* Sites & branches */}
            <div className="rounded-lg border border-neutral-100 bg-white shadow-sm overflow-hidden space-y-0">
              <div className="flex items-center justify-between p-5 pb-4 border-b border-neutral-100">
                <h2 className="text-body font-bold text-neutral-900">
                  {t('portal.companyProfile.sites.title', 'Sites & branches')}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAddSiteModal(true)}
                  className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
                >
                  <span>{t('portal.companyProfile.sites.addSite', '+ Add site')}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-start text-body-sm">
                  <thead>
                    <tr className="bg-primary text-white">
                      <th className="py-3 px-4 font-semibold text-start text-body-sm">
                        {t('portal.companyProfile.sites.colSiteId', 'Site ID')}
                      </th>
                      <th className="py-3 px-4 font-semibold text-start text-body-sm">
                        {t('portal.companyProfile.sites.colName', 'Site name')}
                      </th>
                      <th className="py-3 px-4 font-semibold text-start text-body-sm">
                        {t('portal.companyProfile.sites.colAddress', 'Address')}
                      </th>
                      <th className="py-3 px-4 font-semibold text-start text-body-sm">
                        {t('portal.companyProfile.sites.colStatus', 'Status')}
                      </th>
                      <th className="py-3 px-4 font-semibold text-end text-body-sm">
                        {t('portal.companyProfile.sites.colActions', 'Actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {profile.sites.map((site) => (
                      <tr key={site.id} className="hover:bg-primary-25 transition-colors">
                        <td className="py-3 px-4 font-semibold text-primary">{site.id}</td>
                        <td className="py-3 px-4 font-bold text-neutral-900">{site.name}</td>
                        <td className="py-3 px-4 text-neutral-700 max-w-[200px] truncate">{site.address}</td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              'inline-flex items-center justify-center rounded-sm px-2.5 py-1 text-caption font-medium whitespace-nowrap',
                              site.status === 'Active' ? 'bg-success-100 text-success-700' : 'bg-neutral-50 text-neutral-700',
                            )}
                          >
                            {enumLabel(t, site.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-end">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingSite(site)}
                              className="rounded-sm border border-primary px-2.5 py-1 text-caption font-medium text-primary hover:bg-primary-subtle transition-colors"
                            >
                              {t('portal.companyProfile.sites.edit', 'Edit')}
                            </button>
                            <RowMenu
                              label={t('portal.companyProfile.rowOptions', { name: site.name, defaultValue: 'More options for {{name}}' })}
                              items={[
                                { label: t('portal.companyProfile.rowActions.editDetails'), onSelect: () => setEditingSite(site) },
                                {
                                  label: site.status === 'Active' ? t('portal.companyProfile.rowActions.deactivate') : t('portal.companyProfile.rowActions.activate'),
                                  onSelect: () =>
                                    void runRowAction(
                                      () => updatePortalSite(profile, site.id, { status: site.status === 'Active' ? 'Inactive' : 'Active' }),
                                      t('portal.companyProfile.rowActions.siteSaved', { name: site.name }),
                                    ),
                                },
                                { label: t('portal.companyProfile.rowActions.removeSite'), destructive: true, onSelect: () => setConfirming({ kind: 'site', item: site }) },
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Official documents */}
            <div className="rounded-lg border border-neutral-100 bg-white shadow-sm overflow-hidden space-y-0">
              <div className="flex items-center justify-between p-5 pb-4 border-b border-neutral-100">
                <h2 className="text-body font-bold text-neutral-900">
                  {t('portal.companyProfile.docs.title', 'Official documents')}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(true)}
                  className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
                >
                  <span>{t('portal.companyProfile.docs.addDoc', '+ Add document')}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-start text-body-sm">
                  <thead>
                    <tr className="bg-primary text-white">
                      <th className="py-3 px-4 font-semibold text-start text-body-sm">
                        {t('portal.companyProfile.docs.colName', 'Document name')}
                      </th>
                      <th className="py-3 px-4 font-semibold text-start text-body-sm">
                        {t('portal.companyProfile.docs.colType', 'Type')}
                      </th>
                      <th className="py-3 px-4 font-semibold text-start text-body-sm">
                        {t('portal.companyProfile.docs.colLastUpdated', 'Last updated')}
                      </th>
                      <th className="py-3 px-4 font-semibold text-end text-body-sm">
                        {t('portal.companyProfile.docs.colActions', 'Actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {profile.documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-primary-25 transition-colors">
                        <td className="py-3 px-4 font-bold text-neutral-900">{doc.name}</td>
                        <td className="py-3 px-4 text-neutral-700">{enumLabel(t, doc.type)}</td>
                        <td className="py-3 px-4 text-neutral-600 whitespace-nowrap">{doc.lastUpdated}</td>
                        <td className="py-3 px-4 text-end">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openDocument(doc)}
                              className="rounded-sm border border-primary px-2.5 py-1 text-caption font-medium text-primary hover:bg-primary-subtle transition-colors"
                            >
                              {t('portal.companyProfile.docs.view', 'View')}
                            </button>
                            <RowMenu
                              label={t('portal.companyProfile.rowOptions', { name: doc.name, defaultValue: 'More options for {{name}}' })}
                              items={[
                                { label: t('portal.companyProfile.rowActions.download'), disabled: !doc.fileUrl, onSelect: () => openDocument(doc) },
                                { label: t('portal.companyProfile.rowActions.replaceFile'), disabled: rowBusy, onSelect: () => startReplace(doc) },
                                { label: t('portal.companyProfile.rowActions.removeDocument'), destructive: true, onSelect: () => setConfirming({ kind: 'document', item: doc }) },
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Account & registration (read-only) */}
            <div className="rounded-lg border border-neutral-100 bg-white p-5 sm:p-6 shadow-sm">
              <h2 className="text-body font-bold text-neutral-900">
                {t('portal.companyProfile.account.title', 'Account & registration')}
              </h2>
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-caption font-medium text-neutral-600">{t('portal.companyProfile.account.clientCode', 'Client ID')}</dt>
                  <dd className="mt-1 text-body-sm font-semibold text-neutral-900" dir="ltr">{profile.clientCode || notSet()}</dd>
                </div>
                <div>
                  <dt className="text-caption font-medium text-neutral-600">{t('portal.companyProfile.account.status', 'Account status')}</dt>
                  <dd className="mt-1 text-body-sm font-semibold text-neutral-900">{enumLabel(t, profile.status) || notSet()}</dd>
                </div>
                <div>
                  <dt className="text-caption font-medium text-neutral-600">{t('portal.companyProfile.account.activeApplication', 'Active application')}</dt>
                  <dd className="mt-1 text-body-sm font-semibold text-neutral-900">
                    {profile.activeApplication ? (
                      <>
                        <span dir="ltr">{profile.activeApplication.id}</span>
                        <span className="font-normal text-neutral-600"> · {enumLabel(t, profile.activeApplication.status)}</span>
                      </>
                    ) : (
                      notSet()
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption font-medium text-neutral-600">{t('portal.companyProfile.account.upcomingAudit', 'Upcoming audit')}</dt>
                  <dd className="mt-1 text-body-sm font-semibold text-neutral-900">
                    {profile.upcomingAudit ? `${enumLabel(t, profile.upcomingAudit.stage)} · ${profile.upcomingAudit.date}` : notSet()}
                  </dd>
                </div>
              </dl>
            </div>
              </div>
            </CabTourStep>
          </div>
        )}


        {/* Pending Change Review Modal */}
        {showPendingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-overlay/50 p-4">
            <div className="w-full max-w-lg rounded-lg border border-neutral-100 bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <AppIcon icon={CorrectiveActionIcon} size={18} className="text-orange-600" />
                  <h3 className="text-body font-bold text-neutral-900">
                    {t('portal.companyProfile.modals.pendingTitle', 'Pending Legal Identity Change')}
                  </h3>
                </div>
                <button type="button" onClick={() => setShowPendingModal(false)} className="text-neutral-500 hover:text-neutral-800">
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-body-sm">
                <p className="text-neutral-700 leading-relaxed">
                  {t('portal.companyProfile.modals.pendingDesc', 'A change to your legal organization name was submitted for review. Legal identity modifications require CAB verification to preserve audit certificate integrity.')}
                </p>

                {profile.pendingChanges.map((change) => (
                  <div key={change.id} className="rounded-md border border-warning-100 bg-warning-50 p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-neutral-900">{change.field}</span>
                      <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-caption font-bold text-orange-600">
                        {enumLabel(t, change.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-caption">
                      <div>
                        <span className="text-neutral-600">{t('portal.companyProfile.modals.currentVal', 'Current value:')}</span>
                        <p className="font-semibold text-neutral-800">{change.currentValue}</p>
                      </div>
                      <div>
                        <span className="text-neutral-600">{t('portal.companyProfile.modals.requestedVal', 'Requested value:')}</span>
                        <p className="font-semibold text-primary">{change.requestedValue}</p>
                      </div>
                    </div>
                    <p className="text-caption text-neutral-500 pt-1">
                      {t('portal.companyProfile.modals.submittedOn', { date: change.submittedAt })}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowPendingModal(false)}
                  className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
                >
                  {t('portal.companyProfile.modals.close', 'Close')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Site Modal */}
        {showAddSiteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-overlay/50 p-4">
            <div className="w-full max-w-md rounded-lg border border-neutral-100 bg-white p-6 shadow-2xl space-y-4">
              <h3 className="text-body font-bold text-neutral-900">
                {t('portal.companyProfile.modals.addSiteTitle', 'Add New Site or Branch')}
              </h3>
              <div className="space-y-3 text-body-sm">
                <div className="space-y-1">
                  <label className="font-medium text-neutral-800">
                    {t('portal.companyProfile.modals.siteName', 'Site Name *')}
                  </label>
                  <input
                    type="text"
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                    placeholder={t('portal.companyProfile.modals.siteNamePlaceholder', 'e.g. Jeddah Warehouse')}
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-neutral-800">
                    {t('portal.companyProfile.modals.siteAddress', 'Address *')}
                  </label>
                  <textarea
                    rows={3}
                    value={newSiteAddress}
                    onChange={(e) => setNewSiteAddress(e.target.value)}
                    placeholder={t('portal.companyProfile.modals.siteAddressPlaceholder', 'Full street address, city, country')}
                    className="w-full rounded-md border border-neutral-100 bg-white p-3 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSiteModal(false)}
                  className="rounded-md border border-neutral-100 px-4 py-2 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50"
                >
                  {t('portal.companyProfile.cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => void handleAddSite()}
                  disabled={saving || !newSiteName.trim() || !newSiteAddress.trim()}
                  className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
                >
                  {t('portal.companyProfile.modals.saveSite', 'Save site')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Contact Modal */}
        {showAddContactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-overlay/50 p-4">
            <div className="w-full max-w-md rounded-lg border border-neutral-100 bg-white p-6 shadow-2xl space-y-4">
              <h3 className="text-body font-bold text-neutral-900">
                {t('portal.companyProfile.modals.addContactTitle', 'Add Additional Contact')}
              </h3>
              <div className="space-y-3 text-body-sm">
                <div className="space-y-1">
                  <label className="font-medium text-neutral-800">
                    {t('portal.companyProfile.modals.contactName', 'Full Name *')}
                  </label>
                  <input
                    type="text"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder={t('portal.companyProfile.modals.contactNamePlaceholder', 'e.g. Ahmed Mansoor')}
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-neutral-800">
                    {t('portal.companyProfile.modals.contactRole', 'Role / Job Title')}
                  </label>
                  <input
                    type="text"
                    value={newContactRole}
                    onChange={(e) => setNewContactRole(e.target.value)}
                    placeholder={t('portal.companyProfile.modals.contactRolePlaceholder', 'e.g. Operations Manager')}
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-neutral-800">
                    {t('portal.companyProfile.modals.contactEmail', 'Email Address *')}
                  </label>
                  <input
                    type="email"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    placeholder={t('portal.companyProfile.modals.contactEmailPlaceholder', 'ahmed@example.com')}
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-neutral-800">
                    {t('portal.companyProfile.modals.contactPhone', 'Phone Number')}
                  </label>
                  <input
                    type="tel"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    placeholder={t('portal.companyProfile.modals.contactPhonePlaceholder', '+966 50 123 4567')}
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(false)}
                  className="rounded-md border border-neutral-100 px-4 py-2 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50"
                >
                  {t('portal.companyProfile.cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleAddContact}
                  disabled={!newContactName.trim() || !newContactEmail.trim()}
                  className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
                >
                  {t('portal.companyProfile.modals.saveContact', 'Save contact')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Row actions: edit dialogs, removal confirmation and the hidden "replace file" picker */}
        {editingSite && (
          <EditSiteDialog
            site={editingSite}
            busy={rowBusy}
            onClose={() => setEditingSite(null)}
            onSave={(patch) =>
              void runRowAction(
                () => updatePortalSite(profile, editingSite.id, patch),
                t('portal.companyProfile.rowActions.siteSaved', { name: patch.name ?? editingSite.name }),
              ).then((ok) => ok && setEditingSite(null))
            }
          />
        )}
        {editingContact && (
          <EditContactDialog
            contact={editingContact}
            busy={rowBusy}
            onClose={() => setEditingContact(null)}
            onSave={(patch) =>
              void runRowAction(
                () => updatePortalContact(profile, editingContact.id, patch),
                t('portal.companyProfile.rowActions.contactSaved', { name: patch.name ?? editingContact.name }),
              ).then((ok) => ok && setEditingContact(null))
            }
          />
        )}
        {confirming && (
          <ConfirmRowDialog
            title={t(`portal.companyProfile.rowActions.confirm.${confirming.kind}Title`, { name: confirming.item.name })}
            body={t(`portal.companyProfile.rowActions.confirm.${confirming.kind}Body`, { name: confirming.item.name })}
            confirmLabel={t(`portal.companyProfile.rowActions.confirm.${confirming.kind}Action`)}
            busy={rowBusy}
            onClose={() => setConfirming(null)}
            onConfirm={() => void confirmRemoval()}
          />
        )}
        <input
          ref={replaceInputRef}
          type="file"
          accept={PORTAL_DOCUMENT_MIMES.join(',')}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(e) => void handleReplaceFile(e.target.files?.[0])}
        />

        {/* Add Document Modal */}
        {showAddDocModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-overlay/50 p-4">
            <div className="w-full max-w-md rounded-lg border border-neutral-100 bg-white p-6 shadow-2xl space-y-4">
              <h3 className="text-body font-bold text-neutral-900">
                {t('portal.companyProfile.modals.uploadDocTitle', 'Upload Official Document')}
              </h3>
              <div className="space-y-3 text-body-sm">
                <div className="space-y-1">
                  <label className="font-medium text-neutral-800">
                    {t('portal.companyProfile.rowActions.docNameOptional')}
                  </label>
                  <input
                    type="text"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    placeholder={t('portal.companyProfile.modals.docNamePlaceholder', 'e.g. Environmental Policy 2025')}
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-neutral-800">
                    {t('portal.companyProfile.modals.docType', 'Document Type')}
                  </label>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value as PortalDocumentType)}
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                  >
                    {PORTAL_DOCUMENT_TYPES.map((type) => (
                      <option key={type} value={type}>{t(`portal.companyProfile.docTypes.${type}`)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-neutral-800">
                    {t('portal.companyProfile.modals.selectFile', 'Select File')}
                  </label>
                  <input
                    type="file"
                    accept={PORTAL_DOCUMENT_MIMES.join(',')}
                    onChange={(e) => setNewDocFile(e.target.files?.[0] ?? null)}
                    className="w-full text-body-sm text-neutral-600 file:me-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-body-sm file:font-semibold file:bg-primary-50 file:text-primary hover:file:bg-primary-50"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="rounded-md border border-neutral-100 px-4 py-2 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50"
                >
                  {t('portal.companyProfile.cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => void handleAddDocument()}
                  disabled={!newDocFile || rowBusy}
                  className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
                >
                  {t('portal.companyProfile.modals.uploadBtn', 'Upload')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Logo Modal */}
        {showLogoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-overlay/50 p-4">
            <div className="w-full max-w-md rounded-lg border border-neutral-100 bg-white p-6 shadow-2xl space-y-4">
              <h3 className="text-body font-bold text-neutral-900">
                {t('portal.companyProfile.modals.changeLogoTitle', 'Change Company Logo')}
              </h3>
              <p className="text-body-sm text-neutral-700">
                {t('portal.companyProfile.modals.changeLogoDesc', 'Upload a clear high-resolution logo (PNG, JPG, or SVG). Maximum 5MB.')}
              </p>
              <input
                type="file"
                accept="image/*"
                className="w-full text-body-sm text-neutral-600 file:me-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-body-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoModal(false)}
                  className="rounded-md border border-neutral-100 px-4 py-2 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50"
                >
                  {t('portal.companyProfile.cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogoModal(false)
                    showToast(t('portal.companyProfile.logoUpdatedToast', 'Logo updated successfully.'))
                  }}
                  className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
                >
                  {t('portal.companyProfile.modals.saveLogo', 'Save logo')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Discard Confirmation Dialog */}
        {showDiscard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-overlay/50 p-4">
            <div className="w-full max-w-sm rounded-lg border border-neutral-100 bg-white p-6 shadow-2xl space-y-3">
              <h3 className="text-body font-bold text-neutral-900">
                {t('portal.companyProfile.modals.discardTitle', 'Discard unsaved changes?')}
              </h3>
              <p className="text-body-sm text-neutral-700">
                {t('portal.companyProfile.modals.discardDesc', 'You have unsaved changes to your company profile. Leaving now will discard them.')}
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDiscard(false)}
                  className="rounded-md border border-neutral-100 px-4 py-2 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50"
                >
                  {t('portal.companyProfile.modals.keepEditing', 'Keep editing')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscard(false)
                    navigate('/portal')
                  }}
                  className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
                >
                  {t('portal.companyProfile.modals.discardLeave', 'Discard & leave')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}
