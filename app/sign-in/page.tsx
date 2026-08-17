"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { persistAuthIntent, sanitizeAuthNext } from "@/lib/auth-intent";
import { getOAuthCallbackUrl } from "@/lib/dev-app-origin";
import { supabase } from "@/lib/supabase/client";
import { AuthProvider, useAuth } from "@/components/providers/auth-provider";
import { BrandLogoLink } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { PageLoading } from "@/components/ui/page-loading";
import { isOnTrackPlatformHost } from "@/lib/track-platform-url";

function SignInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const authError = searchParams.get("error") === "auth_callback_failed";
  const next = sanitizeAuthNext(searchParams.get("next"));
  const [error, setError] = useState<string | null>(
    authError
      ? "Sign-in could not be completed. Clear cookies for this site and try again."
      : null,
  );
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (loading || !user) return;

    let cancelled = false;
    (async () => {
      const query = next ? `?next=${encodeURIComponent(next)}` : "";
      const response = await fetch(`/api/auth/post-login-redirect${query}`, {
        credentials: "include",
      });
      if (!response.ok || cancelled) return;
      const body = (await response.json()) as { url?: string | null };
      const url = body.url;
      if (!url || cancelled) return;
      if (url.startsWith("http://") || url.startsWith("https://")) {
        window.location.replace(url);
      } else {
        router.replace(url);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, next, router, user]);

  const handleGoogleLogin = async () => {
    setError(null);
    setPending(true);
    persistAuthIntent(isOnTrackPlatformHost() || next === "/app" ? "track" : "advisory");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getOAuthCallbackUrl(next),
      },
    });
    if (oauthError) {
      setPending(false);
      setError(oauthError.message);
    }
  };

  if (loading || user) {
    return <PageLoading label="Signing you in" />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-6">
        <BrandLogoLink href="/" className="mx-auto" logoClassName="h-8 w-auto" />
        <h1 className="text-center text-2xl font-semibold">Sign In</h1>

        <FormError>{error}</FormError>

        <Button
          variant="default"
          onClick={handleGoogleLogin}
          className="w-full"
          disabled={pending}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
              fill="currentColor"
            />
          </svg>
          {pending ? "Redirecting..." : "Continue with Google"}
        </Button>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoading label="Loading sign in" />}>
        <SignInPageContent />
      </Suspense>
    </AuthProvider>
  );
}
