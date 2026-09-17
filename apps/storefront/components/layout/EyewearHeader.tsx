"use client"

import { BrandLogo } from "./BrandLogo"
import Link from "next/link"
import { useRef } from "react"
import type { ThemeConfig } from "@/themes/registry"

export function EyewearHeader({ brand, brands, count }: { brand: string; brands: ThemeConfig["brands"]; count: number }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const close = () => dialog.current?.close()
  return (
    <header className="lux-header">
      <div className="lux-header-row">
        <Link href="/" className="lux-wordmark" aria-label={`${brand} home`}><BrandLogo /></Link>
        <nav className="lux-desktop-nav" aria-label="Main navigation"><Link href="/collections/eyewear">All eyewear</Link><Link href="/#designers">Designers</Link><Link href="/pages/about">Our world</Link></nav>
        <div className="lux-header-actions">
          <Link href="/search" aria-label="Search eyewear"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.3"/><path d="m16 16 5 5" stroke="currentColor" strokeWidth="1.3"/></svg></Link>
          <Link href="/cart" aria-label={`Shopping bag, ${count} items`}><svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7ZM9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.3"/></svg>{count > 0 && <span>{count}</span>}</Link>
          <button onClick={() => dialog.current?.showModal()} aria-label="Open menu"><svg width="23" height="20" viewBox="0 0 24 20" fill="none" aria-hidden="true"><path d="M2 6h20M2 14h20" stroke="currentColor" strokeWidth="1.3"/></svg></button>
        </div>
      </div>
      <dialog ref={dialog} className="lux-menu" onClick={(event) => { if (event.target === event.currentTarget) close() }}>
        <div className="lux-menu-inner"><div className="lux-menu-top"><BrandLogo /><button onClick={close} aria-label="Close menu">✕</button></div>
          <nav aria-label="Designer navigation"><Link href="/collections/eyewear" onClick={close} className="lux-menu-all">Explore all eyewear</Link><p className="lux-kicker">OUR DESIGNERS</p>{brands?.map(b => <Link key={b.label} href={b.href} onClick={close}>{b.label}</Link>)}</nav>
          <div className="lux-menu-bottom"><Link href="/pages/about" onClick={close}>About LuxeShade</Link><Link href="/pages/shipping" onClick={close}>Shipping & returns</Link></div>
        </div>
      </dialog>
    </header>
  )
}
