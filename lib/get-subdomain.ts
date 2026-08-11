import { headers } from "next/headers"
import { parseTenantSlugFromHostHeader } from "@/lib/tenant-host"

export async function getSubdomain() {
  const h = await headers()
  const fromProxy = h.get("x-subdomain")?.trim().toLowerCase() ?? ""
  if (fromProxy) {
    return fromProxy
  }

  const host = h.get("host")
  const fromHost = parseTenantSlugFromHostHeader(host)?.trim().toLowerCase() ?? ""
  return fromHost || null
}
