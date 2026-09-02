export type TrackProfile = {
  user_id: string
  preferred_currency: string
  timezone: string
  onboarding_done: boolean
}

export type ExpenseCategory = {
  id: string
  user_id: string | null
  name: string
  slug: string
  icon: string | null
  is_system: boolean
}

export type Expense = {
  id: string
  user_id: string
  category_id: string
  source_id: string | null
  amount: number
  currency: string
  spent_at: string
  note: string | null
  created_at: string
  updated_at: string
}

export type ExpenseWithCategory = Expense & {
  category: Pick<ExpenseCategory, "id" | "name" | "slug" | "icon" | "is_system"> | null
  sourceName?: string | null
}

export type CategorySpend = {
  categoryId: string
  name: string
  slug: string
  icon: string | null
  total: number
}

export type DailySpendPoint = {
  date: string
  day: number
  label: string
  total: number
  cumulative: number
}

export type InsightLedgerPoint = {
  kind: "expense" | "income"
  amount: number
  at: string
}

export type InsightSeriesPoint = {
  key: string
  label: string
  expense: number
  income: number
  cumulativeExpense: number
  cumulativeIncome: number
}

export type MonthSummary = {
  monthKey: string
  currency: string
  total: number
  byCategory: CategorySpend[]
  expenses: ExpenseWithCategory[]
  recent: ExpenseWithCategory[]
  dailySpend: DailySpendPoint[]
}

export type MoneySourceKind = "cash" | "bank" | "credit_card"

export type CreditLimitPoolRow = {
  id: string
  user_id: string
  name: string
  limit_amount: number
  currency: string
  created_at: string
  updated_at: string
}

export type MoneySourceRow = {
  id: string
  user_id: string
  kind: MoneySourceKind
  name: string
  currency: string
  opening_balance: number
  institution: string | null
  last4: string | null
  card_network: string | null
  credit_limit: number | null
  credit_limit_pool_id: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

export type IncomeRow = {
  id: string
  user_id: string
  to_source_id: string
  amount: number
  currency: string
  title: string
  occurred_at: string
  note: string | null
  created_at: string
  updated_at: string
  to_source_name?: string | null
}

export type TransferPurpose = "transfer" | "card_bill"

export type TransferRow = {
  id: string
  user_id: string
  from_source_id: string
  to_source_id: string
  amount: number
  currency: string
  occurred_at: string
  note: string | null
  purpose: TransferPurpose
  created_at: string
  updated_at: string
  from_source_name?: string | null
  to_source_name?: string | null
}
