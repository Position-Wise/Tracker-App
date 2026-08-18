export type MoneySourceKind = "cash" | "bank" | "credit_card"

/** Shared credit limit that one or more cards can join. */
export type CreditLimitPool = {
  id: string
  name: string
  limitAmount: number
  currency: string
  createdAt: string
}

export type MoneySource = {
  id: string
  kind: MoneySourceKind
  name: string
  currency: string
  /** Opening / starting balance when the account was added. */
  openingBalance: number
  institution: string | null
  last4: string | null
  /** Solo credit limit when not on a shared pool. */
  creditLimit: number | null
  /** When set, this card uses the pool’s shared limit. */
  creditLimitPoolId: string | null
  isDefault: boolean
  createdAt: string
}

/** Effective limit: shared pool amount, else the card’s own limit. */
export function effectiveCreditLimit(
  source: Pick<MoneySource, "creditLimit" | "creditLimitPoolId">,
  pools: CreditLimitPool[]
): number | null {
  if (source.creditLimitPoolId) {
    const pool = pools.find((p) => p.id === source.creditLimitPoolId)
    return pool ? pool.limitAmount : null
  }
  return source.creditLimit
}

export type LocalTransactionKind = "income" | "transfer"

export type LocalTrackTransaction = {
  id: string
  kind: LocalTransactionKind
  amount: number
  currency: string
  occurredAt: string
  note: string | null
  /** Income category label (Salary, Freelance, …) until income categories land in DB. */
  title: string
  /** Income lands in this source; expense paid-from maps live separately. */
  toSourceId: string | null
  /** Transfer / expense source. */
  fromSourceId: string | null
  createdAt: string
}

/** Local overlay: which money source an expense was paid from (until DB column exists). */
export type ExpenseSourceLink = {
  expenseId: string
  sourceId: string
}

export const MONEY_SOURCE_KIND_LABEL: Record<MoneySourceKind, string> = {
  cash: "Cash / wallet",
  bank: "Bank account",
  credit_card: "Credit card",
}

export const DEFAULT_INCOME_TITLES = [
  "Salary",
  "Freelance",
  "Interest",
  "Refund",
  "Gift",
  "Other income",
] as const

export function moneySourceKindIconName(kind: MoneySourceKind) {
  if (kind === "bank") return "bank"
  if (kind === "credit_card") return "card"
  return "cash"
}

export function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function createDefaultCashWallet(currency: string): MoneySource {
  return {
    id: createId("src"),
    kind: "cash",
    name: "Cash",
    currency,
    openingBalance: 0,
    institution: null,
    last4: null,
    creditLimit: null,
    creditLimitPoolId: null,
    isDefault: true,
    createdAt: new Date().toISOString(),
  }
}

export function sourceSubtitle(
  source: MoneySource,
  pools: CreditLimitPool[] = []
) {
  if (source.kind === "credit_card") {
    const bits = [
      source.institution,
      source.last4 ? `•••• ${source.last4}` : null,
    ].filter(Boolean) as string[]
    if (source.creditLimitPoolId) {
      const pool = pools.find((p) => p.id === source.creditLimitPoolId)
      if (pool) bits.push(`Shared: ${pool.name}`)
    }
    return bits.length ? bits.join(" · ") : "Credit card"
  }
  if (source.kind === "bank") {
    const bits = [
      source.institution,
      source.last4 ? `•••• ${source.last4}` : null,
    ].filter(Boolean)
    return bits.length ? bits.join(" · ") : "Bank account"
  }
  return "Cash wallet"
}
