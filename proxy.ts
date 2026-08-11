import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseCookieOptions, mergeAuthCookieWriteOptions } from "@/lib/auth-cookie-options"
import {
  OWNER_PLATFORM_SUBDOMAIN,
  TRACK_PLATFORM_SUBDOMAIN,
} from "@/lib/reserved-subdomains"
import { parseTenantSlugFromHostHeader } from "@/lib/tenant-host"

const OWNER_HOST_PUBLIC_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/auth/",
  "/forbidden",
] as const

const TRACK_HOST_PUBLIC_PREFIXES = [
  "/",
  "/sign-in",
  "/sign-up",
  "/auth/",
  "/forbidden",
] as const

function isOwnerHostPublicPath(pathname: string) {
  return OWNER_HOST_PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix)
  )
}

function isTrackHostPublicPath(pathname: string) {
  return TRACK_HOST_PUBLIC_PREFIXES.some((prefix) => {
    if (prefix === "/") return pathname === "/"
    return pathname === prefix || pathname.startsWith(prefix)
  })
}

function setProductContextHeaders(
  requestHeaders: Headers,
  tenantSlug: string | null
) {
  if (tenantSlug === TRACK_PLATFORM_SUBDOMAIN) {
    requestHeaders.set("x-product", "track")
  } else if (tenantSlug === OWNER_PLATFORM_SUBDOMAIN) {
    requestHeaders.set("x-product", "owner")
  } else if (tenantSlug) {
    requestHeaders.set("x-product", "tenant")
  } else {
    requestHeaders.delete("x-product")
  }
}

function toRpcBoolean(value: unknown) {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (normalized === "true") return true
    if (normalized === "false") return false
  }
  return false
}

const AUTH_REQUIRED_PREFIXES = [
  "/dashboard",
  "/admin",
  "/admin-select",
  "/owner",
  "/app",
  "/profile",
  "/tips",
  "/subscribe",
  "/wait-approval",
  "/waiting",
  "/invite",
  "/broadcast",
  "/auth/callback",
] as const

function shouldRefreshAuth(pathname: string) {
  return AUTH_REQUIRED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const host = request.headers.get("host")
  const tenantSlug = parseTenantSlugFromHostHeader(host)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-pathname", `${request.nextUrl.pathname}${request.nextUrl.search}`)
  if (tenantSlug) {
    requestHeaders.set("x-subdomain", tenantSlug)
  } else {
    requestHeaders.delete("x-subdomain")
  }
  setProductContextHeaders(requestHeaders, tenantSlug)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
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

  const needsAuthRefresh =
    shouldRefreshAuth(pathname) ||
    tenantSlug === OWNER_PLATFORM_SUBDOMAIN ||
    tenantSlug === TRACK_PLATFORM_SUBDOMAIN

  if (needsAuthRefresh) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (tenantSlug === OWNER_PLATFORM_SUBDOMAIN && !isOwnerHostPublicPath(pathname)) {
      if (!user) {
        const signIn = new URL("/sign-in", request.url)
        if (pathname !== "/") {
          signIn.searchParams.set("next", `${pathname}${request.nextUrl.search}`)
        }
        return NextResponse.redirect(signIn)
      }

      const { data: isOwnerData, error: isOwnerError } = await supabase.rpc("is_owner")
      if (isOwnerError || !toRpcBoolean(isOwnerData)) {
        return NextResponse.redirect(new URL("/forbidden", request.url))
      }
    }

    if (tenantSlug === TRACK_PLATFORM_SUBDOMAIN && !isTrackHostPublicPath(pathname)) {
      if (!user) {
        const signIn = new URL("/sign-in", request.url)
        if (pathname !== "/") {
          signIn.searchParams.set("next", `${pathname}${request.nextUrl.search}`)
        }
        return NextResponse.redirect(signIn)
      }
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
