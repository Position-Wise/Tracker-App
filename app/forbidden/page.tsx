import type { Metadata } from "next"
import Link from "next/link"
import { noIndexRobots } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Access restricted",
  description: "You do not belong to this organization.",
  robots: noIndexRobots,
}

export default function ForbiddenPage() {
  return (
    <main className="min-h-screen bg-background text-foreground pt-24 pb-20 px-6">
      <section className="mx-auto max-w-xl rounded-xl border border-border bg-card p-8 text-center space-y-4">
        <h1 className="text-3xl font-semibold">Access Restricted</h1>
        <p className="text-sm text-muted-foreground">
          You do not belong to this organization.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Go to your dashboard
        </Link>
      </section>
    </main>
  )
}
