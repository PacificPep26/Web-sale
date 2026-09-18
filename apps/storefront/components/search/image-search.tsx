"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import type { ImageSearchResult } from "@/lib/image-search-types"
import { WhatsappHelp } from "./whatsapp-help"

const maxBytes = 5 * 1024 * 1024
const acceptedTypes = ["image/jpeg", "image/png", "image/webp"]

export function ImageSearch() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<ImageSearchResult | null>(null)
  const controller = useRef<AbortController | null>(null)
  const generation = useRef(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  useEffect(() => () => controller.current?.abort(), [])

  function selectFile(next?: File) {
    generation.current += 1
    controller.current?.abort()
    setBusy(false)
    setResult(null)
    setError("")
    setFile(null)
    setPreview("")
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (!next) return
    if (!acceptedTypes.includes(next.type)) {
      setError("Please choose a JPG, PNG or WebP image.")
      return
    }
    if (next.size > maxBytes || next.size === 0) {
      setError("Please choose an image smaller than 5 MB.")
      return
    }
    setFile(next)
    setPreview(URL.createObjectURL(next))
  }

  async function search() {
    if (!file || busy) return
    const current = ++generation.current
    controller.current?.abort()
    controller.current = new AbortController()
    setBusy(true)
    setError("")
    setResult(null)
    try {
      const data = new FormData()
      data.set("image", file)
      const response = await fetch("/api/image-search", {
        method: "POST",
        body: data,
        signal: controller.current.signal,
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "Image search is unavailable. Please try again.")
      if (current === generation.current) setResult(body)
    } catch (cause) {
      if (current === generation.current && !(cause instanceof DOMException && cause.name === "AbortError")) {
        setError(cause instanceof Error ? cause.message : "Image search is unavailable. Please try again.")
      }
    } finally {
      if (current === generation.current) setBusy(false)
    }
  }

  return (
    <div id="image-search-container" className="mx-auto max-w-xl">
      {/* Hidden file input triggered by camera button in search bar */}
      <input
        ref={fileInputRef}
        id="photo-search-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Choose a product photo"
        className="hidden"
        onChange={event => selectFile(event.target.files?.[0])}
      />

      {/* Sleek card appears ONLY when user selects a photo */}
      {(file || preview || busy || error || result) && (
        <div className="mt-6">
          <div className="flex items-center justify-between gap-3 border border-token bg-card p-3 text-sm">
            <div className="flex items-center gap-3 min-w-0">
              {preview && (
                <div className="relative h-12 w-12 shrink-0 border border-token bg-white">
                  <Image
                    src={preview}
                    alt="Your uploaded product photo"
                    fill
                    unoptimized
                    className="object-contain p-1"
                  />
                </div>
              )}
              <div className="text-left min-w-0">
                <p className="truncate text-xs font-medium text-foreground">{file?.name || "Product photo"}</p>
                {busy ? (
                  <p className="flex items-center gap-1.5 text-xs text-muted">
                    <svg className="h-3 w-3 animate-spin text-foreground" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <span>Analyzing photo with AI…</span>
                  </p>
                ) : (
                  <p className="text-xs text-muted">Photo ready</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={!file || busy}
                onClick={search}
                className="bg-stone-900 px-4 py-2 text-xs font-medium !text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? "Searching…" : "Search by photo"}
              </button>
              <button
                type="button"
                onClick={() => selectFile(undefined)}
                aria-label="Remove photo"
                className="p-1.5 text-muted hover:text-foreground text-xs"
                title="Remove photo"
              >
                ✕
              </button>
            </div>
          </div>

          <div role="status" aria-live="polite" className="mt-2 text-center text-xs text-muted">
            {busy ? "Comparing your photo with our collection. This may take a moment." : ""}
          </div>
          {error && <p role="alert" className="mt-3 text-center text-sm text-red-700">{error}</p>}

          {result && (
            <div className="mt-8" aria-live="polite">
              <h2 className="text-center text-xl font-medium tracking-tight">
                {result.products.length ? "Possible matches" : "No confident match found"}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-center text-xs text-muted">{result.description}</p>
              {result.products.length > 0 && (
                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
                  {result.products.map(product => (
                    <Link key={product.id} href={`/products/${product.handle}`} className="group text-center">
                      <div className="relative aspect-square border border-token bg-card transition-colors group-hover:border-stone-900">
                        {product.thumbnail && (
                          <Image
                            src={product.thumbnail}
                            alt={product.title}
                            fill
                            sizes="(max-width: 768px) 50vw, 33vw"
                            className="object-contain p-4"
                          />
                        )}
                      </div>
                      <h3 className="mt-2 text-sm">{product.title}</h3>
                      <span className="mt-1 inline-block text-xs text-muted underline group-hover:text-foreground">
                        View product
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {(result || error) && <WhatsappHelp />}
        </div>
      )}
    </div>
  )
}
