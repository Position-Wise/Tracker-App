"use client"

import { Suspense } from "react"
import { TrackLedgerProvider } from "@/components/track/track-ledger-provider"
import { TrackQuickAddHost } from "@/components/track/track-quick-add-host"
import type { CreditLimitPool, MoneySource } from "@/lib/track/money-sources"
import type { ExpenseCategory } from "@/lib/track/types"

export function TrackAppClientShell({
  currency,
  sources,
  creditLimitPools = [],
  balances,
  expenseSourceMap,
  categories = [],
  children,
}: {
  currency: string
  sources: MoneySource[]
  creditLimitPools?: CreditLimitPool[]
  balances: Record<string, number>
  expenseSourceMap?: Record<string, string | null>
  categories?: ExpenseCategory[]
  children: React.ReactNode
}) {
  return (
    <TrackLedgerProvider
      currency={currency}
      sources={sources}
      creditLimitPools={creditLimitPools}
      balances={balances}
      expenseSourceMap={expenseSourceMap}
    >
      {children}
      <Suspense fallback={null}>
        <TrackQuickAddHost categories={categories} />
      </Suspense>
    </TrackLedgerProvider>
  )
}
