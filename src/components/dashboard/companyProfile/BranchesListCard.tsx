import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { deleteBranch } from '@/lib/api/organizationProfileApi'
import { BranchCard } from './BranchCard'
import { profileCardClassName } from './constants'
import { CardHeader } from './Primitives'
import { useProfileForm } from './ProfileFormContext'

// At 1440px and below the branch cards get too narrow for two per page
const COMPACT_SCREEN_QUERY = '(max-width: 1440px)'

export function BranchesListCard() {
  const { t, i18n } = useTranslation()
  const { branches, refreshBranches, setEditingBranch, notify, handleApiError } = useProfileForm()
  const [page, setPage] = useState(0)
  const [isCompact, setIsCompact] = useState(
    () => window.matchMedia(COMPACT_SCREEN_QUERY).matches
  )

  useEffect(() => {
    const mq = window.matchMedia(COMPACT_SCREEN_QUERY)
    const onChange = (e: MediaQueryListEvent) => setIsCompact(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const perPage = isCompact ? 1 : 2
  const pageCount = Math.max(1, Math.ceil(branches.length / perPage))
  const currentPage = Math.min(page, pageCount - 1)
  const isRtl = i18n.dir() === 'rtl'

  const onDeleteBranch = async (id: string) => {
    try {
      await deleteBranch(id)
      await refreshBranches()
      notify({ type: 'success', message: t('companyProfile.messages.branchDeleted') })
    } catch (error) {
      handleApiError(error)
    }
  }

  const pages = Array.from({ length: pageCount }, (_, i) =>
    branches.slice(i * perPage, (i + 1) * perPage)
  )

  // With a single branch the card takes the full width and the carousel is hidden
  const showCarousel = pageCount > 1

  return (
    <div className={profileCardClassName}>
      <CardHeader title={t('companyProfile.branchesCard.title')} />
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(${currentPage * 100 * (isRtl ? 1 : -1)}%)` }}
        >
          {pages.map((pageBranches, i) => (
            <div
              key={i}
              className={cn(
                'grid w-full shrink-0 gap-4',
                perPage === 2 && branches.length > 1 && 'grid-cols-2'
              )}
            >
              {pageBranches.map((branch) => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  onDelete={onDeleteBranch}
                  onEdit={setEditingBranch}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      {showCarousel && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            aria-label={t('common.back')}
            className="flex size-11 items-center justify-center rounded-full border border-primary/20 text-primary hover:border-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-primary/20"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="rtl-flip">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex gap-1.5">
            {pages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                aria-label={`${i + 1}`}
                className={cn(
                  'size-2 rounded-full transition-colors',
                  i === currentPage ? 'bg-primary' : 'bg-neutral-400 hover:bg-neutral-500'
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPage(Math.min(pageCount - 1, currentPage + 1))}
            disabled={currentPage === pageCount - 1}
            aria-label={t('common.next')}
            className="flex size-11 items-center justify-center rounded-full border border-primary/20 text-primary hover:border-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-primary/20"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="rtl-flip">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
