"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

type Theme = "light" | "dark"

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = "pw-track-theme"

function applyThemeClass(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle("dark", theme === "dark")
}

export function ThemeProvider({
  children,
  enabled = true,
}: {
  children: ReactNode
  /** When false, force light and skip persistence (non-track products). */
  enabled?: boolean
}) {
  const [theme, setThemeState] = useState<Theme>("light")

  useEffect(() => {
    if (!enabled) {
      applyThemeClass("light")
      return
    }

    const stored = window.localStorage.getItem(STORAGE_KEY)
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const initial: Theme =
      stored === "dark" || stored === "light"
        ? stored
        : prefersDark
          ? "dark"
          : "light"

    setThemeState(initial)
    applyThemeClass(initial)
  }, [enabled])

  const setTheme = useCallback(
    (next: Theme) => {
      if (!enabled) return
      setThemeState(next)
      applyThemeClass(next)
      window.localStorage.setItem(STORAGE_KEY, next)
    },
    [enabled]
  )

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark")
  }, [setTheme, theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return ctx
}
