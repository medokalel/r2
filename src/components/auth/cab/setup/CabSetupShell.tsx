import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStepTransition } from '@/components/auth/OnboardingStepTransition'
import { LanguageToggle } from '@/components/ui/LanguageToggle'

interface CabSetupShellProps {
  /** Wordmark shown next to the counter, e.g. "CAB Setup" / "AB Setup". */
  badge: string
  /** 1-based screen number within the 10-screen deck. */
  current: number
  total: number
  title: string
  subtitle: string
  children: ReactNode
  onBack?: () => void
  onNext: () => void
  nextLabel: string
  nextDisabled?: boolean
  onSaveAndExit: () => void
  error?: ReactNode
  direction?: 'forward' | 'back'
}

/**
 * Chrome for the CAB setup wizard, matching the deck 1:1 — white topbar with
 * the product mark and a "CAB SETUP · n/10" counter, a #FAFBFD canvas, the
 * 1124px content column, a progress rail, and the Back / Next / Save row.
 */
export function CabSetupShell({
  badge,
  current,
  total,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  onSaveAndExit,
  error,
  direction = 'forward',
}: CabSetupShellProps) {
  const { t } = useTranslation()

  return (
    <div className="cab-setup flex min-h-screen flex-col bg-[var(--cab-canvas)]">
      {/* Topbar — 70px, white, hairline underline */}
      <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-[var(--cab-hairline)] bg-white px-6 sm:px-[58px]">
        <img
          src="/icasco-logo.svg"
          alt={t('common.appName')}
          className="h-10 w-auto object-contain sm:h-12"
        />
        <div className="flex items-center gap-4">
          <span
            className="text-caption font-bold uppercase tracking-[0.04em] text-[var(--cab-muted)]"
            lang="en"
            dir="ltr"
          >
            {badge} &nbsp;•&nbsp; {current}/{total}
          </span>
          <LanguageToggle variant="icon" showChevron={false} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1124px] flex-1 px-6 pb-10 pt-8 sm:px-0">
        <h1 className="text-[32px] font-bold leading-[1.25] text-[var(--cab-ink)]">{title}</h1>
        <p className="mt-2 text-body leading-[1.5] text-[var(--cab-muted)]">{subtitle}</p>

        {/* Progress rail */}
        <div
          className="mt-6 h-[6px] w-full overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={1}
          aria-valuemax={total}
        >
          <div
            className="h-full rounded-full bg-[var(--cab-primary)] transition-[width] duration-300"
            style={{ width: `${(current / total) * 100}%` }}
          />
        </div>

        <OnboardingStepTransition key={current} direction={direction} className="mt-8">
          {children}
        </OnboardingStepTransition>

        {error}

        {/* Footer — save link left, Back (text) + Next (filled) right */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onSaveAndExit}
            className="text-caption text-[var(--cab-muted)] underline-offset-2 hover:underline"
          >
            {t('common.saveAndContinueLater')}
          </button>

          <div className="flex items-center gap-6">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-4 text-body-sm font-bold text-[var(--cab-primary)]"
              >
                {t('common.back')}
              </button>
            )}
            <button
              type="button"
              onClick={onNext}
              disabled={nextDisabled}
              className="h-12 w-full min-w-[267px] rounded-md bg-[var(--cab-primary)] text-body font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-[267px]"
            >
              {nextLabel}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
