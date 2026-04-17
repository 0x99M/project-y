import crypto from "crypto";

export function generateLicenseKey(
  email: string,
  privateKeyPem: string
): string {
  const payload = JSON.stringify({
    email,
    createdAt: Date.now(),
    features: ["pro"],
  });

  const signature = crypto
    .sign(null, Buffer.from(payload), privateKeyPem)
    .toString("base64");

  return Buffer.from(JSON.stringify({ payload, signature })).toString("base64");
}
