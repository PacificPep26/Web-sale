"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

type NavItem = { label: string; href: string };

export function MobileNav({
  brand,
  nav,
  cartCount,
}: {
  brand: string;
  nav: NavItem[];
  cartCount: number;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="-ml-2 flex h-10 w-10 items-center justify-center"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute left-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-base p-6">
            <div className="flex items-center justify-between border-b border-token pb-4">
              <span className="wordmark text-lg">{brand}</span>
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="-mr-2 flex h-10 w-10 items-center justify-center"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="mt-6 flex flex-col">
              <Link href="/search" className="nav-link border-b border-token py-4">
                Search
              </Link>
              {nav.map((n) => (
                <Link
                  key={n.label}
                  href={n.href}
                  className="nav-link border-b border-token py-4"
                >
                  {n.label}
                </Link>
              ))}
              <Link href="/cart" className="nav-link border-b border-token py-4">
                Bag{cartCount > 0 ? ` (${cartCount})` : ""}
              </Link>
            </div>
            <div className="mt-auto flex flex-col gap-3 pt-6 text-[0.72rem] uppercase tracking-[0.14em] text-muted">
              <Link href="/pages/shipping">Shipping</Link>
              <Link href="/pages/returns">Returns</Link>
              <Link href="/pages/terms">Terms</Link>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
