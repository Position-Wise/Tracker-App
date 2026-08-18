"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import {
  deleteExpense,
  deleteIncome,
  deleteTransfer,
} from "@track/app/actions"
import LoadingSubmitButton from "@/components/ui/loading-submit-button"
import {
  TransactionFormDialog,
  type TransactionFormKind,
} from "@track/components/transaction-form-dialog"
import type { TrackActivityItem } from "@track/lib/activity-types"
import type { ExpenseCategory, ExpenseWithCategory } from "@track/lib/types"
import { cn } from "@/lib/utils"

type ExpenseFormDialogProps = {
  categories: ExpenseCategory[]
  expense?: ExpenseWithCategory | null
  activity?: TrackActivityItem | null
  triggerLabel?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  kind?: TransactionFormKind
}

/** Expense-oriented dialog; pass kind for income/transfer too. */
export function ExpenseFormDialog({
  kind = "expense",
  ...props
}: ExpenseFormDialogProps) {
  return <TransactionFormDialog kind={kind} {...props} />
}

export function DeleteExpenseButton({
  expenseId,
  className,
}: {
  expenseId: string
  className?: string
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleDelete(formData: FormData) {
    const result = await deleteExpense(formData)
    if (!result.ok) {
      toast.error(result.error ?? "Could not delete")
      return
    }
    toast.success("Expense deleted")
    startTransition(() => router.refresh())
  }

  return (
    <form action={handleDelete}>
      <input type="hidden" name="expenseId" value={expenseId} />
      <LoadingSubmitButton
        type="submit"
        variant="ghost"
        size="xs"
        pendingText="…"
        className={cn("text-destructive hover:text-destructive", className)}
      >
        Delete
      </LoadingSubmitButton>
    </form>
  )
}

export function DeleteIncomeButton({
  incomeId,
  className,
}: {
  incomeId: string
  className?: string
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleDelete(formData: FormData) {
    const result = await deleteIncome(formData)
    if (!result.ok) {
      toast.error(result.error ?? "Could not delete")
      return
    }
    toast.success("Income deleted")
    startTransition(() => router.refresh())
  }

  return (
    <form action={handleDelete}>
      <input type="hidden" name="incomeId" value={incomeId} />
      <LoadingSubmitButton
        type="submit"
        variant="ghost"
        size="xs"
        pendingText="…"
        className={cn("text-destructive hover:text-destructive", className)}
      >
        Delete
      </LoadingSubmitButton>
    </form>
  )
}

export function DeleteTransferButton({
  transferId,
  className,
}: {
  transferId: string
  className?: string
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleDelete(formData: FormData) {
    const result = await deleteTransfer(formData)
    if (!result.ok) {
      toast.error(result.error ?? "Could not delete")
      return
    }
    toast.success("Transfer deleted")
    startTransition(() => router.refresh())
  }

  return (
    <form action={handleDelete}>
      <input type="hidden" name="transferId" value={transferId} />
      <LoadingSubmitButton
        type="submit"
        variant="ghost"
        size="xs"
        pendingText="…"
        className={cn("text-destructive hover:text-destructive", className)}
      >
        Delete
      </LoadingSubmitButton>
    </form>
  )
}
