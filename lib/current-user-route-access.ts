import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { CurrentUserAccess } from "@/lib/current-user-access"
import { getSubdomain } from "@/lib/get-subdomain"
import {
  isReservedSubdomain,
  OWNER_PLATFORM_SUBDOMAIN,
  TRACK_PLATFORM_SUBDOMAIN,
} from "@/lib/reserved-subdomains"
import { resolveOrg } from "@/lib/resolve-org-from-subdomain"
import { cookies } from "next/headers"

function toNullableString(value: unknown) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function toRpcBoolean(value: unknown) {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (normalized === "true") return true
    if (normalized === "false") return false
  }

  if (value && typeof value === "object") {
    const row = value as Record<string, unknown>
    for (const candidate of Object.values(row)) {
      if (typeof candidate === "boolean") {
        return candidate
      }
    }
  }

  return false
}

function roleFromMembershipRow(row: {
  organization_id?: string | null
  role?: string | null
} | null): CurrentUserAccess["organizationRole"] {
  if (!row) return null
  const r = toNullableString(row.role ?? null)
  if (r === "org_admin") return "org_admin"
  if (r === "member") return "member"
  return null
}

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

type CurrentUserAccessOptions = {
  orgId?: string | null
}

export async function getCurrentUserAccess(
  providedSupabase?: SupabaseServerClient,
  options?: CurrentUserAccessOptions
): Promise<CurrentUserAccess> {
  const supabase = providedSupabase ?? (await createSupabaseServerClient())
  const [cookieStore, subdomain] = await Promise.all([cookies(), getSubdomain()])
  const normalizedSubdomain = toNullableString(subdomain)
  const resolvedOrganization =
    normalizedSubdomain && !isReservedSubdomain(normalizedSubdomain)
      ? await resolveOrg(normalizedSubdomain, supabase)
      : null
  const subdomainOrganizationId = toNullableString(resolvedOrganization?.id ?? null)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const tenantNotFound = Boolean(
      normalizedSubdomain &&
        !isReservedSubdomain(normalizedSubdomain) &&
        !subdomainOrganizationId
    )
    return {
      user: null,
      isOwner: false,
      organizationId: null,
      organizationRole: null,
      forbidden: false,
      tenantNotFound,
    }
  }

  const requestedOrgId = toNullableString(options?.orgId ?? null)
  const selectedOwnerOrgFromCookie = toNullableString(
    cookieStore.get("owner_admin_org_id")?.value ?? null
  )

  const [isOwnerResult, membershipsResult] = await Promise.all([
    supabase.rpc("is_owner"),
    supabase
      .from("organization_memberships")
      .select("organization_id,role")
      .eq("user_id", user.id)
      .order("role", { ascending: false })
      .order("organization_id", { ascending: true }),
  ])
  const { data: isOwnerData, error: isOwnerError } = isOwnerResult

  if (isOwnerError) {
    throw new Error(isOwnerError.message ?? "Failed to determine owner status.")
  }

  const membershipRows =
    (membershipsResult.data as { organization_id?: string | null; role?: string | null }[] | null) ?? []

  const isOwner = toRpcBoolean(isOwnerData)

  if (subdomainOrganizationId) {
    if (isOwner) {
      return {
        user,
        isOwner,
        organizationId: subdomainOrganizationId,
        organizationRole: "org_admin",
        forbidden: false,
        tenantNotFound: false,
      }
    }
    const rowForTenant =
      membershipRows.find(
        (row) => toNullableString(row.organization_id ?? null) === subdomainOrganizationId
      ) ?? null
    if (!rowForTenant) {
      return {
        user,
        isOwner,
        organizationId: null,
        organizationRole: null,
        forbidden: true,
        tenantNotFound: false,
      }
    }
    return {
      user,
      isOwner,
      organizationId: subdomainOrganizationId,
      organizationRole: roleFromMembershipRow(rowForTenant),
      forbidden: false,
      tenantNotFound: false,
    }
  }

  const defaultMembership =
    membershipRows.find((row) => toNullableString(row.role ?? null) === "org_admin") ??
    membershipRows[0] ??
    null

  const defaultOrganizationId = toNullableString(defaultMembership?.organization_id ?? null)
  const defaultOrganizationRole = roleFromMembershipRow(defaultMembership)
  let organizationId = defaultOrganizationId
  let organizationRole = defaultOrganizationRole

  if (normalizedSubdomain === OWNER_PLATFORM_SUBDOMAIN) {
    if (!isOwner) {
      return {
        user,
        isOwner,
        organizationId: null,
        organizationRole: null,
        forbidden: true,
        tenantNotFound: false,
      }
    }

    const ownerSelectedOrgId = requestedOrgId ?? selectedOwnerOrgFromCookie ?? defaultOrganizationId
    if (ownerSelectedOrgId) {
      organizationId = ownerSelectedOrgId
      organizationRole = "org_admin"
    }
    return {
      user,
      isOwner,
      organizationId,
      organizationRole,
      forbidden: false,
      tenantNotFound: false,
    }
  }

  if (normalizedSubdomain === TRACK_PLATFORM_SUBDOMAIN) {
    return {
      user,
      isOwner,
      organizationId,
      organizationRole,
      forbidden: false,
      tenantNotFound: false,
    }
  }

  if (
    normalizedSubdomain &&
    !isReservedSubdomain(normalizedSubdomain) &&
    !subdomainOrganizationId
  ) {
    return {
      user,
      isOwner,
      organizationId: null,
      organizationRole: null,
      forbidden: false,
      tenantNotFound: true,
    }
  }

  if (isOwner) {
    const ownerSelectedOrgId = requestedOrgId ?? selectedOwnerOrgFromCookie
    if (ownerSelectedOrgId) {
      organizationId = ownerSelectedOrgId
      organizationRole = "org_admin"
    }
  }

  if (!isOwner && !organizationId) {
    return {
      user,
      isOwner,
      organizationId: null,
      organizationRole: null,
      forbidden: false,
      tenantNotFound: false,
    }
  }

  return {
    user,
    isOwner,
    organizationId,
    organizationRole,
    forbidden: false,
    tenantNotFound: false,
  }
}
