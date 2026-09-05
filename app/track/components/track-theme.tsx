"use client"

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { ThemeProvider, useTheme } from "@/components/providers/theme-provider"
import {
  applyTrackThemeVars,
  resolveTrackSurfaceTokens,
  TRACK_THEME_DEFAULT,
  type ColorMode,
  type TrackSurfaceTokens,
  type TrackThemeOverride,
  type TrackThemePreset,
} from "@track/theme"

type TrackThemeContextValue = {
  mode: ColorMode
  preset: TrackThemePreset
  tokens: TrackSurfaceTokens
  setPreset: (preset: TrackThemePreset) => void
  /** Patch the active light/dark tokens. Use for live previews or future user settings. */
  patchTokens: (patch: Partial<TrackSurfaceTokens>) => void
  reset: () => void
}

const TrackThemeContext = createContext<TrackThemeContextValue | null>(null)

export function TrackThemeProvider({
  children,
  preset: presetProp,
  override,
}: {
  children: ReactNode
  /** Replace the built-in ribbed preset. */
  preset?: TrackThemePreset
  /** Partial light/dark token overrides on top of the preset. */
  override?: TrackThemeOverride
}) {
  const { theme } = useTheme()
  const mode: ColorMode = theme === "dark" ? "dark" : "light"
  const [preset, setPreset] = useState<TrackThemePreset>(
    () => presetProp ?? TRACK_THEME_DEFAULT
  )
  const [patch, setPatch] = useState<TrackThemeOverride>({})

  const tokens = useMemo(
    () =>
      resolveTrackSurfaceTokens(mode, preset, {
        light: { ...override?.light, ...patch.light },
        dark: { ...override?.dark, ...patch.dark },
      }),
    [mode, override, patch, preset]
  )

  useLayoutEffect(() => {
    applyTrackThemeVars(document.documentElement, tokens)
  }, [tokens])

  const patchTokens = useCallback(
    (next: Partial<TrackSurfaceTokens>) => {
      setPatch((prev) => ({
        ...prev,
        [mode]: { ...prev[mode], ...next },
      }))
    },
    [mode]
  )

  const reset = useCallback(() => {
    setPreset(presetProp ?? TRACK_THEME_DEFAULT)
    setPatch({})
  }, [presetProp])

  const value = useMemo(
    () => ({
      mode,
      preset,
      tokens,
      setPreset,
      patchTokens,
      reset,
    }),
    [mode, patchTokens, preset, reset, tokens]
  )

  return (
    <TrackThemeContext.Provider value={value}>
      {children}
    </TrackThemeContext.Provider>
  )
}

export function useTrackTheme() {
  const ctx = useContext(TrackThemeContext)
  if (!ctx) {
    throw new Error("useTrackTheme must be used within TrackThemeProvider")
  }
  return ctx
}

/** Wraps Track so light/dark + surface tokens are available everywhere. */
export function TrackRootProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider enabled>
      <TrackThemeProvider>{children}</TrackThemeProvider>
    </ThemeProvider>
  )
}
