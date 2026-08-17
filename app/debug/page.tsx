import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { noIndexRobots } from "@/lib/seo"
import DebugClient from "./debug-client"

export const metadata: Metadata = {
  robots: noIndexRobots,
}

export default function RLSTestPage() {
  if (process.env.NODE_ENV === "production") {
    notFound()
  }

  return <DebugClient />
}
