import Link from "next/link"
import { cn } from "@/lib/utils"

type BrandLogoProps = {
  className?: string
  priority?: boolean
  decorative?: boolean
}

export function BrandLogo({
  className,
  priority = false,
  decorative = false,
}: BrandLogoProps) {
  return (
    <img
      src="/brand/logo.svg"
      alt={decorative ? "" : "Position Wise Advisory"}
      width={442}
      height={85}
      className={cn("h-7 w-auto", className)}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      aria-hidden={decorative || undefined}
    />
  )
}

export function BrandLogoLink({
  href = "/",
  className,
  logoClassName,
  priority,
}: {
  href?: string
  className?: string
  logoClassName?: string
  priority?: boolean
}) {
  return (
    <Link
      href={href}
      aria-label="Position Wise Advisory home"
      className={cn("flex items-center", className)}
    >
      <BrandLogo className={logoClassName} priority={priority} />
    </Link>
  )
}
