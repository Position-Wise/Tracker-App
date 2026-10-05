"use client"

import { AlertTriangle, CheckCircle2, Sparkles, type LucideIcon } from "lucide-react"
import { AnalyticsSection } from "@track/components/analytics/analytics-section"
import type { Insight, InsightTone } from "@track/lib/analytics"
import { cn } from "@/lib/utils"

const TONE: Record<InsightTone, { icon: LucideIcon; className: string }> = {
  warning: {
    icon: AlertTriangle,
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  neutral: {
    icon: Sparkles,
    className: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  },
  positive: {
    icon: CheckCircle2,
    className: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  },
}

export function AnalyticsInsights({
  insights,
  className,
}: {
  insights: Insight[]
  className?: string
}) {
  return (
    <AnalyticsSection
      id="insights"
      index={8}
      title="Insights"
      question="What does Wise Track notice?"
      className={className}
    >
      {insights.length === 0 ? (
        <div className="rounded-2xl bg-secondary/40 px-4 py-8 text-center text-sm text-muted-foreground">
          Log a few more transactions and Wise Track will start spotting
          patterns.
        </div>
      ) : (
        <ul className="grid gap-2.5 @2xl:grid-cols-2">
          {insights.map((insight) => {
            const tone = TONE[insight.tone]
            const Icon = tone.icon
            return (
              <li
                key={insight.id}
                className="track-panel-elevated flex items-start gap-3 px-3.5 py-3"
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                    tone.className
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug">{insight.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {insight.body}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </AnalyticsSection>
  )
}
