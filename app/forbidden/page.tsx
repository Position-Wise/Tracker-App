import type { Metadata } from "next"
import Link from "next/link"
import { noIndexRobots } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Access restricted",
  description: "You do not have access to this page.",
  robots: noIndexRobots,
}

export default function ForbiddenPage() {
  return (
    <main className="min-h-screen bg-background text-foreground px-6 pt-24 pb-20">
      <section className="mx-auto max-w-xl space-y-4 rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-3xl font-semibold">Access Restricted</h1>
        <p className="text-sm text-muted-foreground">
          You do not have access to this page.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Go home
        </Link>
      </section>
    </main>
  )
}
