export const BANK_ACCOUNT_NUMBER_DIGITS = 16
export const CARD_NUMBER_DIGITS = 16
export const CVV_DIGITS = 3

function formatGroupedDigits(value: string, maxDigits: number): string {
  const digits = value.replace(/\D/g, '').slice(0, maxDigits)
  const groups: string[] = []

  for (let i = 0; i < digits.length; i += 4) {
    groups.push(digits.slice(i, i + 4))
  }

  return groups.join('-')
}

/** Formats digits as XXXX-XXXX-XXXX-XXXX and caps at 16 digits. */
export function formatBankAccountNumber(value: string): string {
  return formatGroupedDigits(value, BANK_ACCOUNT_NUMBER_DIGITS)
}

/** Formats card digits as XXXX-XXXX-XXXX-XXXX and caps at 16 digits. */
export function formatCardNumber(value: string): string {
  return formatGroupedDigits(value, CARD_NUMBER_DIGITS)
}

/** Keeps up to 3 numeric digits only. */
export function formatCvv(value: string): string {
  return value.replace(/\D/g, '').slice(0, CVV_DIGITS)
}
