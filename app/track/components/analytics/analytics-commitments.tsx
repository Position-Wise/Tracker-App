"use client"

import Link from "next/link"
import {
  CreditCard,
  Landmark,
  Repeat,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { AnalyticsSection } from "@track/components/analytics/analytics-section"
import { useTrackMoney } from "@track/components/track-privacy-provider"
import type {
  AccountActivity,
  RecurringItem,
  RecurringStatus,
} from "@track/lib/analytics"
import { buildExpensesHref } from "@track/lib/expense-browse"
import type { MoneySourceKind } from "@track/lib/money-sources"
import { cn } from "@/lib/utils"

const KIND_ICON: Record<MoneySourceKind, LucideIcon> = {
  cash: Wallet,
  bank: Landmark,
  credit_card: CreditCard,
}

const STATUS_COPY: Record<RecurringStatus, { label: string; className: string }> = {
  paid: {
    label: "Paid",
    className: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  },
  upcoming: {
    label: "Upcoming",
    className: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  },
  pending: {
    label: "Not logged",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  skipped: {
    label: "Skipped",
    className: "bg-secondary text-muted-foreground",
  },
}

function ordinal(day: number) {
  const mod100 = day % 100
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`
  const suffix = ["th", "st", "nd", "rd"][day % 10] ?? "th"
  return `${day}${suffix}`
}

export function AnalyticsCommitments({
  monthKey,
  recurring,
  accounts,
  expenseTotal,
  currency,
  className,
}: {
  monthKey: string
  recurring: RecurringItem[]
  accounts: AccountActivity[]
  expenseTotal: number
  currency: string
  className?: string
}) {
  const { formatMoney, hidden } = useTrackMoney()
  const committed = recurring.reduce((sum, r) => sum + r.amount, 0)
  const share =
    expenseTotal > 0 ? Math.round((committed / expenseTotal) * 100) : null

  return (
    <AnalyticsSection
      id="commitments"
      index={7}
      title="Recurring + Account Activity"
      question="What commitments and accounts are driving it?"
      className={className}
    >
      <div className="grid gap-6 @2xl:grid-cols-2">
        <div className="min-w-0">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Recurring commitments</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">
                {formatMoney(Math.round(committed), currency)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  / month
                </span>
              </p>
            </div>
            {share != null && committed > 0 && !hidden ? (
              <p className="text-xs text-muted-foreground">
                {share}% of this month&apos;s spend
              </p>
            ) : null}
          </div>

          {recurring.length === 0 ? (
            <div className="rounded-2xl bg-secondary/40 px-4 py-6 text-center text-sm text-muted-foreground">
              No repeating payments spotted yet. Expenses with the same note or
              amount across months show up here.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {recurring.slice(0, 7).map((item) => {
                const status = STATUS_COPY[item.status]
                return (
                  <li key={item.key} className="flex items-center gap-3 py-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                      <Repeat className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {item.categoryName} · around the {ordinal(item.typicalDay)} ·{" "}
                        {item.monthsSeen} months
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {formatMoney(Math.round(item.amount), currency)}
                      </p>
                      <span
                        className={cn(
                          "mt-0.5 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                          status.className
                        )}
                      >
                        {status.label}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="min-w-0">
          <p className="mb-3 text-xs text-muted-foreground">Account activity this month</p>
          {accounts.length === 0 ? (
            <div className="rounded-2xl bg-secondary/40 px-4 py-6 text-center text-sm text-muted-foreground">
              Add an account to see where money moves.
            </div>
          ) : (
            <ul className="space-y-2">
              {accounts.map((row) => (
                <AccountRow
                  key={row.source.id}
                  row={row}
                  monthKey={monthKey}
                  currency={currency}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </AnalyticsSection>
  )
}

function AccountRow({
  row,
  monthKey,
  currency,
}: {
  row: AccountActivity
  monthKey: string
  currency: string
}) {
  const { formatMoney } = useTrackMoney()
  const Icon = KIND_ICON[row.source.kind]
  const isCard = row.source.kind === "credit_card"
  const moneyIn = row.received + row.transferIn
  const moneyOut = row.spent + row.transferOut
  const usedPct = row.utilization?.usedPct ?? null

  return (
    <li>
      <Link
        href={buildExpensesHref({ monthKey, accountId: row.source.id })}
        className="track-panel-elevated block px-3.5 py-3 transition-colors hover:bg-secondary/50"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
            <Icon className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{row.source.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {row.transactions} {row.transactions === 1 ? "transaction" : "transactions"}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold tabular-nums">
              {formatMoney(row.balance, currency)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isCard ? "owed" : "balance"}
            </p>
          </div>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px]">
          <p className="text-muted-foreground">
            In{" "}
            <span className="font-medium tabular-nums text-emerald-700 dark:text-emerald-400">
              {formatMoney(moneyIn, currency)}
            </span>
          </p>
          <p className="text-right text-muted-foreground">
            Out{" "}
            <span className="font-medium tabular-nums text-foreground">
              {formatMoney(moneyOut, currency)}
            </span>
          </p>
        </div>
        {usedPct != null ? (
          <div className="mt-2">
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full",
                  usedPct >= 70
                    ? "bg-destructive"
                    : usedPct >= 30
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                )}
                style={{ width: `${usedPct}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {Math.round(usedPct)}% of limit used
            </p>
          </div>
        ) : null}
      </Link>
    </li>
  )
}
