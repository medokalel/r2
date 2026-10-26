import { useTranslation } from 'react-i18next'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { entityDataNavIconComponents } from '@/components/icons/entityDataNavIconComponents'
import {
  subSections,
  type EntityDataSubSection,
  type EntityDataViewTab,
} from '@/components/dashboard/entityDataNavSections'
import { useOptionalTour } from '@/context/tour/useTour'
import { cn } from '@/lib/utils'

type NavViewTab = keyof typeof entityDataNavIconComponents

const viewTabs: NavViewTab[] = ['field', 'documents', 'feedback']

// Maps each view tab to its guided-tour step id (see
// useCertificationRequestFormTourSteps). DashboardTourStep falls back to
// the ambient TourProvider's steps, so no steps prop needs to be threaded
// through here — it only lights up when that tour is actually running.
const viewTabTourStepIds: Record<NavViewTab, string> = {
  entityData: 'entity-data-tab',
  field: 'field-tab',
  documents: 'documents-tab',
  feedback: 'feedback-tab',
}

const navTourStepIds: string[] = ['entity-data-tab', ...Object.values(viewTabTourStepIds)]

interface EntityDataNavProps {
  activeSubSection?: EntityDataSubSection
  activeViewTab?: EntityDataViewTab
  onSubSectionChange?: (section: EntityDataSubSection) => void
  onViewTabChange?: (tab: EntityDataViewTab) => void
}

export function EntityDataNav({
  activeSubSection = 'legalIdentity',
  activeViewTab = 'entityData',
  onSubSectionChange,
  onViewTabChange,
}: EntityDataNavProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'
  const activeIndex = subSections.indexOf(activeSubSection)
  const isEntityDataExpanded = activeViewTab === 'entityData'
  const EntityDataIcon = entityDataNavIconComponents.entityData
  const tour = useOptionalTour()
  const isOwnStepActive = tour?.isTourActive && navTourStepIds.includes(tour.activeStepId ?? '')

  return (
    <nav
      className={cn(
        'sticky top-0 w-[275px] shrink-0 self-start rounded-3xl border border-neutral-100 bg-neutral-25 p-5 shadow-card',
        // Matches TourTooltip's TOUR_Z_HIGHLIGHT — see comment above.
        isOwnStepActive && 'z-[1001]'
      )}
      aria-label={t('accreditation.entityData.title')}
    >
      <div
        className={cn(
          'overflow-hidden rounded-md',
          isEntityDataExpanded && 'bg-[rgba(232,237,252,0.5)]'
        )}
      >
        <DashboardTourStep stepId="entity-data-tab">
          <button
            type="button"
            onClick={() => onViewTabChange?.('entityData')}
            aria-expanded={isEntityDataExpanded}
            aria-current={isEntityDataExpanded ? 'page' : undefined}
            className={cn(
              'flex w-full items-center gap-3 py-2.5 text-body font-medium leading-[1.6] transition-colors',
              isEntityDataExpanded
                ? 'border-s-[3px] border-primary ps-1 pe-2 text-primary'
                : 'rounded-md px-2 text-neutral-700 hover:bg-neutral-50'
            )}
          >
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-md',
                isEntityDataExpanded
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-neutral-50 text-neutral-700'
              )}
            >
              <EntityDataIcon className={isEntityDataExpanded ? 'text-white' : undefined} />
            </span>
            {t('accreditation.entityData.title')}
          </button>
        </DashboardTourStep>

        {isEntityDataExpanded && (
          <ul className="relative px-2 pb-2">
            {subSections.map((key, index) => {
              const isActive = index === activeIndex
              const isLast = index === subSections.length - 1

              return (
                <li key={key} className="relative">
                  <button
                    type="button"
                    onClick={() => onSubSectionChange?.(key)}
                    aria-current={isActive ? 'step' : undefined}
                    className={cn(
                      'relative flex w-full items-center gap-2 rounded-e-md py-2.5 ps-8 pe-2 text-start transition-colors',
                      isActive
                        ? 'text-body font-medium leading-[1.6] text-neutral-900'
                        : cn('text-body leading-[1.6] text-neutral-800 hover:bg-white/50', isRTL ? 'font-light' : 'font-normal')
                    )}
                  >
                    {!isLast && (
                      <span
                        className={cn(
                          'absolute start-[17px] top-[22px] w-0.5 -bottom-4',
                          index === activeIndex ? 'bg-primary' : 'bg-white'
                        )}
                        aria-hidden
                      />
                    )}

                    <span
                      className={cn(
                        'absolute z-10 shrink-0 rounded-full top-[22px] -translate-y-1/2',
                        isActive
                          ? 'start-[13px] size-[10px] bg-primary ring-3 ring-white shadow-lg'
                          : 'start-[15px] size-[7px] bg-neutral-400'
                      )}
                      aria-hidden
                    />

                    <span>{t(`accreditation.entityData.sections.${key}`)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <ul className="mt-2 space-y-0">
        {viewTabs.map((key) => {
          const isActive = activeViewTab === key
          const Icon = entityDataNavIconComponents[key]

          return (
            <li key={key}>
              <DashboardTourStep stepId={viewTabTourStepIds[key]}>
                <button
                  type="button"
                  onClick={() => onViewTabChange?.(key)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md py-2.5 text-body font-medium leading-[1.6] transition-colors',
                    isActive
                      ? 'border-s-[3px] border-primary bg-primary-25 ps-1 pe-2 text-primary'
                      : 'px-2 text-neutral-700 hover:bg-neutral-50'
                  )}
                >
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-md',
                      isActive
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-neutral-50 text-neutral-700'
                    )}
                  >
                    <Icon className={isActive ? 'text-white' : undefined} />
                  </span>
                  {t(`accreditation.entityData.nav.${key}`)}
                </button>
              </DashboardTourStep>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
