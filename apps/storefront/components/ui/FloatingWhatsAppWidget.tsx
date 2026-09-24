"use client";

import React from "react";

interface FloatingWhatsAppWidgetProps {
  phoneNumber?: string;
}

export function FloatingWhatsAppWidget({
  phoneNumber = "84918056881",
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
        className="flex items-center gap-3 rounded-full border border-black bg-white px-4.5 py-2.5 text-[11px] font-normal tracking-normal text-black transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
        style={{ fontFamily: "var(--font-body)" }}
      >
        <span>Don&apos;t see what you need?</span>
        <span className="border-b border-current pb-0.5 font-medium">
          Contact now
        </span>
      </a>
    </div>
  );
}
