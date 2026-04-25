// Paddle REST helpers. The webhook talks to Paddle directly via fetch —
// this module centralizes the auth/error-handling boilerplate.

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

