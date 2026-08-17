import { ImageResponse } from "next/og"

const BASE = 512

export function createBrandIcon(pixelSize: number) {
  const s = pixelSize / BASE

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2A4064",
          borderRadius: Math.round(112 * s),
          position: "relative",
        }}
      >
        <span
          style={{
            color: "#ffffff",
            fontSize: Math.round(250 * s),
            fontWeight: 700,
            letterSpacing: Math.round(-8 * s),
            marginTop: Math.round(-18 * s),
          }}
        >
          P
        </span>
        <div
          style={{
            position: "absolute",
            bottom: Math.round(92 * s),
            width: Math.round(168 * s),
            height: Math.round(28 * s),
            borderRadius: 999,
            background: "#5EFC8D",
          }}
        />
      </div>
    ),
    { width: pixelSize, height: pixelSize }
  )
}
