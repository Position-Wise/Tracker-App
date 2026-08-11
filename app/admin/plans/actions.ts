"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserAccess } from "@/lib/current-user-route-access"

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  const normalized = normalizeText(value)
  return normalized || null
}

function normalizePrice(value: FormDataEntryValue | null) {
  const raw = normalizeText(value)
  if (!raw) return 0
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return null
  return Math.max(0, parsed)
}

function normalizePlanType(value: FormDataEntryValue | null): "trader" | "investor" | "both" | null {
  const normalized = normalizeText(value).toLowerCase()
  if (normalized === "trader" || normalized === "investor" || normalized === "both") {
    return normalized
  }
  return null
}

async function resolvePlanAccess() {
  const supabase = await createSupabaseServerClient()
  const access = await getCurrentUserAccess(supabase)
  const canManage = access.isOwner || access.organizationRole === "org_admin"
  return { supabase, access, canManage }
}

function revalidateOrgAdminRoutes() {
  revalidatePath("/admin/plans")
  revalidatePath("/admin/invites")
  revalidatePath("/dashboard")
  revalidatePath("/subscribe")
}

export async function createOrgPlan(formData: FormData): Promise<void> {
  const name = normalizeText(formData.get("name"))
  const description = normalizeOptionalText(formData.get("description"))
  const price = normalizePrice(formData.get("price"))
  const planType = normalizePlanType(formData.get("planType"))

  if (!name || price === null || !planType) {
    return
  }

  const { supabase, access, canManage } = await resolvePlanAccess()
  if (!canManage || !access.organizationId) {
    return
  }

  const { error } = await supabase.from("subscription_plans").insert({
    name,
    description,
    price,
    plan_type: planType,
    organization_id: access.organizationId,
  })

  if (error) {
    return
  }

  revalidateOrgAdminRoutes()
  return
}

export async function updateOrgPlan(formData: FormData): Promise<void> {
  const planId = normalizeText(formData.get("planId"))
  const name = normalizeText(formData.get("name"))
  const description = normalizeOptionalText(formData.get("description"))
  const price = normalizePrice(formData.get("price"))
  const planType = normalizePlanType(formData.get("planType"))

  if (!planId || !name || price === null || !planType) {
    return
  }

  const { supabase, access, canManage } = await resolvePlanAccess()
  if (!canManage || !access.organizationId) {
    return
  }

  const { error } = await supabase
    .from("subscription_plans")
    .update({
      name,
      description,
      price,
      plan_type: planType,
    })
    .eq("id", planId)
    .eq("organization_id", access.organizationId)

  if (error) {
    return
  }

  revalidateOrgAdminRoutes()
  return
}

export async function deleteOrgPlan(formData: FormData): Promise<void> {
  const planId = normalizeText(formData.get("planId"))
  if (!planId) {
    return
  }

  const { supabase, access, canManage } = await resolvePlanAccess()
  if (!canManage || !access.organizationId) {
    return
  }

  const { error } = await supabase
    .from("subscription_plans")
    .delete()
    .eq("id", planId)
    .eq("organization_id", access.organizationId)

  if (error) {
    return
  }

  revalidateOrgAdminRoutes()
  return
}

export async function createOrganizationInvite(formData: FormData): Promise<void> {
  const email = normalizeText(formData.get("email")).toLowerCase()
  if (!email) {
    return
  }

  const { supabase, access, canManage } = await resolvePlanAccess()
  if (!canManage || !access.organizationId) {
    return
  }

  const token = crypto.randomUUID()
  const { error } = await supabase.from("organization_invites").insert({
    organization_id: access.organizationId,
    email,
    role: "member",
    token,
  })

  if (error) {
    return
  }

  revalidatePath("/admin/invites")
  return
}
