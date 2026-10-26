import { FormLabel } from '@/components/ui/FormField'

export const PAYMENT_VISA_MODAL_CLASS = 'w-[min(380px,calc(100vw-32px))] max-h-[calc(100dvh-24px)]'
export const PAYMENT_BANK_MODAL_CLASS = 'w-[min(780px,calc(100vw-32px))] max-h-[calc(100dvh-24px)]'

export const paymentFieldClass =
  'h-10 font-sans text-caption font-normal leading-[1.6] placeholder:text-caption placeholder:font-normal placeholder:text-neutral-500'

export const paymentFieldsStackClass = 'flex flex-col gap-4'
export const paymentBankFormClass = 'flex flex-col gap-3'
export const paymentBankRowClass = 'grid grid-cols-2 gap-x-4'
export const paymentBankRowGroupClass = 'flex flex-col gap-1'
export const paymentBankLabelsRowClass = 'grid grid-cols-2 gap-x-4'
export const paymentContentClass = 'flex w-full flex-col gap-5'

export function BankFormRow({
  left,
  right,
}: {
  left: { id: string; label: string; field: React.ReactNode }
  right?: { id: string; label: string; field: React.ReactNode }
}) {
  return (
    <div className={paymentBankRowGroupClass}>
      <div className={paymentBankLabelsRowClass}>
        <FormLabel htmlFor={left.id}>{left.label}</FormLabel>
        {right ? <FormLabel htmlFor={right.id}>{right.label}</FormLabel> : <span />}
      </div>
      <div className={paymentBankRowClass}>
        <div>{left.field}</div>
        {right ? <div>{right.field}</div> : <span />}
      </div>
    </div>
  )
}
