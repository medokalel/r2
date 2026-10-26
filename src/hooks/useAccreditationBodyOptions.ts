import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ACCREDITATION_BODY_OTHER_VALUE,
  accreditationBodiesForCountry,
  accreditationBodyLabel,
  sortedAccreditationBodies,
  type AccreditationBody,
} from '@/lib/accreditationBodies'
import { countryName } from '@/lib/countries'

export interface AccreditationBodySelectOption {
  value: string
  label: string
  hint?: string
  keywords?: string
}

/**
 * Options for an accreditation-body picker: the bodies serving `countryCode` first, then every other
 * body worldwide (A–Z), then "Other". Country names follow the UI language and are searchable.
 */
export function useAccreditationBodyOptions(countryCode?: string | null): AccreditationBodySelectOption[] {
  const { t, i18n } = useTranslation()
  const language = i18n.language?.startsWith('ar') ? 'ar' : 'en'

  return useMemo(() => {
    const recognition = (body: AccreditationBody) =>
      t(`accreditationBodies.recognition.${body.recognition}`, {
        defaultValue: body.recognition === 'ILAC_ASSOCIATE' ? 'ILAC associate' : body.recognition === 'IAF_MLA' ? 'IAF MLA signatory' : 'ILAC MRA signatory',
      })
    const toOption = (body: AccreditationBody): AccreditationBodySelectOption => {
      const countries = body.countries.map((code) => countryName(code, language))
      const sep = language === 'ar' ? '، ' : ', '
      const shown = countries.length > 3 ? `${countries.slice(0, 3).join(sep)} +${countries.length - 3}` : countries.join(sep)
      return {
        value: body.value,
        label: accreditationBodyLabel(body),
        hint: `${shown} · ${recognition(body)}`,
        keywords: [...countries, ...body.countries.map((code) => countryName(code, 'en'))].join(' '),
      }
    }
    const local = accreditationBodiesForCountry(countryCode)
    const localValues = new Set(local.map((body) => body.value))
    const rest = sortedAccreditationBodies().filter((body) => !localValues.has(body.value))
    return [
      ...local.map(toOption),
      ...rest.map(toOption),
      { value: ACCREDITATION_BODY_OTHER_VALUE, label: t('accreditationBodies.other', 'Other (not listed)') },
    ]
  }, [countryCode, language, t])
}
