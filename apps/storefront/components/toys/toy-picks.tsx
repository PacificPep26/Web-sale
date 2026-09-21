"use client"

import { useState, type ReactNode } from "react"

export function ToyPicks({ kids, collectors }: { kids: ReactNode; collectors: ReactNode }) {
  const [tab, setTab] = useState("kids")
  return <><div className="pp-tabs" aria-label="Featured audience">{["kids", "collectors"].map(t => <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>{t === "kids" ? "Kids & Family" : "Collectors 14+"}</button>)}</div><div>{tab === "kids" ? kids : collectors}</div></>
}
