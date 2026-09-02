import { Skeleton } from "@/components/ui/skeleton"

function ScreenLabel({ label }: { label: string }) {
  return <span className="sr-only">{label}</span>
}

export function TrackOverviewSkeleton() {
  return (
    <div className="space-y-6 md:space-y-8" aria-busy="true" aria-label="Loading Wise Track">
      <ScreenLabel label="Loading Wise Track" />
      <Skeleton className="h-4 w-24" />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="track-panel flex flex-col p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <Skeleton className="h-9 w-48 md:h-10 md:w-56" />
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>

          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-3">
            <Skeleton className="h-4 w-32" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>

          <Skeleton className="mt-8 h-40 w-full rounded-2xl" />
        </section>

        <section className="track-panel flex flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        </section>
      </div>

      <section className="track-panel space-y-3 p-5 sm:p-6">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-2xl" />
        ))}
      </section>
    </div>
  )
}

export function TrackExpensesSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading expenses">
      <ScreenLabel label="Loading expenses" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-36 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-52 w-full rounded-[1.75rem]" />
      <section className="track-panel space-y-3 p-5 sm:p-6">
        <Skeleton className="h-5 w-36" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-2xl" />
        ))}
      </section>
    </div>
  )
}

export function TrackAccountsCarouselSkeleton() {
  return (
    <div className="-mx-4 space-y-5 px-4 sm:mx-0 sm:px-0">
      <div className="space-y-2 px-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
      </div>
      <Skeleton className="aspect-10/16 w-[calc(100vw-2.75rem)] rounded-[1.35rem] sm:w-full" />
    </div>
  )
}

export function TrackAccountsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading accounts">
      <ScreenLabel label="Loading accounts" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>
      </div>
      <TrackAccountsCarouselSkeleton />
    </div>
  )
}

export function TrackCategoriesSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-lg space-y-6"
      aria-busy="true"
      aria-label="Loading categories"
    >
      <ScreenLabel label="Loading categories" />
      <div className="space-y-2">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="space-y-0 divide-y divide-border/70 px-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function TrackProfileSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-lg space-y-8 px-3 pb-28 md:px-6 md:pb-12"
      aria-busy="true"
      aria-label="Loading profile"
    >
      <ScreenLabel label="Loading profile" />
      <div>
        <div className="relative">
          <Skeleton className="h-[min(42vh,18.5rem)] w-full rounded-b-[999px] rounded-t-none" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
            <Skeleton className="size-24 rounded-full border-[5px] border-background sm:size-28" />
          </div>
        </div>
        <div className="mt-16 flex flex-col items-center gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-52" />
        </div>
        <div className="mt-8 space-y-0 divide-y divide-border/70 px-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TrackAccountRowsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading accounts">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-2xl" />
      ))}
    </div>
  )
}
