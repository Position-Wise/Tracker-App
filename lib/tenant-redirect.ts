import { headers } from "next/headers"
import type { CurrentUserAccess } from "@/lib/current-user-access"
import { parseDevOrigin } from "@/lib/dev-app-origin"
import { createSupabaseServerClient, type SupabaseServerClient } from "@/lib/supabase/server"
import {
  isReservedSubdomain,
  OWNER_PLATFORM_SUBDOMAIN,
} from "@/lib/reserved-subdomains"
import { isLocalDevHostname, parseTenantSlugFromHostHeader } from "@/lib/tenant-host"

const normalize = (s?: string | null) => (s || "").toLowerCase().trim()

export type ResolveTenantRedirectOptions = {
  /** Overrides the x-pathname header (e.g. OAuth callback must not reuse /auth/callback). */
  path?: string
  /** Use the caller's client (e.g. auth callback) so org lookup runs with the new session. */
  supabase?: SupabaseServerClient
  /**
   * When true, allow redirecting from reserved product hosts (e.g. track → tenant after login).
   * Owner host is never redirected away.
   */
  allowFromReservedHost?: boolean
}

function sanitizeInternalPath(raw: string): string {
  const pathOnly = (raw.split("?")[0] ?? "").trim() || "/dashboard"
  if (!pathOnly.startsWith("/") || pathOnly.startsWith("//") || pathOnly.includes("://")) {
    return "/dashboard"
  }
  return pathOnly
}

function splitHostAndPort(host: string) {
  const trimmed = host.trim().toLowerCase()
  const idx = trimmed.lastIndexOf(":")
  if (idx > 0 && /^\d+$/.test(trimmed.slice(idx + 1))) {
    return { hostname: trimmed.slice(0, idx), port: trimmed.slice(idx + 1) }
  }
  return { hostname: trimmed, port: null as string | null }
}

function resolveRootHostname(hostname: string) {
  if (process.env.NODE_ENV === "development") {
    if (hostname.includes("lvh.me")) return "lvh.me"
    return "localhost"
  }
  if (hostname.includes("localhost")) return "localhost"
  if (hostname.endsWith(".lvh.me")) return "lvh.me"
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim().toLowerCase().replace(/^\./, "")
  if (rootDomain) return rootDomain
  const parts = hostname.split(".")
  if (parts.length <= 2) return hostname
  return parts.slice(1).join(".")
}

export async function resolveTenantRedirectUrl(
  access: CurrentUserAccess,
  options?: ResolveTenantRedirectOptions
): Promise<string | null> {
  if (!access.user || !access.organizationId || access.forbidden || access.tenantNotFound) {
    return null
  }

  const h = await headers()
  const host = h.get("host")
  if (!host) return null

  const currentSlug = parseTenantSlugFromHostHeader(host)
  if (currentSlug === OWNER_PLATFORM_SUBDOMAIN) {
    return null
  }
  if (isReservedSubdomain(currentSlug) && !options?.allowFromReservedHost) {
    return null
  }

  const supabase = options?.supabase ?? (await createSupabaseServerClient())
  const { data: organization } = await supabase
    .from("organizations")
    .select("subdomain")
    .eq("id", access.organizationId)
    .maybeSingle()

  const targetSubdomain = normalize(organization?.subdomain)
  if (
    !targetSubdomain ||
    isReservedSubdomain(targetSubdomain) ||
    normalize(currentSlug) === normalize(targetSubdomain)
  ) {
    return null
  }

  const requestedPath = sanitizeInternalPath(
    options?.path ?? h.get("x-pathname") ?? "/dashboard"
  )

  if (process.env.NODE_ENV === "development") {
    const { hostname: devHost, port: devPort } = parseDevOrigin()
    const rootHostname = devHost.includes("lvh.me") ? "lvh.me" : "localhost"
    const targetHost = `${targetSubdomain}.${rootHostname}:${devPort}`
    return `http://${targetHost}${requestedPath}`
  }

  const { hostname, port } = splitHostAndPort(host)
  const local = isLocalDevHostname(hostname)
  const protocol = local ? "http" : "https"
  const rootHostname = resolveRootHostname(hostname)
  const targetHost = `${targetSubdomain}.${rootHostname}${port ? `:${port}` : ""}`
  return `${protocol}://${targetHost}${requestedPath}`
}
