"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase/client"

type BroadcastFeedbackLiveRefreshProps = {
  broadcastIds: string[]
}

export default function BroadcastFeedbackLiveRefresh({
  broadcastIds,
}: BroadcastFeedbackLiveRefreshProps) {
  useEffect(() => {
    if (!broadcastIds.length) return

    let refreshTimer: ReturnType<typeof setTimeout> | null = null

    const refreshSummary = async () => {
      const ids = broadcastIds.join(",")
      const response = await fetch(
        `/api/admin/broadcast-feedback/summary?ids=${encodeURIComponent(ids)}`
      )
      if (!response.ok) return

      const summary = await response.json()
      window.dispatchEvent(
        new CustomEvent("wiseweb:broadcast-feedback-summary", { detail: summary })
      )
    }

    const scheduleRefresh = () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer)
      }

      refreshTimer = setTimeout(() => {
        void refreshSummary()
      }, 150)
    }

    const channel = supabase
      .channel("admin-broadcast-feedback")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "broadcast_feedback",
        },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "broadcast_feedback",
        },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "broadcast_feedback",
        },
        scheduleRefresh
      )
      .subscribe()

    const pollInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return
      }
      void refreshSummary()
    }, 30_000)

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer)
      }
      if (pollInterval) {
        clearInterval(pollInterval)
      }
      void supabase.removeChannel(channel)
    }
  }, [broadcastIds])

  return null
}
