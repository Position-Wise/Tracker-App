import type { CardNetwork } from "@track/lib/money-sources"
import { cn } from "@/lib/utils"

export function CardNetworkMark({
  network,
  className,
  size = "md",
}: {
  network: CardNetwork | null | undefined
  className?: string
  size?: "md" | "lg"
}) {
  if (!network) return null
  const large = size === "lg"

  if (network === "visa") {
    return (
      <span
        className={cn(
          "font-bold italic tracking-[0.12em] text-white",
          large ? "text-[28px]" : "text-[15px]",
          className
        )}
      >
        VISA
      </span>
    )
  }

  if (network === "mastercard") {
    return (
      <svg
        viewBox="0 0 36 22"
        className={cn(large ? "h-8 w-[52px]" : "h-[18px] w-[30px]", className)}
        aria-label="Mastercard"
      >
        <circle cx="13" cy="11" r="9" fill="#EB001B" />
        <circle cx="23" cy="11" r="9" fill="#F79E1B" />
        <path
          d="M18 4.4a9 9 0 0 0 0 13.2 9 9 0 0 0 0-13.2z"
          fill="#FF5F00"
        />
      </svg>
    )
  }

  if (network === "amex") {
    return (
      <span
        className={cn(
          "rounded-[3px] border border-white/85 font-bold tracking-[0.18em] text-white",
          large ? "px-2 py-1 text-xs" : "px-1.5 py-0.5 text-[9px]",
          className
        )}
      >
        AMEX
      </span>
    )
  }

  return (
    <span
      className={cn(
        "font-semibold tracking-wide text-white",
        large ? "text-[22px]" : "text-[13px]",
        className
      )}
    >
      RuPay
    </span>
  )
}
