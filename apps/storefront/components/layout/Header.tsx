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
        {/* top row */}
        <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex items-center gap-4">
            <MobileNav
              brand={theme.brand}
              nav={theme.nav}
              cartCount={count}
            />
            <span className="hidden text-[0.72rem] uppercase tracking-[0.14em] text-muted lg:block">
              United States
            </span>
          </div>

          <Link href="/" className="wordmark text-xl md:text-2xl">
            {theme.brand}
          </Link>

          <nav className="flex items-center justify-end gap-4">
            <Link href="/search" aria-label="Search" className="flex h-9 w-9 items-center justify-center">
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
          </nav>
        </div>

        {/* desktop nav row */}
        <nav className="hidden justify-center gap-9 pb-3 md:flex">
          {theme.nav.map((n) => (
            <Link key={n.label} href={n.href} className="nav-link">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
