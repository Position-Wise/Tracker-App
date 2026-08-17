import { headers } from "next/headers"
import { createShareImage } from "@/lib/og/share-card"
import { SITE_NAME, SITE_TAGLINE, TRACK_NAME } from "@/lib/seo"

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpenGraphImage() {
  const product = (await headers()).get("x-product")

  if (product === "track") {
    return createShareImage({
      kicker: TRACK_NAME,
      title: "Know where your money goes.",
      subtitle: `A free expense tracker from ${SITE_NAME}.`,
    })
  }

  return createShareImage({
    kicker: SITE_NAME,
    title: SITE_TAGLINE,
    subtitle: "Personalized investing and a free expense tracker.",
  })
}
