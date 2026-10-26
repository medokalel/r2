import { createContext, useContext } from 'react'
import type { OrgBranch, OrgDocument } from '@/lib/api/organizationProfileApi'
import type { ProfileFormValues, ProfileNotification } from './types'

export interface ProfileFormContextValue {
  form: ProfileFormValues
  update: <K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) => void
  profileStatus: string
  branches: OrgBranch[]
  refreshBranches: () => Promise<void>
  documents: OrgDocument[]
  refreshDocuments: () => Promise<void>
  editingBranch: OrgBranch | null
  setEditingBranch: (branch: OrgBranch | null) => void
  refreshProfile: () => Promise<void>
  saveDraft: () => Promise<boolean>
  saving: boolean
  notify: (notification: ProfileNotification) => void
  handleApiError: (error: unknown) => void
}

export const ProfileFormContext = createContext<ProfileFormContextValue | null>(null)

export function useProfileForm(): ProfileFormContextValue {
  const ctx = useContext(ProfileFormContext)
  if (!ctx) throw new Error('useProfileForm must be used within ProfileFormContext')
  return ctx
}
