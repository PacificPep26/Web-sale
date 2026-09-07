export type NicheKey = "cases" | "eyewear" | "toys";

export const NICHES: NicheKey[] = ["cases", "eyewear", "toys"];

export type NavItem = { label: string; href: string };

export type ThemeConfig = {
  key: NicheKey;
  brand: string;
  tagline: string;
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    cta: string;
    /** full-bleed hero image */
    image: string;
    /** align hero copy */
    align: "center" | "left";
  };
  /** curated top nav for this single-niche storefront */
  nav: NavItem[];
  /** google font families for --font-display / --font-body */
  fonts: string[];
  /** homepage section order */
  sections: Array<"hero" | "featured" | "editorial" | "usps" | "rail" | "faq">;
  /** a secondary editorial banner on the home page */
  editorial: { image: string; kicker: string; title: string; body: string; cta: string; href: string };
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
    tagline: "Considered protection for the things you carry.",
    hero: {
      eyebrow: "The Everyday Collection",
      title: "Protection, quietly done",
      subtitle:
        "Slim shockproof cases and felt sleeves, engineered to disappear into your day.",
      cta: "Explore the collection",
      image:
        "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=2000&q=80",
      align: "left",
    },
    nav: [
      { label: "Phone Cases", href: "/collections/cases" },
      { label: "Laptop Sleeves", href: "/collections/cases" },
      { label: "New", href: "/collections/cases" },
      { label: "About", href: "/pages/about" },
    ],
    fonts: ["Cormorant+Garamond:500,600", "Inter:300,400,500,600"],
    sections: ["hero", "featured", "editorial", "rail", "usps", "faq"],
    editorial: {
      image:
        "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1600&q=80",
      kicker: "Materials",
      title: "Aramid fibre, felt, and nothing you don't need",
      body: "Every case is built from a short list of materials chosen for grip, weight and the way they age. No logos the size of your thumb.",
      cta: "Read the material story",
      href: "/pages/about",
    },
    usps: [
      { title: "Drop-tested", body: "MIL-STD-810G corners on every hard case." },
      { title: "2–5 day US shipping", body: "Dispatched from our Delaware warehouse." },
      { title: "30-day returns", body: "Wrong model? Send it back, no questions." },
    ],
    faqs: [
      { q: "How do I know it fits my phone?", a: "Choose your exact model on the product page. Between models? Message us first." },
      { q: "Does it work with wireless charging?", a: "Yes — every case is tested with Qi and MagSafe." },
      { q: "Where does it ship from?", a: "A warehouse in Delaware, USA. Most orders arrive in 2–5 business days." },
    ],
    collectionHandle: "cases",
  },
  eyewear: {
    key: "eyewear",
    brand: "Meridian Optic",
    tagline: "Frames for the light you live in.",
    hero: {
      eyebrow: "Sun & Light",
      title: "See sharper. Look the part.",
      subtitle:
        "Polarised, impact-resistant lenses and clean everyday frames. UV400 on every pair.",
      cta: "Shop eyewear",
      image:
        "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=2000&q=80",
      align: "center",
    },
    nav: [
      { label: "Sunglasses", href: "/collections/eyewear" },
      { label: "Blue-Light", href: "/collections/eyewear" },
      { label: "New", href: "/collections/eyewear" },
      { label: "About", href: "/pages/about" },
    ],
    fonts: ["Playfair+Display:500,600,700", "Inter:300,400,500,600"],
    sections: ["hero", "featured", "editorial", "usps", "faq", "rail"],
    editorial: {
      image:
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=1600&q=80",
      kicker: "The Lens",
      title: "Polarised, UV400, and quietly durable",
      body: "Impact-resistant lenses that cut glare to a whisper, set in spring-hinged frames that flex where your face is.",
      cta: "How our lenses are made",
      href: "/pages/about",
    },
    usps: [
      { title: "UV400 + polarised", body: "100% UVA/UVB blocked on every pair." },
      { title: "Spring hinges", body: "Flex where your face is, not where it isn't." },
      { title: "Try for 30 days", body: "Not your look? Free returns within a month." },
    ],
    faqs: [
      { q: "Are these prescription?", a: "No — our frames are plano sunglasses and blue-light filters." },
      { q: "Do the lenses block UV?", a: "Yes, every pair is UV400." },
      { q: "What's the return window?", a: "30 days, unworn, in the original case." },
    ],
    collectionHandle: "eyewear",
  },
  toys: {
    key: "toys",
    brand: "Odd Shelf",
    tagline: "Objects for the desk, the shelf, the quiet ten minutes.",
    hero: {
      eyebrow: "For Grown-Ups",
      title: "Something good for the shelf",
      subtitle:
        "Articulated figures, landscape puzzles and models — curated for collectors, not kids.",
      cta: "Shop the shelf",
      image:
        "https://images.unsplash.com/photo-1516981879613-9f5da904015f?w=2000&q=80",
      align: "left",
    },
    nav: [
      { label: "Figures", href: "/collections/toys" },
      { label: "Puzzles", href: "/collections/toys" },
      { label: "New", href: "/collections/toys" },
      { label: "About", href: "/pages/about" },
    ],
    fonts: ["Fraunces:500,600", "Inter:300,400,500,600"],
    sections: ["hero", "rail", "editorial", "featured", "usps", "faq"],
    editorial: {
      image:
        "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=1600&q=80",
      kicker: "Curation",
      title: "Chosen one at a time, for adults",
      body: "Everything here is collector-grade and meant for people over fourteen. If it wouldn't earn a place on our own shelf, it isn't listed.",
      cta: "About Odd Shelf",
      href: "/pages/about",
    },
    usps: [
      { title: "Collector-grade", body: "Adult collectibles — not for children under 14." },
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
