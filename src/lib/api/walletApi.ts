/**
 * Digital wallet of the signed-in audit client.
 *
 *   GET /billing/wallet               → WalletBalance
 *   GET /billing/wallet/transactions  → WalletTransaction[] (newest first)
 *
 * The server derives both from the CAB invoices: financial dues are the outstanding balance of
 * issued invoices, and every payment the CAB records is a transaction.
 *
 * There is no payment gateway yet: saved cards, linked bank accounts, online top-up and refund
 * requests exist only in the preview (demo mode), whose data comes from the shared demo store
 * (lib/api/demo/records.ts) and the DEMO_* fixtures below. In real mode `getWalletPaymentMethods()`
 * returns empty lists and `isOnlineTopUpAvailable()` is false, so the wallet screen tells the
 * client to pay the CAB by bank transfer instead.
 */
import { authorizedRequest } from '@/lib/api/authorizedClient'
import { PORTAL_CLIENT_ID } from '@/lib/api/demo/dataset'
import { isDemoMode } from '@/lib/api/demo/demoStore'
import { invoices, walletTransactions } from '@/lib/api/demo/records'

export type WalletPaymentMethod = 'mada' | 'bank_transfer' | 'visa'

export type WalletTransactionStatus = 'successful' | 'pending' | 'failed'

export interface WalletTransaction {
  id: string
  transactionNumber: string
  date: string
  statementTitle: string
  statementSubtitle?: string
  paymentMethod: WalletPaymentMethod
  amount: number
  status: WalletTransactionStatus
}

export interface WalletBalance {
  availableCredit: number
  suspendedBalance: number
  financialDues: number
  refundsUnderReview: number
}

export interface LinkedBankAccount {
  id: string
  bankName: string
  accountHolderName: string
}

export interface SavedVisaCard {
  id: string
  paymentMethodName: string
  cardHolderName: string
  cardNumberMasked: string
}

export interface WalletPaymentMethods {
  cards: SavedVisaCard[]
  bankAccounts: LinkedBankAccount[]
}

/** Preview fixtures (demo mode only). */
const DEMO_SAVED_VISA_CARDS: SavedVisaCard[] = [
  {
    id: 'visa-1',
    paymentMethodName: 'Primary company card',
    cardHolderName: 'Al Noor Food Industries',
    cardNumberMasked: '5204-****-****-7519',
  },
  {
    id: 'visa-2',
    paymentMethodName: 'Operations Visa',
    cardHolderName: 'Sara Ali',
    cardNumberMasked: '4111-****-****-4242',
  },
]

const DEMO_LINKED_ACCOUNTS: LinkedBankAccount[] = [
  { id: '1', bankName: 'National Bank of Saudi Arabia', accountHolderName: 'Al Noor Food Industries' },
  { id: '2', bankName: 'Al Rajhi Bank', accountHolderName: 'Al Noor, Makkah Distribution Centre' },
  { id: '3', bankName: 'Riyad Bank', accountHolderName: 'Al Noor Food Industries, Payroll' },
]

/** Preview balance: a fixed credit plus the portal client's outstanding issued invoices. */
function demoWalletBalance(): WalletBalance {
  const portalInvoices = invoices().filter((i) => i.organizationId === PORTAL_CLIENT_ID)
  return {
    availableCredit: 5000,
    suspendedBalance: 0,
    financialDues: portalInvoices.filter((i) => i.status !== 'Draft').reduce((sum, i) => sum + i.balance, 0),
    refundsUnderReview: 0,
  }
}

/** Wallet balance of the signed-in client. */
export async function getWalletBalance(): Promise<WalletBalance> {
  if (!isDemoMode()) return authorizedRequest<WalletBalance>('/billing/wallet')
  return demoWalletBalance()
}

/** Wallet history (payments), newest first. */
export async function getWalletTransactions(): Promise<WalletTransaction[]> {
  if (!isDemoMode()) return authorizedRequest<WalletTransaction[]>('/billing/wallet/transactions')
  return [...walletTransactions()]
}

/** Saved cards and linked bank accounts. No endpoint exists yet: empty outside the preview. */
export async function getWalletPaymentMethods(): Promise<WalletPaymentMethods> {
  if (!isDemoMode()) return { cards: [], bankAccounts: [] }
  return { cards: [...DEMO_SAVED_VISA_CARDS], bankAccounts: [...DEMO_LINKED_ACCOUNTS] }
}

/**
 * Whether the wallet can be topped up (and payment methods / refunds managed) online.
 * False until a payment gateway exists; the client pays the CAB by bank transfer instead.
 */
export function isOnlineTopUpAvailable(): boolean {
  return isDemoMode()
}

export function formatWalletAmount(value: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
