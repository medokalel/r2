/**
 * Audit-time tables — TypeScript copy of the backend's
 * src/modules/audit-engine/audit-standard-bands.data.js (same values, same row order).
 * Open-ended rows (> 10,700) are left out: the calculator follows the table's progression.
 */

export interface BandRow { minEmployees: number; maxEmployees: number }
export interface DaysRow extends BandRow { initialAuditDays: number }
export type ComplexityRow<K extends string> = BandRow & Record<K, number>
export interface CycleCell { initial: number; surveillance: number; recertification: number }
export type CycleRow = BandRow & Record<'HIGH' | 'MEDIUM' | 'LOW', CycleCell>

/** IAF MD 5:2023 Table QMS 1 (ISO 9001). */
export const QMS_1: DaysRow[] = [
  { minEmployees: 1, maxEmployees: 5, initialAuditDays: 1.5 },
  { minEmployees: 6, maxEmployees: 10, initialAuditDays: 2 },
  { minEmployees: 11, maxEmployees: 15, initialAuditDays: 2.5 },
  { minEmployees: 16, maxEmployees: 25, initialAuditDays: 3 },
  { minEmployees: 26, maxEmployees: 45, initialAuditDays: 4 },
  { minEmployees: 46, maxEmployees: 65, initialAuditDays: 5 },
  { minEmployees: 66, maxEmployees: 85, initialAuditDays: 6 },
  { minEmployees: 86, maxEmployees: 125, initialAuditDays: 7 },
  { minEmployees: 126, maxEmployees: 175, initialAuditDays: 8 },
  { minEmployees: 176, maxEmployees: 275, initialAuditDays: 9 },
  { minEmployees: 276, maxEmployees: 425, initialAuditDays: 10 },
  { minEmployees: 426, maxEmployees: 625, initialAuditDays: 11 },
  { minEmployees: 626, maxEmployees: 875, initialAuditDays: 12 },
  { minEmployees: 876, maxEmployees: 1175, initialAuditDays: 13 },
  { minEmployees: 1176, maxEmployees: 1550, initialAuditDays: 14 },
  { minEmployees: 1551, maxEmployees: 2025, initialAuditDays: 15 },
  { minEmployees: 2026, maxEmployees: 2675, initialAuditDays: 16 },
  { minEmployees: 2676, maxEmployees: 3450, initialAuditDays: 17 },
  { minEmployees: 3451, maxEmployees: 4350, initialAuditDays: 18 },
  { minEmployees: 4351, maxEmployees: 5450, initialAuditDays: 19 },
  { minEmployees: 5451, maxEmployees: 6800, initialAuditDays: 20 },
  { minEmployees: 6801, maxEmployees: 8500, initialAuditDays: 21 },
  { minEmployees: 8501, maxEmployees: 10700, initialAuditDays: 22 },
]

/** IAF MD 5:2023 Table EMS 1 (ISO 14001). */
export const EMS_1: ComplexityRow<'HIGH' | 'MEDIUM' | 'LOW' | 'LIMITED'>[] = [
  { minEmployees: 1, maxEmployees: 5, HIGH: 3, MEDIUM: 2.5, LOW: 2.5, LIMITED: 2.5 },
  { minEmployees: 6, maxEmployees: 10, HIGH: 3.5, MEDIUM: 3, LOW: 3, LIMITED: 3 },
  { minEmployees: 11, maxEmployees: 15, HIGH: 4.5, MEDIUM: 3.5, LOW: 3, LIMITED: 3 },
  { minEmployees: 16, maxEmployees: 25, HIGH: 5.5, MEDIUM: 4.5, LOW: 3.5, LIMITED: 3 },
  { minEmployees: 26, maxEmployees: 45, HIGH: 7, MEDIUM: 5.5, LOW: 4, LIMITED: 3 },
  { minEmployees: 46, maxEmployees: 65, HIGH: 8, MEDIUM: 6, LOW: 4.5, LIMITED: 3.5 },
  { minEmployees: 66, maxEmployees: 85, HIGH: 9, MEDIUM: 7, LOW: 5, LIMITED: 3.5 },
  { minEmployees: 86, maxEmployees: 125, HIGH: 11, MEDIUM: 8, LOW: 5.5, LIMITED: 4 },
  { minEmployees: 126, maxEmployees: 175, HIGH: 12, MEDIUM: 9, LOW: 6, LIMITED: 4.5 },
  { minEmployees: 176, maxEmployees: 275, HIGH: 13, MEDIUM: 10, LOW: 7, LIMITED: 5 },
  { minEmployees: 276, maxEmployees: 425, HIGH: 15, MEDIUM: 11, LOW: 8, LIMITED: 5.5 },
  { minEmployees: 426, maxEmployees: 625, HIGH: 16, MEDIUM: 12, LOW: 9, LIMITED: 6 },
  { minEmployees: 626, maxEmployees: 875, HIGH: 17, MEDIUM: 13, LOW: 10, LIMITED: 6.5 },
  { minEmployees: 876, maxEmployees: 1175, HIGH: 19, MEDIUM: 15, LOW: 11, LIMITED: 7 },
  { minEmployees: 1176, maxEmployees: 1550, HIGH: 20, MEDIUM: 16, LOW: 12, LIMITED: 7.5 },
  { minEmployees: 1551, maxEmployees: 2025, HIGH: 21, MEDIUM: 17, LOW: 12, LIMITED: 8 },
  { minEmployees: 2026, maxEmployees: 2675, HIGH: 23, MEDIUM: 18, LOW: 13, LIMITED: 8.5 },
  { minEmployees: 2676, maxEmployees: 3450, HIGH: 25, MEDIUM: 19, LOW: 14, LIMITED: 9 },
  { minEmployees: 3451, maxEmployees: 4350, HIGH: 27, MEDIUM: 20, LOW: 15, LIMITED: 10 },
  { minEmployees: 4351, maxEmployees: 5450, HIGH: 28, MEDIUM: 21, LOW: 16, LIMITED: 11 },
  { minEmployees: 5451, maxEmployees: 6800, HIGH: 30, MEDIUM: 23, LOW: 17, LIMITED: 12 },
  { minEmployees: 6801, maxEmployees: 8500, HIGH: 32, MEDIUM: 25, LOW: 19, LIMITED: 13 },
  { minEmployees: 8501, maxEmployees: 10700, HIGH: 34, MEDIUM: 27, LOW: 20, LIMITED: 14 },
]

/** IAF MD 5:2023 Table OH&SMS 1 (ISO 45001). */
export const OHSMS_1: ComplexityRow<'HIGH' | 'MEDIUM' | 'LOW'>[] = [
  { minEmployees: 1, maxEmployees: 5, HIGH: 3, MEDIUM: 2.5, LOW: 2.5 },
  { minEmployees: 6, maxEmployees: 10, HIGH: 3.5, MEDIUM: 3, LOW: 3 },
  { minEmployees: 11, maxEmployees: 15, HIGH: 4.5, MEDIUM: 3.5, LOW: 3 },
  { minEmployees: 16, maxEmployees: 25, HIGH: 5.5, MEDIUM: 4.5, LOW: 3.5},
  { minEmployees: 26, maxEmployees: 45, HIGH: 7, MEDIUM: 5.5, LOW: 4 },
  { minEmployees: 46, maxEmployees: 65, HIGH: 8, MEDIUM: 6, LOW: 4.5 },
  { minEmployees: 66, maxEmployees: 85, HIGH: 9, MEDIUM: 7, LOW: 5 },
  { minEmployees: 86, maxEmployees: 125, HIGH: 11, MEDIUM: 8, LOW: 5.5 },
  { minEmployees: 126, maxEmployees: 175, HIGH: 12, MEDIUM: 9, LOW: 6 },
  { minEmployees: 176, maxEmployees: 275, HIGH: 13, MEDIUM: 10, LOW: 7 },
  { minEmployees: 276, maxEmployees: 425, HIGH: 15, MEDIUM: 11, LOW: 8 },
  { minEmployees: 426, maxEmployees: 625, HIGH: 16, MEDIUM: 12, LOW: 9 },
  { minEmployees: 626, maxEmployees: 875, HIGH: 17, MEDIUM: 13, LOW: 10 },
  { minEmployees: 876, maxEmployees: 1175, HIGH: 19, MEDIUM: 15, LOW: 11 },
  { minEmployees: 1176, maxEmployees: 1550, HIGH: 20, MEDIUM: 16, LOW: 12 },
  { minEmployees: 1551, maxEmployees: 2025, HIGH: 21, MEDIUM: 17, LOW: 12 },
  { minEmployees: 2026, maxEmployees: 2675, HIGH: 23, MEDIUM: 18, LOW: 13 },
  { minEmployees: 2676, maxEmployees: 3450, HIGH: 25, MEDIUM: 19, LOW: 14 },
  { minEmployees: 3451, maxEmployees: 4350, HIGH: 27, MEDIUM: 20, LOW: 15 },
  { minEmployees: 4351, maxEmployees: 5450, HIGH: 28, MEDIUM: 21, LOW: 16 },
  { minEmployees: 5451, maxEmployees: 6800, HIGH: 30, MEDIUM: 23, LOW: 17 },
  { minEmployees: 6801, maxEmployees: 8500, HIGH: 32, MEDIUM: 25, LOW: 19 },
  { minEmployees: 8501, maxEmployees: 10700, HIGH: 34, MEDIUM: 27, LOW: 20 },
]

/** IAF MD 9:2023 Table D.1 (ISO 13485). */
export const MD9_D1: DaysRow[] = [
  { minEmployees: 1, maxEmployees: 5, initialAuditDays: 3 },
  { minEmployees: 6, maxEmployees: 10, initialAuditDays: 4 },
  { minEmployees: 11, maxEmployees: 15, initialAuditDays: 4.5 },
  { minEmployees: 16, maxEmployees: 25, initialAuditDays: 5 },
  { minEmployees: 26, maxEmployees: 45, initialAuditDays: 6 },
  { minEmployees: 46, maxEmployees: 65, initialAuditDays: 7 },
  { minEmployees: 66, maxEmployees: 85, initialAuditDays: 8 },
  { minEmployees: 86, maxEmployees: 125, initialAuditDays: 10 },
  { minEmployees: 126, maxEmployees: 175, initialAuditDays: 11 },
  { minEmployees: 176, maxEmployees: 275, initialAuditDays: 12 },
  { minEmployees: 276, maxEmployees: 425, initialAuditDays: 13 },
  { minEmployees: 426, maxEmployees: 625, initialAuditDays: 14 },
  { minEmployees: 626, maxEmployees: 875, initialAuditDays: 15 },
  { minEmployees: 876, maxEmployees: 1175, initialAuditDays: 16 },
  { minEmployees: 1176, maxEmployees: 1550, initialAuditDays: 17 },
  { minEmployees: 1551, maxEmployees: 2025, initialAuditDays: 18 },
  { minEmployees: 2026, maxEmployees: 2675, initialAuditDays: 19 },
  { minEmployees: 2676, maxEmployees: 3450, initialAuditDays: 20 },
  { minEmployees: 3451, maxEmployees: 4350, initialAuditDays: 21 },
  { minEmployees: 4351, maxEmployees: 5450, initialAuditDays: 22 },
  { minEmployees: 5451, maxEmployees: 6800, initialAuditDays: 23 },
  { minEmployees: 6801, maxEmployees: 8500, initialAuditDays: 24 },
  { minEmployees: 8501, maxEmployees: 10700, initialAuditDays: 25 },
]

/** ISO/IEC 27006-1:2024 Annex C Table C.1 (ISO/IEC 27001). */
export const ISO27006_C1: DaysRow[] = [
  { minEmployees: 1, maxEmployees: 10, initialAuditDays: 5 },
  { minEmployees: 11, maxEmployees: 15, initialAuditDays: 6 },
  { minEmployees: 16, maxEmployees: 25, initialAuditDays: 7 },
  { minEmployees: 26, maxEmployees: 45, initialAuditDays: 8.5 },
  { minEmployees: 46, maxEmployees: 65, initialAuditDays: 10 },
  { minEmployees: 66, maxEmployees: 85, initialAuditDays: 11 },
  { minEmployees: 86, maxEmployees: 125, initialAuditDays: 12 },
  { minEmployees: 126, maxEmployees: 175, initialAuditDays: 13 },
  { minEmployees: 176, maxEmployees: 275, initialAuditDays: 14 },
  { minEmployees: 276, maxEmployees: 425, initialAuditDays: 15 },
  { minEmployees: 426, maxEmployees: 625, initialAuditDays: 16.5 },
  { minEmployees: 626, maxEmployees: 875, initialAuditDays: 17.5 },
  { minEmployees: 876, maxEmployees: 1175, initialAuditDays: 18.5 },
  { minEmployees: 1176, maxEmployees: 1550, initialAuditDays: 19.5 },
  { minEmployees: 1551, maxEmployees: 2025, initialAuditDays: 21 },
  { minEmployees: 2026, maxEmployees: 2675, initialAuditDays: 22 },
  { minEmployees: 2676, maxEmployees: 3450, initialAuditDays: 23 },
  { minEmployees: 3451, maxEmployees: 4350, initialAuditDays: 24 },
  { minEmployees: 4351, maxEmployees: 5450, initialAuditDays: 25 },
  { minEmployees: 5451, maxEmployees: 6800, initialAuditDays: 26 },
  { minEmployees: 6801, maxEmployees: 8500, initialAuditDays: 27 },
  { minEmployees: 8501, maxEmployees: 10700, initialAuditDays: 28 },
]

/** ISO 50003:2021 Table A.3 (ISO 50001 initial audit). */
export const ISO50003_A3: ComplexityRow<'HIGH' | 'MEDIUM' | 'LOW'>[] = [
  { minEmployees: 1, maxEmployees: 8, HIGH: 5, MEDIUM: 4, LOW: 2.5 },
  { minEmployees: 9, maxEmployees: 15, HIGH: 7, MEDIUM: 6, LOW: 4 },
  { minEmployees: 16, maxEmployees: 25, HIGH: 9, MEDIUM: 7, LOW: 5 },
  { minEmployees: 26, maxEmployees: 65, HIGH: 10, MEDIUM: 8, LOW: 6.5 },
  { minEmployees: 66, maxEmployees: 85, HIGH: 11.5, MEDIUM: 9.5, LOW: 8 },
  { minEmployees: 86, maxEmployees: 175, HIGH: 12, MEDIUM: 11, LOW: 8.5 },
  { minEmployees: 176, maxEmployees: 275, HIGH: 12.5, MEDIUM: 11.5, LOW: 9 },
  { minEmployees: 276, maxEmployees: 425, HIGH: 15, MEDIUM: 13, LOW: 10 },
  { minEmployees: 426, maxEmployees: 10700, HIGH: 15, MEDIUM: 13, LOW: 10 },
]

/** ISO 50003:2021 Table A.4 (ISO 50001 surveillance / recertification). */
export const ISO50003_A4: CycleRow[] = [
  { minEmployees: 1, maxEmployees: 8, LOW: { initial: 2.5, surveillance: 1, recertification: 1.5 }, MEDIUM: { initial: 4, surveillance: 1, recertification: 2.5 }, HIGH: { initial: 5, surveillance: 1.5, recertification: 3 } },
  { minEmployees: 9, maxEmployees: 15, LOW: { initial: 4, surveillance: 1, recertification: 2.5 }, MEDIUM: { initial: 6, surveillance: 2, recertification: 4 }, HIGH: { initial: 7, surveillance: 2.5, recertification: 5 } },
  { minEmployees: 16, maxEmployees: 25, LOW: { initial: 5, surveillance: 2, recertification: 3.5 }, MEDIUM: { initial: 7, surveillance: 2.5, recertification: 5 }, HIGH: { initial: 9, surveillance: 3, recertification: 6 } },
  { minEmployees: 26, maxEmployees: 65, LOW: { initial: 6.5, surveillance: 2.5, recertification: 5 }, MEDIUM: { initial: 8, surveillance: 3, recertification: 6 }, HIGH: { initial: 10, surveillance: 3.5, recertification: 7 } },
  { minEmployees: 66, maxEmployees: 85, LOW: { initial: 8, surveillance: 2.5, recertification: 6 }, MEDIUM: { initial: 9.5, surveillance: 3.5, recertification: 6.5 }, HIGH: { initial: 11.5, surveillance: 3.5, recertification: 8.5 } },
  { minEmployees: 86, maxEmployees: 175, LOW: { initial: 8.5, surveillance: 2.5, recertification: 6 }, MEDIUM: { initial: 11, surveillance: 3.5, recertification: 7 }, HIGH: { initial: 12, surveillance: 3.5, recertification: 8.5 } },
  { minEmployees: 176, maxEmployees: 275, LOW: { initial: 9, surveillance: 3, recertification: 6 }, MEDIUM: { initial: 11.5, surveillance: 4, recertification: 8 }, HIGH: { initial: 12.5, surveillance: 4, recertification: 9.5 } },
  { minEmployees: 276, maxEmployees: 425, LOW: { initial: 10, surveillance: 3.5, recertification: 7 }, MEDIUM: { initial: 13, surveillance: 4, recertification: 8.5 }, HIGH: { initial: 15, surveillance: 5, recertification: 11 } },
  { minEmployees: 426, maxEmployees: 10700, LOW: { initial: 10, surveillance: 3.5, recertification: 7 }, MEDIUM: { initial: 13, surveillance: 4, recertification: 8.5 }, HIGH: { initial: 15, surveillance: 5, recertification: 11 } },
]

/** ISO 22003-1:2022 Annex B Table B.1: TD (includes one HACCP study) and TH per extra study. */
export const FOOD_CATEGORIES_TABLE: Record<string, { td: number; th: number }> = {
  AI: { td: 1.0, th: 0.25 },
  AII: { td: 1.0, th: 0.25 },
  BI: { td: 1.0, th: 0.25 },
  BII: { td: 1.0, th: 0.25 },
  BIII: { td: 1.0, th: 0.25 },
  CO: { td: 2.0, th: 0.50 },
  CI: { td: 2.0, th: 0.50 },
  CII: { td: 2.0, th: 0.50 },
  CIII: { td: 2.0, th: 0.50 },
  CIV: { td: 2.0, th: 0.50 },
  D: { td: 1.0, th: 0.50 },
  E: { td: 1.5, th: 0.50 },
  FI: { td: 1.0, th: 0.50 },
  FII: { td: 1.0, th: 0.50 },
  G: { td: 1.5, th: 0.25 },
  H: { td: 1.5, th: 0.25 },
  I: { td: 1.5, th: 0.50 },
  J: { td: 1.5, th: 0.50 },
  K: { td: 2.0, th: 0.50 },
}

/** ISO 22003-1:2022 §B.3.2: TFTE by FTE employees (last band open-ended). */
export const FOOD_TFTE: Array<{ minFTE: number; maxFTE: number | null; tfte: number }> = [
  { minFTE: 1, maxFTE: 5, tfte: 0.0 },
  { minFTE: 6, maxFTE: 49, tfte: 0.5 },
  { minFTE: 50, maxFTE: 99, tfte: 1.0 },
  { minFTE: 100, maxFTE: 199, tfte: 1.5 },
  { minFTE: 200, maxFTE: 499, tfte: 2.0 },
  { minFTE: 500, maxFTE: 999, tfte: 2.5 },
  { minFTE: 1000, maxFTE: null, tfte: 3.0 },
]
