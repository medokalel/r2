import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { toEnglishDigits } from '@/lib/englishDigits'
import en from './locales/en.json'
import ar from './locales/ar.json'
// Fragment owned by the platform-admin / subscription feature (`platform.*`, `subscription.*`).
import platformEn from './locales/platform.en.json'
import platformAr from './locales/platform.ar.json'
// Fragment owned by iHelp, the in-app help center (`help.*`).
import helpEn from './locales/help.en.json'
import helpAr from './locales/help.ar.json'
// Fragment owned by the Excel import / data migration feature (`imports.*`).
import importsEn from './locales/imports.en.json'
import importsAr from './locales/imports.ar.json'
// Fragment owned by single sign-on (`sso.*`).
import ssoEn from './locales/sso.en.json'
import ssoAr from './locales/sso.ar.json'
// Fragment owned by the certification agreements feature (`agreements.*`).
import agreementsEn from './locales/agreements.en.json'
import agreementsAr from './locales/agreements.ar.json'

/** The fragments only add new top-level namespaces, so a shallow merge keeps every existing key. */
// Fragment owned by audit execution, checklists and stage reports (`execution.*`).
import executionEn from './locales/execution.en.json'
import executionAr from './locales/execution.ar.json'
// Fragment owned by the travel cost calculator (`travel.*`).
import travelEn from './locales/travel.en.json'
import travelAr from './locales/travel.ar.json'
// Fragment owned by the audit-time classification and multi-site register (`auditCalc.*`).
import auditCalcEn from './locales/auditCalc.en.json'
import auditCalcAr from './locales/auditCalc.ar.json'
// Fragment owned by audit team selection, availability and the impartiality register (`team.*`).
import teamEn from './locales/team.en.json'
import teamAr from './locales/team.ar.json'

const enResources = { ...en, ...platformEn, ...helpEn, ...importsEn, ...ssoEn, ...agreementsEn, ...executionEn, ...travelEn, ...auditCalcEn, ...teamEn }
const arResources = { ...ar, ...platformAr, ...helpAr, ...importsAr, ...ssoAr, ...agreementsAr, ...executionAr, ...travelAr, ...auditCalcAr, ...teamAr }

export function getBrowserLanguage(): 'en' | 'ar' {
  if (typeof navigator === 'undefined') return 'en'
  return navigator.language.toLowerCase().startsWith('ar') ? 'ar' : 'en'
}

const englishDigitsPostProcessor = {
  type: 'postProcessor' as const,
  name: 'englishDigits',
  process(value: unknown, _key: string, _options: unknown, translator: { language?: string }) {
    if (!translator.language?.startsWith('ar')) return value
    if (typeof value !== 'string') return value
    return toEnglishDigits(value)
  },
}

i18n
  .use(LanguageDetector)
  .use(englishDigitsPostProcessor)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enResources },
      ar: { translation: arResources },
    },
    fallbackLng: getBrowserLanguage(),
    supportedLngs: ['en', 'ar'],
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    postProcess: ['englishDigits'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'icasco-lang',
    },
  })

export default i18n
