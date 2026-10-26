import { useEffect, useState } from 'react'
import { getAuthToken } from '@/lib/authStorage'
import { useValuesChanged } from '@/hooks/useValuesChanged'

interface BlobUrlState {
  blobUrl: string | null
  loading: boolean
  error: boolean
}

/**
 * Downloads a remote file and exposes it as a local blob: URL.
 *
 * Needed for inline previews (iframe/embed) of files served by the API host,
 * which sends `X-Frame-Options: sameorigin` and therefore refuses to be framed
 * directly. That header only blocks framing — a regular fetch still works, and
 * a blob: URL belongs to the app's own origin so the iframe renders it fine.
 */
export function useBlobUrl(url?: string | null): BlobUrlState {
  const [state, setState] = useState<BlobUrlState>({
    blobUrl: null,
    loading: Boolean(url),
    error: false,
  })

  // Reset in the render where the URL changes; the effect below only sets
  // state once the download settles.
  const urlChanged = useValuesChanged([url])
  if (urlChanged) {
    setState({ blobUrl: null, loading: Boolean(url), error: false })
  }

  useEffect(() => {
    if (!url) return

    let cancelled = false
    let objectUrl: string | null = null

    ;(async () => {
      try {
        // Plain request first (no preflight); retry with the token if refused
        let response = await fetch(url)
        if ((response.status === 401 || response.status === 403) && getAuthToken()) {
          response = await fetch(url, {
            headers: { Authorization: `Bearer ${getAuthToken()}` },
          })
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const blob = await response.blob()
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setState({ blobUrl: objectUrl, loading: false, error: false })
      } catch {
        if (!cancelled) setState({ blobUrl: null, loading: false, error: true })
      }
    })()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url])

  return state
}
