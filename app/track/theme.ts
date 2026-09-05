/** Track appearance tokens. CSS fallbacks live in `app/globals.css` (`:root` / `.dark`). */

export type ColorMode = "light" | "dark"

/** Visual tokens for Track page wash, frost panels, and dialogs. */
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
  },
}

export const TRACK_THEME_PRESETS: TrackThemePreset[] = [TRACK_THEME_DEFAULT]

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
  }
}

export function applyTrackThemeVars(
  target: HTMLElement,
  tokens: TrackSurfaceTokens
) {
  const vars = trackTokensToCssVars(tokens)
  for (const [name, value] of Object.entries(vars)) {
    target.style.setProperty(name, value)
  }
}
