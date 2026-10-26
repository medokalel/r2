import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import { getAuthSession, getPlatformRole, isAuditClientSession } from '@/lib/authStorage'
import { buildHelpTree, type HelpTree } from '@/lib/help/registry'
import type { HelpAudience, HelpLang } from '@/lib/help/types'

let cachedTree: HelpTree | null = null

/** The help tree holds both languages, so it is built once per page load. */
export function getHelpTree(): HelpTree {
  if (!cachedTree) {
    cachedTree = buildHelpTree((lang, key, fallback) => {
      const value = i18n.getFixedT(lang)(key, { defaultValue: fallback ?? key })
      return typeof value === 'string' ? value : (fallback ?? key)
    })
  }
  return cachedTree
}

/** Audience of the signed-in user: platform staff, audit client, or CAB staff (default). */
export function sessionAudience(): HelpAudience {
  const session = getAuthSession()
  if (getPlatformRole(session)) return 'platform'
  if (isAuditClientSession(session)) return 'client'
  return 'cab'
}

/** Audiences whose guides the user may read. The internal console guide is for platform staff only. */
export function readableAudiences(own: HelpAudience): HelpAudience[] {
  return own === 'platform' ? ['platform', 'cab', 'client'] : own === 'client' ? ['client', 'cab'] : ['cab', 'client']
}

export function useHelpLang(): HelpLang {
  const { i18n: instance } = useTranslation()
  return instance.language?.startsWith('ar') ? 'ar' : 'en'
}

export function useHelpTree(): HelpTree {
  return useMemo(() => getHelpTree(), [])
}
