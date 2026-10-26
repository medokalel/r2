import { useTranslation } from 'react-i18next'
import type { AgreementStatus } from '@/lib/api/agreementsApi'
import { cn } from '@/lib/utils'
import { FLOW, statusLabel } from '@/components/agreements/agreementHelpers'

/** Draft → Sent → Signed by client → Active, with the current step highlighted. */
export function AgreementFlow({ status }: { status: AgreementStatus }) {
  const { t } = useTranslation()
  const closed = status === 'superseded' || status === 'terminated'
  const current = closed ? FLOW.length : FLOW.indexOf(status)
  return (
    <ol className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-2" aria-label={t('agreements.flow.label')}>
      {FLOW.map((step, index) => {
        const done = index < current || (status === 'active' && step === 'active')
        const active = index === current && !closed && status !== 'active'
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full text-caption font-semibold',
                done ? 'bg-success-500 text-white' : active ? 'bg-primary text-white' : 'bg-neutral-50 text-neutral-500',
              )}
              aria-current={active ? 'step' : undefined}
            >
              {index + 1}
            </span>
            <span className={cn('text-body-sm', active ? 'font-semibold text-neutral-900' : 'text-neutral-600')}>{statusLabel(t, step)}</span>
            {index < FLOW.length - 1 && <span className="mx-1 hidden h-px w-6 bg-neutral-200 sm:block" aria-hidden />}
          </li>
        )
      })}
      {closed && (
        <li className="text-body-sm font-semibold text-neutral-700">
          {statusLabel(t, status)}
        </li>
      )}
    </ol>
  )
}
