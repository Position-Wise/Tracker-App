"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CreditCard,
  Eye,
  EyeOff,
  Landmark,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { deleteMoneySource } from "@track/app/actions"
import { AccountsActivityPulse } from "@track/components/accounts-activity-pulse"
import { AccountsManager } from "@track/components/accounts-manager"
import { MoneySourceFormDialog } from "@track/components/money-source-form-dialog"
import { useTrackLedger } from "@track/components/track-ledger-provider"
import { useTrackMoney } from "@track/components/track-privacy-provider"
import { TrackAccountRowsSkeleton } from "@track/components/track-skeletons"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  MONEY_SOURCE_KIND_LABEL,
  sourceSubtitle,
  type CreditLimitPool,
  type MoneySource,
  type MoneySourceKind,
} from "@track/lib/money-sources"
import type { ExpenseWithCategory, InsightLedgerPoint } from "@track/lib/types"
import { buildExpensesHref, resolveExpenseSourceId } from "@track/lib/expense-browse"
import { relativeDayLabel, toMonthKey } from "@track/lib/month"
import { cn } from "@/lib/utils"

const KIND_ORDER: MoneySourceKind[] = ["bank", "credit_card", "cash"]

const KIND_SHORT_LABEL: Record<MoneySourceKind, string> = {
  bank: "Bank",
  credit_card: "Cards",
  cash: "Cash",
}

function accountNumberLabel(source: MoneySource) {
  if (source.last4) return `•••• ${source.last4}`
  return null
}

export function AccountsOverviewPanel({
  monthKey,
  expenses = [],
  recentAcross = [],
  insightLedger = [],
}: {
  monthKey: string
  expenses?: ExpenseWithCategory[]
  recentAcross?: ExpenseWithCategory[]
  insightLedger?: InsightLedgerPoint[]
}) {
  const {
    sources,
    totalLiquidBalance,
    sourceBalance,
    currency,
    ready,
    creditLimitPools,
    cardCreditLimit,
  } = useTrackLedger()
  const { formatMoney, hidden, toggleHidden } = useTrackMoney()

  const [addOpen, setAddOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [selected, setSelected] = useState<MoneySource | null>(null)
  const [editing, setEditing] = useState<MoneySource | null>(null)

  const grouped = useMemo(() => {
    return KIND_ORDER.map((kind) => {
      const items = sources.filter((s) => s.kind === kind)
      const total = items.reduce((sum, s) => sum + sourceBalance(s.id), 0)
      return { kind, items, total }
    }).filter((g) => g.items.length > 0)
  }, [sources, sourceBalance])

  // Keep selected in sync if source list refreshes after edit/delete
  const selectedSource = selected
    ? (sources.find((s) => s.id === selected.id) ?? null)
    : null

  return (
    <section className="track-panel flex flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Your accounts</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
            {ready ? formatMoney(totalLiquidBalance, currency) : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Cash + banks − card balances
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-full"
            onClick={toggleHidden}
            aria-label={hidden ? "Show amounts" : "Hide amounts"}
            aria-pressed={hidden}
            title={hidden ? "Show amounts" : "Hide amounts"}
          >
            {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setManageOpen(true)}
          >
            Manage
          </Button>
          <Button
            type="button"
            size="sm"
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="size-4" />
            Add
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-1 flex-col gap-5">
        {!ready ? (
          <TrackAccountRowsSkeleton count={4} />
        ) : grouped.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add a cash wallet, bank, or card to start.
          </p>
        ) : (
          grouped.map((group) => (
            <AccountKindStack
              key={group.kind}
              kind={group.kind}
              items={group.items}
              total={group.total}
              currency={currency}
              balanceFor={(id) => sourceBalance(id)}
              limitFor={cardCreditLimit}
              allSources={sources}
              onSelect={setSelected}
            />
          ))
        )}

        {ready ? (
          <AccountsActivityPulse
            monthKey={monthKey}
            currency={currency}
            ledger={insightLedger}
          />
        ) : null}
      </div>

      <MoneySourceFormDialog open={addOpen} onOpenChange={setAddOpen} />

      {editing ? (
        <MoneySourceFormDialog
          source={editing}
          open={Boolean(editing)}
          onOpenChange={(next) => {
            if (!next) setEditing(null)
          }}
        />
      ) : null}

      <Dialog
        open={Boolean(selectedSource)}
        onOpenChange={(next) => {
          if (!next) setSelected(null)
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          {selectedSource ? (
            <AccountDetail
              source={selectedSource}
              balance={sourceBalance(selectedSource.id)}
              currency={currency}
              monthKey={monthKey}
              expenses={expenses}
              recentAcross={recentAcross}
              pools={creditLimitPools}
              creditLimit={cardCreditLimit(selectedSource)}
              onEdit={() => {
                setSelected(null)
                setEditing(selectedSource)
              }}
              onDeleted={() => setSelected(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage accounts</DialogTitle>
            <DialogDescription>
              Cash, bank accounts, and credit cards you spend from.
            </DialogDescription>
          </DialogHeader>
          <AccountsManager embedded />
        </DialogContent>
      </Dialog>
    </section>
  )
}

function cardLimitUsage(
  source: MoneySource,
  allSources: MoneySource[],
  balanceFor: (id: string) => number,
  limitFor: (source: MoneySource) => number | null
) {
  const limit = limitFor(source)
  if (limit == null || limit <= 0) return null

  const used = source.creditLimitPoolId
    ? allSources
        .filter((s) => s.creditLimitPoolId === source.creditLimitPoolId)
        .reduce((sum, s) => sum + Math.max(0, balanceFor(s.id)), 0)
    : Math.max(0, balanceFor(source.id))

  return {
    limit,
    used,
    available: Math.max(0, limit - used),
    usedPct: Math.min(100, (used / limit) * 100),
  }
}

function AccountKindStack({
  kind,
  items,
  total,
  currency,
  balanceFor,
  limitFor,
  allSources,
  onSelect,
}: {
  kind: MoneySourceKind
  items: MoneySource[]
  total: number
  currency: string
  balanceFor: (id: string) => number
  limitFor: (source: MoneySource) => number | null
  allSources: MoneySource[]
  onSelect: (source: MoneySource) => void
}) {
  const { formatMoney } = useTrackMoney()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  if (kind === "cash" || kind === "bank") {
    return (
      <HorizontalAccountsRow
        kind={kind}
        items={items}
        total={total}
        currency={currency}
        balanceFor={balanceFor}
        onSelect={onSelect}
        revealBalanceOnHover={kind === "bank"}
      />
    )
  }

  const peekRem = 2.65
  const pocketRem = 4.75
  const stackRem = items.length * peekRem + pocketRem
  const pocketZ = items.length + 2

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          {KIND_SHORT_LABEL[kind]}
        </p>
        <div className="flex items-baseline gap-2">
          {items.length > 1 ? (
            <p className="text-xs text-muted-foreground">{items.length} accounts</p>
          ) : null}
          <p className="text-sm font-semibold tracking-tight tabular-nums">
            {formatMoney(total, currency)}
          </p>
        </div>
      </div>

      <div className="relative" style={{ height: `${stackRem}rem` }}>
        {items.map((source, index) => {
          const number = accountNumberLabel(source)
          const isTopMost = index === 0
          const isHovered = hoveredId === source.id
          const usage = cardLimitUsage(
            source,
            allSources,
            balanceFor,
            limitFor
          )

          return (
            <button
              key={source.id}
              type="button"
              onClick={() => onSelect(source)}
              onMouseEnter={() => setHoveredId(source.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={cn(
                "absolute inset-x-0 overflow-hidden rounded-2xl px-4 pt-3 text-left shadow-sm transition-[transform,box-shadow,height,background-color] duration-200",
                isHovered && usage ? "h-[7.25rem]" : "h-20",
                isHovered ? "-translate-y-3 shadow-lg" : "translate-y-0",
                isTopMost && "bg-primary text-primary-foreground",
                !isTopMost &&
                  !isHovered &&
                  "track-panel-elevated text-foreground",
                !isTopMost &&
                  isHovered &&
                  "border border-white/50 bg-white/75 text-foreground shadow-[0_8px_30px_rgba(42,64,100,0.18)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-(--brand-charcoal)/80"
              )}
              style={{
                top: `${index * peekRem}rem`,
                zIndex: isHovered ? pocketZ + 1 : index + 1,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0 truncate text-sm font-medium">
                  {source.name}
                  {number ? (
                    <span
                      className={cn(
                        "ml-2 font-normal",
                        isTopMost
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      )}
                    >
                      {number}
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-sm font-semibold tabular-nums transition-opacity duration-200",
                    isHovered ? "opacity-100" : "opacity-0",
                    isTopMost
                      ? "text-primary-foreground"
                      : "text-foreground"
                  )}
                >
                  {formatMoney(balanceFor(source.id), currency)}
                </span>
              </div>

              {usage ? (
                <div
                  className={cn(
                    "mt-2 space-y-1.5 transition-opacity duration-200",
                    isHovered ? "opacity-100" : "pointer-events-none opacity-0"
                  )}
                >
                  <div
                    className={cn(
                      "h-1.5 overflow-hidden rounded-full",
                      isTopMost ? "bg-white/25" : "bg-secondary/90"
                    )}
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-200",
                        isTopMost ? "bg-white" : "bg-primary",
                        usage.usedPct >= 90 && !isTopMost && "bg-destructive"
                      )}
                      style={{ width: `${usage.usedPct}%` }}
                    />
                  </div>
                  <div
                    className={cn(
                      "flex items-center justify-between gap-2 text-[11px] tabular-nums",
                      isTopMost
                        ? "text-primary-foreground/85"
                        : "text-muted-foreground"
                    )}
                  >
                    <span>Used {formatMoney(usage.used, currency)}</span>
                    <span>
                      Available {formatMoney(usage.available, currency)}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-[10px] tabular-nums",
                      isTopMost
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    Limit {formatMoney(usage.limit, currency)}
                    {source.creditLimitPoolId ? " · shared" : ""}
                  </p>
                </div>
              ) : null}
            </button>
          )
        })}

        <div
          className="absolute inset-x-0 bottom-0 overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-md"
          style={{ height: `${pocketRem}rem`, zIndex: pocketZ }}
        >
          <div
            aria-hidden
            className="absolute inset-x-4 top-2.5 h-px bg-white/20"
          />
          <div className="relative flex h-full flex-col justify-center px-4 pt-1">
            <p className="text-xs text-primary-foreground/70">
              {KIND_SHORT_LABEL[kind]} total
            </p>
            <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
              {formatMoney(total, currency)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function HorizontalAccountsRow({
  kind,
  items,
  total,
  currency,
  balanceFor,
  onSelect,
  revealBalanceOnHover,
}: {
  kind: MoneySourceKind
  items: MoneySource[]
  total: number
  currency: string
  balanceFor: (id: string) => number
  onSelect: (source: MoneySource) => void
  /** Bank: balance appears on hover. Cash: always visible. */
  revealBalanceOnHover?: boolean
}) {
  const { formatMoney } = useTrackMoney()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const isBank = kind === "bank"

  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          {KIND_SHORT_LABEL[kind]}
        </p>
        <div className="flex items-baseline gap-2">
          {items.length > 1 ? (
            <p className="text-xs text-muted-foreground">{items.length} accounts</p>
          ) : null}
          <p className="text-sm font-semibold tracking-tight tabular-nums">
            {formatMoney(total, currency)}
          </p>
        </div>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((source, index) => {
          const number = accountNumberLabel(source)
          const isPrimary = index === 0
          const isHovered = hoveredId === source.id
          const showBalance = !revealBalanceOnHover || isHovered

          if (isBank) {
            return (
              <button
                key={source.id}
                type="button"
                onClick={() => onSelect(source)}
                onMouseEnter={() => setHoveredId(source.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={cn(
                  "shrink-0 rounded-xl px-3 py-1.5 text-left transition-transform hover:-translate-y-0.5",
                  isPrimary
                    ? "bg-primary text-primary-foreground"
                    : "track-panel-elevated text-foreground"
                )}
              >
                <p className="truncate text-xs font-medium">
                  {source.name}
                  {number ? (
                    <span
                      className={cn(
                        "ml-1.5 font-normal",
                        isPrimary
                          ? "text-primary-foreground/75"
                          : "text-muted-foreground"
                      )}
                    >
                      {number}
                    </span>
                  ) : null}
                </p>
                <p
                  className={cn(
                    "mt-0.5 truncate text-[11px] leading-4 tabular-nums transition-opacity duration-200",
                    showBalance ? "opacity-100" : "opacity-0",
                    isPrimary
                      ? "text-primary-foreground/85"
                      : "text-muted-foreground"
                  )}
                >
                  {formatMoney(balanceFor(source.id), currency)}
                </p>
              </button>
            )
          }

          return (
            <button
              key={source.id}
              type="button"
              onClick={() => onSelect(source)}
              onMouseEnter={() => setHoveredId(source.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={cn(
                "flex min-w-46 shrink-0 items-center gap-3 rounded-2xl px-3.5 py-3 text-left shadow-sm transition-transform hover:-translate-y-0.5",
                isPrimary
                  ? "bg-primary text-primary-foreground"
                  : "track-panel-elevated text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl",
                  isPrimary ? "bg-black/10" : "bg-secondary"
                )}
              >
                <Wallet className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{source.name}</p>
                <p
                  className={cn(
                    "mt-0.5 truncate text-xs tabular-nums transition-opacity duration-200",
                    showBalance ? "opacity-100" : "opacity-0",
                    isPrimary
                      ? "text-primary-foreground/85"
                      : "text-muted-foreground"
                  )}
                >
                  {formatMoney(balanceFor(source.id), currency)}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function AccountDetail({
  source,
  balance,
  currency,
  monthKey,
  expenses,
  recentAcross,
  pools,
  creditLimit,
  onEdit,
  onDeleted,
}: {
  source: MoneySource
  balance: number
  currency: string
  monthKey: string
  expenses: ExpenseWithCategory[]
  recentAcross: ExpenseWithCategory[]
  pools: CreditLimitPool[]
  creditLimit: number | null
  onEdit: () => void
  onDeleted: () => void
}) {
  const { formatMoney } = useTrackMoney()
  const { getExpenseSourceId } = useTrackLedger()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const monthSpends = useMemo(
    () =>
      expenses.filter(
        (expense) =>
          resolveExpenseSourceId(expense, getExpenseSourceId) === source.id
      ),
    [expenses, getExpenseSourceId, source.id]
  )

  const recentSpends = useMemo(() => {
    const pool = recentAcross.length > 0 ? recentAcross : expenses
    return pool
      .filter(
        (expense) =>
          resolveExpenseSourceId(expense, getExpenseSourceId) === source.id
      )
      .slice(0, 5)
  }, [expenses, getExpenseSourceId, recentAcross, source.id])

  const latest = recentSpends[0]
  const viewMonth = latest
    ? toMonthKey(new Date(latest.spent_at))
    : monthKey
  const showingOlder = monthSpends.length === 0 && recentSpends.length > 0

  const Icon =
    source.kind === "bank"
      ? Landmark
      : source.kind === "credit_card"
        ? CreditCard
        : Wallet

  async function handleDelete() {
    const formData = new FormData()
    formData.set("sourceId", source.id)
    const result = await deleteMoneySource(formData)
    if (!result.ok) {
      toast.error(result.error ?? "Could not remove")
      return
    }
    toast.success("Account removed")
    onDeleted()
    startTransition(() => router.refresh())
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{source.name}</DialogTitle>
        <DialogDescription>
          {sourceSubtitle(source, pools)}
          {source.isDefault ? " · Default" : ""}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="track-panel-elevated flex items-center gap-4 px-4 py-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
            <Icon className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">
              {MONEY_SOURCE_KIND_LABEL[source.kind]}
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
              {formatMoney(balance, currency)}
            </p>
            {source.kind === "credit_card" && creditLimit != null ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Limit {formatMoney(creditLimit, currency)}
                {source.creditLimitPoolId ? " · shared" : ""}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium">Recent spends</p>
          {recentSpends.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No spends on this account yet.
            </p>
          ) : (
            <>
              {showingOlder ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  No spends this month · showing latest
                </p>
              ) : null}
              <ul className="mt-2 divide-y divide-border">
                {recentSpends.map((expense) => (
                  <li key={expense.id}>
                    <Link
                      href={buildExpensesHref({
                        monthKey: toMonthKey(new Date(expense.spent_at)),
                        accountId: source.id,
                        groupBy: "account",
                        expenseId: expense.id,
                      })}
                      className="flex items-center gap-3 py-2.5 transition-colors hover:bg-secondary/50"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                        {(expense.category?.name ?? "?").charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {expense.category?.name ?? "Uncategorized"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {relativeDayLabel(expense.spent_at)}
                          {expense.note ? ` · ${expense.note}` : ""}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums">
                        {formatMoney(
                          expense.amount,
                          expense.currency || currency
                        )}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {recentSpends.length > 0 ? (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="mt-1 h-8 w-full justify-between rounded-full px-3 text-muted-foreground"
            >
              <Link
                href={buildExpensesHref({
                  monthKey: viewMonth,
                  accountId: source.id,
                  groupBy: "account",
                })}
              >
                View all
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-full"
            onClick={onEdit}
          >
            <Pencil className="size-4" />
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-full text-destructive hover:text-destructive"
            disabled={pending}
            onClick={handleDelete}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>
    </>
  )
}
