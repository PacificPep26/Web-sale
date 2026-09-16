"use client";

import { useEffect, useState } from "react";

const KEY = "wishlist";

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function WishlistButton({ id, className }: { id: string; className?: string }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOn(read().includes(id));
  }, [id]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const list = read();
      const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      localStorage.setItem(KEY, JSON.stringify(next));
      setOn(next.includes(id));
    } catch {
      /* private mode — ignore */
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={on ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={on}
      className={className}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden
        fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4">
        <path d="M12 21s-7.5-4.6-10-9.3C.6 8.9 2 5.5 5.3 5.1c2-.2 3.7 1 4.7 2.5C11 6.1 12.7 4.9 14.7 5.1 18 5.5 19.4 8.9 22 11.7 19.5 16.4 12 21 12 21z" />
      </svg>
    </button>
  );
}
