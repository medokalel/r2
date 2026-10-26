interface CardFooterLinkProps {
  label: string
  onClick: () => void
}

/**
 * Bold, primary-blue "view more" link used in the footer of dashboard
 * summary cards (e.g. CabDonutCard, CabAuditsOverviewChart). Centralized
 * here so every card's footer link stays visually consistent.
 */
export function CardFooterLink({ label, onClick }: CardFooterLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 self-end text-body-sm font-semibold text-primary transition-colors hover:text-primary-hover"
    >
      {label} <span aria-hidden className="inline-block rtl:-scale-x-100">→</span>
    </button>
  )
}
