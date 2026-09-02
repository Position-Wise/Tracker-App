"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
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

      <section className="w-full space-y-5 sm:mx-auto sm:max-w-md">
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

function AccountPickerCarousel({
  sources,
  activeIndex,
  onActiveIndexChange,
  holderName,
  onOpen,
}: {
  sources: MoneySource[]
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  holderName: string
  onOpen: (source: MoneySource) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const root = scrollRef.current
    if (!root) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const top = visible[0]
        if (!top) return
        const index = Number(top.target.getAttribute("data-index"))
        if (!Number.isNaN(index)) onActiveIndexChange(index)
      },
      { root, threshold: [0.55, 0.72, 0.88] }
    )

    slideRefs.current.forEach((node) => {
      if (node) observer.observe(node)
    })

    return () => observer.disconnect()
  }, [onActiveIndexChange, sources.length])

  return (
    <div
      ref={scrollRef}
      className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-pl-4 scroll-pr-4 py-2 pl-4 pr-4 [scrollbar-width:none] sm:mx-0 sm:scroll-pl-0 sm:scroll-pr-0 sm:pl-0 sm:pr-0 [&::-webkit-scrollbar]:hidden"
    >
      {sources.map((source, index) => (
        <div
          key={source.id}
          ref={(node) => {
            slideRefs.current[index] = node
          }}
          data-index={index}
          className="w-[calc(100vw-2.75rem)] shrink-0 snap-center sm:w-[calc(100%-1.25rem)]"
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
}: {
  source: MoneySource
  active: boolean
  holderName: string
  onOpen: () => void
}) {
  const { hidden } = useTrackMoney()
  const theme = themeForSource(source)
  const Icon = KIND_ICON[source.kind]
  const isCard = source.kind === "credit_card"
  const maskedNumber = source.last4 ? `•••• ${source.last4}` : "•••• ••••"
  const productName = source.name.toUpperCase()
  const holder = holderName.trim().toUpperCase()
  const swipe = useSwipeUpOpen(onOpen, active)

  return (
    <button
      type="button"
      {...swipe.bind}
      className="relative block aspect-10/16 w-full touch-pan-x overflow-hidden rounded-[1.35rem] text-left text-white shadow-2xl"
      style={{
        background: theme.gradient,
        boxShadow: active ? `0 28px 56px -16px ${theme.glow}` : undefined,
        transform: `translateY(${swipe.offset}px) scale(${active ? 1 : 0.98})`,
        opacity: swipe.leaving ? 0.4 : active ? 1 : 0.85,
        touchAction: swipe.dragging ? "none" : "pan-x",
        transition: swipe.dragging
          ? "none"
          : "transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.32s ease",
      }}
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

      <div className="absolute top-1/2 left-1/2 flex h-[62.5%] w-[160%] origin-center -translate-x-1/2 -translate-y-1/2 rotate-90 flex-col p-6 sm:p-8">
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
}: {
  source: MoneySource
  currency: string
  holderName: string
  balance: number
  usage: ReturnType<typeof cardLimitUsage>
  recentAcross: ExpenseWithCategory[]
  onBack: () => void
  onEdit: () => void
}) {
  const { formatMoney, hidden, toggleHidden } = useTrackMoney()
  const theme = themeForSource(source)
  const balanceLabel =
    source.kind === "credit_card" ? "Outstanding balance" : "Available balance"

  return (
    <div className="-mx-4 overflow-hidden rounded-[1.75rem] sm:mx-0">
      <section className="bg-(--brand-navy-black) px-5 pb-8 pt-4 text-white sm:px-6 sm:pt-5">
        <div className="flex items-center justify-between gap-3">
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
        </div>

        <div className="mt-8 flex justify-center">
          <CompactHorizontalCard
            source={source}
            theme={theme}
            usage={usage}
            holderName={holderName}
          />
        </div>
      </section>

      <AccountRecentTransactions
        source={source}
        currency={currency}
        recentAcross={recentAcross}
        onEdit={onEdit}
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
}: {
  source: MoneySource
  currency: string
  recentAcross: ExpenseWithCategory[]
  onEdit: () => void
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
        .slice(0, 5),
    [getExpenseSourceId, recentAcross, source.id]
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
    <section className="track-panel -mt-4 mx-5 rounded-t-[1.75rem] border-t-0 px-5 pb-5 pt-6 sm:px-6">
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

function cardLimitUsage(
  source: MoneySource,
  allSources: MoneySource[],
  balanceFor: (id: string) => number,
  limitFor: (source: MoneySource) => number | null
) {
  if (source.kind !== "credit_card") return null
  const limit = limitFor(source)
  if (limit == null || limit <= 0) return null

  const used = source.creditLimitPoolId
    ? allSources
        .filter((s) => s.creditLimitPoolId === source.creditLimitPoolId)
        .reduce((sum, s) => sum + Math.max(0, balanceFor(s.id)), 0)
    : Math.max(0, balanceFor(source.id))

  return {
    limit,
    used,
    available: Math.max(0, limit - used),
    usedPct: Math.min(100, (used / limit) * 100),
  }
}
