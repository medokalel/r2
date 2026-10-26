import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useCreateOfferTourSteps } from '@/config/createOfferTourSteps'
import { ROUTES } from '@/lib/routes'
import {
  createOffer,
  getOfferApplicationOptions,
  getOfferById,
  reviseOffer,
  type OfferApplicationOption,
  type OfferFeeItem,
  type OfferItem,
} from '@/lib/api/cabOffersApi'
import { workflowErrorMessage } from '@/lib/workflowErrors'
import { cn } from '@/lib/utils'
import { displayCountry } from '@/lib/localizeCountry'
import { notSet } from '@/lib/emptyValue'
import { buttonVariants } from '@/components/ui/buttonVariants'

export function CabCreateOfferPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tourSteps = useCreateOfferTourSteps()
  // ?revise=<offer id>: the existing offer is opened for editing and saved as a new revision.
  const [searchParams] = useSearchParams()
  const reviseId = searchParams.get('revise')
  const [revising, setRevising] = useState<OfferItem | null>(null)
  const [reviseLoadFailed, setReviseLoadFailed] = useState(false)

  // Form states matching Screenshot 2 & 3
  // Applications (with their client details) come from GET /cab/offers/applications.
  const [offerApps, setOfferApps] = useState<OfferApplicationOption[]>([])
  const [application, setApplication] = useState('')
  const listedApp = offerApps.find((a) => a.applicationId === application)
  // In revise mode the application is fixed; its details come from the offer itself.
  const selectedApp: OfferApplicationOption | undefined = revising
    ? {
        applicationId: revising.applicationId ?? application,
        applicationNumber: revising.relatedApplication,
        applicationStatus: listedApp?.applicationStatus ?? '',
        standard: revising.applicationStandard,
        scope: revising.applicationScope,
        clientId: listedApp?.clientId ?? '',
        clientName: revising.clientName,
        clientCode: revising.clientCode,
        country: revising.country,
        primaryContact: revising.primaryContact,
        contactEmail: revising.contactEmail,
      }
    : listedApp
  const client = selectedApp ? `${selectedApp.clientCode} - ${selectedApp.clientName}` : ''
  const [offerNumber] = useState('AUTO')
  const [currency, setCurrency] = useState<string>('SAR')
  const [validUntil, setValidUntil] = useState(() => new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10))
  const [paymentTerms, setPaymentTerms] = useState('30 days from invoice date')
  const [notes, setNotes] = useState('')

  // Fee items
  const [fees, setFees] = useState<OfferFeeItem[]>([
    { id: '1', description: t('ui.feeAudit'), amount: 2000.0 },
    { id: '2', description: t('ui.feeAdministration'), amount: 300.0 },
  ])

  // Add fee modal / inline state
  const [showAddFeeModal, setShowAddFeeModal] = useState(false)
  const [newFeeDescription, setNewFeeDescription] = useState('Surveillance audit fee')
  const [newFeeAmount, setNewFeeAmount] = useState('500.00')

  // More details accordion & fields
  const [moreDetailsOpen, setMoreDetailsOpen] = useState(true)
  const [travelCosts, setTravelCosts] = useState<'Included' | 'Excluded' | 'Reimbursed'>('Excluded')
  const [optionalDiscount, setOptionalDiscount] = useState('0.00')
  const [termsAttachment, setTermsAttachment] = useState<{
    name: string
    size: string
  } | null>({
    name: 'Offer_Terms_Conditions.pdf',
    size: 'PDF • 248 KB',
  })
  const [approvalRoute, setApprovalRoute] = useState('Commercial Approval')

  // UI status & validation
  const [showDiscardModal, setShowDiscardModal] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  useEffect(() => {
    if (!reviseId) return
    let active = true
    getOfferById(reviseId)
      .then((offer) => {
        if (!active) return
        if (!offer) {
          setReviseLoadFailed(true)
          return
        }
        setRevising(offer)
        setApplication(offer.applicationId ?? '')
        setCurrency(offer.currency)
        setValidUntil(offer.validUntil)
        setPaymentTerms(offer.paymentTerms)
        setNotes(offer.notes ?? '')
        setFees(offer.fees.map((f) => ({ ...f })))
        setTravelCosts(offer.travelCosts)
        setOptionalDiscount(String(offer.optionalDiscount ?? 0))
        setTermsAttachment(offer.termsAttachmentName ? { name: offer.termsAttachmentName, size: 'PDF' } : null)
        setApprovalRoute(offer.approvalRoute || 'Commercial Approval')
      })
      .catch(() => {
        if (active) setReviseLoadFailed(true)
      })
    return () => {
      active = false
    }
  }, [reviseId])

  useEffect(() => {
    if (reviseId) return
    let active = true
    getOfferApplicationOptions()
      .then((list) => {
        if (!active) return
        setOfferApps(list)
        const first = list.find((a) => a.applicationStatus === 'APPROVED') ?? list[0]
        if (first) {
          setApplication(first.applicationId)
          if (first.currency) setCurrency(first.currency)
        }
      })
      .catch(() => {
        if (active) setErrors({ application: t('common.loadFailed', 'Failed to load. Please try again.') })
      })
    return () => {
      active = false
    }
  }, [t, reviseId])

  // Fee calculations
  const totalBeforeTax =
    fees.reduce((acc, f) => acc + (Number(f.amount) || 0), 0) - (Number(optionalDiscount) || 0)
  const total = Math.max(0, totalBeforeTax)

  const handleAddFee = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFeeDescription.trim()) return
    const amountNum = parseFloat(newFeeAmount) || 0
    const newItem: OfferFeeItem = {
      id: Date.now().toString(),
      description: newFeeDescription.trim(),
      amount: amountNum,
    }
    setFees([...fees, newItem])
    setShowAddFeeModal(false)
    setNewFeeDescription('')
    setNewFeeAmount('')
  }

  const handleRemoveFee = (id: string) => {
    setFees(fees.filter((f) => f.id !== id))
  }

  const validateForm = () => {
    const errs: { [key: string]: string } = {}
    if (!revising && (!application || !selectedApp)) errs.application = t('cab.offers.errors.applicationRequired', 'Application is required.')
    if (!validUntil) errs.validUntil = 'Valid until is required.'
    if (fees.length === 0) errs.fees = 'At least one fee line is required.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async (status: 'draft' | 'pending_approval') => {
    if (!validateForm() || !selectedApp) return

    setIsSubmitting(true)
    if (revising) {
      try {
        const saved = await reviseOffer(revising.id, {
          currency,
          validUntil,
          paymentTerms,
          notes,
          fees,
          travelCosts,
          optionalDiscount: parseFloat(optionalDiscount) || 0,
          termsAttachmentName: termsAttachment?.name,
          approvalRoute,
          status,
        })
        setSuccessToast(
          t('cab.offers.revisionSaved', { defaultValue: 'Revision {{revision}} of {{number}} saved.', revision: saved.revision ?? '', number: saved.offerNumber })
        )
        setTimeout(() => navigate(`${ROUTES.cabOffers}?offer=${encodeURIComponent(saved.offerNumber)}`), 1200)
      } catch (err) {
        setErrors({ application: workflowErrorMessage(err, t) })
      } finally {
        setIsSubmitting(false)
      }
      return
    }
    try {
      await createOffer({
        applicationId: selectedApp.applicationId,
        clientName: selectedApp.clientName,
        clientCode: selectedApp.clientCode,
        country: selectedApp.country,
        primaryContact: selectedApp.primaryContact,
        contactEmail: selectedApp.contactEmail,
        relatedApplication: selectedApp.applicationNumber,
        applicationStandard: selectedApp.standard,
        applicationScope: selectedApp.scope,
        currency,
        validUntil,
        paymentTerms,
        notes,
        fees,
        travelCosts,
        optionalDiscount: parseFloat(optionalDiscount) || 0,
        termsAttachmentName: termsAttachment?.name,
        approvalRoute,
        status,
      })

      setSuccessToast(
        status === 'pending_approval'
          ? t('ui.offerSentForApproval')
          : t('ui.offerDraftSaved')
      )

      setTimeout(() => {
        navigate(ROUTES.cabOffers)
      }, 1200)
    } catch {
      setErrors({ application: t('common.saveFailed', 'Save failed. Your values were preserved. Please try again.') })
    } finally {
      setIsSubmitting(false)
    }
  }

  const pageTitle = revising
    ? t('cab.offers.reviseTitle', { defaultValue: 'Revise offer {{number}}', number: revising.offerNumber })
    : t('cab.offers.createOffer', 'Create offer')

  return (
    <CabLayout
      sidebarVariant="offers"
      tourId="cab-create-offer"
      tourSteps={tourSteps}
    >
      <CabHeader
        title={pageTitle}
        notificationCount={3}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto page-main">
        {/* Toast */}
        {successToast && (
          <div className="fixed top-5 end-5 z-50 flex items-center gap-2 bg-success-600 text-white px-4 py-3 rounded-3xl shadow-xl text-body-sm font-medium animate-in slide-in-from-top-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{successToast}</span>
          </div>
        )}

        {/* Top Breadcrumb & Header */}
        <CabTourStep steps={tourSteps} stepId="create-offer-header">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <nav className="mb-1 flex items-center gap-2 text-body-sm text-neutral-500">
                <span className="font-medium text-neutral-600">{t('cab.offersPage.title', 'Offers')}</span>
                <span>›</span>
                <span className="font-semibold text-primary">{pageTitle}</span>
              </nav>
              <h1 className="text-section-title text-text-primary">
                {pageTitle}
              </h1>
              <p className="mt-0.5 text-body-sm text-neutral-600">
                {revising
                  ? t('cab.offers.reviseSubtitle', {
                      defaultValue: 'Saving creates revision {{next}}; the offer goes back to draft and must be approved and issued again.',
                      next: (revising.revision ?? 1) + 1,
                    })
                  : t('cab.offers.createOfferSubtitle', 'Prepare a commercial offer for the client based on an accepted application.')}
              </p>
              {reviseLoadFailed && (
                <p role="alert" className="mt-2 text-body-sm text-error-600">
                  {t('cab.offers.reviseLoadError', 'The offer to revise could not be loaded.')}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate(ROUTES.cabOffers)}
              className="flex h-11 items-center gap-2 rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>{t('cab.offers.backToOffers', 'Back to offers')}</span>
            </button>
          </div>
        </CabTourStep>

        {/* Top 2-Column Cards: Client and Application & Offer Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card 1: Client and application */}
          <CabTourStep steps={tourSteps} stepId="create-offer-client-app">
            <div className="rounded-lg border border-neutral-100 bg-white p-4 sm:p-6 shadow-none space-y-4">
              <h2 className="text-body font-bold text-neutral-900 border-b border-neutral-100 pb-3">
                {t('cab.offers.clientAndApp', 'Client and application')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium text-neutral-800">
                    {t('ui.client')} <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={client}
                    className="h-11 w-full rounded-md border border-neutral-100 bg-neutral-50 px-4 text-body-sm text-neutral-800 focus:outline-none cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium text-neutral-800">
                    {t('ui.application')} <span className="text-error-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={application}
                      disabled={Boolean(revising)}
                      onChange={(e) => {
                        setApplication(e.target.value)
                        const next = offerApps.find((a) => a.applicationId === e.target.value)
                        if (next?.currency) setCurrency(next.currency)
                        if (errors.application) setErrors({ ...errors, application: '' })
                      }}
                      className={cn(
                        'h-11 w-full appearance-none rounded-md border bg-white px-4 text-body-sm pr-8 focus:outline-none transition-colors',
                        errors.application
                          ? 'border-error-500 text-error-900 focus:border-error-500'
                          : 'border-neutral-100 text-neutral-900 focus:border-primary'
                      )}
                    >
                      {revising && (
                        <option value={application}>
                          {revising.relatedApplication} · {revising.clientName} · {revising.applicationStandard}
                        </option>
                      )}
                      {offerApps.map((a) => (
                        <option key={a.applicationId} value={a.applicationId}>
                          {a.applicationNumber} · {a.clientName} · {a.standard}
                        </option>
                      ))}
                    </select>
                    <svg className="w-4 h-4 text-neutral-500 absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {errors.application && (
                    <p className="text-caption text-error-600">{errors.application}</p>
                  )}
                </div>
              </div>

              {/* Read-only client details grid */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-2 text-body-sm rounded-md bg-neutral-25 border border-neutral-100 p-4">
                <div>
                  <span className="text-neutral-600 block text-caption">{t('ui.country.label')}</span>
                  <span className="font-semibold text-neutral-900">{displayCountry(selectedApp?.country) || notSet()}</span>
                </div>
                <div>
                  <span className="text-neutral-600 block text-caption">{t('ui.scope')}</span>
                  <span className="font-semibold text-neutral-900 leading-snug block">
                    {selectedApp?.scope || notSet()}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-600 block text-caption">{t('ui.primaryContact')}</span>
                  <span className="font-semibold text-neutral-900">{selectedApp?.primaryContact || notSet()}</span>
                </div>
                <div>
                  <span className="text-neutral-600 block text-caption">{t('ui.standard')}</span>
                  <span className="font-semibold text-neutral-900">{selectedApp?.standard || notSet()}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-neutral-600 block text-caption">{t('ui.email')}</span>
                  <span className="font-semibold text-primary">{selectedApp?.contactEmail || notSet()}</span>
                </div>
              </div>
            </div>
          </CabTourStep>

          {/* Card 2: Offer details */}
          <CabTourStep steps={tourSteps} stepId="create-offer-details">
            <div className="rounded-lg border border-neutral-100 bg-white p-4 sm:p-6 shadow-none space-y-4">
              <h2 className="text-body font-bold text-neutral-900 border-b border-neutral-100 pb-3">
                {t('cab.offers.offerDetails', 'Offer details')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium text-neutral-800">{t('ui.offerNumber')}</label>
                  <input
                    type="text"
                    readOnly
                    value={revising ? `${revising.offerNumber} · rev ${(revising.revision ?? 1) + 1}` : offerNumber}
                    className="h-11 w-full rounded-md border border-neutral-100 bg-neutral-50 px-4 text-body-sm text-neutral-700 font-mono focus:outline-none cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium text-neutral-800">
                    {t('ui.currency')} <span className="text-error-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="h-11 w-full appearance-none rounded-md border border-neutral-100 bg-white px-4 text-body-sm text-neutral-900 pe-8 focus:border-primary focus:outline-none transition-colors"
                    >
                      <option value="USD">USD</option>
                      <option value="SAR">SAR</option>
                      <option value="EGP">EGP</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="AED">AED</option>
                    </select>
                    <svg className="w-4 h-4 text-neutral-500 absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium text-neutral-800">
                    {t('ui.validUntil')} <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => {
                      setValidUntil(e.target.value)
                      if (errors.validUntil) setErrors({ ...errors, validUntil: '' })
                    }}
                    className={cn(
                      'h-11 w-full rounded-md border bg-white px-4 text-body-sm focus:outline-none transition-colors',
                      errors.validUntil
                        ? 'border-error-500 text-error-900 focus:border-error-500'
                        : 'border-neutral-100 text-neutral-900 focus:border-primary'
                    )}
                  />
                  {errors.validUntil && (
                    <p className="text-caption text-error-600">{errors.validUntil}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium text-neutral-800">
                    {t('ui.paymentTerms')} <span className="text-error-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      className="h-11 w-full appearance-none rounded-md border border-neutral-100 bg-white px-4 text-body-sm text-neutral-900 pe-8 focus:border-primary focus:outline-none transition-colors"
                    >
                      <option value="30 days from invoice date">{t('ui.terms30')}</option>
                      <option value="15 days from invoice date">{t('ui.terms15')}</option>
                      <option value="Upon receipt of invoice">{t('ui.termsOnReceipt')}</option>
                      <option value="50% advance, 50% upon completion">{t('ui.terms5050')}</option>
                    </select>
                    <svg className="w-4 h-4 text-neutral-500 absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-body-sm font-medium text-neutral-800">{t('ui.notes')}</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('ui.internalNotesPlaceholder')}
                  className="w-full rounded-md border border-neutral-100 bg-white p-3 text-body-sm text-neutral-900 placeholder:text-neutral-500 focus:border-primary focus:outline-none transition-colors resize-none"
                />
                <p className="text-caption text-neutral-600">
                  {t('ui.notesPrecedence')}
                </p>
              </div>
            </div>
          </CabTourStep>
        </div>

        {/* Fees Section */}
        <CabTourStep steps={tourSteps} stepId="create-offer-fees">
          <div className="rounded-lg border border-neutral-100 bg-white p-4 sm:p-6 shadow-none space-y-4">
            <h2 className="text-body font-bold text-neutral-900 border-b border-neutral-100 pb-3">{t('ui.fees')}</h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Table of fee lines */}
              <div className="lg:col-span-8 space-y-3">
                <div className="overflow-hidden rounded-md border border-neutral-100 bg-white">
                  <table className="w-full border-collapse text-start text-body-sm">
                    <thead>
                      <tr className="bg-primary text-white">
                        <th className="w-12 p-4 text-center font-medium">#</th>
                        <th className="p-4 text-start font-medium">{t('ui.description')}</th>
                        <th className="p-4 text-end font-medium">{t('ui.amountParen')}{currency})</th>
                        <th className="w-12 p-4 text-center font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {fees.map((item, index) => (
                        <tr key={item.id} className={cn('hover:bg-primary-50/50 transition-colors', index % 2 === 1 ? 'bg-neutral-25' : '')}>
                          <td className="px-4 py-3.5 text-center text-neutral-600 font-medium">{index + 1}</td>
                          <td className="px-4 py-3.5 text-body text-neutral-900 font-medium">{item.description}</td>
                          <td className="px-4 py-3.5 text-end text-body font-medium text-neutral-900">
                            {Number(item.amount).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveFee(item.id)}
                              className="text-neutral-500 hover:text-error-600 transition-colors"
                              title={t('ui.removeFeeLine')}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {errors.fees && <p className="text-caption text-error-600">{errors.fees}</p>}

                <button
                  type="button"
                  onClick={() => setShowAddFeeModal(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-primary/30 bg-primary-50 px-4 text-body-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  <span className="text-body leading-none">+</span>
                  <span>{t('ui.addFee')}</span>
                </button>
              </div>

              {/* Totals Summary Box */}
              <div className="lg:col-span-4 rounded-md bg-neutral-25 p-5 border border-neutral-100 space-y-3">
                <div className="flex justify-between items-center text-body-sm font-medium text-neutral-700">
                  <span>{t('ui.totalBeforeTax')}</span>
                  <span className="text-body font-bold text-neutral-900">
                    {totalBeforeTax.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-body-sm text-neutral-700">
                  <span className="font-medium">{t('ui.taxNotConfigured')}</span>
                  <span className="font-semibold text-neutral-800">{notSet()}</span>
                </div>

                <div className="border-t border-neutral-100 pt-3 flex justify-between items-center text-body font-bold text-neutral-900">
                  <span>{t('ui.totalParen')}{currency})</span>
                  <span className="text-body-lg text-primary">
                    {total.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CabTourStep>

        {/* More Details Collapsible */}
        <CabTourStep steps={tourSteps} stepId="create-offer-more-details">
          <div className="rounded-lg border border-neutral-100 bg-white shadow-none overflow-hidden">
            <button
              type="button"
              onClick={() => setMoreDetailsOpen(!moreDetailsOpen)}
              className="w-full px-6 py-4 flex items-center justify-between text-start font-bold text-neutral-900 text-body bg-neutral-25 hover:bg-neutral-100/60 transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg className={cn("w-4 h-4 text-neutral-600 transition-transform", moreDetailsOpen && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
                {t('ui.moreDetails')}
              </span>
            </button>

            {moreDetailsOpen && (
              <div className="p-4 sm:p-6 border-t border-neutral-100 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column Fields */}
                  <div className="lg:col-span-6 space-y-4">
                    {/* Travel costs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      <label className="text-body-sm font-medium text-neutral-800">{t('ui.travelCosts')}</label>
                      <div className="relative">
                        <select
                          value={travelCosts}
                          onChange={(e) => setTravelCosts(e.target.value as 'Included' | 'Excluded' | 'Reimbursed')}
                          className="h-11 w-full appearance-none rounded-md border border-neutral-100 bg-white px-4 text-body-sm text-neutral-900 pe-8 focus:border-primary focus:outline-none"
                        >
                          <option value="Excluded">{t('ui.excluded')}</option>
                          <option value="Included">{t('ui.included')}</option>
                          <option value="Reimbursed">{t('ui.reimbursed')}</option>
                        </select>
                        <svg className="w-4 h-4 text-neutral-500 absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Optional discount */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      <label className="text-body-sm font-medium text-neutral-800">
                        {t('ui.optionalDiscountParen')}{currency})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={optionalDiscount}
                        onChange={(e) => setOptionalDiscount(e.target.value)}
                        placeholder="0.00"
                        className="h-11 w-full rounded-md border border-neutral-100 bg-white px-4 text-body-sm text-neutral-900 focus:border-primary focus:outline-none"
                      />
                    </div>

                    {/* Terms and conditions attachment */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-body-sm font-medium text-neutral-800">
                        {t('ui.termsAttachment')}
                      </label>
                      {termsAttachment ? (
                        <div className="flex items-center justify-between p-3 bg-neutral-25 border border-neutral-100 rounded-md text-body-sm">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <div>
                              <span className="font-semibold text-neutral-900 block">
                                {termsAttachment.name}
                              </span>
                              <span className="text-caption text-neutral-500">
                                {termsAttachment.size}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setTermsAttachment(null)}
                            className="text-neutral-500 hover:text-neutral-800 p-1"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setTermsAttachment({
                              name: 'Offer_Terms_Conditions.pdf',
                              size: 'PDF • 248 KB',
                            })
                          }
                          className="w-full py-3 px-4 border-2 border-dashed border-neutral-100 rounded-md text-body-sm text-neutral-600 hover:bg-neutral-50 flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <span>{t('ui.uploadTermsPdf')}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Approval route Stepper & Info Notice */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-body-sm font-medium text-neutral-800">{t('ui.approvalRoute')}</label>
                        <div className="relative w-52">
                          <select
                            value={approvalRoute}
                            onChange={(e) => setApprovalRoute(e.target.value)}
                            className="h-9 w-full appearance-none rounded-md border border-neutral-100 bg-white px-3 text-body-sm text-neutral-800 pe-7 focus:border-primary focus:outline-none"
                          >
                            <option value="Commercial Approval">{t('ui.commercialApproval')}</option>
                            <option value="Standard Technical Route">{t('ui.standardTechnicalRoute')}</option>
                          </select>
                          <svg className="w-3.5 h-3.5 text-neutral-500 absolute end-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* Vertical Approval Stepper */}
                      <div className="rounded-md bg-neutral-25 p-4 border border-neutral-100 space-y-3">
                        <div className="relative ps-6 space-y-4">
                          {/* Step 1 */}
                          <div className="relative">
                            <div className="absolute -start-6 top-0.5 size-3 rounded-full bg-primary ring-4 ring-primary-50" />
                            <div className="absolute -start-[19px] top-3.5 w-0.5 h-7 bg-neutral-300" />
                            <div className="text-body-sm font-semibold text-neutral-900">
                              {t('ui.approver1')}
                            </div>
                            <div className="text-caption text-neutral-600">{t('ui.status.pending')}</div>
                          </div>

                          {/* Step 2 */}
                          <div className="relative">
                            <div className="absolute -start-6 top-0.5 size-3 rounded-full bg-neutral-400 ring-4 ring-neutral-100" />
                            <div className="absolute -start-[19px] top-3.5 w-0.5 h-7 bg-neutral-300" />
                            <div className="text-body-sm font-semibold text-neutral-800">
                              {t('ui.approver2')}
                            </div>
                            <div className="text-caption text-neutral-500">{t('ui.status.pending')}</div>
                          </div>

                          {/* Step 3 */}
                          <div className="relative">
                            <div className="absolute -start-6 top-0.5 size-3 rounded-full bg-neutral-400 ring-4 ring-neutral-100" />
                            <div className="text-body-sm font-semibold text-neutral-800">
                              {t('ui.approver3')}
                            </div>
                            <div className="text-caption text-neutral-500">{t('ui.status.pending')}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Info Notice Banner */}
                    <div className="p-3.5 bg-primary-50 border border-primary-100 rounded-md flex items-start gap-2.5 text-body-sm text-primary leading-relaxed font-medium">
                      <svg className="w-4 h-4 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        {t('ui.approvalRouteNote')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CabTourStep>

        {/* Footer Action Bar */}
        <CabTourStep steps={tourSteps} stepId="create-offer-actions">
          <div className="flex items-center justify-between pt-2 pb-8">
            <button
              type="button"
              onClick={() => setShowDiscardModal(true)}
              className="flex h-11 items-center justify-center rounded-md border border-neutral-100 bg-white px-5 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isSubmitting || reviseLoadFailed || Boolean(reviseId && !revising)}
                onClick={() => handleSave('draft')}
                className={cn(buttonVariants({ variant: 'secondary', size: 'md' }), 'justify-center')}
              >
                {revising ? t('cab.offers.saveRevision', 'Save revision') : t('cab.offers.saveDraft', 'Save draft')}
              </button>
              <button
                type="button"
                disabled={isSubmitting || reviseLoadFailed || Boolean(reviseId && !revising)}
                onClick={() => handleSave('pending_approval')}
                className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'justify-center')}
              >
                {t('cab.offers.sendForApproval', 'Send for approval')}
              </button>
            </div>
          </div>
        </CabTourStep>

        {/* Add Fee Modal */}
        {showAddFeeModal && (
          <div className="fixed inset-0 bg-surface-overlay/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl border border-neutral-100 w-full max-w-md overflow-hidden">
              <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="text-body font-bold text-neutral-900">{t('ui.addFee')}</h3>
                <button
                  type="button"
                  onClick={() => setShowAddFeeModal(false)}
                  className="text-neutral-500 hover:text-neutral-700 text-body-lg font-bold"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleAddFee} className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium text-neutral-800">
                    {t('ui.description')} <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newFeeDescription}
                    onChange={(e) => setNewFeeDescription(e.target.value)}
                    placeholder={t('ui.feeDescPlaceholder')}
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white px-4 text-body-sm text-neutral-900 placeholder:text-neutral-500 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-body-sm font-medium text-neutral-800">
                    {t('ui.amountParen')}{currency}) <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newFeeAmount}
                    onChange={(e) => setNewFeeAmount(e.target.value)}
                    placeholder="500.00"
                    className="h-11 w-full rounded-md border border-neutral-100 bg-white px-4 text-body-sm text-neutral-900 placeholder:text-neutral-500 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddFeeModal(false)}
                    className="h-10 rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}
                  >
                    {t('ui.add')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Discard Changes Modal */}
        {showDiscardModal && (
          <div className="fixed inset-0 bg-surface-overlay/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl border border-neutral-100 w-full max-w-sm p-5 space-y-4">
              <h3 className="text-body font-bold text-neutral-900">{t('ui.discardChangesQ')}</h3>
              <p className="text-body-sm text-neutral-600 leading-relaxed">
                {t('ui.unsavedChangesLeave')}
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDiscardModal(false)}
                  className="h-10 rounded-md border border-neutral-100 bg-white px-4 text-body-sm font-medium text-neutral-800 hover:bg-neutral-50"
                >
                  {t('ui.stay')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.cabOffers)}
                  className="h-10 rounded-md bg-error-600 hover:bg-error-700 text-white px-4 text-body-sm font-medium shadow-sm"
                >
                  {t('ui.discard')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CabLayout>
  )
}
