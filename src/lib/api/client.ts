import { API_BASE_URL } from '@/lib/api/config'
import { delocalizeDisplayDates, localizeDisplayDates } from '@/lib/format/dates'

/** Stable error codes the backend sends for subscription enforcement (PLATFORM_SPEC.md). */
export const SUBSCRIPTION_ERROR_CODES = [
  'FEATURE_NOT_IN_PLAN',
  'SUBSCRIPTION_READ_ONLY',
  'USER_LIMIT_REACHED',
  'CERTIFICATE_LIMIT_REACHED',
  'SUBSCRIPTION_ENDED',
] as const

export type SubscriptionErrorCode = (typeof SUBSCRIPTION_ERROR_CODES)[number]

/** Window event raised for every subscription error, so the CAB shell can offer a link to "My subscription". */
export const SUBSCRIPTION_ERROR_EVENT = 'icasco:subscription-error'

export function isSubscriptionErrorCode(code: unknown): code is SubscriptionErrorCode {
  return typeof code === 'string' && (SUBSCRIPTION_ERROR_CODES as readonly string[]).includes(code)
}

export class ApiError extends Error {
  readonly status: number
  readonly errors?: string[]
  /** Machine-readable code from the response body (`{ code }`), e.g. FEATURE_NOT_IN_PLAN. */
  readonly code?: string
  /** Extra fields of the error body (`feature`, `limit`, `used`, `active` …). */
  readonly details?: Record<string, unknown>

  constructor(message: string, status: number, errors?: string[], code?: string, details?: Record<string, unknown>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
    this.code = code
    this.details = details
    if (typeof window !== 'undefined') {
      // Lets the in-app assistant offer help when a request fails.
      window.dispatchEvent(new CustomEvent('icasco:api-error', { detail: { message, status, errors, code } }))
      if (isSubscriptionErrorCode(code)) {
        window.dispatchEvent(new CustomEvent(SUBSCRIPTION_ERROR_EVENT, { detail: { code, status, ...details } }))
      }
    }
  }
}

interface ApiSuccessResponse<T> {
  success: true
  data: T
}

interface ApiErrorResponse {
  success: false
  message?: string
  errors?: string[]
  code?: string
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

/** The error code may sit at the top level (`{ code }`) or inside `data` / `error`. */
function errorCodeOf(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined
  const record = body as Record<string, unknown>
  for (const candidate of [record.code, (record.data as Record<string, unknown> | undefined)?.code, (record.error as Record<string, unknown> | undefined)?.code]) {
    if (typeof candidate === 'string' && candidate) return candidate
  }
  // Older handlers only put the code in the message ("FEATURE_NOT_IN_PLAN: …").
  const message = typeof record.message === 'string' ? record.message : ''
  return SUBSCRIPTION_ERROR_CODES.find((code) => message.includes(code))
}

/** Everything in an error body besides the envelope (`{ success, message, errors, code, stack }`). */
function errorDetailsOf(body: unknown): Record<string, unknown> | undefined {
  if (!body || typeof body !== 'object') return undefined
  const rest = Object.fromEntries(
    Object.entries(body as Record<string, unknown>).filter(([key]) => !['success', 'message', 'errors', 'code', 'stack', 'data'].includes(key)),
  )
  return Object.keys(rest).length ? rest : undefined
}

async function parseResponse<T>(response: Response): Promise<T> {
  let body: ApiResponse<T> | null = null

  try {
    body = (await response.json()) as ApiResponse<T>
  } catch {
    // Non-JSON response
  }

  if (!response.ok) {
    const message =
      body && 'message' in body && body.message
        ? body.message
        : response.statusText || 'Request failed'
    const errors = body && 'errors' in body ? body.errors : undefined
    throw new ApiError(message, response.status, errors, errorCodeOf(body), errorDetailsOf(body))
  }

  if (body && 'success' in body && body.success === false) {
    throw new ApiError(body.message ?? 'Request failed', response.status, body.errors, errorCodeOf(body), errorDetailsOf(body))
  }

  if (body && 'data' in body) {
    return body.data
  }

  return body as T
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers)

  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Ready-to-show dates are shown in the UI language and sent back in the API's own form.
  const body = typeof init.body === 'string' ? delocalizeDisplayDates(init.body) : init.body
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    body,
    headers,
  })

  return localizeDisplayDates(await parseResponse<T>(response))
}

export async function apiRequestWithAuth<T>(
  path: string,
  token: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  return apiRequest<T>(path, { ...init, headers })
}
