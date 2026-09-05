"use client";

import { useMemo, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  type PieSectorShapeProps,
} from "recharts";
import { useTrackMoney } from "@track/components/track-privacy-provider";
import type { CategorySpendSlice } from "@track/lib/expense-browse";
import { formatDayHeading } from "@track/lib/month";
import {
  colorSpendSlices,
  type ColoredSpendSlice,
} from "@track/lib/spend-slices";
import { cn } from "@/lib/utils";

const ARC_CORNER_RADIUS = 6;
const EMPTY_RING = [{ value: 1 }];

const SPEND_ARC_SURFACE = {
  gradient:
    "linear-gradient(165deg, #1e2f4a 0%, #2a4064 45%, #355278 55%, #2a4064 100%)",
  glow: "rgba(42, 64, 100, 0.35)",
  sheen: "rgba(255,255,255,0.12)",
};

function roundedCornerRadius({
  innerRadius = 0,
  outerRadius = 0,
  startAngle = 0,
  endAngle = 0,
}: PieSectorShapeProps): number {
  const deltaRadius = outerRadius - innerRadius;
  if (deltaRadius <= 0) return 0;

  const angleSpan = Math.abs(endAngle - startAngle);
  const midRadius = (innerRadius + outerRadius) / 2;
  const arcLength = ((angleSpan * Math.PI) / 180) * midRadius;
  const maxByArc = arcLength / 4;
  const maxByThickness = deltaRadius / 2;

  return Math.min(ARC_CORNER_RADIUS, maxByArc, maxByThickness);
}

function RoundedArcSector(props: PieSectorShapeProps) {
  const cornerRadius = roundedCornerRadius(props);

  return (
    <Sector {...props} cornerRadius={cornerRadius} forceCornerRadius />
  );
}

type DaySpendArcProps = {
  dateKey: string;
  currency: string;
  total: number;
  count: number;
  slices: CategorySpendSlice[];
};

export function DaySpendArc({
  dateKey,
  currency,
  total,
  count,
  slices: rawSlices,
}: DaySpendArcProps) {
  const { formatMoney } = useTrackMoney();
  const [activeId, setActiveId] = useState<string | null>(null);
  const slices = useMemo(
    () => colorSpendSlices(rawSlices, total),
    [rawSlices, total],
  );
  const active = slices.find((slice) => slice.categoryId === activeId) ?? null;
  const heading = formatDayHeading(dateKey);

  return (
    <section
      className="relative overflow-hidden rounded-[1.75rem] p-5 text-white shadow-xl sm:p-6"
      style={{
        background: SPEND_ARC_SURFACE.gradient,
        boxShadow: `0 24px 48px -12px ${SPEND_ARC_SURFACE.glow}`,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(circle at 30% 15%, ${SPEND_ARC_SURFACE.sheen}, transparent 52%)`,
        }}
      />

      <div className="relative">
        <div className="flex w-full items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-white/50">Visual breakdown</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">
            See how you spent {heading.toLowerCase()}
          </h2>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-semibold leading-tight tracking-tight tabular-nums">
            {formatMoney(active?.total ?? total, currency)}
          </p>
          <p className="mt-0.5 text-[11px] text-white/50">
            {active
              ? `${active.name} · ${active.pct}%`
              : count === 0
                ? "No spend"
                : `${count} ${count === 1 ? "expense" : "expenses"}`}
          </p>
        </div>
      </div>

      <div className="mt-4 flex w-full items-center gap-4 sm:gap-5 lg:gap-8">
        <div className="relative h-48 w-24 shrink-0 sm:h-40 sm:w-20 lg:hidden">
          <Donut
            slices={slices}
            activeId={activeId}
            onActiveChange={setActiveId}
            align="left"
          />
        </div>
        <div className="relative hidden aspect-2/1 w-64 shrink-0 lg:block lg:w-md">
          <Donut
            slices={slices}
            activeId={activeId}
            onActiveChange={setActiveId}
            align="top"
          />
        </div>

        <div className="min-w-0 flex-1">
          <ul className="w-full space-y-1.5">
            {slices.length === 0 ? (
              <li className="text-sm text-white/50">
                No expenses this day yet.
              </li>
            ) : (
              slices.map((slice) => {
                const selected = activeId === slice.categoryId;
                return (
                  <li key={slice.categoryId} className="w-full">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveId(selected ? null : slice.categoryId)
                      }
                      className={cn(
                        "flex w-full min-w-0 items-center justify-between gap-3 rounded-lg py-0.5 text-left transition-colors",
                        selected
                          ? "text-white"
                          : "text-white/70 hover:text-white",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span
                          className="flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-(--brand-navy)"
                          style={{ backgroundColor: slice.color }}
                        >
                          {slice.name.charAt(0)}
                        </span>
                        <span className="truncate text-sm">{slice.name}</span>
                      </span>
                      <span className="shrink-0 text-right text-sm tabular-nums text-white/80">
                        {formatMoney(slice.total, currency)}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
      </div>
    </section>
  );
}

function Donut({
  slices,
  activeId,
  onActiveChange,
  align,
}: {
  slices: ColoredSpendSlice[];
  activeId: string | null;
  onActiveChange: (id: string | null) => void;
  align: "left" | "top";
}) {
  const pieProps =
    align === "top"
      ? { startAngle: 180, endAngle: 0, cx: "50%", cy: "100%" }
      : { startAngle: 90, endAngle: -90, cx: "0%", cy: "50%" };

  return (
    <div className="absolute inset-0" role="img" aria-label="Spend by category">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          {slices.length === 0 ? (
            <Pie
              data={EMPTY_RING}
              dataKey="value"
              {...pieProps}
              innerRadius="145%"
              outerRadius="190%"
              fill="rgba(255,255,255,0.12)"
              stroke="none"
              isAnimationActive={false}
            />
          ) : (
            <Pie
              data={slices}
              dataKey="total"
              nameKey="name"
              {...pieProps}
              innerRadius="145%"
              outerRadius="190%"
              paddingAngle={slices.length > 1 ? 3 : 0}
              cornerRadius={ARC_CORNER_RADIUS}
              shape={RoundedArcSector}
              stroke="none"
              isAnimationActive
            >
              {slices.map((slice) => {
                const dimmed =
                  activeId != null && activeId !== slice.categoryId;
                return (
                  <Cell
                    key={slice.categoryId}
                    fill={slice.color}
                    fillOpacity={dimmed ? 0.28 : 1}
                    style={{ cursor: "pointer", outline: "none" }}
                    onClick={() =>
                      onActiveChange(
                        activeId === slice.categoryId ? null : slice.categoryId,
                      )
                    }
                  />
                );
              })}
            </Pie>
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
