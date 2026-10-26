import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface OnboardingStepTransitionProps {
  direction?: 'forward' | 'back'
  children: ReactNode
  className?: string
}

export function OnboardingStepTransition({
  direction = 'forward',
  children,
  className,
}: OnboardingStepTransitionProps) {
  return (
    <div
      className={cn(
        direction === 'back'
          ? 'onboarding-step-enter-back motion-safe:animate-[onboardingStepInBack_0.38s_ease-out_both]'
          : 'onboarding-step-enter-forward motion-safe:animate-[onboardingStepInForward_0.38s_ease-out_both]',
        className
      )}
    >
      {children}
    </div>
  )
}
