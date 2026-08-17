import { createShareImage } from "@/lib/og/share-card"
import { SITE_NAME } from "@/lib/seo"

export const alt = `Personalized advisory from ${SITE_NAME}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function AdvisoryOpenGraphImage() {
  return createShareImage({
    kicker: "Advisory",
    title: "Advice built around you, not the last headline.",
    subtitle: "A framework for risk, timing, and capital — fitted to your life.",
  })
}
