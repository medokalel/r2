import en from './privacy-policy.en.json'
import ar from './privacy-policy.ar.json'

export interface PrivacyPolicySection {
  number: number
  title: string
  paragraphs: string[]
  bullets: string[]
}

export interface PrivacyPolicyContent {
  title: string
  meta: {
    updated?: string
  }
  sections: PrivacyPolicySection[]
}

const contentByLang = {
  en: en as PrivacyPolicyContent,
  ar: ar as PrivacyPolicyContent,
}

export function getPrivacyPolicyContent(language: string): PrivacyPolicyContent {
  return language.startsWith('ar') ? contentByLang.ar : contentByLang.en
}
