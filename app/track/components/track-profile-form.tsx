"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Check, ChevronLeft } from "lucide-react"
import { toast } from "sonner"
import { updateTrackPreferences } from "@track/app/actions"
import LoadingSubmitButton from "@/components/ui/loading-submit-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  TrackCapsuleCircle,
  TrackCapsuleHero,
} from "@track/components/track-capsule-hero"
import { formatMoney } from "@track/lib/month"
import type { TrackProfile } from "@track/lib/types"
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
  const [isEditingPreferences, setIsEditingPreferences] = useState(false)
  const [preferencesFormKey, setPreferencesFormKey] = useState(0)
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
    setIsEditingPreferences(false)
    setPreferencesFormKey((key) => key + 1)
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-0">
      <section>
        <TrackCapsuleHero
          overlay={
            <Link
              href="/app"
              className="absolute left-2 top-2 z-20 inline-flex items-center gap-0.5 rounded-full border border-border/80 bg-background/90 px-2.5 py-1.5 text-sm font-medium text-foreground shadow-[0_8px_20px_-10px_rgba(15,23,42,0.55)] backdrop-blur-sm transition-colors hover:bg-secondary md:left-3 md:top-3"
            >
              <ChevronLeft className="size-4" strokeWidth={2.5} />
              <span>Overview</span>
            </Link>
          }
          circle={
            <TrackCapsuleCircle>
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
            </TrackCapsuleCircle>
          }
        >
          <div className="flex items-center justify-center gap-2">
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
        </TrackCapsuleHero>

        <ul className="mt-8 divide-y divide-border/70 px-2">
          <li className="flex items-center justify-between gap-4 py-4">
            <span className="text-sm text-foreground">Income</span>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {formatMoney(monthlyIncome, currency)}
            </span>
          </li>
          <li className="flex items-center justify-between gap-4 py-4">
            <span className="text-sm text-foreground">Expense</span>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {formatMoney(totalExpense, currency)}
            </span>
          </li>
          <li className="flex items-center justify-between gap-4 py-4">
            <span className="text-sm text-foreground">Net</span>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {formatMoney(net, currency)}
            </span>
          </li>
          <li className="flex items-center justify-between gap-4 py-4">
            <span className="text-sm text-foreground">Spend vs income</span>
            <div
              className="flex h-3 items-end gap-0.75"
              role="img"
              aria-label={`${Math.round(spendRatio * 100)}% of income spent`}
            >
              {Array.from({ length: 14 }, (_, index) => {
                const filled = index / 14 < spendRatio
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
          </li>
        </ul>
      </section>

      <div className="px-2">
        <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-8">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Preferences
          </p>
          {isEditingPreferences ? (
            <Button
              type="button"
              variant="ghost"
              className="h-9 px-2 text-sm font-medium text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground hover:underline"
              onClick={() => {
                setPreferencesFormKey((key) => key + 1)
                setIsEditingPreferences(false)
              }}
            >
              Cancel
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              className="h-9 px-2 text-sm font-medium text-primary shadow-none hover:bg-transparent hover:underline"
              onClick={() => setIsEditingPreferences(true)}
            >
              Edit
            </Button>
          )}
        </div>

        {isEditingPreferences ? (
          <form key={preferencesFormKey} action={handleSubmit}>
            <div className="divide-y divide-border/70">
              <label
                htmlFor="currency"
                className="flex items-center justify-between gap-4 py-4"
              >
                <span className="text-sm text-foreground">Currency</span>
                <Input
                  id="currency"
                  name="currency"
                  defaultValue={profile.preferred_currency}
                  maxLength={3}
                  required
                  autoFocus
                  aria-label="Preferred currency"
                  className="h-auto w-20 border-0 bg-transparent p-0 text-right text-sm font-semibold uppercase shadow-none focus-visible:border-transparent focus-visible:ring-0"
                />
              </label>
              <label
                htmlFor="timezone"
                className="flex items-center justify-between gap-4 py-4"
              >
                <span className="text-sm text-foreground">Timezone</span>
                <Input
                  id="timezone"
                  name="timezone"
                  defaultValue={profile.timezone}
                  required
                  aria-label="Timezone"
                  className="h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-right text-sm font-semibold shadow-none focus-visible:border-transparent focus-visible:ring-0"
                />
              </label>
            </div>
            <div className="flex justify-end pt-2">
              <LoadingSubmitButton
                pendingText="Saving..."
                variant="ghost"
                className="h-9 px-2 text-sm font-medium text-primary shadow-none hover:bg-transparent hover:underline"
              >
                Save
              </LoadingSubmitButton>
            </div>
          </form>
        ) : (
          <div className="divide-y divide-border/70">
            <div className="flex items-center justify-between gap-4 py-4">
              <span className="text-sm text-foreground">Currency</span>
              <span className="text-sm font-semibold uppercase text-foreground">
                {profile.preferred_currency}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <span className="text-sm text-foreground">Timezone</span>
              <span className="truncate text-sm font-semibold text-foreground">
                {profile.timezone}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
