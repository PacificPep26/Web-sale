"use client";

import React from "react";

interface FloatingWhatsAppWidgetProps {
  phoneNumber?: string;
}

export function FloatingWhatsAppWidget({
  phoneNumber = "19728181899",
}: FloatingWhatsAppWidgetProps) {
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    "Hi! Don't see what I need on the store. Can you help me order a specific model?"
  )}`;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact via WhatsApp"
        className="group flex items-center gap-3 bg-black text-white border border-zinc-700 px-4.5 py-2.5 rounded-full shadow-xl backdrop-blur-md transition-all hover:bg-zinc-900 hover:border-zinc-500 text-[11px] tracking-wide"
      >
        <span className="text-zinc-300">Don&apos;t see what you need?</span>
        <span className="text-white font-medium border-b border-white pb-0.5 tracking-wider uppercase text-[10px]">
          Contact now ↗
        </span>
      </a>
    </div>
  );
}
