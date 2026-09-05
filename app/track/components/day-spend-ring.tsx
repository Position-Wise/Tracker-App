"use client"

import type { ReactNode } from "react"
import type { ColoredSpendSlice } from "@track/lib/spend-slices"
import { cn } from "@/lib/utils"

const VIEW = 100
const CX = 50
const CY = 50

type DaySpendRingProps = {
  slices: ColoredSpendSlice[]
  total: number
  children: ReactNode
  className?: string
  /** Stroke thickness in viewBox units. Default 9. */
  strokeWidth?: number
  trackColor?: string
}

/**
 * Full category donut wrapping a date (or other) label.
 */
export function DaySpendRing({
  slices,
  total,
  children,
  className,
  strokeWidth = 9,
  trackColor = "currentColor",
}: DaySpendRingProps) {
  const r = (VIEW - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const gap = slices.length > 1 ? Math.min(3.2, circumference * 0.04) : 0

  let offset = 0
  const arcs = total > 0
    ? slices.map((slice) => {
        const share = slice.total / total
        const len = circumference * share
        const dash = Math.max(0, len - gap)
        const item = {
          id: slice.categoryId,
          color: slice.color,
          dasharray: `${dash} ${circumference - dash}`,
          dashoffset: -offset,
        }
        offset += len
        return item
      })
    : []

  return (
    <div className={cn("relative text-muted-foreground/30", className)}>
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className="absolute inset-0 size-full"
        aria-hidden
      >
        <circle
          cx={CX}
          cy={CY}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {arcs.map((arc) => (
          <circle
            key={arc.id}
            cx={CX}
            cy={CY}
            r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeDasharray={arc.dasharray}
            strokeDashoffset={arc.dashoffset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${CX} ${CY})`}
          />
        ))}
      </svg>
      <div className="relative z-10 flex size-full items-center justify-center">
        {children}
      </div>
    </div>
  )
}
