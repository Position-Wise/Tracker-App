import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseCookieOptions, mergeAuthCookieWriteOptions } from "@/lib/auth-cookie-options"
import { parseTenantSlugFromHostHeader } from "@/lib/tenant-host"

const AUTH_REQUIRED_PREFIXES = ["/app", "/profile", "/auth/callback"] as const

function shouldRefreshAuth(pathname: string) {
  return AUTH_REQUIRED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

/** Old `track.` host bookmarks land on the same path at the site root. */
function redirectLegacyTrackHost(request: NextRequest): NextResponse | null {
  const host = request.headers.get("host")
  if (parseTenantSlugFromHostHeader(host) !== "track") return null

  const fullHost = (host ?? "").trim()
  const colon = fullHost.lastIndexOf(":")
  const hostname = (colon > 0 ? fullHost.slice(0, colon) : fullHost).toLowerCase()
  const port = colon > 0 ? fullHost.slice(colon) : ""
  const apex = hostname.startsWith("track.") ? hostname.slice("track.".length) : hostname
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
  const proto =
    forwarded === "http" || forwarded === "https"
      ? forwarded
      : request.nextUrl.protocol.replace(":", "")

  const destination = new URL(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
    `${proto}://${apex}${port}`
  )
  return NextResponse.redirect(destination)
}

export async function proxy(request: NextRequest) {
  const legacyRedirect = redirectLegacyTrackHost(request)
  if (legacyRedirect) return legacyRedirect

  const pathname = request.nextUrl.pathname
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-pathname", `${pathname}${request.nextUrl.search}`)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || !shouldRefreshAuth(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  const cookieOptions = getSupabaseCookieOptions()
  let response = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    ...(cookieOptions ? { cookieOptions } : {}),
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        response = NextResponse.next({ request: { headers: requestHeaders } })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, mergeAuthCookieWriteOptions(options ?? {}))
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && (pathname === "/app" || pathname.startsWith("/app/") || pathname === "/profile" || pathname.startsWith("/profile/"))) {
    const signIn = new URL("/sign-in", request.url)
    signIn.searchParams.set("next", `${pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(signIn)
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
