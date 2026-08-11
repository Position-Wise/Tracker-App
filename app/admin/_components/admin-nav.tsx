"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/broadcast", label: "Broadcast" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/market-data", label: "Market Data" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/plans", label: "Plans" },
  { href: "/admin/invites", label: "Invites" },
  { href: "/admin/users", label: "Users" },
] as const

function adminNavHrefIsActive(path: string, href: string) {
  return (
    path === href || (href !== "/admin" && path.startsWith(`${href}/`))
  )
}

type PendingAdminNav = { targetHref: string; originPath: string }

function effectivePathForAdminNav(
  pathname: string,
  pending: PendingAdminNav | null
) {
  if (!pathname.startsWith("/admin")) return pathname
  if (!pending) return pathname
  if (adminNavHrefIsActive(pathname, pending.targetHref)) return pathname
  if (pathname === pending.originPath) return pending.targetHref
  return pathname
}

export default function AdminNav() {
  const pathname = usePathname()
  const [pendingNav, setPendingNav] = useState<PendingAdminNav | null>(null)
  const navItems = ADMIN_NAV_ITEMS

  const effectivePath = effectivePathForAdminNav(pathname, pendingNav)

  return (
    <nav className="inline-flex flex-wrap rounded-xl border border-border bg-card p-1.5">
      {navItems.map((item) => {
        const isActive = adminNavHrefIsActive(effectivePath, item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            onClick={() =>
              setPendingNav({ targetHref: item.href, originPath: pathname })
            }
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
