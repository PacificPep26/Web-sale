"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

export function SearchField({
  initial = "",
  autoFocus = false,
  className,
}: {
  initial?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const v = ref.current?.value.trim();
        router.push(v ? `/search?q=${encodeURIComponent(v)}` : "/search");
      }}
    >
      <div className="flex items-center gap-2 border-b border-token pb-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          ref={ref}
          name="q"
          defaultValue={initial}
          autoFocus={autoFocus}
          placeholder="Search"
          className="w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--color-muted)]"
        />
        <button
          type="button"
          onClick={() => {
            const fileInput = document.getElementById("photo-search-input") as HTMLInputElement | null;
            if (fileInput) {
              fileInput.click();
            } else {
              router.push("/search#image-search");
            }
          }}
          className="text-muted hover:text-foreground transition-colors p-1"
          aria-label="Upload photo to search"
          title="Upload photo to search"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M3 7h4l2-3h6l2 3h4v13H3z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>
      </div>
    </form>
  );
}
