import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Lock1 } from 'iconsax-reactjs'
import { AppIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { UpgradeRequestDialog } from '@/components/subscription/UpgradeRequestDialog'
import { useSubscription } from '@/hooks/useSubscription'
import type { FeatureKey } from '@/lib/api/platformTypes'
import { ROUTES } from '@/lib/routes'
import { featureForPath } from '@/lib/subscriptionFeatures'

/** Friendly "not in your plan" screen for a CAB module the subscription does not include. */
export function LockedFeatureScreen({ feature }: { feature: FeatureKey }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { subscription } = useSubscription()
  const [requesting, setRequesting] = useState(false)
  const name = t(`platform.features.${feature}`)

  return (
    // No page tour here (CabLayout would otherwise start the dashboard tour on this screen).
    <CabLayout tourId="cab-locked-feature" tourSteps={[]}>
      <CabHeader title={name} />
      <main className="flex flex-1 items-start justify-center page-main">
        <div className="mt-6 w-full max-w-xl rounded-3xl border border-neutral-100 bg-white p-6 text-center shadow-card sm:p-10">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-warning-500/15 text-warning-700">
            <AppIcon icon={Lock1} size={30} />
          </div>
          <p className="text-caption font-semibold uppercase tracking-[0.14em] text-accent-teal">{t('subscription.locked.badge')}</p>
          <h1 className="text-page-title text-text-primary mt-2">{t('subscription.locked.title', { feature: name })}</h1>
          <p className="mt-3 text-body-sm leading-[1.7] text-neutral-700">
            {t('subscription.locked.body', { feature: name, plan: subscription?.plan.name ?? '' })}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button variant="primary" onClick={() => setRequesting(true)}>
              {t('subscription.requestUpgrade')}
            </Button>
            <Button variant="outline" onClick={() => navigate(ROUTES.cabSubscription)}>
              {t('subscription.openMySubscription')}
            </Button>
          </div>
          <button type="button" onClick={() => navigate(ROUTES.workspace)} className="mt-5 text-body-sm font-medium text-neutral-600 hover:text-primary hover:underline">
            {t('subscription.locked.backToHub')}
          </button>
        </div>
      </main>
      <UpgradeRequestDialog open={requesting} onClose={() => setRequesting(false)} currentPlanCode={subscription?.plan.code} feature={feature} />
    </CabLayout>
  )
}

/** Route guard for CAB staff: a module outside the plan shows the locked screen instead of the page. */
export function FeatureRouteGate({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { isPathAllowed, subscription } = useSubscription()
  // After the quarantine the API answers SUBSCRIPTION_ENDED everywhere but /subscription.
  if (subscription?.ended && location.pathname !== ROUTES.cabSubscription) return <Navigate to={ROUTES.cabSubscription} replace />
  const feature = featureForPath(location.pathname)
  if (feature && !isPathAllowed(location.pathname)) return <LockedFeatureScreen feature={feature} />
  return <>{children}</>
}
