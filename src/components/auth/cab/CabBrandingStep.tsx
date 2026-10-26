import { useTranslation } from 'react-i18next'
import { OnboardingLogoUpload } from '@/components/auth/OnboardingLogoUpload'
import { CAB_COLOR_PALETTES, getAccreditationBodyOptions } from '@/lib/api/cabOnboardingApi'
import { getAccreditationBodyDisplayName, type CabOnboardingForm } from '@/lib/cabOnboardingForm'
import { cn } from '@/lib/utils'

interface CabBrandingStepProps {
  form: CabOnboardingForm
  onPatch: (f: Partial<CabOnboardingForm>) => void
}

function MiniSwitch({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-neutral-300'
      )}
    >
      <span
        className={cn(
          'inline-block size-4 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'
        )}
      />
    </button>
  )
}

export function CabBrandingStep({ form, onPatch }: CabBrandingStepProps) {
  const { t } = useTranslation()
  const accreditationBody = getAccreditationBodyDisplayName(form, getAccreditationBodyOptions(form.country))
  const validCustomColor = /^#[0-9A-F]{6}$/i.test(form.customColor)

  return (
    <div className="w-full space-y-6">
      <div>
        <p className="mb-2 text-body-2-medium text-primary">
          {t('cab.onboarding.branding.hint', { accreditationBody })}
        </p>
        <h1 className="text-page-title text-text-primary">{t('cab.onboarding.branding.title')}</h1>
        <p className="mt-2 text-body-2 text-neutral-600">{t('cab.onboarding.branding.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-golden">
        <div className="rounded-md border border-neutral-300 bg-white p-4">
          <p className="mb-3 text-body-1-semibold text-neutral-900">{t('cab.onboarding.branding.visualIdentity')}</p>
          <p className="text-body-3-medium text-neutral-800 mb-2">{t('cab.onboarding.branding.logo')}</p>
          <OnboardingLogoUpload
            target="cab"
            logoUrl={form.logoUrl}
            onLogoUrlChange={(logoUrl) => onPatch({ logoUrl })}
          />
        </div>

        <div className="rounded-md border border-neutral-300 bg-white p-4">
          <p className="mb-3 text-body-1-semibold text-neutral-900">{t('cab.onboarding.branding.portalConfiguration')}</p>
          <div className="mb-2 grid grid-cols-2 gap-3">
            {(['light', 'dark'] as const).map((theme) => (
              <button
                key={theme}
                type="button"
                onClick={() => onPatch({ theme })}
                className={cn(
                'flex items-center justify-between rounded-md border px-3 py-2 text-body-2-medium',
                  form.theme === theme ? 'border-2 border-dashed border-primary text-primary' : 'border-neutral-300 text-neutral-800'
                )}
              >
                {t(`cab.onboarding.branding.${theme}Theme`)}
                <span
                  className={cn(
                    'flex size-5 items-center justify-center rounded-sm border text-caption',
                    form.theme === theme ? 'border-primary bg-primary text-white' : 'border-neutral-400'
                  )}
                >
                  {form.theme === theme ? '✓' : ''}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-body-3 text-neutral-800">{t('cab.onboarding.branding.includeLogoInEmails')}</span>
            <MiniSwitch checked={form.includeLogoInEmails} onChange={(v) => onPatch({ includeLogoInEmails: v })} />
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-body-3 text-neutral-800">{t('cab.onboarding.branding.displayLogoOnCertificates')}</span>
            <MiniSwitch
              checked={form.displayLogoOnCertificates}
              onChange={(v) => onPatch({ displayLogoOnCertificates: v })}
            />
          </div>
        </div>
      </div>

      <div className="rounded-md border border-neutral-300 bg-white p-4">
        <p className="mb-3 text-body-1-semibold text-neutral-900">{t('cab.onboarding.branding.colorPalette')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CAB_COLOR_PALETTES.map((palette, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onPatch({ colorPaletteIndex: index })}
              className={cn(
                'flex items-center gap-2 rounded-md border p-1',
                form.colorPaletteIndex === index ? 'border-2 border-dashed border-primary' : 'border-transparent'
              )}
            >
              {palette.map((color) => (
                <span
                  key={color}
                  className="size-9 shrink-0 rounded-full min-[850px]:size-10"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
              ))}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-col gap-2 border-t border-neutral-300 pt-3 sm:flex-row sm:items-center">
          <label htmlFor="cab-custom-color" className="text-body-3-medium text-neutral-900 sm:me-auto">
            {t('cab.onboarding.branding.customColor')}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="cab-custom-color"
              type="color"
              value={validCustomColor ? form.customColor : '#143DB8'}
              onChange={(event) =>
                onPatch({ customColor: event.target.value.toUpperCase(), colorPaletteIndex: null })
              }
              className="h-10 w-12 cursor-pointer rounded-md border border-neutral-300 bg-white p-1"
              aria-label={t('cab.onboarding.branding.colorPicker')}
            />
            <input
              type="text"
              value={form.customColor}
              maxLength={7}
              onChange={(event) =>
                onPatch({ customColor: event.target.value.toUpperCase(), colorPaletteIndex: null })
              }
              className={cn(
                'h-10 w-32 rounded-md border bg-white px-3 font-mono text-body-sm uppercase text-neutral-900 outline-none focus:ring-1 focus:ring-primary',
                validCustomColor ? 'border-neutral-300' : 'border-error-400'
              )}
              placeholder="#143DB8"
              aria-label={t('cab.onboarding.branding.hexColor')}
              aria-invalid={!validCustomColor}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
