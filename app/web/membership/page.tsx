import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { buildShareMetadata } from "@/lib/seo"

export const metadata: Metadata = buildShareMetadata({
  title: "Membership",
  description:
    "Request personalized advisory access from Position Wise Advisory.",
  path: "/advisory",
})

export default function MembershipPage() {
  redirect("/advisory")
}
