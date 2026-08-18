"use client"

import { useState } from "react"
import {
  buildMonthCompare,
  type MonthCompareSnapshot,
} from "@track/lib/insight-series"
import { useTrackMoney } from "@track/components/track-privacy-provider"
import type { InsightLedgerPoint } from "@track/lib/types"
import { cn } from "@/lib/utils"

type PulseRange = "weekly" | "monthly"

type AccountsActivityPulseProps = {
  monthKey: string
  currency: string
  ledger: InsightLedgerPoint[]
  className?: string
}

function DotColumn({
  value,
  active,
}: {
  value: number
  active?: boolean
}) {
  const count = Math.max(1, Math.round(value * 9))
  return (
    <div className="flex h-16 flex-col-reverse items-center gap-0.5">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={cn(
            "size-1.25 rounded-full",
            active ? "bg-primary" : "bg-muted-foreground/25"
          )}
        />
      ))}
    </div>
  )
}

export function AccountsActivityPulse({
  monthKey,
  currency,
  ledger,
  className,
}: AccountsActivityPulseProps) {
  const [range, setRange] = useState<PulseRange>("monthly")
  const { formatMoney } = useTrackMoney()

  const snapshot = buildMonthCompare(monthKey, ledger)
  const weekly = buildMonthCompare(monthKey, ledger, 5)

  const active: MonthCompareSnapshot =
    range === "weekly"
      ? {
          ...weekly,
          prevBars: weekly.prevBars.slice(-5),
          currBars: weekly.currBars.slice(-5),
        }
      : snapshot

  const metric =
    active.changePct == null
      ? formatMoney(active.currTotal, currency)
      : `${active.changePct > 0 ? "+" : ""}${active.changePct}%`

  return (
    <div
      className={cn(
        "mt-auto rounded-2xl border border-border/80 bg-secondary/30 px-4 py-3.5",
        className
      )}
    >
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Spend
        </p>
        <p className="text-xl font-semibold tracking-tight tabular-nums">
          {metric}
        </p>
      </div>

      <div className="flex items-end gap-3">
        <div className="flex min-h-16 flex-1 items-end justify-between gap-1 opacity-50">
          {active.prevBars.map((value, index) => (
            <DotColumn key={`prev-${index}`} value={value} />
          ))}
        </div>
        <div className="flex flex-1 items-end justify-between gap-1">
          {active.currBars.map((value, index) => (
            <DotColumn key={`curr-${index}`} value={value} active />
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[11px] font-medium tracking-wide">
        <p className="text-muted-foreground/70">
          {active.prevLabel}{" "}
          <span className="tabular-nums">
            {formatMoney(active.prevTotal, currency)}
          </span>
        </p>

        <div className="flex items-center gap-2.5 uppercase">
          {(["weekly", "monthly"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRange(item)}
              className={cn(
                "transition-colors",
                range === item
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item}
            </button>
          ))}
        </div>

        <p className="text-right text-foreground">
          {active.currLabel}{" "}
          <span className="tabular-nums">
            {formatMoney(active.currTotal, currency)}
          </span>
        </p>
      </div>
    </div>
  )
}
