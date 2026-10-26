import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface TablePaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

/** Up to three page numbers, kept around the current page. */
function visiblePages(page: number, totalPages: number): number[] {
  const count = Math.min(totalPages, 3)
  const start = Math.min(Math.max(1, page - 1), Math.max(1, totalPages - count + 1))
  return Array.from({ length: count }, (_, index) => start + index)
}

/**
 * Figma "Pagination" (5003:15234): Previous (Body 2, secondary) · round 50px pages
 * (current = Primary blue fill, others = Primary blue/25 fill with Primary border) · Next (Body 2 Medium, primary).
 */
export function TablePagination({ page, totalPages, onPageChange, className }: TablePaginationProps) {
  const { t } = useTranslation()
  const pages = visiblePages(page, totalPages)

  return (
    <nav aria-label={t('common.pagination', 'Pagination')} className={cn('flex flex-wrap items-center justify-end gap-3 sm:gap-5', className)}>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-sm px-2 py-2 text-body leading-[1.6] text-text-secondary transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 sm:px-3.5 sm:py-3"
      >
        {t('common.previous')}
      </button>
      <div className="flex items-center gap-2.5">
        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            aria-current={pageNumber === page ? 'page' : undefined}
            className={cn(
              'flex size-10 items-center justify-center rounded-full border border-primary font-semibold leading-[1.236] transition-colors lg:size-[50px]',
              pageNumber === page
                ? 'bg-primary text-body-lg text-white lg:text-body-lg'
                : 'bg-primary-25 text-body text-primary hover:bg-primary-50'
            )}
          >
            {pageNumber}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-sm px-2 py-2 text-body font-medium leading-[1.6] text-primary transition-colors hover:text-primary-hover disabled:cursor-not-allowed disabled:opacity-40 sm:px-3.5 sm:py-3"
      >
        {t('common.next')}
      </button>
    </nav>
  )
}
