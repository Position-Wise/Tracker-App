type RateLimitEntry = {
  count: number
  resetAt: number
}

const buckets = new Map<string, RateLimitEntry>()

export function checkRateLimit(
  key: string,
  options?: { windowMs?: number; maxRequests?: number }
): { allowed: boolean; retryAfterSeconds: number } {
  const windowMs = options?.windowMs ?? 60_000
  const maxRequests = options?.maxRequests ?? 60
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }

  existing.count += 1
  buckets.set(key, existing)
  return { allowed: true, retryAfterSeconds: 0 }
}
