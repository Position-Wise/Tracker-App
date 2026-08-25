"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@track/app/actions"
import LoadingSubmitButton from "@/components/ui/loading-submit-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ExpenseCategory } from "@track/lib/types"

type CategoriesManagerProps = {
  categories: ExpenseCategory[]
}

const ghostActionClassName =
  "h-9 px-2 text-sm font-medium shadow-none hover:bg-transparent hover:underline"

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [addFormKey, setAddFormKey] = useState(0)
  const system = categories.filter((category) => category.is_system)
  const custom = categories.filter((category) => !category.is_system)

  async function handleCreate(formData: FormData) {
    const result = await createCategory(formData)
    if (!result.ok) {
      toast.error(result.error ?? "Could not create category")
      return
    }
    toast.success("Category added")
    setAddFormKey((key) => key + 1)
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
    <div>
      <div className="px-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Defaults
        </p>
        <ul className="divide-y divide-border/70">
          {system.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between gap-4 py-4"
            >
              <span className="text-sm text-foreground">{category.name}</span>
              <span className="text-sm text-muted-foreground">Built in</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-8">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Yours
          </p>
          {isEditing ? (
            <Button
              type="button"
              variant="ghost"
              className={`${ghostActionClassName} text-muted-foreground hover:text-foreground`}
              onClick={() => setIsEditing(false)}
            >
              Done
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              className={`${ghostActionClassName} text-primary`}
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
        </div>

        {isEditing ? (
          <div>
            {custom.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                No custom categories yet.
              </p>
            ) : (
              <ul className="divide-y divide-border/70">
                {custom.map((category) => (
                  <li
                    key={category.id}
                    className="flex items-center gap-3 py-3"
                  >
                    <form
                      action={handleUpdate}
                      className="flex min-w-0 flex-1 items-center gap-2"
                    >
                      <input type="hidden" name="categoryId" value={category.id} />
                      <Input
                        name="name"
                        defaultValue={category.name}
                        required
                        aria-label={`Rename ${category.name}`}
                        className="h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-semibold shadow-none focus-visible:border-transparent focus-visible:ring-0"
                      />
                      <LoadingSubmitButton
                        size="xs"
                        variant="ghost"
                        pendingText="Saving..."
                        className={`${ghostActionClassName} text-primary`}
                      >
                        Save
                      </LoadingSubmitButton>
                    </form>
                    <form action={handleDelete}>
                      <input type="hidden" name="categoryId" value={category.id} />
                      <LoadingSubmitButton
                        size="xs"
                        variant="ghost"
                        pendingText="…"
                        className={`${ghostActionClassName} text-destructive hover:text-destructive`}
                      >
                        Delete
                      </LoadingSubmitButton>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            <form
              key={addFormKey}
              action={handleCreate}
              className="flex items-center gap-2 border-t border-border/70 py-3"
            >
              <Input
                id="new-category"
                name="name"
                required
                autoFocus={custom.length === 0}
                placeholder="New category"
                aria-label="New category name"
                className="h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-sm shadow-none placeholder:text-muted-foreground focus-visible:border-transparent focus-visible:ring-0"
              />
              <LoadingSubmitButton
                pendingText="Adding..."
                variant="ghost"
                className={`${ghostActionClassName} text-primary`}
              >
                Add
              </LoadingSubmitButton>
            </form>
          </div>
        ) : custom.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            No custom categories yet.
          </p>
        ) : (
          <ul className="divide-y divide-border/70">
            {custom.map((category) => (
              <li
                key={category.id}
                className="flex items-center justify-between gap-4 py-4"
              >
                <span className="text-sm text-foreground">{category.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
