"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function AnalyticsSection({
  id,
  index,
  title,
  question,
  action,
  className,
  children,
}: {
  id: string
  index: number
  title: string
  question: string
  action?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn("@container track-panel flex min-w-0 scroll-mt-6 flex-col p-5 sm:p-6", className)}
    >
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold tabular-nums text-muted-foreground">
            {index}
          </span>
          <div className="min-w-0">
            <h2 id={`${id}-title`} className="text-base font-semibold tracking-tight">
              {title}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{question}</p>
          </div>
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

export function DeltaPill({
  change,
  invert = false,
  suffix,
  className,
}: {
  change: number | null
  /** When true, a decrease is good (e.g. spend). */
  invert?: boolean
  suffix?: string
  className?: string
}) {
  if (change == null) return null
  const up = change >= 0
  const good = invert ? !up : up
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
        change === 0
          ? "bg-secondary text-muted-foreground"
          : good
            ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
            : "bg-rose-500/12 text-rose-700 dark:text-rose-400",
        className
      )}
    >
      {change === 0 ? "→" : up ? "↑" : "↓"} {Math.abs(change)}%
      {suffix ? <span className="font-normal opacity-80"> {suffix}</span> : null}
    </span>
  )
}

export function StatTile({
  label,
  value,
  hint,
  delta,
  className,
}: {
  label: string
  value: string
  hint?: ReactNode
  delta?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("track-panel-elevated min-w-0 px-3.5 py-3", className)}>
      <p className="truncate text-xs text-muted-foreground">{label}</p>
      <p className="mt-1.5 truncate text-xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {hint || delta ? (
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          {delta}
          {hint ? <span className="truncate">{hint}</span> : null}
        </div>
      ) : null}
    </div>
  )
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-28 flex-1 items-center justify-center rounded-2xl bg-secondary/40 px-4 py-6 text-center">
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  )
}

export function SegmentedToggle<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex rounded-full border border-border bg-secondary/70 p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            value === option.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function formatCompactMoney(amount: number, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount)
  } catch {
    return `${Math.round(amount)}`
  }
}
