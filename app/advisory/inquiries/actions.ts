"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserAccess } from "@/lib/current-user-route-access"
import type { InquiryType } from "@advisory/lib/inquiries"

const ROUTES_TO_REVALIDATE = [
  "/dashboard",
  "/profile",
  "/inquiries/confirmation",
  "/subscribe",
  "/admin",
  "/admin/inquiries",
] as const

function revalidateInquiryRoutes() {
  ROUTES_TO_REVALIDATE.forEach((path) => revalidatePath(path))
}

function getTrimmedString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : ""
}

function toNullableString(value: FormDataEntryValue | null) {
  const normalized = getTrimmedString(value)
  return normalized || null
}

async function requireAuthenticatedUser() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabase, user }
}

async function requireAdminUser() {
  const { supabase, user } = await requireAuthenticatedUser()

  if (!user) {
    return {
      supabase,
      user: null,
      canAccessAdminPanel: false,
      organizationId: null as string | null,
    }
  }

  const routeAccess = await getCurrentUserAccess(supabase)

  return {
    supabase,
    user,
    canAccessAdminPanel: routeAccess.isOwner || routeAccess.organizationRole === "org_admin",
    organizationId: routeAccess.organizationId,
  }
}

async function getUserOrganizationId() {
  const supabase = await createSupabaseServerClient()
  const access = await getCurrentUserAccess(supabase)
  return { supabase, user: access.user, organizationId: access.organizationId }
}

async function insertInquiry(params: {
  type: InquiryType
  message: string
  metadata?: Record<string, string | null> | null
}) {
  const { supabase, user, organizationId } = await getUserOrganizationId()

  if (!user) {
    return { error: "Not authenticated." }
  }

  if (!organizationId) {
    return { error: "Organization access is required." }
  }

  const message = params.message.trim()
  if (!message) {
    return { error: "Message is required." }
  }

  const payload: {
    user_id: string
    organization_id: string
    type: InquiryType
    message: string
    metadata?: Record<string, string | null>
  } = {
    user_id: user.id,
    organization_id: organizationId,
    type: params.type,
    message,
  }

  if (params.metadata) {
    payload.metadata = params.metadata
  }

  const { error } = await supabase.from("inquiries").insert(payload)

  if (error) {
    console.error("Inquiry insert failed:", error)
    return { error: error.message ?? "Failed to submit inquiry." }
  }

  revalidateInquiryRoutes()

  return { error: null }
}

export async function submitSupportInquiry(formData: FormData) {
  return insertInquiry({
    type: "support",
    message: getTrimmedString(formData.get("message")),
  })
}

export async function submitCustomPlanInquiry(formData: FormData) {
  return insertInquiry({
    type: "custom_plan",
    message: getTrimmedString(formData.get("message")),
    metadata: {
      budget: toNullableString(formData.get("budget")),
      preference: toNullableString(formData.get("preference")),
    },
  })
}

export async function resolveInquiry(formData: FormData): Promise<void> {
  const inquiryId = getTrimmedString(formData.get("inquiryId"))
  if (!inquiryId) return

  const { supabase, canAccessAdminPanel, organizationId } = await requireAdminUser()
  if (!canAccessAdminPanel || !organizationId) return

  const { error } = await supabase
    .from("inquiries")
    .update({ status: "resolved" })
    .eq("id", inquiryId)
    .eq("organization_id", organizationId)

  if (error) {
    console.error("Inquiry resolve failed:", error)
    return
  }

  revalidateInquiryRoutes()
}
