"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import {
  createExpense,
  createIncome,
  createTransfer,
  updateExpense,
  type TrackActionResult,
} from "@/app/app/actions"
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
import { MoneySourceSelect } from "@/components/track/money-source-form-dialog"
import { useTrackLedger } from "@/components/track/track-ledger-provider"
import { toDateInputValue } from "@/lib/track/month"
import { DEFAULT_INCOME_TITLES } from "@/lib/track/money-sources"
import type { ExpenseCategory, ExpenseWithCategory } from "@/lib/track/types"

export type TransactionFormKind = "expense" | "income" | "transfer"

type TransactionFormDialogProps = {
  kind: TransactionFormKind
  categories?: ExpenseCategory[]
  expense?: ExpenseWithCategory | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  triggerLabel?: string
}

function fieldClassName() {
  return "border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
}

export function TransactionFormDialog({
  kind,
  categories = [],
  expense,
  open: controlledOpen,
  onOpenChange,
  triggerLabel,
}: TransactionFormDialogProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const { sources, getExpenseSourceId } = useTrackLedger()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen

  const title =
    kind === "expense"
      ? expense
        ? "Edit expense"
        : "Add expense"
      : kind === "income"
        ? "Add income"
        : "Add transfer"

  const defaultTrigger =
    triggerLabel ??
    (kind === "expense"
      ? "Add expense"
      : kind === "income"
        ? "Add income"
        : "Add transfer")

  const defaultDate = expense
    ? toDateInputValue(expense.spent_at)
    : toDateInputValue(new Date().toISOString())

  const linkedSourceId =
    expense?.source_id ??
    (expense?.id != null ? getExpenseSourceId(expense.id) : null)

  async function handleExpense(formData: FormData) {
    const action = expense ? updateExpense : createExpense
    const result: TrackActionResult = await action(formData)
    if (!result.ok) {
      toast.error(result.error ?? "Something went wrong")
      return
    }
    toast.success(expense ? "Expense updated" : "Expense added")
    setOpen(false)
    startTransition(() => router.refresh())
  }

  async function handleIncome(formData: FormData) {
    const result = await createIncome(formData)
    if (!result.ok) {
      toast.error(result.error ?? "Could not save income")
      return
    }
    toast.success("Income recorded")
    setOpen(false)
    startTransition(() => router.refresh())
  }

  async function handleTransfer(formData: FormData) {
    const result = await createTransfer(formData)
    if (!result.ok) {
      toast.error(result.error ?? "Could not transfer")
      return
    }
    toast.success("Transfer recorded")
    setOpen(false)
    startTransition(() => router.refresh())
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined ? (
        <DialogTrigger asChild>
          <Button size="sm" className="rounded-full">
            {defaultTrigger}
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {kind === "expense" ? (
          <form action={handleExpense} className="space-y-4">
            {expense ? (
              <input type="hidden" name="expenseId" value={expense.id} />
            ) : null}
            <AmountField defaultValue={expense?.amount} />
            <div className="space-y-1.5">
              <label htmlFor="categoryId" className="text-sm font-medium">
                Category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                required
                defaultValue={expense?.category_id ?? ""}
                className={fieldClassName()}
              >
                <option value="" disabled>
                  Select category
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                    {category.is_system ? "" : " (custom)"}
                  </option>
                ))}
              </select>
            </div>
            <MoneySourceSelect
              name="sourceId"
              label="Paid from"
              sources={sources}
              defaultValue={linkedSourceId ?? undefined}
              required
            />
            <DateNoteFields defaultDate={defaultDate} note={expense?.note} />
            <LoadingSubmitButton className="w-full" pendingText="Saving...">
              {expense ? "Save changes" : "Add expense"}
            </LoadingSubmitButton>
          </form>
        ) : null}

        {kind === "income" ? (
          <form action={handleIncome} className="space-y-4">
            <AmountField />
            <div className="space-y-1.5">
              <label htmlFor="title" className="text-sm font-medium">
                Income type
              </label>
              <select
                id="title"
                name="title"
                required
                defaultValue="Salary"
                className={fieldClassName()}
              >
                {DEFAULT_INCOME_TITLES.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <MoneySourceSelect
              name="toSourceId"
              label="Deposit to"
              sources={sources}
              required
            />
            <DateNoteFields defaultDate={defaultDate} />
            <LoadingSubmitButton className="w-full" pendingText="Saving...">
              Add income
            </LoadingSubmitButton>
          </form>
        ) : null}

        {kind === "transfer" ? (
          <form action={handleTransfer} className="space-y-4">
            <AmountField />
            <MoneySourceSelect
              name="fromSourceId"
              label="From"
              sources={sources}
              required
            />
            <MoneySourceSelect
              name="toSourceId"
              label="To"
              sources={sources}
              required
            />
            <DateNoteFields defaultDate={defaultDate} />
            <LoadingSubmitButton className="w-full" pendingText="Saving...">
              Add transfer
            </LoadingSubmitButton>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function AmountField({ defaultValue }: { defaultValue?: number }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor="amount" className="text-sm font-medium">
        Amount
      </label>
      <Input
        id="amount"
        name="amount"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0.01"
        required
        defaultValue={defaultValue ?? ""}
        placeholder="0.00"
      />
    </div>
  )
}

function DateNoteFields({
  defaultDate,
  note,
}: {
  defaultDate: string
  note?: string | null
}) {
  return (
    <>
      <div className="space-y-1.5">
        <label htmlFor="spentAt" className="text-sm font-medium">
          Date
        </label>
        <Input
          id="spentAt"
          name="spentAt"
          type="date"
          required
          defaultValue={defaultDate}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="note" className="text-sm font-medium">
          Note
        </label>
        <Input
          id="note"
          name="note"
          maxLength={2000}
          defaultValue={note ?? ""}
          placeholder="Optional"
        />
      </div>
    </>
  )
}
