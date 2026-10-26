import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Login } from 'iconsax-reactjs'
import { AppIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/Select'
import { ConfirmActionDialog } from '@/components/dashboard/ConfirmActionDialog'
import { ActivityItem } from '@/components/platform/ActivityItem'
import { ImpersonateDialog } from '@/components/platform/ImpersonateDialog'
import { InvoiceTable } from '@/components/platform/InvoiceTable'
import {
  Card,
  DataTable,
  EmptyState,
  ErrorBlock,
  FieldLabel,
  KeyValue,
  LoadingBlock,
  MobileCard,
  MobileCards,
  PageHeader,
  PlanBadge,
  SubscriptionStatusBadge,
} from '@/components/platform/PlatformUi'
import { cellClass, inputClassName, rowClass, textareaClassName } from '@/components/platform/platformStyles'
import { usePlatformFormat } from '@/components/platform/usePlatformFormat'
import { useLoader } from '@/components/platform/useLoader'
import { UsageMeter } from '@/components/subscription/UsageMeter'
import {
  changeTenantStatus,
  confirmTenantDeletion,
  generatePlatformInvoices,
  getTenant,
  listPlans,
  patchTenantSubscription,
  putTenantFeatures,
} from '@/lib/api/platformApi'
import type { BillingCycle, FeatureKey, StatusAction, SubscriptionStatus, TenantDetail } from '@/lib/api/platformTypes'
import { getPlatformRole } from '@/lib/authStorage'
import { countryName } from '@/lib/countries'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { PLATFORM_ROUTES, type TenantTab } from '@/lib/platformRoutes'
import { platformCan } from '@/lib/subscriptionFeatures'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { notSet } from '@/lib/emptyValue'
import { pageTabClassName, pageTabListClassName } from '@/components/ui/pageTabs'

const STATUS_ACTIONS: Record<SubscriptionStatus, StatusAction[]> = {
  TRIAL: ['activate', 'suspend', 'cancel'],
  ACTIVE: ['suspend', 'cancel'],
  PAST_DUE: ['reactivate', 'suspend', 'cancel'],
  SUSPENDED: ['reactivate', 'cancel'],
  CANCELLED: ['reactivate'],
  EXPIRED: ['activate'],
}

/* ── Overview ───────────────────────────────────────────────────────── */

function OverviewTab({ tenant, canDelete, onDelete }: { tenant: TenantDetail; canDelete: boolean; onDelete: () => void }) {
  const { t, i18n } = useTranslation()
  const f = usePlatformFormat()
  const sub = tenant.subscription
  const [now] = useState(() => Date.now())
  const deletionDue = sub.deletionDueAt && new Date(sub.deletionDueAt).getTime() <= now
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <Card title={t('platform.tenant.profile')}>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KeyValue label={t('platform.tenant.slug')}><span dir="ltr">{tenant.slug}</span></KeyValue>
          <KeyValue label={t('platform.tenantCreate.country')}>{countryName(tenant.country, i18n.language?.startsWith('ar') ? 'ar' : 'en')}</KeyValue>
          <KeyValue label={t('platform.tenant.customerSince')}>{f.date(tenant.createdAt)}</KeyValue>
          <KeyValue label={t('platform.common.plan')}>{tenant.plan.name}</KeyValue>
          <KeyValue label={t('platform.common.billingCycle')}>{t(`platform.cycle.${tenant.billingCycle}`)}</KeyValue>
          <KeyValue label={t('platform.tenant.periodEnd')}>{f.date(tenant.currentPeriodEnd)}</KeyValue>
          {sub.trialEndsAt && <KeyValue label={t('platform.tenant.trialEnds')}>{f.date(sub.trialEndsAt)}</KeyValue>}
          {sub.cancelledAt && <KeyValue label={t('platform.tenant.cancelledAt')}>{f.date(sub.cancelledAt)}</KeyValue>}
          {sub.quarantineUntil && <KeyValue label={t('platform.tenant.quarantineUntil')}>{f.date(sub.quarantineUntil)}</KeyValue>}
          {sub.deletionDueAt && <KeyValue label={t('platform.tenant.deletionDue')}>{f.date(sub.deletionDueAt)}</KeyValue>}
          <KeyValue label={t('platform.tenant.onboardingFee')}>
            {sub.onboardingFeeWaived ? t('platform.tenant.waived', { reason: sub.waiverReason ?? notSet() }) : t('platform.tenant.charged')}
          </KeyValue>
        </dl>
        {sub.notes && <p className="mt-4 rounded-md bg-neutral-25 px-3 py-2 text-body-sm text-neutral-700">{sub.notes}</p>}
        {canDelete && sub.deletionDueAt && (
          <div className="mt-5 flex flex-col gap-3 rounded-lg border border-error-100 bg-error-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-body-sm text-error-700">
              {deletionDue ? t('platform.tenant.deletionReady') : t('platform.tenant.deletionWaiting', { date: f.date(sub.deletionDueAt) })}
            </p>
            <Button type="button" variant="destructive" size="sm" disabled={!deletionDue} onClick={onDelete}>
              {t('platform.tenant.deleteNow')}
            </Button>
          </div>
        )}
      </Card>
      <Card title={t('platform.tenant.usage')}>
        <div className="flex flex-col gap-5">
          <UsageMeter label={t('platform.tenants.col.users')} used={tenant.usage.users.used} limit={tenant.usage.users.limit} />
          <UsageMeter label={t('platform.tenants.col.certificates')} used={tenant.usage.certificates.active} limit={tenant.usage.certificates.limit} />
          <KeyValue label={t('platform.tenants.col.outstanding')}>
            <span dir="ltr" className={tenant.outstandingUsd > 0 ? 'font-semibold text-error-600' : ''}>{tenant.outstandingUsd > 0 ? f.usd(tenant.outstandingUsd) : notSet()}</span>
          </KeyValue>
        </div>
      </Card>
    </div>
  )
}

/* ── Subscription ───────────────────────────────────────────────────── */

function SubscriptionTab({ tenant, canEdit, onSaved, onStatus }: { tenant: TenantDetail; canEdit: boolean; onSaved: (t: TenantDetail) => void; onStatus: (action: StatusAction) => void }) {
  const { t } = useTranslation()
  const f = usePlatformFormat()
  const plans = useLoader(listPlans, [])
  const sub = tenant.subscription
  const [planId, setPlanId] = useState(sub.planId)
  const [cycle, setCycle] = useState<BillingCycle>(sub.billingCycle)
  const [extraUsers, setExtraUsers] = useState(String(sub.extraUsers))
  const [userOverride, setUserOverride] = useState(sub.userLimitOverride == null ? '' : String(sub.userLimitOverride))
  const [certOverride, setCertOverride] = useState(sub.certificateLimitOverride == null ? '' : String(sub.certificateLimitOverride))
  const [notes, setNotes] = useState(sub.notes ?? '')
  const [confirming, setConfirming] = useState(false)

  const intOrNull = (v: string) => (v.trim() === '' ? null : Number(v))
  const wholeOk = (v: string, allowEmpty: boolean) => (v.trim() === '' ? allowEmpty : Number.isInteger(Number(v)) && Number(v) >= 0)
  const valid = wholeOk(extraUsers, false) && wholeOk(userOverride, true) && wholeOk(certOverride, true)
  const dirty =
    planId !== sub.planId ||
    cycle !== sub.billingCycle ||
    Number(extraUsers) !== sub.extraUsers ||
    intOrNull(userOverride) !== sub.userLimitOverride ||
    intOrNull(certOverride) !== sub.certificateLimitOverride ||
    (notes.trim() || null) !== (sub.notes || null)

  const planOptions = (plans.data ?? []).filter((p) => p.isActive || p.id === sub.planId).map((p) => ({ value: p.id, label: p.name }))
  const actions = STATUS_ACTIONS[tenant.status] ?? []

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <Card title={t('platform.tenant.subscriptionSettings')}>
        <form
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (dirty && valid) setConfirming(true)
          }}
        >
          <div className="flex flex-col gap-2">
            <FieldLabel>{t('platform.common.plan')}</FieldLabel>
            <SelectField value={planId} onChange={setPlanId} options={planOptions.length ? planOptions : [{ value: sub.planId, label: tenant.plan.name }]} disabled={!canEdit} />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel>{t('platform.common.billingCycle')}</FieldLabel>
            <SelectField value={cycle} onChange={(v) => setCycle(v as BillingCycle)} options={(['MONTHLY', 'YEARLY'] as const).map((c) => ({ value: c, label: t(`platform.cycle.${c}`) }))} disabled={!canEdit} />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="s-extra">{t('platform.common.extraUsers')}</FieldLabel>
            <input id="s-extra" type="number" min={0} dir="ltr" className={inputClassName} value={extraUsers} onChange={(e) => setExtraUsers(e.target.value)} disabled={!canEdit} />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="s-uo">{t('platform.tenant.userLimitOverride')}</FieldLabel>
            <input id="s-uo" type="number" min={0} dir="ltr" placeholder={t('platform.tenant.followPlan')} className={inputClassName} value={userOverride} onChange={(e) => setUserOverride(e.target.value)} disabled={!canEdit} />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="s-co">{t('platform.tenant.certificateLimitOverride')}</FieldLabel>
            <input id="s-co" type="number" min={0} dir="ltr" placeholder={t('platform.tenant.followPlan')} className={inputClassName} value={certOverride} onChange={(e) => setCertOverride(e.target.value)} disabled={!canEdit} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <FieldLabel htmlFor="s-notes">{t('platform.tenant.notes')}</FieldLabel>
            <textarea id="s-notes" rows={3} className={textareaClassName} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={!canEdit} maxLength={2000} />
          </div>
          {!valid && <p className="text-caption text-error-600 sm:col-span-2">{t('platform.form.wholeNumber')}</p>}
          {canEdit && (
            <div className="flex justify-end sm:col-span-2">
              <Button type="submit" variant="primary" size="sm" disabled={!dirty || !valid}>
                {t('platform.common.saveChanges')}
              </Button>
            </div>
          )}
        </form>
      </Card>
      <div className="flex min-w-0 flex-col gap-5">
        <Card title={t('platform.tenant.limits')}>
          <table className="w-full text-body-sm">
            <thead className="text-neutral-600">
              <tr>
                <th className="pb-2 text-start font-medium" />
                <th className="pb-2 text-end font-medium">{t('platform.tenant.limitPlan')}</th>
                <th className="pb-2 text-end font-medium">{t('platform.tenant.limitOverride')}</th>
                <th className="pb-2 text-end font-medium">{t('platform.tenant.limitEffective')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-neutral-100">
                <td className="py-2">{t('platform.tenants.col.users')}</td>
                <td className="py-2 text-end" dir="ltr">
                  {tenant.limits.users.plan}
                  {tenant.limits.users.extra > 0 ? ` + ${tenant.limits.users.extra}` : ''}
                </td>
                <td className="py-2 text-end" dir="ltr">{tenant.limits.users.override ?? notSet()}</td>
                <td className="py-2 text-end font-semibold" dir="ltr">{tenant.limits.users.effective}</td>
              </tr>
              <tr className="border-t border-neutral-100">
                <td className="py-2">{t('platform.tenants.col.certificatesShort')}</td>
                <td className="py-2 text-end" dir="ltr">{tenant.limits.certificates.plan ?? '∞'}</td>
                <td className="py-2 text-end" dir="ltr">{tenant.limits.certificates.override ?? notSet()}</td>
                <td className="py-2 text-end font-semibold" dir="ltr">{tenant.limits.certificates.effective ?? '∞'}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-caption text-neutral-600">{t('platform.tenant.periodEndOn', { date: f.date(sub.currentPeriodEnd) })}</p>
        </Card>
        {canEdit && actions.length > 0 && (
          <Card title={t('platform.tenant.statusActions')}>
            <p className="mb-3 text-body-sm text-neutral-600">{t('platform.tenant.statusActionsHint')}</p>
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <Button key={action} type="button" size="sm" variant={action === 'cancel' || action === 'suspend' ? 'destructive' : 'primary'} onClick={() => onStatus(action)}>
                  {t(`platform.tenant.actions.${action}`)}
                </Button>
              ))}
            </div>
          </Card>
        )}
      </div>
      <ConfirmActionDialog
        open={confirming}
        title={t('platform.tenant.confirmChangeTitle')}
        description={t('platform.tenant.confirmChangeBody')}
        confirmLabel={t('platform.common.saveChanges')}
        reason={{ label: t('platform.common.reason'), required: true }}
        onClose={() => setConfirming(false)}
        onConfirm={async (reason) => {
          try {
            const updated = await patchTenantSubscription(tenant.id, {
              planId: planId !== sub.planId ? planId : undefined,
              billingCycle: cycle !== sub.billingCycle ? cycle : undefined,
              extraUsers: Number(extraUsers),
              userLimitOverride: intOrNull(userOverride),
              certificateLimitOverride: intOrNull(certOverride),
              notes: notes.trim(),
              reason,
            })
            toast.success(t('platform.tenant.saved'))
            onSaved(updated)
          } catch (error) {
            throw new Error(getUserErrorMessage(error, t), { cause: error })
          }
        }}
      />
    </div>
  )
}

/* ── Features ───────────────────────────────────────────────────────── */

type Tri = 'plan' | 'on' | 'off'
const triOf = (v: boolean | null): Tri => (v === null ? 'plan' : v ? 'on' : 'off')

function ThreeStateToggle({ value, onChange, disabled, label }: { value: Tri; onChange: (v: Tri) => void; disabled: boolean; label: string }) {
  const { t } = useTranslation()
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex shrink-0 overflow-hidden rounded-md border border-neutral-100 bg-white">
      {(['plan', 'on', 'off'] as const).map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          disabled={disabled}
          onClick={() => onChange(option)}
          className={cn(
            'h-8 px-3 text-caption font-medium transition-colors disabled:cursor-not-allowed',
            value === option
              ? option === 'on'
                ? 'bg-success-500 text-white'
                : option === 'off'
                  ? 'bg-error-500 text-white'
                  : 'bg-primary text-white'
              : 'text-neutral-700 hover:bg-neutral-50',
          )}
        >
          {t(`platform.features.tri.${option}`)}
        </button>
      ))}
    </div>
  )
}

function Check({ on }: { on: boolean }) {
  const { t } = useTranslation()
  return on ? (
    <span className="inline-flex items-center gap-1 text-body-sm font-medium text-success-700">✓ <span className="sr-only">{t('platform.common.yes')}</span></span>
  ) : (
    <span className="inline-flex items-center gap-1 text-body-sm text-neutral-500">✕ <span className="sr-only">{t('platform.common.no')}</span></span>
  )
}

function FeaturesTab({ tenant, canEdit, onSaved }: { tenant: TenantDetail; canEdit: boolean; onSaved: (t: TenantDetail) => void }) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<Partial<Record<FeatureKey, Tri>>>({})
  const [busy, setBusy] = useState(false)
  const rows = tenant.featureMatrix.map((row) => {
    const tri = draft[row.featureKey] ?? triOf(row.override)
    const effective = tri === 'plan' ? row.plan : tri === 'on'
    return { ...row, tri, effectiveDraft: effective }
  })
  const changed = Object.entries(draft).filter(([key, tri]) => tri !== triOf(tenant.featureMatrix.find((r) => r.featureKey === key)?.override ?? null))

  const save = async () => {
    setBusy(true)
    try {
      const overrides = Object.fromEntries(changed.map(([key, tri]) => [key, tri === 'plan' ? null : tri === 'on'])) as Partial<Record<FeatureKey, boolean | null>>
      const updated = await putTenantFeatures(tenant.id, overrides)
      setDraft({})
      toast.success(t('platform.features.saved'))
      onSaved(updated)
    } catch (error) {
      toast.error(getUserErrorMessage(error, t))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card
      title={t('platform.features.title')}
      actions={
        canEdit ? (
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={!changed.length || busy} onClick={() => setDraft({})}>
              {t('platform.common.reset')}
            </Button>
            <Button type="button" variant="primary" size="sm" disabled={!changed.length || busy} onClick={() => void save()}>
              {t('platform.common.saveChanges')}
            </Button>
          </div>
        ) : undefined
      }
    >
      <p className="mb-4 text-body-sm text-neutral-600">{t('platform.features.hint')}</p>
      <DataTable minWidth={640} head={[t('platform.features.feature'), t('platform.features.planDefault'), t('platform.features.override'), t('platform.features.effective')]}>
        {rows.map((row, index) => (
          <tr key={row.featureKey} className={rowClass(index)}>
            <td className={cellClass}>{t(`platform.features.${row.featureKey}`)}</td>
            <td className={cellClass}><Check on={row.plan} /></td>
            <td className={cellClass}>
              <ThreeStateToggle value={row.tri} disabled={!canEdit || busy} onChange={(v) => setDraft((d) => ({ ...d, [row.featureKey]: v }))} label={t(`platform.features.${row.featureKey}`)} />
            </td>
            <td className={cellClass}><Check on={row.effectiveDraft} /></td>
          </tr>
        ))}
      </DataTable>
      <MobileCards>
        {rows.map((row) => (
          <MobileCard key={row.featureKey}>
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 text-body-sm font-medium text-neutral-900">{t(`platform.features.${row.featureKey}`)}</p>
              <Check on={row.effectiveDraft} />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-caption text-neutral-600">
                {t('platform.features.planDefault')}: {row.plan ? t('platform.common.yes') : t('platform.common.no')}
              </span>
              <ThreeStateToggle value={row.tri} disabled={!canEdit || busy} onChange={(v) => setDraft((d) => ({ ...d, [row.featureKey]: v }))} label={t(`platform.features.${row.featureKey}`)} />
            </div>
          </MobileCard>
        ))}
      </MobileCards>
    </Card>
  )
}

/* ── Users / Invoices / History ─────────────────────────────────────── */

function UsersTab({ tenant }: { tenant: TenantDetail }) {
  const { t } = useTranslation()
  const f = usePlatformFormat()
  const role = (r: string) => t(`userMenu.roles.${r}`, { defaultValue: r.replace(/_/g, ' ') })
  const status = (s: string) => t(`platform.userStatus.${s}`, { defaultValue: s })
  return (
    <Card title={t('platform.tenant.usersTitle', { used: tenant.usage.users.used, limit: tenant.usage.users.limit ?? '∞' })}>
      {tenant.users.length === 0 ? (
        <EmptyState title={t('platform.tenant.noUsers')} />
      ) : (
        <>
          <DataTable minWidth={720} head={[t('platform.staff.name'), t('platform.staff.email'), t('platform.staff.role'), t('platform.common.status'), t('platform.staff.lastLogin')]}>
            {tenant.users.map((u, index) => (
              <tr key={u.id} className={rowClass(index)}>
                <td className={`${cellClass} font-medium text-neutral-900`}>{u.name}</td>
                <td className={cellClass}><span dir="ltr">{u.email}</span></td>
                <td className={cellClass}>{role(u.role)}</td>
                <td className={cellClass}>{status(u.status)}</td>
                <td className={cellClass}>{u.lastLoginAt ? f.dateTime(u.lastLoginAt) : t('platform.staff.never')}</td>
              </tr>
            ))}
          </DataTable>
          <MobileCards>
            {tenant.users.map((u) => (
              <MobileCard key={u.id}>
                <p className="text-body-sm font-semibold text-neutral-900">{u.name}</p>
                <p className="truncate text-body-sm text-neutral-600" dir="ltr" style={{ textAlign: 'start' }}>{u.email}</p>
                <p className="mt-1 text-caption text-neutral-600">{role(u.role)} · {status(u.status)}</p>
              </MobileCard>
            ))}
          </MobileCards>
        </>
      )}
    </Card>
  )
}

/* ── Page ───────────────────────────────────────────────────────────── */

export function PlatformTenantDetailPage() {
  const { t } = useTranslation()
  const { tenantId = '' } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const role = getPlatformRole()
  const canManage = platformCan(role, 'manageTenants')
  const canMoney = platformCan(role, 'money')
  const { data: tenant, setData, loading, error, reload } = useLoader(() => getTenant(tenantId), [tenantId])
  const [impersonating, setImpersonating] = useState(false)
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [generating, setGenerating] = useState(false)

  const tabs: TenantTab[] = ['overview', 'subscription', 'features', 'users', ...(canMoney ? (['invoices'] as const) : []), 'history']
  const requested = params.get('tab') as TenantTab | null
  const tab: TenantTab = requested && tabs.includes(requested) ? requested : 'overview'

  const generate = async () => {
    setGenerating(true)
    try {
      const count = await generatePlatformInvoices(tenantId)
      toast.success(count ? t('platform.invoices.generated', { count }) : t('platform.invoices.nothingToGenerate'))
      reload()
    } catch (err) {
      toast.error(getUserErrorMessage(err, t))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <PageHeader
        title={tenant?.name ?? t('platform.tenant.loadingTitle')}
        crumbs={[{ label: t('platform.tenants.title'), to: PLATFORM_ROUTES.tenants }, { label: tenant?.name ?? '…' }]}
        actions={
          tenant && platformCan(role, 'impersonate') ? (
            <Button
              type="button"
              variant="outline"
              icon={<AppIcon icon={Login} size={20} />}
              onClick={() => setImpersonating(true)}
              disabled={tenant.status === 'CANCELLED' || tenant.status === 'EXPIRED'}
              className="w-full sm:w-auto"
            >
              {t('platform.impersonate.button')}
            </Button>
          ) : undefined
        }
      />
      {error ? <ErrorBlock message={getUserErrorMessage(error, t)} onRetry={reload} /> : null}
      {loading && !tenant ? <LoadingBlock rows={6} /> : null}
      {tenant && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <PlanBadge code={tenant.plan.code} name={tenant.plan.name} />
            <SubscriptionStatusBadge status={tenant.status} />
            {tenant.readOnly && <span className="rounded-sm bg-error-50 px-2.5 py-1 text-caption font-medium text-error-600">{t('platform.tenant.readOnly')}</span>}
            <span className="text-body-sm text-neutral-600">{t(`platform.cycle.${tenant.billingCycle}`)}</span>
          </div>

          <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
            <div role="tablist" aria-label={t('platform.tenant.tabsLabel')} className={pageTabListClassName}>
              {tabs.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setParams(key === 'overview' ? {} : { tab: key }, { replace: true })}
                  className={pageTabClassName(tab === key)}
                >
                  {t(`platform.tenant.tabs.${key}`)}
                </button>
              ))}
            </div>
          </div>

          <div role="tabpanel">
            {tab === 'overview' && <OverviewTab tenant={tenant} canDelete={canManage} onDelete={() => setDeleting(true)} />}
            {tab === 'subscription' && (
              <SubscriptionTab key={tenant.subscription.updatedAt} tenant={tenant} canEdit={canManage} onSaved={setData} onStatus={setStatusAction} />
            )}
            {tab === 'features' && <FeaturesTab tenant={tenant} canEdit={canManage} onSaved={setData} />}
            {tab === 'users' && <UsersTab tenant={tenant} />}
            {tab === 'invoices' && (
              <Card
                title={t('platform.tenant.tabs.invoices')}
                actions={
                  <Button type="button" variant="outline" size="sm" onClick={() => void generate()} disabled={generating}>
                    {t('platform.invoices.generateForTenant')}
                  </Button>
                }
              >
                <InvoiceTable invoices={tenant.invoices.map((i) => ({ ...i, tenantName: i.tenantName ?? tenant.name }))} showTenant={false} canManage={canMoney} onChanged={reload} />
              </Card>
            )}
            {tab === 'history' && (
              <Card title={t('platform.tenant.tabs.history')}>
                {tenant.history.length === 0 ? (
                  <EmptyState title={t('platform.audit.empty')} />
                ) : (
                  <ul className="divide-y divide-neutral-100">
                    {tenant.history.map((row) => (
                      <ActivityItem key={row.id} row={row} />
                    ))}
                  </ul>
                )}
              </Card>
            )}
          </div>

          <ImpersonateDialog tenant={tenant} open={impersonating} onClose={() => setImpersonating(false)} onDone={reload} />
          <ConfirmActionDialog
            open={statusAction !== null}
            title={statusAction ? t(`platform.tenant.confirm.${statusAction}`, { name: tenant.name }) : ''}
            description={statusAction ? t(`platform.tenant.confirmBody.${statusAction}`) : undefined}
            confirmLabel={statusAction ? t(`platform.tenant.actions.${statusAction}`) : ''}
            destructive={statusAction === 'suspend' || statusAction === 'cancel'}
            reason={{ label: t('platform.common.reason'), required: true }}
            onClose={() => setStatusAction(null)}
            onConfirm={async (reason) => {
              if (!statusAction) return
              try {
                setData(await changeTenantStatus(tenant.id, statusAction, reason))
                toast.success(t('platform.tenant.statusChanged'))
              } catch (err) {
                throw new Error(getUserErrorMessage(err, t), { cause: err })
              }
            }}
          />
          <ConfirmActionDialog
            open={deleting}
            title={t('platform.tenant.deleteTitle', { name: tenant.name })}
            description={t('platform.tenant.deleteBody')}
            confirmLabel={t('platform.tenant.deleteNow')}
            destructive
            onClose={() => setDeleting(false)}
            onConfirm={async () => {
              try {
                await confirmTenantDeletion(tenant.id)
              } catch (err) {
                throw new Error(getUserErrorMessage(err, t), { cause: err })
              }
              toast.success(t('platform.tenant.deleted'))
              navigate(PLATFORM_ROUTES.tenants, { replace: true })
            }}
          />
        </>
      )}
    </>
  )
}
