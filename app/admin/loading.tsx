export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading admin content">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            <div className="mt-3 h-8 w-16 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="h-4 w-40 rounded bg-muted animate-pulse" />
            <div className="mt-6 space-y-3">
              <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
              <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
              <div className="h-24 w-full rounded-md bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
