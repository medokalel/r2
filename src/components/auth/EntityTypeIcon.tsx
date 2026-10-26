interface EntityTypeIconProps {
  className?: string
}

export function EntityTypeIcon({ className }: EntityTypeIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M14.9987 20H23.332"
        stroke="currentColor"
        strokeWidth="3.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.9987 13.3333H23.332"
        stroke="currentColor"
        strokeWidth="3.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.33203 28.3333V8.33333C8.33203 6.49238 9.82442 5 11.6654 5H33.332"
        stroke="currentColor"
        strokeWidth="3.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M26.668 35H6.66797C4.82702 35 3.33464 33.5076 3.33464 31.6667V30C3.33464 29.0795 4.08083 28.3333 5.0013 28.3333H21.668C22.5884 28.3333 23.3346 29.0795 23.3346 30V31.6667C23.3346 33.5064 24.8283 35 26.668 35C28.5077 35 30.0013 33.5064 30.0013 31.6667V8.33333C30.0013 6.49362 31.4949 5 33.3346 5C35.1744 5 36.668 6.49362 36.668 8.33333V11.6667C36.668 12.5871 35.9218 13.3333 35.0013 13.3333H30.0013"
        stroke="currentColor"
        strokeWidth="3.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
