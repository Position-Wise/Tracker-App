import type { Metadata } from "next"
import type { ReactNode } from "react"
import { buildShareMetadata } from "@/lib/seo"

export const metadata: Metadata = buildShareMetadata({
  title: "Create account",
  description:
    "Create a Wise Track account and start tracking for free.",
  path: "/sign-up",
})

export default function SignUpLayout({ children }: { children: ReactNode }) {
  return children
}
