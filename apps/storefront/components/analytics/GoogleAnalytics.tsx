"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect } from "react"

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function GoogleAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    window.gtag?.("event", "page_view", {
      page_location: window.location.href,
      page_path: `${pathname}${searchParams.size ? `?${searchParams}` : ""}`,
    })
  }, [pathname, searchParams])

  return null
}
