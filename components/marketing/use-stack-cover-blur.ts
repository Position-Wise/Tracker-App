"use client"

import { useEffect, type RefObject } from "react"

const MAX_BLUR_PX = 14
const MAX_DIM = 0.22

export function useStackCoverBlur(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const desktop = window.matchMedia("(min-width: 1024px)")
    const panels = () =>
      Array.from(root.querySelectorAll<HTMLElement>("[data-stack-panel]"))

    let frame = 0

    const clearFilters = () => {
      panels().forEach((panel) => {
        panel.style.filter = ""
      })
    }

    const update = () => {
      const items = panels()
      const viewport = window.innerHeight || 1

      if (motion.matches || !desktop.matches) {
        clearFilters()
        return
      }

      items.forEach((panel, index) => {
        const next = items[index + 1]
        if (!next) {
          panel.style.filter = ""
          return
        }

        const nextTop = next.getBoundingClientRect().top
        const progress = Math.min(1, Math.max(0, 1 - nextTop / viewport))

        if (progress < 0.02) {
          panel.style.filter = ""
          return
        }

        const blur = (progress * MAX_BLUR_PX).toFixed(2)
        const dim = (1 - progress * MAX_DIM).toFixed(3)
        panel.style.filter = `blur(${blur}px) brightness(${dim})`
      })
    }

    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    desktop.addEventListener("change", onScroll)
    motion.addEventListener("change", onScroll)

    return () => {
      cancelAnimationFrame(frame)
      clearFilters()
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      desktop.removeEventListener("change", onScroll)
      motion.removeEventListener("change", onScroll)
    }
  }, [rootRef])
}
