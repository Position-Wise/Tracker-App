import { NextResponse } from "next/server"
import { resolvePostLoginRedirectHref } from "@/lib/post-login-redirect"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { coerceLocalDevRedirect } from "@/lib/dev-app-origin"

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient()
  const url = coerceLocalDevRedirect(await resolvePostLoginRedirectHref(supabase), request)
  return NextResponse.json({ url })
}
