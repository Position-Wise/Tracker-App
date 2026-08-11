"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, RefreshCcw, LineChart } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { checkCurrentUserAccess } from "@/app/waiting/actions"
import { getMemberHomePathForState } from "@/lib/subscription-status"
import { getTrackPlatformUrl } from "@/lib/track-platform-url"

type WaitingClientProps = {
  displayName: string
  avatarUrl: string | null
  isAssigned: boolean
}

function initialsFromName(value: string) {
  const pieces = value
    .split(" ")
    .map((piece) => piece.trim())
    .filter(Boolean)
    .slice(0, 2)

  if (!pieces.length) return "U"
  return pieces.map((piece) => piece[0]?.toUpperCase() ?? "").join("")
}

export function WaitingClient({ displayName, avatarUrl, isAssigned }: WaitingClientProps) {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const trackHref = getTrackPlatformUrl("/app")

  const recheckAccess = useCallback(async () => {
    const access = await checkCurrentUserAccess()

    if (!access.user) {
      router.replace("/sign-in")
      return true
    }

    if (access.isOwner) {
      router.replace("/owner")
      return true
    }

    if (access.accessState === "approved") {
      router.replace("/dashboard")
      return true
    }

    if (access.organizationId) {
      router.replace(getMemberHomePathForState(access.accessState))
      return true
    }

    return false
  }, [router])

  useEffect(() => {
    const interval = window.setInterval(() => {
      void recheckAccess()
    }, 5000)

    return () => window.clearInterval(interval)
  }, [recheckAccess])

  async function handleManualCheck() {
    setIsChecking(true)
    setMessage(null)

    try {
      const redirected = await recheckAccess()
      if (!redirected) {
        setMessage(
          isAssigned
            ? "Your account is assigned and pending admin approval. We'll keep checking automatically."
            : "No assignment yet. We will keep checking automatically."
        )
      }
    } catch {
      setMessage("Could not refresh right now. Please try again in a moment.")
    } finally {
      setIsChecking(false)
    }
  }

  async function handleSwitchAccount() {
    setIsSigningOut(true)

    try {
      await supabase.auth.signOut()
    } finally {
      router.replace("/sign-in")
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
      <Avatar size="lg" className="mb-4">
        <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
        <AvatarFallback>{initialsFromName(displayName)}</AvatarFallback>
      </Avatar>

      <p className="text-sm text-muted-foreground">Hi {displayName}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        You&apos;re almost in 🚀
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        {isAssigned
          ? "Your account has been assigned and is now waiting for admin approval."
          : "Your account is waiting to be assigned to an organization."}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {isAssigned
          ? "Once approved, you'll automatically get access to the dashboard."
          : "Once assigned, you'll automatically get access. Or start tracking expenses now."}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {!isAssigned ? (
          <Button asChild>
            <Link href={trackHref}>
              <LineChart />
              Go to Track
            </Link>
          </Button>
        ) : null}

        <Button
          variant={!isAssigned ? "outline" : "default"}
          onClick={handleManualCheck}
          disabled={isChecking}
        >
          <RefreshCcw />
          {isChecking ? "Checking..." : isAssigned ? "Check approval status" : "I've been assigned"}
        </Button>

        <Button
          variant="ghost"
          onClick={handleSwitchAccount}
          disabled={isSigningOut}
        >
          <LogOut />
          {isSigningOut ? "Switching..." : "Switch account"}
        </Button>
      </div>

      {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
    </main>
  )
}
