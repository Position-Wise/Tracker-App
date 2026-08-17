import { sanitizeAuthNext } from "@/lib/auth-intent"
import { TRACK_PLATFORM_SUBDOMAIN } from "@/lib/reserved-subdomains"
import { isLocalDevHostname, parseTenantSlugFromHostHeader } from "@/lib/tenant-host"

const DEFAULT_DEV_PORT = "3000"

/** Canonical local origin for OAuth callbacks and tenant redirects in development. */
export function getDevAppOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_DEV_APP_ORIGIN?.trim()
  if (configured) return configured.replace(/\/$/, "")

  if (typeof window !== "undefined") {
    const port = window.location.port || DEFAULT_DEV_PORT
    return `http://localhost:${port}`
  }

  const port = process.env.PORT?.trim() || DEFAULT_DEV_PORT
  return `http://localhost:${port}`
}

export function getOAuthCallbackUrl(next?: string | null): string {
  if (typeof window === "undefined") return "/auth/callback"

  const origin = window.location.origin

  // OAuth must return to the same origin that started the flow, or PKCE cookies won't match.
  const callbackOrigin =
    process.env.NODE_ENV === "development" &&
    !isLocalDevHostname(window.location.hostname)
      ? getDevAppOrigin()
      : origin

  const safeNext =
    sanitizeAuthNext(next) ??
    (parseTenantSlugFromHostHeader(window.location.host) === TRACK_PLATFORM_SUBDOMAIN
      ? "/app"
      : null)
  const callback = `${callbackOrigin}/auth/callback`
  if (!safeNext) return callback
  return `${callback}?next=${encodeURIComponent(safeNext)}`
}

export function parseDevOrigin(): { hostname: string; port: string } {
  const origin = getDevAppOrigin()
  const url = new URL(origin)
  return {
    hostname: url.hostname,
    port: url.port || DEFAULT_DEV_PORT,
  }
}

/** If a dev redirect would leave localhost, keep path on the current request origin. */
export function coerceLocalDevRedirect(href: string, request: Request): string {
  if (process.env.NODE_ENV !== "development") return href
  if (!href.startsWith("http://") && !href.startsWith("https://")) return href

  try {
    const target = new URL(href)
    if (isLocalDevHostname(target.hostname)) return href
    return new URL(target.pathname + target.search, request.url).toString()
  } catch {
    return href
  }
}
