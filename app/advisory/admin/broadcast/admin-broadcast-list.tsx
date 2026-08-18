"use client"

import { useCallback, useEffect, useState } from "react"
import {
  formatBroadcastDate,
  getBroadcastAuthorName,
  toBroadcastAudienceLabel,
  toDurationLabel,
} from "@advisory/admin/helpers"
import BroadcastCardActions from "./broadcast-card-actions"
import { isBroadcastExpired, resolveExpiryOptionFromDuration } from "@advisory/lib/broadcast-audience"
import type { BroadcastRow } from "../types"

type FeedbackSummary = Record<
  string,
  {
    profit: number
    loss: number
    total: number
    efficiency: number
  }
>

type AdminBroadcastListProps = {
  broadcasts: BroadcastRow[]
  initialFeedbackSummary: FeedbackSummary
  userOptions: { id: string; label: string }[]
}

export default function AdminBroadcastList({
  broadcasts,
  initialFeedbackSummary,
  userOptions,
}: AdminBroadcastListProps) {
  const [feedbackSummary, setFeedbackSummary] = useState(initialFeedbackSummary)

  useEffect(() => {
    setFeedbackSummary(initialFeedbackSummary)
  }, [initialFeedbackSummary])

  const refreshFeedbackSummary = useCallback(async () => {
    if (!broadcasts.length) return

    const ids = broadcasts.map((broadcast) => broadcast.id).join(",")
    const response = await fetch(`/api/admin/broadcast-feedback/summary?ids=${encodeURIComponent(ids)}`)
    if (!response.ok) return

    const payload = (await response.json()) as FeedbackSummary
    setFeedbackSummary(payload)
  }, [broadcasts])

  useEffect(() => {
    const onSummaryUpdate = (event: Event) => {
      const detail = (event as CustomEvent<FeedbackSummary>).detail
      if (detail && typeof detail === "object") {
        setFeedbackSummary(detail)
        return
      }
      void refreshFeedbackSummary()
    }

    window.addEventListener("wiseweb:broadcast-feedback-summary", onSummaryUpdate)
    return () => window.removeEventListener("wiseweb:broadcast-feedback-summary", onSummaryUpdate)
  }, [refreshFeedbackSummary])

  if (!broadcasts.length) {
    return (
      <p className="text-sm text-muted-foreground">No broadcast has been published yet.</p>
    )
  }

  return (
    <div className="space-y-3">
      {broadcasts.map((broadcast) => {
        const stats = feedbackSummary[broadcast.id] ?? {
          profit: 0,
          loss: 0,
          total: 0,
          efficiency: 0,
        }

        return (
          <article
            key={broadcast.id}
            className="rounded-lg border border-border/70 bg-muted/30 p-4"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                Profit: {stats.profit}
              </span>
              <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs text-red-700">
                Loss: {stats.loss}
              </span>
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                Efficiency: {stats.efficiency}%
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {toBroadcastAudienceLabel({
                  audience: broadcast.audience,
                  audience_type: broadcast.audience_type ?? null,
                  target_user_ids: broadcast.target_user_ids ?? null,
                })}
              </p>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
                {toDurationLabel(broadcast.duration ?? null)}
              </p>
              {broadcast.expires_at && isBroadcastExpired(broadcast.expires_at) ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                  Expired
                </span>
              ) : null}
              <span className="text-xs text-muted-foreground/70">
                {formatBroadcastDate(broadcast.created_at)}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold">{broadcast.title || "Broadcast"}</p>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
              {broadcast.message}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Posted by {getBroadcastAuthorName(broadcast.profiles) || "Admin"}
            </p>
            <BroadcastCardActions
              broadcast={{
                id: broadcast.id,
                audience: broadcast.audience,
                audience_type: broadcast.audience_type ?? null,
                target_user_ids: broadcast.target_user_ids ?? null,
                broadcast_type: broadcast.broadcast_type ?? "investment",
                duration: broadcast.duration ?? "forever",
                expiry_option: resolveExpiryOptionFromDuration(broadcast.duration ?? "forever"),
                title: broadcast.title,
                message: broadcast.message,
              }}
              userOptions={userOptions}
            />
          </article>
        )
      })}
    </div>
  )
}
