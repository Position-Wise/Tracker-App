"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/app/app/actions"
import LoadingSubmitButton from "@/components/ui/loading-submit-button"
import { Input } from "@/components/ui/input"
import type { ExpenseCategory } from "@/lib/track/types"

type CategoriesManagerProps = {
  categories: ExpenseCategory[]
}

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const system = categories.filter((c) => c.is_system)
  const custom = categories.filter((c) => !c.is_system)

  async function handleCreate(formData: FormData) {
    const result = await createCategory(formData)
    if (!result.ok) {
      toast.error(result.error ?? "Could not create category")
      return
    }
    toast.success("Category added")
    startTransition(() => router.refresh())
  }

  async function handleUpdate(formData: FormData) {
    const result = await updateCategory(formData)
    if (!result.ok) {
      toast.error(result.error ?? "Could not update")
      return
    }
    toast.success("Category updated")
    startTransition(() => router.refresh())
  }

  async function handleDelete(formData: FormData) {
    const result = await deleteCategory(formData)
    if (!result.ok) {
      toast.error(result.error ?? "Could not delete")
      return
    }
    toast.success("Category deleted")
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Defaults</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {system.map((category) => (
            <li
              key={category.id}
              className="rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-sm"
            >
              {category.name}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Your categories</h2>
        {custom.length === 0 ? (
          <p className="text-sm text-muted-foreground">No custom categories yet.</p>
        ) : (
          <ul className="space-y-2">
            {custom.map((category) => (
              <li
                key={category.id}
                className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-secondary/40 px-3 py-2"
              >
                <form action={handleUpdate} className="flex min-w-0 flex-1 items-center gap-2">
                  <input type="hidden" name="categoryId" value={category.id} />
                  <Input
                    name="name"
                    defaultValue={category.name}
                    required
                    className="h-8"
                  />
                  <LoadingSubmitButton size="xs" variant="outline" pendingText="…">
                    Save
                  </LoadingSubmitButton>
                </form>
                <form action={handleDelete}>
                  <input type="hidden" name="categoryId" value={category.id} />
                  <LoadingSubmitButton
                    size="xs"
                    variant="ghost"
                    pendingText="…"
                    className="text-destructive hover:text-destructive"
                  >
                    Delete
                  </LoadingSubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form action={handleCreate} className="flex flex-wrap items-end gap-2 pt-2">
          <div className="min-w-48 flex-1 space-y-1.5">
            <label htmlFor="new-category" className="text-sm font-medium">
              Add category
            </label>
            <Input id="new-category" name="name" required placeholder="e.g. Pets" />
          </div>
          <LoadingSubmitButton pendingText="Adding...">Add</LoadingSubmitButton>
        </form>
      </section>
    </div>
  )
}
