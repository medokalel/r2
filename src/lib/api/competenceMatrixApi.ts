/**
 * Competence matrix: the IAF codes a person is authorised for under each standard,
 * plus the critical-code exams they took.
 *
 *   GET  /cab-employees/:id/competence-matrix  → CompetenceMatrix | null (null until first saved)
 *   PUT  /cab-employees/:id/competence-matrix  ← CompetenceMatrix
 *
 * The server keeps the employee's flat `schemes` / `iafCodes` equal to the matrix, refuses a
 * critical IAF code (src/lib/criticalCodeExams.ts) under a standard without a passed exam
 * (score ≥ 0.8) for that standard + code, and never deletes stored exam attempts.
 * In the preview (demo mode) the matrix is kept in the browser (localStorage).
 */

import { authorizedRequest } from '@/lib/api/authorizedClient'
import { isDemoMode } from '@/lib/api/demo/demoStore'

export interface CriticalExamResult {
  /** IAF code digits, e.g. "28" */
  code: string
  scheme: string
  score: number // 0..1
  passed: boolean
  takenAt: string // ISO 8601
}

export interface CompetenceMatrix {
  /** scheme name → IAF code values (e.g. "IAF_28") */
  schemeIafCodes: Record<string, string[]>
  exams: CriticalExamResult[]
}

const KEY = (employeeId: string) => `icasco-competence-matrix:${employeeId}`
const path = (employeeId: string) => `/cab-employees/${encodeURIComponent(employeeId)}/competence-matrix`

export async function getCompetenceMatrix(employeeId: string): Promise<CompetenceMatrix | null> {
  if (!isDemoMode()) return authorizedRequest<CompetenceMatrix | null>(path(employeeId))
  try {
    const raw = localStorage.getItem(KEY(employeeId))
    return raw ? (JSON.parse(raw) as CompetenceMatrix) : null
  } catch {
    return null
  }
}

export async function saveCompetenceMatrix(employeeId: string, matrix: CompetenceMatrix): Promise<CompetenceMatrix> {
  if (!isDemoMode()) {
    return authorizedRequest<CompetenceMatrix>(path(employeeId), { method: 'PUT', body: JSON.stringify(matrix) })
  }
  try {
    localStorage.setItem(KEY(employeeId), JSON.stringify(matrix))
  } catch {
    // Storage unavailable (private mode): the flat iafCodes are still saved on the employee.
  }
  return matrix
}
