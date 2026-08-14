"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeftRight,
  Calendar,
  Pencil,
  Tag,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react"
import {
  DeleteExpenseButton,
  DeleteIncomeButton,
  DeleteTransferButton,
  ExpenseFormDialog,
} from "@/components/track/expense-form-dialog"
import { Button } from "@/components/ui/button"
import { useTrackMoney } from "@/components/track/track-privacy-provider"
import { toDateInputValue } from "@/lib/track/month"
import type { TrackActivityItem } from "@/lib/track/activity-types"
import type { ExpenseCategory, ExpenseWithCategory } from "@/lib/track/types"
import { cn } from "@/lib/utils"
import { useTrackLedger } from "@/components/track/track-ledger-provider"

type ActivityTab = "expenses" | "income" | "transfers"

type ExpenseActivityBoardProps = {
  expenses: ExpenseWithCategory[]
  income?: TrackActivityItem[]
  transfers?: TrackActivityItem[]
  categories: ExpenseCategory[]
  currency: string
  monthKey?: string
  showSeeAll?: boolean
  onAddExpense?: () => void
  onAddIncome?: () => void
  onAddTransfer?: () => void
}

function relativeDayLabel(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return toDateInputValue(iso)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffDays === 0) return "Today"
  if (diffDays === -1) return "Yesterday"
  if (diffDays === 1) return "Tomorrow"
  if (diffDays < -1 && diffDays > -7) return `${Math.abs(diffDays)} days ago`
  return toDateInputValue(iso)
}

function tabLabel(tab: ActivityTab) {
  if (tab === "expenses") return "Recent expenses"
  if (tab === "income") return "Recent income"
  return "Recent transfers"
}

export function ExpenseActivityBoard({
  expenses,
  income = [],
  transfers = [],
  categories,
  currency,
  monthKey,
  showSeeAll = false,
  onAddExpense,
  onAddIncome,
  onAddTransfer,
}: ExpenseActivityBoardProps) {
  const [activityTab, setActivityTab] = useState<ActivityTab>("expenses")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  /** Mobile: list and detail swap; desktop keeps side-by-side. */
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)

  function changeActivityTab(tab: ActivityTab) {
    setEditing(false)
    setMobileDetailOpen(false)
    setActivityTab(tab)
  }

  function selectItem(id: string) {
    setSelectedId(id)
    setMobileDetailOpen(true)
  }

  useEffect(() => {
    if (activityTab === "expenses") {
      if (expenses.length === 0) {
        setSelectedId(null)
        return
      }
      setSelectedId((current) => {
        if (current && expenses.some((e) => e.id === current)) return current
        return expenses[0]?.id ?? null
      })
      return
    }

    const items = activityTab === "income" ? income : transfers
    if (items.length === 0) {
      setSelectedId(null)
      return
    }
    setSelectedId((current) => {
      if (current && items.some((i) => i.id === current)) return current
      return items[0]?.id ?? null
    })
  }, [activityTab, expenses, income, transfers])

  const selectedExpense = useMemo(
    () => expenses.find((e) => e.id === selectedId) ?? null,
    [expenses, selectedId]
  )

  const selectedActivity = useMemo(() => {
    if (activityTab === "expenses") return null
    const pool = activityTab === "income" ? income : transfers
    return pool.find((i) => i.id === selectedId) ?? null
  }, [activityTab, income, transfers, selectedId])

  const listEmpty =
    activityTab === "expenses"
      ? expenses.length === 0
      : activityTab === "income"
        ? income.length === 0
        : transfers.length === 0

  return (
    <section className="track-panel overflow-hidden">
      <header className="relative flex flex-col items-center gap-3 bg-card px-4 pb-2 sm:px-5">
        <ActivityTabPill
          activityTab={activityTab}
          expenseCount={expenses.length}
          incomeCount={income.length}
          transferCount={transfers.length}
          onChange={changeActivityTab}
        />
      </header>

      <div className="grid lg:grid-cols-[minmax(280px,0.95fr)_1.15fr]">
        <div
          className={cn(
            "min-w-0 border-b border-border p-4 sm:p-5 lg:border-b-0",
            mobileDetailOpen && "hidden lg:block"
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="min-w-0 shrink text-lg font-semibold tracking-tight">
              {tabLabel(activityTab)}
            </h2>
            {showSeeAll && monthKey && activityTab === "expenses" ? (
              <Button
                asChild
                variant="ghost"
                size="xs"
                className="text-muted-foreground"
              >
                <Link href={`/app/expenses?month=${monthKey}`}>See all</Link>
              </Button>
            ) : null}
          </div>

          {listEmpty ? (
            <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                No {activityTab} this month yet.
              </p>
              {activityTab === "expenses" && onAddExpense ? (
                <Button
                  type="button"
                  size="sm"
                  className="mt-3 rounded-full"
                  onClick={onAddExpense}
                >
                  Add expense
                </Button>
              ) : null}
              {activityTab === "income" && onAddIncome ? (
                <Button
                  type="button"
                  size="sm"
                  className="mt-3 rounded-full"
                  onClick={onAddIncome}
                >
                  Add income
                </Button>
              ) : null}
              {activityTab === "transfers" && onAddTransfer ? (
                <Button
                  type="button"
                  size="sm"
                  className="mt-3 rounded-full"
                  onClick={onAddTransfer}
                >
                  Add transfer
                </Button>
              ) : null}
            </div>
          ) : activityTab === "expenses" ? (
            <ul className="max-h-[min(28rem,60vh)] min-w-0 space-y-1.5 overflow-y-auto overscroll-contain pr-1 lg:max-h-112">
              {expenses.map((expense) => (
                <ExpenseListRow
                  key={expense.id}
                  expense={expense}
                  currency={currency}
                  active={expense.id === selectedId}
                  onSelect={() => selectItem(expense.id)}
                />
              ))}
            </ul>
          ) : (
            <ul className="max-h-[min(28rem,60vh)] min-w-0 space-y-1.5 overflow-y-auto overscroll-contain pr-1 lg:max-h-112">
              {(activityTab === "income" ? income : transfers).map((item) => (
                <ActivityListRow
                  key={item.id}
                  item={item}
                  active={item.id === selectedId}
                  onSelect={() => selectItem(item.id)}
                />
              ))}
            </ul>
          )}
        </div>

        <div
          className={cn(
            "relative flex min-h-0 flex-col bg-(--brand-navy) text-white lg:min-h-88 lg:rounded-l-3xl",
            mobileDetailOpen ? "flex" : "hidden lg:flex"
          )}
        >
          {mobileDetailOpen ? (
            <button
              type="button"
              className="absolute right-3 top-3 z-10 rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
              onClick={() => setMobileDetailOpen(false)}
              aria-label="Back to list"
            >
              <X className="size-4" />
            </button>
          ) : null}

          <div className="flex max-h-[min(36rem,75vh)] min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-4 pb-10 sm:p-5 lg:max-h-none lg:pb-5">
            {activityTab === "expenses" && selectedExpense ? (
              <ExpenseDetail
                expense={selectedExpense}
                currency={currency}
                onEdit={() => setEditing(true)}
              />
            ) : activityTab === "expenses" ? (
              <DetailEmpty
                title="Select an expense"
                body="Pick an item from the list to see the full breakdown."
              />
            ) : selectedActivity ? (
              <GenericActivityDetail
                item={selectedActivity}
                onEdit={() => setEditing(true)}
              />
            ) : (
              <DetailEmpty
                title={`Select a ${activityTab.slice(0, -1)}`}
                body="Pick an item from the list to see the full breakdown."
              />
            )}
          </div>
        </div>
      </div>

      {editing && activityTab === "expenses" && selectedExpense ? (
        <ExpenseFormDialog
          categories={categories}
          expense={selectedExpense}
          open={editing}
          onOpenChange={(next) => {
            if (!next) setEditing(false)
          }}
        />
      ) : null}

      {editing && activityTab === "income" && selectedActivity ? (
        <ExpenseFormDialog
          kind="income"
          categories={categories}
          activity={selectedActivity}
          open={editing}
          onOpenChange={(next) => {
            if (!next) setEditing(false)
          }}
        />
      ) : null}

      {editing && activityTab === "transfers" && selectedActivity ? (
        <ExpenseFormDialog
          kind={
            selectedActivity.transferPurpose === "card_bill"
              ? "card_bill"
              : "transfer"
          }
          categories={categories}
          activity={selectedActivity}
          open={editing}
          onOpenChange={(next) => {
            if (!next) setEditing(false)
          }}
        />
      ) : null}
    </section>
  )
}

function ExpenseListRow({
  expense,
  currency,
  active,
  onSelect,
}: {
  expense: ExpenseWithCategory
  currency: string
  active: boolean
  onSelect: () => void
}) {
  const { formatMoney } = useTrackMoney()
  return (
    <li className="min-w-0">
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full min-w-0 items-start gap-3 overflow-hidden rounded-2xl px-3 py-3 text-left transition-colors",
          active
            ? "bg-(--brand-navy) text-white shadow-sm"
            : "hover:bg-secondary/80"
        )}
      >
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-medium",
            active ? "bg-white/15 text-white" : "bg-secondary text-foreground"
          )}
        >
          {(expense.category?.name ?? "?").charAt(0)}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="line-clamp-2 wrap-break-word font-medium leading-snug">
            {expense.category?.name ?? "Uncategorized"}
          </p>
          <p
            className={cn(
              "mt-0.5 truncate text-sm",
              active ? "text-white/70" : "text-muted-foreground"
            )}
          >
            {relativeDayLabel(expense.spent_at)}
            {expense.note ? ` · ${expense.note}` : ""}
          </p>
        </div>
        <div className="w-27 shrink-0 text-right sm:w-auto sm:min-w-22">
          <p className="whitespace-nowrap font-semibold tabular-nums">
            {formatMoney(expense.amount, expense.currency || currency)}
          </p>
          <KindBadge kind="expense" active={active} />
        </div>
      </button>
    </li>
  )
}

function ActivityListRow({
  item,
  active,
  onSelect,
}: {
  item: TrackActivityItem
  active: boolean
  onSelect: () => void
}) {
  const { formatMoney } = useTrackMoney()
  const prefix =
    item.kind === "income" ? "+" : item.kind === "transfer" ? "" : "−"

  return (
    <li className="min-w-0">
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full min-w-0 items-start gap-3 overflow-hidden rounded-2xl px-3 py-3 text-left transition-colors",
          active
            ? "bg-(--brand-navy) text-white shadow-sm"
            : "hover:bg-secondary/80"
        )}
      >
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-medium",
            active ? "bg-white/15 text-white" : "bg-secondary text-foreground"
          )}
        >
          {item.title.charAt(0)}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="line-clamp-2 wrap-break-word font-medium leading-snug">
            {item.title}
          </p>
          <p
            className={cn(
              "mt-0.5 truncate text-sm",
              active ? "text-white/70" : "text-muted-foreground"
            )}
          >
            {relativeDayLabel(item.occurredAt)}
            {item.note && item.note !== item.title ? ` · ${item.note}` : ""}
          </p>
        </div>
        <div className="w-27 shrink-0 text-right sm:w-auto sm:min-w-22">
          <p className="whitespace-nowrap font-semibold tabular-nums">
            {prefix}
            {formatMoney(item.amount, item.currency)}
          </p>
          <KindBadge
            kind={item.kind}
            active={active}
            transferPurpose={item.transferPurpose}
          />
        </div>
      </button>
    </li>
  )
}

function KindBadge({
  kind,
  active,
  transferPurpose,
}: {
  kind: "expense" | "income" | "transfer"
  active: boolean
  transferPurpose?: "transfer" | "card_bill"
}) {
  const label =
    kind === "expense"
      ? "Expense"
      : kind === "income"
        ? "Income"
        : transferPurpose === "card_bill"
          ? "Card bill"
          : "Transfer"

  return (
    <span
      className={cn(
        "mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
        active
          ? "bg-white text-(--brand-navy)"
          : "bg-secondary text-muted-foreground"
      )}
    >
      {label}
    </span>
  )
}

function ActivityTabPill({
  activityTab,
  expenseCount,
  incomeCount,
  transferCount,
  onChange,
  className,
}: {
  activityTab: ActivityTab
  expenseCount: number
  incomeCount: number
  transferCount: number
  onChange: (tab: ActivityTab) => void
  className?: string
}) {
  const tabs = [
    { id: "expenses" as const, label: "Expenses", count: expenseCount },
    { id: "income" as const, label: "Income", count: incomeCount },
    { id: "transfers" as const, label: "Transfers", count: transferCount },
  ]

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-b-3xl bg-(--brand-navy) p-3 shadow-sm",
        className
      )}
    >
      {tabs.map((tab) => {
        const active = activityTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors",
              active
                ? "bg-white font-medium text-(--brand-navy)"
                : "text-white/70 hover:text-white"
            )}
          >
            {tab.label}
            {tab.count > 0 ? (
              <span
                className={cn(
                  "inline-flex size-5 items-center justify-center rounded-full text-[11px] font-semibold",
                  active
                    ? "bg-(--brand-navy) text-white"
                    : "bg-white/15 text-white"
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

function ExpenseDetail({
  expense,
  currency,
  onEdit,
}: {
  expense: ExpenseWithCategory
  currency: string
  onEdit: () => void
}) {
  const { formatMoney } = useTrackMoney()
  const { getExpenseSourceId, sourceName } = useTrackLedger()
  const money = formatMoney(expense.amount, expense.currency || currency)
  const categoryName = expense.category?.name ?? "Uncategorized"
  const linkedSource =
    expense.sourceName ??
    sourceName(expense.source_id ?? getExpenseSourceId(expense.id))

  return (
    <ActivityDetailShell
      title={categoryName}
      kind="Expense"
      date={toDateInputValue(expense.spent_at)}
      amount={money}
      amountPrefix="−"
      note={expense.note}
      cards={[
        { icon: Tag, label: "Category", value: categoryName },
        {
          icon: Calendar,
          label: "Date",
          value: toDateInputValue(expense.spent_at),
        },
        {
          icon: Wallet,
          label: "Paid from",
          value: linkedSource ?? "Not linked yet",
          muted: !linkedSource,
        },
      ]}
      onEdit={onEdit}
      editLabel="Edit expense"
      expenseId={expense.id}
    />
  )
}

function GenericActivityDetail({
  item,
  onEdit,
}: {
  item: TrackActivityItem
  onEdit: () => void
}) {
  const { formatMoney } = useTrackMoney()
  const money = formatMoney(item.amount, item.currency)
  const kind =
    item.kind === "income"
      ? "Income"
      : item.transferPurpose === "card_bill"
        ? "Card bill"
        : item.kind === "transfer"
          ? "Transfer"
          : "Expense"
  const prefix = item.kind === "income" ? "+" : item.kind === "transfer" ? "" : "−"
  const editLabel =
    item.transferPurpose === "card_bill"
      ? "Edit card bill"
      : item.kind === "income"
        ? "Edit income"
        : "Edit transfer"

  const cards =
    item.kind === "transfer"
      ? [
          {
            icon: Wallet,
            label: item.transferPurpose === "card_bill" ? "Pay from" : "From",
            value: item.fromWallet ?? "—",
          },
          {
            icon: ArrowLeftRight,
            label: item.transferPurpose === "card_bill" ? "Card" : "To",
            value: item.toWallet ?? "—",
          },
          {
            icon: Calendar,
            label: "Date",
            value: toDateInputValue(item.occurredAt),
          },
        ]
      : [
          {
            icon: TrendingUp,
            label: "Source",
            value: item.categoryName ?? item.title,
          },
          {
            icon: Calendar,
            label: "Date",
            value: toDateInputValue(item.occurredAt),
          },
          {
            icon: Wallet,
            label: "Wallet",
            value: item.walletName ?? "Not linked yet",
            muted: !item.walletName,
          },
        ]

  return (
    <ActivityDetailShell
      title={item.title}
      kind={kind}
      date={toDateInputValue(item.occurredAt)}
      amount={money}
      amountPrefix={prefix}
      note={item.note}
      cards={cards}
      onEdit={onEdit}
      editLabel={editLabel}
      activityId={item.id}
      activityKind={item.kind === "expense" ? undefined : item.kind}
    />
  )
}

function ActivityDetailShell({
  title,
  kind,
  date,
  amount,
  amountPrefix,
  note,
  cards,
  onEdit,
  editLabel = "Edit",
  expenseId,
  activityId,
  activityKind,
}: {
  title: string
  kind: string
  date: string
  amount: string
  amountPrefix: string
  note: string | null
  cards: {
    icon: typeof Tag
    label: string
    value: string
    muted?: boolean
  }[]
  onEdit?: () => void
  editLabel?: string
  expenseId?: string
  activityId?: string
  activityKind?: "income" | "transfer"
}) {
  const canEdit = Boolean(onEdit && (expenseId || activityId))

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3 pr-8 lg:pr-0">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
              {title}
            </h3>
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium">
              {kind}
            </span>
          </div>
          <p className="mt-1 text-sm text-white/65">{date}</p>
        </div>
        <p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
          {amountPrefix}
          {amount}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/15 p-3 sm:rounded-3xl sm:p-4">
        <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-white/45 sm:mb-3">
          Details
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
          {cards.map((card) => (
            <DetailCard key={card.label} {...card} />
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-black/20 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-white/50">
          Note
        </p>
        <p className="mt-1 text-sm text-white/85">
          {note?.trim() ? note : "No note added."}
        </p>
      </div>

      <div className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-4">
        <div className="hidden space-y-1 text-sm sm:block">
          <div className="flex min-w-40 justify-between gap-6 text-white/65">
            <span>Amount</span>
            <span className="tabular-nums text-white">
              {amountPrefix}
              {amount}
            </span>
          </div>
          <div className="flex min-w-40 justify-between gap-6 text-white/65">
            <span>Total</span>
            <span className="font-semibold tabular-nums text-white">
              {amountPrefix}
              {amount}
            </span>
          </div>
        </div>

        {canEdit ? (
          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              onClick={onEdit}
              aria-label={editLabel}
            >
              <Pencil className="size-4" />
            </Button>
            {expenseId ? (
              <DeleteExpenseButton
                expenseId={expenseId}
                className="h-9 rounded-full border border-white/20 bg-white/10 px-4 text-sm text-white hover:bg-red-500/20 hover:text-red-200"
              />
            ) : null}
            {activityId && activityKind === "income" ? (
              <DeleteIncomeButton
                incomeId={activityId}
                className="h-9 rounded-full border border-white/20 bg-white/10 px-4 text-sm text-white hover:bg-red-500/20 hover:text-red-200"
              />
            ) : null}
            {activityId && activityKind === "transfer" ? (
              <DeleteTransferButton
                transferId={activityId}
                className="h-9 rounded-full border border-white/20 bg-white/10 px-4 text-sm text-white hover:bg-red-500/20 hover:text-red-200"
              />
            ) : null}
            <Button
              type="button"
              className="rounded-full bg-white px-5 text-(--brand-navy) hover:bg-white/90"
              onClick={onEdit}
            >
              {editLabel}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function DetailCard({
  icon: Icon,
  label,
  value,
  muted,
}: {
  icon: typeof Tag
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3.5">
      <div className="flex items-center gap-2 text-white/50">
        <Icon className="size-3.5" />
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p
        className={cn(
          "mt-2 truncate text-sm font-medium",
          muted && "text-white/55"
        )}
      >
        {value}
      </p>
    </div>
  )
}

function DetailEmpty({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
      <p className="font-medium text-white">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-white/60">{body}</p>
    </div>
  )
}
