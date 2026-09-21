import type { NextConfig } from "next";
import productPhotos from "./lib/product-photos.json"
import photoAliases from "./lib/product-photo-aliases.json"

const backend = new URL(
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(process.env.NODE_ENV === "development" && process.env.SITE === "toys" ? { distDir: ".next/playpuff" } : {}),
  async redirects() {
    return [...Object.entries(productPhotos), ...Object.entries(photoAliases).map(([alias, handle]) =>
      [alias, productPhotos[handle as keyof typeof productPhotos]] as const
    )].flatMap(([handle, photo]) => [
      { source: `/images/sunglasses/${handle}.jpg`, destination: photo.src, permanent: true },
      ...(handle.startsWith("sun-jacques-marie-mage-") ? [{
        source: `/product-previews/${handle.slice("sun-jacques-marie-mage-".length)}.png`,
        destination: photo.src,
        permanent: true,
      }] : []),
    ])
  },
  // standalone output is only for the Docker image (Railway); Vercel's
  // builder has its own packaging and breaks route resolution if this is set
  ...(process.env.DOCKER_BUILD ? { output: "standalone" as const } : {}),
  // we keep our own AGENTS.md at the repo root
  agentRules: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.medusajs.com" },
      { protocol: "https", hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com" },
      {
        protocol: backend.protocol.replace(":", "") as "http" | "https",
        hostname: backend.hostname,
        port: backend.port || undefined,
      },
      // MinIO / R2 media
      { protocol: "http", hostname: "localhost", port: "9002" },
    ],
  },
};

export default nextConfig;
