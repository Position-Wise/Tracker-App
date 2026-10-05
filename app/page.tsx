import { redirect } from "next/navigation"
import { TrackLanding } from "@track/components/track-landing"
import { getHomeShareMetadata } from "@/lib/seo"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function generateMetadata() {
  return getHomeShareMetadata()
}

export default async function Home() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect("/app")
  return <TrackLanding />
}
