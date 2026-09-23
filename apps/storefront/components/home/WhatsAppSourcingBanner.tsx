"use client";

import React from "react";

interface WhatsAppSourcingBannerProps {
  phoneNumber?: string;
  className?: string;
}

export function WhatsAppSourcingBanner({
  phoneNumber = "19728181899",
  className = "",
}: WhatsAppSourcingBannerProps) {
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    "Hi! I'm looking for a specific brand, make, or model. Can you help me source it?"
  )}`;

  return (
    <section className={`w-full py-12 md:py-16 px-4 ${className}`}>
      <div className="max-w-5xl mx-auto rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-black p-8 md:p-12 text-white shadow-2xl border border-zinc-700/50 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Background Decorative Element */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Text Content */}
        <div className="space-y-3 z-10 text-center md:text-left max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wider uppercase border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            VIP Custom Sourcing Service
          </div>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white leading-tight">
            Looking for a specific <span className="text-emerald-400">Brand, Make or Model</span>?
          </h2>
          <p className="text-zinc-300 text-sm md:text-base leading-relaxed">
            We can source <strong className="text-white">any brand, rare edition, or custom model</strong> directly from our global supplier network. Send us a message on WhatsApp with your request!
          </p>
        </div>

        {/* WhatsApp Action Button */}
        <div className="z-10 flex flex-col items-center gap-2 shrink-0">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center gap-3 px-7 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-base shadow-lg shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg
              className="w-6 h-6 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
            <span>Source Any Model on WhatsApp</span>
          </a>
          <span className="text-[11px] text-zinc-400">
            ⚡ Direct response from our sourcing team
          </span>
        </div>

      </div>
    </section>
  );
}
