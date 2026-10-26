import type { CountryCode } from '@/lib/countries'

const STORAGE_KEY = 'icasco_pending_registration'

export interface PendingRegistration {
  email: string
  password: string
  confirmPassword: string
  phone: string
  fullName: string
  country: CountryCode
  countryName: string
}

export function savePendingRegistration(data: PendingRegistration): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Ignore quota errors
  }
}

export function loadPendingRegistration(): PendingRegistration | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PendingRegistration
    if (!parsed?.email || !parsed?.password) return null
    return parsed
  } catch {
    return null
  }
}

export function hasPendingRegistration(): boolean {
  return loadPendingRegistration() !== null
}

export function clearPendingRegistration(): void {
  localStorage.removeItem(STORAGE_KEY)
}
