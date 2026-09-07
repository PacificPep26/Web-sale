import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { themeFor } from "@/themes/registry";
import { listProducts } from "@/lib/data/products";
import { ProductGrid } from "@/components/product/ProductGrid";

export const revalidate = 300;

export default async function HomePage() {
  const theme = themeFor((await headers()).get("host"));
  const { products } = await listProducts({ limit: 12 });
  const featured = products.slice(0, 4);
  const rail = products.slice(4, 8);

  const Section: Record<string, React.ReactNode> = {
    hero: (
      <section key="hero" className="relative isolate min-h-[78vh] w-full overflow-hidden">
        <Image
          src={theme.hero.image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "var(--hero-overlay)" }}
        />
        <div
          className={`container-page relative flex min-h-[78vh] flex-col justify-end pb-16 md:pb-24 ${
            theme.hero.align === "center" ? "items-center text-center" : "items-start"
          }`}
          style={{ color: "var(--hero-fg)" }}
        >
          <p className="eyebrow" style={{ color: "inherit", opacity: 0.85 }}>
            {theme.hero.eyebrow}
          </p>
          <h1
            className="mt-4 max-w-3xl"
            style={{ fontSize: "var(--fs-hero)" }}
          >
            {theme.hero.title}
          </h1>
          <p className="mt-4 max-w-md text-base opacity-90">
            {theme.hero.subtitle}
          </p>
          <Link
            href={`/collections/${theme.collectionHandle}`}
            className="mt-8 link-underline"
          >
            {theme.hero.cta}
          </Link>
        </div>
      </section>
    ),
    featured: featured.length ? (
      <section key="featured" className="container-page py-[var(--space-section)]">
        <div className="mb-10 text-center">
          <p className="eyebrow">Featured</p>
          <h2 className="mt-2" style={{ fontSize: "var(--fs-h2)" }}>
            New this season
          </h2>
        </div>
        <ProductGrid products={featured} priorityCount={4} />
        <div className="mt-12 text-center">
          <Link href={`/collections/${theme.collectionHandle}`} className="btn btn-outline">
            View all
          </Link>
        </div>
      </section>
    ) : null,
    editorial: (
      <section key="editorial" className="grid items-stretch md:grid-cols-2">
        <div className="relative min-h-[52vh] md:min-h-[68vh]">
          <Image
            src={theme.editorial.image}
            alt=""
            fill
            sizes="(max-width:768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-center bg-card px-8 py-16 md:px-16">
          <p className="eyebrow">{theme.editorial.kicker}</p>
          <h2 className="mt-3 max-w-md" style={{ fontSize: "var(--fs-h2)" }}>
            {theme.editorial.title}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            {theme.editorial.body}
          </p>
          <Link href={theme.editorial.href} className="mt-8 link-underline self-start">
            {theme.editorial.cta}
          </Link>
        </div>
      </section>
    ),
    rail: rail.length ? (
      <section key="rail" className="surface">
        <div className="container-page py-[var(--space-section)]">
          <div className="mb-10 text-center">
            <p className="eyebrow">The Shelf</p>
            <h2 className="mt-2" style={{ fontSize: "var(--fs-h2)" }}>
              Recently added
            </h2>
          </div>
          <ProductGrid products={rail} />
        </div>
      </section>
    ) : null,
    usps: (
      <section
        key="usps"
        className="container-page grid gap-10 border-y border-token py-16 text-center md:grid-cols-3"
      >
        {theme.usps.map((u) => (
          <div key={u.title}>
            <h3 className="text-base font-medium uppercase tracking-[0.1em]">
              {u.title}
            </h3>
            <p className="mt-2 text-sm text-muted">{u.body}</p>
          </div>
        ))}
      </section>
    ),
    faq: (
      <section
        key="faq"
        className="container-page max-w-2xl py-[var(--space-section)]"
      >
        <h2 className="mb-8 text-center" style={{ fontSize: "var(--fs-h2)" }}>
          Good to know
        </h2>
        <dl className="border-t border-token">
          {theme.faqs.map((f) => (
            <div key={f.q} className="border-b border-token py-5">
              <dt className="text-sm font-medium uppercase tracking-[0.08em]">
                {f.q}
              </dt>
              <dd className="mt-2 text-sm text-muted">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    ),
  };

  return <>{theme.sections.map((s) => Section[s])}</>;
}
