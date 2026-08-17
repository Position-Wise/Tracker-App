export const AUTH_INTENT_COOKIE = "pw_auth_intent"

export const AUTH_NEXT_PATHS = [
  "/app",
  "/dashboard",
  "/waiting",
  "/owner",
  "/subscribe",
] as const

export type AuthNextPath = (typeof AUTH_NEXT_PATHS)[number]
export type AuthIntent = "track" | "advisory"

export function sanitizeAuthNext(raw: string | null | undefined): AuthNextPath | null {
  if (!raw) return null
  const path = raw.trim()
  return (AUTH_NEXT_PATHS as readonly string[]).includes(path)
    ? (path as AuthNextPath)
    : null
}

export function persistAuthIntent(intent: AuthIntent) {
  if (typeof document === "undefined") return

  const domainRaw = process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN?.trim()
  const parts = [
    `${AUTH_INTENT_COOKIE}=${intent}`,
    "path=/",
    "max-age=600",
    "samesite=lax",
  ]

  if (
    domainRaw &&
    domainRaw !== "localhost" &&
    domainRaw !== ".localhost"
  ) {
    const domain = domainRaw.startsWith(".") ? domainRaw : `.${domainRaw}`
    parts.push(`domain=${domain}`)
  }

  if (process.env.NODE_ENV === "production") {
    parts.push("secure")
  }

  document.cookie = parts.join("; ")
}

export function readAuthIntent(
  value: string | null | undefined
): AuthIntent | null {
  if (value === "track" || value === "advisory") return value
  return null
}
