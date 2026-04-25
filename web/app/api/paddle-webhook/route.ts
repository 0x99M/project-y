import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { generateLicenseKey } from "@/lib/license";
import { resolveCustomerEmail } from "@/lib/paddle";
import { sendLicenseEmail } from "@/lib/email";

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
    const result = await sendLicenseEmail({
      to: email,
      licenseKey,
      kind: "purchase",
    });

    if (!result.ok) {
      console.error(
        `[webhook] License email failed (tx: ${transactionId ?? "<unknown>"}, email: ${email}):`,
        result.error
      );
      return NextResponse.json({ error: "Email send failed" }, { status: 500 });
    }

    console.log(
      `[webhook] License emailed to ${email} (message: ${result.messageId ?? "<unknown>"}, tx: ${transactionId ?? "<unknown>"})`
    );
  }

  return NextResponse.json({ ok: true });
}
