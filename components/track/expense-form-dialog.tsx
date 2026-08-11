"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { deleteExpense } from "@/app/app/actions"
import LoadingSubmitButton from "@/components/ui/loading-submit-button"
import {
  TransactionFormDialog,
  type TransactionFormKind,
} from "@/components/track/transaction-form-dialog"
import type { ExpenseCategory, ExpenseWithCategory } from "@/lib/track/types"
import { cn } from "@/lib/utils"

type ExpenseFormDialogProps = {
  categories: ExpenseCategory[]
  expense?: ExpenseWithCategory | null
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
