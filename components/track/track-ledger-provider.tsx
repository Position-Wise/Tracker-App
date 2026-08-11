"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react"
import type { CreditLimitPool, MoneySource } from "@/lib/track/money-sources"
import { effectiveCreditLimit } from "@/lib/track/money-sources"

type TrackLedgerContextValue = {
  ready: boolean
  currency: string
  sources: MoneySource[]
  creditLimitPools: CreditLimitPool[]
  balances: Record<string, number>
  sourceBalance: (sourceId: string) => number
  totalLiquidBalance: number
  sourceName: (id: string | null | undefined) => string | undefined
  getExpenseSourceId: (expenseId: string) => string | null
  expenseSourceMap: Record<string, string | null>
  cardCreditLimit: (source: MoneySource) => number | null
}

const TrackLedgerContext = createContext<TrackLedgerContextValue | null>(null)

export function TrackLedgerProvider({
  currency,
  sources,
  creditLimitPools = [],
  balances,
  expenseSourceMap = {},
  children,
}: {
  currency: string
  sources: MoneySource[]
  creditLimitPools?: CreditLimitPool[]
  balances: Record<string, number>
  /** expenseId → sourceId from server rows */
  expenseSourceMap?: Record<string, string | null>
  children: ReactNode
}) {
  const sourceMap = useMemo(() => {
    const map = new Map<string, MoneySource>()
    for (const source of sources) map.set(source.id, source)
    return map
  }, [sources])

  const sourceName = useCallback(
    (id: string | null | undefined) => {
      if (!id) return undefined
      return sourceMap.get(id)?.name
    },
    [sourceMap]
  )

  const sourceBalance = useCallback(
    (sourceId: string) => balances[sourceId] ?? 0,
    [balances]
  )

  const totalLiquidBalance = useMemo(() => {
    return sources.reduce((sum, source) => {
      const bal = balances[source.id] ?? 0
      if (source.kind === "credit_card") return sum - Math.max(0, bal)
      return sum + bal
    }, 0)
  }, [sources, balances])

  const getExpenseSourceId = useCallback(
    (expenseId: string) => expenseSourceMap[expenseId] ?? null,
    [expenseSourceMap]
  )

  const cardCreditLimit = useCallback(
    (source: MoneySource) => effectiveCreditLimit(source, creditLimitPools),
    [creditLimitPools]
  )

  const value: TrackLedgerContextValue = {
    ready: true,
    currency,
    sources,
    creditLimitPools,
    balances,
    sourceBalance,
    totalLiquidBalance,
    sourceName,
    getExpenseSourceId,
    expenseSourceMap,
    cardCreditLimit,
  }

  return (
    <TrackLedgerContext.Provider value={value}>
      {children}
    </TrackLedgerContext.Provider>
  )
}

export function useTrackLedger() {
  const ctx = useContext(TrackLedgerContext)
  if (!ctx) {
    throw new Error("useTrackLedger must be used within TrackLedgerProvider")
  }
  return ctx
}
