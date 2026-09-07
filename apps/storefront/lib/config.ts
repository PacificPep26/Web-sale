import { resolveNiche, type NicheKey } from "@/themes/registry";

export const NICHE: NicheKey = resolveNiche(process.env.SITE);

export const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "http://localhost:9000";

const KEY_BY_NICHE: Record<NicheKey, string | undefined> = {
  cases: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY_CASES,
  eyewear: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY_EYEWEAR,
  toys: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY_TOYS,
  watches: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY_WATCHES,
};

export const PUBLISHABLE_KEY = KEY_BY_NICHE[NICHE] ?? "";

export const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us";

export const STRIPE_PK = process.env.NEXT_PUBLIC_STRIPE_PK || "";

export const CART_COOKIE = "_medusa_cart_id";
