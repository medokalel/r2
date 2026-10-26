import { apiRequestWithAuth } from '@/lib/api/client'
import { getAuthToken } from '@/lib/authStorage'

export interface UploadedOnboardingAsset {
  filePath: string
  fileUrl: string
  fileName: string
  storedFileName: string
  mimeType: string
  sizeBytes: number
}

export function uploadOnboardingAsset(file: File): Promise<UploadedOnboardingAsset> {
  const token = getAuthToken()
  if (!token) throw new Error('Authentication required')

  const formData = new FormData()
  formData.append('file', file)

  return apiRequestWithAuth('/uploads/onboarding-asset', token, {
    method: 'POST',
    body: formData,
  })
}
