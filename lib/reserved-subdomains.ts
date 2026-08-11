import { parseTenantSlugFromHostHeader } from "@/lib/tenant-host"

/** Subdomains reserved for platform routing — never resolve to a tenant organization. */
export const RESERVED_SUBDOMAINS = new Set([
  "owner",
  "track",
  "www",
  "admin",
  "api",
  "app",
  "mail",
  "ftp",
])

export const OWNER_PLATFORM_SUBDOMAIN = "owner"
export const TRACK_PLATFORM_SUBDOMAIN = "track"

export function isReservedSubdomain(slug: string | null | undefined): boolean {
  const normalized = (slug ?? "").trim().toLowerCase()
  if (!normalized) return false
  return RESERVED_SUBDOMAINS.has(normalized)
}

export function isOwnerPlatformHost(hostHeader: string | null): boolean {
  const slug = parseTenantSlugFromHostHeader(hostHeader)
  return slug === OWNER_PLATFORM_SUBDOMAIN
}

export function isTrackPlatformHost(hostHeader: string | null): boolean {
  const slug = parseTenantSlugFromHostHeader(hostHeader)
  return slug === TRACK_PLATFORM_SUBDOMAIN
}
