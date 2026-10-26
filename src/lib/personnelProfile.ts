// Pure rules for the CAB personnel profile form (dates, payload and upload limits).

export const QUALIFICATION_FILE_MAX_BYTES = 20 * 1024 * 1024

/** Local calendar date as YYYY-MM-DD. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Form date fields for a person; a missing start date becomes `fallbackStart`, a missing end date stays empty. */
export function personnelDateFields(
  person: { employmentStartDate?: string; employmentEndDate?: string } | undefined,
  fallbackStart: string,
) {
  return {
    employmentStartDate: person?.employmentStartDate ? person.employmentStartDate.split('T')[0] : fallbackStart,
    employmentEndDate: person?.employmentEndDate ? person.employmentEndDate.split('T')[0] : '',
  }
}

/** The memberProfile message key for invalid employment dates, or null. Both dates are optional while employed. */
export function validateEmploymentDates(
  currentlyEmployed: boolean,
  startDate: string,
  endDate: string,
): 'endDateRequired' | 'dateError' | null {
  if (!currentlyEmployed && !endDate) return 'endDateRequired'
  if (!currentlyEmployed && startDate && endDate && endDate < startDate) return 'dateError'
  return null
}

/** Employment dates as the employee API expects them; an empty start date is left out. */
export function employmentDatesPayload(currentlyEmployed: boolean, startDate: string, endDate: string) {
  return {
    ...(startDate ? { employmentStartDate: `${startDate}T00:00:00.000Z` } : {}),
    employmentEndDate: !currentlyEmployed && endDate ? `${endDate}T00:00:00.000Z` : null,
  }
}

export const isQualificationFileTooLarge = (file: { size: number }) => file.size > QUALIFICATION_FILE_MAX_BYTES

/** Once the employee exists, a later failure (e.g. an upload) is reported as an incomplete, retryable save. */
export function personnelSaveErrorMessage(employeeId: string | undefined, message: string): string {
  return employeeId
    ? `The employee is saved, but saving is incomplete: ${message}. Please retry Save to upload the remaining files.`
    : message
}
