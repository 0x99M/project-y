import { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Terms of Service — Clipmer",
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service">
      <p>Last updated: April 2026</p>

      <p>
        Welcome to Clipmer, operated by <strong>0x99M</strong>
        (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). These Terms of
        Service (&quot;Terms&quot;) govern your access to and use of the
        Clipmer desktop application, the Pro license key, and the clipmer.app
        website (collectively, the &quot;Service&quot;). By downloading,
        installing, or purchasing Clipmer, you agree to these Terms.
      </p>

      <h2>Nature of the Service</h2>
      <p>
        Clipmer is a <strong>fully automated software product</strong>. The
        free version is open source, distributed under the MIT License. The
        Pro version is delivered as an automatically generated license key
        emailed to you immediately after payment.
      </p>
      <p>
        <strong>No human-driven services are involved</strong> in the
        delivery, processing, or operation of the Service beyond standard
        email-based customer support. Clipmer does not offer consulting,
        custom development, managed services, or any human-performed work as
        part of any plan.
      </p>

      <h2>Pricing</h2>
      <p>
        Clipmer Pro is sold at a single <strong>one-time price of $9.00</strong>{" "}
        for an individual personal license. There are no subscriptions, no
        recurring charges, no seat counts, and{" "}
        <strong>no custom or enterprise tiers</strong>. The price displayed on{" "}
        <a href="/pro">clipmer.app/pro</a> is the only price Clipmer charges.
      </p>
      <p>
        Payment processing is handled by <strong>Paddle</strong> as our
        Merchant of Record. You agree to Paddle&apos;s terms when completing a
        purchase.
      </p>

      <h2>License</h2>
      <p>
        Clipmer is open-source software released under the{" "}
        <strong>MIT License</strong>. You may use, modify, and distribute the
        free version without restriction.
      </p>
      <p>
        A Clipmer Pro license key grants <strong>one individual</strong> access
        to Pro features on any number of personal Linux devices they own.
        License keys are non-transferable and may not be shared, resold, or
        redistributed.
      </p>

      <h2>Permitted Use</h2>
      <ul>
        <li>Use Clipmer on any number of personal devices you own</li>
        <li>Build from source for personal or commercial use</li>
        <li>Modify the source code under the MIT License terms</li>
      </ul>

      <h2>Prohibited Use</h2>
      <ul>
        <li>Sharing or publicly posting license keys</li>
        <li>Circumventing the license validation system for commercial gain</li>
        <li>Misrepresenting Clipmer as your own product</li>
      </ul>

      <h2 id="refunds">Refunds</h2>
      <p>
        All Clipmer Pro purchases are <strong>final and non-refundable</strong>.
        Clipmer ships a fully functional free version on the same codebase, so
        you can confirm compatibility with your system before upgrading. See
        the dedicated <a href="/refund">Refund Policy</a> for details.
      </p>
      <p>
        If you were charged in error or did not receive your license key,
        contact <a href="mailto:support@clipmer.app">support@clipmer.app</a>{" "}
        and we will resolve the issue.
      </p>

      <h2>Revocation</h2>
      <p>
        We reserve the right to revoke license keys that are shared publicly or
        used in violation of these Terms.
      </p>

      <h2>Disclaimer</h2>
      <p>
        Clipmer is provided <strong>&quot;as is&quot;</strong> without warranty
        of any kind, express or implied. We are not liable for any data loss,
        damages, or issues arising from the use of this software.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these Terms from time to time. Continued use of Clipmer
        after changes constitutes acceptance of the updated Terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these Terms:{" "}
        <a href="mailto:support@clipmer.app">support@clipmer.app</a>
      </p>
      <p>
        <strong>Legal Entity:</strong> Clipmer is operated by 0x99M.
      </p>
    </LegalLayout>
  );
}
