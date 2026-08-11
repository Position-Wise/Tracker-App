"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard,
  Receipt,
  Tags,
  User,
  LogIn,
  Moon,
  Sun,
  Wallet,
} from "lucide-react"
import { useAuth, AuthProvider } from "@/components/providers/auth-provider"
import { useTheme } from "@/components/providers/theme-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const NAV_EXCLUDED_PREFIXES = ["/sign-in", "/sign-up"] as const

const trackNavItems = [
  { name: "Home", href: "/app", icon: LayoutDashboard },
  { name: "Expenses", href: "/app/expenses", icon: Receipt },
  { name: "Accounts", href: "/app/accounts", icon: Wallet },
  { name: "Categories", href: "/app/categories", icon: Tags },
] as const

function isActivePath(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className="rounded-full border-border bg-card"
      onClick={toggleTheme}
      aria-label={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
    >
      {theme === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  )
}

function TrackProfileMenu() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button asChild variant="outline" size="sm">
          <Link href="/sign-in">Sign in</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/sign-up">Get started</Link>
        </Button>
      </div>
    )
  }

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      const { error } = await supabase.auth.signOut({ scope: "global" })
      if (error) {
        await supabase.auth.signOut({ scope: "local" })
      }
    } catch (logoutError) {
      console.error("Logout error:", logoutError)
    }
    router.replace("/sign-in")
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar className="h-9 w-9 cursor-pointer ring-1 ring-border">
            <AvatarImage
              src={
                user.user_metadata?.avatar_url || user.user_metadata?.picture
              }
              alt="User avatar"
            />
            <AvatarFallback className="bg-secondary text-sm">
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href="/profile">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/app/categories">Categories</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={isLoggingOut} onClick={handleLogout}>
            {isLoggingOut ? "Logging out..." : "Logout"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function TrackNavInner() {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <>
      <div className="pointer-events-none fixed right-4 top-4 z-50 md:right-6 md:top-6">
        <div className="pointer-events-auto">
          <TrackProfileMenu />
        </div>
      </div>

      {user ? (
        <div className="fixed inset-x-4 bottom-4 z-50 md:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between gap-1 rounded-2xl border border-border/70 bg-card px-2 py-2 shadow-md">
            {trackNavItems.map((item) => {
              const Icon = item.icon
              const active = isActivePath(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-[11px]"
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "mt-1",
                      active
                        ? "font-medium text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.name}
                  </span>
                </Link>
              )
            })}
            <Link
              href="/profile"
              className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-[11px]"
            >
              <User
                className={cn(
                  "h-5 w-5",
                  pathname === "/profile"
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "mt-1",
                  pathname === "/profile"
                    ? "font-medium text-primary"
                    : "text-muted-foreground"
                )}
              >
                Profile
              </span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="fixed inset-x-4 bottom-4 z-50 md:hidden">
          <div className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card px-3 py-2 shadow-md">
            <Link
              href="/sign-in"
              className="flex flex-1 flex-col items-center py-1.5 text-[11px] text-muted-foreground"
            >
              <LogIn className="h-5 w-5" />
              <span className="mt-1">Sign in</span>
            </Link>
            <Button asChild size="sm" className="flex-1">
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

export default function TrackShell() {
  const pathname = usePathname()
  const hide = NAV_EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
  if (hide) return null

  return (
    <AuthProvider>
      <TrackNavInner />
    </AuthProvider>
  )
}
