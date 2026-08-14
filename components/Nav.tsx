"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Home,
  BarChart3,
  Layers,
  LogIn,
  User,
  Lightbulb,
  LayoutDashboard,
  Clock3,
  Crown,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase/client";
import {
  getOwnerPlatformUrl,
  isOnOwnerPlatformHost,
} from "@/lib/owner-platform-url";
import {
  getAccessStateFromStatus,
  getMemberHomePathForState,
} from "@/lib/subscription-status";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type NavbarProps = {
  trackHomeUrl?: string
}

export default function Navbar({ trackHomeUrl }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, profile } = useAuth();
  const accessState = profile?.accessState ?? getAccessStateFromStatus(profile?.status ?? null);
  const memberHomePath = getMemberHomePathForState(accessState);
  const memberHomeLabel =
    accessState === "approved"
      ? "Dashboard"
      : accessState === "waiting"
        ? "Waiting"
        : accessState === "blocked"
          ? "Resubmit"
          : "Subscribe";
  const memberHomeIcon =
    accessState === "approved"
      ? LayoutDashboard
      : accessState === "waiting"
        ? Clock3
        : Layers;
  const hasActiveAccess = accessState === "approved";
  const isOwner = Boolean(user && profile?.isOwner);
  const isAdmin = Boolean(user && profile?.isAdmin);
  const adminHref = isOwner ? "/admin-select" : "/admin";
  const hasAdminDashboard = isAdmin || isOwner;
  const onOwnerPlatform = isOwner && isOnOwnerPlatformHost();
  const ownerDashboardHref = isOwner ? getOwnerPlatformUrl("/owner") : "/owner";
  const ownerNavLabel = onOwnerPlatform ? "Owner" : "Owner";
  const ownerDashboardLabel = onOwnerPlatform ? "Owner dashboard" : "Back to owner";
  const adminNavLabel = isOwner ? "Admin Dashboard" : "Admin";
  const shouldHighlightMemberEntry =
    Boolean(user) && accessState === "new_user" && !isAdmin;
  const isAccountPage =
    pathname === "/profile" ||
    (isOwner && (pathname === "/owner" || onOwnerPlatform)) ||
    pathname === memberHomePath ||
    (hasActiveAccess && pathname === "/tips") ||
    (isAdmin && pathname.startsWith("/admin"));
    
    
  const baseNavItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Insights", href: "/insights", icon: BarChart3 },
    { name: "Membership", href: "/membership", icon: Layers },
    ...(trackHomeUrl
      ? [{ name: "Track", href: trackHomeUrl, icon: Wallet }]
      : []),
  ];

  const authedNavItems = [
    ...(isOwner
      ? [{ name: ownerNavLabel, href: ownerDashboardHref, icon: Crown }]
      : []),
    ...(!isOwner || !onOwnerPlatform
      ? [{ name: memberHomeLabel, href: memberHomePath, icon: memberHomeIcon }]
      : []),
    ...(hasActiveAccess ? [{ name: "Tips", href: "/tips", icon: Lightbulb }] : []),
    ...(hasAdminDashboard ? [{ name: adminNavLabel, href: adminHref, icon: User }] : []),
  ];

  const navItems = user ? authedNavItems : baseNavItems;

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });

      // If remote revocation fails, still clear this browser session.
      if (error) {
        await supabase.auth.signOut({ scope: "local" });
      }
    } catch (logoutError) {
      console.error("Logout error:", logoutError);
    }

    router.replace("/sign-in");
    router.refresh();
  };

  return (
    <>
      {/* ================= DESKTOP NAV ================= */}
      <header className="hidden md:flex fixed top-0 left-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto w-full px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold text-lg">
            Position Wise Advisory
          </Link>

          <nav className="flex items-center gap-8 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "relative inline-flex items-center gap-2 rounded-full px-3 py-1 transition-colors hover:text-accent",
                  pathname === item.href && "text-accent",
                  isOwner &&
                    item.href === ownerDashboardHref &&
                    (pathname === "/owner" || pathname.startsWith("/owner/")) &&
                    "text-accent",
                  shouldHighlightMemberEntry &&
                    item.href === memberHomePath &&
                    "bg-accent/12 text-accent shadow-sm shadow-accent/15 ring-1 ring-accent/20",
                )}
              >
                {item.name}
              </Link>
            ))}

            {isOwner && !onOwnerPlatform ? (
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link href={ownerDashboardHref}>
                  <Crown className="mr-1.5 h-3.5 w-3.5" />
                  Owner home
                </Link>
              </Button>
            ) : null}

            {/* === AUTH SECTION === */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Avatar className="cursor-pointer h-8 w-8">
                    <AvatarImage
                      src={
                        user.user_metadata?.avatar_url ||
                        user.user_metadata?.picture
                      }
                      alt="User avatar"
                    />
                    <AvatarFallback>
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  {isOwner ? (
                    <DropdownMenuItem asChild>
                      <Link href={ownerDashboardHref}>{ownerDashboardLabel}</Link>
                    </DropdownMenuItem>
                  ) : null}

                  {hasAdminDashboard && (
                    <DropdownMenuItem asChild>
                      <Link href={adminHref}>{adminNavLabel}</Link>
                    </DropdownMenuItem>
                  )}

                  {hasActiveAccess && (
                    <DropdownMenuItem asChild>
                      <Link href="/tips">Tips</Link>
                    </DropdownMenuItem>
                  )}

                  {!isOwner ? (
                    <DropdownMenuItem asChild>
                      <Link href={memberHomePath}>{memberHomeLabel}</Link>
                    </DropdownMenuItem>
                  ) : null}

                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    disabled={isLoggingOut}
                    onClick={handleLogout}
                  >
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>

                <Link href="/sign-up">
                  <Button size="sm">Request Access</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ================= MOBILE TOP ================= */}
      <header className="fixed top-0 left-0 z-[60] w-full border-b border-border bg-background/95 shadow-sm md:hidden">
        <div className="px-6 py-4 flex justify-center">
          <Link href="/" className="font-semibold">
            Position Wise Advisory
          </Link>
        </div>
      </header>

      {/* ================= MOBILE BOTTOM PILL ================= */}
      <div className="fixed inset-x-4 bottom-4 z-[80] md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-1 rounded-2xl border border-border/70 bg-card px-2 py-2 shadow-md">
          {navItems
            .filter((item) => !(trackHomeUrl && !user && item.name === "Insights"))
            .map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (isOwner &&
                item.href === ownerDashboardHref &&
                (pathname === "/owner" || pathname.startsWith("/owner/")));
            const isHighlighted = shouldHighlightMemberEntry && item.href === memberHomePath;

            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-[11px] transition-colors",
                  isHighlighted && "bg-accent/12 ring-1 ring-accent/20",
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive || isHighlighted ? "text-accent" : "text-muted-foreground",
                  )}
                />
                <span className="mt-1 inline-flex items-center gap-1">
                  <span
                    className={cn(
                      isActive || isHighlighted ? "text-accent" : "text-muted-foreground",
                    )}
                  >
                    {item.name}
                  </span>
                </span>
              </Link>
            );
          })}

          {/* === AUTH ITEM === */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-[11px] outline-none"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={
                        user.user_metadata?.avatar_url ||
                        user.user_metadata?.picture
                      }
                    />
                    <AvatarFallback>
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      "mt-1",
                      isAccountPage
                        ? "text-accent"
                        : "text-muted-foreground",
                    )}
                  >
                    Account
                  </span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="mb-2 min-w-40"
                side="top"
                sideOffset={10}
              >
                {isOwner ? (
                  <DropdownMenuItem asChild>
                    <Link href={ownerDashboardHref}>{ownerDashboardLabel}</Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href={memberHomePath}>{memberHomeLabel}</Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>

                {hasActiveAccess && (
                  <DropdownMenuItem asChild>
                    <Link href="/tips">Tips</Link>
                  </DropdownMenuItem>
                )}

                {hasAdminDashboard && (
                  <DropdownMenuItem asChild>
                    <Link href={adminHref}>{adminNavLabel}</Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                >
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/sign-in"
              className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-[11px]"
            >
              <LogIn
                className={cn(
                  "w-5 h-5 transition-colors",
                  pathname === "/sign-in"
                    ? "text-accent"
                    : "text-muted-foreground",
                )}
              />
              <span
                className={cn(
                  "mt-1",
                  pathname === "/sign-in"
                    ? "text-accent"
                    : "text-muted-foreground",
                )}
              >
                Login
              </span>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
