import { whatsappSearchUrl } from "@/lib/whatsapp"

export function WhatsappHelp({ query }: { query?: string }) {
  return (
    <div className="mt-8 border border-token bg-card p-6 text-center">
      <h3 className="text-lg">Still looking for your perfect match?</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Send us your product photo on WhatsApp. Our team can help you find it.
      </p>
      <a href={whatsappSearchUrl(query)} target="_blank" rel="noopener noreferrer"
        className="mt-5 inline-flex min-h-12 items-center justify-center bg-[#075e54] px-6 py-3 text-sm font-medium !text-white">
        Ask us on WhatsApp
      </a>
      <p className="mt-3 text-xs text-muted">Please attach your photo in WhatsApp after opening the chat.</p>
    </div>
  )
}
