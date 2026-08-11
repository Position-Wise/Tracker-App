const PAAS_HOST_SUFFIXES = [
  ".vercel.app",
  ".netlify.app",
  ".railway.app",
  ".onrender.com",
  ".fly.dev",
]

function stripPort(host: string): string {
  if (host.startsWith("[")) {
    const end = host.indexOf("]")
    if (end !== -1) return host.slice(0, end + 1)
  }
  const colon = host.lastIndexOf(":")
  if (colon > 0 && host.slice(colon + 1).match(/^\d+$/)) {
    return host.slice(0, colon)
  }
  return host
}

export function isLikelyPaasHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  return PAAS_HOST_SUFFIXES.some((s) => h.endsWith(s))
}

/** True when host looks like local multi-tenant dev (localhost or lvh.me). */
export function isLocalDevHostname(hostname: string): boolean {
  const h = hostname.toLowerCase()
  if (h.includes("localhost") || h.includes("lvh.me")) return true
  if (h === "127.0.0.1" || h === "::1" || h === "[::1]") return true
  if (process.env.NODE_ENV === "development") {
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true
  }
  return false
}

/**
 * When set (e.g. example.com), only hosts under *.example.com yield a tenant slug.
 * Safer on Vercel preview URLs than heuristics alone.
 */
function configuredRootDomain(): string | null {
  const raw = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim().toLowerCase()
  if (!raw) return null
  return raw.replace(/^\./, "")
}

/**
 * First label tenant slug from Host, or null for apex / www / non-tenant hosts.
 */
export function parseTenantSlugFromHostHeader(hostHeader: string | null): string | null {
  if (!hostHeader) return null
  const full = hostHeader.trim()
  if (!full) return null

  const hostname = stripPort(full).toLowerCase()
  if (isLikelyPaasHost(hostname)) return null
  if (isLocalDevHostname(hostname)) {
    const parts = hostname.split(".").filter(Boolean)
    if (parts.length >= 2) {
      const last = parts[parts.length - 1]
      const secondLast = parts[parts.length - 2]
      if (last === "localhost" && secondLast && secondLast !== "localhost") {
        return secondLast
      }
      if (last === "me" && secondLast === "lvh" && parts.length >= 3) {
        const candidate = parts[parts.length - 3]
        return candidate && candidate !== "www" ? candidate : null
      }
    }
    return null
  }

  const root = configuredRootDomain()
  let slug: string | null = null

  if (root) {
    if (hostname === root || hostname === `www.${root}`) {
      slug = null
    } else if (hostname.endsWith(`.${root}`)) {
      const prefix = hostname.slice(0, hostname.length - root.length - 1)
      if (!prefix || prefix === "www") slug = null
      else if (prefix.includes(".")) slug = null
      else slug = prefix
    }
  } else {
    const parts = hostname.split(".")
    if (parts.length <= 2) slug = null
    else {
      const first = parts[0]
      slug = first && first !== "www" ? first : null
    }
  }

  return slug ? slug.toLowerCase() : null
}

/** Redirect unknown tenant hosts to apex origin (avoids / loops on the bad host). */
export function buildApexRedirectUrl(request: Request): URL {
  const host = request.headers.get("host") ?? ""
  const forwarded = request.headers.get("x-forwarded-proto")
  const protoRaw = forwarded?.split(",")[0]?.trim() || "https"
  const proto = protoRaw === "http" || protoRaw === "https" ? protoRaw : "https"

  const fullHost = host.trim() || "localhost"
  const hostname = stripPort(fullHost).toLowerCase()
  const portSuffix = fullHost.includes(":") && !hostname.includes("]") ? fullHost.slice(fullHost.indexOf(":")) : ""

  const parts = hostname.split(".")
  if (parts.length <= 2) {
    return new URL("/", `${proto}://${fullHost}`)
  }

  const apexHostname = parts.slice(1).join(".")
  return new URL("/", `${proto}://${apexHostname}${portSuffix}`)
}
