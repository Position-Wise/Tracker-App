import type { ReactNode } from "react"

export function FormError({
  id,
  children,
}: {
  id?: string
  children?: ReactNode
}) {
  if (!children) return null

  return (
    <p
      id={id}
      role="alert"
      className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {children}
    </p>
  )
}
