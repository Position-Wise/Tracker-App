import { createShareImage } from "@/lib/og/share-card"
import { SITE_NAME } from "@/lib/seo"

export const alt = `Privacy policy — ${SITE_NAME}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function PrivacyOpenGraphImage() {
  return createShareImage({
    kicker: "Privacy",
    title: "How we handle your data.",
    subtitle: "Account, tracker, and advisory information — kept for the job it serves.",
  })
}
