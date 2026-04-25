// Paddle REST helpers. The webhook and the resend endpoint both talk to
// Paddle directly via fetch — these helpers centralize that.

const PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID;

export function getPaddleApiBase(): string {
  const env = process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox";
  return env === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";
}

async function paddleGet<T>(path: string): Promise<T | null> {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    console.error("[paddle] PADDLE_API_KEY not set");
    return null;
  }
  try {
    const res = await fetch(`${getPaddleApiBase()}${path}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      console.error(`[paddle] GET ${path} → ${res.status} ${res.statusText}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[paddle] GET ${path} threw:`, err);
    return null;
  }
}

// Resolve a customer email from a webhook payload. Tries the inline fields
// first, then falls back to GET /customers/:id with PADDLE_API_KEY.
export async function resolveCustomerEmail(data: {
  customer_id?: string;
  customer_email_address?: string;
  customer?: { email?: string };
}): Promise<string | null> {
  const direct = data?.customer_email_address || data?.customer?.email || null;
  if (direct) return direct;

  const customerId = data?.customer_id;
  if (!customerId) return null;

  const json = await paddleGet<{ data?: { email?: string } }>(
    `/customers/${customerId}`
  );
  return json?.data?.email ?? null;
}

// Returns true iff `email` matches a Paddle customer with at least one
// completed transaction containing the configured Pro price ID.
export async function emailHasProPurchase(email: string): Promise<boolean> {
  if (!PRICE_ID) {
    console.error("[paddle] NEXT_PUBLIC_PADDLE_PRICE_ID not set");
    return false;
  }

  const lookup = await paddleGet<{
    data?: { id: string; email: string }[];
  }>(`/customers?email=${encodeURIComponent(email)}`);
  const customer = lookup?.data?.find(
    (c) => c.email.toLowerCase() === email.toLowerCase()
  );
  if (!customer) return false;

  const txs = await paddleGet<{
    data?: { status: string; items?: { price?: { id?: string } }[] }[];
  }>(`/transactions?customer_id=${customer.id}&status=completed&per_page=50`);
  if (!txs?.data) return false;

  return txs.data.some((tx) =>
    tx.items?.some((it) => it.price?.id === PRICE_ID)
  );
}
