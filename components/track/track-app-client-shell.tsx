"use client"

import { TrackLedgerProvider } from "@/components/track/track-ledger-provider"
import type { CreditLimitPool, MoneySource } from "@/lib/track/money-sources"

export function TrackAppClientShell({
  currency,
  sources,
  creditLimitPools = [],
  balances,
  expenseSourceMap,
  children,
}: {
  currency: string
  sources: MoneySource[]
  creditLimitPools?: CreditLimitPool[]
  balances: Record<string, number>
  expenseSourceMap?: Record<string, string | null>
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
    </TrackLedgerProvider>
  )
}
