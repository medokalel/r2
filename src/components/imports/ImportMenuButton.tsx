import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { AppIcon, ChevronDownIcon, DownloadIcon, LockIcon, UploadOutlineIcon } from '@/components/icons'
import { buttonVariants } from '@/components/ui/buttonVariants'
import { ImportWizard } from '@/components/imports/ImportWizard'
import { useSubscription } from '@/hooks/useSubscription'
import { getImportTemplate } from '@/lib/api/importsApi'
import { IMPORT_BATCH_PARAM, IMPORT_DEF_PARAM } from '@/lib/imports/entities'
import type { ImportContext, ImportDefinitionKey, ImportResult } from '@/lib/imports/types'
import { ROUTES } from '@/lib/routes'
import { downloadBlob } from '@/lib/xlsxDownload'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

interface ImportMenuButtonProps {
  definitionKey: ImportDefinitionKey
  context?: ImportContext
  onImported?: (result: ImportResult) => void
  /** Button label (defaults to "Import"). */
  label?: string
  variant?: 'outline' | 'secondary' | 'primary'
  size?: 'sm' | 'md' | 'default'
  className?: string
}

const itemClass =
  'flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2.5 text-body-sm text-text-primary outline-none data-[highlighted]:bg-primary-25 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50'

/**
 * "Import" on a register page: a menu with "Import from Excel" (opens the import wizard) and the
 * template download in both header languages. Comes back on the wizard's result when the URL
 * carries `importBatch` (after completing a record), and shows a lock when the plan has no
 * `excel_import`.
 */
export function ImportMenuButton({ definitionKey, context, onImported, label, variant = 'outline', size = 'md', className }: ImportMenuButtonProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { isFeatureEnabled } = useSubscription()
  const enabled = isFeatureEnabled('excel_import')
  const reopenId = params.get(IMPORT_DEF_PARAM) === definitionKey ? params.get(IMPORT_BATCH_PARAM) : null
  const [open, setOpen] = useState(false)
  const [batchId, setBatchId] = useState<string | null>(null)
  const [consumed, setConsumed] = useState<string | null>(null)

  // Coming back from "Complete": reopen the wizard on that batch once, then clean the URL.
  if (enabled && reopenId && consumed !== reopenId) {
    setConsumed(reopenId)
    setBatchId(reopenId)
    setOpen(true)
  }

  useEffect(() => {
    if (!enabled || !reopenId) return
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete(IMPORT_BATCH_PARAM)
        next.delete(IMPORT_DEF_PARAM)
        return next
      },
      { replace: true },
    )
  }, [enabled, reopenId, setParams])

  const template = async (lang: 'en' | 'ar') => {
    try {
      const { blob, fileName } = await getImportTemplate(definitionKey, lang, context)
      downloadBlob(blob, fileName)
      toast.success(t('imports.template.downloaded', { file: fileName }))
    } catch (caught) {
      toast.error(getUserErrorMessage(caught, t))
    }
  }

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button type="button" className={cn(buttonVariants({ variant, size }), className)} data-testid={`import-menu-${definitionKey}`}>
            <AppIcon icon={enabled ? UploadOutlineIcon : LockIcon} size={18} />
            {label ?? t('imports.action')}
            <AppIcon icon={ChevronDownIcon} size={16} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={6} className="z-50 min-w-[260px] rounded-lg border border-neutral-100 bg-white p-1.5 shadow-card">
            {enabled ? (
              <>
                <DropdownMenu.Item
                  className={itemClass}
                  onSelect={() => {
                    setBatchId(null)
                    setOpen(true)
                  }}
                >
                  <AppIcon icon={UploadOutlineIcon} size={18} />
                  {t('imports.menu.fromExcel')}
                </DropdownMenu.Item>
                <DropdownMenu.Item className={itemClass} onSelect={() => void template('en')}>
                  <AppIcon icon={DownloadIcon} size={18} />
                  {t('imports.menu.templateEn')}
                </DropdownMenu.Item>
                <DropdownMenu.Item className={itemClass} onSelect={() => void template('ar')}>
                  <AppIcon icon={DownloadIcon} size={18} />
                  {t('imports.menu.templateAr')}
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-neutral-100" />
                <DropdownMenu.Item className={cn(itemClass, 'text-primary')} onSelect={() => navigate(ROUTES.cabMigration)}>
                  {t('imports.menu.migrationHub')}
                </DropdownMenu.Item>
              </>
            ) : (
              <DropdownMenu.Item className={itemClass} onSelect={() => navigate(ROUTES.cabSubscription)}>
                <AppIcon icon={LockIcon} size={18} />
                {t('imports.menu.locked')}
              </DropdownMenu.Item>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <ImportWizard
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setBatchId(null)
        }}
        definitionKey={definitionKey}
        context={context}
        batchId={batchId}
        onImported={onImported}
      />
    </>
  )
}
