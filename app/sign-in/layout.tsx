import type { Metadata } from "next"
import type { ReactNode } from "react"
import { buildShareMetadata } from "@/lib/seo"

export const metadata: Metadata = buildShareMetadata({
  title: "Sign in",
  description:
    "Sign in to Position Wise Advisory for personalized advisory access or Wise Track.",
  path: "/sign-in",
})

export default function SignInLayout({ children }: { children: ReactNode }) {
  return children
}
