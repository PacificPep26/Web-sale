"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

// The homepage is meant to be just the full-height brand hero banner — no
// footer below it. Every other page keeps the normal footer.
export function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <Footer />;
}
