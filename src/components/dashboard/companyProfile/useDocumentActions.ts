import { useTranslation } from 'react-i18next'
import {
  uploadOrganizationDocument,
  deleteOrganizationDocument,
  type OrgDocumentType,
} from '@/lib/api/organizationProfileApi'
import { DOC_MAX_BYTES } from './constants'
import { useProfileForm } from './ProfileFormContext'

export function useDocumentActions(onBusyChange?: (busy: boolean) => void) {
  const { t } = useTranslation()
  const { refreshDocuments, notify, handleApiError } = useProfileForm()

  const upload = async (documentType: OrgDocumentType, file: File) => {
    if (file.size > DOC_MAX_BYTES) {
      notify({ type: 'error', message: t('validation.fileTooLarge', { size: 10 }) })
      return
    }
    onBusyChange?.(true)
    try {
      await uploadOrganizationDocument(documentType, file)
      await refreshDocuments()
      notify({ type: 'success', message: t('companyProfile.messages.documentUploaded') })
    } catch (error) {
      handleApiError(error)
    } finally {
      onBusyChange?.(false)
    }
  }

  const remove = async (id: string) => {
    onBusyChange?.(true)
    try {
      await deleteOrganizationDocument(id)
      await refreshDocuments()
      notify({ type: 'success', message: t('companyProfile.messages.documentDeleted') })
    } catch (error) {
      handleApiError(error)
    } finally {
      onBusyChange?.(false)
    }
  }

  return { upload, remove }
}
