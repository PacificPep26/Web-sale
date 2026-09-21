"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { AGE_GROUPS } from "@dtc/shared-types/playpuff"
import { ToyLogo } from "./toy-logo"

export function ToyFooter() {
  const path = usePathname()
  if (path.startsWith("/checkout")) return <footer className="pp-checkout-footer">PlayPuff · <Link href="/pages/privacy">Privacy</Link> · <Link href="/pages/terms">Terms</Link></footer>
  return <footer className="pp-footer"><div className="pp-wrap"><div className="pp-footer-grid"><div><ToyLogo /><p>A little play. A whole lot of joy.</p><span className="pp-footer-stars" aria-hidden="true">✦ <i>✦</i> ✦</span></div><nav aria-label="Shop"><h2>Find your happy</h2><Link href="/collections/toys">All toys</Link><Link href="/collections/toys?audience=kids">Kids & Family</Link><Link href="/collections/toys?audience=collectors">Collectors 14+</Link><Link href="/pages/about">Our story</Link></nav><nav aria-label="Shop by age"><h2>Every age. Every stage.</h2>{AGE_GROUPS.map(g => <Link key={g.id} href={`/collections/toys?age=${g.id}`}>{g.name} · {g.label}</Link>)}</nav><nav aria-label="Help"><h2>A little help</h2><Link href="/pages/shipping">Shipping</Link><Link href="/pages/returns">Returns</Link><Link href="/pages/privacy">Privacy</Link><Link href="/pages/terms">Terms</Link></nav></div><div className="pp-footer-bottom"><span>© {new Date().getFullYear()} PlayPuff</span><span>United States · USD</span></div></div></footer>
  return <footer className="pp-footer"><div className="pp-wrap"><div className="pp-footer-grid"><div><ToyLogo /><p>A little play. A whole lot of joy.</p><span className="pp-footer-stars" aria-hidden="true">✦ <i>✦</i> ✦</span></div><nav aria-label="Shop"><h2>Find your happy</h2><Link href="/collections/toys">All toys</Link><Link href="/collections/toys?audience=kids">Kids & Family</Link><Link href="/collections/toys?audience=collectors">Collectors 14+</Link><Link href="/pages/about">Our story</Link></nav><nav aria-label="Shop by age"><h2>Every age. Every stage.</h2>{AGE_GROUPS.map(g => <Link key={g.id} href={`/collections/toys?age=${g.id}`}>{g.name} · {g.label}</Link>)}</nav><nav aria-label="Help"><h2>A little help</h2><Link href="/pages/shipping">Shipping</Link><Link href="/pages/returns">Returns</Link><Link href="/pages/contact">Contact us</Link><Link href="/pages/privacy">Privacy</Link><Link href="/pages/terms">Terms</Link></nav></div><div className="pp-footer-bottom"><span>© {new Date().getFullYear()} PlayPuff</span><span>United States · USD</span></div></div></footer>
}
