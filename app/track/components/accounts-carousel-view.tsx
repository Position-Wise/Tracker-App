"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type ReactNode,
  type KeyboardEvent,
  type PointerEvent,
} from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  ChevronUp,
  CreditCard,
  Eye,
  EyeOff,
  Landmark,
  Pencil,
  Plus,
  Settings2,
  Trash2,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { deleteMoneySource } from "@track/app/actions"
import { AccountsManager } from "@track/components/accounts-manager"
import { CardNetworkMark } from "@track/components/card-network-mark"
import { MoneySourceFormDialog } from "@track/components/money-source-form-dialog"
import { useTrackLedger } from "@track/components/track-ledger-provider"
import { useTrackMoney } from "@track/components/track-privacy-provider"
import { TrackAccountsCarouselSkeleton } from "@track/components/track-skeletons"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { buildExpensesHref, resolveExpenseSourceId } from "@track/lib/expense-browse"
import {
  cardLimitUsage,
  MONEY_SOURCE_KIND_LABEL,
  type CardNetwork,
  type MoneySource,
  type MoneySourceKind,
} from "@track/lib/money-sources"
import { relativeDayLabel, toMonthKey } from "@track/lib/month"
import type { ExpenseWithCategory } from "@track/lib/types"
import { cn } from "@/lib/utils"
type AccountsCarouselViewProps = {
  recentAcross: ExpenseWithCategory[]
  holderName?: string
}

const KIND_ICON: Record<MoneySourceKind, LucideIcon> = {
  cash: Wallet,
  bank: Landmark,
  credit_card: CreditCard,
}

const CARD_THEMES: Record<
  MoneySourceKind,
  { gradient: string; glow: string; label: string; sheen: string }
> = {
  credit_card: {
    gradient:
      "linear-gradient(165deg, #4a4a4a 0%, #7a7a7a 38%, #b8b8b8 72%, #8f8f8f 100%)",
    glow: "rgba(120, 120, 120, 0.35)",
    sheen: "rgba(255,255,255,0.18)",
    label: "Credit",
  },
  bank: {
    gradient:
      "linear-gradient(165deg, #1e2f4a 0%, #2a4064 45%, #4a6282 100%)",
    glow: "rgba(42, 64, 100, 0.35)",
    sheen: "rgba(255,255,255,0.12)",
    label: "Bank",
  },
  cash: {
    gradient:
      "linear-gradient(165deg, #064e3b 0%, #0d5f46 50%, #14b8a6 100%)",
    glow: "rgba(13, 95, 70, 0.35)",
    sheen: "rgba(255,255,255,0.14)",
    label: "Cash",
  },
}

const NETWORK_THEMES: Record<
  CardNetwork,
  { gradient: string; glow: string; sheen: string }
> = {
  visa: {
    gradient: "linear-gradient(165deg, #0f2a5c 0%, #1a4f9c 48%, #2b6cb0 100%)",
    glow: "rgba(26, 79, 156, 0.4)",
    sheen: "rgba(255,255,255,0.16)",
  },
  mastercard: {
    gradient: "linear-gradient(165deg, #1c1414 0%, #3a2220 48%, #8a3d28 100%)",
    glow: "rgba(138, 61, 40, 0.4)",
    sheen: "rgba(255,255,255,0.14)",
  },
  amex: {
    gradient: "linear-gradient(165deg, #025c5e 0%, #067f82 50%, #0aa3a8 100%)",
    glow: "rgba(6, 127, 130, 0.4)",
    sheen: "rgba(255,255,255,0.16)",
  },
  rupay: {
    gradient: "linear-gradient(165deg, #0b1f4d 0%, #123a7a 52%, #c45c12 100%)",
    glow: "rgba(18, 58, 122, 0.4)",
    sheen: "rgba(255,255,255,0.14)",
  },
}

function themeForSource(
  source: MoneySource
): (typeof CARD_THEMES)[MoneySourceKind] {
  const base = CARD_THEMES[source.kind]
  if (source.kind !== "credit_card" || !source.cardNetwork) return base
  const network = NETWORK_THEMES[source.cardNetwork]
  return { ...base, ...network }
}

function sortSourcesForCarousel(sources: MoneySource[]): MoneySource[] {
  const kindOrder: Record<MoneySourceKind, number> = {
    credit_card: 0,
    bank: 1,
    cash: 2,
  }
  return [...sources].sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1
    const kindDiff = kindOrder[a.kind] - kindOrder[b.kind]
    if (kindDiff !== 0) return kindDiff
    return a.name.localeCompare(b.name)
  })
}

function formatExpenseTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date)
}

function operationSectionLabel(iso: string): string {
  const label = relativeDayLabel(iso)
  if (label === "Today") return "Today"
  if (label === "Yesterday") return "Yesterday"
  return label
}

const SWIPE_LOCK_PX = 12
const SWIPE_OPEN_PX = 78
const TAP_SLOP_PX = 14

function useSwipeUpOpen(onOpen: () => void, swipeEnabled: boolean) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const onOpenRef = useRef(onOpen)
  const drag = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    lastY: 0,
    lastT: 0,
    velocity: 0,
    axis: null as "x" | "y" | null,
    captured: false,
  })

  useEffect(() => {
    onOpenRef.current = onOpen
  }, [onOpen])

  function commitOpen(height: number) {
    setDragging(false)
    setLeaving(true)
    setOffset(-Math.max(160, height * 0.42))
    window.setTimeout(() => onOpenRef.current(), 180)
  }

  function snapBack() {
    setDragging(false)
    setLeaving(false)
    setOffset(0)
  }

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastY: event.clientY,
      lastT: event.timeStamp,
      velocity: 0,
      axis: null,
      captured: false,
    }
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const state = drag.current
    if (state.pointerId !== event.pointerId) return

    const dx = event.clientX - state.startX
    const dy = event.clientY - state.startY
    const now = event.timeStamp
    const dt = Math.max(1, now - state.lastT)
    state.velocity = (event.clientY - state.lastY) / dt
    state.lastY = event.clientY
    state.lastT = now

    if (!state.axis) {
      if (Math.hypot(dx, dy) < SWIPE_LOCK_PX) return
      state.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y"
      if (state.axis === "y" && dy < 0 && swipeEnabled) {
        state.captured = true
        event.currentTarget.setPointerCapture(event.pointerId)
        setDragging(true)
      }
    }

    if (state.axis === "y" && swipeEnabled && dy < 0) {
      event.preventDefault()
      setOffset(dy)
    }
  }

  function onPointerUp(event: PointerEvent<HTMLButtonElement>) {
    const state = drag.current
    if (state.pointerId !== event.pointerId) return
    if (state.captured) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const dx = event.clientX - state.startX
    const dy = event.clientY - state.startY
    const height = event.currentTarget.offsetHeight
    const isTap = Math.hypot(dx, dy) < TAP_SLOP_PX
    const swipedUp =
      swipeEnabled &&
      state.axis === "y" &&
      (dy <= -SWIPE_OPEN_PX || state.velocity < -0.55)

    drag.current.pointerId = -1
    drag.current.axis = null
    drag.current.captured = false

    if (swipedUp || isTap) {
      commitOpen(height)
      return
    }

    snapBack()
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      commitOpen(event.currentTarget.offsetHeight)
    }
  }

  return {
    offset,
    dragging,
    leaving,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onKeyDown,
    },
  }
}

const WIDE_QUERY = "(min-width: 640px)"

function useMinWidth(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}

const LANDSCAPE_SLIDE = "min(26rem, 72vw)"
/** Lets the first and last slide reach the center (1rem accounts for the gap). */
const LANDSCAPE_EDGE = `max(0px, calc(50% - ${LANDSCAPE_SLIDE} / 2 - 1rem))`

function centerSlide(
  root: HTMLElement,
  slide: HTMLElement,
  behavior: ScrollBehavior = "smooth"
) {
  const rootRect = root.getBoundingClientRect()
  const slideRect = slide.getBoundingClientRect()
  const delta =
    slideRect.left + slideRect.width / 2 - (rootRect.left + rootRect.width / 2)
  root.scrollTo({ left: root.scrollLeft + delta, behavior })
}

function nearestSlideIndex(root: HTMLElement, slides: (HTMLElement | null)[]) {
  const rootRect = root.getBoundingClientRect()
  const center = rootRect.left + rootRect.width / 2
  let best = -1
  let bestDistance = Infinity
  slides.forEach((slide, index) => {
    if (!slide) return
    const rect = slide.getBoundingClientRect()
    const distance = Math.abs(rect.left + rect.width / 2 - center)
    if (distance < bestDistance) {
      bestDistance = distance
      best = index
    }
  })
  return best
}

function scrollToAccountSlide(sourceId: string) {
  const slide = document.querySelector<HTMLElement>(
    `[data-account-slide="${sourceId}"]`
  )
  const root = slide?.closest<HTMLElement>("[data-account-scroller]")
  if (slide && root) centerSlide(root, slide)
}

export function AccountsCarouselView({
  recentAcross,
  holderName = "",
}: AccountsCarouselViewProps) {
  const {
    sources,
    sourceBalance,
    currency,
    ready,
    cardCreditLimit,
  } = useTrackLedger()

  const ordered = useMemo(() => sortSourcesForCarousel(sources), [sources])
  const [browseIndex, setBrowseIndex] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [editing, setEditing] = useState<MoneySource | null>(null)

  const isWide = useMinWidth(WIDE_QUERY)
  const browseSource = ordered[browseIndex] ?? ordered[0] ?? null
  const selectedSource = selectedId
    ? (ordered.find((s) => s.id === selectedId) ?? null)
    : null

  useEffect(() => {
    if (browseIndex >= ordered.length) {
      setBrowseIndex(Math.max(0, ordered.length - 1))
    }
    if (selectedId && !ordered.some((s) => s.id === selectedId)) {
      setSelectedId(null)
    }
  }, [browseIndex, ordered, selectedId])

  return (
    <>
      {!ready ? (
        <div className="space-y-6">
          <BrowseHeader onManage={() => setManageOpen(true)} onAdd={() => setAddOpen(true)} />
          <TrackAccountsCarouselSkeleton />
        </div>
      ) : ordered.length === 0 ? (
        <div className="space-y-6">
          <BrowseHeader onManage={() => setManageOpen(true)} onAdd={() => setAddOpen(true)} />
          <section className="track-panel flex flex-col items-center gap-4 px-6 py-14 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary">
              <Wallet className="size-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No accounts yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a card, bank, or cash wallet to start tracking.
              </p>
            </div>
            <Button type="button" className="rounded-full" onClick={() => setAddOpen(true)}>
              Add account
            </Button>
          </section>
        </div>
      ) : isWide && browseSource ? (
        <AccountWideView
          sources={ordered}
          activeIndex={browseIndex}
          onActiveIndexChange={setBrowseIndex}
          holderName={holderName}
          onManage={() => setManageOpen(true)}
          onAdd={() => setAddOpen(true)}
          detail={
            <AccountDetailView
              key={browseSource.id}
              source={browseSource}
              currency={currency}
              holderName={holderName}
              balance={sourceBalance(browseSource.id)}
              usage={cardLimitUsage(
                browseSource,
                sources,
                sourceBalance,
                cardCreditLimit
              )}
              recentAcross={recentAcross}
              onEdit={() => setEditing(browseSource)}
              wide
            />
          }
        />
      ) : selectedSource ? (
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
          <AccountDetailView
            source={selectedSource}
            currency={currency}
            holderName={holderName}
            balance={sourceBalance(selectedSource.id)}
            usage={cardLimitUsage(
              selectedSource,
              sources,
              sourceBalance,
              cardCreditLimit
            )}
            recentAcross={recentAcross}
            onBack={() => setSelectedId(null)}
            onEdit={() => setEditing(selectedSource)}
          />
        </div>
      ) : (
        <AccountBrowseView
          sources={ordered}
          activeIndex={browseIndex}
          onActiveIndexChange={setBrowseIndex}
          balanceFor={(id) => sourceBalance(id)}
          currency={currency}
          holderName={holderName}
          onOpen={(source) => setSelectedId(source.id)}
          onManage={() => setManageOpen(true)}
          onAdd={() => setAddOpen(true)}
        />
      )}

      <MoneySourceFormDialog open={addOpen} onOpenChange={setAddOpen} />
      {editing ? (
        <MoneySourceFormDialog
          source={editing}
          open={Boolean(editing)}
          onOpenChange={(next) => {
            if (!next) setEditing(null)
          }}
        />
      ) : null}

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage accounts</DialogTitle>
            <DialogDescription>
              Cash, bank accounts, and credit cards you spend from.
            </DialogDescription>
          </DialogHeader>
          <AccountsManager embedded />
        </DialogContent>
      </Dialog>
    </>
  )
}

function AccountsToolbar({
  onManage,
  onAdd,
}: {
  onManage: () => void
  onAdd: () => void
}) {
  const { hidden, toggleHidden } = useTrackMoney()

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="rounded-full"
        onClick={toggleHidden}
        aria-label={hidden ? "Show amounts" : "Hide amounts"}
        aria-pressed={hidden}
      >
        {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={onManage}
      >
        <Settings2 className="size-4" />
        Manage
      </Button>
      <Button type="button" size="sm" className="rounded-full" onClick={onAdd}>
        <Plus className="size-4" />
        Add
      </Button>
    </>
  )
}

function BrowseHeader({
  onManage,
  onAdd,
}: {
  onManage: () => void
  onAdd: () => void
}) {
  return (
    <header className="flex items-center justify-between gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
      <AccountsToolbar onManage={onManage} onAdd={onAdd} />
    </header>
  )
}

function AccountBrowseView({
  sources,
  activeIndex,
  onActiveIndexChange,
  balanceFor,
  currency,
  holderName,
  onOpen,
  onManage,
  onAdd,
}: {
  sources: MoneySource[]
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  balanceFor: (id: string) => number
  currency: string
  holderName: string
  onOpen: (source: MoneySource) => void
  onManage: () => void
  onAdd: () => void
}) {
  const activeSource = sources[activeIndex] ?? sources[0] ?? null

  return (
    <div className="space-y-6">
      <BrowseHeader onManage={onManage} onAdd={onAdd} />

      <section className="w-full space-y-5">
        {activeSource ? (
          <AccountBalancePanel
            source={activeSource}
            balance={balanceFor(activeSource.id)}
            currency={currency}
          />
        ) : null}
        <AccountPickerCarousel
          sources={sources}
          activeIndex={activeIndex}
          onActiveIndexChange={onActiveIndexChange}
          holderName={holderName}
          onOpen={onOpen}
        />
        {activeSource ? (
          <div className="-mt-2 flex justify-center text-muted-foreground/70">
            <ChevronUp className="size-5" strokeWidth={2.25} aria-hidden />
            <span className="sr-only">Swipe up for details</span>
          </div>
        ) : null}
      </section>
    </div>
  )
}

/** Tablet / desktop: landscape cards centered, active account details below. */
function AccountWideView({
  sources,
  activeIndex,
  onActiveIndexChange,
  holderName,
  onManage,
  onAdd,
  detail,
}: {
  sources: MoneySource[]
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  holderName: string
  onManage: () => void
  onAdd: () => void
  detail: ReactNode
}) {
  const prev = sources[activeIndex - 1]
  const next = sources[activeIndex + 1]

  return (
    <div className="space-y-6">
      <BrowseHeader onManage={onManage} onAdd={onAdd} />

      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className="min-w-0">
          <AccountPickerCarousel
            sources={sources}
            activeIndex={activeIndex}
            onActiveIndexChange={onActiveIndexChange}
            holderName={holderName}
            onOpen={(source) => scrollToAccountSlide(source.id)}
            landscape
          />
          {sources.length > 1 ? (
            <div className="mt-1 flex items-center justify-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="rounded-full"
                disabled={!prev}
                onClick={() => prev && scrollToAccountSlide(prev.id)}
                aria-label="Previous account"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <div className="flex items-center gap-1.5">
                {sources.map((source, index) => (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => scrollToAccountSlide(source.id)}
                    aria-label={`Show ${source.name}`}
                    aria-current={index === activeIndex}
                    className={
                      index === activeIndex
                        ? "h-1.5 w-5 rounded-full bg-foreground transition-all"
                        : "size-1.5 rounded-full bg-border transition-all hover:bg-muted-foreground"
                    }
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="rounded-full"
                disabled={!next}
                onClick={() => next && scrollToAccountSlide(next.id)}
                aria-label="Next account"
              >
                <ArrowRight className="size-4" />
              </Button>
            </div>
          ) : null}
        </section>

        {detail}
      </div>
    </div>
  )
}

function AccountPickerCarousel({
  sources,
  activeIndex,
  onActiveIndexChange,
  holderName,
  onOpen,
  landscape = false,
}: {
  sources: MoneySource[]
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  holderName: string
  onOpen: (source: MoneySource) => void
  landscape?: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startScroll: number
    moved: boolean
  } | null>(null)
  const suppressClickRef = useRef(false)
  const initialIndexRef = useRef(activeIndex)

  useEffect(() => {
    const root = scrollRef.current
    const slide = slideRefs.current[initialIndexRef.current]
    if (root && slide) centerSlide(root, slide, "instant")
  }, [])

  useEffect(() => {
    const root = scrollRef.current
    if (!root) return

    slideRefs.current.length = sources.length
    let frame = 0
    const sync = () => {
      frame = 0
      const index = nearestSlideIndex(root, slideRefs.current)
      if (index >= 0) onActiveIndexChange(index)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(sync)
    }

    root.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      root.removeEventListener("scroll", onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [onActiveIndexChange, sources.length])

  useEffect(() => {
    const root = scrollRef.current
    if (!root || !landscape) return

    let lastStep = 0
    let pending = -1
    const onWheel = (event: WheelEvent) => {
      // Trackpads already scroll horizontally; only translate vertical wheels.
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return
      const now = performance.now()
      const base =
        now - lastStep < 600 && pending >= 0
          ? pending
          : nearestSlideIndex(root, slideRefs.current)
      const target = base + Math.sign(event.deltaY)
      if (target < 0 || target >= slideRefs.current.length) return
      event.preventDefault()
      if (now - lastStep < 320) return
      lastStep = now
      pending = target
      const slide = slideRefs.current[target]
      if (slide) centerSlide(root, slide)
    }

    root.addEventListener("wheel", onWheel, { passive: false })
    return () => root.removeEventListener("wheel", onWheel)
  }, [landscape, sources.length])

  if (landscape) {
    const goTo = (index: number) => {
      const root = scrollRef.current
      const slide = slideRefs.current[index]
      if (root && slide) centerSlide(root, slide)
    }

    return (
      <div
        ref={scrollRef}
        data-account-scroller
        className="flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto py-6 select-none [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
          event.preventDefault()
          const step = event.key === "ArrowRight" ? 1 : -1
          goTo(Math.min(sources.length - 1, Math.max(0, activeIndex + step)))
        }}
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse" || event.button !== 0) return
          const root = event.currentTarget
          dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startScroll: root.scrollLeft,
            moved: false,
          }
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current
          if (!drag || drag.pointerId !== event.pointerId) return
          const root = event.currentTarget
          const dx = event.clientX - drag.startX
          if (!drag.moved && Math.abs(dx) < 6) return
          if (!drag.moved) {
            drag.moved = true
            root.setPointerCapture(event.pointerId)
            root.style.scrollSnapType = "none"
            root.style.scrollBehavior = "auto"
          }
          root.scrollLeft = drag.startScroll - dx
        }}
        onPointerUp={(event) => {
          const drag = dragRef.current
          dragRef.current = null
          if (!drag?.moved) return
          const root = event.currentTarget
          suppressClickRef.current = true
          root.style.scrollSnapType = ""
          root.style.scrollBehavior = ""
          const dx = event.clientX - drag.startX
          const nearest = nearestSlideIndex(root, slideRefs.current)
          const flick =
            nearest === activeIndex && Math.abs(dx) > 40 ? (dx < 0 ? 1 : -1) : 0
          goTo(Math.min(sources.length - 1, Math.max(0, nearest + flick)))
        }}
        onPointerCancel={(event) => {
          dragRef.current = null
          event.currentTarget.style.scrollSnapType = ""
          event.currentTarget.style.scrollBehavior = ""
        }}
        onClickCapture={(event) => {
          if (!suppressClickRef.current) return
          suppressClickRef.current = false
          event.preventDefault()
          event.stopPropagation()
        }}
      >
        <div aria-hidden className="shrink-0" style={{ width: LANDSCAPE_EDGE }} />
        {sources.map((source, index) => (
          <div
            key={source.id}
            ref={(node) => {
              slideRefs.current[index] = node
            }}
            data-index={index}
            data-account-slide={source.id}
            className="shrink-0 snap-center"
            style={{ width: LANDSCAPE_SLIDE }}
          >
            <AccountCard
              source={source}
              active={index === activeIndex}
              holderName={holderName}
              onOpen={() => onOpen(source)}
              landscape
            />
          </div>
        ))}
        <div aria-hidden className="shrink-0" style={{ width: LANDSCAPE_EDGE }} />
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      data-account-scroller
      className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-pl-4 scroll-pr-4 py-2 pl-4 pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {sources.map((source, index) => (
        <div
          key={source.id}
          ref={(node) => {
            slideRefs.current[index] = node
          }}
          data-index={index}
          data-account-slide={source.id}
          className="w-[calc(100vw-2.75rem)] shrink-0 snap-center"
        >
          <AccountCard
            source={source}
            active={index === activeIndex}
            holderName={holderName}
            onOpen={() => onOpen(source)}
          />
        </div>
      ))}
    </div>
  )
}

function AccountCard({
  source,
  active,
  holderName,
  onOpen,
  landscape = false,
}: {
  source: MoneySource
  active: boolean
  holderName: string
  onOpen: () => void
  landscape?: boolean
}) {
  const { hidden } = useTrackMoney()
  const theme = themeForSource(source)
  const Icon = KIND_ICON[source.kind]
  const isCard = source.kind === "credit_card"
  const maskedNumber = source.last4 ? `•••• ${source.last4}` : "•••• ••••"
  const productName = source.name.toUpperCase()
  const holder = holderName.trim().toUpperCase()
  const swipe = useSwipeUpOpen(onOpen, active && !landscape)

  return (
    <button
      type="button"
      {...(landscape ? { onClick: onOpen } : swipe.bind)}
      aria-current={landscape && active ? "true" : undefined}
      className={
        landscape
          ? "relative block aspect-[1.6/1] w-full overflow-hidden rounded-[1.35rem] text-left text-white shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
          : "relative block aspect-10/16 w-full touch-pan-x overflow-hidden rounded-[1.35rem] text-left text-white shadow-2xl"
      }
      style={
        landscape
          ? {
              background: theme.gradient,
              boxShadow: active ? `0 28px 56px -16px ${theme.glow}` : undefined,
              transform: `scale(${active ? 1 : 0.9})`,
              opacity: active ? 1 : 0.55,
              transition:
                "transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.32s ease",
            }
          : {
              background: theme.gradient,
              boxShadow: active ? `0 28px 56px -16px ${theme.glow}` : undefined,
              transform: `translateY(${swipe.offset}px) scale(${active ? 1 : 0.98})`,
              opacity: swipe.leaving ? 0.4 : active ? 1 : 0.85,
              touchAction: swipe.dragging ? "none" : "pan-x",
              transition: swipe.dragging
                ? "none"
                : "transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.32s ease",
            }
      }
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(circle at 30% 20%, ${theme.sheen}, transparent 55%)`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 top-1/3 size-40 rounded-full bg-white/10 blur-2xl"
      />

      <div
        className={
          landscape
            ? "absolute inset-0 flex flex-col p-6"
            : "absolute top-1/2 left-1/2 flex h-[62.5%] w-[160%] origin-center -translate-x-1/2 -translate-y-1/2 rotate-90 flex-col p-6 sm:p-8"
        }
      >
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-full bg-black/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest">
            {theme.label}
          </span>
          {source.cardNetwork ? (
            <CardNetworkMark network={source.cardNetwork} size="lg" />
          ) : (
            <Icon className="size-8 text-white/85" strokeWidth={1.75} />
          )}
        </div>

        {isCard ? (
          <div className="mt-5 h-11 w-16 rounded-md bg-linear-to-br from-amber-200/95 to-amber-500/85" />
        ) : null}

        <div className="mt-auto">
          {isCard || source.last4 ? (
            <p className="font-mono text-2xl tracking-[0.28em] text-white/95">
              {hidden ? "•••• ••••" : maskedNumber}
            </p>
          ) : null}
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/60">
            {source.institution ?? MONEY_SOURCE_KIND_LABEL[source.kind]}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="line-clamp-1 text-xl font-semibold leading-tight tracking-wide">
              {productName}
            </p>
            {holder ? (
              <p className="line-clamp-1 text-sm font-medium tracking-[0.16em] text-white/90">
                {holder}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  )
}

function AccountBalancePanel({
  source,
  balance,
  currency,
}: {
  source: MoneySource
  balance: number
  currency: string
}) {
  const { formatMoney } = useTrackMoney()
  const { sources, sourceBalance, cardCreditLimit } = useTrackLedger()
  const usage = cardLimitUsage(source, sources, sourceBalance, cardCreditLimit)
  const remainingPct = usage ? Math.max(0, 100 - usage.usedPct) : 0
  const isCard = source.kind === "credit_card"
  const balanceLabel = isCard ? "Outstanding" : "Balance"

  return (
    <div className="px-1">
      <p className="text-sm text-muted-foreground">{balanceLabel}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
        {formatMoney(balance, currency)}
      </p>
      {usage ? (
        <div
          className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary"
          role="meter"
          aria-label="Credit remaining"
          aria-valuemin={0}
          aria-valuemax={Math.round(usage.limit)}
          aria-valuenow={Math.round(usage.available)}
        >
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${remainingPct}%` }}
          />
        </div>
      ) : null}
    </div>
  )
}

function AccountDetailView({
  source,
  currency,
  holderName,
  balance,
  usage,
  recentAcross,
  onBack,
  onEdit,
  wide = false,
}: {
  source: MoneySource
  currency: string
  holderName: string
  balance: number
  usage: ReturnType<typeof cardLimitUsage>
  recentAcross: ExpenseWithCategory[]
  onBack?: () => void
  onEdit: () => void
  wide?: boolean
}) {
  const { formatMoney, hidden, toggleHidden } = useTrackMoney()
  const theme = themeForSource(source)
  const balanceLabel =
    source.kind === "credit_card" ? "Outstanding balance" : "Available balance"

  return (
    <div
      className={
        wide
          ? "grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-5"
          : "-mx-4 overflow-hidden rounded-[1.75rem] sm:mx-0"
      }
    >
      <section
        className={cn(
          "bg-(--brand-navy-black) px-5 pb-8 pt-4 text-white sm:px-6 sm:pt-5",
          wide && "rounded-[1.75rem] pb-6"
        )}
      >
        <div className="flex items-center justify-between gap-3">
          {onBack ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full text-white hover:bg-white/10 hover:text-white"
              onClick={onBack}
              aria-label="Back to accounts"
            >
              <ArrowLeft className="size-5" />
            </Button>
          ) : (
            <p className="text-xs font-medium uppercase tracking-wider text-white/50">
              Account details
            </p>
          )}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full text-white hover:bg-white/10 hover:text-white"
              onClick={toggleHidden}
              aria-label={hidden ? "Show amounts" : "Hide amounts"}
            >
              {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full text-white hover:bg-white/10 hover:text-white"
              onClick={onEdit}
              aria-label="Edit account"
            >
              <Pencil className="size-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm text-white/60">{source.name}</p>
          <p className="mt-1 text-sm text-white/50">{balanceLabel}</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
            {formatMoney(balance, currency)}
          </p>
          {usage ? (
            <p className="mt-2 text-sm text-white/50">
              {formatMoney(usage.available, currency)} available of{" "}
              {formatMoney(usage.limit, currency)} limit
            </p>
          ) : null}
          {wide && usage ? (
            <div className="mt-5">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-white/80"
                  style={{ width: `${usage.usedPct}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-white/50">
                {Math.round(usage.usedPct)}% of limit used
              </p>
            </div>
          ) : null}
          {wide ? (
            <p className="mt-5 text-xs uppercase tracking-[0.16em] text-white/45">
              {source.institution ?? MONEY_SOURCE_KIND_LABEL[source.kind]}
              {source.last4 && !hidden ? ` · •••• ${source.last4}` : ""}
            </p>
          ) : null}
        </div>

        {wide ? null : (
          <div className="mt-8 flex justify-center">
            <CompactHorizontalCard
              source={source}
              theme={theme}
              usage={usage}
              holderName={holderName}
            />
          </div>
        )}
      </section>

      <AccountRecentTransactions
        source={source}
        currency={currency}
        recentAcross={recentAcross}
        onEdit={onEdit}
        wide={wide}
      />
    </div>
  )
}

function CompactHorizontalCard({
  source,
  theme,
  usage,
  holderName,
}: {
  source: MoneySource
  theme: (typeof CARD_THEMES)[MoneySourceKind]
  usage: ReturnType<typeof cardLimitUsage>
  holderName: string
}) {
  const { hidden } = useTrackMoney()
  const Icon = KIND_ICON[source.kind]
  const maskedNumber = source.last4 ? `•••• ${source.last4}` : "•••• ••••"
  const holder = holderName.trim()

  return (
    <article
      className="relative aspect-[1.72/1] w-full max-w-sm overflow-hidden rounded-2xl p-4 text-white shadow-xl"
      style={{ background: theme.gradient }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-white/10"
      />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
            {theme.label}
          </span>
          {source.cardNetwork ? (
            <CardNetworkMark network={source.cardNetwork} />
          ) : (
            <Icon className="size-4 text-white/80" />
          )}
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-xs tracking-widest text-white/85">
              {hidden ? "•••• ••••" : maskedNumber}
            </p>
            <p className="mt-1 truncate text-sm font-medium">{source.name}</p>
            {holder ? (
              <p className="mt-0.5 truncate text-[10px] uppercase tracking-wider text-white/70">
                {holder}
              </p>
            ) : null}
          </div>
          {usage ? (
            <div className="shrink-0 text-right text-[10px] text-white/65">
              <p>{Math.round(usage.usedPct)}% used</p>
            </div>
          ) : (
            <p className="shrink-0 text-xs text-white/70">
              {source.institution ?? MONEY_SOURCE_KIND_LABEL[source.kind]}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

function AccountRecentTransactions({
  source,
  currency,
  recentAcross,
  onEdit,
  wide = false,
}: {
  source: MoneySource
  currency: string
  recentAcross: ExpenseWithCategory[]
  onEdit: () => void
  wide?: boolean
}) {
  const { formatMoney } = useTrackMoney()
  const { getExpenseSourceId } = useTrackLedger()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const monthKey = toMonthKey()

  const recentSpends = useMemo(
    () =>
      recentAcross
        .filter(
          (expense) =>
            resolveExpenseSourceId(expense, getExpenseSourceId) === source.id
        )
        .slice(0, wide ? 8 : 5),
    [getExpenseSourceId, recentAcross, source.id, wide]
  )

  const viewMonth =
    recentSpends[0] != null
      ? toMonthKey(new Date(recentSpends[0].spent_at))
      : monthKey

  async function handleDelete() {
    const formData = new FormData()
    formData.set("sourceId", source.id)
    const result = await deleteMoneySource(formData)
    if (!result.ok) {
      toast.error(result.error ?? "Could not remove")
      return
    }
    toast.success("Account removed")
    startTransition(() => router.refresh())
  }

  return (
    <section
      className={
        wide
          ? "track-panel min-w-0 px-5 pb-5 pt-6 sm:px-6"
          : "track-panel -mt-4 mx-5 rounded-t-[1.75rem] border-t-0 px-5 pb-5 pt-6 sm:px-6"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Recent transactions
        </h2>
        {recentSpends.length > 0 ? (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="rounded-full text-muted-foreground"
          >
            <Link
              href={buildExpensesHref({
                monthKey: viewMonth,
                accountId: source.id,
                groupBy: "account",
              })}
            >
              See all
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        ) : null}
      </div>

      {recentSpends.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No recent spends on this account yet.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {recentSpends.map((expense) => (
            <li key={expense.id}>
              <Link
                href={buildExpensesHref({
                  monthKey: toMonthKey(new Date(expense.spent_at)),
                  accountId: source.id,
                  groupBy: "account",
                  expenseId: expense.id,
                })}
                className="flex items-center gap-3 py-3.5 transition-colors hover:bg-secondary/40"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                  {(expense.category?.name ?? "?").charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {expense.category?.name ?? "Uncategorized"}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {expense.note || operationSectionLabel(expense.spent_at)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold tabular-nums">
                    {formatMoney(expense.amount, expense.currency || currency)}
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {formatExpenseTime(expense.spent_at)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex gap-2 border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1 rounded-full"
          onClick={onEdit}
        >
          <Pencil className="size-4" />
          Edit account
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-full text-destructive hover:text-destructive"
          disabled={pending}
          onClick={handleDelete}
          aria-label="Delete account"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </section>
  )
}
