import { headers } from "next/headers"
import {
  AdvisoryProfileSkeleton,
} from "@advisory/components/loading/app-skeletons"
import { TrackProfileSkeleton } from "@track/components/track-skeletons"

export default async function Loading() {
  const product = (await headers()).get("x-product")
  if (product === "track") {
    return <TrackProfileSkeleton />
  }

  return <AdvisoryProfileSkeleton />
}
