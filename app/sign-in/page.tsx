"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getOAuthCallbackUrl } from "@/lib/dev-app-origin";
import { supabase } from "@/lib/supabase/client";
import { AuthProvider, useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
function SignInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const authError = searchParams.get("error") === "auth_callback_failed";

  useEffect(() => {
    if (loading || !user) return;

    let cancelled = false;
    (async () => {
      const response = await fetch("/api/auth/post-login-redirect", { credentials: "include" });
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
  }, [loading, router, user]);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getOAuthCallbackUrl(),
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold text-center">Sign In</h1>

        {authError ? (
          <p className="text-sm text-destructive text-center">
            Sign-in could not be completed. Clear cookies for this site and try again.
          </p>
        ) : null}

        <Button variant={"default"} onClick={handleGoogleLogin} className="w-full">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
              fill="currentColor"
            />
          </svg>
          Continue with Google
        </Button>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <AuthProvider>
      <Suspense fallback={<div className="min-h-screen" />}>
        <SignInPageContent />
      </Suspense>
    </AuthProvider>
  )
}
