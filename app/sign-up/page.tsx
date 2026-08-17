"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { persistAuthIntent, sanitizeAuthNext } from "@/lib/auth-intent"
import { getOAuthCallbackUrl } from "@/lib/dev-app-origin"
import { supabase } from "@/lib/supabase/client"
import { BrandLogoLink } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { FormError } from "@/components/ui/form-error"
import { Input } from "@/components/ui/input"
import { PageLoading } from "@/components/ui/page-loading"
import { isOnTrackPlatformHost } from "@/lib/track-platform-url"

function SignUpPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = sanitizeAuthNext(searchParams.get("next"))
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<"email" | "google" | null>(null)
  const trackIntent = isOnTrackPlatformHost() || next === "/app"

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError("Enter your email address.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    setPending("email")
    persistAuthIntent(trackIntent ? "track" : "advisory")
    const { error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo: getOAuthCallbackUrl(next),
      },
    })

    setPending(null)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    router.push("/sign-up/thanks")
  }

  const handleGoogle = async () => {
    setError(null)
    setPending("google")
    persistAuthIntent(trackIntent ? "track" : "advisory")
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getOAuthCallbackUrl(next),
      },
    })
    if (oauthError) {
      setPending(null)
      setError(oauthError.message)
    }
  }

  const emailInvalid = Boolean(error && !email.trim())
  const passwordInvalid = Boolean(error && password.length < 8)

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-6">
        <BrandLogoLink href="/" className="mx-auto" logoClassName="h-8 w-auto" />
        <h1 className="text-center text-2xl font-semibold">
          {trackIntent ? "Start tracking free" : "Create Account"}
        </h1>

        <form className="space-y-4" onSubmit={handleSignUp} noValidate>
          <div className="space-y-1">
            <label htmlFor="signup-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              aria-invalid={emailInvalid}
              aria-describedby={error ? "signup-error" : undefined}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="signup-password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              aria-invalid={passwordInvalid}
              aria-describedby={error ? "signup-error" : undefined}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <FormError id="signup-error">{error}</FormError>

          <Button type="submit" className="w-full" disabled={pending !== null}>
            {pending === "email" ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <Button
          variant="outline"
          onClick={handleGoogle}
          className="w-full"
          disabled={pending !== null}
        >
          {pending === "google" ? "Redirecting..." : "Continue with Google"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href={next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in"} className="text-foreground underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading sign up" />}>
      <SignUpPageContent />
    </Suspense>
  )
}
