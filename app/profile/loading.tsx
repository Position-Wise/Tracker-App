import { headers } from "next/headers"
import {
  AdvisoryProfileSkeleton,
} from "@/components/loading/app-skeletons"
import { TrackProfileSkeleton } from "@/components/loading/track-skeletons"

export default async function Loading() {
  const product = (await headers()).get("x-product")
  if (product === "track") {
    return <TrackProfileSkeleton />
  }

  return <AdvisoryProfileSkeleton />
}
