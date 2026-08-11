import { notFound } from "next/navigation"
import DebugClient from "./debug-client"

export default function RLSTestPage() {
  if (process.env.NODE_ENV === "production") {
    notFound()
  }

  return <DebugClient />
}
