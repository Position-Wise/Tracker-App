"use client";

import {
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Briefcase,
  Car,
  Clapperboard,
  Gift,
  GraduationCap,
  Heart,
  House,
  Laptop,
  MoreHorizontal,
  ShoppingBag,
  Tag,
  TrendingUp,
  Utensils,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  DaySpendRing,
  nestedInnerRadius,
  ringRadiusRatio,
} from "@track/components/day-spend-ring";
import { useTrackMoney } from "@track/components/track-privacy-provider";
import {
  spendGrouped,
  type CountedSpendSlice,
} from "@track/lib/expense-browse";
import { monthActivityTotals, pctChange } from "@track/lib/insight-series";
import { formatMonthShortLabel, shiftMonthKey } from "@track/lib/month";
import {
  colorSpendSlices,
  type ColoredSpendSlice,
} from "@track/lib/spend-slices";
import type { ExpenseWithCategory, InsightLedgerPoint } from "@track/lib/types";
import { cn } from "@/lib/utils";

const INCOME_COLOR = "#5CE1E6";
const HUB_STROKE = 11;
const INCOME_RING_STROKE = 1.2;
const INCOME_RING_RATIO = ringRadiusRatio(
  nestedInnerRadius(HUB_STROKE, INCOME_RING_STROKE),
);
const MAX_INCOME_CARDS = 4;
const INCOME_STRANDS = 2;
const EXPENSE_STRANDS = 1;

type FlowItem = CountedSpendSlice & { pct: number; color?: string };

function collapse(rows: CountedSpendSlice[], max: number): CountedSpendSlice[] {
  const ranked = rows.filter((row) => row.total > 0);
  if (ranked.length <= max) return ranked;
  const head = ranked.slice(0, max - 1);
  const rest = ranked.slice(max - 1);
  return [
    ...head,
    {
      id: "others",
      name: "Others",
      total: rest.reduce((sum, row) => sum + row.total, 0),
      count: rest.reduce((sum, row) => sum + row.count, 0),
    },
  ];
}

function withPct(rows: CountedSpendSlice[], total: number): FlowItem[] {
  return rows.map((row) => ({
    ...row,
    pct: total > 0 ? Math.round((row.total / total) * 1000) / 10 : 0,
  }));
}

function groupIncomes(
  rows: { title: string; amount: number }[],
): CountedSpendSlice[] {
  const map = new Map<string, CountedSpendSlice>();
  for (const row of rows) {
    const name = row.title.trim() || "Income";
    const id = name.toLowerCase();
    const existing = map.get(id);
    if (existing) {
      existing.total += row.amount;
      existing.count += 1;
    } else {
      map.set(id, { id, name, total: row.amount, count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

function iconFor(name: string, kind: "income" | "expense"): LucideIcon {
  const n = name.toLowerCase();
  if (kind === "income") {
    if (n.includes("salary") || n.includes("wage")) return Briefcase;
    if (n.includes("freelance") || n.includes("contract")) return Laptop;
    if (n.includes("invest")) return TrendingUp;
    if (n.includes("gift")) return Gift;
    return Wallet;
  }
  if (n.includes("food") || n.includes("dining") || n.includes("grocery"))
    return Utensils;
  if (n.includes("rent") || n.includes("home") || n.includes("hous"))
    return House;
  if (n.includes("transport") || n.includes("fuel") || n.includes("travel"))
    return Car;
  if (n.includes("shop") || n.includes("amazon")) return ShoppingBag;
  if (n.includes("entertain") || n.includes("movie")) return Clapperboard;
  if (n.includes("health") || n.includes("medical")) return Heart;
  if (n.includes("educat") || n.includes("school")) return GraduationCap;
  if (n.includes("utilit") || n.includes("bill") || n.includes("electric"))
    return Zap;
  if (n.includes("other")) return MoreHorizontal;
  return Tag;
}

function isLightColor(hex: string) {
  const n = hex.replace("#", "");
  if (n.length < 6) return false;
  const r = Number.parseInt(n.slice(0, 2), 16);
  const g = Number.parseInt(n.slice(2, 4), 16);
  const b = Number.parseInt(n.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 175;
}

type Point = { x: number; y: number };

function cubeJoin(root: DOMRect, box: DOMRect, edge: "top" | "bottom"): Point {
  return {
    x: box.left - root.left + box.width / 2,
    y: edge === "top" ? box.top - root.top : box.bottom - root.top,
  };
}

function hubCenter(root: DOMRect, hub: DOMRect): Point {
  return {
    x: hub.left - root.left + hub.width / 2,
    y: hub.top - root.top + hub.height / 2,
  };
}

/** Point on the ring, 0° = top, clockwise. */
function ringPoint(
  root: DOMRect,
  hub: DOMRect,
  deg: number,
  radiusRatio = 0.92,
): Point {
  const c = hubCenter(root, hub);
  const r = (hub.width / 2) * radiusRatio;
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: c.x + r * Math.cos(rad), y: c.y + r * Math.sin(rad) };
}

/** Drop through a center rail, then hook to the cube. */
function centerRailCurve(from: Point, to: Point, railX: number) {
  return `M ${from.x} ${from.y} C ${railX} ${from.y}, ${railX} ${to.y}, ${to.x} ${to.y}`;
}

type Fiber = { d: string; color: string };

type ActivityFlowChartProps = {
  expenses: ExpenseWithCategory[];
  expenseTotal: number;
  incomes: { title: string; amount: number }[];
  incomeTotal: number;
  currency: string;
  monthKey: string;
  insightLedger: InsightLedgerPoint[];
  className?: string;
};

export function ActivityFlowChart({
  expenses,
  expenseTotal,
  incomes,
  incomeTotal,
  currency,
  monthKey,
  insightLedger,
  className,
}: ActivityFlowChartProps) {
  const { formatMoney, hidden } = useTrackMoney();
  const prevKey = shiftMonthKey(monthKey, -1);
  const prevLabel = formatMonthShortLabel(prevKey).split(" ")[0];
  const curr = monthActivityTotals(monthKey, insightLedger);
  const prev = monthActivityTotals(prevKey, insightLedger);
  const incomePct = pctChange(curr.income, prev.income);
  const expensePct = pctChange(curr.expense, prev.expense);
  const flowPct = pctChange(curr.activity, prev.activity);

  const incomeItems = useMemo(
    () =>
      withPct(collapse(groupIncomes(incomes), MAX_INCOME_CARDS), incomeTotal),
    [incomeTotal, incomes],
  );

  const expenseSlices = useMemo(
    () =>
      colorSpendSlices(
        spendGrouped(expenses, (expense) => ({
          id: expense.category_id || "none",
          name: expense.category?.name ?? "Uncategorized",
        })).map((row) => ({
          categoryId: row.id,
          name: row.name,
          total: row.total,
        })),
        expenseTotal,
      ),
    [expenseTotal, expenses],
  );

  const expenseItems = useMemo<FlowItem[]>(
    () =>
      expenseSlices.map((slice) => ({
        id: slice.categoryId,
        name: slice.name,
        total: slice.total,
        count: 0,
        pct: slice.pct,
        color: slice.color,
      })),
    [expenseSlices],
  );

  const flow = incomeTotal + expenseTotal;

  return (
    <VerticalFlow
      className={className}
      incomeHeader={
        <SectionHeader
          title="Income"
          total={formatMoney(incomeTotal, currency)}
          change={hidden ? null : incomePct}
          vsLabel={prevLabel}
          tone="income"
        />
      }
      expenseHeader={
        <SectionHeader
          title="Expenses"
          total={formatMoney(expenseTotal, currency)}
          change={hidden ? null : expensePct}
          vsLabel={prevLabel}
          tone="expense"
          invertChange
        />
      }
      incomeItems={incomeItems}
      expenseItems={expenseItems}
      expenseSlices={expenseSlices}
      expenseTotal={expenseTotal}
      currency={currency}
      flowAmount={formatMoney(flow, currency)}
      flowChange={hidden ? null : flowPct}
      vsLabel={prevLabel}
    />
  );
}

function VerticalFlow({
  className,
  incomeHeader,
  expenseHeader,
  incomeItems,
  expenseItems,
  expenseSlices,
  expenseTotal,
  currency,
  flowAmount,
  flowChange,
  vsLabel,
}: {
  className?: string;
  incomeHeader: ReactNode;
  expenseHeader: ReactNode;
  incomeItems: FlowItem[];
  expenseItems: FlowItem[];
  expenseSlices: ColoredSpendSlice[];
  expenseTotal: number;
  currency: string;
  flowAmount: string;
  flowChange: number | null;
  vsLabel: string;
}) {
  const uid = useId().replace(/:/g, "");
  const rootRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const [fibers, setFibers] = useState<Fiber[]>([]);

  const measure = useCallback(() => {
    const root = rootRef.current;
    const hub = hubRef.current;
    if (!root || !hub) return;
    const rootBox = root.getBoundingClientRect();
    const hubBox = hub.getBoundingClientRect();
    setFrame({ w: root.clientWidth, h: root.clientHeight });
    const next: Fiber[] = [];
    const railX = hubBox.left - rootBox.left + hubBox.width / 2;
    const incomeIn = ringPoint(rootBox, hubBox, 0, INCOME_RING_RATIO);
    const expenseOut = ringPoint(rootBox, hubBox, 180, 0.92);

    const incomeEls = root.querySelectorAll<HTMLElement>(
      "[data-flow='income']",
    );
    incomeEls.forEach((el) => {
      const from = cubeJoin(rootBox, el.getBoundingClientRect(), "bottom");
      for (let i = 0; i < INCOME_STRANDS; i++) {
        const jitter = (i - (INCOME_STRANDS - 1) / 2) * 5;
        next.push({
          d: centerRailCurve(
            { x: from.x + jitter, y: from.y },
            incomeIn,
            railX,
          ),
          color: INCOME_COLOR,
        });
      }
    });

    const expenseEls = root.querySelectorAll<HTMLElement>(
      "[data-flow='expense']",
    );
    expenseEls.forEach((el) => {
      const color = el.dataset.color || INCOME_COLOR;
      const to = cubeJoin(rootBox, el.getBoundingClientRect(), "top");
      for (let i = 0; i < EXPENSE_STRANDS; i++) {
        const jitter = EXPENSE_STRANDS === 1 ? 0 : (i - 0.5) * 4;
        next.push({
          d: centerRailCurve(expenseOut, { x: to.x + jitter, y: to.y }, railX),
          color,
        });
      }
    });

    setFibers(next);
  }, []);

  useLayoutEffect(() => {
    measure();
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, incomeItems, expenseItems]);

  return (
    <div ref={rootRef} className={cn("relative overflow-visible", className)}>
      <svg
        width={frame.w}
        height={frame.h}
        viewBox={`0 0 ${Math.max(frame.w, 1)} ${Math.max(frame.h, 1)}`}
        className="pointer-events-none absolute inset-0 z-0 overflow-visible"
        aria-hidden
      >
        <defs>
          <filter
            id={`${uid}-fiber`}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>
        {fibers.map((fiber, i) => (
          <FiberPath
            key={i}
            d={fiber.d}
            color={fiber.color}
            filterId={`${uid}-fiber`}
          />
        ))}
      </svg>

      <div className="relative z-10 flex flex-col">
        {incomeHeader}
        {incomeItems.length > 0 ? (
          <ul className="grid grid-cols-3 gap-x-2.5 gap-y-3">
            {incomeItems.map((item) => (
              <li key={item.id} data-flow="income">
                <FlowCard
                  item={item}
                  tone="income"
                  currency={currency}
                  compact
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="track-panel-elevated px-3 py-4 text-center text-sm text-muted-foreground">
            No income this month
          </p>
        )}

        <div
          ref={hubRef}
          className="relative mx-auto my-32 size-52 sm:my-14 sm:size-60"
        >
          <DaySpendRing
            slices={expenseSlices}
            total={expenseTotal}
            className="size-full"
            strokeWidth={HUB_STROKE}
            strokeLinecap="round"
            innerRing={{ color: INCOME_COLOR, strokeWidth: INCOME_RING_STROKE }}
          >
            <div className="max-w-34 px-3 text-center">
              <p className="text-[11px] text-muted-foreground">Total flow</p>
              <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl">
                {flowAmount}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                This month
              </p>
              <div className="mt-1 flex justify-center">
                <ChangeBadge change={flowChange} vsLabel={vsLabel} />
              </div>
            </div>
          </DaySpendRing>
        </div>

        {expenseHeader}
        {expenseItems.length > 0 ? (
          <ul className="grid grid-cols-2 gap-x-8 gap-y-3">
            {expenseItems.map((item) => (
              <li
                key={item.id}
                data-flow="expense"
                data-category={item.id}
                data-color={item.color}
              >
                <FlowCard item={item} tone="expense" currency={currency} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="track-panel-elevated px-3 py-4 text-center text-sm text-muted-foreground">
            No expenses this month
          </p>
        )}
      </div>
    </div>
  );
}

function FiberPath({
  d,
  color,
  filterId,
}: {
  d: string;
  color: string;
  filterId: string;
}) {
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="3"
        opacity="0.22"
        filter={`url(#${filterId})`}
      />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.15"
        opacity="0.88"
      />
    </g>
  );
}

function SectionHeader({
  title,
  total,
  change,
  vsLabel,
  tone,
  invertChange = false,
}: {
  title: string;
  total: string;
  change: number | null;
  vsLabel: string;
  tone: "income" | "expense";
  invertChange?: boolean;
}) {
  const accent = tone === "income" ? "text-[#5CE1E6]" : "text-primary";

  return (
    <div className="relative z-10 mb-2 flex items-end justify-between gap-3 px-0.5">
      <div>
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-wide",
            accent,
          )}
        >
          {title}
        </p>
        <p className="mt-0.5 text-lg font-semibold tabular-nums">{total}</p>
      </div>
      <ChangeBadge change={change} vsLabel={vsLabel} invert={invertChange} />
    </div>
  );
}

function FlowCard({
  item,
  tone,
  currency,
  compact = false,
}: {
  item: FlowItem;
  tone: "income" | "expense";
  currency: string;
  compact?: boolean;
}) {
  const { formatMoney } = useTrackMoney();
  const Icon = iconFor(item.name, tone);
  const fill = tone === "income" ? INCOME_COLOR : item.color || "#8FA0B8";
  const glyph = isLightColor(fill) ? "var(--brand-navy)" : "#ffffff";
  return (
    <div
      className={cn(
        "flex h-full w-full min-w-0 track-panel-elevated",
        compact
          ? "flex-col items-stretch gap-1.5 px-2 py-2"
          : "items-center gap-2.5 px-2.5 py-2.5",
      )}
    >
      <div
        className={cn(
          "flex w-full min-w-0 items-center",
          compact ? "gap-1.5" : "gap-2.5",
        )}
      >
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full",
            compact ? "size-7" : "size-9",
          )}
          style={{ backgroundColor: fill, color: glyph }}
        >
          <Icon className={compact ? "size-3.5" : "size-4"} />
        </span>
        <p
          className={cn(
            "min-w-0 flex-1 truncate font-medium",
            compact ? "text-xs" : "text-sm",
          )}
        >
          {item.name}
        </p>
        {compact ? null : (
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold tabular-nums">
              {formatMoney(item.total, currency)}
            </p>
            <p className="text-[11px] text-muted-foreground">{item.pct}%</p>
          </div>
        )}
      </div>
      {compact ? (
        <div className="flex w-full items-baseline justify-between gap-1 pl-0.5">
          <p className="text-[11px] font-semibold tabular-nums">
            {formatMoney(item.total, currency)}
          </p>
          <p className="text-[11px] text-muted-foreground">{item.pct}%</p>
        </div>
      ) : null}
    </div>
  );
}

function ChangeBadge({
  change,
  vsLabel,
  invert = false,
}: {
  change: number | null;
  vsLabel: string;
  invert?: boolean;
}) {
  if (change == null) return null;
  const up = change >= 0;
  const good = invert ? !up : up;
  return (
    <p
      className={cn(
        "text-[11px] tabular-nums",
        good ? "text-emerald-400" : "text-rose-400",
      )}
    >
      {up ? "↑" : "↓"} {Math.abs(change)}% vs {vsLabel}
    </p>
  );
}
