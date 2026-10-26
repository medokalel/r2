import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Add, ArrowLeft, ArrowRight, TickCircle, Trash } from 'iconsax-reactjs'
import { AppIcon } from '@/components/icons'
import { SelectField, TextField } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { fieldInputClassName } from '@/components/ui/fieldStyles'
import { usePlatformFormat } from '@/components/platform/usePlatformFormat'
import { CopyField, ProviderMark, SsoSection, StatusChip } from '@/components/sso/SsoUi'
import { SsoTestPanel } from '@/components/sso/SsoTestPanel'
import {
  createSsoConnection,
  updateSsoConnection,
  verifiedDomainCount,
  verifySsoDomain,
  type SsoConnection,
  type SsoConnectionInput,
  type SsoGroupRule,
  type SsoOptions,
} from '@/lib/api/ssoApi'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { toast } from '@/lib/toast'
import {
  SSO_DEFAULT_ISSUER,
  SSO_DEFAULT_MAPPING,
  SSO_ISSUER_HINT,
  SSO_PROVIDER_PROTOCOL,
  SSO_PROVIDERS,
  domainProblem,
  missingForEnable,
  normalizeDomain,
  requireSsoProblem,
  type SsoProvider,
} from '@/lib/sso'
import { cn } from '@/lib/utils'

const STEPS = ['provider', 'idp', 'domains', 'users', 'security'] as const
export type SsoEditorStep = (typeof STEPS)[number]
type Step = SsoEditorStep

interface Draft {
  name: string
  provider: SsoProvider
  issuerUrl: string
  clientId: string
  clientSecret: string
  clearSecret: boolean
  scopes: string
  samlMetadataUrl: string
  samlMetadataXml: string
  samlIdpEntityId: string
  samlSsoUrl: string
  samlIdpCertificate: string
  domains: string[]
  attributeMapping: { email: string; name: string; groups: string }
  jitEnabled: boolean
  defaultRole: string | null
  groupRoleMapping: SsoGroupRule[]
  status: 'ENABLED' | 'DISABLED'
  requireSso: boolean
  breakGlassUserId: string | null
}

const draftOf = (c: SsoConnection | null, provider: SsoProvider): Draft => ({
  name: c?.name ?? '',
  provider: c?.provider ?? provider,
  issuerUrl: c?.issuerUrl ?? SSO_DEFAULT_ISSUER[provider] ?? '',
  clientId: c?.clientId ?? '',
  clientSecret: '',
  clearSecret: false,
  scopes: c?.scopes ?? 'openid email profile',
  samlMetadataUrl: c?.samlMetadataUrl ?? '',
  samlMetadataXml: '',
  samlIdpEntityId: c?.samlIdpEntityId ?? '',
  samlSsoUrl: c?.samlSsoUrl ?? '',
  samlIdpCertificate: c?.samlIdpCertificate ?? '',
  domains: c?.domains.map((d) => d.domain) ?? [],
  attributeMapping: c?.attributeMapping ?? { ...SSO_DEFAULT_MAPPING[provider] },
  jitEnabled: c?.jitEnabled ?? false,
  defaultRole: c?.defaultRole ?? null,
  groupRoleMapping: c?.groupRoleMapping ?? [],
  status: c?.status ?? 'DISABLED',
  requireSso: c?.requireSso ?? false,
  breakGlassUserId: c?.breakGlassUser?.id ?? null,
})

/** Body sent when a step is saved (only that step's fields). */
function payloadFor(step: Step, d: Draft): SsoConnectionInput {
  switch (step) {
    case 'provider':
      return { name: d.name.trim() }
    case 'idp':
      return SSO_PROVIDER_PROTOCOL[d.provider] === 'OIDC'
        ? {
            issuerUrl: d.issuerUrl.trim() || null,
            clientId: d.clientId.trim() || null,
            scopes: d.scopes.trim() || 'openid email profile',
            ...(d.clientSecret ? { clientSecret: d.clientSecret } : d.clearSecret ? { clientSecret: null } : {}),
          }
        : {
            samlMetadataUrl: d.samlMetadataUrl.trim() || null,
            ...(d.samlMetadataXml.trim() ? { samlMetadataXml: d.samlMetadataXml.trim() } : {}),
            samlIdpEntityId: d.samlIdpEntityId.trim() || null,
            samlSsoUrl: d.samlSsoUrl.trim() || null,
            samlIdpCertificate: d.samlIdpCertificate.trim() || null,
          }
    case 'domains':
      return { domains: d.domains }
    case 'users':
      return {
        attributeMapping: d.attributeMapping,
        jitEnabled: d.jitEnabled,
        defaultRole: d.defaultRole,
        groupRoleMapping: d.groupRoleMapping.filter((r) => r.group.trim()).map((r) => ({ group: r.group.trim(), role: r.role })),
      }
    case 'security':
      return { status: d.status, requireSso: d.requireSso, breakGlassUserId: d.breakGlassUserId }
  }
}

const textareaClass = cn(fieldInputClassName, 'min-h-[120px] w-full resize-y px-4 py-2.5 font-mono text-[13px]')

interface EditorProps {
  connection: SsoConnection | null
  provider: SsoProvider
  options: SsoOptions | null
  /** Step to open (default: identity provider for an existing connection, provider for a new one). */
  initialStep?: Step
  onSaved: (c: SsoConnection) => void
  onClose: () => void
}

/**
 * Create / edit wizard of one SSO connection: provider, identity provider values (with the exact
 * values to paste into the IdP), domains with DNS verification, users and roles, and security
 * (enable, Require SSO with a break-glass admin). Each step is saved on "Save and continue".
 */
export function SsoConnectionEditor({ connection: initial, provider: initialProvider, options, initialStep, onSaved, onClose }: EditorProps) {
  const { t } = useTranslation()
  const f = usePlatformFormat()
  const [connection, setConnection] = useState<SsoConnection | null>(initial)
  const [draft, setDraft] = useState<Draft>(() => draftOf(initial, initialProvider))
  const [step, setStep] = useState<Step>(initial ? initialStep ?? 'idp' : 'provider')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newDomain, setNewDomain] = useState('')
  const [verifying, setVerifying] = useState<string | null>(null)

  const protocol = SSO_PROVIDER_PROTOCOL[draft.provider]
  const index = STEPS.indexOf(step)
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const adopt = (c: SsoConnection) => {
    setConnection(c)
    onSaved(c)
    // Keep what is typed elsewhere; refresh the server-owned values.
    setDraft((d) => ({
      ...d,
      clientSecret: '',
      clearSecret: false,
      samlMetadataXml: '',
      samlIdpEntityId: c.samlIdpEntityId ?? d.samlIdpEntityId,
      samlSsoUrl: c.samlSsoUrl ?? d.samlSsoUrl,
      samlIdpCertificate: c.samlIdpCertificate ?? d.samlIdpCertificate,
      domains: c.domains.map((x) => x.domain),
      status: c.status,
    }))
  }

  const save = async (next: Step | 'close') => {
    setError(null)
    if (step === 'provider' && draft.name.trim().length < 2) {
      setError(t('sso.wizard.name'))
      return
    }
    setBusy(true)
    try {
      let saved: SsoConnection
      if (!connection) {
        saved = await createSsoConnection({ name: draft.name.trim(), provider: draft.provider })
        toast.success(t('sso.wizard.created'))
      } else {
        saved = await updateSsoConnection(connection.id, payloadFor(step, draft))
        toast.success(t('sso.wizard.saved'))
      }
      adopt(saved)
      if (next === 'close') onClose()
      else setStep(next)
    } catch (err) {
      setError(getUserErrorMessage(err, t))
    } finally {
      setBusy(false)
    }
  }

  const addDomain = () => {
    const problem = domainProblem(newDomain, draft.domains)
    if (problem) {
      setError(t(`sso.wizard.domain${problem[0].toUpperCase()}${problem.slice(1)}`))
      return
    }
    setError(null)
    set('domains', [...draft.domains, normalizeDomain(newDomain)])
    setNewDomain('')
  }

  const verify = async (domain: string) => {
    if (!connection) return
    setVerifying(domain)
    setError(null)
    try {
      const res = await verifySsoDomain(connection.id, domain)
      adopt(res.connection)
      if (res.verified) toast.success(t('sso.wizard.domainVerified', { domain }))
      else toast.warning(t('sso.wizard.domainNotVerified', { domain }), { description: res.domain.lastCheckError ?? undefined })
    } catch (err) {
      setError(getUserErrorMessage(err, t))
    } finally {
      setVerifying(null)
    }
  }

  const savedDomains = connection?.domains ?? []
  const unsavedDomains = draft.domains.some((d) => !savedDomains.find((s) => s.domain === d)) || savedDomains.some((s) => !draft.domains.includes(s.domain))
  const missing = missingForEnable({ protocol, ...draft })
  const verified = connection ? verifiedDomainCount(connection) : 0
  const requireProblem = requireSsoProblem({ breakGlassUserId: draft.breakGlassUserId, verifiedDomains: verified })
  const roleOptions = (options?.roles ?? ['CAB_ADMIN']).map((r) => ({ value: r, label: t(`sso.roles.${r}`, { defaultValue: r }) }))
  const NO_ACCESS = '__none__'

  return (
    <div className="flex min-w-0 flex-col gap-5" data-testid="sso-editor">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ProviderMark provider={draft.provider} />
          <div className="min-w-0">
            <h2 className="truncate text-body-lg font-semibold text-neutral-900">
              {connection ? t('sso.wizard.titleEdit', { name: connection.name }) : t('sso.wizard.titleNew')}
            </h2>
            <p className="text-caption text-neutral-600">{t('sso.wizard.stepOf', { current: index + 1, total: STEPS.length })}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          {t('sso.wizard.close')}
        </Button>
      </div>

      <ol className="flex gap-2 overflow-x-auto pb-1" aria-label={t('sso.wizard.stepOf', { current: index + 1, total: STEPS.length })}>
        {STEPS.map((s, i) => {
          const reachable = Boolean(connection) || i === 0
          return (
            <li key={s} className="shrink-0">
              <button
                type="button"
                disabled={!reachable || busy}
                onClick={() => setStep(s)}
                aria-current={s === step ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-full border px-3 py-1.5 text-body-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                  s === step ? 'border-primary bg-primary text-white' : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary/40',
                )}
              >
                <span className={cn('flex size-5 items-center justify-center rounded-full text-caption', s === step ? 'bg-white/20' : 'bg-neutral-100')}>{i + 1}</span>
                {t(`sso.wizard.steps.${s}`)}
              </button>
            </li>
          )
        })}
      </ol>

      {step === 'provider' && (
        <SsoSection title={t('sso.wizard.steps.provider')}>
          <TextField id="sso-name" label={t('sso.wizard.name')} placeholder={t('sso.wizard.namePlaceholder')} value={draft.name} onChange={(e) => set('name', e.target.value)} required />
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-body-sm font-semibold text-neutral-800">{t('sso.wizard.chooseProvider')}</legend>
            {connection && <p className="text-caption text-neutral-600">{t('sso.wizard.protocolLocked')}</p>}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {SSO_PROVIDERS.map((p) => {
                const active = draft.provider === p
                return (
                  <label
                    key={p}
                    className={cn(
                      'flex min-w-0 cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                      active ? 'border-primary bg-primary-25' : 'border-neutral-200 bg-white hover:border-primary/40',
                      connection && !active && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <input
                      type="radio"
                      name="sso-provider"
                      className="sr-only"
                      checked={active}
                      disabled={Boolean(connection)}
                      onChange={() =>
                        setDraft((d) => ({ ...d, provider: p, issuerUrl: SSO_DEFAULT_ISSUER[p] ?? '', attributeMapping: { ...SSO_DEFAULT_MAPPING[p] } }))
                      }
                    />
                    <ProviderMark provider={p} size={36} />
                    <span className="min-w-0">
                      <span className="block text-body-sm font-semibold text-neutral-900">{t(`sso.providers.${p}`)}</span>
                      <span className="block text-caption text-neutral-600">{t(`sso.providerHints.${p}`)}</span>
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        </SsoSection>
      )}

      {step === 'idp' && connection && (
        <>
          <SsoSection title={t('sso.wizard.pasteTitle')} hint={protocol === 'OIDC' ? t('sso.wizard.pasteHintOidc') : t('sso.wizard.pasteHintSaml')}>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {protocol === 'OIDC' ? (
                <>
                  <CopyField label={t('sso.wizard.redirectUri')} value={connection.sp.redirectUri} />
                  <CopyField label={t('sso.wizard.loginUrl')} value={connection.sp.loginUrl} />
                </>
              ) : (
                <>
                  <CopyField label={t('sso.wizard.acsUrl')} value={connection.sp.acsUrl} />
                  <CopyField label={t('sso.wizard.entityId')} value={connection.sp.entityId} />
                  <CopyField label={t('sso.wizard.metadataUrl')} value={connection.sp.metadataUrl} />
                  <CopyField label={t('sso.wizard.loginUrl')} value={connection.sp.loginUrl} />
                </>
              )}
            </div>
            <details className="rounded-md bg-neutral-25 px-3 py-2">
              <summary className="cursor-pointer text-body-sm font-semibold text-primary">{t('sso.wizard.guideTitle', { provider: t(`sso.providers.${draft.provider}`) })}</summary>
              <ol className="mt-2 list-decimal space-y-1 ps-5 text-body-sm text-neutral-700">
                {[1, 2, 3, 4].map((n) => (
                  <li key={n}>{t(`sso.wizard.guide.${draft.provider}${n}`)}</li>
                ))}
              </ol>
            </details>
          </SsoSection>
          <SsoSection title={t('sso.wizard.fromIdp')}>
            {protocol === 'OIDC' ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <TextField id="sso-issuer" dir="ltr" label={t('sso.wizard.issuerUrl')} placeholder={SSO_ISSUER_HINT[draft.provider]} value={draft.issuerUrl} onChange={(e) => set('issuerUrl', e.target.value)} required />
                </div>
                <TextField id="sso-client-id" dir="ltr" label={t('sso.wizard.clientId')} value={draft.clientId} onChange={(e) => set('clientId', e.target.value)} required />
                <div>
                  <TextField id="sso-client-secret" type="password" autoComplete="new-password" label={t('sso.wizard.clientSecret')} value={draft.clientSecret} onChange={(e) => set('clientSecret', e.target.value)} />
                  {connection.hasSecret && (
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-caption text-neutral-600">{t('sso.wizard.secretStored')}</span>
                      <label className="flex items-center gap-1.5 text-caption text-neutral-700">
                        <input type="checkbox" checked={draft.clearSecret} onChange={(e) => set('clearSecret', e.target.checked)} />
                        {t('sso.wizard.secretClear')}
                      </label>
                    </div>
                  )}
                </div>
                <div className="lg:col-span-2">
                  <TextField id="sso-scopes" dir="ltr" label={t('sso.wizard.scopes')} value={draft.scopes} onChange={(e) => set('scopes', e.target.value)} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-body-sm text-neutral-600">{t('sso.wizard.metadataHint')}</p>
                <TextField id="sso-md-url" dir="ltr" label={t('sso.wizard.samlMetadataUrl')} placeholder="https://" value={draft.samlMetadataUrl} onChange={(e) => set('samlMetadataUrl', e.target.value)} />
                <div>
                  <label htmlFor="sso-md-xml" className="text-body-sm font-semibold text-neutral-800">
                    {t('sso.wizard.samlMetadataXml')}
                  </label>
                  <textarea id="sso-md-xml" dir="ltr" className={cn(textareaClass, 'mt-1')} value={draft.samlMetadataXml} onChange={(e) => set('samlMetadataXml', e.target.value)} placeholder="<EntityDescriptor ...>" />
                  {connection.hasSamlMetadataXml && <p className="mt-1 text-caption text-neutral-600">{t('sso.wizard.metadataStored')}</p>}
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <TextField id="sso-idp-entity" dir="ltr" label={t('sso.wizard.samlIdpEntityId')} value={draft.samlIdpEntityId} onChange={(e) => set('samlIdpEntityId', e.target.value)} />
                  <TextField id="sso-idp-url" dir="ltr" label={t('sso.wizard.samlSsoUrl')} value={draft.samlSsoUrl} onChange={(e) => set('samlSsoUrl', e.target.value)} />
                </div>
                <div>
                  <label htmlFor="sso-idp-cert" className="text-body-sm font-semibold text-neutral-800">
                    {t('sso.wizard.samlIdpCertificate')}
                  </label>
                  <textarea id="sso-idp-cert" dir="ltr" className={cn(textareaClass, 'mt-1')} value={draft.samlIdpCertificate} onChange={(e) => set('samlIdpCertificate', e.target.value)} placeholder="-----BEGIN CERTIFICATE-----" />
                </div>
              </div>
            )}
          </SsoSection>
        </>
      )}

      {step === 'domains' && connection && (
        <SsoSection title={t('sso.wizard.steps.domains')} hint={t('sso.wizard.domainsHint')}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
              <TextField
                id="sso-new-domain"
                dir="ltr"
                aria-label={t('sso.wizard.addDomain')}
                placeholder={t('sso.wizard.domainPlaceholder')}
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addDomain()
                  }
                }}
              />
            </div>
            <Button variant="secondary" size="md" className="h-14" onClick={addDomain} disabled={!newDomain.trim()} icon={<AppIcon icon={Add} size={18} />}>
              {t('sso.wizard.addDomain')}
            </Button>
          </div>
          {draft.domains.length === 0 && <p className="text-body-sm text-neutral-600">{t('sso.card.noDomains')}</p>}
          <ul className="flex flex-col gap-3">
            {draft.domains.map((domain) => {
              const saved = savedDomains.find((d) => d.domain === domain)
              return (
                <li key={domain} className="min-w-0 rounded-lg border border-neutral-100 p-3 sm:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="break-all text-body font-semibold text-neutral-900" dir="ltr">
                        {domain}
                      </span>
                      {saved?.verified ? (
                        <StatusChip tone="success">
                          <AppIcon icon={TickCircle} size={14} />
                          {t('sso.card.verified')}
                        </StatusChip>
                      ) : (
                        <StatusChip tone="warning">{t('sso.card.pending')}</StatusChip>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {saved && !saved.verified && (
                        <Button variant="primary" size="sm" onClick={() => void verify(domain)} disabled={verifying !== null || unsavedDomains}>
                          {verifying === domain ? t('sso.wizard.verifying') : t('sso.wizard.verify')}
                        </Button>
                      )}
                      <Button variant="tertiary" size="sm" onClick={() => set('domains', draft.domains.filter((d) => d !== domain))} icon={<AppIcon icon={Trash} size={16} />}>
                        {t('sso.common.remove')}
                      </Button>
                    </div>
                  </div>
                  {saved ? (
                    saved.verified ? (
                      <p className="mt-2 text-caption text-neutral-600">{t('sso.wizard.verifiedOn', { date: f.date(saved.verifiedAt) })}</p>
                    ) : (
                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,2fr)]">
                        <CopyField label={t('sso.wizard.txtHost')} value={saved.txtRecord.host} />
                        <div className="min-w-0">
                          <p className="text-caption font-semibold text-neutral-700">{t('sso.wizard.txtType')}</p>
                          <p className="mt-1 rounded-md border border-neutral-200 bg-neutral-25 px-3 py-2 font-mono text-[13px]">TXT</p>
                        </div>
                        <CopyField label={t('sso.wizard.txtValue')} value={saved.txtRecord.value} />
                        {saved.lastCheckError && <p className="text-caption text-warning-800 md:col-span-3">{saved.lastCheckError}</p>}
                      </div>
                    )
                  ) : (
                    <p className="mt-2 text-caption text-neutral-600">{t('sso.wizard.unsavedDomains')}</p>
                  )}
                </li>
              )
            })}
          </ul>
          {unsavedDomains && (
            <div>
              <Button variant="primary" size="md" onClick={() => void save('domains')} disabled={busy}>
                {t('sso.wizard.save')}
              </Button>
            </div>
          )}
        </SsoSection>
      )}

      {step === 'users' && connection && (
        <>
          <SsoSection title={t('sso.wizard.attrTitle')} hint={t('sso.wizard.attrHint')}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {(['email', 'name', 'groups'] as const).map((k) => (
                <TextField
                  key={k}
                  id={`sso-attr-${k}`}
                  dir="ltr"
                  label={t(`sso.wizard.attr${k[0].toUpperCase()}${k.slice(1)}`)}
                  value={draft.attributeMapping[k]}
                  onChange={(e) => set('attributeMapping', { ...draft.attributeMapping, [k]: e.target.value })}
                />
              ))}
            </div>
          </SsoSection>
          <SsoSection title={t('sso.wizard.jit')} hint={t('sso.wizard.jitHint')} actions={<Toggle checked={draft.jitEnabled} onChange={(v) => set('jitEnabled', v)} aria-label={t('sso.wizard.jit')} size="sm" />}>
            <SelectField
              id="sso-default-role"
              label={t('sso.wizard.defaultRole')}
              value={draft.defaultRole ?? NO_ACCESS}
              onChange={(v) => set('defaultRole', v === NO_ACCESS ? null : v)}
              options={[...roleOptions, { value: NO_ACCESS, label: t('sso.wizard.noAccess') }]}
            />
          </SsoSection>
          <SsoSection
            title={t('sso.wizard.rulesTitle')}
            hint={t('sso.wizard.rulesHint')}
            actions={
              <Button variant="secondary" size="sm" icon={<AppIcon icon={Add} size={16} />} onClick={() => set('groupRoleMapping', [...draft.groupRoleMapping, { group: '', role: roleOptions[0]?.value ?? 'CAB_ADMIN' }])}>
                {t('sso.wizard.addRule')}
              </Button>
            }
          >
            {draft.groupRoleMapping.length === 0 && <p className="text-body-sm text-neutral-600">{t('sso.wizard.noRules')}</p>}
            {draft.groupRoleMapping.map((rule, i) => (
              <div key={i} className="grid grid-cols-1 items-end gap-3 rounded-md border border-neutral-100 p-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
                <TextField
                  id={`sso-rule-group-${i}`}
                  dir="ltr"
                  label={t('sso.wizard.group')}
                  value={rule.group}
                  onChange={(e) => set('groupRoleMapping', draft.groupRoleMapping.map((r, j) => (j === i ? { ...r, group: e.target.value } : r)))}
                />
                <SelectField
                  id={`sso-rule-role-${i}`}
                  label={t('sso.wizard.role')}
                  value={rule.role}
                  onChange={(v) => set('groupRoleMapping', draft.groupRoleMapping.map((r, j) => (j === i ? { ...r, role: v } : r)))}
                  options={roleOptions}
                />
                <Button variant="tertiary" size="sm" className="h-14" icon={<AppIcon icon={Trash} size={16} />} onClick={() => set('groupRoleMapping', draft.groupRoleMapping.filter((_, j) => j !== i))}>
                  {t('sso.common.remove')}
                </Button>
              </div>
            ))}
          </SsoSection>
        </>
      )}

      {step === 'security' && connection && (
        <>
          <SsoTestPanel connection={connection} onUpdated={adopt} />
          <SsoSection
            title={t('sso.wizard.statusTitle')}
            hint={t('sso.wizard.statusHint')}
            actions={
              <Toggle
                checked={draft.status === 'ENABLED'}
                onChange={(v) => set('status', v ? 'ENABLED' : 'DISABLED')}
                label={t(`sso.status.${draft.status}`)}
                width={120}
                disabled={draft.status === 'DISABLED' && missing.length > 0}
              />
            }
          >
            {missing.length > 0 && (
              <p className="text-body-sm text-warning-800">{t('sso.wizard.missing', { fields: missing.map((m) => t(`sso.wizard.${m}`)).join(', ') })}</p>
            )}
          </SsoSection>
          <SsoSection
            title={t('sso.wizard.requireTitle')}
            hint={t('sso.wizard.requireHint')}
            actions={<Toggle checked={draft.requireSso} onChange={(v) => set('requireSso', v)} aria-label={t('sso.wizard.requireTitle')} size="sm" disabled={!draft.requireSso && requireProblem === 'domain'} />}
          >
            <SelectField
              id="sso-break-glass"
              label={t('sso.wizard.breakGlass')}
              placeholder={t('sso.wizard.chooseAdmin')}
              value={draft.breakGlassUserId ?? ''}
              onChange={(v) => set('breakGlassUserId', v || null)}
              options={(options?.admins ?? []).map((a) => ({ value: a.id, label: `${a.name} (${a.email})` }))}
            />
            <p className="text-caption text-neutral-600">{t('sso.wizard.breakGlassHint')}</p>
            {draft.requireSso && requireProblem && (
              <p className="text-body-sm text-warning-800">{requireProblem === 'domain' ? t('sso.wizard.requireNeedsDomain') : t('sso.wizard.requireNeedsAdmin')}</p>
            )}
            {!draft.requireSso && requireProblem === 'domain' && <p className="text-caption text-neutral-600">{t('sso.wizard.requireNeedsDomain')}</p>}
            {draft.requireSso && !requireProblem && connection.lastTest?.status !== 'SUCCESS' && <p className="text-body-sm text-warning-800">{t('sso.wizard.requireWarning')}</p>}
          </SsoSection>
        </>
      )}

      {error && (
        <p role="alert" className="whitespace-pre-line rounded-md border border-error-100 bg-error-50 px-3 py-2 text-body-sm text-error-700">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 pt-4 sm:flex-row sm:justify-between">
        <Button variant="outline" size="md" disabled={index === 0 || busy} onClick={() => setStep(STEPS[index - 1])} icon={<AppIcon icon={ArrowLeft} size={18} className="rtl-flip" />}>
          {t('sso.wizard.back')}
        </Button>
        {index < STEPS.length - 1 ? (
          <Button variant="primary" size="md" disabled={busy} onClick={() => void save(STEPS[index + 1])} aria-busy={busy || undefined}>
            {t('sso.wizard.next')}
            <AppIcon icon={ArrowRight} size={18} className="rtl-flip" />
          </Button>
        ) : (
          <Button variant="primary" size="md" disabled={busy} onClick={() => void save('close')} aria-busy={busy || undefined}>
            {t('sso.wizard.finish')}
          </Button>
        )}
      </div>
    </div>
  )
}
