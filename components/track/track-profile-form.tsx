"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Check } from "lucide-react"
import { toast } from "sonner"
import { updateTrackPreferences } from "@/app/app/actions"
import LoadingSubmitButton from "@/components/ui/loading-submit-button"
import { Input } from "@/components/ui/input"
import { formatMoney } from "@/lib/track/month"
import type { TrackProfile } from "@/lib/track/types"
import { cn } from "@/lib/utils"

type TrackProfileFormProps = {
  profile: TrackProfile
  displayName: string
  email: string
  avatarUrl: string | null
  monthlyIncome: number
  totalExpense: number
  currency: string
  trackingSince: string
}

function formatTrackingSince(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" })
}

export function TrackProfileForm({
  profile,
  displayName,
  email,
  avatarUrl,
  monthlyIncome,
  totalExpense,
  currency,
  trackingSince,
}: TrackProfileFormProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const initials = (displayName || email || "M").charAt(0).toUpperCase()
  const sinceLabel = formatTrackingSince(trackingSince)
  const net = monthlyIncome - totalExpense
  const spendRatio =
    monthlyIncome > 0
      ? Math.min(totalExpense / monthlyIncome, 1)
      : totalExpense > 0
        ? 1
        : 0

  async function handleSubmit(formData: FormData) {
    const result = await updateTrackPreferences(formData)
    if (!result.ok) {
      toast.error(result.error ?? "Could not save")
      return
    }
    toast.success("Preferences saved")
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-6">
      <article className="overflow-hidden rounded-4xl border border-border/60 bg-card shadow-[0_22px_60px_-32px_rgba(15,23,42,0.45)]">
        <div className="relative px-5 pb-6 pt-4 sm:px-6 sm:pt-5">
          <div className="mb-3 flex justify-end">
            <Link
              href="/app"
              className="relative z-10 rounded-full border border-border/80 bg-background px-3.5 py-1.5 text-sm font-semibold text-foreground shadow-[0_8px_20px_-10px_rgba(15,23,42,0.55)] transition-colors hover:bg-secondary"
            >
              Overview
            </Link>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-full border-[5px] border-card bg-muted shadow-sm ring-1 ring-border/40 sm:size-28">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="112px"
                  priority
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-secondary text-3xl font-semibold text-muted-foreground">
                  {initials}
                </div>
              )}
            </div>

            <div className="mb-2 min-w-0 flex-1 pb-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Spend vs income
              </p>
              <div
                className="mt-2 flex h-3 items-end gap-0.75"
                role="img"
                aria-label={`${Math.round(spendRatio * 100)}% of income spent`}
              >
                {Array.from({ length: 18 }, (_, index) => {
                  const filled = index / 18 < spendRatio
                  return (
                    <span
                      key={index}
                      className={cn(
                        "w-0.75 rounded-full",
                        filled
                          ? "bg-[linear-gradient(180deg,#3b82f6,#22c55e)]"
                          : "bg-border"
                      )}
                      style={{ height: `${10 + (index % 4) * 2}px` }}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {displayName}
              </h1>
              <span
                className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"
                title="Signed in with Google"
                aria-label="Verified account"
              >
                <Check className="size-3" strokeWidth={3} />
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {sinceLabel
                ? `Tracking expenses since ${sinceLabel}`
                : email || "Your Track profile"}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 divide-x divide-border/70 border-t border-border/70 pt-5 text-center">
            <div className="px-1.5 sm:px-2">
              <p className="truncate text-sm font-bold tabular-nums text-foreground sm:text-base">
                {formatMoney(monthlyIncome, currency)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Income</p>
            </div>
            <div className="px-1.5 sm:px-2">
              <p className="truncate text-sm font-bold tabular-nums text-foreground sm:text-base">
                {formatMoney(totalExpense, currency)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Expense</p>
            </div>
            <div className="px-1.5 sm:px-2">
              <p className="truncate text-sm font-bold tabular-nums text-foreground sm:text-base">
                {formatMoney(net, currency)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Net</p>
            </div>
          </div>
        </div>
      </article>

      <form
        action={handleSubmit}
        className="overflow-hidden rounded-4xl border border-border/60 bg-card shadow-[0_22px_60px_-32px_rgba(15,23,42,0.45)]"
      >
        <div className="border-b border-border/70 px-5 py-4 sm:px-6">
          <h2 className="text-base font-bold tracking-tight text-foreground">
            Preferences
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Currency and timezone for your Track totals
          </p>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
          <div className="space-y-2">
            <label
              htmlFor="currency"
              className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
            >
              Preferred currency
            </label>
            <Input
              id="currency"
              name="currency"
              defaultValue={profile.preferred_currency}
              maxLength={3}
              required
              className="h-11 rounded-2xl border-border/80 bg-background px-4 uppercase shadow-none"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="timezone"
              className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
            >
              Timezone
            </label>
            <Input
              id="timezone"
              name="timezone"
              defaultValue={profile.timezone}
              required
              className="h-11 rounded-2xl border-border/80 bg-background px-4 shadow-none"
            />
          </div>

          <LoadingSubmitButton
            pendingText="Saving..."
            className="h-11 w-full rounded-full shadow-[0_8px_20px_-12px_rgba(15,23,42,0.55)] sm:w-auto sm:px-6"
          >
            Save preferences
          </LoadingSubmitButton>
        </div>
      </form>
    </div>
  )
}
