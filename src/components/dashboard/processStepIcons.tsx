import type { SVGProps } from 'react'
import { AppIcon, CalendarIcon, ReceiptIcon, RefreshIcon, ShieldIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 1.66667,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function ProcessStepSvg({
  className,
  children,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      width={20}
      height={20}
      aria-hidden
      className={cn('shrink-0', className)}
      {...props}
    >
      {children}
    </svg>
  )
}

export function GrantApplicationStepIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <ProcessStepSvg {...props}>
      <path
        d="M15.0013 18.3337C15.9218 18.3337 16.668 17.5875 16.668 16.667V3.33366C16.668 2.41319 15.9218 1.66699 15.0013 1.66699H8.33464C7.80183 1.66613 7.29071 1.8779 6.91464 2.25533L3.92464 5.24533C3.54619 5.62153 3.33377 6.13337 3.33464 6.66699V16.667C3.33464 17.5875 4.08083 18.3337 5.0013 18.3337H15.0013"
        {...stroke}
      />
      <path
        d="M8.33203 1.66699V5.83366C8.33203 6.2939 7.95894 6.66699 7.4987 6.66699H3.33203"
        {...stroke}
      />
      <path d="M11.6654 7.5H13.332" {...stroke} />
      <path d="M6.66536 10.833H13.332" {...stroke} />
      <path d="M6.66536 14.167H13.332" {...stroke} />
    </ProcessStepSvg>
  )
}

export function AccreditationFieldStepIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <ProcessStepSvg {...props}>
      <path
        d="M10.8329 8.33329L17.8162 15.3175C18.5063 16.0074 18.5065 17.1278 17.8166 17.8179C17.1267 18.508 16.0063 18.5082 15.3162 17.8183L8.33203 10.8316"
        {...stroke}
      />
      <path d="M13.332 6.66797L8.33203 1.66797" {...stroke} />
      <path d="M8.7487 2.08333L2.08203 8.75" {...stroke} />
      <path d="M6.66797 13.332L1.66797 8.33203" {...stroke} />
      <path d="M6.25 12.918L12.9167 6.2513" {...stroke} />
    </ProcessStepSvg>
  )
}

export function ChecklistsStepIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <ProcessStepSvg {...props}>
      <path d="M16.6654 5L7.4987 14.1667L3.33203 10" {...stroke} />
    </ProcessStepSvg>
  )
}

export function FileReviewStepIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <ProcessStepSvg {...props}>
      <path
        d="M11.082 16.6667H16.6654C17.5858 16.6667 18.332 15.9206 18.332 15.0001V4.16675C18.332 3.24627 17.5858 2.50008 16.6654 2.50008H13.4154C12.849 2.49453 12.3185 2.77701 12.007 3.25008L11.332 4.25008C11.0238 4.71818 10.5009 4.99999 9.94036 5.00008H3.33203C2.41156 5.00008 1.66537 5.74627 1.66537 6.66675V10.0834"
        {...stroke}
      />
      <path d="M2.4987 17.5003L4.08203 15.917" {...stroke} />
      <path
        d="M8.33203 14.167C8.33203 15.5468 7.21182 16.667 5.83203 16.667C4.45224 16.667 3.33203 15.5468 3.33203 14.167C3.33203 12.7872 4.45224 11.667 5.83203 11.667C7.21182 11.667 8.33203 12.7872 8.33203 14.167V14.167"
        {...stroke}
      />
    </ProcessStepSvg>
  )
}

export function DocumentReviewStepIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <ProcessStepSvg {...props}>
      <path d="M7.5 8.33366L9.16667 10.0003L12.5 6.66699" {...stroke} />
      <path
        d="M3.33464 2.5H16.668C17.5884 2.5 18.3346 3.24619 18.3346 4.16667V12.5C18.3346 13.4205 17.5884 14.1667 16.668 14.1667H3.33464C2.41416 14.1667 1.66797 13.4205 1.66797 12.5V4.16667C1.66797 3.24619 2.41416 2.5 3.33464 2.5V2.5"
        {...stroke}
      />
      <path d="M10 14.167V17.5003" {...stroke} />
      <path d="M6.66797 17.5H13.3346" {...stroke} />
    </ProcessStepSvg>
  )
}

export function AssessmentVisitStepIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <ProcessStepSvg {...props}>
      <path
        d="M16.6654 8.33366C16.6654 12.4945 12.0495 16.8278 10.4995 18.1662C10.2029 18.3892 9.7945 18.3892 9.49786 18.1662C7.94786 16.8278 3.33203 12.4945 3.33203 8.33366C3.33203 4.65423 6.31926 1.66699 9.9987 1.66699C13.6781 1.66699 16.6654 4.65423 16.6654 8.33366"
        {...stroke}
      />
      <path
        d="M7.5 8.33301C7.5 9.7128 8.62021 10.833 10 10.833C11.3798 10.833 12.5 9.7128 12.5 8.33301C12.5 6.95322 11.3798 5.83301 10 5.83301C8.62021 5.83301 7.5 6.95322 7.5 8.33301V8.33301"
        {...stroke}
      />
    </ProcessStepSvg>
  )
}

export function CorrectiveActionStepIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <ProcessStepSvg {...props}>
      <path
        d="M1.89099 14.9999L8.55766 3.3332C8.8536 2.81101 9.40745 2.48828 10.0077 2.48828C10.6079 2.48828 11.1617 2.81101 11.4577 3.3332L18.1243 14.9999C18.4234 15.5178 18.422 16.1564 18.1206 16.673C17.8192 17.1897 17.2641 17.5052 16.666 17.4999H3.33266C2.73752 17.4993 2.18787 17.1813 1.89057 16.6658C1.59326 16.1502 1.59342 15.5153 1.89099 14.9999"
        {...stroke}
      />
      <path d="M10 7.5V10.8333" {...stroke} />
      <path d="M10 14.167H9.99167" {...stroke} />
    </ProcessStepSvg>
  )
}

export function FinalReportStepIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <ProcessStepSvg {...props}>
      <path
        d="M8.7487 18.3337H4.9987C4.07822 18.3337 3.33203 17.5875 3.33203 16.667V3.33366C3.33203 2.41319 4.07822 1.667 4.9987 1.667H11.6654C12.1987 1.66569 12.7106 1.87749 13.087 2.25533L16.077 5.24533C16.4549 5.62181 16.6667 6.13362 16.6654 6.667V11.667"
        {...stroke}
      />
      <path
        d="M11.668 1.66699V5.83366C11.668 6.2939 12.0411 6.66699 12.5013 6.66699H16.668"
        {...stroke}
      />
      <path d="M11.668 16.6667L13.3346 18.3333L16.668 15" {...stroke} />
    </ProcessStepSvg>
  )
}

export type ProcessStepIconComponent = typeof GrantApplicationStepIcon

export function QuotationStepIcon({ className }: SVGProps<SVGSVGElement>) {
  return <AppIcon icon={ReceiptIcon} size={24} className={className} />
}

export function CertificateStepIcon({ className }: SVGProps<SVGSVGElement>) {
  return <AppIcon icon={ShieldIcon} size={24} className={className} />
}

export function SurveillanceStepIcon({ className }: SVGProps<SVGSVGElement>) {
  return <AppIcon icon={RefreshIcon} size={24} className={className} />
}

export function PlanningStepIcon({ className }: SVGProps<SVGSVGElement>) {
  return <CalendarIcon className={cn('size-6', className)} />
}
