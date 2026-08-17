import type { Metadata } from "next"
import Link from "next/link"
import { BrandLogo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { noIndexRobots } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Thank you",
  description: "Check your email to confirm your Position Wise Advisory account.",
  robots: noIndexRobots,
}

export default function SignUpThanksPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-6 text-center">
        <BrandLogo className="mx-auto h-8 w-auto" />
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          Thank you
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Check your email to confirm.
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We sent a confirmation link. After you confirm, sign in and start
          tracking or request advisory access.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
