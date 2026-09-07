import crypto from "crypto";

/**
 * AES-256-GCM encryption for supplier API credentials at rest.
 * Key comes from SUPPLIER_SECRET_KEY (64 hex chars = 32 bytes).
 * Format: base64( iv[12] | authTag[16] | ciphertext ).
 */

function getKey(): Buffer {
  const hex = process.env.SUPPLIER_SECRET_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "SUPPLIER_SECRET_KEY must be set to 64 hex characters (32 bytes)"
    );
  }
  return Buffer.from(hex, "hex");
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptSecret(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

/** Encrypt every string value of an object (one level deep). */
export function encryptCredentials(creds: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(creds)) {
    if (v == null) continue;
    out[k] = encryptSecret(String(v));
  }
  return out;
}

export function decryptCredentials(
  creds: Record<string, string> | null | undefined
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(creds ?? {})) {
    try {
      out[k] = decryptSecret(v);
    } catch {
      // value may be plaintext (dev) — pass through
      out[k] = v;
    }
  }
  return out;
}
