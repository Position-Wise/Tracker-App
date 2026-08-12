"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { formatMoney as formatMoneyRaw } from "@/lib/track/month"

const STORAGE_KEY = "wise-track-hide-amounts"
const MASK = "••••••"

type TrackPrivacyContextValue = {
  hidden: boolean
  ready: boolean
  toggleHidden: () => void
  setHidden: (next: boolean) => void
  formatMoney: (amount: number, currency?: string) => string
}

const TrackPrivacyContext = createContext<TrackPrivacyContextValue | null>(null)

export function TrackPrivacyProvider({ children }: { children: ReactNode }) {
  const [hidden, setHiddenState] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      setHiddenState(localStorage.getItem(STORAGE_KEY) === "1")
    } catch {
      setHiddenState(false)
    }
    setReady(true)
  }, [])

  const setHidden = useCallback((next: boolean) => {
    setHiddenState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
    } catch {
      // ignore quota / private mode
    }
  }, [])

  const toggleHidden = useCallback(() => {
    setHiddenState((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const formatMoney = useCallback(
    (amount: number, currency = "INR") => {
      if (hidden) return MASK
      return formatMoneyRaw(amount, currency)
    },
    [hidden]
  )

  return (
    <TrackPrivacyContext.Provider
      value={{ hidden, ready, toggleHidden, setHidden, formatMoney }}
    >
      {children}
    </TrackPrivacyContext.Provider>
  )
}

export function useTrackMoney() {
  const ctx = useContext(TrackPrivacyContext)
  if (!ctx) {
    return {
      hidden: false,
      ready: true,
      toggleHidden: () => {},
      setHidden: () => {},
      formatMoney: formatMoneyRaw,
    } satisfies TrackPrivacyContextValue
  }
  return ctx
}
