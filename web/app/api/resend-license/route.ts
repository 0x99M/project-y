import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { generateLicenseKey } from "@/lib/license";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const privateKey = process.env.LICENSE_PRIVATE_KEY;
  if (!privateKey) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  const licenseKey = generateLicenseKey(email.trim(), privateKey);

  await getResend().emails.send({
    from: "Clipmer <noreply@clipmer.app>",
    to: email.trim(),
    subject: "Your Clipmer Pro License Key (Resent)",
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #E95420;">Your Clipmer Pro License Key</h2>

        <p style="color: #333; line-height: 1.6;">Here's your license key. Copy it and paste it into <strong>Clipmer → Settings → License → Activate</strong>.</p>

        <div style="background: #f5f5f5; border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin: 24px 0; word-break: break-all; font-family: monospace; font-size: 13px; color: #111;">
          ${licenseKey}
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #999; font-size: 12px;">Clipmer — Clipboard History Manager for Linux</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
