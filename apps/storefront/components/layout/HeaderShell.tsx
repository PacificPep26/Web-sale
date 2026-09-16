"use client";

import { usePathname } from "next/navigation";

// On the homepage the header floats transparently over the hero photos —
// no background, no border, white text/icons so it stays readable over any
// image — but everywhere else it's a normal solid sticky bar. Isolated into
// its own client component because usePathname needs one, while Header
// itself stays an async Server Component (it fetches the cart).
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header
      className={
        isHome
          ? "absolute inset-x-0 top-0 z-40 [&_.nav-link]:text-white [&_.wordmark]:text-white [&_.text-muted]:text-white/80 [&_svg]:text-white"
          : "sticky top-0 z-40 border-b border-token bg-base"
      }
    >
      {children}
    </header>
  );
}
