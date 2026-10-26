/**
 * Global catalog of accreditation bodies (ABs).
 *
 * Sources: ILAC "Members by economy" (full members and associates) and the ILAC MRA signatory list
 * (updated 8 May 2024). IAF and ILAC merged into Global Accreditation Cooperation Incorporated
 * (Global ACI) on 1 January 2026; the arrangements and their signatories carried over.
 * Keep `value` stable: it is what CAB accreditation records store.
 *
 * Logos: each AB's logo and accreditation symbol belong to that AB and may only be used under its
 * rules. Put an official file in `public/accreditation-bodies/<value>.png` (or reuse an existing
 * app asset) and set `logo`; bodies without a logo show a monogram badge.
 */

export type AccreditationRecognition = 'ILAC_MRA' | 'ILAC_ASSOCIATE' | 'IAF_MLA'

export interface AccreditationBody {
  /** Stable id stored on accreditation records. */
  value: string
  acronym: string
  name: string
  /** ISO 3166-1 alpha-2 codes of the economies the body serves. */
  countries: string[]
  recognition: AccreditationRecognition
  website?: string
  /** Path under `public/` (without a leading slash). */
  logo?: string
}

export const ACCREDITATION_BODY_OTHER_VALUE = 'OTHER'

const SADC = ['BW', 'AO', 'KM', 'CD', 'LS', 'MG', 'MW', 'MZ', 'NA', 'SC', 'SZ', 'TZ', 'ZM', 'ZW']
const WAEMU = ['CI', 'BJ', 'BF', 'GW', 'ML', 'NE', 'SN', 'TG']
const GCC = ['SA', 'AE', 'BH', 'KW', 'OM', 'QA', 'YE']

const M = 'ILAC_MRA' as const
const A = 'ILAC_ASSOCIATE' as const

export const ACCREDITATION_BODIES: AccreditationBody[] = [
  { value: 'DPA', acronym: 'DPA', name: 'General Directorate of Accreditation', countries: ['AL'], recognition: M, website: 'http://www.dpa.gov.al' },
  { value: 'ALGERAC', acronym: 'ALGERAC', name: 'Algerian Accreditation Body', countries: ['DZ'], recognition: M, website: 'http://www.algerac.dz' },
  { value: 'OAA', acronym: 'OAA', name: 'Organismo Argentino de Acreditación', countries: ['AR'], recognition: M, website: 'http://www.oaa.org.ar' },
  { value: 'JAS_ANZ', acronym: 'JAS-ANZ', name: 'Joint Accreditation System of Australia and New Zealand', countries: ['AU', 'NZ'], recognition: M, website: 'https://www.jasanz.org' },
  { value: 'NATA', acronym: 'NATA', name: 'National Association of Testing Authorities, Australia', countries: ['AU'], recognition: M, website: 'http://www.nata.com.au' },
  { value: 'AKKREDITIERUNG_AUSTRIA', acronym: 'AA', name: 'Akkreditierung Austria', countries: ['AT'], recognition: M, website: 'https://www.bmdw.gv.at/en/Services/Accreditation.html' },
  { value: 'AZAK', acronym: 'AzAK', name: 'Azerbaijan Accreditation Center', countries: ['AZ'], recognition: M, website: 'http://www.accreditation.gov.az' },
  { value: 'BAB', acronym: 'BAB', name: 'Bangladesh Accreditation Board', countries: ['BD'], recognition: M, website: 'http://www.bab.gov.bd' },
  { value: 'BSCA', acronym: 'BSCA', name: 'Belarusian State Centre for Accreditation', countries: ['BY'], recognition: M, website: 'http://www.bsca.by' },
  { value: 'BELAC', acronym: 'BELAC', name: 'Belgian Accreditation Structure', countries: ['BE'], recognition: M, website: 'http://www.belac.fgov.be' },
  { value: 'DTA_IBMETRO', acronym: 'DTA-IBMETRO', name: 'Dirección Técnica de Acreditación del Instituto Boliviano de Metrología', countries: ['BO'], recognition: M, website: 'https://www.ibmetro.gob.bo/dta' },
  { value: 'BATA', acronym: 'BATA', name: 'Institute for Accreditation of Bosnia and Herzegovina', countries: ['BA'], recognition: M, website: 'http://www.bata.gov.ba' },
  { value: 'SADCAS', acronym: 'SADCAS', name: 'Southern African Development Community Accreditation Service', countries: SADC, recognition: M, website: 'http://www.sadcas.org' },
  { value: 'CGCRE', acronym: 'CGCRE', name: 'General Coordination for Accreditation (Inmetro)', countries: ['BR'], recognition: M, website: 'https://www.gov.br/inmetro/pt-br/assuntos/acreditacao' },
  { value: 'EA_BAS', acronym: 'EA BAS', name: 'Executive Agency Bulgarian Accreditation Service', countries: ['BG'], recognition: M, website: 'http://www.nab-bas.bg/en' },
  { value: 'CANC_GDAC', acronym: 'CANC-GDAC', name: 'Cambodian Accreditation National Council, General Department of Accreditation of Cambodia', countries: ['KH'], recognition: M, website: 'https://www.da-canc.gov.kh' },
  { value: 'ACCREDITATION_CANADA_DIAGNOSTICS', acronym: 'ACD', name: 'Accreditation Canada Diagnostics', countries: ['CA'], recognition: M, website: 'https://diagnostics.accreditation.ca' },
  { value: 'CALA', acronym: 'CALA', name: 'Canadian Association for Laboratory Accreditation Inc.', countries: ['CA'], recognition: M, website: 'http://www.cala.ca' },
  { value: 'SCC', acronym: 'SCC', name: 'Standards Council of Canada', countries: ['CA'], recognition: M, website: 'http://www.scc-ccn.ca' },
  { value: 'INN', acronym: 'INN', name: 'Instituto Nacional de Normalización', countries: ['CL'], recognition: M, website: 'http://www.inn.cl' },
  { value: 'CNAS', acronym: 'CNAS', name: 'China National Accreditation Service for Conformity Assessment', countries: ['CN'], recognition: M, website: 'http://www.cnas.org.cn' },
  { value: 'TAF', acronym: 'TAF', name: 'Taiwan Accreditation Foundation', countries: ['TW'], recognition: M, website: 'https://www.taftw.org.tw/en/' },
  { value: 'ONAC', acronym: 'ONAC', name: 'Organismo Nacional de Acreditación de Colombia', countries: ['CO'], recognition: M, website: 'http://www.onac.org.co' },
  { value: 'ECA', acronym: 'ECA', name: 'Ente Costarricense de Acreditación', countries: ['CR'], recognition: M, website: 'http://www.eca.or.cr' },
  { value: 'SOAC_WAAS', acronym: 'SOAC-WAAS', name: "Système Ouest Africain d'Accréditation", countries: WAEMU, recognition: M, website: 'http://www.soacwaas.org' },
  { value: 'CRESAC', acronym: 'CRESAC', name: "Centre Régional d'Evaluation en Education, Environnement, Santé et d'Accréditation en Afrique", countries: ['CI', 'BJ', 'CM', 'GA', 'SN'], recognition: A, website: 'http://www.cresac-afrique.org' },
  { value: 'HAA', acronym: 'HAA', name: 'Croatian Accreditation Agency', countries: ['HR'], recognition: M, website: 'http://www.akreditacija.hr' },
  { value: 'CYS_CYSAB', acronym: 'CYS-CYSAB', name: 'Cyprus Accreditation Body', countries: ['CY'], recognition: M, website: 'http://www.cys.meci.gov.cy' },
  { value: 'CAI', acronym: 'CAI', name: 'Czech Accreditation Institute', countries: ['CZ'], recognition: M, website: 'http://www.cai.cz' },
  { value: 'DANAK', acronym: 'DANAK', name: 'Danish Accreditation Fund', countries: ['DK'], recognition: M, website: 'http://english.danak.dk' },
  { value: 'ODAC', acronym: 'ODAC', name: 'Organismo Dominicano de Acreditación', countries: ['DO'], recognition: M, website: 'http://www.odac.gob.do' },
  { value: 'SAE', acronym: 'SAE', name: 'Servicio de Acreditación Ecuatoriano', countries: ['EC'], recognition: M, website: 'http://www.acreditacion.gob.ec' },
  { value: 'EGAC', acronym: 'EGAC', name: 'Egyptian Accreditation Council', countries: ['EG'], recognition: M, website: 'http://www.egac.gov.eg', logo: 'certificate/egac.png' },
  { value: 'OSA', acronym: 'OSA', name: 'Organismo Salvadoreño de Acreditación', countries: ['SV'], recognition: M, website: 'http://www.osa.gob.sv' },
  { value: 'EAK', acronym: 'EAK', name: 'Estonian Centre for Standardisation and Accreditation', countries: ['EE'], recognition: M, website: 'http://www.eak.ee' },
  { value: 'EAS_ET', acronym: 'EAS', name: 'Ethiopia Accreditation Service', countries: ['ET'], recognition: M, website: 'https://www.eas-eth.org' },
  { value: 'FINAS', acronym: 'FINAS', name: 'Finnish Accreditation Service', countries: ['FI'], recognition: M, website: 'http://www.finas.fi' },
  { value: 'COFRAC', acronym: 'COFRAC', name: "Comité français d'accréditation", countries: ['FR'], recognition: M, website: 'http://www.cofrac.fr' },
  { value: 'GAC_GE', acronym: 'GAC', name: 'Georgian Accreditation Center', countries: ['GE'], recognition: M, website: 'http://www.gac.gov.ge' },
  { value: 'DAKKS', acronym: 'DAkkS', name: 'Deutsche Akkreditierungsstelle GmbH', countries: ['DE'], recognition: M, website: 'http://www.dakks.de/en' },
  { value: 'GHAS', acronym: 'GHAS', name: 'Ghana Accreditation Service', countries: ['GH'], recognition: A, website: 'http://www.moti.gov.gh' },
  { value: 'ESYD', acronym: 'ESYD', name: 'Hellenic Accreditation System', countries: ['GR'], recognition: M, website: 'http://www.esyd.gr' },
  { value: 'OGA', acronym: 'OGA', name: 'Oficina Guatemalteca de Acreditación', countries: ['GT'], recognition: M, website: 'http://www.oga.org.gt' },
  { value: 'HKAS', acronym: 'HKAS', name: 'Hong Kong Accreditation Service', countries: ['HK'], recognition: M, website: 'http://www.hkas.gov.hk' },
  { value: 'NAH', acronym: 'NAH', name: 'National Accreditation Authority', countries: ['HU'], recognition: M, website: 'http://www.nah.gov.hu' },
  { value: 'ISAC', acronym: 'ISAC', name: 'Icelandic Service for Accreditation', countries: ['IS'], recognition: M, website: 'https://www.isac.is' },
  { value: 'FDAS', acronym: 'FDAS', name: 'Federation for Development of Accreditation Services', countries: ['IN'], recognition: M, website: 'https://www.fdasindia.org' },
  { value: 'IQAS_IN', acronym: 'IQAS', name: 'International Quality and Accreditation Services Pvt. Ltd.', countries: ['IN'], recognition: M, website: 'https://www.iqas.co.in' },
  { value: 'NABCB', acronym: 'NABCB', name: 'National Accreditation Board for Certification Bodies', countries: ['IN'], recognition: M, website: 'http://www.qcin.org/nabcb' },
  { value: 'NABL', acronym: 'NABL', name: 'National Accreditation Board for Testing & Calibration Laboratories', countries: ['IN'], recognition: M, website: 'https://nabl-india.org' },
  { value: 'QAI_CIA', acronym: 'QAI CIA', name: 'Quality and Accreditation Institute, Centre for International Accreditation', countries: ['IN'], recognition: M, website: 'http://www.qai.org.in' },
  { value: 'ACCAB', acronym: 'ACCAB', name: 'Accreditation Commission for Conformity Assessment Bodies', countries: ['IN'], recognition: A, website: 'http://www.accab.org' },
  { value: 'KAN', acronym: 'KAN', name: 'National Accreditation Body of Indonesia', countries: ['ID'], recognition: M, website: 'http://www.kan.or.id' },
  { value: 'IACLD', acronym: 'IACLD', name: 'Iranian Association of Clinical Laboratory Doctors', countries: ['IR'], recognition: M, website: 'https://ab.iacld.com' },
  { value: 'NACI', acronym: 'NACI', name: 'National Accreditation Centre of Iran', countries: ['IR'], recognition: M, website: 'http://naciportal.inso.gov.ir' },
  { value: 'IQAS_IQ', acronym: 'IQAS', name: 'Iraqi Accreditation System', countries: ['IQ'], recognition: A, website: 'http://iqas.mop.gov.iq' },
  { value: 'INAB', acronym: 'INAB', name: 'Irish National Accreditation Board', countries: ['IE'], recognition: M, website: 'https://inab.ie' },
  { value: 'ISRAC', acronym: 'ISRAC', name: 'Israel Laboratory Accreditation Authority', countries: ['IL'], recognition: M, website: 'http://www.israc.gov.il' },
  { value: 'ACCREDIA', acronym: 'ACCREDIA', name: "ACCREDIA, L'Ente Italiano di Accreditamento", countries: ['IT'], recognition: M, website: 'http://www.accredia.it' },
  { value: 'JANAAC', acronym: 'JANAAC', name: 'Jamaica National Agency for Accreditation', countries: ['JM'], recognition: M, website: 'http://www.janaac.gov.jm' },
  { value: 'IAJAPAN', acronym: 'IAJapan', name: 'International Accreditation Japan', countries: ['JP'], recognition: M, website: 'http://www.nite.go.jp/en/iajapan/' },
  { value: 'JAB', acronym: 'JAB', name: 'Japan Accreditation Board', countries: ['JP'], recognition: M, website: 'http://www.jab.or.jp' },
  { value: 'VLAC', acronym: 'VLAC', name: 'Voluntary EMC Laboratory Accreditation Center Inc.', countries: ['JP'], recognition: M, website: 'http://www.vlac.co.jp' },
  { value: 'JASAFF', acronym: 'JASaff', name: 'Japan Accreditation Service for Agriculture, Forestry and Fisheries', countries: ['JP'], recognition: A, website: 'http://www.famic.go.jp/jasaff' },
  { value: 'JAS_AU', acronym: 'JAS-AU', name: 'Jordan Accreditation & Standardization Systems, Accreditation Unit', countries: ['JO'], recognition: M, website: 'http://www.au.gov.jo' },
  { value: 'NCA_KZ', acronym: 'NCA', name: 'National Center of Accreditation', countries: ['KZ'], recognition: M, website: 'http://www.nca.kz' },
  { value: 'KENAS', acronym: 'KENAS', name: 'Kenya Accreditation Service', countries: ['KE'], recognition: M, website: 'http://www.kenas.go.ke' },
  { value: 'KOLAS', acronym: 'KOLAS', name: 'Korea Laboratory Accreditation Scheme', countries: ['KR'], recognition: M, website: 'https://www.knab.go.kr/en/Enkolas.do' },
  { value: 'KAB', acronym: 'KAB', name: 'Korea Accreditation Board', countries: ['KR'], recognition: 'IAF_MLA' },
  { value: 'DAK', acronym: 'DAK', name: 'Kosovo General Accreditation Directorate', countries: ['XK'], recognition: A, website: 'http://dak.rks-gov.net' },
  { value: 'KAS_PAI', acronym: 'KAS-PAI', name: 'Kuwait Accreditation System, Public Authority for Industry', countries: ['KW'], recognition: A, website: 'http://www.pai.gov.kw' },
  { value: 'KCA', acronym: 'KCA', name: 'Kyrgyz Center of Accreditation', countries: ['KG'], recognition: M, website: 'http://kca.gov.kg' },
  { value: 'LATAK', acronym: 'LATAK', name: 'Latvian National Accreditation Bureau', countries: ['LV'], recognition: M, website: 'https://www.latak.gov.lv' },
  { value: 'LA_LT', acronym: 'LA', name: 'Lithuanian National Accreditation Bureau', countries: ['LT'], recognition: M, website: 'http://nab.lrv.lt' },
  { value: 'OLAS', acronym: 'OLAS', name: "Office Luxembourgeois d'Accréditation et de Surveillance", countries: ['LU'], recognition: M, website: 'http://www.portail-qualite.public.lu' },
  { value: 'STANDARDS_MALAYSIA', acronym: 'Standards Malaysia', name: 'Department of Standards Malaysia', countries: ['MY'], recognition: M, website: 'http://www.jsm.gov.my' },
  { value: 'MAURITAS', acronym: 'MAURITAS', name: 'Mauritius Accreditation Service', countries: ['MU'], recognition: M, website: 'http://www.mauritas.org' },
  { value: 'EMA', acronym: 'ema', name: 'Entidad Mexicana de Acreditación A.C.', countries: ['MX'], recognition: M, website: 'http://www.ema.org.mx' },
  { value: 'MOLDAC', acronym: 'MOLDAC', name: 'National Accreditation Centre of the Republic of Moldova', countries: ['MD'], recognition: M, website: 'http://www.acreditare.md' },
  { value: 'MNAS', acronym: 'MNAS', name: 'Mongolian National Authority for Accreditation', countries: ['MN'], recognition: M, website: 'http://www.mnas.gov.mn' },
  { value: 'ATCG', acronym: 'ATCG', name: 'Accreditation Body of Montenegro', countries: ['ME'], recognition: A, website: 'http://www.akreditacija.me' },
  { value: 'SEMAC', acronym: 'SEMAC', name: 'Moroccan Accreditation Service', countries: ['MA'], recognition: A, website: 'https://www.mcinet.gov.ma/fr/content/accreditation' },
  { value: 'AERSSC', acronym: 'AERSSC', name: 'Accreditation Education Research & Scientific Services Centre Pvt. Ltd.', countries: ['NP'], recognition: A, website: 'https://www.aerssc.com.np' },
  { value: 'RVA', acronym: 'RvA', name: 'Dutch Accreditation Council', countries: ['NL'], recognition: M, website: 'http://www.rva.nl' },
  { value: 'IANZ', acronym: 'IANZ', name: 'International Accreditation New Zealand', countries: ['NZ'], recognition: M, website: 'http://www.ianz.govt.nz' },
  { value: 'ONA_NI', acronym: 'ONA', name: 'National Accreditation Office of Nicaragua', countries: ['NI'], recognition: M },
  { value: 'NINAS', acronym: 'NiNAS', name: 'Nigeria National Accreditation System', countries: ['NG'], recognition: M, website: 'http://www.ninas.ng' },
  { value: 'MLSCN', acronym: 'MLSCN', name: 'MLSCN Accreditation Service', countries: ['NG'], recognition: A, website: 'http://www.mlscn-as.org' },
  { value: 'NA_NO', acronym: 'NA', name: 'Norsk akkreditering', countries: ['NO'], recognition: M, website: 'http://www.akkreditert.no' },
  { value: 'PNAC', acronym: 'PNAC', name: 'Pakistan National Accreditation Council', countries: ['PK'], recognition: M, website: 'http://www.pnac.gov.pk' },
  { value: 'CNA_PA', acronym: 'CNA', name: 'Consejo Nacional de Acreditación', countries: ['PA'], recognition: M, website: 'https://www.cna.gob.pa' },
  { value: 'PNGLAS', acronym: 'PNGLAS', name: 'Papua New Guinea Laboratory Accreditation Scheme', countries: ['PG'], recognition: A, website: 'http://www.nisit.gov.pg' },
  { value: 'ONA_PY', acronym: 'ONA', name: 'Organismo Nacional de Acreditación', countries: ['PY'], recognition: M, website: 'http://www.conacyt.gov.py' },
  { value: 'INACAL_DA', acronym: 'INACAL-DA', name: 'National Institute for Quality, Accreditation Directorate', countries: ['PE'], recognition: M, website: 'http://www.inacal.gob.pe' },
  { value: 'PAB', acronym: 'PAB', name: 'Philippine Accreditation Bureau', countries: ['PH'], recognition: M, website: 'http://www.dti.gov.ph/pab' },
  { value: 'PCA', acronym: 'PCA', name: 'Polish Centre for Accreditation', countries: ['PL'], recognition: M, website: 'http://www.pca.gov.pl' },
  { value: 'IPAC', acronym: 'IPAC', name: 'Instituto Português de Acreditação', countries: ['PT'], recognition: M, website: 'http://www.ipac.pt' },
  { value: 'IARNM', acronym: 'IARNM', name: 'Institute for Accreditation of the Republic of North Macedonia', countries: ['MK'], recognition: M, website: 'http://www.iarm.gov.mk' },
  { value: 'RENAR', acronym: 'RENAR', name: 'Romanian Accreditation Association', countries: ['RO'], recognition: M, website: 'http://www.renar.ro' },
  { value: 'AAC_ANALITICA', acronym: 'AAC Analitica', name: "Association of Analytical Centers 'Analitica'", countries: ['RU'], recognition: M, website: 'http://www.aac-analitica.ru' },
  { value: 'RUSACCREDITATION', acronym: 'RusAccreditation', name: 'Federal Service for Accreditation', countries: ['RU'], recognition: M },
  { value: 'SAAC', acronym: 'SAAC', name: 'Saudi Accreditation Center', countries: ['SA'], recognition: M },
  { value: 'GAC', acronym: 'GAC', name: 'GCC Accreditation Center', countries: GCC, recognition: M },
  { value: 'ATS', acronym: 'ATS', name: 'Accreditation Body of Serbia', countries: ['RS'], recognition: M },
  { value: 'SAC', acronym: 'SAC', name: 'Singapore Accreditation Council', countries: ['SG'], recognition: M },
  { value: 'SNAS', acronym: 'SNAS', name: 'Slovak National Accreditation Service', countries: ['SK'], recognition: M },
  { value: 'SA_SI', acronym: 'SA', name: 'Slovenian Accreditation', countries: ['SI'], recognition: M },
  { value: 'SANAS', acronym: 'SANAS', name: 'South African National Accreditation System', countries: ['ZA'], recognition: M },
  { value: 'ENAC', acronym: 'ENAC', name: 'Entidad Nacional de Acreditación', countries: ['ES'], recognition: M },
  { value: 'SLAB', acronym: 'SLAB', name: 'Sri Lanka Accreditation Board for Conformity Assessment', countries: ['LK'], recognition: M },
  { value: 'SWEDAC', acronym: 'SWEDAC', name: 'Swedish Board for Accreditation and Conformity Assessment', countries: ['SE'], recognition: M },
  { value: 'SAS', acronym: 'SAS', name: 'Swiss Accreditation Service', countries: ['CH'], recognition: M },
  { value: 'ACFS', acronym: 'ACFS', name: 'National Bureau of Agricultural Commodity and Food Standards', countries: ['TH'], recognition: M },
  { value: 'BLA_DSS', acronym: 'BLA-DSS', name: 'Bureau of Laboratory Accreditation, Department of Science Service', countries: ['TH'], recognition: M },
  { value: 'BLQS_DMSC', acronym: 'BLQS-DMSc', name: 'Bureau of Laboratory Quality Standards, Department of Medical Sciences', countries: ['TH'], recognition: M },
  { value: 'NSC_TH', acronym: 'NSC', name: 'National Standardization Council of Thailand', countries: ['TH'], recognition: M },
  { value: 'TUNAC', acronym: 'TUNAC', name: 'Tunisian Accreditation Council', countries: ['TN'], recognition: M },
  { value: 'TURKAK', acronym: 'TÜRKAK', name: 'Turkish Accreditation Agency', countries: ['TR'], recognition: M },
  { value: 'NAAU', acronym: 'NAAU', name: 'National Accreditation Agency of Ukraine', countries: ['UA'], recognition: M },
  { value: 'EIAC', acronym: 'EIAC', name: 'Emirates International Accreditation Centre', countries: ['AE'], recognition: M },
  { value: 'MOIAT_ENAS', acronym: 'MoIAT-ENAS', name: 'Ministry of Industry and Advanced Technology, Emirates National Accreditation System', countries: ['AE'], recognition: M },
  { value: 'UKAS', acronym: 'UKAS', name: 'United Kingdom Accreditation Service', countries: ['GB'], recognition: M },
  { value: 'A2LA', acronym: 'A2LA', name: 'American Association for Laboratory Accreditation', countries: ['US'], recognition: M },
  { value: 'ANAB', acronym: 'ANAB', name: 'ANSI National Accreditation Board', countries: ['US'], recognition: M },
  { value: 'AIHA_LAP', acronym: 'AIHA-LAP', name: 'AIHA Laboratory Accreditation Programs, LLC', countries: ['US'], recognition: M },
  { value: 'IAS', acronym: 'IAS', name: 'International Accreditation Service, Inc.', countries: ['US'], recognition: M },
  { value: 'NVLAP', acronym: 'NVLAP', name: 'National Voluntary Laboratory Accreditation Program', countries: ['US'], recognition: M },
  { value: 'PJLA', acronym: 'PJLA', name: 'Perry Johnson Laboratory Accreditation, Inc.', countries: ['US'], recognition: M },
  { value: 'OUA', acronym: 'OUA', name: 'Organismo Uruguayo de Acreditación', countries: ['UY'], recognition: M },
  { value: 'OZAKK', acronym: "O'ZAKK", name: 'Uzbek Center for Accreditation', countries: ['UZ'], recognition: M },
  { value: 'AOSC', acronym: 'AOSC', name: 'Accreditation Office for Standards Conformity Assessment Capacity', countries: ['VN'], recognition: M },
  { value: 'BOA', acronym: 'BoA', name: 'Bureau of Accreditation', countries: ['VN'], recognition: M },
  { value: 'VACI', acronym: 'VACI', name: 'Vietnam Institute of Accreditation', countries: ['VN'], recognition: M },
]

const byValue = new Map(ACCREDITATION_BODIES.map((body) => [body.value, body]))

export function findAccreditationBody(value: string | null | undefined): AccreditationBody | undefined {
  return value ? byValue.get(value) : undefined
}

/**
 * Catalog value for a stored body: an id ("SAAC"), an acronym ("DAkkS") or a full name
 * ("Saudi Accreditation Center"), case-insensitive. Undefined when the body is not in the catalog.
 */
export function resolveAccreditationBodyValue(stored: string | null | undefined): string | undefined {
  const text = stored?.trim()
  if (!text) return undefined
  if (byValue.has(text)) return text
  const lower = text.toLowerCase()
  const matches = ACCREDITATION_BODIES.filter(
    (body) => body.value.toLowerCase() === lower || body.name.toLowerCase() === lower || accreditationBodyLabel(body).toLowerCase() === lower
  )
  if (matches.length === 1) return matches[0].value
  const byAcronym = ACCREDITATION_BODIES.filter((body) => body.acronym.toLowerCase() === lower)
  return byAcronym.length === 1 ? byAcronym[0].value : undefined
}

/** "ACRONYM — Full name". */
export function accreditationBodyLabel(body: AccreditationBody): string {
  return body.acronym === body.name ? body.name : `${body.acronym} · ${body.name}`
}

/** Bodies that serve a country first (alphabetical by acronym). */
export function accreditationBodiesForCountry(countryCode: string | null | undefined): AccreditationBody[] {
  if (!countryCode) return []
  const code = countryCode.toUpperCase()
  return ACCREDITATION_BODIES.filter((body) => body.countries.includes(code)).sort((a, b) => a.acronym.localeCompare(b.acronym))
}

/** Every body, alphabetical by acronym. */
export function sortedAccreditationBodies(): AccreditationBody[] {
  return [...ACCREDITATION_BODIES].sort((a, b) => a.acronym.localeCompare(b.acronym) || a.name.localeCompare(b.name))
}

/** Up to four letters / digits for the monogram badge. */
export function accreditationBodyMonogram(body: AccreditationBody): string {
  const letters = body.acronym.replace(/[^A-Za-z0-9À-ÿ]/g, '')
  return (letters || body.name).slice(0, 4).toUpperCase()
}
