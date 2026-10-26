import type { TFunction } from 'i18next'
import type { OrgDocumentType } from '@/lib/api/organizationProfileApi'

// Shared box style for the wizard's section cards (map, form, branches list,
// official docs, etc). Padding narrows on small screens so the desktop p-8
// doesn't eat into the content width on mobile.
export const profileCardClassName =
  'flex flex-col gap-6 rounded-lg border border-neutral-100 bg-white p-4 sm:p-6 lg:p-8'

export const SECTOR_OPTIONS = [
  { value: 'AGRICULTURE_FORESTRY_FISHING', legacyValue: 'الزراعة والغابات وصيد الأسماك', key: 'agriculture' },
  { value: 'MINING_QUARRYING', legacyValue: 'التعدين واستخراج الأحجار', key: 'mining' },
  { value: 'FOOD_BEVERAGES_TOBACCO', legacyValue: 'المنتجات الغذائية والمشروبات والتبغ', key: 'foodBeverage' },
  { value: 'TEXTILES', legacyValue: 'المنسوجات والمنتجات النسيجية', key: 'textiles' },
  { value: 'LEATHER', legacyValue: 'الجلود والمنتجات الجلدية', key: 'leather' },
  { value: 'WOOD_PRODUCTS', legacyValue: 'الأخشاب والمنتجات الخشبية', key: 'wood' },
  { value: 'PULP_PAPER', legacyValue: 'لب الورق والورق والمنتجات الورقية', key: 'paper' },
  { value: 'PUBLISHING', legacyValue: 'شركات النشر', key: 'publishing' },
  { value: 'PRINTING', legacyValue: 'شركات الطباعة', key: 'printing' },
  { value: 'COKE_PETROLEUM', legacyValue: 'صناعة فحم الكوك والمنتجات البترولية المكررة', key: 'petroleum' },
  { value: 'NUCLEAR_FUEL', legacyValue: 'الوقود النووي', key: 'nuclearFuel' },
  { value: 'CHEMICALS', legacyValue: 'الكيماويات والمنتجات الكيميائية والألياف', key: 'chemicals' },
  { value: 'PHARMACEUTICALS', legacyValue: 'المستحضرات الصيدلانية', key: 'pharmaceuticals' },
  { value: 'RUBBER_PLASTICS', legacyValue: 'منتجات المطاط والبلاستيك', key: 'rubberPlastic' },
  { value: 'NON_METALLIC_MINERALS', legacyValue: 'المنتجات المعدنية غير الفلزية', key: 'nonMetallic' },
  { value: 'CONCRETE_CEMENT', legacyValue: 'الخرسانة والأسمنت والجير والجبس وما شابه', key: 'concrete' },
  { value: 'BASIC_METALS', legacyValue: 'المعادن الأساسية والمنتجات المعدنية المُصنّعة', key: 'basicMetals' },
  { value: 'MACHINERY_EQUIPMENT', legacyValue: 'الآلات والمعدات', key: 'machinery' },
  { value: 'ELECTRICAL_OPTICAL', legacyValue: 'المعدات الكهربائية والبصرية', key: 'electrical' },
  { value: 'SHIPBUILDING', legacyValue: 'بناء السفن', key: 'shipbuilding' },
  { value: 'AEROSPACE', legacyValue: 'صناعة الطيران والفضاء', key: 'aerospace' },
  { value: 'OTHER_TRANSPORT', legacyValue: 'معدات النقل الأخرى', key: 'otherTransport' },
  { value: 'MANUFACTURING_NEC', legacyValue: 'صناعات تحويلية غير مصنفة في موضع آخر', key: 'otherManufacturing' },
  { value: 'RECYCLING', legacyValue: 'إعادة التدوير', key: 'recycling' },
  { value: 'ELECTRICITY_SUPPLY', legacyValue: 'إمداد الكهرباء', key: 'electricity' },
  { value: 'GAS_SUPPLY', legacyValue: 'إمداد الغاز', key: 'gas' },
  { value: 'WATER_SUPPLY', legacyValue: 'إمداد المياه', key: 'water' },
  { value: 'CONSTRUCTION', legacyValue: 'التشييد والبناء', key: 'construction' },
  { value: 'WHOLESALE_RETAIL', legacyValue: 'تجارة الجملة والتجزئة؛ وإصلاح المركبات والدراجات النارية والسلع الشخصية والمنزلية', key: 'wholesale' },
  { value: 'HOTELS_RESTAURANTS', legacyValue: 'الفنادق والمطاعم', key: 'hotels' },
  { value: 'TRANSPORT_STORAGE', legacyValue: 'النقل والتخزين والاتصالات', key: 'transport' },
  { value: 'FINANCIAL_INTERMEDIATION', legacyValue: 'الوساطة المالية والعقارات والتأجير', key: 'financial' },
  { value: 'INFORMATION_TECHNOLOGY', legacyValue: 'تقنية المعلومات', key: 'informationTechnology' },
  { value: 'ENGINEERING_SERVICES', legacyValue: 'الخدمات الهندسية', key: 'engineering' },
  { value: 'OTHER_SERVICES', legacyValue: 'الخدمات الأخرى', key: 'otherServices' },
  { value: 'PUBLIC_ADMINISTRATION', legacyValue: 'الإدارة العامة', key: 'publicAdmin' },
  { value: 'EDUCATION', legacyValue: 'التعليم', key: 'education' },
  { value: 'HEALTH_SOCIAL_WORK', legacyValue: 'الصحة والعمل الاجتماعي', key: 'healthcare' },
  { value: 'OTHER_SOCIAL_SERVICES', legacyValue: 'الخدمات الاجتماعية الأخرى', key: 'otherSocial' },
] as const

export const BRANCH_SECTOR_OPTIONS = SECTOR_OPTIONS

export function getLocalizedSectorOptions(t: TFunction) {
  return SECTOR_OPTIONS.map((item) => ({
    value: item.value,
    label: t(`companyProfile.profileHeader.sectors.${item.key}`, { defaultValue: item.legacyValue }),
  }))
}

export function getLocalizedBranchSectorOptions(t: TFunction) {
  return BRANCH_SECTOR_OPTIONS.map((item) => ({
    value: item.value,
    label: t(`companyProfile.profileHeader.sectors.${item.key}`, { defaultValue: item.legacyValue }),
  }))
}

// Canonical API values with their translation keys
export const STATUS_OPTIONS = [
  { value: 'Active', key: 'active' },
  { value: 'Suspended', key: 'suspended' },
  { value: 'Under Establishment', key: 'underEstablishment' },
  { value: 'Liquidated', key: 'liquidated' },
] as const

export const LOGO_MAX_BYTES = 5 * 1024 * 1024
export const LOGO_ACCEPT = '.png,.jpg,.jpeg,.webp,.svg'

export const DOC_MAX_BYTES = 10 * 1024 * 1024
export const DOC_ACCEPT = '.pdf,.png,.jpg,.jpeg'

export const DOC_TYPE_BY_KEY: Record<string, OrgDocumentType> = {
  nationalAddress: 'NATIONAL_ADDRESS_CERTIFICATE',
  activityLicense: 'ACTIVITY_LICENSE',
  taxCard: 'TAX_CARD',
  commercialRegistry: 'COMMERCIAL_REGISTER',
}

export const REQUIRED_DOC_TYPES: OrgDocumentType[] = Object.values(DOC_TYPE_BY_KEY)
