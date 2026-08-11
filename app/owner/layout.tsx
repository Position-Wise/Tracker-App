import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getCurrentUserAccess } from "@/lib/current-user-route-access"
import { getSubdomain } from "@/lib/get-subdomain"
import { OWNER_PLATFORM_SUBDOMAIN } from "@/lib/reserved-subdomains"

interface OwnerLayoutProps {
  children: ReactNode
}

export default async function OwnerLayout({ children }: OwnerLayoutProps) {
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
