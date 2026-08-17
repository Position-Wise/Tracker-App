import { getOrganizationJsonLd } from "@/lib/seo"

export function OrganizationJsonLd() {
  const jsonLd = getOrganizationJsonLd()

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
