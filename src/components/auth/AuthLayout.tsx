import { BrandingPanelBackground } from './BrandingPanelBackground'
import { CascoBranding } from './CascoBranding'
import { useDirection } from '@/context/direction/useDirection'
import { cn } from '@/lib/utils'

interface AuthLayoutProps {
  children: React.ReactNode
  contentClassName?: string
  /** Mirrors which side the branding panel sits on (relative to the form), independent of language direction. */
  reverse?: boolean
}

export function AuthLayout({ children, contentClassName, reverse }: AuthLayoutProps) {
  const { dir } = useDirection()

  return (
    <div dir={dir} className={cn('min-h-screen flex', reverse && 'flex-row-reverse')}>
      {/* Left: branding background with full width white form container.
          On mobile there's no room for a separate branding panel, so this
          collapses to a plain white page (no dark backdrop, no padded/
          shadowed card) and the branding shows inline at the top instead. */}
      <div className="relative flex min-h-screen w-full flex-col bg-white lg:w-[48%] lg:overflow-hidden">
        <div className="absolute inset-0 hidden lg:block">
          <BrandingPanelBackground />
        </div>

        <div className="relative z-10 flex flex-1 flex-col lg:p-4 xl:p-6">
          <div className="flex flex-1 flex-col overflow-hidden bg-white lg:rounded-lg lg:shadow-2xl">
            <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-5 lg:py-12">
              <div className={cn('w-full max-w-[620px]', contentClassName)}>
                {/* Mobile-only branding — on lg+ this lives in the separate
                    right-side panel (CascoBranding) instead. */}
                <div className="mb-8 flex justify-center lg:hidden">
                  <img
                    src="/icasco-logo-mobile.png"
                    alt="iCASCO: Small Conformity.. Real Impact"
                    className="h-auto w-78 object-contain"
                  />
                </div>

                {children}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: branding panel */}
      <div className="hidden lg:flex lg:flex-1">
        <CascoBranding />
      </div>
    </div>
  )
}