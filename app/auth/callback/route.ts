import { type NextRequest, NextResponse } from "next/server"
import { coerceLocalDevRedirect } from "@/lib/dev-app-origin"
import { resolvePostLoginRedirectHref } from "@/lib/post-login-redirect"
import {
  copyResponseCookies,
  createSupabaseRouteHandlerClient,
} from "@/lib/supabase/route-handler"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  let response = NextResponse.redirect(new URL("/dashboard", request.url))
  const supabase = createSupabaseRouteHandlerClient(request, response)

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error("Auth exchange error:", error)
      const failed = NextResponse.redirect(
        new URL("/sign-in?error=auth_callback_failed", request.url)
      )
      copyResponseCookies(response, failed)
      return failed
    }

    const href = coerceLocalDevRedirect(await resolvePostLoginRedirectHref(supabase), request)
    const success = NextResponse.redirect(new URL(href, request.url))
    copyResponseCookies(response, success)
    return success
  }

  const signIn = NextResponse.redirect(new URL("/sign-in", request.url))
  copyResponseCookies(response, signIn)
  return signIn
}
