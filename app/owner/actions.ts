"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserAccess } from "@/lib/current-user-route-access"
import { isReservedSubdomain } from "@/lib/reserved-subdomains"

type OwnerActionResult =
  | { ok: true }
  | {
      ok: false
      error: string
    }

type Role = "org_admin" | "member"

function normalizeInput(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : ""
}

async function verifyOwnerAccess() {
  const supabase = await createSupabaseServerClient()
  const access = await getCurrentUserAccess(supabase)

  if (!access.user || !access.isOwner) {
    return { supabase, userId: null as string | null, isOwner: false }
  }

  return { supabase, userId: access.user.id, isOwner: true }
}

export async function createOrganization(formData: FormData): Promise<OwnerActionResult> {
  const name = normalizeInput(formData.get("name"))
  const slug = normalizeInput(formData.get("slug")).toLowerCase()
  const subdomain = normalizeInput(formData.get("subdomain")).toLowerCase()

  if (!name || !slug || !subdomain) {
    return { ok: false, error: "Name, slug, and subdomain are required." }
  }

  if (isReservedSubdomain(subdomain)) {
    return { ok: false, error: "That subdomain is reserved and cannot be used." }
  }

  const { supabase, isOwner } = await verifyOwnerAccess()
  if (!isOwner) {
    return { ok: false, error: "Only owners can create organizations." }
  }

  const { error } = await supabase.from("organizations").insert({
    name,
    slug,
    subdomain,
  })

  if (error) {
    return { ok: false, error: error.message ?? "Failed to create organization." }
  }

  revalidatePath("/owner")
  return { ok: true }
}

export async function assignUserToOrganization(
  formData: FormData
): Promise<OwnerActionResult> {
  const userId = normalizeInput(formData.get("userId"))
  const organizationId = normalizeInput(formData.get("organizationId"))

  if (!userId || !organizationId) {
    return { ok: false, error: "User and organization are required." }
  }

  const { supabase, isOwner, userId: callerId } = await verifyOwnerAccess()
  if (!isOwner || !callerId) {
    return { ok: false, error: "Only owners can assign users." }
  }

  // Owners should not be assignable through this flow.
  const { data: profile, error: roleCheckError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle()

  if (roleCheckError) {
    return { ok: false, error: roleCheckError.message ?? "Failed to verify user role." }
  }

  const targetRole = typeof profile?.role === "string" ? profile.role.trim().toLowerCase() : ""
  if (targetRole === "owner") {
    return { ok: false, error: "Owners cannot be assigned to organizations." }
  }

  const { error } = await supabase.from("organization_memberships").upsert(
    {
      organization_id: organizationId,
      user_id: userId,
      role: "member" as Role,
    },
    { onConflict: "organization_id,user_id", ignoreDuplicates: true }
  )

  if (error) {
    return { ok: false, error: error.message ?? "Failed to assign user." }
  }

  const { error: removeOtherMembershipsError } = await supabase
    .from("organization_memberships")
    .delete()
    .eq("user_id", userId)
    .neq("organization_id", organizationId)

  if (removeOtherMembershipsError) {
    return {
      ok: false,
      error: removeOtherMembershipsError.message ?? "Failed to update previous organization links.",
    }
  }

  revalidatePath("/owner")
  revalidatePath("/waiting")
  revalidatePath("/dashboard")
  return { ok: true }
}

export async function promoteUserToOrgAdmin(
  formData: FormData
): Promise<OwnerActionResult> {
  const userId = normalizeInput(formData.get("userId"))
  const organizationId = normalizeInput(formData.get("organizationId"))

  if (!userId) {
    return { ok: false, error: "User is required." }
  }
  if (!organizationId) {
    return { ok: false, error: "Organization is required." }
  }

  const { supabase, isOwner, userId: callerId } = await verifyOwnerAccess()
  if (!isOwner || !callerId) {
    return { ok: false, error: "Only owners can promote users." }
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_memberships")
    .select("user_id")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .maybeSingle()

  if (membershipError) {
    return {
      ok: false,
      error: membershipError.message ?? "Failed to verify organization membership.",
    }
  }

  if (!membership?.user_id) {
    return { ok: false, error: "User is not a member of that organization." }
  }

  const { error } = await supabase
    .from("organization_memberships")
    .update({ role: "org_admin" })
    .eq("user_id", userId)
    .eq("organization_id", organizationId)

  if (error) {
    return { ok: false, error: error.message ?? "Failed to promote user." }
  }

  revalidatePath("/owner")
  revalidatePath("/admin/plans")
  return { ok: true }
}
