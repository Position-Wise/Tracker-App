const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "lvh.me"])

function stripProtocol(value: string) {
  return value.replace(/^https?:\/\//i, "").replace(/\/$/, "")
}

export function getRootDomain() {
  const configured = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim().toLowerCase().replace(/^\./, "")
  if (configured) return configured

  const production =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (production) {
    return stripProtocol(production).replace(/^www\./, "")
  }

  return "localhost:3000"
}

export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "")
  if (explicit) return explicit

  const domain = getRootDomain()
  const hostname = domain.split(":")[0] ?? domain
  if (LOCAL_HOSTS.has(hostname) || hostname.endsWith(".localhost")) {
    return `http://${domain}`
  }

  return `https://${domain}`
}

export function getTrackSiteUrl() {
  const site = new URL(getSiteUrl())
  const hostname = site.hostname
  const port = site.port ? `:${site.port}` : ""

  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return `${site.protocol}//track.localhost${port}`
  }
  if (hostname === "lvh.me" || hostname.endsWith(".lvh.me")) {
    return `${site.protocol}//track.lvh.me${port}`
  }

  return `${site.protocol}//track.${hostname}${port}`
}

export function toAbsoluteUrl(path = "/", origin = getSiteUrl()) {
  const normalized = path.startsWith("/") ? path : `/${path}`
  return new URL(normalized, `${origin.replace(/\/$/, "")}/`).toString()
}
