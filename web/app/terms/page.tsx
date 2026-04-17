import { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Terms of Service — Clipmer",
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service">
      <p>Last updated: April 2026</p>

      <h2>License</h2>
      <p>
        Clipmer is open-source software released under the{" "}
        <strong>MIT License</strong>. You may use, modify, and distribute the
        free version without restriction.
      </p>
      <p>
        A Clipmer Pro license key grants <strong>one individual</strong> access
        to Pro features. License keys are non-transferable and may not be
        shared, resold, or redistributed.
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
        All purchases of Clipmer Pro are <strong>final</strong>. We do not
        offer refunds. Clipmer offers a fully functional free version so you
        can evaluate the app before purchasing — we strongly recommend using
        it to confirm Clipmer meets your needs and is compatible with your
        system before upgrading to Pro.
      </p>
      <p>
        If you were charged in error or experienced a technical issue that
        prevented delivery of your license key, contact{" "}
        <a href="mailto:support@clipmer.app">support@clipmer.app</a> and we
        will resolve the issue.
      </p>

      <h2>Revocation</h2>
      <p>
        We reserve the right to revoke license keys that are shared publicly or
        used in violation of these terms.
      </p>

      <h2>Disclaimer</h2>
      <p>
        Clipmer is provided <strong>&quot;as is&quot;</strong> without warranty
        of any kind, express or implied. We are not liable for any data loss,
        damages, or issues arising from the use of this software.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms from time to time. Continued use of Clipmer
        after changes constitutes acceptance of the updated terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms:{" "}
        <a href="mailto:support@clipmer.app">support@clipmer.app</a>
      </p>
    </LegalLayout>
  );
}
