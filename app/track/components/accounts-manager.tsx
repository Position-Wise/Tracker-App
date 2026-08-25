"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  CreditCard,
  Eye,
  EyeOff,
  Landmark,
  Pencil,
  Trash2,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { deleteMoneySource } from "@track/app/actions"
import { MoneySourceFormDialog } from "@track/components/money-source-form-dialog"
import { useTrackLedger } from "@track/components/track-ledger-provider"
import { useTrackMoney } from "@track/components/track-privacy-provider"
import { TrackAccountRowsSkeleton } from "@track/components/track-skeletons"
import { Button } from "@/components/ui/button"
import {
  MONEY_SOURCE_KIND_LABEL,
  type MoneySource,
  type MoneySourceKind,
} from "@track/lib/money-sources"
import { cn } from "@/lib/utils"

const KIND_ORDER: MoneySourceKind[] = ["cash", "bank", "credit_card"]

const KIND_ICON: Record<MoneySourceKind, LucideIcon> = {
  cash: Wallet,
  bank: Landmark,
  credit_card: CreditCard,
}

type AccountsManagerProps = {
  /** When true, hide the page header (used inside the Manage dialog). */
  embedded?: boolean
}

export function AccountsManager({ embedded = false }: AccountsManagerProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const {
    sources,
    sourceBalance,
    currency,
    ready,
    cardCreditLimit,
    totalLiquidBalance,
  } = useTrackLedger()
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<MoneySource | null>(null)

  const grouped = useMemo(
    () =>
      KIND_ORDER.map((kind) => ({
        kind,
        items: sources.filter((s) => s.kind === kind),
      })),
    [sources]
  )

  const summary = useMemo(() => {
    const banks = sources.filter((s) => s.kind === "bank")
    const cards = sources.filter((s) => s.kind === "credit_card")
    const cash = sources.filter((s) => s.kind === "cash")
    return {
      banks: {
        count: banks.length,
        total: banks.reduce((sum, s) => sum + sourceBalance(s.id), 0),
      },
      cards: {
        count: cards.length,
        total: cards.reduce((sum, s) => sum + Math.max(0, sourceBalance(s.id)), 0),
      },
      cash: {
        count: cash.length,
        total: cash.reduce((sum, s) => sum + sourceBalance(s.id), 0),
      },
    }
  }, [sources, sourceBalance])

  async function handleDelete(source: MoneySource) {
    const formData = new FormData()
    formData.set("sourceId", source.id)
    const result = await deleteMoneySource(formData)
    if (!result.ok) {
      toast.error(result.error ?? "Could not remove")
      return
    }
    toast.success("Account removed")
    startTransition(() => router.refresh())
  }

  return (
    <div className={embedded ? "space-y-5" : "space-y-6"}>
      {!embedded ? (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Accounts</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Cash, bank accounts, and credit cards you spend from.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="rounded-full"
            onClick={() => setAddOpen(true)}
          >
            Add account
          </Button>
        </div>
      ) : (
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            className="rounded-full"
            onClick={() => setAddOpen(true)}
          >
            Add account
          </Button>
        </div>
      )}

      {!ready ? (
        <TrackAccountRowsSkeleton count={4} />
      ) : (
        <div className={embedded ? "space-y-5" : "space-y-8"}>
          {!embedded ? (
            <AccountsSummaryCard
              currency={currency}
              netAvailable={totalLiquidBalance}
              banks={summary.banks}
              cards={summary.cards}
              cash={summary.cash}
            />
          ) : null}

          {grouped.map((group) => (
            <section key={group.kind} className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                {MONEY_SOURCE_KIND_LABEL[group.kind]}
              </h2>
              {group.items.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                  No {MONEY_SOURCE_KIND_LABEL[group.kind].toLowerCase()} yet.
                </p>
              ) : (
                <ul
                  className={cn(
                    "grid gap-3",
                    !embedded && group.items.length > 1 && "sm:grid-cols-2"
                  )}
                >
                  {group.items.map((source) => (
                    <AccountCard
                      key={source.id}
                      source={source}
                      embedded={embedded}
                      currency={currency}
                      balance={sourceBalance(source.id)}
                      usage={cardLimitUsage(
                        source,
                        sources,
                        sourceBalance,
                        cardCreditLimit
                      )}
                      onEdit={() => setEditing(source)}
                      onDelete={() => handleDelete(source)}
                    />
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

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
    </div>
  )
}

function AccountsSummaryCard({
  currency,
  netAvailable,
  banks,
  cards,
  cash,
}: {
  currency: string
  netAvailable: number
  banks: { count: number; total: number }
  cards: { count: number; total: number }
  cash: { count: number; total: number }
}) {
  const { formatMoney, hidden, toggleHidden } = useTrackMoney()

  return (
    <section className="track-panel overflow-hidden p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Net available</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
            {formatMoney(netAvailable, currency)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Cash + banks − card balances
          </p>
        </div>
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
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
        <SummaryStat
          icon={Landmark}
          label={banks.count === 1 ? "Bank" : "Banks"}
          count={banks.count}
          value={formatMoney(banks.total, currency)}
        />
        <SummaryStat
          icon={CreditCard}
          label={cards.count === 1 ? "Card" : "Cards"}
          count={cards.count}
          value={formatMoney(cards.total, currency)}
          hint="owed"
        />
        <SummaryStat
          icon={Wallet}
          label={cash.count === 1 ? "Wallet" : "Wallets"}
          count={cash.count}
          value={formatMoney(cash.total, currency)}
        />
      </div>
    </section>
  )
}

function SummaryStat({
  icon: Icon,
  label,
  count,
  value,
  hint,
}: {
  icon: LucideIcon
  label: string
  count: number
  value: string
  hint?: string
}) {
  return (
    <div className="track-panel-elevated flex flex-col gap-2 px-3 py-3 sm:px-4">
      <div className="flex size-8 items-center justify-center rounded-xl bg-secondary">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">
          {count} {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold tabular-nums sm:text-base">
          {value}
        </p>
        {hint ? (
          <p className="text-[11px] text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    </div>
  )
}

function AccountCard({
  source,
  embedded,
  currency,
  balance,
  usage,
  onEdit,
  onDelete,
}: {
  source: MoneySource
  embedded: boolean
  currency: string
  balance: number
  usage: ReturnType<typeof cardLimitUsage>
  onEdit: () => void
  onDelete: () => void
}) {
  const { formatMoney } = useTrackMoney()
  const Icon = KIND_ICON[source.kind]
  const isCard = source.kind === "credit_card"
  const number = source.last4 ? `•••• ${source.last4}` : null
  const meta =
    source.institution ||
    (source.kind === "cash"
      ? "Cash wallet"
      : source.kind === "bank"
        ? "Bank account"
        : "Credit card")

  return (
    <li
      className={cn(
        "relative overflow-hidden rounded-3xl",
        isCard
          ? "bg-primary text-primary-foreground shadow-md"
          : embedded
            ? "track-panel-elevated"
            : "track-panel"
      )}
    >
      {isCard ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full bg-white/10"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-6 top-10 size-24 rounded-full bg-white/8"
          />
        </>
      ) : null}

      <div className={cn("relative", embedded ? "p-3.5" : "p-4")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-2xl",
                isCard ? "bg-white/15" : "bg-secondary"
              )}
            >
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium">{source.name}</p>
                {source.isDefault ? (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                      isCard
                        ? "bg-white/15 text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    Default
                  </span>
                ) : null}
              </div>
              <p
                className={cn(
                  "mt-0.5 truncate text-sm",
                  isCard
                    ? "text-primary-foreground/75"
                    : "text-muted-foreground"
                )}
              >
                {meta}
              </p>
              {number ? (
                <p
                  className={cn(
                    "mt-1 font-mono text-xs tabular-nums tracking-wider",
                    isCard
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  )}
                >
                  {number}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className={
                isCard
                  ? "text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
                  : undefined
              }
              onClick={onEdit}
              aria-label="Edit account"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className={
                isCard
                  ? "text-red-200 hover:bg-white/10 hover:text-red-100"
                  : "text-destructive hover:text-destructive"
              }
              onClick={onDelete}
              aria-label="Delete account"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <p
            className={cn(
              "text-xs",
              isCard ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            {isCard ? "Outstanding" : "Balance"}
          </p>
          <p className="mt-0.5 text-xl font-semibold tracking-tight tabular-nums">
            {formatMoney(balance, currency)}
          </p>
        </div>

        {usage ? (
          <div className="mt-3 space-y-1.5">
            <div
              className={cn(
                "h-1.5 overflow-hidden rounded-full",
                isCard ? "bg-white/25" : "bg-secondary"
              )}
            >
              <div
                className={cn(
                  "h-full rounded-full",
                  isCard ? "bg-white" : "bg-primary",
                  usage.usedPct >= 90 && !isCard && "bg-destructive"
                )}
                style={{ width: `${usage.usedPct}%` }}
              />
            </div>
            <div
              className={cn(
                "flex items-center justify-between gap-2 text-[11px] tabular-nums",
                isCard ? "text-primary-foreground/80" : "text-muted-foreground"
              )}
            >
              <span>Used {formatMoney(usage.used, currency)}</span>
              <span>Available {formatMoney(usage.available, currency)}</span>
            </div>
            <p
              className={cn(
                "text-[11px] tabular-nums",
                isCard ? "text-primary-foreground/65" : "text-muted-foreground"
              )}
            >
              Limit {formatMoney(usage.limit, currency)}
              {source.creditLimitPoolId ? " · shared" : ""}
            </p>
          </div>
        ) : null}
      </div>
    </li>
  )
}

function cardLimitUsage(
  source: MoneySource,
  allSources: MoneySource[],
  balanceFor: (id: string) => number,
  limitFor: (source: MoneySource) => number | null
) {
  if (source.kind !== "credit_card") return null
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
