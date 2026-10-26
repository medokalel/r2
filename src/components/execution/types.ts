import type { AuditChecklistItemResult, AuditExecutionWorkspace, ExecutionFile, ItemUpdate } from '@/lib/api/executionApi'

/** What every step panel of the execution workspace receives from the page. */
export interface StepProps {
  ws: AuditExecutionWorkspace
  busy: boolean
  /** The step is completed: its data is read-only until it is reopened. */
  locked: boolean
  /** Runs a workspace call: busy state, toast on success, error message (and gates) on failure. */
  run: (action: () => Promise<AuditExecutionWorkspace>, success?: string) => Promise<boolean>
}

/** Extra callbacks of the Conduct step (checklist results go through the offline queue). */
export interface ConductProps extends StepProps {
  pendingItemIds: Set<string>
  onItemChange: (item: AuditChecklistItemResult, update: ItemUpdate) => void
  onPhoto: (item: AuditChecklistItemResult | null, file: File) => void
  onRemoveFile: (file: ExecutionFile) => void
  onRaiseFinding: (item: AuditChecklistItemResult) => void
}
