type SupabaseCookieOptions = {
  domain?: string
  path?: string
  sameSite?: "lax" | "strict" | "none"
  secure?: boolean
}

function normalizeCookieDomain(raw: string): string {
  return raw.startsWith(".") ? raw : `.${raw}`
}

/**
 * Set to share Supabase session across subdomains, e.g.
 * NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=.yourdomain.com
 *
 * Do not use `.localhost` — browsers refuse or mishandle `Domain=.localhost`,
 * so the PKCE code-verifier cookie never sticks and Google sign-in fails.
 * For local multi-tenant sessions, use `lvh.me` (e.g. `.lvh.me`) instead.
 */
export function getAuthCookieDomain(): string | undefined {
  const raw =
    process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN?.trim() ||
    process.env.AUTH_COOKIE_DOMAIN?.trim()
  if (!raw) return undefined

  const domain = normalizeCookieDomain(raw)
  // Host-only cookies on localhost / *.localhost; Domain=.localhost breaks PKCE.
  if (domain === ".localhost" || domain === "localhost") {
    return undefined
  }
  return domain
}

/** Options passed into @supabase/ssr createServerClient / createBrowserClient `cookieOptions`. */
export function getSupabaseCookieOptions(): SupabaseCookieOptions | undefined {
  const domain = getAuthCookieDomain()
  if (!domain) return undefined
  return {
    domain,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  }
}

export function mergeAuthCookieWriteOptions<const T extends Record<string, unknown>>(options: T): T {
  const domain = getAuthCookieDomain()
  if (!domain) return options
  const secure =
    typeof options.secure === "boolean"
      ? options.secure
      : process.env.NODE_ENV === "production"
  return {
    ...options,
    domain,
    secure,
  }
}
