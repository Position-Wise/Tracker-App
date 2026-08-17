import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSupabaseCookieOptions, mergeAuthCookieWriteOptions } from "@/lib/auth-cookie-options"

export type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  const cookieOptions = getSupabaseCookieOptions()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...(cookieOptions ? { cookieOptions } : {}),
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, mergeAuthCookieWriteOptions(options ?? {}))
            )
          } catch {
            // Server Components can read cookies but cannot mutate them.
            // Route Handlers and Server Actions will still apply these writes.
          }
        },
      },
    }
  )
}
