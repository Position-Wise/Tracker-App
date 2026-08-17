import { createShareImage } from "@/lib/og/share-card"
import { SITE_NAME } from "@/lib/seo"

export const alt = `Market insights from ${SITE_NAME}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function InsightsOpenGraphImage() {
  return createShareImage({
    kicker: "Insights",
    title: "Structured market insights, not noise.",
    subtitle: "Regimes, risk, and capital positioning — mapped to a clear hypothesis.",
  })
}
