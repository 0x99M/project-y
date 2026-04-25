import { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Refund Policy — Clipmer",
};

export default function RefundPage() {
  return (
    <LegalLayout title="Refund Policy">
      <p>Last updated: April 2026</p>

      <p>
        This Refund Policy applies to all purchases of Clipmer Pro license keys.
        Clipmer is operated by <strong>0x99M</strong> (&quot;we&quot;,
        &quot;our&quot;, or &quot;us&quot;). Please read this policy carefully
        before purchasing.
      </p>

      <h2>Refunds Are Not Available</h2>
      <p>
        <strong>
          All Clipmer Pro purchases are final and non-refundable.
        </strong>{" "}
        This applies to every Pro license key issued.
      </p>

      <h2>Why Refunds Are Not Available</h2>
      <ul>
        <li>
          <strong>Immediate digital delivery.</strong> Your license key is
          generated and emailed within seconds of payment. Once delivered, the
          digital good has been consumed.
        </li>
        <li>
          <strong>No physical goods.</strong> Clipmer is software. There is
          nothing to ship, return, or restock.
        </li>
        <li>
          <strong>Free evaluation version.</strong> Clipmer ships a fully
          functional free version that runs on the same codebase as Pro. We
          strongly recommend using it to confirm Clipmer works on your system
          before upgrading.
        </li>
      </ul>

      <h2>Cancellation</h2>
      <p>
        Clipmer Pro is a <strong>one-time payment</strong>, not a subscription.
        There is nothing to cancel and no recurring charges. Your license key
        works forever.
      </p>

      <h2>Billing Errors and Failed Delivery</h2>
      <p>
        If you were charged in error, charged more than once for the same
        order, or did not receive your license key, contact{" "}
        <a href="mailto:support@clipmer.app">support@clipmer.app</a> and we
        will resolve the issue.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this Refund Policy:{" "}
        <a href="mailto:support@clipmer.app">support@clipmer.app</a>
      </p>
      <p>
        <strong>Legal Entity:</strong> Clipmer is operated by 0x99M.
      </p>

      <h2>Changes to This Policy</h2>
      <p>
        We may update this Refund Policy from time to time. Updates will be
        posted on this page with a new &quot;Last updated&quot; date.
      </p>
    </LegalLayout>
  );
}
