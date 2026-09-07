import Link from "next/link";
import { THEMES } from "@/themes/registry";
import { NICHE } from "@/lib/config";

export function Footer() {
  const theme = THEMES[NICHE];
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-token bg-base">
      <div className="container-page grid gap-10 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <span className="wordmark text-lg">{theme.brand}</span>
          <p className="mt-3 max-w-xs text-sm text-muted">{theme.tagline}</p>
        </div>

        <nav className="flex flex-col gap-2 text-sm">
          <p className="eyebrow mb-1">Shop</p>
          {theme.nav.map((n) => (
            <Link key={n.label} href={n.href} className="text-muted hover:text-accent">
              {n.label}
            </Link>
          ))}
        </nav>

        <nav className="flex flex-col gap-2 text-sm">
          <p className="eyebrow mb-1">Help</p>
          <Link href="/pages/shipping" className="text-muted hover:text-accent">Shipping</Link>
          <Link href="/pages/returns" className="text-muted hover:text-accent">Returns</Link>
          <Link href="/pages/privacy" className="text-muted hover:text-accent">Privacy</Link>
          <Link href="/pages/terms" className="text-muted hover:text-accent">Terms</Link>
        </nav>

        <div>
          <p className="eyebrow mb-2">Newsletter</p>
          <p className="text-sm text-muted">
            New arrivals and the occasional note. No noise.
          </p>
          <form className="mt-3 flex border-b border-token" action="/">
            <input
              type="email"
              required
              placeholder="Email address"
              className="w-full bg-transparent py-2 text-sm outline-none"
            />
            <button type="submit" className="nav-link px-2">Join</button>
          </form>
        </div>
      </div>

      <div className="border-t border-token">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>© {year} {theme.brand}. All rights reserved.</p>
          <p className="uppercase tracking-[0.14em]">United States · USD</p>
        </div>
      </div>
    </footer>
  );
}
