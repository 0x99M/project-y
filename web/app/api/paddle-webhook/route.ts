import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";
import { generateLicenseKey } from "@/lib/license";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

function getPaddleApiBase(): string {
  const env = process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox";
  return env === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";
}

async function resolveCustomerEmail(data: {
  customer_id?: string;
  customer_email_address?: string;
  customer?: { email?: string };
}): Promise<string | null> {
  // 1. Try any email field that might be present in the webhook payload
  const direct =
    data?.customer_email_address ||
    data?.customer?.email ||
    null;
  if (direct) return direct;

  // 2. Fall back to Paddle API: fetch the customer by customer_id
  const customerId = data?.customer_id;
  if (!customerId) return null;

  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    console.error(
      "[webhook] PADDLE_API_KEY not set — cannot fetch customer email"
    );
    return null;
  }

  try {
    const res = await fetch(`${getPaddleApiBase()}/customers/${customerId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      console.error(
        `[webhook] Paddle customer fetch failed (${customerId}): ${res.status} ${res.statusText}`
      );
      return null;
    }
    const json = await res.json();
    return json?.data?.email ?? null;
  } catch (err) {
    console.error(`[webhook] Paddle customer fetch threw (${customerId}):`, err);
    return null;
  }
}

function verifyPaddleSignature(
  rawBody: string,
  signature: string | null
): boolean {
  if (!signature || !process.env.PADDLE_WEBHOOK_SECRET) return false;

  const parts = signature.split(";").reduce(
    (acc, part) => {
      const [key, value] = part.split("=");
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  const ts = parts["ts"];
  const h1 = parts["h1"];
  if (!ts || !h1) return false;

  const payload = `${ts}:${rawBody}`;
  const hmac = crypto.createHmac("sha256", process.env.PADDLE_WEBHOOK_SECRET);
  hmac.update(payload);
  const computed = hmac.digest("hex");

  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(h1));
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("paddle-signature");

  if (!verifyPaddleSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);

  if (body.event_type === "transaction.completed") {
    const transactionId: string | undefined = body.data?.id;
    const email = await resolveCustomerEmail(body.data ?? {});
    if (!email) {
      console.error(
        `[webhook] No customer email on transaction ${transactionId ?? "<unknown>"} (customer_id: ${body.data?.customer_id ?? "<none>"})`
      );
      return NextResponse.json({ error: "No email found" }, { status: 400 });
    }

    const privateKey = process.env.LICENSE_PRIVATE_KEY;
    if (!privateKey) {
      console.error("[webhook] LICENSE_PRIVATE_KEY not set");
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      );
    }

    const licenseKey = generateLicenseKey(email, privateKey);

    try {
      const { data, error } = await getResend().emails.send({
        from: process.env.RESEND_FROM || "Clipmer <noreply@clipmer.app>",
        to: email,
        subject: "Your Clipmer Pro License Key",
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
            <h2 style="color: #E95420; margin-bottom: 24px;">Thank you for purchasing Clipmer Pro!</h2>

            <p style="color: #333; line-height: 1.6;">Your license key is below. Copy it and paste it into <strong>Clipmer &rarr; Settings &rarr; License &rarr; Activate</strong>.</p>

            <div style="background: #f5f5f5; border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin: 24px 0; word-break: break-all; font-family: monospace; font-size: 13px; color: #111;">
              ${licenseKey}
            </div>

            <p style="color: #333; line-height: 1.6;">Keep this email &mdash; it's your proof of purchase. If you ever need your key resent, visit <a href="https://clipmer.app/pro" style="color: #E95420;">clipmer.app/pro</a>.</p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
            <p style="color: #999; font-size: 12px;">Clipmer &mdash; Clipboard History Manager for Linux</p>
          </div>
        `,
      });

      if (error) {
        console.error(
          `[webhook] Resend rejected send (tx: ${transactionId ?? "<unknown>"}, email: ${email}):`,
          error
        );
        return NextResponse.json({ error: "Email send failed" }, { status: 500 });
      }

      console.log(
        `[webhook] License emailed to ${email} (message: ${data?.id ?? "<unknown>"}, tx: ${transactionId ?? "<unknown>"})`
      );
    } catch (err) {
      console.error(
        `[webhook] Exception during email send (tx: ${transactionId ?? "<unknown>"}, email: ${email}):`,
        err
      );
      return NextResponse.json({ error: "Email send failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
