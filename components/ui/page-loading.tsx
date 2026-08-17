import { Skeleton } from "@/components/ui/skeleton"

export function PageLoading({ label = "Loading" }: { label?: string }) {
  return (
    <div
      className="mx-auto w-full max-w-3xl px-6 py-24"
      aria-busy="true"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-4 h-4 w-full max-w-xl" />
      <Skeleton className="mt-2 h-4 w-2/3" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
      </div>
    </div>
  )
}
