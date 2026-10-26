import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormLabel, TextField } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { AppIcon, UploadOutlineIcon } from '@/components/icons'
import {
  SetupNote,
  SetupSection,
  SetupToggleRow,
} from '@/components/auth/cab/setup/CabSetupPrimitives'
import {
  CERTIFICATE_LANGUAGE_OPTIONS,
  CERTIFICATE_NUMBER_TOKENS,
  CERTIFICATE_TEMPLATE_OPTIONS,
  CERTIFICATE_VALIDITY_OPTIONS,
  getSchemeOptions,
} from '@/lib/api/cabSetupApi'
import {
  buildCertificateNumberExample,
  createCertificateBasicRecord,
  getSelectedSchemeEntries,
  isCertificateBasicComplete,
  isCertificateBasicStarted,
  type CabCertificateBasic,
} from '@/lib/cabSetupForm'
import { uploadOnboardingAsset } from '@/lib/api/uploadsApi'
import { resolvePublicAssetUrl } from '@/lib/publicAssetUrl'
import { cn } from '@/lib/utils'
import type { CabSetupStepProps } from '@/components/auth/cab/setup/types'
import { matchCatalogScheme } from '@/lib/standardsCatalog'

const SIGNATORY_IMAGE_MAX_BYTES = 2 * 1024 * 1024
const SIGNATORY_IMAGE_ACCEPT = 'image/png,image/jpeg,.png,.jpg,.jpeg'

function SignatoryImageUpload({
  id,
  label,
  hint,
  imageUrl,
  uploadLabel,
  changeLabel,
  removeLabel,
  onImageUrlChange,
  onError,
}: {
  id: string
  label: string
  hint: string
  imageUrl: string | null
  uploadLabel: string
  changeLabel: string
  removeLabel: string
  onImageUrlChange: (url: string | null) => void
  onError: (message: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (file.size > SIGNATORY_IMAGE_MAX_BYTES) {
      onError('fileTooLarge')
      return
    }

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      onError('fileType')
      return
    }

    onError(null)
    setUploading(true)
    try {
      const uploaded = await uploadOnboardingAsset(file)
      onImageUrlChange(uploaded.fileUrl)
    } catch {
      onError('uploadFailed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <FormLabel required>{label}</FormLabel>
      <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-primary-300 bg-primary-25 p-4 text-center">
        {imageUrl ? (
          <img src={resolvePublicAssetUrl(imageUrl)} alt={label} className="h-16 max-w-[160px] object-contain" />
        ) : (
          <AppIcon icon={UploadOutlineIcon} size={28} className="text-primary" />
        )}
        <p className="text-caption text-[var(--cab-muted)]">{hint}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-body-3-medium text-primary hover:bg-neutral-50 disabled:opacity-50"
          >
            {uploading ? '…' : imageUrl ? changeLabel : uploadLabel}
          </button>
          {imageUrl && (
            <button
              type="button"
              onClick={() => onImageUrlChange(null)}
              className="rounded-md px-3 py-1.5 text-body-3-medium text-error-500 hover:bg-error-50"
            >
              {removeLabel}
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={SIGNATORY_IMAGE_ACCEPT}
          className="sr-only"
          onChange={(event) => void handleSelect(event)}
        />
      </div>
    </div>
  )
}

function resolveCertificateRecord(
  records: CabCertificateBasic[],
  scheme: { id: string; label: string }
): CabCertificateBasic {
  const saved = records.find((record) => record.schemeId === scheme.id)
  if (saved) return saved
  return {
    ...createCertificateBasicRecord(),
    schemeId: scheme.id,
    schemeName: scheme.label,
  }
}

export function CabCertificateStep({ form, onPatchSetup }: CabSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.cabSetup
  const records = setup.certificateBasics
  const [activeSchemeId, setActiveSchemeId] = useState('')
  const [uploadErrors, setUploadErrors] = useState<Record<string, string | null>>({})

  const schemeOptions = useMemo(
    () => getSchemeOptions(setup.activities),
    [setup.activities]
  )
  const selectedSchemes = useMemo(
    () => getSelectedSchemeEntries(setup, schemeOptions),
    [setup, schemeOptions]
  )

  const currentSchemeId = activeSchemeId || selectedSchemes[0]?.id || ''
  const currentScheme = selectedSchemes.find((scheme) => scheme.id === currentSchemeId)
  const activeRecord = currentScheme ? resolveCertificateRecord(records, currentScheme) : null

  const validityOptions = useMemo(
    () => CERTIFICATE_VALIDITY_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const languageOptions = useMemo(
    () => CERTIFICATE_LANGUAGE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const templateOptions = useMemo(
    () => CERTIFICATE_TEMPLATE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  const cabName = form.tradingName || form.legalEntityName

  const updateSchemeRecord = (schemeId: string, schemeName: string, fields: Partial<CabCertificateBasic>) => {
    const existingIndex = records.findIndex((record) => record.schemeId === schemeId)
    if (existingIndex >= 0) {
      onPatchSetup({
        certificateBasics: records.map((record) =>
          record.schemeId === schemeId ? { ...record, ...fields } : record
        ),
      })
      return
    }

    onPatchSetup({
      certificateBasics: [
        ...records,
        {
          ...createCertificateBasicRecord(),
          schemeId,
          schemeName,
          ...fields,
        },
      ],
    })
  }

  const setUploadError = (schemeId: string, errorKey: string | null) => {
    setUploadErrors((current) => ({ ...current, [schemeId]: errorKey }))
  }

  if (!activeRecord || !currentScheme) {
    return (
      <div className="w-full space-y-6">
        <p className="text-caption text-[var(--cab-muted)]">
          {t('cab.setup.certificate.signatoriesEmpty')}
        </p>
        <SetupNote>{t('cab.setup.certificate.optionalNote')}</SetupNote>
      </div>
    )
  }

  const schemeToken =
    (matchCatalogScheme(activeRecord.schemeName)?.abbreviation ??
      activeRecord.schemeName.replace(/_/g, ' ')) || 'QMS'
  const exampleNumber = buildCertificateNumberExample(
    activeRecord.certificateNumberFormat,
    cabName,
    schemeToken
  )
  const missingSeq = !activeRecord.certificateNumberFormat.includes('{SEQ}')

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap gap-2">
        {selectedSchemes.map((scheme) => {
          const saved = records.find((record) => record.schemeId === scheme.id)
          const incomplete =
            saved && isCertificateBasicStarted(saved) && !isCertificateBasicComplete(saved)
          return (
            <button
              key={scheme.id}
              type="button"
              aria-pressed={scheme.id === currentSchemeId}
              onClick={() => setActiveSchemeId(scheme.id)}
              className={cn(
                'rounded-full border px-5 py-2 text-caption font-bold transition-colors',
                scheme.id === currentSchemeId
                  ? 'border-[var(--cab-primary)] bg-[var(--cab-subtle)] text-[var(--cab-primary)]'
                  : 'border-[var(--cab-border)] bg-white text-[var(--cab-muted)] hover:border-primary-100',
                incomplete && scheme.id !== currentSchemeId && 'border-warning-400 text-warning-700'
              )}
            >
              {scheme.label}
              {incomplete ? ' •' : ''}
            </button>
          )
        })}
      </div>

      <SetupSection title={currentScheme.label}>
        <div className="space-y-4">
          <div className="space-y-2">
            <TextField
              id={`cab-setup-cert-format-${activeRecord.schemeId}`}
              label={t('cab.setup.certificate.numberFormat')}
              required
              type="text"
              lang="en"
              dir="ltr"
              value={activeRecord.certificateNumberFormat}
              placeholder="{CAB}-{SCHEME}-{YEAR}-{SEQ}"
              valueKind="mixed"
              onChange={(event) =>
                updateSchemeRecord(activeRecord.schemeId, activeRecord.schemeName, {
                  certificateNumberFormat: event.target.value,
                })
              }
              error={missingSeq ? t('cab.setup.certificate.seqRequired') : undefined}
            />

            <p className="text-caption text-[var(--cab-muted)]" lang="en" dir="ltr">
              {t('cab.setup.certificate.example')}:{' '}
              <span className="text-neutral-900">{exampleNumber}</span>
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {CERTIFICATE_NUMBER_TOKENS.map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() =>
                    updateSchemeRecord(activeRecord.schemeId, activeRecord.schemeName, {
                      certificateNumberFormat: `${activeRecord.certificateNumberFormat}${token}`,
                    })
                  }
                  className="rounded-full border border-neutral-300 bg-white px-3 py-1 font-mono text-caption text-primary hover:border-primary hover:bg-primary-subtle"
                  lang="en"
                  dir="ltr"
                >
                  {token}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <SearchableSelect
              id={`cab-setup-cert-validity-${activeRecord.schemeId}`}
              label={t('cab.setup.certificate.validity')}
              required
              value={activeRecord.certificateValidity}
              onChange={(certificateValidity) =>
                updateSchemeRecord(activeRecord.schemeId, activeRecord.schemeName, { certificateValidity })
              }
              options={validityOptions}
              placeholder={t('cab.setup.certificate.validityPlaceholder')}
              searchPlaceholder={t('common.search')}
            />
            <SearchableSelect
              id={`cab-setup-cert-language-${activeRecord.schemeId}`}
              label={t('cab.setup.certificate.language')}
              required
              value={activeRecord.certificateLanguage}
              onChange={(certificateLanguage) =>
                updateSchemeRecord(activeRecord.schemeId, activeRecord.schemeName, { certificateLanguage })
              }
              options={languageOptions}
              placeholder={t('cab.setup.certificate.languagePlaceholder')}
              searchPlaceholder={t('common.search')}
            />
          </div>

          <SearchableSelect
            id={`cab-setup-cert-template-${activeRecord.schemeId}`}
            label={t('cab.setup.certificate.template')}
            required
            value={activeRecord.certificateTemplate}
            onChange={(certificateTemplate) =>
              updateSchemeRecord(activeRecord.schemeId, activeRecord.schemeName, { certificateTemplate })
            }
            options={templateOptions}
            placeholder={t('cab.setup.certificate.templatePlaceholder')}
            searchPlaceholder={t('common.search')}
          />

          <div className="grid grid-cols-1 gap-8 border-t border-neutral-300 pt-4 sm:grid-cols-2">
            <TextField
              id={`cab-setup-cert-signatory-name-${activeRecord.schemeId}`}
              label={t('cab.setup.certificate.signatoryName')}
              required
              type="text"
              value={activeRecord.signatoryName}
              placeholder={t('cab.setup.certificate.signatoryNamePlaceholder')}
              valueKind="text"
              onChange={(event) =>
                updateSchemeRecord(activeRecord.schemeId, activeRecord.schemeName, {
                  signatoryName: event.target.value,
                })
              }
            />
            <TextField
              id={`cab-setup-cert-signatory-title-${activeRecord.schemeId}`}
              label={t('cab.setup.certificate.signatoryTitle')}
              required
              type="text"
              value={activeRecord.signatoryTitle}
              placeholder={t('cab.setup.certificate.signatoryTitlePlaceholder')}
              valueKind="text"
              onChange={(event) =>
                updateSchemeRecord(activeRecord.schemeId, activeRecord.schemeName, {
                  signatoryTitle: event.target.value,
                })
              }
            />
          </div>

          <SignatoryImageUpload
            id={`cab-setup-cert-signatory-image-${activeRecord.schemeId}`}
            label={t('cab.setup.certificate.signatoryImage')}
            hint={t('cab.setup.certificate.signatoryImageHint')}
            imageUrl={activeRecord.signatoryImageUrl}
            uploadLabel={t('cab.setup.marks.upload')}
            changeLabel={t('companyProfile.profileHeader.changeFile')}
            removeLabel={t('common.delete')}
            onImageUrlChange={(signatoryImageUrl) =>
              updateSchemeRecord(activeRecord.schemeId, activeRecord.schemeName, { signatoryImageUrl })
            }
            onError={(errorKey) => setUploadError(activeRecord.schemeId, errorKey)}
          />

          {uploadErrors[activeRecord.schemeId] === 'fileTooLarge' && (
            <p className="text-caption text-error-700">
              {t('cab.setup.certificate.signatoryImageTooLarge')}
            </p>
          )}
          {uploadErrors[activeRecord.schemeId] === 'fileType' && (
            <p className="text-caption text-error-700">
              {t('cab.setup.certificate.signatoryImageType')}
            </p>
          )}
          {uploadErrors[activeRecord.schemeId] === 'uploadFailed' && (
            <p className="text-caption text-error-700">{t('errors.generic')}</p>
          )}
        </div>
      </SetupSection>

      <SetupSection title={t('cab.setup.certificate.displayRules')}>
        <SetupToggleRow
          label={t('cab.setup.certificate.showCabLogo')}
          checked={setup.showCabLogo}
          onChange={(showCabLogo) => onPatchSetup({ showCabLogo })}
        />
        <SetupToggleRow
          label={t('cab.setup.certificate.showAccreditationMark')}
          checked={setup.showAccreditationMark}
          onChange={(showAccreditationMark) => onPatchSetup({ showAccreditationMark })}
        />
        <SetupToggleRow
          label={t('cab.setup.certificate.showQrCode')}
          checked={setup.showQrCode}
          onChange={(showQrCode) => onPatchSetup({ showQrCode })}
        />
      </SetupSection>

      <SetupNote>{t('cab.setup.certificate.optionalNote')}</SetupNote>
    </div>
  )
}
