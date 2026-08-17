import Link from "next/link"
import { BrandLogo } from "@/components/brand/logo"
import { getCompanyContact } from "@/lib/company"
import { cn } from "@/lib/utils"

type SiteFooterProps = {
  trackHomeUrl?: string
  className?: string
}

export function SiteFooter({ trackHomeUrl, className }: SiteFooterProps) {
  const contact = getCompanyContact()
  const year = new Date().getFullYear()

  return (
    <footer className={cn("relative overflow-hidden bg-muted", className)}>
      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-4 pt-8 sm:px-6 sm:pb-6 sm:pt-10">
        <div className="rounded-[1.75rem] border border-border/70 bg-card px-6 py-8 shadow-[0_24px_80px_-32px_rgba(42,64,100,0.28)] sm:rounded-4xl sm:px-10 sm:py-10">
          <div className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)] md:gap-16">
            <div>
              <BrandLogo className="h-8 w-auto" />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Personalized investment guidance and a free expense tracker for
                people who take their capital seriously.
              </p>
              <address className="mt-5 not-italic text-sm leading-relaxed text-muted-foreground">
                <p className="font-medium text-foreground">{contact.legalName}</p>
                {contact.addressLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <p className="mt-2">
                  <a
                    href={`mailto:${contact.email}`}
                    className="hover:text-foreground"
                  >
                    {contact.email}
                  </a>
                </p>
                {contact.phone ? (
                  <p>
                    <a
                      href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                      className="hover:text-foreground"
                    >
                      {contact.phone}
                    </a>
                  </p>
                ) : null}
              </address>
            </div>
            <div className="grid grid-cols-2 gap-8 text-left sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                  Explore
                </p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="/" className="hover:text-foreground">
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link href="/advisory" className="hover:text-foreground">
                      Advisory
                    </Link>
                  </li>
                  {trackHomeUrl ? (
                    <li>
                      <Link href={trackHomeUrl} className="hover:text-foreground">
                        Wise Track
                      </Link>
                    </li>
                  ) : null}
                  <li>
                    <Link href="/insights" className="hover:text-foreground">
                      Insights
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                  Account
                </p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="/sign-in" className="hover:text-foreground">
                      Sign in
                    </Link>
                  </li>
                  <li>
                    <Link href="/sign-up" className="hover:text-foreground">
                      Create account
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                  Legal
                </p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="/privacy" className="hover:text-foreground">
                      Privacy policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="hover:text-foreground">
                      Terms of use
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 border-t border-border/70 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {year} {contact.legalName}. All rights reserved.
            </p>
            <p>
              Advisory is educational support, not a guarantee of returns.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden px-3 pb-3 sm:px-5 sm:pb-4 lg:px-24">
        <BrandLogo
          decorative
          className="pointer-events-none mx-auto block h-auto w-full select-none"
        />
      </div>
    </footer>
  )
}
