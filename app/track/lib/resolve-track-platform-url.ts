import { headers } from "next/headers"
import { parseDevOrigin } from "@/lib/dev-app-origin"
import { TRACK_PLATFORM_SUBDOMAIN } from "@/lib/reserved-subdomains"
import { isLocalDevHostname, parseTenantSlugFromHostHeader } from "@/lib/tenant-host"
import {
  resolveRootHostname,
  sanitizeTrackPlatformPath,
  splitHostAndPort,
} from "@track/lib/track-platform-url"

/**
 * Server-side absolute (or relative if already on track) URL for the track platform host.
 * Used by post-login redirects for users without an organization membership.
 */
export async function resolveTrackPlatformRedirectUrl(path = "/"): Promise<string> {
  const requestedPath = sanitizeTrackPlatformPath(path)
  const h = await headers()
  const host = h.get("host")
  if (!host) return requestedPath

  if (parseTenantSlugFromHostHeader(host) === TRACK_PLATFORM_SUBDOMAIN) {
    return requestedPath
  }

  if (process.env.NODE_ENV === "development") {
    const { hostname: devHost, port: devPort } = parseDevOrigin()
    const rootHostname = devHost.includes("lvh.me") ? "lvh.me" : "localhost"
    return `http://${TRACK_PLATFORM_SUBDOMAIN}.${rootHostname}:${devPort}${requestedPath}`
  }

  const { hostname, port } = splitHostAndPort(host)
  const local = isLocalDevHostname(hostname)
  const protocol = local ? "http" : "https"
  const rootHostname = resolveRootHostname(hostname)
  const targetHost = `${TRACK_PLATFORM_SUBDOMAIN}.${rootHostname}${port ? `:${port}` : ""}`
  return `${protocol}://${targetHost}${requestedPath}`
}
