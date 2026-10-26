import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, TickCircle } from 'iconsax-reactjs'
import { AppIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import type { SsoProvider } from '@/lib/sso'

/** Small building blocks of the single sign-on screens. */

/** Read-only value with a copy button (values a CAB admin pastes into the identity provider). */
export function CopyField({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Clipboard blocked (insecure context): select the text so the user can copy it by hand.
      const range = document.createRange()
      const node = document.getElementById(`copy-${label}`)
      if (node) {
        range.selectNodeContents(node)
        window.getSelection()?.removeAllRanges()
        window.getSelection()?.addRange(range)
      }
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }
  return (
    <div className="min-w-0">
      <p className="text-caption font-semibold text-neutral-700">{label}</p>
      <div className="mt-1 flex min-w-0 items-stretch overflow-hidden rounded-md border border-neutral-200 bg-neutral-25">
        <code
          id={`copy-${label}`}
          dir="ltr"
          className={cn('min-w-0 flex-1 break-all px-3 py-2 text-start text-body-sm text-neutral-900', mono && 'font-mono text-[13px]')}
        >
          {value}
        </code>
        <button
          type="button"
          onClick={() => void copy()}
          className="flex shrink-0 items-center gap-1.5 border-s border-neutral-200 bg-white px-3 text-caption font-semibold text-primary hover:bg-primary-25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
          aria-label={`${t('sso.common.copy')}: ${label}`}
        >
          <AppIcon icon={copied ? TickCircle : Copy} size={16} />
          <span className="hidden sm:inline">{copied ? t('sso.common.copied') : t('sso.common.copy')}</span>
        </button>
      </div>
    </div>
  )
}

const PROVIDER_TONE: Record<SsoProvider, { bg: string; fg: string; mark: string }> = {
  entra: { bg: '#E8F1FB', fg: '#0F5CAB', mark: 'ME' },
  google: { bg: '#E9F5EC', fg: '#1E7B3A', mark: 'GW' },
  okta: { bg: '#E8ECF8', fg: '#1D2F7A', mark: 'OK' },
  generic_oidc: { bg: '#EEF0F3', fg: '#3F4652', mark: 'OI' },
  generic_saml: { bg: '#FBF1E6', fg: '#8A4B0F', mark: 'SA' },
}

/** Brand-neutral provider mark (initials on a tinted tile). */
export function ProviderMark({ provider, size = 40 }: { provider: SsoProvider; size?: number }) {
  const tone = PROVIDER_TONE[provider] ?? PROVIDER_TONE.generic_oidc
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-md text-[13px] font-bold tracking-wide"
      style={{ width: size, height: size, backgroundColor: tone.bg, color: tone.fg }}
    >
      {tone.mark}
    </span>
  )
}

const chip = 'inline-flex items-center gap-1 whitespace-nowrap rounded-sm px-2 py-0.5 text-caption font-medium'

export function StatusChip({ tone, children }: { tone: 'success' | 'neutral' | 'warning' | 'error' | 'info'; children: React.ReactNode }) {
  const styles = {
    success: 'bg-success-50 text-success-700',
    neutral: 'bg-neutral-100 text-neutral-700',
    warning: 'bg-warning-50 text-warning-800',
    error: 'bg-error-50 text-error-600',
    info: 'bg-accent-blue/10 text-accent-blue',
  }[tone]
  return <span className={cn(chip, styles)}>{children}</span>
}

/** Labelled form section inside the wizard. */
export function SsoSection({ title, hint, children, actions }: { title: string; hint?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-neutral-100 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-body font-semibold text-neutral-900">{title}</h3>
          {hint && <p className="mt-0.5 text-body-sm text-neutral-600">{hint}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  )
}
