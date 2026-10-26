import { useTranslation } from 'react-i18next'
import { Activity, Edit2, Lock1, Profile2User, TickCircle, Trash } from 'iconsax-reactjs'
import { AppIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { usePlatformFormat } from '@/components/platform/usePlatformFormat'
import { ProviderMark, StatusChip } from '@/components/sso/SsoUi'
import type { SsoConnection } from '@/lib/api/ssoApi'
import { missingForEnable } from '@/lib/sso'

interface CardProps {
  connection: SsoConnection
  busy: boolean
  onEdit: () => void
  onTest: () => void
  onToggle: (enabled: boolean) => void
  onDelete: () => void
}

/** One SSO connection in the list: status, domains, provisioning / enforcement, last test and actions. */
export function SsoConnectionCard({ connection: c, busy, onEdit, onTest, onToggle, onDelete }: CardProps) {
  const { t } = useTranslation()
  const f = usePlatformFormat()
  const incomplete = missingForEnable(c).length > 0

  return (
    <article className="flex min-w-0 flex-col gap-4 rounded-lg border border-neutral-100 bg-white p-4 sm:p-5" data-testid="sso-connection-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ProviderMark provider={c.provider} size={44} />
          <div className="min-w-0">
            <h3 className="truncate text-body font-semibold text-neutral-900">{c.name}</h3>
            <p className="text-caption text-neutral-600">
              {t(`sso.providers.${c.provider}`)} · {c.protocol === 'OIDC' ? 'OpenID Connect' : 'SAML 2.0'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusChip tone={c.status === 'ENABLED' ? 'success' : 'neutral'}>{t(`sso.status.${c.status}`)}</StatusChip>
          <Toggle
            size="sm"
            checked={c.status === 'ENABLED'}
            onChange={onToggle}
            disabled={busy || (c.status === 'DISABLED' && incomplete)}
            aria-label={c.status === 'ENABLED' ? t('sso.card.disable') : t('sso.card.enable')}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-caption font-semibold text-neutral-700">{t('sso.card.domains')}</p>
        {c.domains.length === 0 ? (
          <p className="text-body-sm text-neutral-600">{t('sso.card.noDomains')}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {c.domains.map((d) => (
              <li key={d.id} className="inline-flex min-w-0 items-center gap-1.5 rounded-sm border border-neutral-200 px-2 py-1 text-body-sm">
                <span dir="ltr" className="break-all">
                  {d.domain}
                </span>
                {d.verified ? (
                  <span className="inline-flex items-center gap-1 text-caption text-success-700">
                    <AppIcon icon={TickCircle} size={14} />
                    {t('sso.card.verified')}
                  </span>
                ) : (
                  <span className="text-caption text-warning-800">{t('sso.card.pending')}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {c.jitEnabled && (
          <StatusChip tone="info">
            <AppIcon icon={Profile2User} size={14} />
            {t('sso.card.jit')}
          </StatusChip>
        )}
        {c.requireSso && (
          <StatusChip tone="warning">
            <AppIcon icon={Lock1} size={14} />
            {t('sso.card.required')}
          </StatusChip>
        )}
        {c.requireSso && c.breakGlassUser && <StatusChip tone="neutral">{t('sso.card.breakGlass', { name: c.breakGlassUser.name })}</StatusChip>}
      </div>

      <dl className="grid grid-cols-1 gap-3 text-body-sm sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-caption font-medium text-neutral-600">{t('sso.card.lastTest')}</dt>
          <dd className="mt-0.5 flex flex-wrap items-center gap-2 text-neutral-900">
            {c.lastTest ? (
              <>
                <StatusChip tone={c.lastTest.status === 'SUCCESS' ? 'success' : 'error'}>{t(`sso.test.${c.lastTest.status}`)}</StatusChip>
                <span>{f.dateTime(c.lastTest.at)}</span>
              </>
            ) : (
              t('sso.common.never')
            )}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-caption font-medium text-neutral-600">{t('sso.card.lastLogin')}</dt>
          <dd className="mt-0.5 text-neutral-900">{c.lastLoginAt ? f.dateTime(c.lastLoginAt) : t('sso.common.never')}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
        <Button variant="primary" size="sm" onClick={onEdit} icon={<AppIcon icon={Edit2} size={16} />}>
          {t('sso.card.edit')}
        </Button>
        <Button variant="secondary" size="sm" onClick={onTest} disabled={incomplete} icon={<AppIcon icon={Activity} size={16} />}>
          {t('sso.card.test')}
        </Button>
        <Button variant="tertiary" size="sm" onClick={onDelete} className="text-error-600" icon={<AppIcon icon={Trash} size={16} />}>
          {t('sso.card.delete')}
        </Button>
      </div>
    </article>
  )
}
