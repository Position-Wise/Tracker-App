"use client"

import type { CSSProperties } from "react"
import { useTheme } from "@/components/providers/theme-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTrackTheme } from "@track/components/track-theme"
import {
  formatCssRgb,
  parseCssColor,
  parseCssNumber,
  resolveWashLayers,
  TRACK_THEME_PRESETS,
  TRACK_WASH_STYLES,
  type ColorMode,
  type TrackSurfaceTokens,
  type TrackWashStyle,
} from "@track/theme"
import { cn } from "@/lib/utils"

type TrackThemeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TrackThemeDialog({ open, onOpenChange }: TrackThemeDialogProps) {
  const { setTheme } = useTheme()
  const { mode, preset, tokens, washStyle, setPreset, setWashStyle, patchTokens, reset } =
    useTrackTheme()

  function patchCurrent(next: Partial<TrackSurfaceTokens>) {
    patchTokens(next)
  }

  function patchColor(
    key: keyof TrackSurfaceTokens,
    hex: string,
    alpha: number
  ) {
    patchCurrent({ [key]: formatCssRgb(hex, alpha) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <div className="shrink-0 border-b border-border/70">
          <div className="px-6 pt-6 pr-12">
            <DialogHeader className="text-left">
              <DialogTitle>Theme</DialogTitle>
              <DialogDescription>
                Changes apply immediately to Track. Customize {mode} mode, or
                switch modes to edit the other set.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 pb-4 pt-4">
            <ThemePreview tokens={tokens} mode={mode} washStyle={washStyle} />
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 pb-6 pt-5">
          <section>
            <SectionLabel>Appearance</SectionLabel>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <ModeButton
                label="Light"
                active={mode === "light"}
                onClick={() => setTheme("light")}
              />
              <ModeButton
                label="Dark"
                active={mode === "dark"}
                onClick={() => setTheme("dark")}
              />
            </div>
          </section>

          <section>
            <SectionLabel>Look</SectionLabel>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TRACK_THEME_PRESETS.map((item) => {
                const selected = preset.id === item.id
                return (
                  <StyleCard
                    key={item.id}
                    label={item.label}
                    selected={selected}
                    onClick={() => setPreset(item)}
                    previewStyle={{
                      backgroundImage: item[mode].rib,
                      backgroundSize: `${item[mode].ribPeriod} 100%`,
                    }}
                  />
                )
              })}
            </div>
          </section>

          <section>
            <SectionLabel>Background</SectionLabel>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {TRACK_WASH_STYLES.map((item) => {
                const wash = resolveWashLayers(item.id, tokens, mode)
                return (
                  <StyleCard
                    key={item.id}
                    label={item.label}
                    selected={washStyle === item.id}
                    onClick={() => setWashStyle(item.id)}
                    previewStyle={{
                      backgroundColor: "var(--background)",
                      backgroundImage:
                        wash.image === "none" ? undefined : wash.image,
                      backgroundRepeat: wash.repeat,
                      backgroundSize: wash.size,
                    }}
                  />
                )
              })}
            </div>
            {washStyle === "ribbed" ? (
              <div className="mt-1 divide-y divide-border/70">
                <SliderField
                  label="Rib density"
                  value={parseCssNumber(tokens.ribPeriod)}
                  min={0.5}
                  max={3}
                  step={0.1}
                  format={(n) => `${n.toFixed(1)}rem`}
                  onChange={(n) => patchCurrent({ ribPeriod: `${n}rem` })}
                />
              </div>
            ) : null}
          </section>

          <section>
            <SectionLabel>Accent & corners</SectionLabel>
            <div className="divide-y divide-border/70">
              <ColorField
                label="Accent"
                value={tokens.primary}
                showAlpha={false}
                onHex={(hex) => patchTokens({ primary: hex }, "all")}
              />
              <SliderField
                label="Corner radius"
                value={parseCssNumber(tokens.radius)}
                min={0.25}
                max={1.75}
                step={0.05}
                format={(n) => `${n.toFixed(2)}rem`}
                onChange={(n) => patchTokens({ radius: `${n}rem` }, "all")}
              />
            </div>
          </section>

          <TokenGroup
            title="Panels"
            tokens={tokens}
            colorKey="frost"
            borderKey="panelBorder"
            blurKey="panelBlur"
            saturateKey="panelSaturate"
            onColor={patchColor}
            onNumber={patchCurrent}
          />

          <TokenGroup
            title="Raised"
            tokens={tokens}
            colorKey="frostRaised"
            borderKey="raisedBorder"
            blurKey="raisedBlur"
            saturateKey="raisedSaturate"
            onColor={patchColor}
            onNumber={patchCurrent}
          />

          <TokenGroup
            title="Dialogs"
            tokens={tokens}
            colorKey="frostDialog"
            borderKey="dialogBorder"
            blurKey="dialogBlur"
            saturateKey="dialogSaturate"
            onColor={patchColor}
            onNumber={patchCurrent}
          />

          <div className="flex justify-end pt-1">
            <Button
              type="button"
              variant="ghost"
              className="h-9 px-2 text-sm font-medium text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground hover:underline"
              onClick={reset}
            >
              Reset to default
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  )
}

function ModeButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-xl bg-primary px-2 py-2.5 text-center text-sm font-medium text-primary-foreground"
          : "rounded-xl border border-border bg-card px-2 py-2.5 text-center text-sm text-muted-foreground hover:bg-secondary"
      }
    >
      {label}
    </button>
  )
}

function StyleCard({
  label,
  selected,
  onClick,
  previewStyle,
}: {
  label: string
  selected: boolean
  onClick: () => void
  previewStyle: CSSProperties
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "overflow-hidden rounded-xl border text-left transition-colors",
        selected
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:bg-secondary/60"
      )}
    >
      <span aria-hidden className="block h-9" style={previewStyle} />
      <span className="block px-2.5 py-2 text-xs font-medium">{label}</span>
    </button>
  )
}

function ThemePreview({
  tokens,
  mode,
  washStyle,
}: {
  tokens: TrackSurfaceTokens
  mode: ColorMode
  washStyle: TrackWashStyle
}) {
  const wash = resolveWashLayers(washStyle, tokens, mode)

  return (
    <div className="space-y-2">
      <div
        className="overflow-hidden rounded-2xl border p-3"
        style={{
          backgroundColor: "var(--background)",
          backgroundImage: wash.image === "none" ? undefined : wash.image,
          backgroundRepeat: wash.repeat,
          backgroundSize: wash.size,
          borderColor: tokens.panelBorder,
        }}
      >
        <div className="track-panel p-3">
          <p className="text-sm font-semibold">Panel preview</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Frost, blur, and corners update live.
          </p>
          <div className="track-panel-elevated mt-3 px-3 py-2 text-xs">
            Raised surface
          </div>
        </div>
      </div>
    </div>
  )
}

function TokenGroup({
  title,
  tokens,
  colorKey,
  borderKey,
  blurKey,
  saturateKey,
  onColor,
  onNumber,
}: {
  title: string
  tokens: TrackSurfaceTokens
  colorKey: keyof TrackSurfaceTokens
  borderKey: keyof TrackSurfaceTokens
  blurKey: keyof TrackSurfaceTokens
  saturateKey: keyof TrackSurfaceTokens
  onColor: (key: keyof TrackSurfaceTokens, hex: string, alpha: number) => void
  onNumber: (patch: Partial<TrackSurfaceTokens>) => void
}) {
  return (
    <section>
      <SectionLabel>{title}</SectionLabel>
      <div className="divide-y divide-border/70">
        <ColorField
          label="Fill"
          value={tokens[colorKey]}
          onHex={(hex, alpha) => onColor(colorKey, hex, alpha)}
        />
        <ColorField
          label="Border"
          value={tokens[borderKey]}
          onHex={(hex, alpha) => onColor(borderKey, hex, alpha)}
        />
        <SliderField
          label="Blur"
          value={parseCssNumber(tokens[blurKey])}
          min={0}
          max={48}
          step={1}
          format={(n) => `${Math.round(n)}px`}
          onChange={(n) => onNumber({ [blurKey]: `${Math.round(n)}px` })}
        />
        <SliderField
          label="Saturate"
          value={parseCssNumber(tokens[saturateKey])}
          min={1}
          max={2}
          step={0.05}
          format={(n) => n.toFixed(2)}
          onChange={(n) => onNumber({ [saturateKey]: n.toFixed(2) })}
        />
      </div>
    </section>
  )
}

function ColorField({
  label,
  value,
  onHex,
  showAlpha = true,
}: {
  label: string
  value: string
  onHex: (hex: string, alpha: number) => void
  showAlpha?: boolean
}) {
  const parsed = parseCssColor(value) ?? { hex: "#ffffff", alpha: 1 }
  const alphaPct = Math.round(parsed.alpha * 100)

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex min-w-0 items-center gap-2">
        <input
          type="color"
          aria-label={`${label} color`}
          value={parsed.hex}
          onChange={(event) => onHex(event.target.value, parsed.alpha)}
          className="size-8 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
        />
        {showAlpha ? (
          <>
            <input
              type="range"
              aria-label={`${label} opacity`}
              min={0}
              max={100}
              step={1}
              value={alphaPct}
              onChange={(event) =>
                onHex(parsed.hex, Number(event.target.value) / 100)
              }
              className="h-1.5 w-20 accent-primary"
            />
            <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
              {alphaPct}%
            </span>
          </>
        ) : null}
      </div>
    </div>
  )
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (value: number) => string
  onChange: (value: number) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-3">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-1.5 min-w-0 flex-1 accent-primary"
        />
        <span className="w-14 text-right text-xs tabular-nums text-muted-foreground">
          {format(value)}
        </span>
      </div>
    </label>
  )
}
