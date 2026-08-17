export function PageLoading({ label = "Loading" }: { label?: string }) {
  return (
    <div
      className="mx-auto w-full max-w-3xl px-6 py-24"
      aria-busy="true"
      aria-label={label}
    >
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="mt-4 h-4 w-full max-w-xl animate-pulse rounded-md bg-muted" />
      <div className="mt-2 h-4 w-2/3 animate-pulse rounded-md bg-muted" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="h-36 animate-pulse rounded-2xl bg-muted" />
        <div className="h-36 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  )
}
