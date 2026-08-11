"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, Landmark, Pencil, Trash2, Wallet } from "lucide-react"
import { toast } from "sonner"
import { deleteMoneySource } from "@/app/app/actions"
import { MoneySourceFormDialog } from "@/components/track/money-source-form-dialog"
import { useTrackLedger } from "@/components/track/track-ledger-provider"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/track/month"
import {
  MONEY_SOURCE_KIND_LABEL,
  sourceSubtitle,
  type MoneySource,
  type MoneySourceKind,
} from "@/lib/track/money-sources"

const KIND_ORDER: MoneySourceKind[] = ["cash", "bank", "credit_card"]

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
    creditLimitPools,
    cardCreditLimit,
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
        <p className="text-sm text-muted-foreground">Loading accounts…</p>
      ) : (
        <div className={embedded ? "space-y-5" : "space-y-8"}>
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
                <ul className="space-y-2">
                  {group.items.map((source) => {
                    const Icon =
                      source.kind === "bank"
                        ? Landmark
                        : source.kind === "credit_card"
                          ? CreditCard
                          : Wallet
                    const limit = cardCreditLimit(source)
                    return (
                      <li
                        key={source.id}
                        className={
                          embedded
                            ? "track-panel-elevated flex flex-wrap items-center gap-3 px-3 py-3"
                            : "track-panel flex flex-wrap items-center gap-3 px-4 py-3"
                        }
                      >
                        <div className="flex size-10 items-center justify-center rounded-xl bg-secondary">
                          <Icon className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{source.name}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {sourceSubtitle(source, creditLimitPools)}
                            {source.isDefault ? " · Default" : ""}
                          </p>
                          {source.kind === "credit_card" && limit != null ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Limit {formatMoney(limit, currency)}
                              {source.creditLimitPoolId ? " · shared" : ""}
                            </p>
                          ) : null}
                        </div>
                        <p className="font-semibold tabular-nums">
                          {formatMoney(sourceBalance(source.id), currency)}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => setEditing(source)}
                            aria-label="Edit account"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(source)}
                            aria-label="Delete account"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </li>
                    )
                  })}
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
