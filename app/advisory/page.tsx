import type { Metadata } from "next"
import { AdvisoryLanding } from "@/components/marketing/advisory-landing"
import { buildShareMetadata } from "@/lib/seo"

export const metadata: Metadata = buildShareMetadata({
  title: "Personalized Advisory",
  description:
    "Investment advice fitted to your goals, risk, and timeline — a framework you can act on, not a feed of generic tips.",
  path: "/advisory",
})

export default function AdvisoryPage() {
  return <AdvisoryLanding />
}
