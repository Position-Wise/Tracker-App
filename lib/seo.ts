import type { Metadata } from "next"
import { getCompanyContact } from "@/lib/company"
import { getSiteUrl, getTrackSiteUrl, toAbsoluteUrl } from "@/lib/site"

export const SITE_NAME = "Position Wise Advisory"
export const TRACK_NAME = "Wise Track"
export const SITE_TAGLINE =
  "See your money clearly. Grow it with advice that fits you."

export const SITE_DESCRIPTION =
  "Personalized investment guidance when you want a professional in your corner, and a free expense tracker for the money that moves every day."

export const TRACK_DESCRIPTION =
  "A free expense tracker for everyday money — categories, accounts, and a clear month view. Built by Position Wise Advisory."

export const SITE_KEYWORDS = [
  "Position Wise Advisory",
  "Wise Track",
  "personalized investment advice",
  "expense tracker",
  "personal finance",
  "market insights",
  "personalized investment advice",
]

export const noIndexRobots: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
}

type SharePage = {
  title: string
  description: string
  path?: string
  origin?: string
}

export function buildShareMetadata({
  title,
  description,
  path = "/",
  origin = getSiteUrl(),
}: SharePage): Metadata {
  const url = toAbsoluteUrl(path, origin)

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      locale: "en_IN",
      title,
      description,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  }
}

export function getDefaultMetadata(): Metadata {
  const siteUrl = getSiteUrl()
  const googleVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim()

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    keywords: SITE_KEYWORDS,
    authors: [{ name: SITE_NAME, url: siteUrl }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "finance",
    referrer: "origin-when-cross-origin",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    icons: {
      icon: [
        { url: "/icon", type: "image/png", sizes: "512x512" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      shortcut: "/icon",
      apple: [{ url: "/icon", type: "image/png", sizes: "512x512" }],
    },
    manifest: "/manifest.webmanifest",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: siteUrl,
      siteName: SITE_NAME,
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
    },
    ...(googleVerification
      ? { verification: { google: googleVerification } }
      : {}),
  }
}

export function getHomeShareMetadata(isTrack: boolean): Metadata {
  if (isTrack) {
    const title = `${TRACK_NAME} | Free expense tracker by ${SITE_NAME}`
    return {
      metadataBase: new URL(getTrackSiteUrl()),
      ...buildShareMetadata({
        title,
        description: TRACK_DESCRIPTION,
        origin: getTrackSiteUrl(),
      }),
      title: { absolute: title },
    }
  }

  const title = `${SITE_NAME} | Personalized investing and a free tracker`
  return {
    ...buildShareMetadata({
      title,
      description: SITE_DESCRIPTION,
    }),
    title: { absolute: title },
  }
}

export function getOrganizationJsonLd() {
  const siteUrl = getSiteUrl()
  const trackUrl = getTrackSiteUrl()
  const contact = getCompanyContact()

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: SITE_NAME,
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/icon`,
          width: 512,
          height: 512,
        },
        description: SITE_DESCRIPTION,
        email: contact.email,
        ...(contact.phone ? { telephone: contact.phone } : {}),
        address: {
          "@type": "PostalAddress",
          ...(contact.streetAddress
            ? { streetAddress: contact.streetAddress }
            : {}),
          ...(contact.locality ? { addressLocality: contact.locality } : {}),
          ...(contact.region ? { addressRegion: contact.region } : {}),
          ...(contact.postalCode ? { postalCode: contact.postalCode } : {}),
          addressCountry: "IN",
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: contact.email,
          ...(contact.phone ? { telephone: contact.phone } : {}),
          areaServed: "IN",
          availableLanguage: ["en", "hi"],
        },
        areaServed: "IN",
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "en-IN",
        publisher: { "@id": `${siteUrl}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${trackUrl}/#app`,
        name: TRACK_NAME,
        url: trackUrl,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "INR",
        },
        publisher: { "@id": `${siteUrl}/#organization` },
        description: TRACK_DESCRIPTION,
      },
    ],
  }
}
