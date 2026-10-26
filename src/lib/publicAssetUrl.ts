/**
 * Uploaded files are proxied by nginx from the current app origin.
 * Rebase legacy absolute HTTP upload URLs to avoid mixed-content blocking.
 */
export function resolvePublicAssetUrl(url: string | null | undefined): string {
  if (!url || typeof window === 'undefined') return url ?? ''

  try {
    const parsed = new URL(url, window.location.origin)
    if (parsed.pathname.startsWith('/uploads/')) {
      return `${window.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`
    }
    return parsed.toString()
  } catch {
    return url
  }
}
