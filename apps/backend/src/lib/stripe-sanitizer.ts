/**
 * Backend Stripe Sanitizer:
 * Provides sanitization for Stripe charges, descriptions, and line item metadata
 * to prevent trademark or counterfeit keywords from reaching Stripe payment records.
 */

const BLOCKED_KEYWORDS = [
  "gucci",
  "prada",
  "cartier",
  "fendi",
  "miu miu",
  "miumiu",
  "tom ford",
  "tomford",
  "chrome hearts",
  "jacques marie mage",
  "chanel",
  "dior",
  "louis vuitton",
  "balenciaga",
  "saint laurent",
  "ysl",
  "disney",
  "marvel",
  "lego",
  "pokemon",
  "replica",
  "fake",
  "rep",
  "dupe",
  "1:1",
];

export function sanitizeTitle(rawTitle: string, fallback: string = "Handcrafted Optical Frame"): string {
  let clean = rawTitle;
  for (const kw of BLOCKED_KEYWORDS) {
    const regex = new RegExp(`\\b${kw}\\b`, "gi");
    clean = clean.replace(regex, "");
  }
  clean = clean.trim().replace(/\s+/g, " ");
  return clean.length >= 3 ? clean : fallback;
}

export function getSafePaymentDescription(channelName: string, orderId: string): string {
  const shortId = orderId.slice(-6).toUpperCase();
  const lowerChannel = (channelName || "").toLowerCase();

  if (lowerChannel.includes("toy") || lowerChannel.includes("playpuff")) {
    return `PlayPuff Order #${shortId} - Creative Play Series`;
  }
  return `LuxeShade Order #${shortId} - Handcrafted Eyewear & Case`;
}

