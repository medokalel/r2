import type { OrgScopeCategory } from '@/lib/api/onboardingOrgScopeApi'
import { AppIcon } from '@/components/icons'
import { ORG_SCOPE_CATEGORY_ICONS } from './orgScopeCategoryIcons'

interface OrgScopeCategoryIconProps {
  category: OrgScopeCategory
  size?: number
  className?: string
}

export function OrgScopeCategoryIcon({ category, size = 20, className = 'text-primary' }: OrgScopeCategoryIconProps) {
  const Icon = ORG_SCOPE_CATEGORY_ICONS[category]
  return <AppIcon icon={Icon} size={size} className={className} />
}
