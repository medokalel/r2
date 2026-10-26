import { register, login, type LoginResponseData, type OrganizationType } from '@/lib/api/authApi'
import type { EntityType } from '@/lib/entityTypes'
import { registerCab } from '@/lib/api/cabApi'
import { ApiError } from '@/lib/api/client'
import { saveAuthSession } from '@/lib/authStorage'
import {
  clearPendingRegistration,
  loadPendingRegistration,
  type PendingRegistration,
} from '@/lib/pendingRegistrationStorage'

function assertCabAdminSession(session: LoginResponseData): void {
  const roleName = session.user?.role?.name ?? session.role?.name
  if (session.cab?.id || roleName === 'CAB_ADMIN') return

  throw new ApiError(
    'This email is already registered with a non-CAB account. Please use a different email to register as a Certification Body.',
    409,
  )
}

function buildRegisterPayload(pending: PendingRegistration, entityType: EntityType) {
  const registrantName = pending.fullName.trim()

  return {
    entityType,
    email: pending.email,
    organizationName: registrantName,
    administrationName: registrantName,
    facilityOwnerManager: registrantName,
    activity: registrantName,
    legalCapacity: registrantName,
    city: pending.countryName,
    phone: pending.phone,
    password: pending.password,
    confirmPassword: pending.confirmPassword,
  }
}

/** Creates a CAB admin via `/cab-auth/register`, then logs in. */
export async function completePendingCabRegistration(): Promise<boolean> {
  const pending = loadPendingRegistration()
  if (!pending) return false

  try {
    await registerCab({
      contactPersonName: pending.fullName.trim(),
      email: pending.email,
      password: pending.password,
      confirmPassword: pending.confirmPassword,
      phone: pending.phone,
    })
  } catch (error) {
    // Account may already exist from a prior attempt before login succeeded.
    if (!(error instanceof ApiError && error.status === 409)) {
      throw error
    }
  }

  const session = await login(pending.email, pending.password)
  assertCabAdminSession(session)
  saveAuthSession(session, true)
  clearPendingRegistration()
  return true
}

/** Creates the account via `/auth/register` with the onboarding org type, then logs in. */
export async function completePendingRegistration(entityType: OrganizationType): Promise<boolean> {
  const pending = loadPendingRegistration()
  if (!pending) return false

  const registerType: EntityType =
    entityType === 'AUDIT_CLIENT' ? 'CONSULTATION_BODY' : entityType
  await register(buildRegisterPayload(pending, registerType))
  const session = await login(pending.email, pending.password)
  saveAuthSession(session, true)
  clearPendingRegistration()
  return true
}
