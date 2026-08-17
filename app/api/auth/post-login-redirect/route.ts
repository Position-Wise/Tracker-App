import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { AUTH_INTENT_COOKIE } from "@/lib/auth-intent"
import { coerceLocalDevRedirect } from "@/lib/dev-app-origin"
import { resolvePostLoginRedirectHref } from "@/lib/post-login-redirect"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient()
  const requestUrl = new URL(request.url)
  const cookieStore = await cookies()
  const url = coerceLocalDevRedirect(
    await resolvePostLoginRedirectHref(supabase, {
      next: requestUrl.searchParams.get("next"),
      intent: cookieStore.get(AUTH_INTENT_COOKIE)?.value ?? null,
    }),
    request
  )
  return NextResponse.json({ url })
}
