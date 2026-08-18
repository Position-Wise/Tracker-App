import { getDevAppOrigin } from "@/lib/dev-app-origin"
import { TRACK_PLATFORM_SUBDOMAIN } from "@/lib/reserved-subdomains"
import { parseTenantSlugFromHostHeader } from "@/lib/tenant-host"

export function sanitizeTrackPlatformPath(raw: string): string {
  const pathOnly = (raw.split("?")[0] ?? "").trim() || "/"
  if (!pathOnly.startsWith("/") || pathOnly.startsWith("//") || pathOnly.includes("://")) {
    return "/"
  }
  return pathOnly
}

export function splitHostAndPort(host: string) {
  const trimmed = host.trim().toLowerCase()
  const idx = trimmed.lastIndexOf(":")
  if (idx > 0 && /^\d+$/.test(trimmed.slice(idx + 1))) {
    return { hostname: trimmed.slice(0, idx), port: trimmed.slice(idx + 1) }
  }
  return { hostname: trimmed, port: null as string | null }
}

export function resolveRootHostname(hostname: string): string {
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

/** True when the current browser host is the reserved track platform subdomain. */
export function isOnTrackPlatformHost(hostHeader?: string | null): boolean {
  const host =
    hostHeader ?? (typeof window !== "undefined" ? window.location.host : null)
  if (!host) return false
  return parseTenantSlugFromHostHeader(host) === TRACK_PLATFORM_SUBDOMAIN
}

/** Absolute URL for track platform routes (e.g. track.localhost:3000/). Client-side. */
export function getTrackPlatformUrl(path = "/"): string {
  const requestedPath = sanitizeTrackPlatformPath(path)

  if (typeof window === "undefined") {
    return requestedPath
  }

  if (isOnTrackPlatformHost(window.location.host)) {
    return requestedPath
  }

  if (process.env.NODE_ENV === "development") {
    const devOrigin = getDevAppOrigin()
    const url = new URL(devOrigin)
    const rootHostname = url.hostname.includes("lvh.me") ? "lvh.me" : "localhost"
    const port = url.port || "3000"
    return `http://${TRACK_PLATFORM_SUBDOMAIN}.${rootHostname}:${port}${requestedPath}`
  }

  const { protocol, hostname, port } = window.location
  const rootHostname = resolveRootHostname(hostname.toLowerCase())
  const targetHost = `${TRACK_PLATFORM_SUBDOMAIN}.${rootHostname}${port ? `:${port}` : ""}`
  const scheme = protocol === "http:" || protocol === "https:" ? protocol : "https:"
  return `${scheme}//${targetHost}${requestedPath}`
}
