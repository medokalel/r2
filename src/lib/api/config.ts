/** Same-origin API path — works on https://app.icasco.co and :8086 via nginx proxy. */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
