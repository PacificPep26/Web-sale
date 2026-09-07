import Link from "next/link";
import { THEMES } from "@/themes/registry";
import { NICHE } from "@/lib/config";

export function Footer() {
  const theme = THEMES[NICHE];
  return (
    <footer className="mt-auto border-t border-token surface">
      <div className="container-page flex flex-col gap-2 py-10 text-sm text-muted md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()} {theme.brand}. {theme.tagline}
        </p>
        <nav className="flex gap-4">
          <Link href="/pages/shipping">Shipping</Link>
          <Link href="/pages/returns">Returns</Link>
          <Link href="/pages/privacy">Privacy</Link>
          <Link href="/pages/terms">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
