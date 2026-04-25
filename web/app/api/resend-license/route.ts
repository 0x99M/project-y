import { NextRequest, NextResponse } from "next/server";
import { generateLicenseKey } from "@/lib/license";
import { emailHasProPurchase } from "@/lib/paddle";
import { sendLicenseEmail } from "@/lib/email";
import { take } from "@/lib/rate-limit";

// Always succeeds from the caller's perspective: a non-customer cannot
// distinguish their request from a customer's, neither by status code nor
// by response body. The only externally visible signal is the 429 from
// rate limiting, which is anti-abuse rather than customer-status.
const neutral = () => NextResponse.json({ ok: true });

export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return neutral();
  }
  const email = (payload as { email?: unknown })?.email;
  if (typeof email !== "string" || !email.includes("@")) return neutral();

  const normalized = email.trim().toLowerCase();

  // Rate limit by email AND by IP — both must pass.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const emailLimit = take(`resend:email:${normalized}`, 1, 15 * 60_000);
  const ipLimit = take(`resend:ip:${ip}`, 5, 60 * 60_000);

  if (!emailLimit.ok || !ipLimit.ok) {
    const retry = Math.max(emailLimit.retryAfterSec, ipLimit.retryAfterSec);
    return NextResponse.json(
      { ok: true },
      { status: 429, headers: { "Retry-After": String(retry) } }
    );
  }

  // Verify with Paddle. Always return the same body whether or not we sent.
  const isCustomer = await emailHasProPurchase(normalized);
  if (!isCustomer) return neutral();

  const privateKey = process.env.LICENSE_PRIVATE_KEY;
  if (!privateKey) {
    console.error("[resend] LICENSE_PRIVATE_KEY not set");
    return neutral();
  }

  const licenseKey = generateLicenseKey(normalized, privateKey);
  const result = await sendLicenseEmail({
    to: normalized,
    licenseKey,
    kind: "resend",
  });
  if (!result.ok) {
    console.error(`[resend] email send failed for ${normalized}:`, result.error);
  } else {
    console.log(
      `[resend] license re-emailed to ${normalized} (message: ${result.messageId ?? "<unknown>"})`
    );
  }

  return neutral();
}
