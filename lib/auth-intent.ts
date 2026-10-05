export const AUTH_INTENT_COOKIE = "pw_auth_intent"

export const AUTH_NEXT_PATHS = ["/app", "/profile"] as const

export type AuthNextPath = (typeof AUTH_NEXT_PATHS)[number]

export function sanitizeAuthNext(raw: string | null | undefined): AuthNextPath | null {
  if (!raw) return null
  const path = raw.trim()
  return (AUTH_NEXT_PATHS as readonly string[]).includes(path)
    ? (path as AuthNextPath)
    : null
}
