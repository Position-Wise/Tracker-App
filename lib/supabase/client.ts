import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabaseCookieOptions, mergeAuthCookieWriteOptions } from "@/lib/auth-cookie-options"

function createBrowserSupabaseClient() {
  const cookieOptions = getSupabaseCookieOptions()

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...(cookieOptions ? { cookieOptions } : {}),
      cookies: {
        getAll() {
          if (typeof document === "undefined") return []
          return document.cookie
            .split(";")
            .map((part) => part.trim())
            .filter(Boolean)
            .map((part) => {
              const separator = part.indexOf("=")
              const name = separator === -1 ? part : part.slice(0, separator)
              const value = separator === -1 ? "" : part.slice(separator + 1)
              return { name, value: decodeURIComponent(value) }
            })
        },
        setAll(cookiesToSet) {
          if (typeof document === "undefined") return
          cookiesToSet.forEach(({ name, value, options }) => {
            const merged = mergeAuthCookieWriteOptions(options ?? {})
            const segments = [
              `${name}=${encodeURIComponent(value)}`,
              `path=${merged.path ?? "/"}`,
            ]
            if (merged.domain) segments.push(`domain=${merged.domain}`)
            if (typeof merged.maxAge === "number") segments.push(`max-age=${merged.maxAge}`)
            if (merged.sameSite) segments.push(`samesite=${merged.sameSite}`)
            if (merged.secure) segments.push("secure")
            document.cookie = segments.join("; ")
          })
        },
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    }
  )
}

let browserClient: SupabaseClient | undefined

export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") {
    throw new Error("Supabase browser client is only available in the browser.")
  }
  if (!browserClient) {
    browserClient = createBrowserSupabaseClient()
  }
  return browserClient
}

/** Lazy proxy so importing this module on the server does not touch `document`. */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseBrowserClient()
    const value = Reflect.get(client, prop, receiver)
    return typeof value === "function" ? value.bind(client) : value
  },
})
