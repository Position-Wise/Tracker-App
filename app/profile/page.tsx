import Link from "next/link"
import { redirect } from "next/navigation"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import AskAdminDialog from "@advisory/components/inquiries/ask-admin-dialog"
import PaymentProofPreview from "@advisory/components/subscription/payment-proof-preview"
import { Button } from "@/components/ui/button"
import { TrackProfileForm } from "@track/components/track-profile-form"
import { getCurrentUserAccessState } from "@advisory/lib/subscription-access"
import { getCachedCurrentUserAccess } from "@/lib/cached-access"
import { getSubdomain } from "@/lib/get-subdomain"
import { TRACK_PLATFORM_SUBDOMAIN } from "@/lib/reserved-subdomains"
import { resolveRoute } from "@/lib/route-access"
import { resolveTenantRedirectUrl } from "@/lib/tenant-redirect"
import {
  getAccessStateLabel,
  getMemberHomePathForState,
} from "@advisory/lib/subscription-status"
import { toMonthKey } from "@track/lib/month"
import {
  ensureTrackProfile,
  getFirstExpenseAt,
  getMonthSummary,
  listIncomesForMonth,
} from "@track/lib/queries"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

function normalizePlanLabel(value: string | null | undefined) {
  const normalized = (value ?? "").trim().toLowerCase()
  if (normalized === "growth") return "pro"
  if (normalized === "elite") return "premium"
  return normalized || null
}

export default async function ProfilePage() {
  const subdomain = await getSubdomain()

  if (subdomain === TRACK_PLATFORM_SUBDOMAIN) {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect("/sign-in")

    const profile = await ensureTrackProfile(supabase, user.id)
    const monthKey = toMonthKey()
    const [summary, incomes, firstExpenseAt] = await Promise.all([
      getMonthSummary(
        supabase,
        user.id,
        monthKey,
        profile.preferred_currency
      ),
      listIncomesForMonth(supabase, user.id, monthKey),
      getFirstExpenseAt(supabase, user.id),
    ])
    const incomeTotal = incomes.reduce((sum, row) => sum + row.amount, 0)
    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Member"
    const avatarUrl =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null
    const trackingSince = firstExpenseAt ?? user.created_at

    return (
      <div className="mx-auto w-full max-w-lg px-3 pb-28 md:px-6 md:pb-12">
        <TrackProfileForm
          profile={profile}
          displayName={displayName}
          email={user.email ?? ""}
          avatarUrl={avatarUrl}
          monthlyIncome={incomeTotal}
          totalExpense={summary.total}
          currency={profile.preferred_currency}
          trackingSince={trackingSince}
        />
      </div>
    )
  }

  const routeAccess = await getCachedCurrentUserAccess()
  const tenantRedirect = await resolveTenantRedirectUrl(routeAccess)
  if (tenantRedirect) {
    redirect(tenantRedirect)
  }
  const routeRedirect = resolveRoute(routeAccess)

  if (routeRedirect) {
    redirect(routeRedirect)
  }

  const access = await getCurrentUserAccessState()
  const user = access.user

  if (!user) {
    redirect("/sign-in")
  }

  const avatarUrl =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture

  const plan = normalizePlanLabel(access.planName)
  const proof = access.subscription?.payment_proof ?? null
  const submittedAt = access.subscription?.submitted_at
  const memberHomePath = getMemberHomePathForState(access.accessState)

  const formattedSubmittedAt = submittedAt
    ? new Date(submittedAt).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })
    : null

  return (
    <div className="min-h-screen bg-background p-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-semibold">
          Profile
        </h1>

        <div className="rounded-xl border border-border bg-card p-8 space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={avatarUrl}
                alt={user.user_metadata?.full_name || user.email || "Member avatar"}
              />
              <AvatarFallback>
                {user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div>
              <p className="text-lg font-medium">
                {user.user_metadata?.full_name || "Member"}
              </p>
              <p className="text-muted-foreground text-sm">
                {user.email}
              </p>
            </div>
          </div>

          <div className="grid gap-4 text-sm">
            <div className="flex justify-between border-b border-border pb-3">
              <span className="text-muted-foreground">Tier</span>
              <span className="font-medium capitalize">
                {plan || "Not selected"}
              </span>
            </div>

            <div className="flex justify-between border-b border-border pb-3">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">
                {getAccessStateLabel(access.accessState)}
              </span>
            </div>

            <div className="flex justify-between border-b border-border pb-3">
              <span className="text-muted-foreground">Submitted</span>
              <span className="font-medium">
                {formattedSubmittedAt || "Not submitted"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Payment proof</span>
              {proof ? (
                <PaymentProofPreview
                  paymentProof={proof}
                  memberLabel={user.email ?? "Submitted payment proof"}
                  thumbClassName="h-12 w-12"
                />
              ) : (
                <span className="font-medium">
                  Not uploaded
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              <Button asChild>
                <Link href={memberHomePath}>
                  {access.accessState === "approved"
                    ? "Go to dashboard"
                    : access.accessState === "waiting"
                      ? "View approval status"
                      : access.accessState === "blocked"
                        ? "Resubmit subscription"
                        : "Complete subscription"}
                </Link>
              </Button>

              <AskAdminDialog />
              {!proof && access.accessState !== "approved" ? (
                <Button asChild variant="secondary">
                  <Link href="/subscribe?flow=payment">Complete payment</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
