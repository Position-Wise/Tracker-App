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
  updateIncome,
  updateTransfer,
  type TrackActionResult,
} from "@track/app/actions"
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
import { MoneySourceSelect } from "@track/components/money-source-form-dialog"
import { useTrackLedger } from "@track/components/track-ledger-provider"
import { toDateInputValue } from "@track/lib/month"
import { DEFAULT_INCOME_TITLES } from "@track/lib/money-sources"
import type { TrackActivityItem } from "@track/lib/activity-types"
import type { ExpenseCategory, ExpenseWithCategory } from "@track/lib/types"

export type TransactionFormKind =
  | "expense"
  | "income"
  | "transfer"
  | "card_bill"

type TransactionFormDialogProps = {
  kind: TransactionFormKind
  categories?: ExpenseCategory[]
  expense?: ExpenseWithCategory | null
  activity?: TrackActivityItem | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  triggerLabel?: string
  /** Prefills the date field when creating a new entry. */
  initialDate?: string
}

function fieldClassName() {
  return "border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
}

export function TransactionFormDialog({
  kind,
  categories = [],
  expense,
  activity,
  open: controlledOpen,
  onOpenChange,
  triggerLabel,
  initialDate,
}: TransactionFormDialogProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const { sources, getExpenseSourceId } = useTrackLedger()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen

  const editingIncome = kind === "income" && activity?.kind === "income" ? activity : null
  const editingTransfer =
    (kind === "transfer" || kind === "card_bill") && activity?.kind === "transfer"
      ? activity
      : null
  const isCardBill =
    kind === "card_bill" || editingTransfer?.transferPurpose === "card_bill"

  const title =
    kind === "expense"
      ? expense
        ? "Edit expense"
        : "Add expense"
      : kind === "income"
        ? editingIncome
          ? "Edit income"
          : "Add income"
        : isCardBill
          ? editingTransfer
            ? "Edit card bill"
            : "Pay card bill"
          : editingTransfer
            ? "Edit transfer"
            : "Add transfer"

  const defaultTrigger =
    triggerLabel ??
    (kind === "expense"
      ? "Add expense"
      : kind === "income"
        ? "Add income"
        : kind === "card_bill"
          ? "Pay card bill"
          : "Add transfer")

  const defaultDate = expense
    ? toDateInputValue(expense.spent_at)
    : activity
      ? toDateInputValue(activity.occurredAt)
      : (initialDate ?? toDateInputValue(new Date().toISOString()))

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
    const action = editingIncome ? updateIncome : createIncome
    const result = await action(formData)
    if (!result.ok) {
      toast.error(result.error ?? "Could not save income")
      return
    }
    toast.success(editingIncome ? "Income updated" : "Income recorded")
    setOpen(false)
    startTransition(() => router.refresh())
  }

  async function handleTransfer(formData: FormData) {
    const action = editingTransfer ? updateTransfer : createTransfer
    const result = await action(formData)
    if (!result.ok) {
      toast.error(result.error ?? "Could not save")
      return
    }
    toast.success(
      isCardBill
        ? editingTransfer
          ? "Card bill updated"
          : "Card bill paid"
        : editingTransfer
          ? "Transfer updated"
          : "Transfer recorded"
    )
    setOpen(false)
    startTransition(() => router.refresh())
  }

  const incomeTitleDefault = editingIncome?.title ?? "Salary"

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
            <DateNoteFields
              key={defaultDate}
              defaultDate={defaultDate}
              note={expense?.note}
            />
            <LoadingSubmitButton className="w-full" pendingText="Saving...">
              {expense ? "Save changes" : "Add expense"}
            </LoadingSubmitButton>
          </form>
        ) : null}

        {kind === "income" ? (
          <form action={handleIncome} className="space-y-4">
            {editingIncome ? (
              <input type="hidden" name="incomeId" value={editingIncome.id} />
            ) : null}
            <AmountField defaultValue={editingIncome?.amount} />
            <div className="space-y-1.5">
              <label htmlFor="title" className="text-sm font-medium">
                Income type
              </label>
              <select
                id="title"
                name="title"
                required
                defaultValue={incomeTitleDefault}
                className={fieldClassName()}
              >
                {editingIncome?.title &&
                !(DEFAULT_INCOME_TITLES as readonly string[]).includes(
                  editingIncome.title
                ) ? (
                  <option value={editingIncome.title}>
                    {editingIncome.title}
                  </option>
                ) : null}
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
              defaultValue={editingIncome?.toSourceId}
              kinds={["cash", "bank"]}
              required
            />
            <DateNoteFields
              defaultDate={defaultDate}
              note={editingIncome?.note}
            />
            <LoadingSubmitButton className="w-full" pendingText="Saving...">
              {editingIncome ? "Save changes" : "Add income"}
            </LoadingSubmitButton>
          </form>
        ) : null}

        {kind === "transfer" ? (
          <form action={handleTransfer} className="space-y-4">
            {editingTransfer ? (
              <input
                type="hidden"
                name="transferId"
                value={editingTransfer.id}
              />
            ) : null}
            <input type="hidden" name="purpose" value="transfer" />
            <AmountField defaultValue={editingTransfer?.amount} />
            <MoneySourceSelect
              name="fromSourceId"
              label="From"
              sources={sources}
              defaultValue={editingTransfer?.fromSourceId}
              required
            />
            <MoneySourceSelect
              name="toSourceId"
              label="To"
              sources={sources}
              defaultValue={editingTransfer?.toSourceId}
              required
            />
            <DateNoteFields
              defaultDate={defaultDate}
              note={editingTransfer?.note}
            />
            <LoadingSubmitButton className="w-full" pendingText="Saving...">
              {editingTransfer ? "Save changes" : "Add transfer"}
            </LoadingSubmitButton>
          </form>
        ) : null}

        {kind === "card_bill" ? (
          <form action={handleTransfer} className="space-y-4">
            {editingTransfer ? (
              <input
                type="hidden"
                name="transferId"
                value={editingTransfer.id}
              />
            ) : null}
            <input type="hidden" name="purpose" value="card_bill" />
            <p className="text-sm text-muted-foreground">
              Pays down the card&apos;s used amount and deducts from your bank
              or cash.
            </p>
            <AmountField defaultValue={editingTransfer?.amount} />
            <MoneySourceSelect
              name="fromSourceId"
              label="Pay from"
              sources={sources}
              defaultValue={editingTransfer?.fromSourceId}
              kinds={["cash", "bank"]}
              required
            />
            <MoneySourceSelect
              name="toSourceId"
              label="Credit card"
              sources={sources}
              defaultValue={editingTransfer?.toSourceId}
              kinds={["credit_card"]}
              required
            />
            <DateNoteFields
              defaultDate={defaultDate}
              note={editingTransfer?.note ?? "Credit card bill"}
            />
            <LoadingSubmitButton className="w-full" pendingText="Saving...">
              {editingTransfer ? "Save changes" : "Pay bill"}
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
