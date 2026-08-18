import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { OwnerSkeleton } from "@advisory/components/loading/app-skeletons"
import { noIndexRobots } from "@/lib/seo"
import { getCurrentUserAccess } from "@/lib/current-user-route-access"
import { getSubdomain } from "@/lib/get-subdomain"
import { OWNER_PLATFORM_SUBDOMAIN } from "@/lib/reserved-subdomains"

export const metadata: Metadata = {
  robots: noIndexRobots,
}

interface OwnerLayoutProps {
  children: ReactNode
}

export default function OwnerLayout({ children }: OwnerLayoutProps) {
  return (
    <Suspense fallback={<OwnerSkeleton />}>
      <OwnerAccessGate>{children}</OwnerAccessGate>
    </Suspense>
  )
}

async function OwnerAccessGate({ children }: { children: ReactNode }) {
  const [access, subdomain] = await Promise.all([getCurrentUserAccess(), getSubdomain()])

  if (!access.user) {
    redirect("/sign-in")
  }

  if (!access.isOwner) {
    redirect("/forbidden")
  }

  if (subdomain && subdomain !== OWNER_PLATFORM_SUBDOMAIN) {
    redirect("/")
  }

  return <>{children}</>
}
