import { createContext, useContext } from 'react'
import type { ApplicationStatus } from '@/lib/api/certificationApplicationApi'
import type { OrgBranch } from '@/lib/api/organizationProfileApi'
import type {
  ApplicationFormValues,
  ApplicationNotification,
  BranchFormValues,
} from '@/components/dashboard/entityData/applicationTypes'

export interface ApplicationFormContextValue {
  form: ApplicationFormValues
  update: <K extends keyof ApplicationFormValues>(
    key: K,
    value: ApplicationFormValues[K]
  ) => void
  updateBranch: (localId: number, patch: Partial<BranchFormValues>) => void
  addBranch: () => number
  removeBranch: (localId: number) => void
  /** Creates a real organization-profile branch for a brand-new branch row. */
  saveOrgBranch: (localId: number, branchName: string, address: string) => void
  setSpecAnswer: (questionKey: string, value: string) => void
  uploadDocument: (slotId: string, file: File) => Promise<void>
  removeDocument: (localId: string) => Promise<void>
  uploadCommercialRegister: (file: File) => Promise<void>
  /** Registered organization-profile branches the application branches copy from. */
  orgBranches: OrgBranch[]
  applicationId: string | null
  status: ApplicationStatus
  saving: boolean
  uploading: boolean
  notify: (notification: ApplicationNotification) => void
  handleApiError: (error: unknown) => void
  readOnly: boolean
}

export const ApplicationFormContext = createContext<ApplicationFormContextValue | null>(
  null
)

export function useApplicationForm(): ApplicationFormContextValue {
  const ctx = useContext(ApplicationFormContext)
  if (!ctx) {
    throw new Error('useApplicationForm must be used within ApplicationFormContext')
  }
  return ctx
}
