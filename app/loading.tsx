import { headers } from "next/headers"
import { TrackOverviewSkeleton } from "@/components/loading/track-skeletons"
import { PageLoading } from "@/components/ui/page-loading"

export default async function Loading() {
  const product = (await headers()).get("x-product")
  if (product === "track") {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-16 sm:px-6 md:pb-12 md:pt-8">
        <TrackOverviewSkeleton />
      </div>
    )
  }

  return <PageLoading />
}
