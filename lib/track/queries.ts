import type { SupabaseServerClient } from "@/lib/supabase/server"
import type { TrackActivityItem } from "@/lib/track/activity-types"
import { monthRangeBounds } from "@/lib/track/month"
import type {
  CreditLimitPool,
  MoneySource,
} from "@/lib/track/money-sources"
import type {
  CreditLimitPoolRow,
  ExpenseCategory,
  ExpenseWithCategory,
  IncomeRow,
  MoneySourceRow,
  MonthSummary,
  TrackProfile,
  TransferRow,
} from "@/lib/track/types"

type CategoryJoin = {
  id: string
  name: string
  slug: string
  icon: string | null
  is_system: boolean
} | null

type SourceJoin = {
  id: string
  name: string
} | null

function num(value: number | string | null | undefined) {
  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value)
  return 0
}

function mapMoneySource(row: MoneySourceRow): MoneySource {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    currency: row.currency,
    openingBalance: num(row.opening_balance),
    institution: row.institution,
    last4: row.last4,
    creditLimit: row.credit_limit == null ? null : num(row.credit_limit),
    creditLimitPoolId: row.credit_limit_pool_id ?? null,
    isDefault: row.is_default,
    createdAt: row.created_at,
  }
}

function mapCreditLimitPool(row: CreditLimitPoolRow): CreditLimitPool {
  return {
    id: row.id,
    name: row.name,
    limitAmount: num(row.limit_amount),
    currency: row.currency,
    createdAt: row.created_at,
  }
}

function mapExpenseRow(row: {
  id: string
  user_id: string
  category_id: string
  source_id?: string | null
  amount: number | string
  currency: string
  spent_at: string
  note: string | null
  created_at: string
  updated_at: string
  expense_categories?: CategoryJoin | CategoryJoin[]
  money_sources?: SourceJoin | SourceJoin[]
}): ExpenseWithCategory {
  const joined = Array.isArray(row.expense_categories)
    ? row.expense_categories[0] ?? null
    : row.expense_categories ?? null
  const sourceJoined = Array.isArray(row.money_sources)
    ? row.money_sources[0] ?? null
    : row.money_sources ?? null

  return {
    id: row.id,
    user_id: row.user_id,
    category_id: row.category_id,
    source_id: row.source_id ?? null,
    amount: num(row.amount),
    currency: row.currency,
    spent_at: row.spent_at,
    note: row.note,
    created_at: row.created_at,
    updated_at: row.updated_at,
    category: joined
      ? {
          id: joined.id,
          name: joined.name,
          slug: joined.slug,
          icon: joined.icon,
          is_system: joined.is_system,
        }
      : null,
    sourceName: sourceJoined?.name ?? null,
  }
}

export async function ensureTrackProfile(
  supabase: SupabaseServerClient,
  userId: string
): Promise<TrackProfile> {
  const { data: existing } = await supabase
    .from("track_profiles")
    .select("user_id,preferred_currency,timezone,onboarding_done")
    .eq("user_id", userId)
    .maybeSingle()

  if (existing) {
    return existing as TrackProfile
  }

  const { data: created, error } = await supabase
    .from("track_profiles")
    .insert({ user_id: userId })
    .select("user_id,preferred_currency,timezone,onboarding_done")
    .single()

  if (error || !created) {
    const { data: again } = await supabase
      .from("track_profiles")
      .select("user_id,preferred_currency,timezone,onboarding_done")
      .eq("user_id", userId)
      .single()
    if (again) return again as TrackProfile
    throw new Error(error?.message ?? "Could not create track profile.")
  }

  return created as TrackProfile
}

/** Earliest expense date for a user, or null if they have none yet. */
export async function getFirstExpenseAt(
  supabase: SupabaseServerClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("expenses")
    .select("spent_at")
    .eq("user_id", userId)
    .order("spent_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data?.spent_at ?? null
}

export async function ensureDefaultMoneySource(
  supabase: SupabaseServerClient,
  userId: string,
  currency: string
): Promise<void> {
  const { data: existing } = await supabase
    .from("money_sources")
    .select("id")
    .eq("user_id", userId)
    .limit(1)

  if ((existing ?? []).length > 0) return

  const { error: rpcError } = await supabase.rpc("ensure_default_cash_source", {
    p_user_id: userId,
    p_currency: currency,
  })

  if (!rpcError) return

  // Fallback if RPC not deployed yet / permission edge
  await supabase.from("money_sources").insert({
    user_id: userId,
    kind: "cash",
    name: "Cash",
    currency,
    opening_balance: 0,
    is_default: true,
  })
}

export async function listMoneySources(
  supabase: SupabaseServerClient,
  userId: string
): Promise<MoneySource[]> {
  const { data, error } = await supabase
    .from("money_sources")
    .select(
      "id,user_id,kind,name,currency,opening_balance,institution,last4,credit_limit,credit_limit_pool_id,is_default,created_at,updated_at"
    )
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)
  return ((data ?? []) as MoneySourceRow[]).map(mapMoneySource)
}

export async function listCreditLimitPools(
  supabase: SupabaseServerClient,
  userId: string
): Promise<CreditLimitPool[]> {
  const { data, error } = await supabase
    .from("credit_limit_pools")
    .select("id,user_id,name,limit_amount,currency,created_at,updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)
  return ((data ?? []) as CreditLimitPoolRow[]).map(mapCreditLimitPool)
}

export async function listCategories(
  supabase: SupabaseServerClient,
  userId: string
): Promise<ExpenseCategory[]> {
  const { data, error } = await supabase
    .from("expense_categories")
    .select("id,user_id,name,slug,icon,is_system")
    .or(`is_system.eq.true,user_id.eq.${userId}`)
    .order("is_system", { ascending: false })
    .order("name", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as ExpenseCategory[]
}

export async function listExpensesForMonth(
  supabase: SupabaseServerClient,
  userId: string,
  monthKey: string
): Promise<ExpenseWithCategory[]> {
  const { startIso, endIso } = monthRangeBounds(monthKey)

  const { data, error } = await supabase
    .from("expenses")
    .select(
      "id,user_id,category_id,source_id,amount,currency,spent_at,note,created_at,updated_at,expense_categories(id,name,slug,icon,is_system),money_sources(id,name)"
    )
    .eq("user_id", userId)
    .gte("spent_at", startIso)
    .lt("spent_at", endIso)
    .order("spent_at", { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) =>
    mapExpenseRow(row as Parameters<typeof mapExpenseRow>[0])
  )
}

export async function listIncomesForMonth(
  supabase: SupabaseServerClient,
  userId: string,
  monthKey: string
): Promise<IncomeRow[]> {
  const { startIso, endIso } = monthRangeBounds(monthKey)

  const { data, error } = await supabase
    .from("incomes")
    .select(
      "id,user_id,to_source_id,amount,currency,title,occurred_at,note,created_at,updated_at,money_sources!incomes_to_source_id_fkey(name)"
    )
    .eq("user_id", userId)
    .gte("occurred_at", startIso)
    .lt("occurred_at", endIso)
    .order("occurred_at", { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => {
    const r = row as IncomeRow & {
      money_sources?: { name: string } | { name: string }[] | null
      amount: number | string
    }
    const joined = Array.isArray(r.money_sources)
      ? r.money_sources[0]
      : r.money_sources
    return {
      ...r,
      amount: num(r.amount),
      to_source_name: joined?.name ?? null,
    }
  })
}

export async function listTransfersForMonth(
  supabase: SupabaseServerClient,
  userId: string,
  monthKey: string
): Promise<TransferRow[]> {
  const { startIso, endIso } = monthRangeBounds(monthKey)

  const { data, error } = await supabase
    .from("transfers")
    .select(
      "id,user_id,from_source_id,to_source_id,amount,currency,occurred_at,note,created_at,updated_at,from_source:money_sources!transfers_from_source_id_fkey(name),to_source:money_sources!transfers_to_source_id_fkey(name)"
    )
    .eq("user_id", userId)
    .gte("occurred_at", startIso)
    .lt("occurred_at", endIso)
    .order("occurred_at", { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => {
    const r = row as TransferRow & {
      amount: number | string
      from_source?: { name: string } | { name: string }[] | null
      to_source?: { name: string } | { name: string }[] | null
    }
    const fromJoined = Array.isArray(r.from_source) ? r.from_source[0] : r.from_source
    const toJoined = Array.isArray(r.to_source) ? r.to_source[0] : r.to_source
    return {
      id: r.id,
      user_id: r.user_id,
      from_source_id: r.from_source_id,
      to_source_id: r.to_source_id,
      amount: num(r.amount),
      currency: r.currency,
      occurred_at: r.occurred_at,
      note: r.note,
      created_at: r.created_at,
      updated_at: r.updated_at,
      from_source_name: fromJoined?.name ?? null,
      to_source_name: toJoined?.name ?? null,
    }
  })
}

export async function computeSourceBalances(
  supabase: SupabaseServerClient,
  userId: string,
  sources: MoneySource[]
): Promise<Record<string, number>> {
  const balances: Record<string, number> = {}
  for (const source of sources) {
    balances[source.id] = source.openingBalance
  }

  const [incomesRes, transfersRes, expensesRes] = await Promise.all([
    supabase.from("incomes").select("amount,to_source_id").eq("user_id", userId),
    supabase
      .from("transfers")
      .select("amount,from_source_id,to_source_id")
      .eq("user_id", userId),
    supabase
      .from("expenses")
      .select("amount,source_id")
      .eq("user_id", userId)
      .not("source_id", "is", null),
  ])

  for (const row of incomesRes.data ?? []) {
    const id = row.to_source_id as string
    if (balances[id] == null) continue
    balances[id] += num(row.amount as number | string)
  }

  for (const row of transfersRes.data ?? []) {
    const fromId = row.from_source_id as string
    const toId = row.to_source_id as string
    const amount = num(row.amount as number | string)
    if (balances[fromId] != null) balances[fromId] -= amount
    if (balances[toId] != null) balances[toId] += amount
  }

  for (const row of expensesRes.data ?? []) {
    const id = row.source_id as string
    if (!id || balances[id] == null) continue
    balances[id] -= num(row.amount as number | string)
  }

  return balances
}

export function incomeToActivity(row: IncomeRow): TrackActivityItem {
  return {
    id: row.id,
    kind: "income",
    title: row.title,
    amount: row.amount,
    currency: row.currency,
    occurredAt: row.occurred_at,
    note: row.note,
    categoryName: row.title,
    walletName: row.to_source_name ?? undefined,
  }
}

export function transferToActivity(row: TransferRow): TrackActivityItem {
  return {
    id: row.id,
    kind: "transfer",
    title:
      row.note?.trim() ||
      `${row.from_source_name ?? "From"} → ${row.to_source_name ?? "To"}`,
    amount: row.amount,
    currency: row.currency,
    occurredAt: row.occurred_at,
    note: row.note,
    fromWallet: row.from_source_name ?? undefined,
    toWallet: row.to_source_name ?? undefined,
  }
}

export async function getMonthSummary(
  supabase: SupabaseServerClient,
  userId: string,
  monthKey: string,
  currency: string
): Promise<MonthSummary> {
  const expenses = await listExpensesForMonth(supabase, userId, monthKey)
  const totals = new Map<
    string,
    { categoryId: string; name: string; slug: string; icon: string | null; total: number }
  >()

  let total = 0
  for (const expense of expenses) {
    total += expense.amount
    const key = expense.category_id
    const existing = totals.get(key)
    if (existing) {
      existing.total += expense.amount
    } else {
      totals.set(key, {
        categoryId: key,
        name: expense.category?.name ?? "Uncategorized",
        slug: expense.category?.slug ?? "other",
        icon: expense.category?.icon ?? null,
        total: expense.amount,
      })
    }
  }

  const byCategory = [...totals.values()].sort((a, b) => b.total - a.total)

  return {
    monthKey,
    currency,
    total,
    byCategory,
    recent: expenses.slice(0, 8),
  }
}
