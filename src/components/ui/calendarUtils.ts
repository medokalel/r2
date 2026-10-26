export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

/** Monday-based weekday index (0=Mo … 6=Su) */
export function weekdayOf(year: number, month: number, day: number) {
  const d = new Date(year, month, day).getDay()
  return d === 0 ? 6 : d - 1
}
