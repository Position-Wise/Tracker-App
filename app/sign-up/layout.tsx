import type { Metadata } from "next"
import type { ReactNode } from "react"
import { buildShareMetadata } from "@/lib/seo"

export const metadata: Metadata = buildShareMetadata({
  title: "Create account",
  description:
    "Create a Position Wise Advisory account to start tracking for free or request personalized investment guidance.",
  path: "/sign-up",
})

export default function SignUpLayout({ children }: { children: ReactNode }) {
  return children
}
