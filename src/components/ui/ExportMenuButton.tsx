import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useTranslation } from 'react-i18next'
import { Button, type ButtonProps } from '@/components/ui/Button'
import { AppIcon, ChevronDownIcon, DownloadTrayIcon, ExcelFileIcon, PdfFileIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

/**
 * Same "Export" trigger + PDF/Excel dropdown that was copy-pasted into
 * CabCertificationCyclesPage, CabManageCertificationCyclePage, CabAuditSchedulePage,
 * CabAuditReportingPage, CabInvoiceRegisterPage, CabNonconformitiesPage,
 * CabDecisionQueuePage, CabOfferRegisterPage and CabCertificateRegisterPage.
 *
 * Each page keeps its own `t('...')` label (some say "Download PDF", others
 * "Export as PDF" etc.) — only the button, dropdown shell, loading state and
 * styling are unified here. Pass only `onExportPdf` or only `onExportExcel`
 * to render a single-choice menu; pass both for the usual two-item menu.
 */
export interface ExportMenuButtonProps {
  onExportPdf?: () => void | Promise<void>
  onExportExcel?: () => void | Promise<void>
  pdfLabel?: string
  excelLabel?: string
  /** Shown on the trigger while `exporting` is true. Defaults to common.exporting. */
  exportingLabel?: string
  /** Shown on the trigger otherwise. Defaults to common.export. */
  label?: string
  exporting?: boolean
  disabled?: boolean
  align?: 'start' | 'end'
  variant?: ButtonProps['variant']
  className?: string
}

export function ExportMenuButton({
  onExportPdf,
  onExportExcel,
  pdfLabel,
  excelLabel,
  exportingLabel,
  label,
  exporting = false,
  disabled = false,
  align = 'end',
  variant = 'outline',
  className,
}: ExportMenuButtonProps) {
  const { t } = useTranslation()

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          type="button"
          variant={variant}
          icon={<AppIcon icon={DownloadTrayIcon} size={20} />}
          disabled={disabled || exporting}
          className={cn('flex-1 sm:flex-none', className)}
        >
          {exporting ? exportingLabel ?? t('common.exporting', 'Exporting…') : label ?? t('common.export', 'Export')}
          <AppIcon icon={ChevronDownIcon} size={16} />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={4}
          className="z-50 min-w-[200px] rounded-md border border-neutral-100 bg-white p-1 shadow-lg"
        >
          {onExportPdf && (
            <DropdownMenu.Item
              onSelect={onExportPdf}
              className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2.5 text-body-sm font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
            >
              <AppIcon icon={PdfFileIcon} size={18} />
              {pdfLabel ?? t('common.exportPdf', 'Export as PDF')}
            </DropdownMenu.Item>
          )}
          {onExportExcel && (
            <DropdownMenu.Item
              onSelect={onExportExcel}
              className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2.5 text-body-sm font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
            >
              <AppIcon icon={ExcelFileIcon} size={18} />
              {excelLabel ?? t('common.exportExcel', 'Export as Excel')}
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}