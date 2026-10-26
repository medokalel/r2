import { useTranslation } from 'react-i18next'
import { Tooltip } from '@/components/ui/Tooltip'

export function CvvHintTooltip() {
  const { t } = useTranslation()

  return (
    <Tooltip
      side="top"
      align="start"
      contentClassName="max-w-[240px] p-3"
      label={
        <div className="flex flex-col gap-2">
          <p className="text-body-sm font-normal leading-[1.5] text-neutral-800">
            {t('wallet.addPaymentModal.cvvHint')}
          </p>
          <img
            src="/images/cvv-hint.png"
            alt=""
            className="w-full rounded-sm"
            width={216}
            height={136}
          />
        </div>
      }
    >
      <button
        type="button"
        aria-label={t('wallet.addPaymentModal.cvvHint')}
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-neutral-400 text-caption font-semibold leading-none text-neutral-600 transition-colors hover:border-primary hover:text-primary"
      >
        i
      </button>
    </Tooltip>
  )
}
