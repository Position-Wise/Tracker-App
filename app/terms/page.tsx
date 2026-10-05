import type { Metadata } from "next"
import Link from "next/link"
import { LegalDocument } from "@/components/legal/legal-document"
import { SiteFooter } from "@/components/layout/site-footer"
import { getCompanyContact } from "@/lib/company"
import { buildShareMetadata } from "@/lib/seo"

export const metadata: Metadata = buildShareMetadata({
  title: "Terms of use",
  description: "Terms for using Wise Track, a personal expense tracker.",
  path: "/terms",
})

export default function TermsPage() {
  const contact = getCompanyContact()

  return (
    <>
      <LegalDocument title="Terms of use" updated="15 August 2026">
        <section>
          <h2>Agreement</h2>
          <p>
            By using Wise Track, you agree to these terms. If you do not agree,
            please do not use the service.
          </p>
        </section>

        <section>
          <h2>The service</h2>
          <p>
            Wise Track is a free personal expense tracker for the money you
            record. It is a record of what you enter, and it is not financial
            advice.
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
          <h2>Liability</h2>
          <p>
            Wise Track is provided as available. We are not liable for
            interruptions or for decisions you make from data you choose to
            enter.
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
      <SiteFooter />
    </>
  )
}
