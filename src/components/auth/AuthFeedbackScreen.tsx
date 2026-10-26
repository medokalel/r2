import type { AppIconComponent } from '@/components/icons'
import { AppIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export type AuthFeedbackVariant = 'success' | 'error'

interface AuthFeedbackAction {
  label: string
  onClick: () => void
}

interface AuthFeedbackScreenProps {
  variant: AuthFeedbackVariant
  icon?: AppIconComponent
  imageSrc?: string
  imageAlt?: string
  title: string
  description: string
  primaryAction: AuthFeedbackAction
  secondaryAction?: AuthFeedbackAction
  className?: string
}

export function AuthFeedbackScreen({
  variant,
  icon,
  imageSrc,
  imageAlt = '',
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: AuthFeedbackScreenProps) {
  const isSuccess = variant === 'success'

  return (
    <div className={cn('flex w-full flex-col items-center text-center', className)}>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={imageAlt}
          className="mb-6 size-[120px] shrink-0 object-contain"
          aria-hidden={!imageAlt}
        />
      ) : icon ? (
        <div
          className={cn(
            'mb-6 flex size-20 items-center justify-center rounded-full',
            isSuccess ? 'bg-success-50' : 'bg-error-50'
          )}
          aria-hidden
        >
          <AppIcon
            icon={icon}
            size={40}
            variant="Bold"
            className={isSuccess ? 'text-success-500' : 'text-error-500'}
          />
        </div>
      ) : null}

      <h1 className="text-page-title text-text-primary mb-3">{title}</h1>
      <p className="text-body-1 text-neutral-600 mb-10 max-w-md">{description}</p>

      <div className="flex w-full flex-col gap-3">
        <Button
          type="button"
          variant="primary"
          onClick={primaryAction.onClick}
          className="w-full h-12 rounded-md text-body font-medium text-white"
        >
          {primaryAction.label}
        </Button>

        {secondaryAction && (
          <Button
            type="button"
            variant="secondary"
            onClick={secondaryAction.onClick}
            className="w-full h-12 rounded-md text-body font-medium"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  )
}
