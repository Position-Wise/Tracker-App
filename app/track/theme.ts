/** Track appearance tokens. CSS fallbacks live in `app/globals.css` (`:root` / `.dark`). */

export type ColorMode = "light" | "dark"

/** Visual tokens for Track page wash, frost panels, dialogs, and chrome. */
export type TrackSurfaceTokens = {
  ribPeriod: string
  rib: string
  frost: string
  frostRaised: string
  frostDialog: string
  panelBlur: string
  panelSaturate: string
  raisedBlur: string
  raisedSaturate: string
  dialogBlur: string
  dialogSaturate: string
  panelBorder: string
  raisedBorder: string
  dialogBorder: string
  panelShadow: string
  dialogShadow: string
  primary: string
  radius: string
}

export type TrackThemePreset = {
  id: string
  label: string
  light: TrackSurfaceTokens
  dark: TrackSurfaceTokens
}

export type TrackThemeOverride = {
  light?: Partial<TrackSurfaceTokens>
  dark?: Partial<TrackSurfaceTokens>
}

export const TRACK_THEME_STORAGE_KEY = "pw-track-surface"

export type TrackWashStyle = "ribbed" | "plain" | "gradient" | "glow"

export type StoredTrackTheme = {
  presetId: string
  patch: TrackThemeOverride
  washStyle?: TrackWashStyle
}

export const TRACK_WASH_DEFAULT: TrackWashStyle = "ribbed"

export const TRACK_WASH_STYLES: { id: TrackWashStyle; label: string }[] = [
  { id: "ribbed", label: "Ribbed" },
  { id: "plain", label: "Plain" },
  { id: "gradient", label: "Gradient" },
  { id: "glow", label: "Glow" },
]

const WASH_IDS = new Set<string>(TRACK_WASH_STYLES.map((item) => item.id))

export function isTrackWashStyle(value: string): value is TrackWashStyle {
  return WASH_IDS.has(value)
}

const LIGHT_RIB = [
  "radial-gradient(120% 80% at 100% -8%, rgb(255 255 255 / 0.85) 0%, transparent 50%)",
  "linear-gradient(108deg, rgb(198 210 224 / 0.42) 0%, rgb(255 255 255 / 0.08) 48%, rgb(255 255 255 / 0.55) 100%)",
  "repeating-linear-gradient(90deg, #e4eaf2 0%, #eef2f7 14%, #ffffff 42%, #f4f7fb 58%, #dfe6ef 82%, #e4eaf2 100%)",
].join(", ")

const DARK_RIB = [
  "radial-gradient(120% 80% at 100% -8%, rgb(92 96 112 / 0.34) 0%, transparent 48%)",
  "linear-gradient(108deg, rgb(0 0 0 / 0.7) 0%, rgb(0 0 0 / 0.18) 46%, rgb(255 255 255 / 0.045) 100%)",
  "repeating-linear-gradient(90deg, #050506 0%, #0c0c0f 14%, #1c1c24 42%, #2c2c36 58%, #16161c 82%, #060607 100%)",
].join(", ")

const LIGHT_GLASS_RIB = [
  "radial-gradient(120% 80% at 100% -8%, rgb(255 255 255 / 0.92) 0%, transparent 52%)",
  "linear-gradient(108deg, rgb(186 214 235 / 0.38) 0%, rgb(255 255 255 / 0.12) 48%, rgb(255 255 255 / 0.62) 100%)",
  "repeating-linear-gradient(90deg, #e8eef6 0%, #f4f8fc 14%, #ffffff 42%, #eef4fa 58%, #d7e4f0 82%, #e8eef6 100%)",
].join(", ")

const DARK_GLASS_RIB = [
  "radial-gradient(120% 80% at 100% -8%, rgb(110 140 180 / 0.28) 0%, transparent 50%)",
  "linear-gradient(108deg, rgb(0 0 0 / 0.62) 0%, rgb(8 16 28 / 0.2) 46%, rgb(255 255 255 / 0.06) 100%)",
  "repeating-linear-gradient(90deg, #05070c 0%, #0b1220 14%, #152038 42%, #1c2c48 58%, #10182a 82%, #05070c 100%)",
].join(", ")

const LIGHT_INK_RIB = [
  "radial-gradient(120% 80% at 100% -8%, rgb(255 255 255 / 0.7) 0%, transparent 48%)",
  "linear-gradient(108deg, rgb(160 170 184 / 0.4) 0%, rgb(255 255 255 / 0.06) 48%, rgb(255 255 255 / 0.45) 100%)",
  "repeating-linear-gradient(90deg, #d8dde6 0%, #e6eaf0 14%, #f3f5f8 42%, #eceff4 58%, #cfd5df 82%, #d8dde6 100%)",
].join(", ")

const DARK_INK_RIB = [
  "radial-gradient(120% 80% at 100% -8%, rgb(70 74 86 / 0.22) 0%, transparent 46%)",
  "linear-gradient(108deg, rgb(0 0 0 / 0.82) 0%, rgb(0 0 0 / 0.28) 46%, rgb(255 255 255 / 0.03) 100%)",
  "repeating-linear-gradient(90deg, #030304 0%, #08080b 14%, #121218 42%, #1a1a22 58%, #0c0c10 82%, #030304 100%)",
].join(", ")

const PRIMARY_DEFAULT = "#2a4064"
const RADIUS_DEFAULT = "0.75rem"

/** Current Track look — ribbed wash + frosted slabs. */
export const TRACK_THEME_DEFAULT: TrackThemePreset = {
  id: "ribbed",
  label: "Ribbed frost",
  light: {
    ribPeriod: "1.4rem",
    rib: LIGHT_RIB,
    frost: "rgb(255 255 255 / 0.78)",
    frostRaised: "rgb(255 255 255 / 0.64)",
    frostDialog: "rgb(255 255 255 / 0.86)",
    panelBlur: "10px",
    panelSaturate: "1.35",
    raisedBlur: "24px",
    raisedSaturate: "1.2",
    dialogBlur: "28px",
    dialogSaturate: "1.2",
    panelBorder: "rgb(255 255 255 / 0.55)",
    raisedBorder: "rgb(15 23 42 / 0.08)",
    dialogBorder: "rgb(15 23 42 / 0.1)",
    panelShadow:
      "0 18px 40px -28px rgb(15 23 42 / 0.18), inset 0 1px 0 rgb(255 255 255 / 0.7)",
    dialogShadow:
      "0 24px 60px -24px rgb(15 23 42 / 0.28), inset 0 1px 0 rgb(255 255 255 / 0.7)",
    primary: PRIMARY_DEFAULT,
    radius: RADIUS_DEFAULT,
  },
  dark: {
    ribPeriod: "1.4rem",
    rib: DARK_RIB,
    frost: "rgb(22 24 34 / 0.72)",
    frostRaised: "rgb(32 36 48 / 0.62)",
    frostDialog: "rgb(18 20 28 / 0.82)",
    panelBlur: "10px",
    panelSaturate: "1.35",
    raisedBlur: "24px",
    raisedSaturate: "1.2",
    dialogBlur: "28px",
    dialogSaturate: "1.2",
    panelBorder: "rgb(255 255 255 / 0.18)",
    raisedBorder: "rgb(255 255 255 / 0.1)",
    dialogBorder: "rgb(255 255 255 / 0.14)",
    panelShadow:
      "0 22px 44px -28px rgb(0 0 0 / 0.85), inset 0 1px 0 rgb(255 255 255 / 0.08)",
    dialogShadow:
      "0 28px 64px -24px rgb(0 0 0 / 0.82), inset 0 1px 0 rgb(255 255 255 / 0.06)",
    primary: PRIMARY_DEFAULT,
    radius: RADIUS_DEFAULT,
  },
}

function withLook(
  id: string,
  label: string,
  light: Partial<TrackSurfaceTokens>,
  dark: Partial<TrackSurfaceTokens>
): TrackThemePreset {
  return {
    id,
    label,
    light: { ...TRACK_THEME_DEFAULT.light, ...light },
    dark: { ...TRACK_THEME_DEFAULT.dark, ...dark },
  }
}

export const TRACK_THEME_PRESETS: TrackThemePreset[] = [
  TRACK_THEME_DEFAULT,
  withLook(
    "glass",
    "Clear glass",
    {
      rib: LIGHT_GLASS_RIB,
      frost: "rgb(255 255 255 / 0.46)",
      frostRaised: "rgb(255 255 255 / 0.38)",
      frostDialog: "rgb(255 255 255 / 0.7)",
      panelBlur: "28px",
      raisedBlur: "32px",
      dialogBlur: "36px",
      panelSaturate: "1.55",
      raisedSaturate: "1.4",
      dialogSaturate: "1.4",
      panelBorder: "rgb(255 255 255 / 0.62)",
    },
    {
      rib: DARK_GLASS_RIB,
      frost: "rgb(18 24 38 / 0.46)",
      frostRaised: "rgb(28 38 56 / 0.4)",
      frostDialog: "rgb(14 18 28 / 0.7)",
      panelBlur: "28px",
      raisedBlur: "32px",
      dialogBlur: "36px",
      panelSaturate: "1.5",
      panelBorder: "rgb(255 255 255 / 0.16)",
    }
  ),
  withLook(
    "solid",
    "Solid fill",
    {
      frost: "rgb(255 255 255 / 0.96)",
      frostRaised: "rgb(247 249 252 / 0.98)",
      frostDialog: "rgb(255 255 255 / 0.98)",
      panelBlur: "0px",
      raisedBlur: "0px",
      dialogBlur: "0px",
      panelSaturate: "1",
      raisedSaturate: "1",
      dialogSaturate: "1",
      panelBorder: "rgb(15 23 42 / 0.08)",
      panelShadow: "0 12px 28px -22px rgb(15 23 42 / 0.22)",
      dialogShadow: "0 18px 40px -24px rgb(15 23 42 / 0.28)",
    },
    {
      frost: "rgb(26 29 41 / 0.96)",
      frostRaised: "rgb(34 38 52 / 0.96)",
      frostDialog: "rgb(22 24 34 / 0.98)",
      panelBlur: "0px",
      raisedBlur: "0px",
      dialogBlur: "0px",
      panelSaturate: "1",
      raisedSaturate: "1",
      dialogSaturate: "1",
      panelBorder: "rgb(255 255 255 / 0.1)",
      panelShadow: "0 16px 32px -24px rgb(0 0 0 / 0.7)",
      dialogShadow: "0 22px 48px -24px rgb(0 0 0 / 0.78)",
    }
  ),
  withLook(
    "dense",
    "Tight grain",
    { ribPeriod: "0.7rem" },
    { ribPeriod: "0.7rem" }
  ),
  withLook(
    "soft",
    "Soft corners",
    {
      radius: "1.25rem",
      frost: "rgb(255 255 255 / 0.84)",
      panelBlur: "16px",
      raisedBlur: "28px",
      dialogBlur: "32px",
    },
    {
      radius: "1.25rem",
      frost: "rgb(24 26 38 / 0.78)",
      panelBlur: "16px",
      raisedBlur: "28px",
      dialogBlur: "32px",
    }
  ),
  withLook(
    "ink",
    "Ink",
    {
      rib: LIGHT_INK_RIB,
      frost: "rgb(255 255 255 / 0.9)",
      frostRaised: "rgb(244 246 249 / 0.88)",
      frostDialog: "rgb(255 255 255 / 0.94)",
      panelBorder: "rgb(15 23 42 / 0.1)",
    },
    {
      rib: DARK_INK_RIB,
      frost: "rgb(10 12 16 / 0.88)",
      frostRaised: "rgb(18 20 26 / 0.82)",
      frostDialog: "rgb(8 10 14 / 0.92)",
      panelBorder: "rgb(255 255 255 / 0.1)",
    }
  ),
]

export function getPresetById(id: string): TrackThemePreset | undefined {
  return TRACK_THEME_PRESETS.find((preset) => preset.id === id)
}

export function resolveTrackSurfaceTokens(
  mode: ColorMode,
  preset: TrackThemePreset = TRACK_THEME_DEFAULT,
  override?: TrackThemeOverride,
  patch?: Partial<TrackSurfaceTokens>
): TrackSurfaceTokens {
  return {
    ...preset[mode],
    ...override?.[mode],
    ...patch,
  }
}

export function trackTokensToCssVars(
  tokens: TrackSurfaceTokens
): Record<string, string> {
  return {
    "--surface-rib-period": tokens.ribPeriod,
    "--surface-rib": tokens.rib,
    "--surface-frost": tokens.frost,
    "--surface-frost-raised": tokens.frostRaised,
    "--surface-frost-dialog": tokens.frostDialog,
    "--surface-panel-blur": tokens.panelBlur,
    "--surface-panel-saturate": tokens.panelSaturate,
    "--surface-raised-blur": tokens.raisedBlur,
    "--surface-raised-saturate": tokens.raisedSaturate,
    "--surface-dialog-blur": tokens.dialogBlur,
    "--surface-dialog-saturate": tokens.dialogSaturate,
    "--surface-panel-border": tokens.panelBorder,
    "--surface-raised-border": tokens.raisedBorder,
    "--surface-dialog-border": tokens.dialogBorder,
    "--surface-panel-shadow": tokens.panelShadow,
    "--surface-dialog-shadow": tokens.dialogShadow,
    "--primary": tokens.primary,
    "--ring": tokens.primary,
    "--brand-navy": tokens.primary,
    "--radius": tokens.radius,
  }
}

export function resolveWashLayers(
  style: TrackWashStyle,
  tokens: TrackSurfaceTokens,
  mode: ColorMode
): { image: string; repeat: string; size: string } {
  if (style === "plain") {
    return { image: "none", repeat: "no-repeat", size: "auto" }
  }

  if (style === "gradient") {
    const image =
      mode === "dark"
        ? `linear-gradient(165deg, #050506 0%, color-mix(in srgb, ${tokens.primary} 30%, #0a0e14) 48%, #141820 100%)`
        : `linear-gradient(165deg, #e8eef6 0%, color-mix(in srgb, ${tokens.primary} 14%, #f5f7fa) 46%, #ffffff 100%)`
    return { image, repeat: "no-repeat", size: "100% 100%" }
  }

  if (style === "glow") {
    const image =
      mode === "dark"
        ? [
            `radial-gradient(90% 70% at 100% -8%, color-mix(in srgb, ${tokens.primary} 48%, transparent) 0%, transparent 54%)`,
            `radial-gradient(80% 55% at 0% 108%, color-mix(in srgb, ${tokens.primary} 24%, transparent) 0%, transparent 50%)`,
            "linear-gradient(180deg, #050506 0%, #0c0c12 100%)",
          ].join(", ")
        : [
            `radial-gradient(90% 70% at 100% -8%, color-mix(in srgb, ${tokens.primary} 26%, white) 0%, transparent 54%)`,
            `radial-gradient(80% 55% at 0% 108%, color-mix(in srgb, ${tokens.primary} 12%, #e8eef6) 0%, transparent 50%)`,
            "linear-gradient(180deg, #f2f5fa 0%, #ffffff 100%)",
          ].join(", ")
    return {
      image,
      repeat: "no-repeat, no-repeat, no-repeat",
      size: "100% 100%, 100% 100%, 100% 100%",
    }
  }

  return {
    image: tokens.rib,
    repeat: "no-repeat, no-repeat, repeat",
    size: `100% 100%, 100% 100%, ${tokens.ribPeriod} 100%`,
  }
}

export function applyTrackThemeVars(
  target: HTMLElement,
  tokens: TrackSurfaceTokens,
  options?: { mode?: ColorMode; washStyle?: TrackWashStyle }
) {
  const mode = options?.mode ?? "light"
  const washStyle = options?.washStyle ?? TRACK_WASH_DEFAULT
  const wash = resolveWashLayers(washStyle, tokens, mode)
  const vars = {
    ...trackTokensToCssVars(tokens),
    "--surface-rib": wash.image,
    "--surface-wash-repeat": wash.repeat,
    "--surface-wash-size": wash.size,
  }
  for (const [name, value] of Object.entries(vars)) {
    target.style.setProperty(name, value)
  }
}

export function readStoredTrackTheme(): StoredTrackTheme | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(TRACK_THEME_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredTrackTheme
    if (!parsed || typeof parsed.presetId !== "string") return null
    return {
      presetId: parsed.presetId,
      patch: parsed.patch ?? {},
      washStyle:
        typeof parsed.washStyle === "string" && isTrackWashStyle(parsed.washStyle)
          ? parsed.washStyle
          : undefined,
    }
  } catch {
    return null
  }
}

export function writeStoredTrackTheme(state: StoredTrackTheme) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(TRACK_THEME_STORAGE_KEY, JSON.stringify(state))
}

export function clearStoredTrackTheme() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(TRACK_THEME_STORAGE_KEY)
}

const HEX_RE = /^#([0-9a-f]{6})$/i
const RGB_SPACE_RE =
  /^rgba?\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/i
const RGB_COMMA_RE =
  /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i

function toHexByte(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, "0")
}

function parseAlpha(raw: string | undefined) {
  if (raw == null || raw === "") return 1
  if (raw.endsWith("%")) return Math.max(0, Math.min(1, Number(raw.slice(0, -1)) / 100))
  const numeric = Number(raw)
  if (Number.isNaN(numeric)) return 1
  return numeric > 1 ? Math.max(0, Math.min(1, numeric / 255)) : Math.max(0, Math.min(1, numeric))
}

export function parseCssColor(
  value: string
): { hex: string; alpha: number } | null {
  const trimmed = value.trim()
  const hex = trimmed.match(HEX_RE)
  if (hex) return { hex: `#${hex[1].toLowerCase()}`, alpha: 1 }

  const modern = trimmed.match(RGB_SPACE_RE)
  const legacy = modern ? null : trimmed.match(RGB_COMMA_RE)
  const match = modern ?? legacy
  if (!match) return null

  const hexOut = `#${toHexByte(Number(match[1]))}${toHexByte(Number(match[2]))}${toHexByte(Number(match[3]))}`
  return { hex: hexOut, alpha: parseAlpha(match[4]) }
}

export function formatCssRgb(hex: string, alpha: number): string {
  const parsed = hex.match(HEX_RE)
  if (!parsed) return hex
  const n = Number.parseInt(parsed[1], 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 100) / 100
  return a >= 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${a})`
}

export function parseCssNumber(value: string): number {
  const match = value.trim().match(/^([\d.]+)/)
  return match ? Number(match[1]) : 0
}
