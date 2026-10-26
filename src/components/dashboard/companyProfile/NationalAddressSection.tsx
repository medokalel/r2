import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DatePicker } from '@/components/ui/DatePicker'
import { Button } from '@/components/ui/Button'
import { FormField, TextField } from '@/components/ui'
import { useFieldValidation } from '@/hooks/useFieldValidation'
import {
  AppIcon,
  DocumentFileIcon,
  ExternalLinkOutlineIcon,
  FileTextIcon,
  SearchIcon,
  TrashIcon,
} from '@/components/icons'
import { cn } from '@/lib/utils'
import { formatFileSize } from '@/lib/files'
import { useBlobUrl } from '@/hooks/useBlobUrl'
import { lookupNationalAddress, SHORT_ADDRESS_PATTERN, type NationalAddress } from '@/lib/api/nationalAddressApi'
import { DOC_ACCEPT, profileCardClassName } from './constants'
import { countryDisplayName } from './mappers'
import { useDocumentActions } from './useDocumentActions'
import { CardHeader } from './Primitives'
import { useProfileForm } from './ProfileFormContext'
import type { NationalAddressFormValues } from './types'
import { nationalAddressRules } from './validation'
import { fieldHeightClassName, fieldInputClassName } from '@/components/ui/fieldStyles'

export function NationalAddressToggleCard({
  value,
  onChange,
}: {
  value: 'yes' | 'no'
  onChange: (v: 'yes' | 'no') => void
}) {
  const { t } = useTranslation()
  return (
    <div className={profileCardClassName}>
      <CardHeader title={t('companyProfile.nationalAddress.hasAddressTitle')} />
      <div className="flex items-center gap-4">
        {(['yes', 'no'] as const).map((option) => {
          const active = value === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                'flex h-[58px] items-center gap-3 rounded-full px-6 py-4 transition-colors',
                active
                  ? 'border border-primary bg-primary-25'
                  : 'border border-neutral-50 bg-neutral-25 hover:border-primary/40'
              )}
            >
              <span className={cn('text-body-lg font-light leading-[1.6]', active ? 'text-primary' : 'text-neutral-700')}>
                {t(`companyProfile.nationalAddress.${option}`)}
              </span>
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  active ? 'border-primary bg-primary' : 'border-neutral-100 bg-white'
                )}
              >
                {active && <span className="size-2 rounded-full bg-white" />}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const readonlyInputCls = 'cursor-default bg-neutral-25 border-neutral-50 text-neutral-700'

function CertificateUploadPreview() {
  const { t } = useTranslation()
  const { documents } = useProfileForm()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const { upload, remove } = useDocumentActions(setBusy)

  // The API appends new uploads while keeping history — the last one is current
  const certificateDoc = [...documents]
    .reverse()
    .find((doc) => doc.documentType === 'NATIONAL_ADDRESS_CERTIFICATE')
  const isPdf = certificateDoc?.mimeType === 'application/pdf'
  const isImage = certificateDoc?.mimeType?.startsWith('image/')

  // The API host refuses to be framed (X-Frame-Options), so PDFs preview
  // through a local blob: URL instead of the remote URL directly
  const pdfPreview = useBlobUrl(isPdf ? certificateDoc?.fileUrl : null)

  const onFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) await upload('NATIONAL_ADDRESS_CERTIFICATE', file)
  }

  return (
    <div className="hidden w-[260px] shrink-0 flex-col gap-3 lg:flex">
      <span className="text-body-sm font-medium leading-[1.6] text-neutral-700">
        {t('companyProfile.nationalAddress.previewLabel')}
      </span>
      <div
        className={cn(
          'flex h-[372px] items-center justify-center overflow-hidden rounded-md border border-neutral-100 bg-neutral-25',
          certificateDoc && isPdf ? '' : 'flex-col gap-3 p-4'
        )}
      >
        {certificateDoc ? (
          isPdf ? (
            pdfPreview.blobUrl ? (
              // White matte + FitH zoom hide the PDF viewer's gray backdrop so
              // the preview reads like a document card, not an embedded browser
              <div className="h-full w-full rounded-md bg-white p-2 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <iframe
                  src={`${pdfPreview.blobUrl}#navpanes=0&view=FitH`}
                  title={certificateDoc.originalName ?? certificateDoc.fileName ?? undefined}
                  className="h-full w-full rounded-sm border border-neutral-50"
                />
              </div>
            ) : pdfPreview.loading ? (
              <div className="skeleton h-full w-full" aria-hidden />
            ) : (
              <div className="flex flex-col items-center gap-3 p-4">
                <AppIcon icon={DocumentFileIcon} size={40} className="text-primary" />
                <p dir="ltr" className="max-w-full truncate text-center text-body-sm text-neutral-700">
                  {certificateDoc.originalName ?? certificateDoc.fileName}
                </p>
                <span dir="ltr" className="text-caption font-normal text-neutral-700">
                  {formatFileSize(certificateDoc.fileSize)}
                </span>
              </div>
            )
          ) : isImage ? (
            <img
              src={certificateDoc.fileUrl ?? undefined}
              alt={certificateDoc.originalName ?? ''}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <>
              <AppIcon icon={DocumentFileIcon} size={40} className="text-primary" />
              <p dir="ltr" className="max-w-full truncate text-center text-body-sm text-neutral-700">
                {certificateDoc.originalName ?? certificateDoc.fileName}
              </p>
              <span dir="ltr" className="text-caption font-normal text-neutral-700">
                {formatFileSize(certificateDoc.fileSize)}
              </span>
            </>
          )
        ) : (
          <AppIcon icon={FileTextIcon} size={40} className="text-neutral-400" />
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        {certificateDoc ? (
          <>
            <button
              type="button"
              disabled={!certificateDoc.fileUrl}
              onClick={() => certificateDoc.fileUrl && window.open(certificateDoc.fileUrl, '_blank')}
              className="flex items-center justify-center gap-1.5 text-body-sm font-medium text-primary underline disabled:cursor-not-allowed disabled:text-neutral-400 disabled:no-underline"
            >
              <AppIcon icon={ExternalLinkOutlineIcon} size={14} />
              {t('companyProfile.nationalAddress.viewLarger')}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => remove(certificateDoc.id)}
              className="flex items-center justify-center gap-1.5 text-body-sm font-medium text-error-700 underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              <AppIcon icon={TrashIcon} size={14} />
              {t('common.delete')}
            </button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="min-w-[140px] border-neutral-100"
          >
            {busy ? t('common.loading') : t('companyProfile.officialDocs.selectFile')}
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={DOC_ACCEPT}
        onChange={onFileSelected}
      />
    </div>
  )
}

/**
 * "Look up National Address": fetches the address of a short address code (e.g. RRRD2929) from
 * Saudi Post (GET /lookup/national-address) and hands it to the form.
 */
export function NationalAddressLookup({ onFound }: { onFound: (address: NationalAddress) => void }) {
  const { t, i18n } = useTranslation()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const valid = SHORT_ADDRESS_PATTERN.test(code.trim())

  const lookup = async () => {
    if (!valid) {
      setMessage({ tone: 'error', text: t('companyProfile.nationalAddress.lookup.invalid', 'Enter 4 letters followed by 4 digits, e.g. RRRD2929.') })
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      const address = await lookupNationalAddress({ shortCode: code.trim() }, i18n.language === 'ar' ? 'ar' : 'en')
      onFound(address)
      setMessage({ tone: 'success', text: t('companyProfile.nationalAddress.lookup.filled', 'Address found. The fields below were filled; check them before saving.') })
    } catch (err) {
      const reason = err instanceof Error ? err.message : ''
      setMessage({
        tone: 'error',
        text:
          reason === 'NATIONAL_ADDRESS_NOT_FOUND'
            ? t('companyProfile.nationalAddress.lookup.notFound', 'No national address matches this short address.')
            : reason === 'NATIONAL_ADDRESS_UNAVAILABLE'
              ? t('companyProfile.nationalAddress.lookup.unavailable', 'National Address lookup is not available right now. Enter the address by hand.')
              : t('companyProfile.nationalAddress.lookup.failed', 'Saudi Post could not be reached. Try again or enter the address by hand.'),
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg border border-primary-100 bg-bg-brand-light p-4 sm:p-6">
      <label htmlFor="national-address-short-code" className="field-label mb-1 block text-text-primary">
        {t('companyProfile.nationalAddress.shortAddress')}
      </label>
      <p className="mb-3 text-caption text-text-secondary">
        {t('companyProfile.nationalAddress.lookup.hint', 'Enter the short address from your National Address certificate to fill the fields from Saudi Post.')}
      </p>
      <div className="flex flex-col gap-3 xl:flex-row">
        <input
          id="national-address-short-code"
          type="text"
          dir="ltr"
          inputMode="text"
          autoComplete="off"
          maxLength={8}
          value={code}
          placeholder="RRRD2929"
          onChange={(e) => {
            setCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())
            setMessage(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void lookup()
            }
          }}
          aria-invalid={message?.tone === 'error'}
          aria-describedby="national-address-lookup-message"
          className={cn(fieldInputClassName, fieldHeightClassName, 'min-w-0 shrink-0 uppercase tracking-wider xl:w-[240px]')}
        />
        <Button variant="primary" disabled={busy} onClick={() => void lookup()} className="xl:min-w-[220px]" icon={<AppIcon icon={SearchIcon} size={20} />}>
          {busy ? t('common.loading') : t('companyProfile.nationalAddress.lookup.button', 'Look up National Address')}
        </Button>
      </div>
      <p
        id="national-address-lookup-message"
        role={message?.tone === 'error' ? 'alert' : 'status'}
        className={cn('mt-2 min-h-[18px] text-caption', message?.tone === 'error' ? 'text-error-700' : 'text-success-700')}
      >
        {message?.text ?? ''}
      </p>
    </div>
  )
}

export function NationalAddressFormCard() {
  const { t, i18n } = useTranslation()
  const { form, update } = useProfileForm()
  const countryName = form.country ? countryDisplayName(form.country, i18n.language) : ''
  const rules = nationalAddressRules(t, form.nationalAddress.hasNationalAddress)
  const { fieldProps } = useFieldValidation(form.nationalAddress, rules)
  const expiryDateError =
    form.nationalAddress.expiryDate && form.nationalAddress.issueDate
      ? rules.expiryDate?.(form.nationalAddress.expiryDate, form.nationalAddress)
      : undefined

  const setField = <K extends keyof NationalAddressFormValues>(
    key: K,
    value: NationalAddressFormValues[K]
  ) => update('nationalAddress', { ...form.nationalAddress, [key]: value })

  // Fill the address fields from the lookup; keep what the user typed when Saudi Post has no value.
  const applyLookup = (address: NationalAddress) =>
    update('nationalAddress', {
      ...form.nationalAddress,
      street: address.street || form.nationalAddress.street,
      buildingNumber: address.buildingNumber || form.nationalAddress.buildingNumber,
      postalCode: address.postalCode || form.nationalAddress.postalCode,
      additionalNumber: address.additionalNumber || form.nationalAddress.additionalNumber,
      district: address.district || form.nationalAddress.district,
      city: address.city || form.nationalAddress.city,
    })

  return (
    <div className="flex flex-col gap-6 rounded-lg border border-neutral-100 bg-white p-4 sm:p-6 lg:p-8">
      <CardHeader title={t('companyProfile.nationalAddress.formTitle')} />
      <div className="flex gap-6">
        {/* Document preview sidebar — start side */}
        <CertificateUploadPreview />

        {/* Form grid */}
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <NationalAddressLookup onFound={applyLookup} />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <FormField label={t('companyProfile.nationalAddress.issueDate')}>
              <DatePicker
                value={form.nationalAddress.issueDate}
                onChange={(date) => setField('issueDate', date)}
              />
            </FormField>
            <FormField label={t('companyProfile.nationalAddress.expiryDate')}>
              <DatePicker
                value={form.nationalAddress.expiryDate}
                onChange={(date) => setField('expiryDate', date)}
              />
              {expiryDateError && <p className="text-caption text-error-700">{expiryDateError}</p>}
            </FormField>
            <FormField label={t('companyProfile.nationalAddress.addressId')}>
              <TextField
                type="text"
                dir="ltr"
                value={form.nationalAddress.certificateNumber}
                valueKind="mixed"
                onChange={(e) => setField('certificateNumber', e.target.value)}
                {...fieldProps('certificateNumber')}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <FormField label={t('companyProfile.nationalAddress.street')}>
              <TextField
                type="text"
                value={form.nationalAddress.street}
                valueKind="mixed"
                onChange={(e) => setField('street', e.target.value)}
                {...fieldProps('street')}
              />
            </FormField>
            <FormField label={t('companyProfile.nationalAddress.buildingNo')}>
              <TextField
                type="text"
                value={form.nationalAddress.buildingNumber}
                valueKind="mixed"
                onChange={(e) => setField('buildingNumber', e.target.value)}
                {...fieldProps('buildingNumber')}
              />
            </FormField>
            <FormField label={t('companyProfile.nationalAddress.postalCode')}>
              <TextField
                type="text"
                dir="ltr"
                value={form.nationalAddress.postalCode}
                valueKind="mixed"
                onChange={(e) => setField('postalCode', e.target.value)}
                {...fieldProps('postalCode')}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <FormField label={t('companyProfile.nationalAddress.subNumber')}>
              <TextField
                type="text"
                dir="ltr"
                value={form.nationalAddress.additionalNumber}
                valueKind="mixed"
                onChange={(e) => setField('additionalNumber', e.target.value)}
                {...fieldProps('additionalNumber')}
              />
            </FormField>
            <FormField label={t('companyProfile.nationalAddress.neighborhood')}>
              <TextField
                type="text"
                value={form.nationalAddress.district}
                valueKind="mixed"
                onChange={(e) => setField('district', e.target.value)}
                {...fieldProps('district')}
              />
            </FormField>
            <FormField label={t('companyProfile.nationalAddress.city')}>
              <TextField
                type="text"
                value={form.nationalAddress.city}
                valueKind="mixed"
                onChange={(e) => setField('city', e.target.value)}
                {...fieldProps('city')}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField label={t('companyProfile.nationalAddress.country')}>
              <TextField readOnly value={countryName} className={readonlyInputCls} />
            </FormField>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ConnectionNotesCard() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-6 rounded-lg border border-neutral-100 bg-white p-8">
      <CardHeader title={t('companyProfile.nationalAddress.notesTitle')} />
      <div className="rounded-md bg-primary-25 p-4">
        <ul className="list-disc ps-6 text-body font-light leading-[1.8] text-neutral-700">
          <li>{t('companyProfile.nationalAddress.note1')}</li>
          <li>{t('companyProfile.nationalAddress.note2')}</li>
        </ul>
      </div>
    </div>
  )
}
