export interface TableColumn<T> {
  header: string
  value: (row: T, index: number) => string | number
}

function escapeCsv(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`
}

export function downloadExcelCsv<T>(filename: string, columns: TableColumn<T>[], rows: T[]) {
  const header = columns.map((column) => escapeCsv(column.header)).join(',')
  const body = rows
    .map((row, index) => columns.map((column) => escapeCsv(column.value(row, index))).join(','))
    .join('\n')

  const blob = new Blob([`\uFEFF${header}\n${body}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function buildTableHtml<T>(
  title: string,
  columns: TableColumn<T>[],
  rows: T[],
  pageTitle?: string
) {
  const head = columns.map((column) => `<th>${column.header}</th>`).join('')
  const body = rows
    .map((row, index) => {
      const cells = columns.map((column) => `<td>${column.value(row, index)}</td>`).join('')
      return `<tr>${cells}</tr>`
    })
    .join('')

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${pageTitle ?? title}</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 12px; color: #111; margin: 0; }
          h1 { font-size: 18px; margin: 0 0 12px; color: #1236a3; }
          table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
          th, td { border: 1px solid #e2e2e2; padding: 7px 8px; text-align: start; white-space: nowrap; }
          th { background: #1236a3 !important; color: #fff !important; font-weight: 600; }
          tr:nth-child(even) { background: #f9fafc !important; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </body>
    </html>
  `
}

function buildFieldsHtml(title: string, fields: { label: string; value: string }[]) {
  const rows = fields
    .map((field) => `<tr><th>${field.label}</th><td>${field.value}</td></tr>`)
    .join('')

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h1 { font-size: 20px; margin: 0 0 16px; color: #1236a3; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: start; }
          th { width: 35%; background: #f3f6fd; color: #1236a3; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table><tbody>${rows}</tbody></table>
      </body>
    </html>
  `
}

function openHtmlDocument(html: string, autoPrint: boolean) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()

  if (autoPrint) {
    printWindow.onload = () => {
      printWindow.print()
    }
    setTimeout(() => printWindow.print(), 300)
  }
}

export function downloadPdfFromTable<T>(
  filename: string,
  title: string,
  columns: TableColumn<T>[],
  rows: T[]
) {
  const pageTitle = filename.replace(/\.pdf$/i, '')
  openHtmlDocument(buildTableHtml(title, columns, rows, pageTitle), true)
}

export function previewTableDocument<T>(title: string, columns: TableColumn<T>[], rows: T[]) {
  openHtmlDocument(buildTableHtml(title, columns, rows), false)
}

export function printTableDocument<T>(title: string, columns: TableColumn<T>[], rows: T[]) {
  openHtmlDocument(buildTableHtml(title, columns, rows), true)
}

export function previewFieldsDocument(title: string, fields: { label: string; value: string }[]) {
  openHtmlDocument(buildFieldsHtml(title, fields), false)
}

export function printFieldsDocument(title: string, fields: { label: string; value: string }[]) {
  openHtmlDocument(buildFieldsHtml(title, fields), true)
}

export function downloadFieldsDocument(
  filename: string,
  title: string,
  fields: { label: string; value: string }[],
) {
  const blob = new Blob([buildFieldsHtml(title, fields)], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.html') ? filename : `${filename}.html`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function matchesSearch(values: Array<string | number | null | undefined>, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  return values.some((value) => String(value ?? '').toLowerCase().includes(normalized))
}
