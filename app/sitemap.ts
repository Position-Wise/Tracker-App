import type { MetadataRoute } from "next"
import { getSiteUrl, getTrackSiteUrl } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl()
  const trackUrl = getTrackSiteUrl()
  const lastModified = new Date()

  const apexPages: Array<{
    path: string
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
    priority: number
  }> = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/insights", changeFrequency: "weekly", priority: 0.8 },
    { path: "/advisory", changeFrequency: "monthly", priority: 0.8 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.4 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.4 },
    { path: "/sign-up", changeFrequency: "monthly", priority: 0.6 },
    { path: "/sign-in", changeFrequency: "yearly", priority: 0.3 },
  ]

  const trackPages: Array<{
    path: string
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
    priority: number
  }> = [
    { path: "/", changeFrequency: "weekly", priority: 0.9 },
    { path: "/sign-up", changeFrequency: "monthly", priority: 0.5 },
    { path: "/sign-in", changeFrequency: "yearly", priority: 0.2 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  ]

  return [
    ...apexPages.map((page) => ({
      url: `${siteUrl}${page.path === "/" ? "" : page.path}`,
      lastModified,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...trackPages.map((page) => ({
      url: `${trackUrl}${page.path === "/" ? "" : page.path}`,
      lastModified,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
  ]
}
