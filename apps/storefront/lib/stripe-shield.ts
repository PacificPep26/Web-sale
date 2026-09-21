const DEFAULT_NICHE = process.env.SITE || "eyewear";

/**
 * Stripe Shield: Sanitizes payment intent descriptions, statement descriptors,
 * and metadata sent to Stripe API. Prevents any trademarked luxury brands or
 * copyright keywords from ever reaching Stripe logs or payment intents.
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

export function sanitizeDescription(rawName: string, niche: string = DEFAULT_NICHE): string {
  let clean = rawName;
  for (const kw of BLOCKED_KEYWORDS) {
    const regex = new RegExp(`\\b${kw}\\b`, "gi");
    clean = clean.replace(regex, "");
  }
  clean = clean.trim().replace(/\s+/g, " ");

  if (!clean || clean.length < 3) {
    return niche === "toys"
      ? "PlayPuff Creative Toy & Plush Series"
      : "LuxeShade Handcrafted Acetate Eyewear & Case Kit";
  }
  return clean;
}

export function buildSafeStripePayload(cartId: string, niche: string = DEFAULT_NICHE) {
  const shortId = cartId.slice(-6).toUpperCase();

  const payment_description =
    niche === "toys"
      ? `PlayPuff Order #${shortId} - Creative Play & Sensory Series`
      : `LuxeShade Order #${shortId} - Handcrafted Eyewear & Case Kit`;

  return {
    payment_description,
    metadata: {
      store: niche === "toys" ? "playpuff" : "luxeshade",
      category: niche === "toys" ? "creative_toys" : "eyewear_studio",
      order_ref: shortId,
      shield_protected: "true",
    },
  };
}
