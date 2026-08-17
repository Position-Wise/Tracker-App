import { getSiteUrl } from "@/lib/site"

function readPublic(name: string) {
  return process.env[name]?.trim() || ""
}

function contactHost() {
  const siteUrl = readPublic("NEXT_PUBLIC_SITE_URL")
  const rootDomain = readPublic("NEXT_PUBLIC_ROOT_DOMAIN").replace(/^\./, "")

  for (const raw of [siteUrl, rootDomain]) {
    if (!raw) continue
    try {
      const hostname = (
        raw.includes("://") ? new URL(raw).hostname : raw.split(":")[0]
      )
        .replace(/^www\./, "")
        .replace(/^track\./, "")
      if (
        hostname &&
        hostname !== "localhost" &&
        hostname !== "127.0.0.1" &&
        hostname !== "lvh.me" &&
        !hostname.endsWith(".localhost")
      ) {
        return hostname
      }
    } catch {
      // ignore malformed env
    }
  }

  return "positionwiseadvisory.com"
}

export function getCompanyContact() {
  const email = readPublic("NEXT_PUBLIC_CONTACT_EMAIL") || `hello@${contactHost()}`
  const phone = readPublic("NEXT_PUBLIC_CONTACT_PHONE")
  const streetAddress = readPublic("NEXT_PUBLIC_CONTACT_STREET")
  const locality = readPublic("NEXT_PUBLIC_CONTACT_CITY")
  const region = readPublic("NEXT_PUBLIC_CONTACT_REGION")
  const postalCode = readPublic("NEXT_PUBLIC_CONTACT_POSTAL")
  const country = readPublic("NEXT_PUBLIC_CONTACT_COUNTRY") || "India"

  const addressBlob = readPublic("NEXT_PUBLIC_CONTACT_ADDRESS")
  const blobLines = addressBlob
    .split("|")
    .map((line) => line.trim())
    .filter(Boolean)

  const addressLines = [
    streetAddress,
    [locality, region, postalCode].filter(Boolean).join(", "),
    ...(!streetAddress && !locality ? blobLines : []),
    country,
  ].filter(Boolean)

  return {
    legalName: "Position Wise Advisory",
    email,
    phone,
    streetAddress,
    locality,
    region,
    postalCode,
    country,
    addressLines,
    formattedAddress: addressLines.join(", "),
    url: getSiteUrl(),
  }
}
