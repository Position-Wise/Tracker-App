export type QuickAddKind = "expense" | "income" | "transfer"

export const TRACK_QUICK_ADD_EVENT = "track:quick-add"

export function isQuickAddKind(value: string | null | undefined): value is QuickAddKind {
  return value === "expense" || value === "income" || value === "transfer"
}

export function requestQuickAdd(kind: QuickAddKind) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent(TRACK_QUICK_ADD_EVENT, { detail: { kind } })
  )
}
