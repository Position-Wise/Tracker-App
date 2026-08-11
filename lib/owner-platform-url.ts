import { getDevAppOrigin } from "@/lib/dev-app-origin"
import { OWNER_PLATFORM_SUBDOMAIN } from "@/lib/reserved-subdomains"
import { parseTenantSlugFromHostHeader } from "@/lib/tenant-host"

function sanitizeInternalPath(raw: string): string {
  const pathOnly = (raw.split("?")[0] ?? "").trim() || "/owner"
  if (!pathOnly.startsWith("/") || pathOnly.startsWith("//") || pathOnly.includes("://")) {
    return "/owner"
  }
  return pathOnly
}

function resolveRootHostname(hostname: string): string {
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

/** True when the current browser host is the reserved owner platform subdomain. */
export function isOnOwnerPlatformHost(hostHeader?: string | null): boolean {
  const host =
    hostHeader ?? (typeof window !== "undefined" ? window.location.host : null)
  if (!host) return false
  return parseTenantSlugFromHostHeader(host) === OWNER_PLATFORM_SUBDOMAIN
}

/** Absolute URL for owner platform routes (e.g. owner.localhost:3000/owner). */
export function getOwnerPlatformUrl(path = "/owner"): string {
  const requestedPath = sanitizeInternalPath(path)

  if (typeof window === "undefined") {
    return requestedPath
  }

  if (isOnOwnerPlatformHost(window.location.host)) {
    return requestedPath
  }

  if (process.env.NODE_ENV === "development") {
    const devOrigin = getDevAppOrigin()
    const url = new URL(devOrigin)
    const rootHostname = url.hostname.includes("lvh.me") ? "lvh.me" : "localhost"
    const port = url.port || "3000"
    return `http://${OWNER_PLATFORM_SUBDOMAIN}.${rootHostname}:${port}${requestedPath}`
  }

  const { protocol, hostname, port } = window.location
  const rootHostname = resolveRootHostname(hostname.toLowerCase())
  const targetHost = `${OWNER_PLATFORM_SUBDOMAIN}.${rootHostname}${port ? `:${port}` : ""}`
  const scheme = protocol === "http:" || protocol === "https:" ? protocol : "https:"
  return `${scheme}//${targetHost}${requestedPath}`
}
