"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { updateTrackPreferences } from "@/app/app/actions"
import LoadingSubmitButton from "@/components/ui/loading-submit-button"
import { Input } from "@/components/ui/input"
import type { TrackProfile } from "@/lib/track/types"

type TrackProfileFormProps = {
  profile: TrackProfile
  displayName: string
  email: string
}

export function TrackProfileForm({
  profile,
  displayName,
  email,
}: TrackProfileFormProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {displayName} · {email}
        </p>
      </div>

      <form
        action={handleSubmit}
        className="max-w-md space-y-4 rounded-xl border border-border bg-card p-6"
      >
        <div className="space-y-1.5">
          <label htmlFor="currency" className="text-sm font-medium">
            Preferred currency
          </label>
          <Input
            id="currency"
            name="currency"
            defaultValue={profile.preferred_currency}
            maxLength={3}
            required
            className="uppercase"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="timezone" className="text-sm font-medium">
            Timezone
          </label>
          <Input
            id="timezone"
            name="timezone"
            defaultValue={profile.timezone}
            required
          />
        </div>
        <LoadingSubmitButton pendingText="Saving...">Save preferences</LoadingSubmitButton>
      </form>
    </div>
  )
}
