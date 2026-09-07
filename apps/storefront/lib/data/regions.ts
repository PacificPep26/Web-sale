import { unstable_cache } from "next/cache";
import { sdk } from "@/lib/medusa";
import { DEFAULT_REGION } from "@/lib/config";
import type { HttpTypes } from "@medusajs/types";

export const getRegion = unstable_cache(
  async (): Promise<HttpTypes.StoreRegion> => {
    const { regions } = await sdk.store.region.list();
    const byCountry = regions.find((r) =>
      r.countries?.some((c) => c.iso_2 === DEFAULT_REGION)
    );
    const region = byCountry ?? regions[0];
    if (!region) throw new Error("No region configured in Medusa");
    return region;
  },
  ["region"],
  { revalidate: 3600, tags: ["regions"] }
);
