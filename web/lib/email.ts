import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = () =>
  process.env.RESEND_FROM || "Clipmer <noreply@clipmer.app>";

type Kind = "purchase" | "resend";

const SUBJECT: Record<Kind, string> = {
  purchase: "Your Clipmer Pro License Key",
  resend: "Your Clipmer Pro License Key (Resent)",
};

const HEADING: Record<Kind, string> = {
  purchase: "Thank you for purchasing Clipmer Pro!",
  resend: "Your Clipmer Pro License Key",
};

function renderHtml(licenseKey: string, kind: Kind): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <h2 style="color: #E95420; margin-bottom: 24px;">${HEADING[kind]}</h2>

      <p style="color: #333; line-height: 1.6;">${
        kind === "purchase"
          ? `Your license key is below. Copy it and paste it into <strong>Clipmer &rarr; Settings &rarr; License &rarr; Activate</strong>.`
          : `Here's your license key. Copy it and paste it into <strong>Clipmer &rarr; Settings &rarr; License &rarr; Activate</strong>.`
      }</p>

      <div style="background: #f5f5f5; border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin: 24px 0; word-break: break-all; font-family: monospace; font-size: 13px; color: #111;">
        ${licenseKey}
      </div>

      <p style="color: #333; line-height: 1.6;">Keep this email &mdash; it's your proof of purchase. If you ever need your key resent, visit <a href="https://clipmer.app/pro" style="color: #E95420;">clipmer.app/pro</a>.</p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
      <p style="color: #999; font-size: 12px;">Clipmer &mdash; Clipboard History Manager for Linux</p>
    </div>
  `;
}

export async function sendLicenseEmail(args: {
  to: string;
  licenseKey: string;
  kind: Kind;
}): Promise<{ ok: boolean; messageId?: string; error?: unknown }> {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM(),
      to: args.to,
      subject: SUBJECT[args.kind],
      html: renderHtml(args.licenseKey, args.kind),
    });
    if (error) return { ok: false, error };
    return { ok: true, messageId: data?.id };
  } catch (err) {
    return { ok: false, error: err };
  }
}
