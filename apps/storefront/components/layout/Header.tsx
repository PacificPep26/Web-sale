import Link from "next/link";
import { getCart } from "@/lib/data/cart";
import { listCategories } from "@/lib/data/products";
import { THEMES } from "@/themes/registry";
import { NICHE } from "@/lib/config";

export async function Header() {
  const theme = THEMES[NICHE];
  const [cart, categories] = await Promise.all([getCart(), listCategories()]);
  const count =
    cart?.items?.reduce((n, i) => n + (i.quantity ?? 0), 0) ?? 0;

  return (
    <header className="sticky top-0 z-40 border-b border-token bg-base/90 backdrop-blur">
      <div className="container-page flex h-14 items-center justify-between gap-4">
        <Link href="/" className="font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          {theme.brand}
        </Link>
        <nav className="hidden gap-5 text-sm md:flex">
          {categories.slice(0, 5).map((c) => (
            <Link key={c.id} href={`/collections/${c.handle}`} className="text-muted hover:text-accent">
              {c.name}
            </Link>
          ))}
        </nav>
        <Link href="/cart" className="text-sm font-medium">
          Cart{count > 0 ? ` (${count})` : ""}
        </Link>
      </div>
    </header>
  );
}
