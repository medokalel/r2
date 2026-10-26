import i18n from '@/i18n'

export interface IafCodeDefinition {
  code: string // e.g. "01", "02", ..., "39"
  value: string // e.g. "IAF_01", "IAF_02", ..., "IAF_39"
  en: string
  ar: string
}

export const IAF_CODES_LIST: IafCodeDefinition[] = [
  {
    code: '01',
    value: 'IAF_01',
    en: 'Agriculture, forestry and fishing',
    ar: 'الزراعة والحراجة وصيد الأسماك',
  },
  {
    code: '02',
    value: 'IAF_02',
    en: 'Mining and quarrying',
    ar: 'التعدين واستغلال المحاجر',
  },
  {
    code: '03',
    value: 'IAF_03',
    en: 'Food products, beverages and tobacco',
    ar: 'صناعة المنتجات الغذائية والمشروبات والتبغ',
  },
  {
    code: '04',
    value: 'IAF_04',
    en: 'Textiles and textile products',
    ar: 'المنسوجات والمنتجات النسيجية',
  },
  {
    code: '05',
    value: 'IAF_05',
    en: 'Leather and leather products',
    ar: 'الجلود والمنتجات الجلدية',
  },
  {
    code: '06',
    value: 'IAF_06',
    en: 'Wood and wood products',
    ar: 'الأخشاب والمنتجات الخشبية',
  },
  {
    code: '07',
    value: 'IAF_07',
    en: 'Pulp, paper and paper products',
    ar: 'لب الورق والورق والمنتجات الورقية',
  },
  {
    code: '08',
    value: 'IAF_08',
    en: 'Publishing companies',
    ar: 'دور النشر',
  },
  {
    code: '09',
    value: 'IAF_09',
    en: 'Printing companies',
    ar: 'شركات الطباعة',
  },
  {
    code: '10',
    value: 'IAF_10',
    en: 'Manufacture of coke and refined petroleum products',
    ar: 'صناعة فحم الكوك والمنتجات النفطية المكررة',
  },
  {
    code: '11',
    value: 'IAF_11',
    en: 'Nuclear fuel',
    ar: 'الوقود النووي',
  },
  {
    code: '12',
    value: 'IAF_12',
    en: 'Chemicals, chemical products and fibres',
    ar: 'الكيماويات والمنتجات الكيميائية والألياف',
  },
  {
    code: '13',
    value: 'IAF_13',
    en: 'Pharmaceuticals',
    ar: 'المنتجات الصيدلانية',
  },
  {
    code: '14',
    value: 'IAF_14',
    en: 'Rubber and plastic products',
    ar: 'منتجات المطاط والبلاستيك',
  },
  {
    code: '15',
    value: 'IAF_15',
    en: 'Non-metallic mineral products',
    ar: 'المنتجات المعدنية غير الفلزية',
  },
  {
    code: '16',
    value: 'IAF_16',
    en: 'Concrete, cement, lime, plaster, etc.',
    ar: 'الخرسانة والأسمنت والجير والجبس وما شابه',
  },
  {
    code: '17',
    value: 'IAF_17',
    en: 'Basic metals and fabricated metal products',
    ar: 'الفلزات الأساسية والمنتجات المعدنية المصنعة',
  },
  {
    code: '18',
    value: 'IAF_18',
    en: 'Machinery and equipment',
    ar: 'الآلات والمعدات',
  },
  {
    code: '19',
    value: 'IAF_19',
    en: 'Electrical and optical equipment',
    ar: 'المعدات الكهربائية والبصرية',
  },
  {
    code: '20',
    value: 'IAF_20',
    en: 'Shipbuilding',
    ar: 'بناء السفن',
  },
  {
    code: '21',
    value: 'IAF_21',
    en: 'Aerospace',
    ar: 'صناعة الطيران والفضاء',
  },
  {
    code: '22',
    value: 'IAF_22',
    en: 'Other transport equipment',
    ar: 'معدات النقل الأخرى',
  },
  {
    code: '23',
    value: 'IAF_23',
    en: 'Manufacturing not elsewhere classified',
    ar: 'صناعات تحويلية غير مصنفة في موضع آخر',
  },
  {
    code: '24',
    value: 'IAF_24',
    en: 'Recycling',
    ar: 'إعادة التدوير',
  },
  {
    code: '25',
    value: 'IAF_25',
    en: 'Electricity supply',
    ar: 'إمدادات الكهرباء',
  },
  {
    code: '26',
    value: 'IAF_26',
    en: 'Gas supply',
    ar: 'إمدادات الغاز',
  },
  {
    code: '27',
    value: 'IAF_27',
    en: 'Water supply',
    ar: 'إمدادات المياه',
  },
  {
    code: '28',
    value: 'IAF_28',
    en: 'Construction',
    ar: 'الإنشاءات',
  },
  {
    code: '29',
    value: 'IAF_29',
    en: 'Wholesale and retail trade; Repair of motor vehicles, motorcycles and personal and household goods',
    ar: 'تجارة الجملة والتجزئة؛ إصلاح المركبات والدراجات النارية والسلع الشخصية والمنزلية',
  },
  {
    code: '30',
    value: 'IAF_30',
    en: 'Hotels and restaurants',
    ar: 'الفنادق والمطاعم',
  },
  {
    code: '31',
    value: 'IAF_31',
    en: 'Transport, storage and communication',
    ar: 'النقل والتخزين والاتصالات',
  },
  {
    code: '32',
    value: 'IAF_32',
    en: 'Financial intermediation; real estate; renting',
    ar: 'الوساطة المالية والعقارات والتأجير',
  },
  {
    code: '33',
    value: 'IAF_33',
    en: 'Information technology',
    ar: 'تقنية المعلومات',
  },
  {
    code: '34',
    value: 'IAF_34',
    en: 'Engineering services',
    ar: 'الخدمات الهندسية',
  },
  {
    code: '35',
    value: 'IAF_35',
    en: 'Other services',
    ar: 'خدمات أخرى',
  },
  {
    code: '36',
    value: 'IAF_36',
    en: 'Public administration',
    ar: 'الإدارة العامة',
  },
  {
    code: '37',
    value: 'IAF_37',
    en: 'Education',
    ar: 'التعليم',
  },
  {
    code: '38',
    value: 'IAF_38',
    en: 'Health and social work',
    ar: 'الصحة والعمل الاجتماعي',
  },
  {
    code: '39',
    value: 'IAF_39',
    en: 'Other social services',
    ar: 'خدمات اجتماعية أخرى',
  },
]

/**
 * Returns the localized IAF options list based on the active language.
 */
export function getIafCodeOptions(lang?: string): { value: string; label: string }[] {
  const currentLang = lang || (i18n.language?.startsWith('ar') ? 'ar' : 'en')
  return IAF_CODES_LIST.map((item) => ({
    value: item.value,
    label: `IAF ${item.code} • ${currentLang === 'ar' ? item.ar : item.en}`,
  }))
}

export function resolveIafCodeSectorName(rawCode: string, lang?: string): string | null {
  const currentLang = lang || (i18n.language?.startsWith('ar') ? 'ar' : 'en')
  const trimmed = rawCode.trim()
  const match = trimmed.match(/(\d{1,2})/)
  const digits = match ? match[1].padStart(2, '0') : null
  const found = IAF_CODES_LIST.find(
    (item) => item.value === trimmed || (digits && item.code === digits),
  )
  if (!found) return null
  return currentLang === 'ar' ? found.ar : found.en
}

export function formatIafCodesToSectorNames(
  codes?: string[] | null,
  fallbackScope?: string,
  lang?: string,
): string {
  if (codes && codes.length > 0) {
    const names = codes.map((c) => resolveIafCodeSectorName(c, lang) || c).filter(Boolean)
    if (names.length > 0) return names.join(', ')
  }

  if (fallbackScope) {
    const iafPrefixMatch = fallbackScope.match(/^IAF\s*:\s*(.+)$/i)
    if (iafPrefixMatch) {
      const parts = iafPrefixMatch[1]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const names = parts.map((c) => resolveIafCodeSectorName(c, lang) || c)
      if (names.length > 0) return names.join(', ')
    }
    return fallbackScope
  }

  return ''
}

