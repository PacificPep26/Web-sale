"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

export type TryonImage = {
  id: string;
  model: string;
  handle: string;
  pose: string;
  url: string;
};

const STORAGE_KEY = "tryon-review-flagged";

export function TryonReviewGrid({ images }: { images: TryonImage[] }) {
  const [flagged, setFlagged] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [query, setQuery] = useState("");
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...flagged]));
    } catch {
      // ignore
    }
  }, [flagged]);

  function toggle(id: string) {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return images.filter((im) => {
      if (onlyFlagged && !flagged.has(im.id)) return false;
      if (q && !im.handle.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [images, query, onlyFlagged, flagged]);

  const flaggedList = useMemo(
    () => images.filter((im) => flagged.has(im.id)),
    [images, flagged]
  );

  async function copyList() {
    const text = flaggedList
      .map((im) => `${im.model}/${im.handle}-${im.pose}.jpg`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text || "(không có ảnh nào bị đánh dấu)");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  function clearAll() {
    setFlagged(new Set());
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#111", color: "#eee", minHeight: "100vh" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "#1a1a1a",
          borderBottom: "1px solid #333",
          padding: "14px 20px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <strong style={{ fontSize: 15 }}>Try-on photo review</strong>
        <span style={{ fontSize: 13, color: "#999" }}>
          {images.length} ảnh · {flagged.size} đã đánh dấu lệch
        </span>
        <input
          placeholder="Lọc theo tên sản phẩm..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            background: "#000",
            border: "1px solid #444",
            color: "#eee",
            padding: "6px 10px",
            borderRadius: 4,
            fontSize: 13,
            minWidth: 220,
          }}
        />
        <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={onlyFlagged} onChange={(e) => setOnlyFlagged(e.target.checked)} />
          Chỉ hiện ảnh đã đánh dấu
        </label>
        <button
          onClick={copyList}
          disabled={flagged.size === 0}
          style={{
            marginLeft: "auto",
            background: flagged.size ? "#2563eb" : "#333",
            color: "#fff",
            border: "none",
            padding: "8px 14px",
            borderRadius: 4,
            fontSize: 13,
            cursor: flagged.size ? "pointer" : "not-allowed",
          }}
        >
          {copied ? "Đã copy!" : `Copy danh sách (${flagged.size})`}
        </button>
        <button
          onClick={clearAll}
          disabled={flagged.size === 0}
          style={{
            background: "transparent",
            color: "#999",
            border: "1px solid #444",
            padding: "8px 12px",
            borderRadius: 4,
            fontSize: 13,
            cursor: flagged.size ? "pointer" : "not-allowed",
          }}
        >
          Xoá đánh dấu
        </button>
      </div>

      <p style={{ padding: "12px 20px 0", fontSize: 13, color: "#999" }}>
        Click vào ảnh bị lệch/hỏng để đánh dấu (viền đỏ). Xong thì bấm &quot;Copy danh sách&quot; rồi dán lại cho Claude.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 10,
          padding: 20,
        }}
      >
        {filtered.map((im) => {
          const isFlagged = flagged.has(im.id);
          return (
            <button
              key={im.id}
              onClick={() => toggle(im.id)}
              style={{
                position: "relative",
                aspectRatio: "1",
                border: isFlagged ? "3px solid #ef4444" : "1px solid #333",
                borderRadius: 6,
                overflow: "hidden",
                background: "#1a1a1a",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <Image src={im.url} alt={`${im.handle} ${im.pose}`} fill sizes="140px" style={{ objectFit: "cover" }} />
              {isFlagged && (
                <span
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    background: "#ef4444",
                    color: "#fff",
                    borderRadius: "50%",
                    width: 20,
                    height: 20,
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✕
                </span>
              )}
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(0,0,0,0.7)",
                  color: "#ddd",
                  fontSize: 10,
                  padding: "3px 5px",
                  textAlign: "left",
                  lineHeight: 1.3,
                }}
              >
                {im.model === "worn-victor" ? "Nữ" : "Nam"} · {im.pose}
                <br />
                {im.handle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
