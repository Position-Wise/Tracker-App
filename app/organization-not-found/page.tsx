import Link from "next/link"

export default function OrganizationNotFoundPage() {
  return (
    <main className="min-h-screen bg-background text-foreground pt-24 pb-20 px-6">
      <section className="mx-auto max-w-xl rounded-xl border border-border bg-card p-8 text-center space-y-4">
        <h1 className="text-3xl font-semibold">Organization Not Found</h1>
        <p className="text-sm text-muted-foreground">
          This subdomain does not match any organization.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Go to home
        </Link>
      </section>
    </main>
  )
}
