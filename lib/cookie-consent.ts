export const COOKIE_CONSENT_KEY = "pw-cookie-consent"

export type CookieConsent = "all" | "essential"

export function readCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null
  try {
    const value = window.localStorage.getItem(COOKIE_CONSENT_KEY)
    if (value === "all" || value === "essential") return value
  } catch {
    // ignore storage access errors
  }
  return null
}

export function writeCookieConsent(value: CookieConsent) {
  window.localStorage.setItem(COOKIE_CONSENT_KEY, value)
  window.dispatchEvent(new Event("pw-cookie-consent"))
}
