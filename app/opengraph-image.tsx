import { createShareImage } from "@/lib/og/share-card"
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo"

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return createShareImage({
    kicker: SITE_NAME,
    title: "Know where your money goes.",
    subtitle: "A free expense tracker for everyday money.",
  })
}
