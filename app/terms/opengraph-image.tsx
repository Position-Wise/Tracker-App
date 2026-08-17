import { createShareImage } from "@/lib/og/share-card"
import { SITE_NAME } from "@/lib/seo"

export const alt = `Terms of use — ${SITE_NAME}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function TermsOpenGraphImage() {
  return createShareImage({
    kicker: "Terms",
    title: "The rules for using Position Wise.",
    subtitle: "Wise Track, advisory access, and how we work together.",
  })
}
