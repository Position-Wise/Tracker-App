"use client"

import { useEffect, useState, type CSSProperties, type ReactNode } from "react"
import { cn } from "@/lib/utils"

type CapsuleBeam = {
  x: number
  width: number
  height: number
  blur: number
  opacity: number
}

type CapsuleAura = {
  hue: number
  beams: CapsuleBeam[]
}

const FALLBACK_CAPSULE_AURA: CapsuleAura = {
  hue: 215,
  beams: [
    { x: 18, width: 16, height: 58, blur: 18, opacity: 0.5 },
    { x: 34, width: 13, height: 76, blur: 16, opacity: 0.68 },
    { x: 50, width: 22, height: 90, blur: 22, opacity: 0.82 },
    { x: 66, width: 13, height: 74, blur: 16, opacity: 0.68 },
    { x: 82, width: 16, height: 56, blur: 18, opacity: 0.5 },
  ],
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function createRandomCapsuleAura(): CapsuleAura {
  const hue = randomInt(0, 359)
  const beams: CapsuleBeam[] = [
    {
      x: 50 + (Math.random() - 0.5) * 4,
      width: randomInt(14, 24),
      height: randomInt(74, 92),
      blur: randomInt(16, 28),
      opacity: 0.7 + Math.random() * 0.2,
    },
  ]

  const pairs = randomInt(4, 6)
  for (let index = 1; index <= pairs; index += 1) {
    const offset = 8 + index * (36 / pairs) + (Math.random() - 0.5) * 3
    const width = randomInt(8, 18)
    const height = randomInt(46, 80)
    const blur = randomInt(12, 26)
    const opacity = 0.38 + Math.random() * 0.4
    beams.push({
      x: 50 - offset,
      width,
      height,
      blur,
      opacity,
    })
    beams.push({
      x: 50 + offset,
      width: Math.max(8, width + randomInt(-2, 3)),
      height: Math.max(42, height + randomInt(-8, 8)),
      blur: Math.max(10, blur + randomInt(-4, 4)),
      opacity,
    })
  }

  return { hue, beams }
}

function CapsuleBeams({ aura }: { aura: CapsuleAura }) {
  const hue = aura.hue
  const hue2 = (hue + 18) % 360

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:var(--capsule-field-light)] dark:[background-image:var(--capsule-field-dark)]"
        style={
          {
            "--capsule-field-light": `linear-gradient(180deg, hsl(${hue} 28% 97%) 0%, hsl(${hue} 48% 86%) 42%, hsl(${hue} 72% 62%) 78%, hsl(${hue2} 78% 48%) 100%)`,
            "--capsule-field-dark": `linear-gradient(180deg, #000 0%, #000 32%, hsl(${hue} 45% 8%) 100%)`,
          } as CSSProperties
        }
      />
      {aura.beams.map((beam, index) => (
        <span
          key={index}
          aria-hidden
          className="pointer-events-none absolute bottom-0 rounded-full mix-blend-multiply [background-image:var(--beam-light)] filter-[blur(var(--blur-light))] dark:mix-blend-normal dark:[background-image:var(--beam-dark)] dark:filter-[blur(var(--blur-dark))]"
          style={
            {
              left: `${beam.x}%`,
              width: `${beam.width}%`,
              height: `${beam.height}%`,
              transform: "translateX(-50%)",
              opacity: beam.opacity,
              "--blur-light": `${Math.max(8, Math.round(beam.blur * 0.55))}px`,
              "--blur-dark": `${beam.blur}px`,
              "--beam-light": `linear-gradient(to top, hsl(${hue} 88% 46%) 0%, hsl(${hue2} 82% 42%) 24%, hsl(${hue} 74% 52% / 0.72) 52%, transparent 100%)`,
              "--beam-dark": `linear-gradient(to top, hsl(${hue} 90% 92%) 0%, hsl(${hue2} 85% 58%) 30%, hsl(${hue} 70% 36% / 0.42) 62%, transparent 100%)`,
            } as CSSProperties
          }
        />
      ))}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-18%] left-1/2 h-[62%] w-[80%] -translate-x-1/2 rounded-full mix-blend-multiply [background-image:var(--glow-light)] dark:mix-blend-normal dark:[background-image:var(--glow-dark)]"
        style={
          {
            filter: "blur(26px)",
            "--glow-light": `radial-gradient(circle, hsl(${hue} 92% 52% / 0.9) 0%, hsl(${hue2} 80% 46% / 0.5) 40%, transparent 68%)`,
            "--glow-dark": `radial-gradient(circle, hsl(${hue} 95% 92% / 0.78) 0%, hsl(${hue2} 80% 55% / 0.28) 42%, transparent 70%)`,
          } as CSSProperties
        }
      />
    </>
  )
}

export function TrackCapsuleCircle({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative size-40 overflow-hidden rounded-full border-[5px] border-background bg-muted shadow-[0_12px_28px_-12px_rgba(15,23,42,0.55)] ring-1 ring-border/40 sm:size-28",
        className
      )}
    >
      {children}
    </div>
  )
}

export function TrackCapsuleHero({
  overlay,
  circle,
  children,
}: {
  overlay?: ReactNode
  circle: ReactNode
  children: ReactNode
}) {
  const [capsuleAura, setCapsuleAura] = useState(FALLBACK_CAPSULE_AURA)

  useEffect(() => {
    setCapsuleAura(createRandomCapsuleAura())
  }, [])

  return (
    <div>
      <div className="relative">
        {overlay}
        <div className="relative mx-10 h-[min(42vh,18.5rem)] overflow-hidden rounded-b-full bg-white shadow-[0_28px_56px_-22px_rgba(15,23,42,0.55)] dark:bg-black">
          <CapsuleBeams aura={capsuleAura} />
        </div>
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 translate-y-1/2">
          {circle}
        </div>
      </div>
      <div className="mt-16 px-2 text-center sm:mt-20">{children}</div>
    </div>
  )
}
