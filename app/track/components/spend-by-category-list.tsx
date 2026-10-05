"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useTrackMoney } from "@track/components/track-privacy-provider"

type SpendRow = {
  categoryId: string
  name: string
  total: number
}

type SpendByCategoryListProps = {
  rows: SpendRow[]
  expenseTotal: number
  currency: string
  href?: string
  linkLabel?: string
}

export function SpendByCategoryList({
  rows,
  expenseTotal,
  currency,
  href,
  linkLabel = "View all",
}: SpendByCategoryListProps) {
  const { formatMoney } = useTrackMoney()
  const top = rows.slice(0, 4)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Spend by category</p>
        {href ? (
          <Button
            asChild
            variant="ghost"
            size="xs"
            className="text-muted-foreground"
          >
            <Link href={href}>{linkLabel}</Link>
          </Button>
        ) : null}
      </div>
      {top.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No spending recorded for this month yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {top.map((row) => {
            const pct =
              expenseTotal > 0
                ? Math.round((row.total / expenseTotal) * 100)
                : 0
            return (
              <li key={row.categoryId} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span>{row.name}</span>
                  <span className="font-medium tabular-nums">
                    {formatMoney(row.total, currency)}
                    <span className="ml-2 text-muted-foreground">{pct}%</span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
