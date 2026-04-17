import { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Contact — Clipmer",
};

export default function ContactPage() {
  return (
    <LegalLayout title="Contact">
      <p>
        We&apos;re a small team and respond to all emails within{" "}
        <strong>2 business days</strong>.
      </p>

      <h2>Support</h2>
      <p>
        For help with Clipmer, license activation, or bug reports:{" "}
        <a href="mailto:support@clipmer.app">support@clipmer.app</a>
      </p>

      <h2>Purchases</h2>
      <p>
        For questions about your Pro license or purchase:{" "}
        <a href="mailto:support@clipmer.app">support@clipmer.app</a>
      </p>
      <p>
        Please note that all sales are final. See our{" "}
        <a href="/refund">refund policy</a> for details.
      </p>

      <h2>Privacy</h2>
      <p>
        For privacy or data deletion requests:{" "}
        <a href="mailto:privacy@clipmer.app">privacy@clipmer.app</a>
      </p>

      <h2>Bug Reports</h2>
      <p>
        Found a bug? Open an issue on{" "}
        <a
          href="https://github.com/0x99M/project-y/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        .
      </p>
    </LegalLayout>
  );
}
