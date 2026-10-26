import { authorizedRequest } from '@/lib/api/authorizedClient'

export interface UserProfile {
  id: string
  email: string
  phone: string | null
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED'
}

export function getUserProfile(): Promise<UserProfile> {
  return authorizedRequest('/users/profile')
}
