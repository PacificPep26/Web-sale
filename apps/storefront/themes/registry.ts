export type NicheKey = "cases" | "eyewear" | "toys";

export const NICHES: NicheKey[] = ["cases", "eyewear", "toys"];

export type ThemeConfig = {
  key: NicheKey;
  brand: string;
  tagline: string;
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    cta: string;
  };
  /** google font families to load for --font-display / --font-body */
  fonts: string[];
  /** homepage section order */
  sections: Array<"hero" | "featured" | "usps" | "rail" | "faq">;
  usps: { title: string; body: string }[];
  faqs: { q: string; a: string }[];
  /** category handle used as the "shop all" collection */
  collectionHandle: string;
};

const domainMap: Record<string, NicheKey> = {
  "cases.com": "cases",
  "eyewear.com": "eyewear",
  "toys.com": "toys",
};

export function resolveNiche(host?: string | null): NicheKey {
  const fromEnv = process.env.SITE as NicheKey | undefined;
  if (fromEnv && NICHES.includes(fromEnv)) return fromEnv;
  if (host) {
    const bare = host.replace(/^www\./, "").split(":")[0];
    if (domainMap[bare]) return domainMap[bare];
    const guess = NICHES.find((n) => bare.includes(n));
    if (guess) return guess;
  }
  return "cases";
}

export const THEMES: Record<NicheKey, ThemeConfig> = {
  cases: {
    key: "cases",
    brand: "Casewin",
    tagline: "Cases that disappear into your day.",
    hero: {
      eyebrow: "Phone & laptop cases",
      title: "Protection without the bulk.",
      subtitle:
        "Slim shockproof cases and felt sleeves for the devices you actually carry. Free US shipping over $35.",
      cta: "Shop cases",
    },
    fonts: ["Inter:400,500,600,700"],
    sections: ["hero", "featured", "usps", "rail", "faq"],
    usps: [
      { title: "Drop-tested", body: "MIL-STD-810G corners on every hard case." },
      { title: "2–5 day US shipping", body: "Ships from our US warehouse." },
      { title: "30-day returns", body: "Wrong model? Send it back, no fuss." },
    ],
    faqs: [
      {
        q: "How do I know it fits my phone?",
        a: "Pick your exact model on the product page. If you're between models, message us before ordering.",
      },
      {
        q: "Does it work with wireless charging?",
        a: "Yes — all our cases are tested with Qi and MagSafe pucks.",
      },
      { q: "Where does it ship from?", a: "A warehouse in Delaware, USA. Most orders arrive in 2–5 business days." },
    ],
    collectionHandle: "cases",
  },
  eyewear: {
    key: "eyewear",
    brand: "Meridian Optic",
    tagline: "Frames for the light you live in.",
    hero: {
      eyebrow: "Sunglasses & blue-light",
      title: "See sharper. Look the part.",
      subtitle:
        "Polarized, impact-resistant lenses and clean everyday frames. UV400 on every pair.",
      cta: "Shop eyewear",
    },
    fonts: ["Playfair+Display:500,600,700", "Inter:400,500,600"],
    sections: ["hero", "featured", "usps", "faq", "rail"],
    usps: [
      { title: "UV400 + polarized", body: "Impact-resistant lenses, glare cut to a whisper." },
      { title: "Spring hinges", body: "Flex where your face is, not where it isn't." },
      { title: "Try for 30 days", body: "Not your look? Free returns within a month." },
    ],
    faqs: [
      { q: "Are these prescription?", a: "No — our frames are plano (non-prescription) sunglasses and blue-light filters." },
      { q: "Do the lenses block UV?", a: "Yes, every pair is UV400, blocking 100% of UVA/UVB." },
      { q: "What's the return window?", a: "30 days, unworn, in the original case." },
    ],
    collectionHandle: "eyewear",
  },
  toys: {
    key: "toys",
    brand: "Odd Shelf",
    tagline: "Desk toys, models and puzzles for grown-ups.",
    hero: {
      eyebrow: "Figures · models · puzzles",
      title: "Something good for the shelf.",
      subtitle:
        "Articulated figures, landscape puzzles and models — curated for collectors, not kids.",
      cta: "Shop the shelf",
    },
    fonts: ["Baloo+2:500,600,700", "Inter:400,500,600"],
    sections: ["hero", "rail", "featured", "usps", "faq"],
    usps: [
      { title: "Collector-grade", body: "Adult collectibles — not intended for children under 14." },
      { title: "Ships protected", body: "Double-boxed so corners survive the trip." },
      { title: "Easy returns", body: "30 days if it's not what you hoped." },
    ],
    faqs: [
      { q: "Are these safe for kids?", a: "These are adult collectibles and may contain small parts. Not for children under 14." },
      { q: "How long is delivery?", a: "2–7 business days within the US depending on the item." },
      { q: "Do puzzles come with a poster?", a: "Yes, every 1000-piece puzzle includes a reference sheet." },
    ],
    collectionHandle: "toys",
  },
};

export function themeFor(host?: string | null): ThemeConfig {
  return THEMES[resolveNiche(host)];
}
