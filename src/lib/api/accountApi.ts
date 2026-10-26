import { getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'
import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { getAuthSession } from '@/lib/authStorage'

/**
 * The signed-in person's own account (any account type: CAB staff, client, AB).
 * Real endpoints: GET/PATCH /users/me, POST /users/me/avatar (multipart, field "avatar",
 * JPEG/PNG/WebP ≤ 2 MB → the updated profile), POST /auth/change-password
 * { currentPassword, newPassword }.
 *
 * The API speaks the backend phone convention — phoneCountryCode is a dial code ("+966") —
 * and this module converts it to/from the ISO country the phone picker uses ("SA").
 * In the preview (demo mode) the photo is kept as a data URL in the mock account store.
 */
export interface AccountProfile {
  fullName: string
  jobTitle: string
  email: string
  phoneCountryCode: string // ISO country, e.g. "SA"
  phone: string // national number, digits only
  avatarUrl: string | null
  language: 'ar' | 'en'
}

/** What GET/PATCH /users/me and POST /users/me/avatar return. */
interface AccountProfileResponse extends Omit<AccountProfile, 'phoneCountryCode'> {
  phoneCountryCode: string // dial code, e.g. "+966" ('' when unknown)
}

export const ACCOUNT_UPDATED_EVENT = 'icasco:account-updated'
const cacheKey = (id: string) => `icasco_account_${id}`
const DEFAULT_COUNTRY = 'SA'

function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? ''
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(' ')
}

/** ISO country + national digits from a dial code and a (possibly international) number. */
function phoneFromApi(dialCode: string, phone: string, fallbackCountry: string): Pick<AccountProfile, 'phoneCountryCode' | 'phone'> {
  const digits = phone.replace(/\D/g, '')
  const international = phone.trim().startsWith('+') ? phone : dialCode ? `${dialCode}${digits}` : ''
  const parsed = international ? parsePhoneNumberFromString(international) : undefined
  if (parsed?.country) {
    const national = phone.trim().startsWith('+') ? String(parsed.nationalNumber) : digits
    return { phoneCountryCode: parsed.country, phone: national }
  }
  return { phoneCountryCode: fallbackCountry, phone: digits }
}

function dialCodeOf(country: string): string {
  try {
    return `+${getCountryCallingCode(country as CountryCode)}`
  } catch {
    return ''
  }
}

function fromApi(remote: Partial<AccountProfileResponse>, base: AccountProfile): Partial<AccountProfile> {
  const { phoneCountryCode, phone, ...rest } = remote
  if (phone === undefined && phoneCountryCode === undefined) return rest
  return { ...rest, ...phoneFromApi(phoneCountryCode ?? '', phone ?? '', base.phoneCountryCode) }
}

function toApi(patch: Partial<Omit<AccountProfile, 'email'>>): Record<string, unknown> {
  const { phoneCountryCode, phone, ...rest } = patch
  const body: Record<string, unknown> = { ...rest }
  if (phoneCountryCode !== undefined) body.phoneCountryCode = dialCodeOf(phoneCountryCode)
  if (phone !== undefined) body.phone = phone.replace(/\D/g, '')
  return body
}

/** What we know without a request: session + last saved copy. Used to paint the header instantly. */
export function getCachedAccount(): AccountProfile {
  const session = getAuthSession()
  const email = session?.user?.email ?? ''
  const base: AccountProfile = {
    fullName: nameFromEmail(email),
    jobTitle: '',
    email,
    ...phoneFromApi('', session?.user?.phone ?? '', DEFAULT_COUNTRY),
    avatarUrl: null,
    language: (localStorage.getItem('icasco-lang') as 'ar' | 'en') || 'en',
  }
  try {
    const raw = session?.user?.id ? localStorage.getItem(cacheKey(session.user.id)) : null
    return raw ? { ...base, ...(JSON.parse(raw) as Partial<AccountProfile>), email } : base
  } catch {
    return base
  }
}

function remember(profile: AccountProfile) {
  const id = getAuthSession()?.user?.id
  if (id) {
    try {
      localStorage.setItem(cacheKey(id), JSON.stringify(profile))
    } catch {
      // cache only
    }
  }
  window.dispatchEvent(new CustomEvent(ACCOUNT_UPDATED_EVENT, { detail: profile }))
}

export async function getAccount(): Promise<AccountProfile> {
  try {
    const cached = getCachedAccount()
    const remote = await authorizedRequest<Partial<AccountProfileResponse>>('/users/me')
    // Demo mock stores the page's own shape (ISO country), so only the real API is converted.
    const merged = { ...cached, ...(isDemoMode() ? (remote as Partial<AccountProfile>) : fromApi(remote, cached)) }
    remember(merged)
    return merged
  } catch {
    return getCachedAccount()
  }
}

export async function updateAccount(patch: Partial<Omit<AccountProfile, 'email'>>): Promise<AccountProfile> {
  const cached = getCachedAccount()
  if (isDemoMode()) {
    const saved = await authorizedRequest<Partial<AccountProfile>>('/users/me', { method: 'PATCH', body: JSON.stringify(patch) })
    const next = { ...cached, ...patch, ...saved }
    remember(next)
    return next
  }
  const saved = await authorizedRequest<AccountProfileResponse>('/users/me', { method: 'PATCH', body: JSON.stringify(toApi(patch)) })
  const next = { ...cached, ...patch, ...fromApi(saved, cached) }
  remember(next)
  return next
}

/** Uploads a new profile photo (JPEG/PNG/WebP ≤ 2 MB) and returns the updated profile. */
export async function uploadAvatar(file: File): Promise<AccountProfile> {
  if (isDemoMode()) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error ?? new Error('Could not read the image.'))
      reader.readAsDataURL(file)
    })
    return updateAccount({ avatarUrl: dataUrl })
  }
  const form = new FormData()
  form.append('avatar', file)
  const saved = await authorizedRequest<AccountProfileResponse>('/users/me/avatar', { method: 'POST', body: form })
  const cached = getCachedAccount()
  const next = { ...cached, ...fromApi(saved, cached) }
  remember(next)
  return next
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await authorizedRequest<unknown>('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) })
}
