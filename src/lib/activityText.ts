/**
 * Translates the activity / history lines the API stores in English (nonconformity history,
 * decision activity, report events) into the current UI language. Unknown lines are shown as
 * they are, so nothing disappears.
 */

import { enumLabel } from '@/lib/enumLabel'

/** Any i18next-style translator (the full `t` or a narrowed one passed to sub-components). */
type Translate = (key: string, options?: { defaultValue?: string } & Record<string, unknown>) => string

type Rule = { re: RegExp; key: string; params?: (m: RegExpMatchArray, t: Translate) => Record<string, string> }

const RULES: Rule[] = [
  { re: /^Nonconformity raised from finding (\S+) during (\S+)$/, key: 'activity.ncRaised', params: (m) => ({ finding: m[1], audit: m[2] }) },
  { re: /^Client submitted corrective action response$/, key: 'activity.clientSubmittedResponse' },
  { re: /^Corrective action response submitted$/, key: 'activity.responseSubmitted' },
  { re: /^Response draft saved$/, key: 'activity.responseDraftSaved' },
  { re: /^Revision requested: (.*)$/, key: 'activity.revisionRequested', params: (m) => ({ comments: m[1] }) },
  { re: /^Closed after verification$/, key: 'activity.closedAfterVerification' },
  { re: /^Technical review completed$/, key: 'activity.technicalReviewCompleted' },
  {
    re: /^Decision recorded: (\w+) \(entered by (.+)\)$/,
    key: 'activity.decisionRecordedBy',
    params: (m, t) => ({ outcome: enumLabel(t, m[1]), by: m[2] }),
  },
  { re: /^Decision recorded: (\w+)$/, key: 'activity.decisionRecorded', params: (m, t) => ({ outcome: enumLabel(t, m[1]) }) },
  { re: /^Correction version v(\d+) opened$/, key: 'activity.correctionOpened', params: (m) => ({ version: m[1] }) },
  {
    re: /^(Stage \d|Surveillance \d|Surveillance|Recertification|Special) audit completed \((\S+)\)(?: for (.+))?$/,
    key: 'activity.auditCompleted',
    params: (m, t) => ({ stage: enumLabel(t, m[1]), audit: m[2], client: m[3] ?? '' }),
  },
  { re: /^Audit report v(\d+) finalized on (.+)$/, key: 'activity.reportFinalized', params: (m) => ({ version: m[1], date: m[2] }) },
  { re: /^Quotation prepared and submitted for approval\.$/, key: 'activity.quotationSubmitted' },
  { re: /^Quotation saved as draft\.$/, key: 'activity.quotationDraft' },
  { re: /^Quotation approved and issued to the client\.$/, key: 'activity.quotationIssued' },
  { re: /^Quotation accepted by the client\.$/, key: 'activity.quotationAccepted' },
  { re: /^Quotation rejected by the client\.$/, key: 'activity.quotationRejected' },
  { re: /^Quotation cancelled\.$/, key: 'activity.quotationCancelled' },
  { re: /^Assigned to (.+)$/, key: 'activity.assignedTo', params: (m) => ({ name: m[1] }) },
]

export function activityText(t: Translate, text: string): string {
  for (const rule of RULES) {
    const match = text.match(rule.re)
    if (match) return t(rule.key, { ...(rule.params?.(match, t) ?? {}), defaultValue: text })
  }
  return text
}
