import { Skeleton } from "@/components/ui/skeleton"

function ScreenLabel({ label }: { label: string }) {
  return <span className="sr-only">{label}</span>
}

export function DashboardSkeleton() {
  return (
    <main
      className="min-h-screen bg-background px-6 pb-20 pt-24 text-foreground"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <ScreenLabel label="Loading dashboard" />
      <section className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-9 w-72 max-w-full sm:h-10" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-6 w-44 rounded-full" />
          </div>
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>

        <div className="grid gap-4 rounded-xl border border-border bg-card p-6 sm:grid-cols-2">
          <div className="space-y-2 text-center">
            <Skeleton className="mx-auto h-3 w-28" />
            <Skeleton className="mx-auto h-5 w-20" />
          </div>
          <div className="space-y-2 text-center">
            <Skeleton className="mx-auto h-3 w-24" />
            <Skeleton className="mx-auto h-5 w-24" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-4 w-full max-w-lg" />
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-3xl" />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-28 rounded-full" />
            ))}
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      </section>
    </main>
  )
}

export function AdvisoryProfileSkeleton() {
  return (
    <div
      className="min-h-screen bg-background p-10"
      aria-busy="true"
      aria-label="Loading profile"
    >
      <ScreenLabel label="Loading profile" />
      <div className="mx-auto max-w-3xl space-y-8">
        <Skeleton className="h-9 w-36" />
        <div className="space-y-6 rounded-xl border border-border bg-card p-8">
          <div className="flex items-center gap-6">
            <Skeleton className="size-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-52" />
            </div>
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between border-b border-border pb-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-10 w-36 rounded-md" />
            <Skeleton className="h-10 w-28 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SubscribeSkeleton() {
  return (
    <main
      className="min-h-screen bg-background px-6 pb-20 pt-24 text-foreground"
      aria-busy="true"
      aria-label="Loading subscription"
    >
      <ScreenLabel label="Loading subscription" />
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-4 w-full max-w-md" />
        <div className="space-y-3 rounded-xl border border-border bg-card p-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-11 w-40 rounded-md" />
      </div>
    </main>
  )
}

export function OwnerSkeleton() {
  return (
    <main
      className="min-h-screen bg-background px-6 pb-20 pt-24 text-foreground"
      aria-busy="true"
      aria-label="Loading owner dashboard"
    >
      <ScreenLabel label="Loading owner dashboard" />
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      </section>
    </main>
  )
}

export function WaitingSkeleton() {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-background px-6 py-24"
      aria-busy="true"
      aria-label="Loading"
    >
      <ScreenLabel label="Loading" />
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 text-center">
        <Skeleton className="mx-auto size-16 rounded-full" />
        <Skeleton className="mx-auto h-7 w-48" />
        <Skeleton className="mx-auto h-4 w-full max-w-xs" />
        <Skeleton className="mx-auto h-4 w-2/3" />
        <div className="flex justify-center gap-3 pt-2">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      </div>
    </main>
  )
}

export function AdminPageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading admin content">
      <ScreenLabel label="Loading admin content" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <Skeleton className="h-4 w-40" />
            <div className="mt-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
