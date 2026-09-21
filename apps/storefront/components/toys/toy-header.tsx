"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRef } from "react"
import { AGE_GROUPS } from "@dtc/shared-types/playpuff"
import { ToyLogo } from "./toy-logo"

const links = [
  ["Shop All", "/collections/toys"], ["Kids & Family", "/collections/toys?audience=kids"],
  ["Collectors 14+", "/collections/toys?audience=collectors"], ["About", "/pages/about"],
]

export function ToyHeader({ count }: { count: number }) {
  const menu = useRef<HTMLDialogElement>(null)
  const pathname = usePathname()
  if (pathname.startsWith("/checkout")) return <header className="pp-checkout-header pp-wrap"><ToyLogo /><Link href="/cart">Back to cart</Link></header>
  return <>
    <div className="pp-announcement">Little discoveries. Big imaginations. <span>Welcome to PlayPuff.</span></div>
    <header className="pp-header">
      <div className="pp-wrap pp-header-row">
        <ToyLogo />
        <nav className="pp-desktop-nav" aria-label="Main navigation">
          {links.slice(0, 3).map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
          <details className="pp-age-menu"><summary>Shop by Age <span aria-hidden="true">⌄</span></summary><div>{AGE_GROUPS.map(g => <Link href={`/collections/toys?age=${g.id}`} key={g.id}>{g.name}<small>{g.label}</small></Link>)}</div></details>
          <Link href="/pages/about">About</Link>
        </nav>
        <div className="pp-header-actions">
          <Link href="/search" aria-label="Search toys"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/></svg></Link>
          <Link href="/cart" aria-label={`Shopping bag, ${count} items`}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7ZM9 8V6a3 3 0 0 1 6 0v2"/></svg>{count > 0 && <span className="pp-count">{count}</span>}</Link>
          <button className="pp-menu-button" aria-label="Open menu" onClick={() => menu.current?.showModal()}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>
        </div>
      </div>
      <dialog ref={menu} className="pp-menu" aria-label="Navigation"><div className="pp-menu-top"><ToyLogo /><button aria-label="Close menu" onClick={() => menu.current?.close()}>×</button></div><nav>{links.map(([label, href]) => <Link key={href} href={href} onClick={() => menu.current?.close()}>{label}</Link>)}<p>Shop by Age</p>{AGE_GROUPS.map(g => <Link key={g.id} href={`/collections/toys?age=${g.id}`} onClick={() => menu.current?.close()}>{g.name} <small>{g.label}</small></Link>)}</nav></dialog>
    </header>
  </>
}
