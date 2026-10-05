import type { Metadata } from "next"
import { ReactNode, Suspense } from "react"
import { redirect } from "next/navigation"
import { TrackProfileSkeleton } from "@track/components/track-skeletons"
import { noIndexRobots } from "@/lib/seo"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  robots: noIndexRobots,
}

interface ProfileLayoutProps {
  children: ReactNode
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <Suspense fallback={<TrackProfileSkeleton />}>
      <ProfileAccessGate>{children}</ProfileAccessGate>
    </Suspense>
  )
}

async function ProfileAccessGate({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in?next=/profile")
  }

  return <>{children}</>
}
