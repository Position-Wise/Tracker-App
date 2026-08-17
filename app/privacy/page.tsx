import type { Metadata } from "next"
import Link from "next/link"
import { LegalDocument } from "@/components/legal/legal-document"
import { SiteFooter } from "@/components/marketing/site-footer"
import { getCompanyContact } from "@/lib/company"
import { buildShareMetadata } from "@/lib/seo"
import { resolveTrackPlatformRedirectUrl } from "@/lib/resolve-track-platform-url"

export const metadata: Metadata = buildShareMetadata({
  title: "Privacy policy",
  description:
    "How Position Wise Advisory collects, uses, and protects personal data across advisory access and Wise Track.",
  path: "/privacy",
})

export default async function PrivacyPage() {
  const contact = getCompanyContact()
  const trackHomeUrl = await resolveTrackPlatformRedirectUrl("/")

  return (
    <>
      <LegalDocument title="Privacy policy" updated="15 August 2026">
        <section>
          <h2>Who we are</h2>
          <p>
            This policy explains how {contact.legalName} (“we”, “us”) handles
            personal data when you use our website, Wise Track, and advisory
            access.
          </p>
          <p className="mt-3">
            {contact.addressLines.join(", ")}
            <br />
            Email:{" "}
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
            {contact.phone ? (
              <>
                <br />
                Phone: {contact.phone}
              </>
            ) : null}
          </p>
        </section>

        <section>
          <h2>Data we collect</h2>
          <ul>
            <li>
              Account data: name, email, and sign-in details from Google or email
              sign-up.
            </li>
            <li>
              Wise Track data you enter: accounts, categories, expenses, income,
              transfers, and related preferences.
            </li>
            <li>
              Advisory and membership data: plan choices, inquiries, and payment
              proof you upload.
            </li>
            <li>
              Technical data: device, browser, and approximate usage needed to
              keep the service secure.
            </li>
          </ul>
        </section>

        <section>
          <h2>How we use data</h2>
          <ul>
            <li>To create and secure your account.</li>
            <li>To provide Wise Track and advisory access you request.</li>
            <li>To review membership and custom-plan inquiries.</li>
            <li>
              To understand aggregated site usage via privacy-friendly Vercel
              Analytics.
            </li>
          </ul>
        </section>

        <section>
          <h2>Cookies</h2>
          <p>
            Essential cookies keep you signed in and protect the login flow. They
            are required for the product to work. We also use privacy-friendly
            Vercel Analytics, which does not rely on advertising cookies. You can
            read more in our <Link href="/terms">terms of use</Link>.
          </p>
        </section>

        <section>
          <h2>Processors</h2>
          <p>
            We host the app on Vercel and store account and product data with
            Supabase. Payment screenshots you upload are stored so we can review
            membership requests. We do not sell your personal data.
          </p>
        </section>

        <section>
          <h2>Retention and your rights</h2>
          <p>
            We keep account and tracker data while your account is active, and
            for a reasonable period afterwards if needed for security or legal
            reasons. Under applicable Indian law, including the Digital Personal
            Data Protection Act, you may request access, correction, or deletion
            of your personal data by emailing{" "}
            <a href={`mailto:${contact.email}`}>{contact.email}</a>.
          </p>
        </section>
      </LegalDocument>
      <SiteFooter trackHomeUrl={trackHomeUrl} />
    </>
  )
}
