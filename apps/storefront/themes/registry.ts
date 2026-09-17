export type NicheKey = "cases" | "eyewear" | "toys" | "watches";

export const NICHES: NicheKey[] = ["cases", "eyewear", "toys", "watches"];

export type NavItem = { label: string; href: string };

export type UspIcon = "shield" | "sun" | "hinge" | "truck" | "return" | "warranty";

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
  /** additional google font families loaded for one-off uses (e.g. a per-brand wordmark) */
  extraFonts?: string[];
  /** homepage section order */
  sections: Array<"hero" | "categories" | "brands" | "featured" | "editorial" | "usps" | "rail" | "faq">;
  /** "shop by category" tiles shown right under the hero */
  categories: { label: string; image: string; href: string }[];
  /** optional "shop by brand" full-width row banner — click a brand, see only its products */
  brands?: { label: string; image: string; href: string; font: string; italic?: boolean }[];
  /** a secondary editorial banner on the home page */
  editorial: { image: string; kicker: string; title: string; body: string; cta: string; href: string };
  usps: { title: string; body: string; icon: UspIcon }[];
  faqs: { q: string; a: string }[];
  /** category handle used as the "shop all" collection */
  collectionHandle: string;
};

const domainMap: Record<string, NicheKey> = {
  "cases.com": "cases",
  "eyewear.com": "eyewear",
  "toys.com": "toys",
  "watches.com": "watches",
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
        "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=2000&q=80",
      align: "left",
    },
    nav: [
      { label: "Phone Cases", href: "/collections/cases" },
      { label: "Laptop Sleeves", href: "/collections/cases" },
      { label: "New", href: "/collections/cases" },
      { label: "About", href: "/pages/about" },
    ],
    fonts: ["Cormorant+Garamond:500,600", "Inter:300,400,500,600"],
    sections: ["hero", "categories", "usps", "featured", "editorial", "rail", "faq"],
    categories: [
      {
        label: "Phone Cases",
        image: "https://images.unsplash.com/photo-1601593346740-925612772716?w=900&q=80",
        href: "/collections/cases",
      },
      {
        label: "Laptop Sleeves",
        image: "https://images.unsplash.com/photo-1602080858428-57174f9431cf?w=900&q=80",
        href: "/collections/cases",
      },
      {
        label: "New In",
        image: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=900&q=80",
        href: "/collections/cases",
      },
    ],
    editorial: {
      image:
        "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1600&q=80",
      kicker: "Materials",
      title: "Aramid fibre, felt, and nothing you don't need",
      body: "Every case is built from a short list of materials chosen for grip, weight and the way they age. No logos the size of your thumb.",
      cta: "Read the material story",
      href: "/pages/about",
    },
    usps: [
      { title: "Drop-tested", body: "MIL-STD-810G corners on every hard case.", icon: "shield" },
      { title: "2–5 day US shipping", body: "Dispatched from our Delaware warehouse.", icon: "truck" },
      { title: "30-day returns", body: "Wrong model? Send it back, no questions.", icon: "return" },
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
    brand: "LuxeShade",
    tagline: "Frames for the light you live in.",
    hero: {
      eyebrow: "Sun & Light",
      title: "See sharper. Look the part.",
      subtitle:
        "Polarised, impact-resistant lenses and clean everyday frames. UV400 on every pair.",
      cta: "Shop eyewear",
      image:
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=2000&q=80",
      align: "center",
    },
    nav: [
      { label: "Sunglasses", href: "/collections/eyewear" },
      { label: "Blue-Light", href: "/collections/eyewear" },
      { label: "New", href: "/collections/eyewear" },
      { label: "About", href: "/pages/about" },
    ],
    fonts: ["Noto+Serif:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400", "Be+Vietnam+Pro:wght@300;400;500;600"],
    extraFonts: [
      "Comfortaa:wght@700",
      "Montserrat:wght@800;900",
      "Playfair+Display:ital,wght@0,700;1,600",
      "Prata",
      "UnifrakturCook:wght@700",
    ],
    sections: ["brands"],
    categories: [
      {
        label: "Sunglasses",
        image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=900&q=80",
        href: "/collections/eyewear",
      },
      {
        label: "Blue-Light",
        image: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=900&q=80",
        href: "/collections/eyewear",
      },
      {
        label: "New In",
        image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=900&q=80",
        href: "/collections/eyewear",
      },
    ],
    brands: [
      { label: "Jacques Marie Mage", image: "/brand-hero/jacques-marie-mage-v4.jpg", href: "/collections/eyewear?brand=jacques-marie-mage", font: "'Noto Serif', serif" },
      { label: "Miu Miu", image: "/brand-hero/miu-miu-v3.jpg", href: "/collections/eyewear?brand=miu-miu", font: "'Comfortaa', sans-serif" },
      { label: "Fendi", image: "/brand-hero/fendi-v3.jpg", href: "/collections/eyewear?brand=fendi", font: "'Montserrat', sans-serif" },
      { label: "Gucci", image: "/brand-hero/gucci-v3.jpg", href: "/collections/eyewear?brand=gucci", font: "'Playfair Display', serif" },
      { label: "Cartier", image: "/brand-hero/cartier-v3.jpg", href: "/collections/eyewear?brand=cartier", font: "'Playfair Display', serif", italic: true },
      { label: "Tom Ford", image: "/brand-hero/tom-ford-v3.jpg", href: "/collections/eyewear?brand=tom-ford", font: "'Montserrat', sans-serif" },
      { label: "Prada", image: "/brand-hero/prada-v3.jpg", href: "/collections/eyewear?brand=prada", font: "'Prata', serif" },
      { label: "Chrome Hearts", image: "/brand-hero/chrome-hearts-v3.jpg", href: "/collections/eyewear?brand=chrome-hearts", font: "'UnifrakturCook', cursive" },
    ],
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
      { title: "UV400 + polarised", body: "100% UVA/UVB blocked on every pair.", icon: "sun" },
      { title: "Spring hinges", body: "Flex where your face is, not where it isn't.", icon: "hinge" },
      { title: "Try for 30 days", body: "Not your look? Free returns within a month.", icon: "return" },
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
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=2000&q=80",
      align: "left",
    },
    nav: [
      { label: "Figures", href: "/collections/toys" },
      { label: "Puzzles", href: "/collections/toys" },
      { label: "New", href: "/collections/toys" },
      { label: "About", href: "/pages/about" },
    ],
    fonts: ["Fraunces:500,600", "Inter:300,400,500,600"],
    sections: ["hero", "categories", "usps", "rail", "editorial", "featured", "faq"],
    categories: [
      {
        label: "Figures",
        image: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=900&q=80",
        href: "/collections/toys",
      },
      {
        label: "Puzzles",
        image: "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=900&q=80",
        href: "/collections/toys",
      },
      {
        label: "New In",
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80",
        href: "/collections/toys",
      },
    ],
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
      { title: "Collector-grade", body: "Adult collectibles — not for children under 14.", icon: "shield" },
      { title: "Ships protected", body: "Double-boxed so corners survive the trip.", icon: "truck" },
      { title: "Easy returns", body: "30 days if it's not what you hoped.", icon: "return" },
    ],
    faqs: [
      { q: "Are these safe for kids?", a: "These are adult collectibles and may contain small parts. Not for children under 14." },
      { q: "How long is delivery?", a: "2–7 business days within the US depending on the item." },
      { q: "Do puzzles come with a poster?", a: "Yes, every 1000-piece puzzle includes a reference sheet." },
    ],
    collectionHandle: "toys",
  },
  watches: {
    key: "watches",
    brand: "Kesten",
    tagline: "Mechanical and quartz watches, without the markup theatre.",
    hero: {
      eyebrow: "The Reference Collection",
      title: "Time, honestly priced",
      subtitle:
        "Automatic and quartz watches with sapphire crystal and 316L steel — chosen for the movement, not the marketing.",
      cta: "Explore the collection",
      image:
        "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=2000&q=80",
      align: "left",
    },
    nav: [
      { label: "Automatic", href: "/collections/watches" },
      { label: "Quartz", href: "/collections/watches" },
      { label: "New", href: "/collections/watches" },
      { label: "About", href: "/pages/about" },
    ],
    fonts: ["Cormorant+Garamond:500,600", "Inter:300,400,500,600"],
    sections: ["hero", "categories", "usps", "featured", "editorial", "rail", "faq"],
    categories: [
      {
        label: "Automatic",
        image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=900&q=80",
        href: "/collections/watches",
      },
      {
        label: "Quartz",
        image: "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=900&q=80",
        href: "/collections/watches",
      },
      {
        label: "New In",
        image: "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=900&q=80",
        href: "/collections/watches",
      },
    ],
    editorial: {
      image:
        "https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?w=1600&q=80",
      kicker: "The Movement",
      title: "Sapphire crystal, 100m water resistance, and a movement you can name",
      body: "Every reference lists its calibre, power reserve and lume. No marketing calibre names, no mystery.",
      cta: "How we pick a calibre",
      href: "/pages/about",
    },
    usps: [
      { title: "Sapphire crystal", body: "Scratch-resistant glass on every reference.", icon: "shield" },
      { title: "2-year movement warranty", body: "Serviced by our US watchmaker.", icon: "warranty" },
      { title: "30-day returns", body: "Unworn, in the full kit — send it back.", icon: "return" },
    ],
    faqs: [
      { q: "Are these automatic or quartz?", a: "Both — each product page states the calibre and whether it's automatic or quartz." },
      { q: "What's the water resistance?", a: "Most references are 100m (10 ATM); dress models are 30–50m. It's listed per product." },
      { q: "Do they come with a warranty?", a: "Yes, a 2-year movement warranty serviced in the US." },
    ],
    collectionHandle: "watches",
  },
};

export function themeFor(host?: string | null): ThemeConfig {
  return THEMES[resolveNiche(host)];
}
