/**
 * User-management data layer — wired to the real backend.
 *
 * Endpoints (see /organizations/users tag):
 *   GET    /organizations/users            → listUsers
 *   POST   /organizations/users            → createUser
 *   PUT    /organizations/users/{id}       → updateUser
 *   DELETE /organizations/users/{id}       → deleteUser
 *   PATCH  /organizations/users/{id}/status → setUserStatus
 *
 * organizationId is resolved server-side from the JWT, so it's never sent
 * from here. Only organization OWNERs can create/update/delete/toggle
 * status — the backend returns 403 otherwise.
 */

import { authorizedRequest } from '@/lib/api/authorizedClient'

export type AppUserStatus = 'ACTIVE' | 'INVITED' | 'INACTIVE'

export interface AppUser {
  id: string
  fullName: string | null
  /** Free-text business role — not linked to the system authorization model. */
  role: string | null
  phoneCountryCode: string | null
  phoneNumber: string | null
  email: string
  status: AppUserStatus
  createdAt: string
}

export interface UsersStats {
  inactive: number
  active: number
  total: number
}

function statsFromUsers(users: AppUser[]): UsersStats {
  const active = users.filter((user) => user.status === 'ACTIVE').length
  const inactive = users.filter((user) => user.status === 'INACTIVE').length
  return { inactive, active, total: users.length }
}

export function listUsers(): Promise<AppUser[]> {
  return authorizedRequest('/organizations/users')
}

export async function getUsersStats(): Promise<UsersStats> {
  const users = await listUsers()
  return statsFromUsers(users)
}

export function setUserStatus(id: string, status: AppUserStatus): Promise<AppUser> {
  return authorizedRequest(`/organizations/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function deleteUser(id: string): Promise<void> {
  return authorizedRequest(`/organizations/users/${id}`, { method: 'DELETE' })
}

export interface CreateUserInput {
  fullName: string
  role: string
  phoneCountryCode: string
  phoneNumber: string
  email: string
  password: string
}

export function createUser(input: CreateUserInput): Promise<AppUser> {
  return authorizedRequest('/organizations/users', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export interface UpdateUserInput {
  fullName?: string
  role?: string
  phoneCountryCode?: string
  phoneNumber?: string
}

// Not wired into the Users page UI yet (no edit form built) — ready for
// when that's built.
export function updateUser(id: string, input: UpdateUserInput): Promise<AppUser> {
  return authorizedRequest(`/organizations/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}