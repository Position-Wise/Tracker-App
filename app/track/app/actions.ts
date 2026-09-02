"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { dateInputToIso, slugifyCategoryName } from "@track/lib/month"
import { parseCardNetwork } from "@track/lib/money-sources"
import { ensureTrackProfile } from "@track/lib/queries"

export type TrackActionResult = {
  ok: boolean
  error?: string
  id?: string
}

function text(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

function revalidateTrack() {
  revalidatePath("/app")
  revalidatePath("/app/expenses")
  revalidatePath("/app/categories")
  revalidatePath("/app/accounts")
  revalidatePath("/profile")
}

async function requireTrackUser() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { supabase, user: null as null, error: "Sign in required." }
  }
  await ensureTrackProfile(supabase, user.id)
  return { supabase, user, error: null as string | null }
}

export async function createExpense(formData: FormData): Promise<TrackActionResult> {
  const amountRaw = text(formData, "amount")
  const categoryId = text(formData, "categoryId")
  const sourceId = text(formData, "sourceId") || null
  const spentDate = text(formData, "spentAt")
  const note = text(formData, "note") || null
  const amount = Number(amountRaw)

  if (!categoryId || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Enter a valid amount and category." }
  }

  const { supabase, user, error } = await requireTrackUser()
  if (!user || error) return { ok: false, error: error ?? "Sign in required." }

  const profile = await ensureTrackProfile(supabase, user.id)

  const { data: created, error: insertError } = await supabase
    .from("expenses")
    .insert({
      user_id: user.id,
      category_id: categoryId,
      source_id: sourceId,
      amount,
      currency: profile.preferred_currency,
      spent_at: dateInputToIso(spentDate || new Date().toISOString().slice(0, 10)),
      note,
    })
    .select("id")
    .single()

  if (insertError) {
    return { ok: false, error: insertError.message }
  }

  revalidateTrack()
  return { ok: true, id: created?.id }
}

export async function updateExpense(formData: FormData): Promise<TrackActionResult> {
  const expenseId = text(formData, "expenseId")
  const amountRaw = text(formData, "amount")
  const categoryId = text(formData, "categoryId")
  const sourceId = text(formData, "sourceId") || null
  const spentDate = text(formData, "spentAt")
  const note = text(formData, "note") || null
  const amount = Number(amountRaw)

  if (!expenseId || !categoryId || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Enter a valid amount and category." }
  }

  const { supabase, user, error } = await requireTrackUser()
  if (!user || error) return { ok: false, error: error ?? "Sign in required." }

  const { error: updateError } = await supabase
    .from("expenses")
    .update({
      category_id: categoryId,
      source_id: sourceId,
      amount,
      spent_at: dateInputToIso(spentDate || new Date().toISOString().slice(0, 10)),
      note,
    })
    .eq("id", expenseId)
    .eq("user_id", user.id)

  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  revalidateTrack()
  return { ok: true }
}

export async function deleteExpense(formData: FormData): Promise<TrackActionResult> {
  const expenseId = text(formData, "expenseId")
  if (!expenseId) return { ok: false, error: "Missing expense." }

  const { supabase, user, error } = await requireTrackUser()
  if (!user || error) return { ok: false, error: error ?? "Sign in required." }

  const { error: deleteError } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("user_id", user.id)

  if (deleteError) {
    return { ok: false, error: deleteError.message }
  }

  revalidateTrack()
  return { ok: true }
}

export async function createCategory(formData: FormData): Promise<TrackActionResult> {
  const name = text(formData, "name")
  if (!name) return { ok: false, error: "Name is required." }

  const { supabase, user, error } = await requireTrackUser()
  if (!user || error) return { ok: false, error: error ?? "Sign in required." }

  let slug = slugifyCategoryName(name)
  const { data: existing } = await supabase
    .from("expense_categories")
    .select("id")
    .eq("user_id", user.id)
    .eq("slug", slug)
    .maybeSingle()

  if (existing) {
    slug = `${slug}_${Date.now().toString(36).slice(-4)}`
  }

  const { error: insertError } = await supabase.from("expense_categories").insert({
    user_id: user.id,
    name,
    slug,
    icon: "tag",
    is_system: false,
  })

  if (insertError) {
    return { ok: false, error: insertError.message }
  }

  revalidateTrack()
  return { ok: true }
}

export async function updateCategory(formData: FormData): Promise<TrackActionResult> {
  const categoryId = text(formData, "categoryId")
  const name = text(formData, "name")
  if (!categoryId || !name) return { ok: false, error: "Name is required." }

  const { supabase, user, error } = await requireTrackUser()
  if (!user || error) return { ok: false, error: error ?? "Sign in required." }

  const { error: updateError } = await supabase
    .from("expense_categories")
    .update({ name })
    .eq("id", categoryId)
    .eq("user_id", user.id)
    .eq("is_system", false)

  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  revalidateTrack()
  return { ok: true }
}

export async function deleteCategory(formData: FormData): Promise<TrackActionResult> {
  const categoryId = text(formData, "categoryId")
  if (!categoryId) return { ok: false, error: "Missing category." }

  const { supabase, user, error } = await requireTrackUser()
  if (!user || error) return { ok: false, error: error ?? "Sign in required." }

  const { count } = await supabase
    .from("expenses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("category_id", categoryId)

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: "This category has expenses. Reassign or delete them first.",
    }
  }

  const { error: deleteError } = await supabase
    .from("expense_categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", user.id)
    .eq("is_system", false)

  if (deleteError) {
    return { ok: false, error: deleteError.message }
  }

  revalidateTrack()
  return { ok: true }
}

export async function updateTrackPreferences(
  formData: FormData
): Promise<TrackActionResult> {
  const currency = text(formData, "currency").toUpperCase()
  const timezone = text(formData, "timezone") || "Asia/Kolkata"

  if (!/^[A-Z]{3}$/.test(currency)) {
    return { ok: false, error: "Currency must be a 3-letter code (e.g. INR)." }
  }

  const { supabase, user, error } = await requireTrackUser()
  if (!user || error) return { ok: false, error: error ?? "Sign in required." }

  const { error: updateError } = await supabase
    .from("track_profiles")
    .update({
      preferred_currency: currency,
      timezone,
      onboarding_done: true,
    })
    .eq("user_id", user.id)

  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  revalidateTrack()
  return { ok: true }
}

function parseKind(value: string): "cash" | "bank" | "credit_card" | null {
  if (value === "cash" || value === "bank" || value === "credit_card") return value
  return null
}

function resolveCardNetwork(
  kind: "cash" | "bank" | "credit_card",
  formData: FormData
): { ok: true; value: ReturnType<typeof parseCardNetwork> } | { ok: false; error: string } {
  const raw = text(formData, "cardNetwork")
  if (kind !== "credit_card") return { ok: true, value: null }
  if (!raw) return { ok: true, value: null }
  const parsed = parseCardNetwork(raw)
  if (!parsed) return { ok: false, error: "Choose Visa, Mastercard, Amex, or RuPay." }
  return { ok: true, value: parsed }
}

export async function createMoneySource(formData: FormData): Promise<TrackActionResult> {
  const kind = parseKind(text(formData, "kind"))
  const name = text(formData, "name")
  const openingBalance = Number(text(formData, "openingBalance") || "0")
  const institution = text(formData, "institution") || null
  const last4 = text(formData, "last4") || null
  const limitMode = text(formData, "limitMode") || "own"
  const creditLimitRaw = text(formData, "creditLimit")
  const creditLimit = creditLimitRaw ? Number(creditLimitRaw) : null
  const existingPoolId = text(formData, "creditLimitPoolId") || null
  const newPoolName = text(formData, "newPoolName")
  const newPoolLimitRaw = text(formData, "newPoolLimit")
  const newPoolLimit = newPoolLimitRaw ? Number(newPoolLimitRaw) : null

  if (!kind || !name || !Number.isFinite(openingBalance)) {
    return { ok: false, error: "Enter a valid account." }
  }

  const cardNetwork = resolveCardNetwork(kind, formData)
  if (!cardNetwork.ok) return { ok: false, error: cardNetwork.error }

  const { supabase, user, error } = await requireTrackUser()
  if (!user || error) return { ok: false, error: error ?? "Sign in required." }

  const profile = await ensureTrackProfile(supabase, user.id)
  const { count } = await supabase
    .from("money_sources")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)

  let creditLimitPoolId: string | null = null
  let soloCreditLimit: number | null = null

  if (kind === "credit_card") {
    if (limitMode === "shared") {
      if (existingPoolId === "__new__") {
        if (!newPoolName || newPoolLimit == null || !Number.isFinite(newPoolLimit) || newPoolLimit < 0) {
          return { ok: false, error: "Enter a shared limit name and amount." }
        }
        const { data: pool, error: poolError } = await supabase
          .from("credit_limit_pools")
          .insert({
            user_id: user.id,
            name: newPoolName,
            limit_amount: newPoolLimit,
            currency: profile.preferred_currency,
          })
          .select("id")
          .single()
        if (poolError || !pool) {
          return { ok: false, error: poolError?.message ?? "Could not create shared limit." }
        }
        creditLimitPoolId = pool.id
      } else if (existingPoolId) {
        const sharedLimitRaw = text(formData, "sharedPoolLimit")
        const sharedLimit = sharedLimitRaw ? Number(sharedLimitRaw) : null
        if (sharedLimit != null && Number.isFinite(sharedLimit) && sharedLimit >= 0) {
          const { error: poolUpdateError } = await supabase
            .from("credit_limit_pools")
            .update({ limit_amount: sharedLimit })
            .eq("id", existingPoolId)
            .eq("user_id", user.id)
          if (poolUpdateError) {
            return { ok: false, error: poolUpdateError.message }
          }
        }
        creditLimitPoolId = existingPoolId
      } else {
        return { ok: false, error: "Select or create a shared credit limit." }
      }
    } else {
      if (creditLimit != null && (!Number.isFinite(creditLimit) || creditLimit < 0)) {
        return { ok: false, error: "Enter a valid credit limit." }
      }
      soloCreditLimit = creditLimit
    }
  }

  const { data, error: insertError } = await supabase
    .from("money_sources")
    .insert({
      user_id: user.id,
      kind,
      name,
      currency: profile.preferred_currency,
      opening_balance: openingBalance,
      institution,
      last4,
      card_network: cardNetwork.value,
      credit_limit: soloCreditLimit,
      credit_limit_pool_id: creditLimitPoolId,
      is_default: (count ?? 0) === 0,
    })
    .select("id")
    .single()

  if (insertError) return { ok: false, error: insertError.message }

  revalidateTrack()
  return { ok: true, id: data?.id }
}

export async function updateMoneySource(formData: FormData): Promise<TrackActionResult> {
  const sourceId = text(formData, "sourceId")
  const kind = parseKind(text(formData, "kind"))
  const name = text(formData, "name")
  const openingBalance = Number(text(formData, "openingBalance") || "0")
  const institution = text(formData, "institution") || null
  const last4 = text(formData, "last4") || null
  const limitMode = text(formData, "limitMode") || "own"
  const creditLimitRaw = text(formData, "creditLimit")
  const creditLimit = creditLimitRaw ? Number(creditLimitRaw) : null
  const existingPoolId = text(formData, "creditLimitPoolId") || null
  const newPoolName = text(formData, "newPoolName")
  const newPoolLimitRaw = text(formData, "newPoolLimit")
  const newPoolLimit = newPoolLimitRaw ? Number(newPoolLimitRaw) : null

  if (!sourceId || !kind || !name || !Number.isFinite(openingBalance)) {
    return { ok: false, error: "Enter a valid account." }
  }

  const cardNetwork = resolveCardNetwork(kind, formData)
  if (!cardNetwork.ok) return { ok: false, error: cardNetwork.error }

  const { supabase, user, error } = await requireTrackUser()
  if (!user || error) return { ok: false, error: error ?? "Sign in required." }

  const profile = await ensureTrackProfile(supabase, user.id)

  let creditLimitPoolId: string | null = null
  let soloCreditLimit: number | null = null

  if (kind === "credit_card") {
    if (limitMode === "shared") {
      if (existingPoolId === "__new__") {
        if (!newPoolName || newPoolLimit == null || !Number.isFinite(newPoolLimit) || newPoolLimit < 0) {
          return { ok: false, error: "Enter a shared limit name and amount." }
        }
        const { data: pool, error: poolError } = await supabase
          .from("credit_limit_pools")
          .insert({
            user_id: user.id,
            name: newPoolName,
            limit_amount: newPoolLimit,
            currency: profile.preferred_currency,
          })
          .select("id")
          .single()
        if (poolError || !pool) {
          return { ok: false, error: poolError?.message ?? "Could not create shared limit." }
        }
        creditLimitPoolId = pool.id
      } else if (existingPoolId) {
        const sharedLimitRaw = text(formData, "sharedPoolLimit")
        const sharedLimit = sharedLimitRaw ? Number(sharedLimitRaw) : null
        if (sharedLimit != null && Number.isFinite(sharedLimit) && sharedLimit >= 0) {
          const { error: poolUpdateError } = await supabase
            .from("credit_limit_pools")
            .update({ limit_amount: sharedLimit })
            .eq("id", existingPoolId)
            .eq("user_id", user.id)
          if (poolUpdateError) {
            return { ok: false, error: poolUpdateError.message }
          }
        }
        creditLimitPoolId = existingPoolId
      } else {
        return { ok: false, error: "Select or create a shared credit limit." }
      }
    } else {
      if (creditLimit != null && (!Number.isFinite(creditLimit) || creditLimit < 0)) {
        return { ok: false, error: "Enter a valid credit limit." }
      }
      soloCreditLimit = creditLimit
    }
  }

  const { error: updateError } = await supabase
    .from("money_sources")
    .update({
      kind,
      name,
      opening_balance: openingBalance,
      institution,
      last4,
      card_network: cardNetwork.value,
      credit_limit: soloCreditLimit,
      credit_limit_pool_id: creditLimitPoolId,
    })
    .eq("id", sourceId)
    .eq("user_id", user.id)

  if (updateError) return { ok: false, error: updateError.message }

  revalidateTrack()
  return { ok: true }
}

export async function deleteMoneySource(formData: FormData): Promise<TrackActionResult> {
  const sourceId = text(formData, "sourceId")
  if (!sourceId) return { ok: false, error: "Missing account." }

  const { supabase, user, error } = await requireTrackUser()
  if (!user || error) return { ok: false, error: error ?? "Sign in required." }

  const { count: sourceCount } = await supabase
    .from("money_sources")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)

  if ((sourceCount ?? 0) <= 1) {
    return { ok: false, error: "Keep at least one account." }
  }

  const [{ count: incomeCount }, { count: transferCount }] = await Promise.all([
    supabase
      .from("incomes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("to_source_id", sourceId),
    supabase
      .from("transfers")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .or(`from_source_id.eq.${sourceId},to_source_id.eq.${sourceId}`),
  ])

  if ((incomeCount ?? 0) > 0 || (transferCount ?? 0) > 0) {
    return {
      ok: false,
      error: "This account is used by income or transfers. Remove those first.",
    }
  }

  const { error: deleteError } = await supabase
    .from("money_sources")
    .delete()
    .eq("id", sourceId)
    .eq("user_id", user.id)

  if (deleteError) return { ok: false, error: deleteError.message }

  revalidateTrack()
  return { ok: true }
}

export async function createIncome(formData: FormData): Promise<TrackActionResult> {
  const amount = Number(text(formData, "amount"))
  const title = text(formData, "title")
  const toSourceId = text(formData, "toSourceId")
  const spentDate = text(formData, "spentAt")
  const note = text(formData, "note") || null

  if (!Number.isFinite(amount) || amount <= 0 || !title || !toSourceId) {
    return { ok: false, error: "Enter amount, type, and account." }
  }

  const { supabase, user, error } = await requireTrackUser()
  if (!user || error) return { ok: false, error: error ?? "Sign in required." }

  const profile = await ensureTrackProfile(supabase, user.id)

  const { data, error: insertError } = await supabase
    .from("incomes")
    .insert({
      user_id: user.id,
      to_source_id: toSourceId,
      amount,
      currency: profile.preferred_currency,
      title,
      occurred_at: dateInputToIso(spentDate || new Date().toISOString().slice(0, 10)),
      note,
    })
    .select("id")
    .single()

  if (insertError) return { ok: false, error: insertError.message }

  revalidateTrack()
  return { ok: true, id: data?.id }
}

export async function updateIncome(formData: FormData): Promise<TrackActionResult> {
  const incomeId = text(formData, "incomeId")
  const amount = Number(text(formData, "amount"))
  const title = text(formData, "title")
  const toSourceId = text(formData, "toSourceId")
  const spentDate = text(formData, "spentAt")
  const note = text(formData, "note") || null

  if (!incomeId || !Number.isFinite(amount) || amount <= 0 || !title || !toSourceId) {
    return { ok: false, error: "Enter amount, type, and account." }
  }

  const { supabase, user, error } = await requireTrackUser()
  if (!user || error) return { ok: false, error: error ?? "Sign in required." }

  const { error: updateError } = await supabase
    .from("incomes")
    .update({
      to_source_id: toSourceId,
      amount,
      title,
      occurred_at: dateInputToIso(spentDate || new Date().toISOString().slice(0, 10)),
      note,
    })
    .eq("id", incomeId)
    .eq("user_id", user.id)

  if (updateError) return { ok: false, error: updateError.message }

  revalidateTrack()
  return { ok: true }
}

export async function deleteIncome(formData: FormData): Promise<TrackActionResult> {
  const incomeId = text(formData, "incomeId")
  if (!incomeId) return { ok: false, error: "Missing income." }

  const { supabase, user, error } = await requireTrackUser()
  if (!user || error) return { ok: false, error: error ?? "Sign in required." }

  const { error: deleteError } = await supabase
    .from("incomes")
    .delete()
    .eq("id", incomeId)
    .eq("user_id", user.id)

  if (deleteError) return { ok: false, error: deleteError.message }

  revalidateTrack()
  return { ok: true }
}

export async function createTransfer(formData: FormData): Promise<TrackActionResult> {
  const amount = Number(text(formData, "amount"))
  const fromSourceId = text(formData, "fromSourceId")
  const toSourceId = text(formData, "toSourceId")
  const spentDate = text(formData, "spentAt")
  const note = text(formData, "note") || null
  const purposeRaw = text(formData, "purpose")
  const purpose = purposeRaw === "card_bill" ? "card_bill" : "transfer"

  if (!Number.isFinite(amount) || amount <= 0 || !fromSourceId || !toSourceId) {
    return { ok: false, error: "Enter amount and both accounts." }
  }
  if (fromSourceId === toSourceId) {
    return { ok: false, error: "Pick two different accounts." }
  }

  const { supabase, user, error } = await requireTrackUser()
  if (!user || error) return { ok: false, error: error ?? "Sign in required." }

  if (purpose === "card_bill") {
    const kindError = await validateCardBillSources(
      supabase,
      user.id,
      fromSourceId,
      toSourceId
    )
    if (kindError) return { ok: false, error: kindError }
  }

  const profile = await ensureTrackProfile(supabase, user.id)

  const { data, error: insertError } = await supabase
    .from("transfers")
    .insert({
      user_id: user.id,
      from_source_id: fromSourceId,
      to_source_id: toSourceId,
      amount,
      currency: profile.preferred_currency,
      occurred_at: dateInputToIso(spentDate || new Date().toISOString().slice(0, 10)),
      note: note ?? (purpose === "card_bill" ? "Credit card bill" : null),
      purpose,
    })
    .select("id")
    .single()

  if (insertError) return { ok: false, error: insertError.message }

  revalidateTrack()
  return { ok: true, id: data?.id }
}

export async function updateTransfer(formData: FormData): Promise<TrackActionResult> {
  const transferId = text(formData, "transferId")
  const amount = Number(text(formData, "amount"))
  const fromSourceId = text(formData, "fromSourceId")
  const toSourceId = text(formData, "toSourceId")
  const spentDate = text(formData, "spentAt")
  const note = text(formData, "note") || null
  const purposeRaw = text(formData, "purpose")
  const purpose = purposeRaw === "card_bill" ? "card_bill" : "transfer"

  if (
    !transferId ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !fromSourceId ||
    !toSourceId
  ) {
    return { ok: false, error: "Enter amount and both accounts." }
  }
  if (fromSourceId === toSourceId) {
    return { ok: false, error: "Pick two different accounts." }
  }

  const { supabase, user, error } = await requireTrackUser()
  if (!user || error) return { ok: false, error: error ?? "Sign in required." }

  if (purpose === "card_bill") {
    const kindError = await validateCardBillSources(
      supabase,
      user.id,
      fromSourceId,
      toSourceId
    )
    if (kindError) return { ok: false, error: kindError }
  }

  const { error: updateError } = await supabase
    .from("transfers")
    .update({
      from_source_id: fromSourceId,
      to_source_id: toSourceId,
      amount,
      occurred_at: dateInputToIso(spentDate || new Date().toISOString().slice(0, 10)),
      note,
      purpose,
    })
    .eq("id", transferId)
    .eq("user_id", user.id)

  if (updateError) return { ok: false, error: updateError.message }

  revalidateTrack()
  return { ok: true }
}

export async function deleteTransfer(formData: FormData): Promise<TrackActionResult> {
  const transferId = text(formData, "transferId")
  if (!transferId) return { ok: false, error: "Missing transfer." }

  const { supabase, user, error } = await requireTrackUser()
  if (!user || error) return { ok: false, error: error ?? "Sign in required." }

  const { error: deleteError } = await supabase
    .from("transfers")
    .delete()
    .eq("id", transferId)
    .eq("user_id", user.id)

  if (deleteError) return { ok: false, error: deleteError.message }

  revalidateTrack()
  return { ok: true }
}

async function validateCardBillSources(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  fromSourceId: string,
  toSourceId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("money_sources")
    .select("id,kind")
    .eq("user_id", userId)
    .in("id", [fromSourceId, toSourceId])

  if (error) return error.message
  const byId = new Map((data ?? []).map((row) => [row.id as string, row.kind as string]))
  const fromKind = byId.get(fromSourceId)
  const toKind = byId.get(toSourceId)
  if (!fromKind || !toKind) return "Pick valid accounts."
  if (fromKind === "credit_card") {
    return "Pay the bill from a bank or cash account."
  }
  if (toKind !== "credit_card") {
    return "Choose a credit card to pay."
  }
  return null
}
