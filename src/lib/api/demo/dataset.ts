/**
 * One coherent, fictional dataset shared by every mocked module.
 *
 * The CAB is CASCO. Eight audit clients move through the certification
 * lifecycle; each application, offer, audit, finding, decision, certificate
 * and invoice below points at the same client and application, so a record
 * opened on one screen matches what the next screen shows.
 *
 * All companies, people, e-mails and numbers are invented for demonstration.
 */
import { formatDateTime, uiLocale } from '@/lib/format/dates'
import { notSet } from '@/lib/emptyValue'

export type DemoStandardCode = 'ISO 9001' | 'ISO 14001' | 'ISO 22000' | 'ISO 45001' | 'ISO/IEC 27001'

export interface DemoStandard {
  code: DemoStandardCode
  edition: string
  name: string
  nameAr: string
  sector: string
  iafCodes: string[]
}

export const STANDARDS: Record<DemoStandardCode, DemoStandard> = {
  'ISO 9001': { code: 'ISO 9001', edition: '2015', name: 'Quality Management System', nameAr: 'نظام إدارة الجودة', sector: 'Quality', iafCodes: ['29', '31'] },
  'ISO 14001': { code: 'ISO 14001', edition: '2015', name: 'Environmental Management System', nameAr: 'نظام الإدارة البيئية', sector: 'Environment', iafCodes: ['14', '31'] },
  'ISO 22000': { code: 'ISO 22000', edition: '2018', name: 'Food Safety Management System', nameAr: 'نظام إدارة سلامة الغذاء', sector: 'Food', iafCodes: ['03'] },
  'ISO 45001': { code: 'ISO 45001', edition: '2018', name: 'Occupational Health and Safety Management System', nameAr: 'نظام إدارة الصحة والسلامة المهنية', sector: 'OH&S', iafCodes: ['28'] },
  'ISO/IEC 27001': { code: 'ISO/IEC 27001', edition: '2022', name: 'Information Security Management System', nameAr: 'نظام إدارة أمن المعلومات', sector: 'Information security', iafCodes: ['33'] },
}

export const standardLabel = (code: DemoStandardCode) => `${code}:${STANDARDS[code].edition}`

/* ── The CAB ─────────────────────────────────────────────────────────── */

export const DEMO_CAB = {
  id: 'cab00000-0000-4000-8000-000000000001',
  organizationId: 'org00000-0000-4000-8000-000000000001',
  name: 'CASCO',
  legalName: 'CASCO For Assessment Services',
  legalNameAr: 'كاسكو لخدمات التقييم',
  city: 'Jeddah',
  country: 'SA',
  address: 'Prince Sultan Road, Al Zahraa District, Jeddah 23425, Saudi Arabia',
  website: 'https://www.casco.example',
  email: 'info@casco.example',
  phone: '+966 12 600 4400',
  accreditationBody: 'SAAC',
  accreditationNumber: 'SAAC-CB-0412',
  admin: { id: 'usr-admin-0001', name: 'Mohamed El Manawahly', email: 'admin@casco.example' },
}

/* ── People: CAB staff and auditors ──────────────────────────────────── */

export type DemoJobRole =
  | 'GENERAL_MANAGER'
  | 'APPLICATIONS_RECEIVER'
  | 'TECHNICAL_MANAGER'
  | 'CERTIFICATION_MANAGER'
  | 'LEAD_AUDITOR'
  | 'AUDITOR'
  | 'ACCOUNTANT'
  | 'COMMITTEE_MEMBER'
  | 'FREELANCE_AUDITOR'

export interface DemoPerson {
  id: string
  userId: string
  code: string
  name: string
  initials: string
  jobRole: DemoJobRole
  competenceRole: 'Auditor' | 'Lead Auditor' | 'Technical Expert' | 'Decision Maker' | 'Reviewer'
  email: string
  phone: string
  country: string
  standards: DemoStandardCode[]
  iafCodes: string[]
  startDate: string
  qualification: string
  fieldOfStudy: string
  experienceYears: number
  color: string
}

export const PEOPLE: DemoPerson[] = [
  { id: 'emp-0001', userId: 'usr-0001', code: 'PER-0001', name: 'Omar Hassan', initials: 'OH', jobRole: 'LEAD_AUDITOR', competenceRole: 'Lead Auditor', email: 'omar.hassan@casco.example', phone: '+966 55 210 3301', country: 'Saudi Arabia', standards: ['ISO 9001', 'ISO 14001', 'ISO 45001'], iafCodes: ['14', '28', '29', '31'], startDate: '2019-02-03', qualification: "Master's Degree", fieldOfStudy: 'Environmental Engineering', experienceYears: 14, color: '#1236a3' },
  { id: 'emp-0002', userId: 'usr-0002', code: 'PER-0002', name: 'Maha Al-Qahtani', initials: 'MQ', jobRole: 'TECHNICAL_MANAGER', competenceRole: 'Lead Auditor', email: 'maha.alqahtani@casco.example', phone: '+966 55 210 3302', country: 'Saudi Arabia', standards: ['ISO 22000', 'ISO 9001'], iafCodes: ['03', '29'], startDate: '2018-09-16', qualification: 'Doctorate / PhD', fieldOfStudy: 'Food Science', experienceYears: 16, color: '#26a65b' },
  { id: 'emp-0003', userId: 'usr-0003', code: 'PER-0003', name: 'Khalid Al-Rashid', initials: 'KR', jobRole: 'AUDITOR', competenceRole: 'Auditor', email: 'khalid.alrashid@casco.example', phone: '+966 55 210 3303', country: 'Saudi Arabia', standards: ['ISO 9001', 'ISO 45001'], iafCodes: ['28', '29'], startDate: '2021-06-01', qualification: "Bachelor's Degree", fieldOfStudy: 'Industrial Engineering', experienceYears: 8, color: '#f59e0b' },
  { id: 'emp-0004', userId: 'usr-0004', code: 'PER-0004', name: 'Nour El-Din Mahmoud', initials: 'NM', jobRole: 'AUDITOR', competenceRole: 'Auditor', email: 'nour.mahmoud@casco.example', phone: '+20 100 455 7104', country: 'Egypt', standards: ['ISO/IEC 27001', 'ISO 9001'], iafCodes: ['33', '35'], startDate: '2022-01-09', qualification: "Master's Degree", fieldOfStudy: 'Computer Science', experienceYears: 9, color: '#349cd0' },
  { id: 'emp-0005', userId: 'usr-0005', code: 'PER-0005', name: 'Layla Ibrahim', initials: 'LI', jobRole: 'CERTIFICATION_MANAGER', competenceRole: 'Decision Maker', email: 'layla.ibrahim@casco.example', phone: '+966 55 210 3305', country: 'Saudi Arabia', standards: ['ISO 9001', 'ISO 14001', 'ISO 22000', 'ISO 45001'], iafCodes: ['03', '14', '28', '29'], startDate: '2017-11-12', qualification: "Master's Degree", fieldOfStudy: 'Quality Management', experienceYears: 18, color: '#7c7c7c' },
  { id: 'emp-0006', userId: 'usr-0006', code: 'PER-0006', name: 'Ahmed Saeed', initials: 'AS', jobRole: 'APPLICATIONS_RECEIVER', competenceRole: 'Reviewer', email: 'ahmed.saeed@casco.example', phone: '+966 55 210 3306', country: 'Saudi Arabia', standards: ['ISO 9001', 'ISO 14001'], iafCodes: ['29', '31'], startDate: '2023-03-19', qualification: "Bachelor's Degree", fieldOfStudy: 'Business Administration', experienceYears: 5, color: '#e74d3c' },
  { id: 'emp-0007', userId: 'usr-0007', code: 'PER-0007', name: 'Rania Fathy', initials: 'RF', jobRole: 'ACCOUNTANT', competenceRole: 'Reviewer', email: 'rania.fathy@casco.example', phone: '+20 100 455 7107', country: 'Egypt', standards: [], iafCodes: [], startDate: '2022-08-14', qualification: "Bachelor's Degree", fieldOfStudy: 'Accounting', experienceYears: 7, color: '#656565' },
  { id: 'emp-0008', userId: 'usr-0008', code: 'PER-0008', name: 'Youssef Kamal', initials: 'YK', jobRole: 'FREELANCE_AUDITOR', competenceRole: 'Technical Expert', email: 'youssef.kamal@casco.example', phone: '+20 100 455 7108', country: 'Egypt', standards: ['ISO 22000'], iafCodes: ['03'], startDate: '2024-04-01', qualification: "Master's Degree", fieldOfStudy: 'Dairy Technology', experienceYears: 11, color: '#1c7d44' },
  { id: 'emp-0009', userId: 'usr-0009', code: 'PER-0009', name: 'Hana Al-Ghamdi', initials: 'HG', jobRole: 'COMMITTEE_MEMBER', competenceRole: 'Decision Maker', email: 'hana.alghamdi@casco.example', phone: '+966 55 210 3309', country: 'Saudi Arabia', standards: ['ISO 9001', 'ISO 45001', 'ISO/IEC 27001'], iafCodes: ['28', '29', '33'], startDate: '2020-10-04', qualification: "Master's Degree", fieldOfStudy: 'Occupational Safety', experienceYears: 12, color: '#143db8' },
]

export const personByName = (name: string) => PEOPLE.find((p) => p.name === name)
export const person = (id: string) => PEOPLE.find((p) => p.id === id)!

/* ── Audit clients ───────────────────────────────────────────────────── */

export interface DemoContact {
  id: string
  firstName: string
  lastName: string
  role: string
  email: string
  phonePrefix: string
  phone: string
  isPrimary: boolean
  isSignatory: boolean
  portalAccess: boolean
}

export interface DemoSite {
  id: string
  name: string
  address: string
  employees: number
}

export interface DemoClient {
  id: string
  code: string
  name: string
  nameAr: string
  tradeName: string
  legalCapacity: string
  industry: string
  activity: string
  country: 'Saudi Arabia' | 'Egypt'
  countryCode: 'SA' | 'EG'
  city: string
  address: string
  addressAr: string
  crNumber: string
  website: string
  employees: number
  currency: 'SAR' | 'EGP'
  contacts: DemoContact[]
  sites: DemoSite[]
  createdAt: string
}

const contact = (
  id: string, firstName: string, lastName: string, role: string, email: string,
  phonePrefix: string, phone: string, extra: Partial<DemoContact> = {},
): DemoContact => ({ id, firstName, lastName, role, email, phonePrefix, phone, isPrimary: false, isSignatory: false, portalAccess: false, ...extra })

/** Client codes are the first 8 characters of the id, as `deriveClientCode` shows them everywhere. */
export const CLIENTS: DemoClient[] = [
  {
    id: 'c1a00001-4e2b-4c1a-9b11-000000000001', code: 'C1A00001', name: 'Al Noor Food Industries', nameAr: 'النور للصناعات الغذائية', tradeName: 'Al Noor',
    legalCapacity: 'Limited Liability Company', industry: 'Food Manufacturing', activity: 'Production and packaging of dairy desserts, juices and bakery products',
    country: 'Saudi Arabia', countryCode: 'SA', city: 'Jeddah', address: 'Phase 3, Industrial City, Jeddah 21452, Saudi Arabia', addressAr: 'المرحلة الثالثة، المدينة الصناعية، جدة ٢١٤٥٢، المملكة العربية السعودية',
    crNumber: '4030219874', website: 'https://alnoor-foods.example', employees: 240, currency: 'SAR',
    contacts: [
      contact('cnt-0101', 'Sara', 'Ali', 'Quality Manager', 'sara.ali@alnoor-foods.example', '+966', '50 123 4567', { isPrimary: true, isSignatory: true, portalAccess: true }),
      contact('cnt-0102', 'Fahad', 'Al-Zahrani', 'Plant Manager', 'fahad.z@alnoor-foods.example', '+966', '50 765 4321'),
    ],
    sites: [
      { id: 'SITE-0101', name: 'Jeddah Main Plant', address: 'Phase 3, Industrial City, Jeddah 21452', employees: 190 },
      { id: 'SITE-0102', name: 'Makkah Distribution Centre', address: 'Al Awali District, Makkah 24381', employees: 50 },
    ],
    createdAt: '2026-02-18T09:20:00Z',
  },
  {
    id: 'c1a00002-4e2b-4c1a-9b11-000000000002', code: 'C1A00002', name: 'GreenLeaf Packaging Co.', nameAr: 'جرين ليف للتغليف', tradeName: 'GreenLeaf',
    legalCapacity: 'Limited Liability Company', industry: 'Packaging', activity: 'Manufacture of recyclable paper and plastic food packaging',
    country: 'Saudi Arabia', countryCode: 'SA', city: 'Riyadh', address: 'Second Industrial City, Riyadh 14334, Saudi Arabia', addressAr: 'المدينة الصناعية الثانية، الرياض ١٤٣٣٤، المملكة العربية السعودية',
    crNumber: '1010458820', website: 'https://greenleaf-pack.example', employees: 180, currency: 'SAR',
    contacts: [
      contact('cnt-0201', 'Ahmed', 'Mansour', 'HSE Director', 'ahmed.mansour@greenleaf-pack.example', '+966', '53 220 1188', { isPrimary: true, isSignatory: true, portalAccess: true }),
      contact('cnt-0202', 'Reem', 'Al-Dosari', 'Environmental Officer', 'reem.d@greenleaf-pack.example', '+966', '53 220 1199'),
    ],
    sites: [
      { id: 'SITE-0201', name: 'Riyadh Production Plant', address: 'Second Industrial City, Riyadh 14334', employees: 150 },
      { id: 'SITE-0202', name: 'Dammam Warehouse', address: 'First Industrial City, Dammam 32234', employees: 30 },
    ],
    createdAt: '2026-04-22T11:05:00Z',
  },
  {
    id: 'c1a00003-4e2b-4c1a-9b11-000000000003', code: 'C1A00003', name: 'Apex Health Systems', nameAr: 'أبكس للأنظمة الصحية', tradeName: 'Apex Health',
    legalCapacity: 'Private Limited Company', industry: 'Healthcare Services', activity: 'Outpatient diagnostic and laboratory services',
    country: 'Egypt', countryCode: 'EG', city: 'Cairo', address: '90th Street, Fifth Settlement, New Cairo 11835, Egypt', addressAr: 'شارع التسعين، التجمع الخامس، القاهرة الجديدة ١١٨٣٥، مصر',
    crNumber: '18452', website: 'https://apex-health.example', employees: 320, currency: 'EGP',
    contacts: [
      contact('cnt-0301', 'Dina', 'Farouk', 'Quality & Accreditation Manager', 'dina.farouk@apex-health.example', '+20', '100 222 3344', { isPrimary: true, isSignatory: true, portalAccess: true }),
    ],
    sites: [
      { id: 'SITE-0301', name: 'New Cairo Medical Centre', address: '90th Street, Fifth Settlement, New Cairo', employees: 240 },
      { id: 'SITE-0302', name: 'Nasr City Laboratory', address: 'Abbas El Akkad Street, Nasr City, Cairo', employees: 80 },
    ],
    createdAt: '2026-03-30T08:40:00Z',
  },
  {
    id: 'c1a00004-4e2b-4c1a-9b11-000000000004', code: 'C1A00004', name: 'BuildWell Contracting', nameAr: 'بيلدويل للمقاولات', tradeName: 'BuildWell',
    legalCapacity: 'Limited Liability Company', industry: 'Construction', activity: 'Civil and MEP contracting for commercial buildings',
    country: 'Saudi Arabia', countryCode: 'SA', city: 'Dammam', address: 'King Saud Street, Al Faisaliyah, Dammam 32272, Saudi Arabia', addressAr: 'شارع الملك سعود، الفيصلية، الدمام ٣٢٢٧٢، المملكة العربية السعودية',
    crNumber: '2050117730', website: 'https://buildwell.example', employees: 410, currency: 'SAR',
    contacts: [
      contact('cnt-0401', 'Faisal', 'Al-Otaibi', 'HSE Manager', 'faisal.otaibi@buildwell.example', '+966', '54 330 9911', { isPrimary: true, isSignatory: true, portalAccess: true }),
      contact('cnt-0402', 'Mariam', 'Haddad', 'Document Controller', 'mariam.haddad@buildwell.example', '+966', '54 330 9922'),
    ],
    sites: [
      { id: 'SITE-0401', name: 'Dammam Head Office', address: 'King Saud Street, Al Faisaliyah, Dammam', employees: 60 },
      { id: 'SITE-0402', name: 'Al Khobar Tower Project', address: 'Prince Turki Street, Al Khobar', employees: 350 },
    ],
    createdAt: '2026-06-14T10:15:00Z',
  },
  {
    id: 'c1a00005-4e2b-4c1a-9b11-000000000005', code: 'C1A00005', name: 'Red Sea Logistics', nameAr: 'البحر الأحمر للخدمات اللوجستية', tradeName: 'Red Sea Logistics',
    legalCapacity: 'Limited Liability Company', industry: 'Logistics', activity: 'Freight forwarding, customs clearance and bonded warehousing',
    country: 'Saudi Arabia', countryCode: 'SA', city: 'Jeddah', address: 'Jeddah Islamic Port, Gate 10, Jeddah 22312, Saudi Arabia', addressAr: 'ميناء جدة الإسلامي، البوابة ١٠، جدة ٢٢٣١٢، المملكة العربية السعودية',
    crNumber: '4030188215', website: 'https://redsea-logistics.example', employees: 150, currency: 'SAR',
    contacts: [
      contact('cnt-0501', 'Hassan', 'Ali', 'Operations Director', 'hassan.ali@redsea-logistics.example', '+966', '56 410 2277', { isPrimary: true, isSignatory: true, portalAccess: true }),
    ],
    sites: [
      { id: 'SITE-0501', name: 'Jeddah Port Warehouse', address: 'Jeddah Islamic Port, Gate 10, Jeddah', employees: 150 },
    ],
    createdAt: '2023-11-02T07:30:00Z',
  },
  {
    id: 'c1a00006-4e2b-4c1a-9b11-000000000006', code: 'C1A00006', name: 'Gulf Dairy Products', nameAr: 'الخليج لمنتجات الألبان', tradeName: 'Gulf Dairy',
    legalCapacity: 'Public Limited Company', industry: 'Food Manufacturing', activity: 'Processing of fresh milk, laban and yoghurt',
    country: 'Saudi Arabia', countryCode: 'SA', city: 'Al Kharj', address: 'Al Kharj Road, Km 40, Al Kharj 16278, Saudi Arabia', addressAr: 'طريق الخرج، كم ٤٠، الخرج ١٦٢٧٨، المملكة العربية السعودية',
    crNumber: '1011025566', website: 'https://gulf-dairy.example', employees: 520, currency: 'SAR',
    contacts: [
      contact('cnt-0601', 'Mona', 'Al-Harbi', 'Food Safety Team Leader', 'mona.alharbi@gulf-dairy.example', '+966', '55 870 4400', { isPrimary: true, isSignatory: true, portalAccess: true }),
      contact('cnt-0602', 'Tariq', 'Al-Shehri', 'Production Manager', 'tariq.shehri@gulf-dairy.example', '+966', '55 870 4411'),
    ],
    sites: [
      { id: 'SITE-0601', name: 'Al Kharj Dairy Plant', address: 'Al Kharj Road, Km 40, Al Kharj', employees: 520 },
    ],
    createdAt: '2023-09-11T12:00:00Z',
  },
  {
    id: 'c1a00007-4e2b-4c1a-9b11-000000000007', code: 'C1A00007', name: 'TechWave Solutions', nameAr: 'تك ويف للحلول', tradeName: 'TechWave',
    legalCapacity: 'Private Limited Company', industry: 'Information Technology', activity: 'Cloud hosting, managed IT and software development services',
    country: 'Egypt', countryCode: 'EG', city: 'Giza', address: 'Smart Village, Building B12, Giza 12577, Egypt', addressAr: 'القرية الذكية، مبنى B12، الجيزة ١٢٥٧٧، مصر',
    crNumber: '20931', website: 'https://techwave.example', employees: 95, currency: 'EGP',
    contacts: [
      contact('cnt-0701', 'Karim', 'Nabil', 'CISO', 'karim.nabil@techwave.example', '+20', '101 555 7788', { isPrimary: true, isSignatory: true, portalAccess: true }),
    ],
    sites: [
      { id: 'SITE-0701', name: 'Smart Village Office & Data Room', address: 'Smart Village, Building B12, Giza', employees: 95 },
    ],
    createdAt: '2023-05-21T09:00:00Z',
  },
  {
    id: 'c1a00008-4e2b-4c1a-9b11-000000000008', code: 'C1A00008', name: 'Desert Grains Co.', nameAr: 'شركة حبوب الصحراء', tradeName: 'Desert Grains',
    legalCapacity: 'Limited Liability Company', industry: 'Agriculture & Milling', activity: 'Wheat milling and flour packaging',
    country: 'Saudi Arabia', countryCode: 'SA', city: 'Riyadh', address: 'Al Sulay Industrial Area, Riyadh 14322, Saudi Arabia', addressAr: 'منطقة السلي الصناعية، الرياض ١٤٣٢٢، المملكة العربية السعودية',
    crNumber: '1010722410', website: 'https://desert-grains.example', employees: 130, currency: 'SAR',
    contacts: [
      contact('cnt-0801', 'Abdullah', 'Kareem', 'General Manager', 'abdullah.kareem@desert-grains.example', '+966', '59 120 6655', { isPrimary: true, isSignatory: true, portalAccess: true }),
    ],
    sites: [
      { id: 'SITE-0801', name: 'Al Sulay Flour Mill', address: 'Al Sulay Industrial Area, Riyadh', employees: 130 },
    ],
    createdAt: '2026-08-30T13:10:00Z',
  },
]

export const client = (id: string) => CLIENTS.find((c) => c.id === id)!
export const clientByName = (name: string) => CLIENTS.find((c) => c.name === name)
export const primaryContact = (c: DemoClient) => c.contacts.find((x) => x.isPrimary) ?? c.contacts[0]
export const contactName = (x: DemoContact) => `${x.firstName} ${x.lastName}`

/** The audit client the portal preview signs in as. */
export const PORTAL_CLIENT_ID = CLIENTS[0].id

/* ── Applications across the lifecycle ───────────────────────────────── */

export type DemoAppStatus =
  | 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  | 'QUOTATION_CREATED' | 'QUOTATION_ISSUED' | 'QUOTATION_ACCEPTED' | 'QUOTATION_REJECTED'

/** Where the application sits in the end-to-end flow (drives dashboards and the pipeline chart). */
export type DemoStage =
  | 'draft' | 'received' | 'review' | 'informationRequired' | 'technicalFeasibility'
  | 'quotation' | 'offer' | 'auditPlanning' | 'auditReporting' | 'decision' | 'certified' | 'rejected'

export interface DemoApplication {
  id: string
  orderNumber: string
  clientId: string
  standard: DemoStandardCode
  requestType: 'NEW' | 'RENEWAL'
  status: DemoAppStatus
  stage: DemoStage
  scope: string
  scopeAr: string
  sitesInScope: string[]
  employeesInScope: number
  createdAt: string
  submittedAt: string | null
  updatedAt: string
  leadAuditorId: string | null
  teamIds: string[]
}

export const APPLICATIONS: DemoApplication[] = [
  { id: 'a9000141-7d1e-4b5a-8c01-000000000141', orderNumber: 'APP-0141', clientId: CLIENTS[0].id, standard: 'ISO 22000', requestType: 'NEW', status: 'QUOTATION_ACCEPTED', stage: 'certified',
    scope: 'Production, packaging and distribution of dairy desserts, juices and bakery products.', scopeAr: 'إنتاج وتعبئة وتوزيع حلويات الألبان والعصائر ومنتجات المخابز.',
    sitesInScope: ['SITE-0101', 'SITE-0102'], employeesInScope: 240, createdAt: '2026-02-24T08:00:00Z', submittedAt: '2026-03-02T09:14:00Z', updatedAt: '2026-06-12T10:00:00Z', leadAuditorId: 'emp-0002', teamIds: ['emp-0002', 'emp-0008'] },
  { id: 'a9000142-7d1e-4b5a-8c01-000000000142', orderNumber: 'APP-0142', clientId: CLIENTS[1].id, standard: 'ISO 14001', requestType: 'NEW', status: 'QUOTATION_ACCEPTED', stage: 'auditReporting',
    scope: 'Manufacture of recyclable paper and plastic food packaging, including printing and warehousing.', scopeAr: 'تصنيع عبوات الأغذية الورقية والبلاستيكية القابلة لإعادة التدوير بما في ذلك الطباعة والتخزين.',
    sitesInScope: ['SITE-0201', 'SITE-0202'], employeesInScope: 180, createdAt: '2026-04-28T08:00:00Z', submittedAt: '2026-05-05T10:30:00Z', updatedAt: '2026-10-08T15:20:00Z', leadAuditorId: 'emp-0001', teamIds: ['emp-0001', 'emp-0003'] },
  { id: 'a9000143-7d1e-4b5a-8c01-000000000143', orderNumber: 'APP-0143', clientId: CLIENTS[2].id, standard: 'ISO 9001', requestType: 'NEW', status: 'QUOTATION_ACCEPTED', stage: 'decision',
    scope: 'Provision of outpatient diagnostic imaging and clinical laboratory services.', scopeAr: 'تقديم خدمات التصوير التشخيصي والمختبرات السريرية للعيادات الخارجية.',
    sitesInScope: ['SITE-0301', 'SITE-0302'], employeesInScope: 320, createdAt: '2026-04-05T08:00:00Z', submittedAt: '2026-04-12T11:00:00Z', updatedAt: '2026-10-02T09:00:00Z', leadAuditorId: 'emp-0004', teamIds: ['emp-0004', 'emp-0003'] },
  { id: 'a9000144-7d1e-4b5a-8c01-000000000144', orderNumber: 'APP-0144', clientId: CLIENTS[3].id, standard: 'ISO 45001', requestType: 'NEW', status: 'QUOTATION_ACCEPTED', stage: 'auditPlanning',
    scope: 'Civil and MEP contracting for commercial buildings, including site supervision.', scopeAr: 'أعمال المقاولات المدنية والكهروميكانيكية للمباني التجارية بما في ذلك الإشراف على المواقع.',
    sitesInScope: ['SITE-0401', 'SITE-0402'], employeesInScope: 410, createdAt: '2026-06-24T08:00:00Z', submittedAt: '2026-07-01T08:45:00Z', updatedAt: '2026-10-15T12:00:00Z', leadAuditorId: 'emp-0001', teamIds: ['emp-0001', 'emp-0003'] },
  { id: 'a9000145-7d1e-4b5a-8c01-000000000145', orderNumber: 'APP-0145', clientId: CLIENTS[4].id, standard: 'ISO 14001', requestType: 'NEW', status: 'QUOTATION_ISSUED', stage: 'offer',
    scope: 'Freight forwarding, customs clearance and bonded warehousing at Jeddah Islamic Port.', scopeAr: 'الشحن والتخليص الجمركي والتخزين في المستودعات الجمركية بميناء جدة الإسلامي.',
    sitesInScope: ['SITE-0501'], employeesInScope: 150, createdAt: '2026-08-18T08:00:00Z', submittedAt: '2026-08-25T10:00:00Z', updatedAt: '2026-10-12T14:10:00Z', leadAuditorId: 'emp-0001', teamIds: ['emp-0001'] },
  { id: 'a9000146-7d1e-4b5a-8c01-000000000146', orderNumber: 'APP-0146', clientId: CLIENTS[5].id, standard: 'ISO 22000', requestType: 'RENEWAL', status: 'QUOTATION_CREATED', stage: 'quotation',
    scope: 'Processing and packaging of fresh milk, laban and yoghurt.', scopeAr: 'معالجة وتعبئة الحليب الطازج واللبن والزبادي.',
    sitesInScope: ['SITE-0601'], employeesInScope: 520, createdAt: '2026-09-07T08:00:00Z', submittedAt: '2026-09-10T09:30:00Z', updatedAt: '2026-10-19T11:00:00Z', leadAuditorId: 'emp-0002', teamIds: ['emp-0002', 'emp-0008'] },
  { id: 'a9000147-7d1e-4b5a-8c01-000000000147', orderNumber: 'APP-0147', clientId: CLIENTS[6].id, standard: 'ISO/IEC 27001', requestType: 'NEW', status: 'APPROVED', stage: 'technicalFeasibility',
    scope: 'Cloud hosting, managed IT services and software development.', scopeAr: 'الاستضافة السحابية وخدمات تقنية المعلومات المدارة وتطوير البرمجيات.',
    sitesInScope: ['SITE-0701'], employeesInScope: 95, createdAt: '2026-09-22T08:00:00Z', submittedAt: '2026-09-28T13:00:00Z', updatedAt: '2026-10-16T10:40:00Z', leadAuditorId: 'emp-0004', teamIds: ['emp-0004'] },
  { id: 'a9000148-7d1e-4b5a-8c01-000000000148', orderNumber: 'APP-0148', clientId: CLIENTS[7].id, standard: 'ISO 9001', requestType: 'NEW', status: 'UNDER_REVIEW', stage: 'informationRequired',
    scope: 'Wheat milling, flour blending and packaging.', scopeAr: 'طحن القمح وخلط الدقيق وتعبئته.',
    sitesInScope: ['SITE-0801'], employeesInScope: 130, createdAt: '2026-09-29T08:00:00Z', submittedAt: '2026-10-04T09:05:00Z', updatedAt: '2026-10-14T16:30:00Z', leadAuditorId: 'emp-0003', teamIds: ['emp-0003'] },
  { id: 'a9000149-7d1e-4b5a-8c01-000000000149', orderNumber: 'APP-0149', clientId: CLIENTS[0].id, standard: 'ISO 9001', requestType: 'NEW', status: 'SUBMITTED', stage: 'received',
    scope: 'Production and distribution of dairy desserts, juices and bakery products.', scopeAr: 'إنتاج وتوزيع حلويات الألبان والعصائر ومنتجات المخابز.',
    sitesInScope: ['SITE-0101'], employeesInScope: 190, createdAt: '2026-10-18T08:00:00Z', submittedAt: '2026-10-20T10:12:00Z', updatedAt: '2026-10-20T10:12:00Z', leadAuditorId: null, teamIds: [] },
  { id: 'a9000150-7d1e-4b5a-8c01-000000000150', orderNumber: 'APP-0150', clientId: CLIENTS[1].id, standard: 'ISO 45001', requestType: 'NEW', status: 'SUBMITTED', stage: 'received',
    scope: 'Manufacture of recyclable food packaging and warehousing operations.', scopeAr: 'تصنيع عبوات الأغذية القابلة لإعادة التدوير وعمليات التخزين.',
    sitesInScope: ['SITE-0201'], employeesInScope: 150, createdAt: '2026-10-15T08:00:00Z', submittedAt: '2026-10-18T12:40:00Z', updatedAt: '2026-10-18T12:40:00Z', leadAuditorId: null, teamIds: [] },
  { id: 'a9000151-7d1e-4b5a-8c01-000000000151', orderNumber: 'APP-0151', clientId: CLIENTS[4].id, standard: 'ISO 45001', requestType: 'NEW', status: 'DRAFT', stage: 'draft',
    scope: 'Warehousing and freight handling operations.', scopeAr: 'عمليات التخزين ومناولة الشحنات.',
    sitesInScope: ['SITE-0501'], employeesInScope: 150, createdAt: '2026-10-21T08:00:00Z', submittedAt: null, updatedAt: '2026-10-21T15:00:00Z', leadAuditorId: null, teamIds: [] },
  { id: 'a9000152-7d1e-4b5a-8c01-000000000152', orderNumber: 'APP-0152', clientId: CLIENTS[2].id, standard: 'ISO 14001', requestType: 'NEW', status: 'REJECTED', stage: 'rejected',
    scope: 'Medical waste handling at the New Cairo Medical Centre.', scopeAr: 'التعامل مع النفايات الطبية في مركز القاهرة الجديدة الطبي.',
    sitesInScope: ['SITE-0301'], employeesInScope: 40, createdAt: '2026-07-20T08:00:00Z', submittedAt: '2026-07-26T10:00:00Z', updatedAt: '2026-08-11T09:00:00Z', leadAuditorId: null, teamIds: [] },
]

export const application = (orderOrId: string) =>
  APPLICATIONS.find((a) => a.id === orderOrId || a.orderNumber === orderOrId)
export const applicationsOf = (clientId: string) => APPLICATIONS.filter((a) => a.clientId === clientId)

/* ── Commercial and audit records keyed to the applications ──────────── */

/** Fee basis per application, in the client's currency (excl. VAT). */
export interface QuoteStandardBasis { code: DemoStandardCode; stage1Days: number; stage2Days: number; survDays: number }
export const QUOTE_BASIS: Record<string, { stage1Days: number; stage2Days: number; survDays: number; dailyRate: number; travel: number; extraStandards?: QuoteStandardBasis[] }> = {
  'APP-0141': { stage1Days: 1.5, stage2Days: 3, survDays: 2, dailyRate: 3200, travel: 1500 },
  'APP-0142': { stage1Days: 1.5, stage2Days: 3, survDays: 2, dailyRate: 3000, travel: 2200 },
  'APP-0143': { stage1Days: 2, stage2Days: 3.5, survDays: 2, dailyRate: 9500, travel: 0 },
  'APP-0144': { stage1Days: 2, stage2Days: 4, survDays: 2.5, dailyRate: 3000, travel: 2600 },
  'APP-0145': { stage1Days: 1, stage2Days: 2.5, survDays: 1.5, dailyRate: 3000, travel: 800, extraStandards: [{ code: 'ISO 9001', stage1Days: 1, stage2Days: 2, survDays: 1 }] },
  'APP-0146': { stage1Days: 0, stage2Days: 4, survDays: 2.5, dailyRate: 3200, travel: 1800, extraStandards: [{ code: 'ISO 9001', stage1Days: 0, stage2Days: 2.5, survDays: 1.5 }, { code: 'ISO 45001', stage1Days: 1, stage2Days: 2, survDays: 1 }] },
}

/** Certificates already issued, being prepared, or no longer valid. */
export interface DemoCertificate {
  id: string
  number: string
  clientId: string
  applicationNumber: string
  standard: DemoStandardCode
  status: 'DRAFT' | 'ISSUED' | 'SUSPENDED' | 'WITHDRAWN'
  issuedAt: string
  validUntil: string | null
  decisionNumber: string
  decisionDate: string
}

export const CERTIFICATES: DemoCertificate[] = [
  { id: '143', number: 'CAS-QMS-2026-0143', clientId: CLIENTS[2].id, applicationNumber: 'APP-0143', standard: 'ISO 9001', status: 'DRAFT', issuedAt: '2026-10-21T09:00:00Z', validUntil: null, decisionNumber: 'DEC-0143', decisionDate: '2026-10-21' },
  { id: '141', number: 'CAS-FSM-2026-0141', clientId: CLIENTS[0].id, applicationNumber: 'APP-0141', standard: 'ISO 22000', status: 'ISSUED', issuedAt: '2026-06-12T10:00:00Z', validUntil: '2029-06-11T00:00:00Z', decisionNumber: 'DEC-0141', decisionDate: '2026-06-10' },
  { id: '102', number: 'CAS-QMS-2024-0102', clientId: CLIENTS[4].id, applicationNumber: 'APP-0102', standard: 'ISO 9001', status: 'ISSUED', issuedAt: '2024-02-20T10:00:00Z', validUntil: '2027-02-19T00:00:00Z', decisionNumber: 'DEC-0102', decisionDate: '2024-02-18' },
  { id: '98', number: 'CAS-FSM-2023-0098', clientId: CLIENTS[5].id, applicationNumber: 'APP-0098', standard: 'ISO 22000', status: 'ISSUED', issuedAt: '2023-12-15T10:00:00Z', validUntil: '2026-12-14T00:00:00Z', decisionNumber: 'DEC-0098', decisionDate: '2023-12-13' },
  { id: '87', number: 'CAS-QMS-2023-0087', clientId: CLIENTS[6].id, applicationNumber: 'APP-0087', standard: 'ISO 9001', status: 'SUSPENDED', issuedAt: '2023-07-09T10:00:00Z', validUntil: '2026-07-08T00:00:00Z', decisionNumber: 'DEC-0087', decisionDate: '2023-07-06' },
  { id: '75', number: 'CAS-QMS-2022-0075', clientId: CLIENTS[3].id, applicationNumber: 'APP-0075', standard: 'ISO 9001', status: 'WITHDRAWN', issuedAt: '2022-03-14T10:00:00Z', validUntil: '2025-03-13T00:00:00Z', decisionNumber: 'DEC-0075', decisionDate: '2022-03-10' },
]

/* ── Formatting helpers shared by the modules ────────────────────────── */

const DAY = 86_400_000
/** The demo's notion of "today", so overdue/due-in values stay meaningful. */
export const demoToday = () => new Date()

/** Ready-to-show date in the UI language (Arabic months, Latin digits), like the API's display dates. */
export function fmtDate(iso: string | null | undefined, locale = uiLocale()): string {
  if (!iso) return notSet()
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}

export function fmtDateTime(iso: string): string {
  return formatDateTime(iso)
}

export const isoDate = (iso: string) => iso.slice(0, 10)

export function daysFromToday(iso: string): number {
  return Math.round((new Date(iso).getTime() - demoToday().getTime()) / DAY)
}

export function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * DAY).toISOString()
}

export function money(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('')
}

export function nowIso(): string {
  return new Date().toISOString()
}
