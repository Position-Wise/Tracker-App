import { sanitizeAuthNext } from "@/lib/auth-intent"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

type PostLoginOptions = {
  next?: string | null
  intent?: string | null
}

export async function resolvePostLoginRedirectHref(
  supabase: SupabaseServerClient,
  options?: PostLoginOptions
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return "/sign-in"
  }

  return sanitizeAuthNext(options?.next) ?? "/app"
}
