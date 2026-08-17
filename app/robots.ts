import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/admin-select",
          "/admin-select/",
          "/owner",
          "/owner/",
          "/dashboard",
          "/dashboard/",
          "/app",
          "/app/",
          "/profile",
          "/profile/",
          "/tips",
          "/tips/",
          "/subscribe",
          "/subscribe/",
          "/waiting",
          "/wait-approval",
          "/forbidden",
          "/debug",
          "/broadcast",
          "/broadcast/",
          "/invite",
          "/invite/",
          "/inquiries",
          "/inquiries/",
          "/organization-not-found",
          "/api/",
          "/auth/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
