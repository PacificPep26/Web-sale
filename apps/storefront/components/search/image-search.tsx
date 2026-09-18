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

  const [dragOver, setDragOver] = useState(false)
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
        method: "POST", body: data, signal: controller.current.signal,
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
    <section id="image-search" aria-labelledby="image-search-heading" className="mt-8 scroll-mt-24">
      <div className="mx-auto max-w-xl border border-token p-6 text-center md:p-8">
        <svg className="mx-auto mb-3" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
          <path d="M3 7h4l2-3h6l2 3h4v13H3z" /><circle cx="12" cy="13" r="4" />
        </svg>
        <h2 id="image-search-heading" className="text-2xl">Find it with a photo</h2>
        <p className="mt-3 text-sm text-muted">Upload a product photo or screenshot. We’ll look for matching products in our collection.</p>
        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const dropped = e.dataTransfer.files?.[0]
            if (dropped) selectFile(dropped)
          }}
          className={`mt-5 block cursor-pointer border border-dashed p-5 text-sm transition-colors ${
            dragOver ? "border-stone-900 bg-stone-50" : "border-token hover:border-stone-400"
          }`}
        >
          <span className="font-medium">Choose a photo or drag & drop here</span>
          <input
            ref={fileInputRef}
            id="photo-search-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Choose a product photo"
            className="mt-3 block w-full text-xs file:mr-3 file:border-0 file:bg-stone-100 file:px-3 file:py-2"
            onChange={event => selectFile(event.target.files?.[0])}
          />
          <span className="mt-3 block text-xs text-muted">JPG, PNG or WebP · Up to 5 MB</span>
        </label>
        {preview && (
          <div className="mx-auto mt-5">
            <div className="relative mx-auto h-44 w-44 border border-token bg-white">
              <Image src={preview} alt="Your uploaded product photo" fill unoptimized className="object-contain p-2" />
            </div>
            <button
              type="button"
              onClick={() => selectFile(undefined)}
              className="mt-2 text-xs text-muted underline hover:text-foreground"
            >
              ✕ Remove photo
            </button>
          </div>
        )}
        <p className="mt-4 text-xs text-muted">Your image is sent to our AI provider to find matches. AI suggestions may differ from the exact model.</p>
        <button
          type="button"
          disabled={!file || busy}
          onClick={search}
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 bg-stone-900 px-6 py-3 text-sm !text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? (
            <>
              <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span>Looking for your product…</span>
            </>
          ) : (
            "Search by photo"
          )}
        </button>
        <div role="status" aria-live="polite" className="mt-3 text-sm">{busy ? "Comparing your photo with our collection. This may take a moment." : ""}</div>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      </div>
      {result && <div className="mt-10" aria-live="polite">
        <h2 className="text-center text-2xl">{result.products.length ? "Possible matches" : "No confident match found"}</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted">{result.description}</p>
        {result.products.length > 0 && <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3">
          {result.products.map(product => <Link key={product.id} href={`/products/${product.handle}`} className="text-center">
            <div className="relative aspect-square border border-token bg-card">
              {product.thumbnail && <Image src={product.thumbnail} alt={product.title} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-contain p-4" />}
            </div>
            <h3 className="mt-3 text-sm">{product.title}</h3>
            <span className="mt-2 inline-block text-xs underline">View product</span>
          </Link>)}
        </div>}
      </div>}
      {(result || error) && <WhatsappHelp />}
    </section>
  )
}
