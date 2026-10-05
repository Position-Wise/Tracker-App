"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import {
  ArrowLeftRight,
  ChartPie,
  CreditCard,
  House,
  LogIn,
  LogOut,
  Moon,
  Plus,
  Receipt,
  Sun,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
  X,
} from "lucide-react"
import { useAuth, AuthProvider } from "@/components/providers/auth-provider"
import { useTheme } from "@/components/providers/theme-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { requestQuickAdd, type QuickAddKind } from "@track/lib/quick-add"
import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const NAV_EXCLUDED_PREFIXES = ["/sign-in", "/sign-up"] as const

const trackNavLeft = [
  { name: "Expenses", href: "/app/expenses", icon: Receipt },
  { name: "Accounts", href: "/app/accounts", icon: Wallet },
] as const

const trackNavRight = [
  { name: "Analytics", href: "/app/analytics", icon: ChartPie },
] as const

const railNav = [
  { name: "Overview", href: "/app", icon: House, exact: true },
  { name: "Expenses", href: "/app/expenses", icon: Receipt, exact: false },
  { name: "Accounts", href: "/app/accounts", icon: Wallet, exact: false },
  { name: "Analytics", href: "/app/analytics", icon: ChartPie, exact: false },
] as const

const quickAddOptions: {
  kind: QuickAddKind
  label: string
  description: string
  icon: typeof TrendingDown
}[] = [
  {
    kind: "income",
    label: "Income",
    description: "Record money in",
    icon: TrendingUp,
  },
  {
    kind: "expense",
    label: "Expense",
    description: "Log a spend",
    icon: TrendingDown,
  },
  {
    kind: "transfer",
    label: "Transfer",
    description: "Move between accounts",
    icon: ArrowLeftRight,
  },
  {
    kind: "card_bill",
    label: "Card bill",
    description: "Pay down card used",
    icon: CreditCard,
  },
]

function isActivePath(pathname: string, href: string) {
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

function useQuickAddPick() {
  const pathname = usePathname()
  const router = useRouter()
  return (kind: QuickAddKind) => {
    if (pathname.startsWith("/app")) {
      requestQuickAdd(kind)
      return
    }
    router.push(`/app?add=${kind}`)
  }
}

function useTrackLogout() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const logout = async () => {
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
    router.replace("/sign-in?next=/app")
    router.refresh()
  }

  return { isLoggingOut, logout }
}

function TrackProfileMenu() {
  const { user } = useAuth()
  const { isLoggingOut, logout: handleLogout } = useTrackLogout()

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button asChild variant="outline" size="sm">
          <Link href="/sign-in?next=/app">Sign in</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/sign-up?next=/app">Get started</Link>
        </Button>
      </div>
    )
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
            <Link href="/app/analytics">Analytics</Link>
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

function MobileNavLink({
  href,
  name,
  icon: Icon,
  active,
}: {
  href: string
  name: string
  icon: typeof Receipt
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-1 py-1.5 text-[11px]"
    >
      <Icon
        className={cn(
          "h-5 w-5",
          active ? "text-primary" : "text-muted-foreground"
        )}
      />
      <span
        className={cn(
          "mt-1 truncate",
          active ? "font-medium text-primary" : "text-muted-foreground"
        )}
      >
        {name}
      </span>
    </Link>
  )
}

function DockedNavBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="relative flex h-16 items-end rounded-[1.75rem] border border-border/70 bg-card px-1.5 pb-1 shadow-[0_12px_40px_-18px_rgba(15,23,42,0.45)]">
        {children}
      </div>
    </div>
  )
}

function TrackMobileQuickAdd() {
  const pickQuickAdd = useQuickAddPick()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (menuRef.current && target && !menuRef.current.contains(target)) {
        setOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("touchstart", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("touchstart", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  function handlePick(kind: QuickAddKind) {
    setOpen(false)
    pickQuickAdd(kind)
  }

  return (
    <div
      ref={menuRef}
      className="relative flex h-14 w-16 shrink-0 justify-center"
    >
      {open ? (
        <div className="absolute bottom-[calc(100%+28px)] left-1/2 z-20 w-55 -translate-x-1/2 rounded-2xl border border-border/70 bg-card p-2 shadow-lg">
          <div className="space-y-1">
            {quickAddOptions.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.kind}
                  type="button"
                  onClick={() => handlePick(option.kind)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary"
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-foreground">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      {option.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {/* Halo so the FAB sits cleanly over the bar without a warped SVG notch */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 size-[3.75rem] -translate-x-1/2 -translate-y-[42%] rounded-full bg-background"
      />
      <button
        type="button"
        aria-label={open ? "Close quick add" : "Add transaction"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="absolute left-1/2 top-0 z-10 flex size-14 -translate-x-1/2 -translate-y-[42%] items-center justify-center rounded-full bg-[#2a4064] text-white shadow-[0_10px_24px_-8px_rgba(42,64,100,0.75)] transition-transform active:scale-95"
      >
        {open ? (
          <X className="size-6" strokeWidth={2.5} />
        ) : (
          <Plus className="size-6" strokeWidth={2.5} />
        )}
      </button>
    </div>
  )
}

function RailTooltip({ label }: { label: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1 text-xs font-medium text-background opacity-0 shadow-md transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 group-data-[state=open]:opacity-0!"
    >
      {label}
    </span>
  )
}

const railItemClass =
  "group relative flex size-11 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60"

function RailLink({
  href,
  name,
  icon: Icon,
  active,
}: {
  href: string
  name: string
  icon: typeof Receipt
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-label={name}
      aria-current={active ? "page" : undefined}
      className={cn(
        railItemClass,
        active
          ? "bg-primary text-primary-foreground shadow-[0_8px_20px_-10px_rgba(42,64,100,0.9)]"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon className="size-5" />
      <RailTooltip label={name} />
    </Link>
  )
}

function RailProfileMenu({ active }: { active: boolean }) {
  const { user } = useAuth()
  const { isLoggingOut, logout } = useTrackLogout()
  if (!user) return null

  const name =
    user.user_metadata?.full_name || user.user_metadata?.name || "Profile"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Profile menu"
          className={cn(railItemClass, "p-0.5")}
        >
          <Avatar
            className={cn(
              "size-10 ring-2 transition-shadow",
              active ? "ring-primary" : "ring-border group-hover:ring-primary/50"
            )}
          >
            <AvatarImage
              src={user.user_metadata?.avatar_url || user.user_metadata?.picture}
              alt="User avatar"
            />
            <AvatarFallback className="bg-secondary text-sm">
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <RailTooltip label="Profile" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="left" align="start" sideOffset={14} className="min-w-52 rounded-xl p-1.5">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={isLoggingOut} onClick={logout}>
          <LogOut />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RailQuickAdd() {
  const pickQuickAdd = useQuickAddPick()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Add transaction"
          className={cn(
            railItemClass,
            "bg-[#2a4064] text-white shadow-[0_10px_24px_-8px_rgba(42,64,100,0.75)] hover:bg-[#355278] data-[state=open]:bg-[#355278] dark:ring-1 dark:ring-white/15"
          )}
        >
          <Plus
            className="size-5 transition-transform group-data-[state=open]:rotate-45"
            strokeWidth={2.5}
          />
          <RailTooltip label="Add transaction" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="left" align="center" sideOffset={14} className="w-60 rounded-2xl p-2">
        {quickAddOptions.map((option) => {
          const Icon = option.icon
          return (
            <DropdownMenuItem
              key={option.kind}
              onSelect={() => pickQuickAdd(option.kind)}
              className="gap-3 rounded-xl px-3 py-2.5 focus:bg-secondary focus:text-foreground"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-foreground">
                <Icon className="size-4 text-foreground" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RailThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const label = theme === "dark" ? "Light mode" : "Dark mode"
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        railItemClass,
        "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
      <RailTooltip label={label} />
    </button>
  )
}

const railSurfaceClass =
  "flex flex-col items-center gap-1.5 rounded-full border border-border/70 bg-card/90 p-2.5 shadow-[0_12px_40px_-18px_rgba(15,23,42,0.45)] backdrop-blur-xl"

function DesktopNavRail({
  pathname,
  profileActive,
}: {
  pathname: string
  profileActive: boolean
}) {
  return (
    <aside className="fixed inset-y-4 right-4 z-50 hidden w-16 flex-col items-center md:flex lg:inset-y-6 lg:right-6">
      <nav aria-label="Main" className={railSurfaceClass}>
        <RailProfileMenu active={profileActive} />
        <span aria-hidden className="my-1 h-px w-7 bg-border" />
        {railNav.map((item) => (
          <RailLink
            key={item.href}
            href={item.href}
            name={item.name}
            icon={item.icon}
            active={
              item.exact
                ? pathname === item.href
                : isActivePath(pathname, item.href)
            }
          />
        ))}
        <span aria-hidden className="my-1 h-px w-7 bg-border" />
        <RailQuickAdd />
      </nav>
      <div className={cn(railSurfaceClass, "mt-auto")}>
        <RailThemeToggle />
      </div>
    </aside>
  )
}

function TrackNavInner() {
  const pathname = usePathname()
  const { user } = useAuth()
  const profileActive = pathname === "/profile"

  useLayoutEffect(() => {
    document.body.classList.toggle("track-profile", profileActive)
    return () => document.body.classList.remove("track-profile")
  }, [profileActive])

  return (
    <>
      <div
        className={cn(
          "pointer-events-none fixed right-4 top-4 z-50 md:right-6 md:top-6",
          user && "md:hidden"
        )}
      >
        <div className="pointer-events-auto">
          <TrackProfileMenu />
        </div>
      </div>

      {user ? (
        <DesktopNavRail pathname={pathname} profileActive={profileActive} />
      ) : null}

      {user ? (
        <div className="fixed inset-x-4 bottom-4 z-50 md:hidden">
          <DockedNavBar>
            {trackNavLeft.map((item) => (
              <MobileNavLink
                key={item.href}
                href={item.href}
                name={item.name}
                icon={item.icon}
                active={isActivePath(pathname, item.href)}
              />
            ))}

            <TrackMobileQuickAdd />

            {trackNavRight.map((item) => (
              <MobileNavLink
                key={item.href}
                href={item.href}
                name={item.name}
                icon={item.icon}
                active={isActivePath(pathname, item.href)}
              />
            ))}

            <MobileNavLink
              href="/profile"
              name="Profile"
              icon={User}
              active={profileActive}
            />
          </DockedNavBar>
        </div>
      ) : (
        <div className="fixed inset-x-4 bottom-4 z-50 md:hidden">
          <div className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card px-3 py-2 shadow-md">
            <Link
              href="/sign-in?next=/app"
              className="flex flex-1 flex-col items-center py-1.5 text-[11px] text-muted-foreground"
            >
              <LogIn className="h-5 w-5" />
              <span className="mt-1">Sign in</span>
            </Link>
            <Button asChild size="sm" className="flex-1">
              <Link href="/sign-up?next=/app">Get started</Link>
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