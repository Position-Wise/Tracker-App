"use client"

import { useRef } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Check,
} from "lucide-react"
import { BrandLogo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { SiteFooter } from "@/components/marketing/site-footer"
import {
  AdvisoryPreview,
  DualProductPreview,
  HeroBento,
  TrackPreview,
} from "@/components/marketing/landing-previews"
import { useStackCoverBlur } from "@/components/marketing/use-stack-cover-blur"

type HomeLandingViewProps = {
  trackHomeUrl: string
  trackSignUpUrl: string
}

export function HomeLandingView({
  trackHomeUrl,
  trackSignUpUrl,
}: HomeLandingViewProps) {
  const stackRootRef = useRef<HTMLElement>(null)
  useStackCoverBlur(stackRootRef)

  return (
    <main ref={stackRootRef} className="bg-background text-foreground">
      <section
        data-stack-panel
        className="relative flex min-h-dvh items-center overflow-hidden bg-background lg:sticky lg:top-0 lg:z-10 lg:will-change-[filter]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-accent/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-primary/8 blur-3xl"
        />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-6 py-24 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-14">
          <div>
            <BrandLogo className="h-8 w-auto sm:h-9" priority />
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.35rem]">
              See your money
              <span className="block">clearly. Grow it with</span>
              <span className="mt-1 block font-light italic text-primary">
                advice that fits you.
              </span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              Personalized investment guidance when you want a professional in
              your corner, and a free expense tracker for the money that moves
              every day.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="rounded-full bg-accent px-6 text-accent-foreground hover:bg-accent/90"
                asChild
              >
                <Link href={trackSignUpUrl}>Start tracking free</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full"
                asChild
              >
                <a href="#about">
                  Explore now
                  <ArrowRight />
                </a>
              </Button>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="size-4 text-accent" />
                Tracker is free
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4 text-accent" />
                Advice fitted to you
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4 text-accent" />
                No organisation wait
              </li>
            </ul>
          </div>

          <HeroBento />
        </div>
      </section>

      <section
        id="about"
        data-stack-panel
        className="relative flex scroll-mt-24 items-center border-t border-border/70 bg-muted lg:sticky lg:top-0 lg:z-20 lg:min-h-dvh lg:will-change-[filter]"
      >
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              About
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Advisory for the long view. A tracker for every day.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Position Wise is two products under one roof. Personalized
              investment guidance when you want a professional in your corner,
              and Wise Track when you want a calm picture of spend, income, and
              surplus.
            </p>
          </div>

          <div className="mt-12">
            <DualProductPreview />
          </div>

          <div className="mt-8 grid overflow-hidden rounded-3xl border border-border bg-card shadow-xl md:grid-cols-2">
            <PathCard
              index="01"
              href="#advisory"
              title="Personalized advisory"
              body="Guidance fitted to your goals, risk, and timeline — not a feed of generic tips."
              action="How we advise"
              featured
            />
            <PathCard
              index="02"
              href="#track"
              title="Wise Track"
              body="A free, smart expense tracker. Log money in seconds and see surplus you can actually use."
              action="How tracking works"
              badge="Free"
            />
          </div>
        </div>
      </section>

      <section
        data-stack-panel
        className="relative grid lg:sticky lg:top-0 lg:z-30 lg:h-dvh lg:grid-cols-2 lg:will-change-[filter]"
      >
        <article
          id="advisory"
          className="no-scrollbar flex scroll-mt-32 flex-col bg-primary px-6 pb-16 pt-28 text-primary-foreground sm:px-10 lg:overflow-y-auto lg:px-12 lg:pb-16 lg:pt-52"
        >
          <div className="mx-auto w-full max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
              Path 01 · Advisory
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-[2rem] sm:leading-tight">
              Investment advice built around you — not the market’s last headline.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/80 sm:text-base">
              Position Wise exists for people who want a framework, not noise.
              We look at what you are funding, what risk you can carry, and how
              to size decisions so you stay in control of your capital.
            </p>
            <ul className="mt-8 space-y-4">
              {advisoryTalk.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-300" />
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-primary-foreground/75">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
                asChild
              >
                <Link href="/sign-up">
                  Request access
                  <ArrowRight />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href="/advisory">
                  Explore advisory
                </Link>
              </Button>
            </div>
            <AdvisoryPreview className="mt-8 shadow-2xl" />
          </div>
        </article>

        <article
          id="track"
          className="no-scrollbar flex scroll-mt-32 flex-col border-t border-border bg-background px-6 pb-16 pt-28 sm:px-10 lg:overflow-y-auto lg:border-l lg:border-t-0 lg:px-12 lg:pb-16 lg:pt-52"
        >
          <div className="mx-auto w-full max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                Path 02 · Wise Track
              </p>
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                Free
              </span>
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-[2rem] sm:leading-tight">
              A tracker you will actually open — then a surplus you can trust.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Wise Track is the everyday product: log spend, income, transfers,
              and card bills in a calm UI. No organisation wait. No spreadsheet
              ritual. Free, because clarity should come before a paid plan.
            </p>
            <ul className="mt-8 space-y-4">
              {trackPitch.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href={trackSignUpUrl}>
                  Start tracking free
                  <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={trackHomeUrl}>Open Wise Track</Link>
              </Button>
            </div>
            <TrackPreview className="mt-8" />
          </div>
        </article>
      </section>

      <section
        data-stack-panel
        className="relative grid lg:sticky lg:top-0 lg:z-40 lg:h-dvh lg:grid-cols-2 lg:will-change-[filter]"
      >
        <article className="no-scrollbar flex flex-col bg-primary px-6 pb-16 pt-36 text-primary-foreground sm:px-10 lg:overflow-y-auto lg:px-12 lg:pb-16 lg:pt-52">
          <div className="mx-auto w-full max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
              How advisory works
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              A working relationship, not a tip dump.
            </h3>
            <ol className="mt-10 grid gap-6 sm:grid-cols-2">
              {advisorySteps.map((step, index) => (
                <li key={step.title} className="flex flex-col">
                  <p className="text-xs font-semibold tabular-nums text-emerald-300">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-3 font-semibold">{step.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-primary-foreground/75">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {advisoryPillars.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <h4 className="font-semibold">{item.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-primary-foreground/75">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
            <div className="mt-10">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href="/insights">
                  How we think
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </article>

        <article className="no-scrollbar flex flex-col border-t border-border bg-background px-6 pb-16 pt-36 sm:px-10 lg:overflow-y-auto lg:border-l lg:border-t-0 lg:px-12 lg:pb-16 lg:pt-52">
          <div className="mx-auto w-full max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              How to use Wise Track
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Four steps from signup to a clear month.
            </h3>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2">
              {trackGuide.map((step, index) => (
                <li
                  key={step.title}
                  className="flex gap-3 rounded-2xl"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center text-xs font-semibold tabular-nums text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">{step.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="mt-12 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              How the tracker thinks
            </p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
              Four actions, each with a job — so the numbers stay honest.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Paying a card is not new spend. Moving money between your own
              accounts is not income. Each action keeps its meaning.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {trackActions.map((item) => (
                <article
                  key={item.title}
                  className="flex flex-col rounded-2xl border border-border bg-card p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                    {item.kind}
                  </p>
                  <h4 className="mt-2 font-semibold">{item.title}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </article>
      </section>

      <div className="relative bg-muted lg:z-50">
        <section
          data-stack-panel
          className="relative bg-primary px-6 py-20 text-primary-foreground"
        >
          <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center md:gap-16">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Start on the path that fits today.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-primary-foreground/80 sm:text-base">
                Track for free whenever you want the picture. Request advisory
                when you want guidance that uses that picture.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
                asChild
              >
                <Link href="/sign-up">Get personalized advice</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href={trackSignUpUrl}>Start tracking free</Link>
              </Button>
            </div>
          </div>
        </section>

        <SiteFooter trackHomeUrl={trackHomeUrl} className="bg-transparent" />
      </div>
    </main>
  )
}

function PathCard({
  index,
  href,
  title,
  body,
  action,
  featured,
  badge,
}: {
  index: string
  href: string
  title: string
  body: string
  action: string
  featured?: boolean
  badge?: string
}) {
  return (
    <a
      href={href}
      className={
        featured
          ? "group flex h-full flex-col bg-primary p-7 text-primary-foreground transition-colors hover:bg-primary/95 sm:p-8"
          : "group flex h-full flex-col border-t border-border bg-card p-7 transition-colors hover:bg-muted/40 sm:border-l sm:border-t-0 sm:p-8"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className={
            featured
              ? "text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300"
              : "text-xs font-semibold uppercase tracking-[0.2em] text-accent"
          }
        >
          {index}
        </p>
        {badge ? (
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
            {badge}
          </span>
        ) : null}
      </div>
      <h3 className="mt-4 text-xl font-semibold tracking-tight">{title}</h3>
      <p
        className={
          featured
            ? "mt-3 flex-1 text-sm leading-relaxed text-primary-foreground/80"
            : "mt-3 flex-1 text-sm leading-relaxed text-muted-foreground"
        }
      >
        {body}
      </p>
      <p
        className={
          featured
            ? "mt-6 inline-flex items-center gap-2 text-sm font-medium"
            : "mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary"
        }
      >
        {action}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </p>
    </a>
  )
}

const advisoryTalk = [
  {
    title: "Fitted to your life, not a model portfolio",
    body: "Goals, timeline, and the surplus you actually have sit at the centre. We do not copy a generic allocation and call it personal.",
  },
  {
    title: "Context before conviction",
    body: "You get the why: structure, invalidation, and what to ignore. Headlines are not a strategy.",
  },
  {
    title: "You stay in control",
    body: "Advice is a framework you can act on. We do not take the wheel of your capital.",
  },
] as const

const trackPitch = [
  "Free to use — no organisation wait, no membership required",
  "Log expense, income, transfer, or card bill in seconds",
  "See real surplus: card bills stay as debt payoff, not fake spend",
] as const

const advisorySteps = [
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
  {
    title: "Scale the relationship",
    body: "Membership unlocks the depth of access that matches how closely you want to work.",
  },
] as const

const advisoryPillars = [
  {
    title: "Risk before return",
    body: "Position size and drawdown come first. Profit is a consequence of surviving the plan.",
  },
  {
    title: "Transparent working",
    body: "Clear membership, clear access. No hidden schedules or hindsight-only commentary.",
  },
  {
    title: "Built for investors",
    body: "This is guidance for people funding a life — not a signal room for momentum scalps.",
  },
  {
    title: "Paired with real cash flow",
    body: "When you also use Wise Track, advice can be sized to surplus, not to a round number on a form.",
  },
] as const

const trackGuide = [
  {
    title: "Create a free account",
    body: "No organisation membership and no waiting list. Sign up and Wise Track is yours.",
  },
  {
    title: "Add the accounts you use",
    body: "Cash, bank, cards — so you can see where money sits, not only what left this month.",
  },
  {
    title: "Log money as it moves",
    body: "Pick expense, income, transfer, or card bill. Each action takes seconds and keeps meaning intact.",
  },
  {
    title: "Read the month",
    body: "Totals, category mix, and net surplus update as you go. That surplus is what advisory can plan around.",
  },
] as const

const trackActions = [
  {
    kind: "Expense",
    title: "Money leaving your life",
    body: "Rent, groceries, travel. This is true spend — it reduces surplus.",
  },
  {
    kind: "Income",
    title: "Money arriving",
    body: "Salary, freelance, transfers in from the outside. This is what you earned.",
  },
  {
    kind: "Transfer",
    title: "Moving between yourself",
    body: "Bank to cash, saving to spending. Not income, not spend — just a move.",
  },
  {
    kind: "Card bill",
    title: "Paying down debt",
    body: "Settling a card is not new spend. It is debt payoff, shown separately so net stays honest.",
  },
] as const
