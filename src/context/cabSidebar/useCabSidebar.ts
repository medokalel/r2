import { useContext } from 'react'
import { CabSidebarContext } from './cabSidebarContext'

export function useCabSidebar() {
  const ctx = useContext(CabSidebarContext)
  if (!ctx) {
    throw new Error('useCabSidebar must be used within CabSidebarProvider')
  }
  return ctx
}

/** Same as useCabSidebar but returns null outside the provider (headers used on public pages). */
export function useOptionalCabSidebar() {
  return useContext(CabSidebarContext)
}
