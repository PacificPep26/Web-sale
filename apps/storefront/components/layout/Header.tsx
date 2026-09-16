import Link from "next/link";
import { getCart } from "@/lib/data/cart";
import { THEMES } from "@/themes/registry";
import { NICHE } from "@/lib/config";
import { MobileNav } from "./MobileNav";

export async function Header() {
  const theme = THEMES[NICHE];
  const cart = await getCart();
  const count = cart?.items?.reduce((n, i) => n + (i.quantity ?? 0), 0) ?? 0;

  return (
    <header className="sticky top-0 z-40 border-b border-token bg-base">
      <div className="container-page">
        {/* single row: [logo] [search] [nav links] ····· [account] [cart] */}
        <div className="flex h-16 items-center gap-6">
          <MobileNav brand={theme.brand} nav={theme.nav} cartCount={count} />

          <Link href="/" className="wordmark shrink-0 text-xl md:text-2xl">
            {theme.brand}
          </Link>

          <Link
            href="/search"
            aria-label="Search"
            className="hidden h-9 w-9 shrink-0 items-center justify-center md:flex"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {theme.nav.map((n) => (
              <Link key={n.label} href={n.href} className="nav-link">
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <span className="hidden text-[0.72rem] uppercase tracking-[0.14em] text-muted lg:block">
              United States
            </span>
            <span
              aria-hidden
              className="hidden h-9 w-9 items-center justify-center opacity-60 md:flex"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M5 20c1.3-3.6 4-5.4 7-5.4s5.7 1.8 7 5.4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <Link
              href="/search"
              aria-label="Search"
              className="flex h-9 w-9 items-center justify-center md:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </Link>
            <Link
              href="/cart"
              aria-label={`Bag${count > 0 ? `, ${count} item${count > 1 ? "s" : ""}` : ", empty"}`}
              className="relative flex h-9 w-9 items-center justify-center"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M6 8h12l-1 12H7L6 8z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 8V6a3 3 0 0 1 6 0v2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              {count > 0 && (
                <span
                  className="absolute -right-1.5 -top-1 min-w-4 rounded-full px-1 text-center text-[0.62rem] font-semibold leading-4"
                  style={{ background: "var(--color-accent)", color: "var(--color-accent-fg)" }}
                >
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
