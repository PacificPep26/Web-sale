import type { NextConfig } from "next";

const backend = new URL(
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
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
