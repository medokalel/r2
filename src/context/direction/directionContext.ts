import { createContext } from 'react'
import { getBrowserLanguage } from '@/i18n'

export type Direction = 'ltr' | 'rtl'

export type AppLanguage = 'ar' | 'en'

export interface DirectionContextValue {
  dir: Direction
  lang: string
  setLanguage: (lang: AppLanguage) => void
  toggleLanguage: () => void
}

const initialLang = getBrowserLanguage()

export const DirectionContext = createContext<DirectionContextValue>({
  dir: initialLang === 'ar' ? 'rtl' : 'ltr',
  lang: initialLang,
  setLanguage: () => {},
  toggleLanguage: () => {},
})
