import Link from "next/link";
import { headers } from "next/headers";
import { themeFor } from "@/themes/registry";
import { listProducts } from "@/lib/data/products";
import { ProductGrid } from "@/components/product/ProductGrid";

export const revalidate = 300;

export default async function HomePage() {
  const theme = themeFor((await headers()).get("host"));
  const { products } = await listProducts({ limit: 8 });
  const featured = products.slice(0, 4);
  const rail = products.slice(4, 8);

  const Section: Record<string, React.ReactNode> = {
    hero: (
      <section key="hero" className="hero-bg">
        <div className="container-page py-16 md:py-24">
          <p className="text-sm font-medium uppercase tracking-wide text-muted">
            {theme.hero.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl md:text-6xl" style={{ fontSize: "var(--fs-hero)" }}>
            {theme.hero.title}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted">{theme.hero.subtitle}</p>
          <Link href={`/collections/${theme.collectionHandle}`} className="btn btn-accent mt-6">
            {theme.hero.cta}
          </Link>
        </div>
      </section>
    ),
    featured: featured.length ? (
      <section key="featured" className="container-page py-[var(--space-section)]">
        <h2 className="mb-6 text-2xl" style={{ fontSize: "var(--fs-h2)" }}>
          Featured
        </h2>
        <ProductGrid products={featured} />
      </section>
    ) : null,
    rail: rail.length ? (
      <section key="rail" className="surface">
        <div className="container-page py-[var(--space-section)]">
          <h2 className="mb-6 text-2xl" style={{ fontSize: "var(--fs-h2)" }}>
            New in
          </h2>
          <ProductGrid products={rail} />
        </div>
      </section>
    ) : null,
    usps: (
      <section key="usps" className="container-page grid gap-6 py-[var(--space-section)] md:grid-cols-3">
        {theme.usps.map((u) => (
          <div key={u.title} className="rounded-token border border-token p-5">
            <h3 className="font-semibold">{u.title}</h3>
            <p className="mt-1 text-sm text-muted">{u.body}</p>
          </div>
        ))}
      </section>
    ),
    faq: (
      <section key="faq" className="container-page py-[var(--space-section)]">
        <h2 className="mb-6 text-2xl" style={{ fontSize: "var(--fs-h2)" }}>
          Good to know
        </h2>
        <dl className="divide-y divide-[color:var(--color-border)] border-y border-token">
          {theme.faqs.map((f) => (
            <div key={f.q} className="py-4">
              <dt className="font-medium">{f.q}</dt>
              <dd className="mt-1 text-sm text-muted">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    ),
  };

  return <>{theme.sections.map((s) => Section[s])}</>;
}
