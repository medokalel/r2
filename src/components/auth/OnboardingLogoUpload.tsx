import { useEffect, useEffectEvent, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AssetUploadTile } from '@/components/ui/AssetUploadTile'
import { isAcceptedImage } from '@/lib/fileValidation'
import {
  deleteOrganizationLogo,
  getOrganizationProfile,
  uploadOrganizationLogo,
} from '@/lib/api/organizationProfileApi'
import { deleteCabLogo, getCabProfile, uploadCabLogo } from '@/lib/api/cabApi'
import { LOGO_ACCEPT, LOGO_MAX_BYTES } from '@/components/dashboard/companyProfile/constants'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { toast } from '@/lib/toast'
import { resolvePublicAssetUrl } from '@/lib/publicAssetUrl'

interface OnboardingLogoUploadProps {
  logoUrl: string | null
  onLogoUrlChange: (logoUrl: string | null) => void
  /** Organization onboarding uses /organizations/profile/logo; CAB uses /uploads/onboarding-asset then PATCH /cab-setup/draft. */
  target?: 'organization' | 'cab'
  /** Tile heading; defaults to "Upload logo". */
  title?: string
  /** One line under the heading. */
  caption?: ReactNode
  /** Id of the file input, for links that jump to this field. */
  inputId?: string
}

export function OnboardingLogoUpload({
  logoUrl,
  onLogoUrlChange,
  target = 'organization',
  title,
  caption,
  inputId,
}: OnboardingLogoUploadProps) {
  const { t } = useTranslation()
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reads the latest logo/callback when the stored logo arrives; only `target` restarts the load.
  const applyExistingLogo = useEffectEvent((existingLogoUrl: string | null) => {
    if (existingLogoUrl && !logoUrl) onLogoUrlChange(existingLogoUrl)
  })

  useEffect(() => {
    let cancelled = false

    const loadExistingLogo =
      target === 'cab'
        ? getCabProfile().then((data) => data.cab.logoUrl ?? null)
        : getOrganizationProfile().then((data) => data.profile?.logoUrl ?? null)

    loadExistingLogo
      .then((existingLogoUrl) => {
        if (!cancelled) applyExistingLogo(existingLogoUrl)
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [target])

  const onLogoSelected = async (file: File) => {
    if (!isAcceptedImage(file)) {
      setError(t('ui.upload.invalidType'))
      return
    }
    if (file.size > LOGO_MAX_BYTES) {
      setError(t('validation.fileTooLarge', { size: 5 }))
      return
    }

    setError(null)
    setUploadingLogo(true)

    try {
      const result =
        target === 'cab' ? await uploadCabLogo(file) : await uploadOrganizationLogo(file)
      onLogoUrlChange(result.logoUrl ?? null)
    } catch (uploadError) {
      toast.error(getUserErrorMessage(uploadError, t))
    } finally {
      setUploadingLogo(false)
    }
  }

  const onDeleteLogo = async () => {
    try {
      if (target === 'cab') {
        await deleteCabLogo()
      } else {
        await deleteOrganizationLogo()
      }
      onLogoUrlChange(null)
    } catch (deleteError) {
      toast.error(getUserErrorMessage(deleteError, t))
    }
  }

  return (
    <AssetUploadTile
      title={title ?? t('companyProfile.profileHeader.uploadTitle')}
      caption={caption}
      imageUrl={logoUrl ? resolvePublicAssetUrl(logoUrl) : null}
      onFile={(file) => void onLogoSelected(file)}
      onRemove={() => void onDeleteLogo()}
      uploading={uploadingLogo}
      error={error}
      accept={LOGO_ACCEPT}
      formats={t('ui.upload.imageFormats')}
      maxSizeMb={LOGO_MAX_BYTES / (1024 * 1024)}
      inputId={inputId}
      layout="wide"
    />
  )
}
