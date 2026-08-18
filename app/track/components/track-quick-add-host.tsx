"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { TransactionFormDialog } from "@track/components/transaction-form-dialog"
import {
  isQuickAddKind,
  TRACK_QUICK_ADD_EVENT,
  type QuickAddKind,
} from "@track/lib/quick-add"
import type { ExpenseCategory } from "@track/lib/types"

type TrackQuickAddHostProps = {
  categories: ExpenseCategory[]
}

export function TrackQuickAddHost({ categories }: TrackQuickAddHostProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [formKind, setFormKind] = useState<QuickAddKind | null>(null)

  useEffect(() => {
    const onQuickAdd = (event: Event) => {
      const detail = (event as CustomEvent<{ kind?: string }>).detail
      if (isQuickAddKind(detail?.kind)) {
        setFormKind(detail.kind)
      }
    }

    window.addEventListener(TRACK_QUICK_ADD_EVENT, onQuickAdd)
    return () => window.removeEventListener(TRACK_QUICK_ADD_EVENT, onQuickAdd)
  }, [])

  useEffect(() => {
    const add = searchParams.get("add")
    if (!isQuickAddKind(add)) return

    setFormKind(add)
    const next = new URLSearchParams(searchParams.toString())
    next.delete("add")
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  if (!formKind) return null

  return (
    <TransactionFormDialog
      kind={formKind}
      categories={categories}
      open
      onOpenChange={(next) => {
        if (!next) setFormKind(null)
      }}
    />
  )
}
