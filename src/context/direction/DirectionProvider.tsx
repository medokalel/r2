import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { DirectionContext, type AppLanguage, type Direction } from './directionContext'

export function DirectionProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation()
  // Derived from the active language on every render (no mirrored state).
  const dir: Direction = i18n.language === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.dir = dir
    document.documentElement.lang = i18n.language
  }, [dir, i18n.language])

  const setLanguage = (next: AppLanguage) => {
    if (i18n.language !== next) {
      i18n.changeLanguage(next)
    }
  }

  const toggleLanguage = () => {
    setLanguage(i18n.language === 'ar' ? 'en' : 'ar')
  }

  return (
    <DirectionContext.Provider value={{ dir, lang: i18n.language, setLanguage, toggleLanguage }}>
      {children}
    </DirectionContext.Provider>
  )
}
