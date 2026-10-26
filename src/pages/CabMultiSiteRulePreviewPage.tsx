import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { ApplicationStepper } from '@/components/dashboard/cab/ApplicationStepper'
import { DashboardFooter } from '@/components/dashboard/DashboardFooter'
import { MultiSiteRulePreview } from '@/components/dashboard/cab/MultiSiteRulePreview'
import type { MultiSiteRuleResult } from '@/lib/multiSiteRuleForm'
import { peekPendingMultiSiteRule } from '@/lib/applicationDraftSession'

/** Reached from ApplyMultiSiteRulePage on "Apply Rule" (via the pending
 *  sessionStorage round trip), or from SitesFacilitiesStep's/Review &
 *  Confirm's "View Preview"/"View Details" links (via router state) once a
 *  rule has already been applied. Router-state visits are read-only — Back
 *  and Confirm both just return to the draft page instead of dropping the
 *  user into the rule-editing wizard, since they never asked to edit it. */
export function CabMultiSiteRulePreviewPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const routerStateRule = (location.state as { multiSiteRule?: MultiSiteRuleResult } | null)?.multiSiteRule
  const viewOnly = Boolean(routerStateRule)
  const [multiSiteRule] = useState<MultiSiteRuleResult | null>(
    () => routerStateRule ?? peekPendingMultiSiteRule()
  )

  // Nothing to preview (e.g. a direct/refreshed visit to this URL) — send
  // the user back to build the rule instead of rendering an empty page.
  useEffect(() => {
    if (!multiSiteRule) {
      navigate('/cab/applications/draft/sites/multi-site-rule', { replace: true })
    }
  }, [multiSiteRule, navigate])

  if (!multiSiteRule) return null

  return (
    <CabLayout>
      <CabHeader title={t('cab.applicationDraft.title')} notificationCount={3} />

      <div className="flex flex-1 flex-col gap-5 overflow-auto page-main">
        <ApplicationStepper current={viewOnly ? 5 : 3} />
        <MultiSiteRulePreview multiSiteRule={multiSiteRule} />
      </div>

      <DashboardFooter
        onBack={() =>
          navigate(viewOnly ? '/cab/applications/draft' : '/cab/applications/draft/sites/multi-site-rule')
        }
        backDisabled={false}
        onNext={() => navigate('/cab/applications/draft')}
        nextLabel={t('common.confirm')}
      />
    </CabLayout>
  )
}