import Link from "next/link"
import { ArrowRight, Check, LineChart } from "lucide-react"
import { BrandLogo } from "@/components/brand/logo"
import { AdvisoryPreview } from "@web/components/landing-previews"
import { SiteFooter } from "@web/components/site-footer"
import { Button } from "@/components/ui/button"

const points = [
  "Guidance fitted to your goals, risk, and timeline",
  "A framework you can act on — not a feed of generic tips",
  "You stay in control of your capital",
  "Request access when you want a professional in your corner",
] as const

const steps = [
  {
    title: "Share your posture",
    body: "What you are funding, how long you can stay invested, and the risk you can live with.",
  },
  {
    title: "Receive a framework",
    body: "A clear way to think about size, timing, and what is off-limits for you.",
  },
  {
    title: "Review with context",
    body: "As markets move, you get insight mapped to that framework — not a new story every week.",
  },
] as const

export function AdvisoryLanding() {
  return (
    <>
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.93_0.02_250)_0%,transparent_55%),linear-gradient(180deg,oklch(0.98_0.01_250)_0%,oklch(0.95_0.02_250)_100%)]"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-16 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:pt-24">
        <div>
          <BrandLogo className="h-8 w-auto" priority />
          <p className="mt-6 flex items-center gap-2 text-sm font-medium text-primary">
            <LineChart className="h-4 w-4" />
            Personalized advisory
          </p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Advice built around you, not the last headline.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
            Position Wise exists for people who want a framework, not noise. We
            look at what you are funding, what risk you can carry, and how to
            size decisions so you stay in control.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-muted-foreground">
            {points.map((point) => (
              <li key={point} className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/sign-up">
                Request access
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        </div>

        <AdvisoryPreview className="shadow-xl" />
      </div>

      <section className="relative border-t border-border/70 bg-background px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            How advisory works
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            A working relationship, not a tip dump.
          </h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-semibold tabular-nums text-accent">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-3 font-semibold">{step.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
    <SiteFooter />
    </>
  )
}
