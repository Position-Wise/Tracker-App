"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { ThemeProvider, useTheme } from "@/components/providers/theme-provider"
import {
  applyTrackThemeVars,
  clearStoredTrackTheme,
  getPresetById,
  isTrackWashStyle,
  readStoredTrackTheme,
  resolveTrackSurfaceTokens,
  TRACK_THEME_DEFAULT,
  TRACK_WASH_DEFAULT,
  writeStoredTrackTheme,
  type ColorMode,
  type TrackSurfaceTokens,
  type TrackThemeOverride,
  type TrackThemePreset,
  type TrackWashStyle,
} from "@track/theme"

type TrackThemeContextValue = {
  mode: ColorMode
  preset: TrackThemePreset
  tokens: TrackSurfaceTokens
  washStyle: TrackWashStyle
  setPreset: (preset: TrackThemePreset) => void
  setWashStyle: (style: TrackWashStyle) => void
  /** Patch tokens. Pass `"all"` to apply the same values to light and dark. */
  patchTokens: (
    patch: Partial<TrackSurfaceTokens>,
    scope?: ColorMode | "all"
  ) => void
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
  const fallbackPreset = presetProp ?? TRACK_THEME_DEFAULT
  const [preset, setPresetState] = useState<TrackThemePreset>(fallbackPreset)
  const [patch, setPatch] = useState<TrackThemeOverride>({})
  const [washStyle, setWashStyleState] = useState<TrackWashStyle>(TRACK_WASH_DEFAULT)
  const [hydrated, setHydrated] = useState(false)

  const tokens = useMemo(
    () =>
      resolveTrackSurfaceTokens(mode, preset, {
        light: { ...override?.light, ...patch.light },
        dark: { ...override?.dark, ...patch.dark },
      }),
    [mode, override, patch, preset]
  )

  useLayoutEffect(() => {
    const stored = readStoredTrackTheme()
    if (stored) {
      const found = getPresetById(stored.presetId)
      if (found) setPresetState(found)
      if (stored.patch) setPatch(stored.patch)
      if (stored.washStyle && isTrackWashStyle(stored.washStyle)) {
        setWashStyleState(stored.washStyle)
      }
    }
    setHydrated(true)
  }, [])

  useLayoutEffect(() => {
    applyTrackThemeVars(document.documentElement, tokens, { mode, washStyle })
  }, [mode, tokens, washStyle])

  useEffect(() => {
    if (!hydrated) return
    writeStoredTrackTheme({ presetId: preset.id, patch, washStyle })
  }, [hydrated, patch, preset.id, washStyle])

  const setPreset = useCallback((next: TrackThemePreset) => {
    setPresetState(next)
    setPatch({})
  }, [])

  const patchTokens = useCallback(
    (next: Partial<TrackSurfaceTokens>, scope: ColorMode | "all" = mode) => {
      setPatch((prev) => {
        if (scope === "all") {
          return {
            light: { ...prev.light, ...next },
            dark: { ...prev.dark, ...next },
          }
        }
        return {
          ...prev,
          [scope]: { ...prev[scope], ...next },
        }
      })
    },
    [mode]
  )

  const setWashStyle = useCallback((next: TrackWashStyle) => {
    setWashStyleState(next)
  }, [])

  const reset = useCallback(() => {
    setPresetState(fallbackPreset)
    setPatch({})
    setWashStyleState(TRACK_WASH_DEFAULT)
    clearStoredTrackTheme()
  }, [fallbackPreset])

  const value = useMemo(
    () => ({
      mode,
      preset,
      tokens,
      washStyle,
      setPreset,
      setWashStyle,
      patchTokens,
      reset,
    }),
    [mode, patchTokens, preset, reset, setPreset, setWashStyle, tokens, washStyle]
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
