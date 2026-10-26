import i18n from '@/i18n'

export interface FoodSafetySubcategoryDefinition {
  categoryNameEn: string
  categoryNameAr: string
  subcategoryCode: string
  subcategoryEn: string
  subcategoryAr: string
}

export const FOOD_SAFETY_SUBCATEGORIES_LIST: FoodSafetySubcategoryDefinition[] = [
  {
    categoryNameEn: 'Farming or handling of animals',
    categoryNameAr: 'تربية الحيوانات أو التعامل معها',
    subcategoryCode: 'AI',
    subcategoryEn: 'Farming of animals for meat/milk/eggs/honey',
    subcategoryAr: 'تربية الحيوانات لإنتاج اللحوم أو الحليب أو البيض أو العسل',
  },
  {
    categoryNameEn: 'Farming or handling of animals',
    categoryNameAr: 'تربية الحيوانات أو التعامل معها',
    subcategoryCode: 'AII',
    subcategoryEn: 'Farming of fish and seafood',
    subcategoryAr: 'تربية الأسماك والمأكولات البحرية',
  },
  {
    categoryNameEn: 'Farming or handling of plants',
    categoryNameAr: 'زراعة النباتات أو التعامل معها',
    subcategoryCode: 'BI',
    subcategoryEn: 'Farming / handling of plants (other than grains and pulses)',
    subcategoryAr: 'زراعة النباتات أو التعامل معها (عدا الحبوب والبقول)',
  },
  {
    categoryNameEn: 'Farming or handling of plants',
    categoryNameAr: 'زراعة النباتات أو التعامل معها',
    subcategoryCode: 'BII',
    subcategoryEn: 'Farming / handling of grains and pulses',
    subcategoryAr: 'زراعة الحبوب والبقول أو التعامل معها',
  },
  {
    categoryNameEn: 'Farming or handling of plants',
    categoryNameAr: 'زراعة النباتات أو التعامل معها',
    subcategoryCode: 'BIII',
    subcategoryEn: 'Pre-process handling of plant products',
    subcategoryAr: 'التعامل مع المنتجات النباتية قبل التصنيع',
  },
  {
    categoryNameEn: 'Food, ingredient and pet food processing',
    categoryNameAr: 'تصنيع الأغذية والمكونات وأغذية الحيوانات الأليفة',
    subcategoryCode: 'C0',
    subcategoryEn: 'Animal, primary conversion',
    subcategoryAr: 'التحويل الأولي للحيوانات',
  },
  {
    categoryNameEn: 'Food, ingredient and pet food processing',
    categoryNameAr: 'تصنيع الأغذية والمكونات وأغذية الحيوانات الأليفة',
    subcategoryCode: 'CI',
    subcategoryEn: 'Processing of perishable animal products',
    subcategoryAr: 'تصنيع المنتجات الحيوانية سريعة التلف',
  },
  {
    categoryNameEn: 'Food, ingredient and pet food processing',
    categoryNameAr: 'تصنيع الأغذية والمكونات وأغذية الحيوانات الأليفة',
    subcategoryCode: 'CII',
    subcategoryEn: 'Processing of perishable plant-based products',
    subcategoryAr: 'تصنيع المنتجات النباتية سريعة التلف',
  },
  {
    categoryNameEn: 'Food, ingredient and pet food processing',
    categoryNameAr: 'تصنيع الأغذية والمكونات وأغذية الحيوانات الأليفة',
    subcategoryCode: 'CIII',
    subcategoryEn: 'Processing of perishable animal and plant products (mixed products)',
    subcategoryAr: 'تصنيع منتجات مختلطة سريعة التلف من أصل حيواني ونباتي',
  },
  {
    categoryNameEn: 'Food, ingredient and pet food processing',
    categoryNameAr: 'تصنيع الأغذية والمكونات وأغذية الحيوانات الأليفة',
    subcategoryCode: 'CIV',
    subcategoryEn: 'Processing of ambient stable products',
    subcategoryAr: 'تصنيع المنتجات المستقرة في درجة الحرارة المحيطة',
  },
  {
    categoryNameEn: 'Feed and animal food processing',
    categoryNameAr: 'تصنيع الأعلاف وأغذية الحيوانات',
    subcategoryCode: 'D',
    subcategoryEn: 'Feed and animal food processing',
    subcategoryAr: 'تصنيع الأعلاف وأغذية الحيوانات',
  },
  {
    categoryNameEn: 'Catering/food service',
    categoryNameAr: 'التموين وخدمات تقديم الطعام',
    subcategoryCode: 'E',
    subcategoryEn: 'Catering/food service',
    subcategoryAr: 'التموين وخدمات تقديم الطعام',
  },
  {
    categoryNameEn: 'Trading, retail and e-commerce',
    categoryNameAr: 'التجارة والتجزئة والتجارة الإلكترونية',
    subcategoryCode: 'FI',
    subcategoryEn: 'Retail/wholesale',
    subcategoryAr: 'تجارة التجزئة والجملة',
  },
  {
    categoryNameEn: 'Trading, retail and e-commerce',
    categoryNameAr: 'التجارة والتجزئة والتجارة الإلكترونية',
    subcategoryCode: 'FII',
    subcategoryEn: 'Brokering/trading',
    subcategoryAr: 'الوساطة والتجارة',
  },
  {
    categoryNameEn: 'Transport and storage services',
    categoryNameAr: 'خدمات النقل والتخزين',
    subcategoryCode: 'G',
    subcategoryEn: 'Transport and storage services',
    subcategoryAr: 'خدمات النقل والتخزين',
  },
  {
    categoryNameEn: 'Services',
    categoryNameAr: 'الخدمات',
    subcategoryCode: 'H',
    subcategoryEn: 'Services',
    subcategoryAr: 'الخدمات',
  },
  {
    categoryNameEn: 'Production of packaging material',
    categoryNameAr: 'إنتاج مواد التعبئة والتغليف',
    subcategoryCode: 'I',
    subcategoryEn: 'Production of packaging material',
    subcategoryAr: 'إنتاج مواد التعبئة والتغليف',
  },
  {
    categoryNameEn: 'Equipment',
    categoryNameAr: 'المعدات',
    subcategoryCode: 'J',
    subcategoryEn: 'Equipment',
    subcategoryAr: 'المعدات',
  },
  {
    categoryNameEn: 'Chemical and bio-chemical',
    categoryNameAr: 'المنتجات الكيميائية والكيميائية الحيوية',
    subcategoryCode: 'K',
    subcategoryEn: 'Chemical and bio-chemical',
    subcategoryAr: 'المنتجات الكيميائية والكيميائية الحيوية',
  },
]

/**
 * Returns options formatted for select/dropdowns based on the active language.
 */
export function getFoodSafetySubcategoryOptions(lang?: string): { value: string; label: string; category: string }[] {
  const currentLang = lang || (i18n.language?.startsWith('ar') ? 'ar' : 'en')
  return FOOD_SAFETY_SUBCATEGORIES_LIST.map((item) => ({
    value: item.subcategoryCode,
    category: currentLang === 'ar' ? item.categoryNameAr : item.categoryNameEn,
    label: `${item.subcategoryCode} • ${currentLang === 'ar' ? item.subcategoryAr : item.subcategoryEn}`,
  }))
}
