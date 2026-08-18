"use client"

import { Suspense } from "react"
import { TrackLedgerProvider } from "@track/components/track-ledger-provider"
import { TrackPrivacyProvider } from "@track/components/track-privacy-provider"
import { TrackQuickAddHost } from "@track/components/track-quick-add-host"
import type { CreditLimitPool, MoneySource } from "@track/lib/money-sources"
import type { ExpenseCategory } from "@track/lib/types"

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
    <TrackPrivacyProvider>
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
    </TrackPrivacyProvider>
  )
}
