import type { TFunction } from 'i18next'
import type { OrgBranch } from '@/lib/api/organizationProfileApi'
import { countryDisplayName } from './mappers'
import type { ProfileFormValues } from './types'

/**
 * Builds a print-ready HTML rendition of the company profile in the dashboard's
 * visual language (colors, typography, card layout). Opened in its own tab it
 * doubles as the preview; with `print: true` the browser's print dialog offers
 * "Save as PDF". HTML+CSS is used instead of a PDF library so Arabic text and
 * RTL layout render correctly with the app's own fonts.
 */

const esc = (value: string | null | undefined): string =>
  (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

interface BuildOptions {
  form: ProfileFormValues
  branches: OrgBranch[]
  t: TFunction
  lang: string
}

function field(label: string, value: string | null | undefined): string {
  if (!value?.trim()) return ''
  return `
    <div class="field">
      <p class="field-label">${esc(label)}</p>
      <p class="field-value">${esc(value)}</p>
    </div>`
}

export function buildProfileDocumentHtml({ form, branches, t, lang }: BuildOptions): string {
  const dir = lang.startsWith('ar') ? 'rtl' : 'ltr'
  const origin = window.location.origin
  const dateFormat = new Intl.DateTimeFormat(lang, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const formatDate = (date: Date | undefined) => (date ? dateFormat.format(date) : '')

  const statusLabel = form.organizationStatus
    ? t(`companyProfile.basicDataCard.statusOptions.${form.organizationStatus}`, {
        defaultValue: form.organizationStatus,
      })
    : ''

  const industries = form.industries
    .map((industry) => `<span class="chip">${esc(industry)}</span>`)
    .join('')

  const branchRows = branches
    .map(
      (branch) => `
        <tr>
          <td>${esc(branch.branchName)}</td>
          <td dir="ltr">${esc(branch.commercialRegisterNumber)}</td>
          <td>${esc(branch.branchManagerName)}</td>
          <td dir="ltr">${esc(branch.phoneNumber)}</td>
          <td dir="ltr">${branch.employeeCount ?? ''}</td>
          <td>${esc(branch.address)}</td>
        </tr>`
    )
    .join('')

  const nationalAddress = form.nationalAddress

  return `<!doctype html>
<html lang="${esc(lang)}" dir="${dir}">
<head>
<meta charset="utf-8" />
<title>${esc(form.organizationName || t('companyProfile.title'))}</title>
<style>
  @font-face {
    font-family: 'Montserrat';
    src: url('${origin}/fonts/montserrat/montserrat-regular.ttf') format('truetype');
    font-weight: 400;
  }
  @font-face {
    font-family: 'Montserrat';
    src: url('${origin}/fonts/montserrat/montserrat-medium.ttf') format('truetype');
    font-weight: 500;
  }
  @font-face {
    font-family: 'Montserrat';
    src: url('${origin}/fonts/montserrat/montserrat-semibold.ttf') format('truetype');
    font-weight: 600;
  }
  @font-face {
    font-family: 'GE SS Two';
    src: url('${origin}/fonts/ge-ss-two/ArbFONTS-GE_SS_Two_Medium.otf') format('opentype');
    font-weight: 400;
  }
  @font-face {
    font-family: 'GE SS Two';
    src: url('${origin}/fonts/ge-ss-two/ArbFONTS-GE_SS_Two_Bold.otf') format('opentype');
    font-weight: 600;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4; margin: 12mm; }

  body {
    font-family: ${dir === 'rtl' ? "'GE SS Two', 'Montserrat'" : "'Montserrat', 'GE SS Two'"}, sans-serif;
    color: #1a1a1a;
    background: #fff;
    font-size: 13px;
    line-height: 1.6;
    padding: 32px;
  }
  @media print { body { padding: 0; } }

  .doc-header {
    display: flex;
    align-items: center;
    gap: 16px;
    border-bottom: 2px solid #1236a3;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }
  .doc-header img.logo {
    width: 64px;
    height: 64px;
    object-fit: contain;
    border-radius: 12px;
    border: 1px solid #ececec;
  }
  .doc-header .org-name { font-size: 22px; font-weight: 600; color: #1236a3; }
  .doc-header .trade-name { font-size: 14px; color: #666; }

  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
  .chip {
    background: #e8edfc;
    color: #1236a3;
    border-radius: 6px;
    padding: 2px 10px;
    font-size: 11px;
    font-weight: 500;
  }

  .summary { color: #666; margin-bottom: 24px; }

  .section { margin-bottom: 24px; break-inside: avoid; }
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #1236a3;
    margin-bottom: 12px;
  }
  .section-title::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 18px;
    border-radius: 2px;
    background: #1236a3;
  }

  .card {
    border: 1px solid #ececec;
    border-radius: 12px;
    padding: 16px;
    background: #fcfcfd;
  }
  .fields { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px 20px; }
  .field-label { font-size: 11px; color: #666; }
  .field-value { font-size: 13px; font-weight: 500; color: #1a1a1a; overflow-wrap: anywhere; }

  table { width: 100%; border-collapse: collapse; }
  th, td {
    border: 1px solid #ececec;
    padding: 8px 10px;
    font-size: 12px;
    text-align: start;
    vertical-align: top;
  }
  th { background: #f3f6fd; color: #1236a3; font-weight: 600; white-space: nowrap; }
  tr:nth-child(even) td { background: #fafbfe; }

  .doc-footer {
    margin-top: 32px;
    padding-top: 12px;
    border-top: 1px solid #ececec;
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #666;
  }
</style>
</head>
<body>
  <header class="doc-header">
    ${form.logoUrl ? `<img class="logo" src="${esc(form.logoUrl)}" alt="" />` : ''}
    <div>
      <p class="org-name">${esc(form.organizationName)}</p>
      ${form.tradeName ? `<p class="trade-name">${esc(form.tradeName)}</p>` : ''}
      ${industries ? `<div class="chips">${industries}</div>` : ''}
    </div>
  </header>

  ${form.companySummary ? `<p class="summary">${esc(form.companySummary)}</p>` : ''}

  <section class="section">
    <h2 class="section-title">${esc(t('companyProfile.basicDataCard.title'))}</h2>
    <div class="card"><div class="fields">
      ${field(t('companyProfile.basicDataCard.commercialRegistryLabel'), form.commercialRegisterNumber)}
      ${field(t('companyProfile.basicDataCard.serialNumberLabel'), form.unifiedNumber)}
      ${field(t('companyProfile.basicDataCard.authorizedPersonLabel'), form.authorizedPersonName)}
      ${field(t('companyProfile.basicDataCard.emailLabel'), form.email)}
      ${field(t('companyProfile.basicDataCard.phoneLabel'), form.phoneNumber)}
      ${field(t('companyProfile.basicDataCard.companyStatusLabel'), statusLabel)}
      ${field(t('companyProfile.basicDataCard.totalEmployeesLabel'), form.employeeCount)}
      ${field(t('companyProfile.basicDataCard.registrationDateLabel'), formatDate(form.registrationDate))}
    </div></div>
  </section>

  <section class="section">
    <h2 class="section-title">${esc(t('companyProfile.addressCard.title'))}</h2>
    <div class="card"><div class="fields">
      ${field(t('companyProfile.addressCard.countryLabel'), form.country ? countryDisplayName(form.country, lang) : '')}
      ${field(t('companyProfile.addressCard.cityLabel'), form.city)}
      ${field(t('companyProfile.addressCard.neighborhoodLabel'), form.district)}
      ${field(t('companyProfile.addressCard.streetLabel'), form.street)}
      ${field(t('companyProfile.addressCard.buildingLabel'), form.buildingNumber)}
      ${field(t('companyProfile.addressCard.postalCodeLabel'), form.postalCode)}
      ${field(t('companyProfile.addressCard.subNumberLabel'), form.additionalNumber)}
    </div></div>
  </section>

  ${
    nationalAddress.hasNationalAddress && nationalAddress.certificateNumber
      ? `
  <section class="section">
    <h2 class="section-title">${esc(t('companyProfile.nationalAddress.formTitle'))}</h2>
    <div class="card"><div class="fields">
      ${field(t('companyProfile.nationalAddress.addressId'), nationalAddress.certificateNumber)}
      ${field(t('companyProfile.nationalAddress.issueDate'), formatDate(nationalAddress.issueDate))}
      ${field(t('companyProfile.nationalAddress.expiryDate'), formatDate(nationalAddress.expiryDate))}
      ${field(t('companyProfile.nationalAddress.street'), nationalAddress.street)}
      ${field(t('companyProfile.nationalAddress.buildingNo'), nationalAddress.buildingNumber)}
      ${field(t('companyProfile.nationalAddress.neighborhood'), nationalAddress.district)}
      ${field(t('companyProfile.nationalAddress.postalCode'), nationalAddress.postalCode)}
      ${field(t('companyProfile.nationalAddress.subNumber'), nationalAddress.additionalNumber)}
      ${field(t('companyProfile.nationalAddress.city'), nationalAddress.city)}
    </div></div>
  </section>`
      : ''
  }

  ${
    branches.length
      ? `
  <section class="section">
    <h2 class="section-title">${esc(t('companyProfile.branchesCard.title'))}</h2>
    <table>
      <thead>
        <tr>
          <th>${esc(t('companyProfile.addBranch.branchNameLabel'))}</th>
          <th>${esc(t('companyProfile.addBranch.registryLabel'))}</th>
          <th>${esc(t('companyProfile.addBranch.managerLabel'))}</th>
          <th>${esc(t('companyProfile.addBranch.phoneLabel'))}</th>
          <th>${esc(t('companyProfile.addBranch.employeesLabel'))}</th>
          <th>${esc(t('companyProfile.addBranch.addressLabel'))}</th>
        </tr>
      </thead>
      <tbody>${branchRows}</tbody>
    </table>
  </section>`
      : ''
  }

  <footer class="doc-footer">
    <span>${esc(t('companyProfile.title'))}</span>
    <span dir="ltr">${esc(dateFormat.format(new Date()))}</span>
  </footer>
</body>
</html>`
}

/** Opens the document in a new tab; with `print` the print dialog pops for Save-as-PDF. */
export function openProfileDocument(html: string, options: { print?: boolean } = {}): void {
  const finalHtml = options.print
    ? html.replace(
        '</body>',
        '<script>window.addEventListener("load",()=>setTimeout(()=>window.print(),300))</script></body>'
      )
    : html
  const blob = new Blob([finalHtml], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
