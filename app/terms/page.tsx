import type { Metadata } from "next"
import Link from "next/link"
import { LegalDocument } from "@/components/legal/legal-document"
import { SiteFooter } from "@web/components/site-footer"
import { getCompanyContact } from "@/lib/company"
import { buildShareMetadata } from "@/lib/seo"
import { resolveTrackPlatformRedirectUrl } from "@track/lib/resolve-track-platform-url"

export const metadata: Metadata = buildShareMetadata({
  title: "Terms of use",
  description:
    "Terms for using Position Wise Advisory, Wise Track, and related membership access.",
  path: "/terms",
})

export default async function TermsPage() {
  const contact = getCompanyContact()
  const trackHomeUrl = await resolveTrackPlatformRedirectUrl("/")

  return (
    <>
      <LegalDocument title="Terms of use" updated="15 August 2026">
        <section>
          <h2>Agreement</h2>
          <p>
            By using {contact.legalName} websites and apps, including Wise Track,
            you agree to these terms. If you do not agree, please do not use the
            service.
          </p>
        </section>

        <section>
          <h2>The service</h2>
          <p>
            Wise Track is a free personal expense tracker. Advisory access is a
            separate relationship: educational guidance fitted to the information
            you share. It is not a guarantee of returns, and it is not a
            substitute for your own decisions about capital.
          </p>
        </section>

        <section>
          <h2>Accounts</h2>
          <ul>
            <li>You must provide accurate sign-in details and keep them secure.</li>
            <li>
              Tracker data you enter is private to your account. Do not upload
              content you do not have the right to share.
            </li>
            <li>
              We may suspend access that is abusive, fraudulent, or that
              interferes with other users.
            </li>
          </ul>
        </section>

        <section>
          <h2>Membership and payments</h2>
          <p>
            Paid advisory access, where offered, is reviewed after you submit a
            request and any required payment proof. Submission is not approval.
            Refunds, if any, follow the communication we send when a plan is
            confirmed.
          </p>
        </section>

        <section>
          <h2>Liability</h2>
          <p>
            The site and Wise Track are provided as available. We are not liable
            for investment outcomes, interruptions, or data you choose to enter.
            Nothing here creates a fiduciary duty beyond what written membership
            terms expressly state.
          </p>
        </section>

        <section>
          <h2>Privacy</h2>
          <p>
            How we handle personal data is described in the{" "}
            <Link href="/privacy">privacy policy</Link>.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            {contact.legalName}
            <br />
            {contact.addressLines.join(", ")}
            <br />
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
            {contact.phone ? (
              <>
                <br />
                {contact.phone}
              </>
            ) : null}
          </p>
        </section>
      </LegalDocument>
      <SiteFooter trackHomeUrl={trackHomeUrl} />
    </>
  )
}
