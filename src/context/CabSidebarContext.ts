// Public entry point kept for existing imports. The provider, context object and
// hooks live in ./cabSidebar so each module stays Fast Refresh-safe.
export { CabSidebarProvider } from './cabSidebar/CabSidebarProvider'
export { useCabSidebar, useOptionalCabSidebar } from './cabSidebar/useCabSidebar'
export type { CabSidebarContextValue } from './cabSidebar/cabSidebarContext'
