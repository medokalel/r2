interface SelectDropdownIconProps {
  className?: string
}

export function SelectDropdownIcon({ className }: SelectDropdownIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="5"
      viewBox="0 0 10 5"
      fill="none"
      className={className}
      aria-hidden
    >
      <path d="M5 5L0 0H10L5 5Z" fill="currentColor" />
    </svg>
  )
}
