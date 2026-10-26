import { apiRequest } from '@/lib/api/client'
import { getAuthToken } from '@/lib/authStorage'

export function authorizedRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers)
  const token = getAuthToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return apiRequest<T>(path, { ...init, headers })
}
