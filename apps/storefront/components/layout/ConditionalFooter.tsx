"use client";

import { usePathname } from "next/navigation";
import { EyewearFooter } from "./EyewearFooter";
import { Footer } from "./Footer";

// The homepage is meant to be just the full-height brand hero banner — no
// footer below it. Every other page keeps the normal footer.
export function ConditionalFooter({ eyewear = false }: { eyewear?: boolean }) {
  const pathname = usePathname();
  if (eyewear) return <EyewearFooter />;
  if (pathname === "/") return null;
  return <Footer />;
}
