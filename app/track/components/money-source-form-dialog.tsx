"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import {
  createMoneySource,
  updateMoneySource,
} from "@track/app/actions"
import { useTrackLedger } from "@track/components/track-ledger-provider"
import LoadingSubmitButton from "@/components/ui/loading-submit-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  MONEY_SOURCE_KIND_LABEL,
  type MoneySource,
  type MoneySourceKind,
} from "@track/lib/money-sources"
import { formatMoney } from "@track/lib/month"

const KIND_OPTIONS: MoneySourceKind[] = ["cash", "bank", "credit_card"]

type LimitMode = "own" | "shared"

type MoneySourceFormDialogProps = {
  source?: MoneySource | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  triggerLabel?: string
}

export function MoneySourceFormDialog({
  source,
  open: controlledOpen,
  onOpenChange,
  triggerLabel = "Add account",
}: MoneySourceFormDialogProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const { creditLimitPools, sources, currency } = useTrackLedger()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen
  const [kind, setKind] = useState<MoneySourceKind>(source?.kind ?? "bank")
  const [limitMode, setLimitMode] = useState<LimitMode>(
    source?.creditLimitPoolId ? "shared" : "own"
  )
  const [poolChoice, setPoolChoice] = useState(
    source?.creditLimitPoolId ?? (creditLimitPools[0]?.id ?? "__new__")
  )

  const showBankFields = kind === "bank" || kind === "credit_card"

  const selectedPool = useMemo(
    () => creditLimitPools.find((p) => p.id === poolChoice) ?? null,
    [creditLimitPools, poolChoice]
  )

  const cardsOnSelectedPool = useMemo(() => {
    if (!selectedPool) return []
    return sources.filter(
      (s) =>
        s.kind === "credit_card" &&
        s.creditLimitPoolId === selectedPool.id &&
        s.id !== source?.id
    )
  }, [selectedPool, sources, source?.id])

  function handleOpenChange(next: boolean) {
    if (next) {
      setKind(source?.kind ?? "bank")
      setLimitMode(source?.creditLimitPoolId ? "shared" : "own")
      setPoolChoice(
        source?.creditLimitPoolId ?? (creditLimitPools[0]?.id ?? "__new__")
      )
    }
    setOpen(next)
  }

  async function handleSubmit(formData: FormData) {
    formData.set("kind", kind)
    if (kind === "credit_card") {
      formData.set("limitMode", limitMode)
      if (limitMode === "shared") {
        formData.set("creditLimitPoolId", poolChoice)
      }
    }
    const result = source
      ? await updateMoneySource(formData)
      : await createMoneySource(formData)

    if (!result.ok) {
      toast.error(result.error ?? "Could not save account")
      return
    }

    toast.success(source ? "Account updated" : "Account added")
    setOpen(false)
    startTransition(() => router.refresh())
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {controlledOpen === undefined ? (
        <DialogTrigger asChild>
          <Button size="sm" className="rounded-full">
            {triggerLabel}
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{source ? "Edit account" : "Add account"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {source ? (
            <input type="hidden" name="sourceId" value={source.id} />
          ) : null}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Type</p>
            <div className="grid grid-cols-3 gap-2">
              {KIND_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setKind(option)}
                  className={
                    kind === option
                      ? "rounded-xl bg-primary px-2 py-2.5 text-center text-xs font-medium text-primary-foreground"
                      : "rounded-xl border border-border bg-card px-2 py-2.5 text-center text-xs text-muted-foreground hover:bg-secondary"
                  }
                >
                  {MONEY_SOURCE_KIND_LABEL[option]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="source-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="source-name"
              name="name"
              required
              defaultValue={source?.name ?? ""}
              placeholder={
                kind === "cash"
                  ? "Cash"
                  : kind === "bank"
                    ? "HDFC Savings"
                    : "HDFC Millennia"
              }
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="openingBalance" className="text-sm font-medium">
              {kind === "credit_card" ? "Current amount owed" : "Opening balance"}
            </label>
            <Input
              id="openingBalance"
              name="openingBalance"
              type="number"
              inputMode="decimal"
              step="0.01"
              defaultValue={source?.openingBalance ?? 0}
            />
          </div>

          {showBankFields ? (
            <>
              <div className="space-y-1.5">
                <label htmlFor="institution" className="text-sm font-medium">
                  Bank / issuer
                </label>
                <Input
                  id="institution"
                  name="institution"
                  defaultValue={source?.institution ?? ""}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="last4" className="text-sm font-medium">
                  Last 4 digits
                </label>
                <Input
                  id="last4"
                  name="last4"
                  maxLength={4}
                  inputMode="numeric"
                  defaultValue={source?.last4 ?? ""}
                  placeholder="1234"
                />
              </div>
            </>
          ) : null}

          {kind === "credit_card" ? (
            <div className="space-y-3 rounded-xl border border-border p-3">
              <p className="text-sm font-medium">Credit limit</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLimitMode("own")}
                  className={
                    limitMode === "own"
                      ? "rounded-xl bg-primary px-2 py-2 text-center text-xs font-medium text-primary-foreground"
                      : "rounded-xl border border-border bg-card px-2 py-2 text-center text-xs text-muted-foreground hover:bg-secondary"
                  }
                >
                  Own limit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLimitMode("shared")
                    if (!poolChoice) {
                      setPoolChoice(creditLimitPools[0]?.id ?? "__new__")
                    }
                  }}
                  className={
                    limitMode === "shared"
                      ? "rounded-xl bg-primary px-2 py-2 text-center text-xs font-medium text-primary-foreground"
                      : "rounded-xl border border-border bg-card px-2 py-2 text-center text-xs text-muted-foreground hover:bg-secondary"
                  }
                >
                  Shared limit
                </button>
              </div>

              {limitMode === "own" ? (
                <div className="space-y-1.5">
                  <label htmlFor="creditLimit" className="text-sm font-medium">
                    Limit amount
                  </label>
                  <Input
                    id="creditLimit"
                    name="creditLimit"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    defaultValue={
                      source?.creditLimitPoolId ? "" : (source?.creditLimit ?? "")
                    }
                    placeholder="e.g. 150000"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="creditLimitPoolId"
                      className="text-sm font-medium"
                    >
                      Shared pool
                    </label>
                    <select
                      id="creditLimitPoolId"
                      value={poolChoice}
                      onChange={(e) => setPoolChoice(e.target.value)}
                      className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    >
                      {creditLimitPools.map((pool) => (
                        <option key={pool.id} value={pool.id}>
                          {pool.name} ({formatMoney(pool.limitAmount, currency)})
                        </option>
                      ))}
                      <option value="__new__">Create new shared limit…</option>
                    </select>
                  </div>

                  {poolChoice === "__new__" ? (
                    <>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="newPoolName"
                          className="text-sm font-medium"
                        >
                          Shared limit name
                        </label>
                        <Input
                          id="newPoolName"
                          name="newPoolName"
                          required
                          placeholder="e.g. HDFC shared limit"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="newPoolLimit"
                          className="text-sm font-medium"
                        >
                          Limit amount
                        </label>
                        <Input
                          id="newPoolLimit"
                          name="newPoolLimit"
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          required
                          placeholder="e.g. 300000"
                        />
                      </div>
                    </>
                  ) : selectedPool ? (
                    <>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="sharedPoolLimit"
                          className="text-sm font-medium"
                        >
                          Shared limit amount
                        </label>
                        <Input
                          key={selectedPool.id}
                          id="sharedPoolLimit"
                          name="sharedPoolLimit"
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          defaultValue={selectedPool.limitAmount}
                        />
                        <p className="text-xs text-muted-foreground">
                          Editing this updates the limit for every card on this
                          pool.
                        </p>
                      </div>
                      {cardsOnSelectedPool.length > 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Also on this limit:{" "}
                          {cardsOnSelectedPool.map((c) => c.name).join(", ")}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No other cards on this shared limit yet.
                        </p>
                      )}
                    </>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}

          <LoadingSubmitButton className="w-full" pendingText="Saving...">
            {source ? "Save changes" : "Add account"}
          </LoadingSubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type SourceSelectProps = {
  name: string
  label: string
  sources: MoneySource[]
  defaultValue?: string
  required?: boolean
  excludeId?: string
  /** When set, only these account kinds appear. */
  kinds?: MoneySourceKind[]
}

export function MoneySourceSelect({
  name,
  label,
  sources,
  defaultValue,
  required,
  excludeId,
  kinds,
}: SourceSelectProps) {
  const options = useMemo(
    () =>
      sources.filter(
        (s) => s.id !== excludeId && (!kinds || kinds.includes(s.kind))
      ),
    [sources, excludeId, kinds]
  )
  const fallback =
    defaultValue && options.some((s) => s.id === defaultValue)
      ? defaultValue
      : options.find((s) => s.isDefault)?.id ?? options[0]?.id ?? ""

  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={fallback}
        className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
      >
        {options.length === 0 ? (
          <option value="" disabled>
            Add an account first
          </option>
        ) : (
          options.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name} ({MONEY_SOURCE_KIND_LABEL[source.kind]})
            </option>
          ))
        )}
      </select>
    </div>
  )
}
