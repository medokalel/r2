import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface DashboardFooterProps {
  onBack?: () => void
  onNext?: () => void
  onSaveDraft?: () => void
  backDisabled?: boolean
  nextDisabled?: boolean
  saveDraftDisabled?: boolean
  saveDraftLoading?: boolean
  nextLabel?: string
  startContent?: ReactNode
  className?: string
}

export function DashboardFooter({
  onBack,
  onNext,
  onSaveDraft,
  backDisabled = true,
  nextDisabled = false,
  saveDraftDisabled = false,
  saveDraftLoading = false,
  nextLabel,
  startContent,
  className,
}: DashboardFooterProps) {
  const { t } = useTranslation()

  return (
    <footer
      className={cn(
        'flex shrink-0 flex-wrap items-center gap-4 border-t-2 border-neutral-100 bg-white px-6 py-3',
        startContent ? 'justify-between' : 'justify-end',
        className
      )}
    >
      {startContent}
      <div className="flex flex-wrap gap-5">
        {onSaveDraft && (
          <Button
            variant="tertiary"
            disabled={saveDraftDisabled}
            onClick={onSaveDraft}
            className="min-w-[200px] rounded-md bg-primary-25 disabled:opacity-50"
          >
            {saveDraftLoading ? t('common.loading') : t('common.saveDraft')}
          </Button>
        )}
        <Button
          variant="secondary"
          disabled={backDisabled}
          onClick={onBack}
          className="min-w-[200px] rounded-md disabled:opacity-50"
        >
          {t('common.back')}
        </Button>
        <Button
          variant="primary"
          disabled={nextDisabled}
          onClick={onNext}
          className="min-w-[200px] rounded-md disabled:opacity-50"
        >
          {nextLabel ?? t('common.next')}
        </Button>
      </div>
    </footer>
  )
}