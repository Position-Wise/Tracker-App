import { ImageResponse } from "next/og"
import { SITE_NAME } from "@/lib/seo"

export const OG_SIZE = { width: 1200, height: 630 }

type ShareCardProps = {
  kicker?: string
  title: string
  subtitle: string
}

export function ShareCard({
  kicker = SITE_NAME,
  title,
  subtitle,
}: ShareCardProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#2A4064",
        color: "#ffffff",
        padding: "64px 72px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -80,
          top: -90,
          width: 360,
          height: 360,
          borderRadius: 999,
          background: "rgba(94, 252, 141, 0.16)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 140,
          bottom: -120,
          width: 280,
          height: 280,
          borderRadius: 999,
          background: "rgba(255, 255, 255, 0.06)",
        }}
      />

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span
            style={{
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: -0.8,
            }}
          >
            POSITION
          </span>
          <span
            style={{
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: -0.8,
              color: "#5EFC8D",
              marginLeft: 10,
            }}
          >
            WISE
          </span>
        </div>
        <span
          style={{
            marginTop: 6,
            fontSize: 14,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.72)",
          }}
        >
          Advisory
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", maxWidth: 860 }}>
        <span
          style={{
            fontSize: 18,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#5EFC8D",
            marginBottom: 18,
          }}
        >
          {kicker}
        </span>
        <span
          style={{
            fontSize: 58,
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: -1.6,
          }}
        >
          {title}
        </span>
        <span
          style={{
            marginTop: 22,
            fontSize: 24,
            lineHeight: 1.4,
            color: "rgba(255,255,255,0.82)",
          }}
        >
          {subtitle}
        </span>
      </div>
    </div>
  )
}

export function createShareImage(props: ShareCardProps) {
  return new ImageResponse(<ShareCard {...props} />, {
    ...OG_SIZE,
  })
}
