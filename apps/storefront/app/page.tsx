import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { themeFor, type UspIcon } from "@/themes/registry";
import { listProducts } from "@/lib/data/products";
import { ProductGrid } from "@/components/product/ProductGrid";

export const revalidate = 300;

const USP_ICON_PATHS: Record<UspIcon, React.ReactNode> = {
  shield: (
    <path
      d="M12 3l7 3v5c0 4.6-2.98 8.5-7 10-4.02-1.5-7-5.4-7-10V6l7-3z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M12 2.5v3M12 18.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </>
  ),
  hinge: (
    <>
      <circle cx="7" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9.4 12H20M20 9v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  truck: (
    <>
      <path d="M2.5 6.5h11v9h-11z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path
        d="M13.5 10h4l3 3v2.5h-7V10z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="17" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="17.5" cy="17" r="1.6" stroke="currentColor" strokeWidth="1.4" />
    </>
  ),
  return: (
    <path
      d="M4 12a8 8 0 1 1 2.6 5.9M4 12V7M4 12h5"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  warranty: (
    <>
      <path
        d="M12 3l7 3v5c0 4.6-2.98 8.5-7 10-4.02-1.5-7-5.4-7-10V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
};

function UspIconGlyph({ icon }: { icon: UspIcon }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      {USP_ICON_PATHS[icon]}
    </svg>
  );
}

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
    categories: theme.categories?.length ? (
      <section key="categories" className="container-page py-[var(--space-section)]">
        <div className="mb-10 text-center">
          <p className="eyebrow">Shop by category</p>
          <h2 className="mt-2" style={{ fontSize: "var(--fs-h2)" }}>
            Find your pair
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-3 md:gap-6">
          {theme.categories.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="group block"
            >
              <div className="relative aspect-square overflow-hidden rounded-token surface">
                <Image
                  src={c.image}
                  alt=""
                  fill
                  sizes="(max-width:768px) 33vw, 300px"
                  className="object-cover transition-transform duration-500 ease-[var(--ease)] group-hover:scale-105"
                />
              </div>
              <p className="mt-3 text-center text-xs font-medium uppercase tracking-[0.1em] md:text-sm">
                {c.label}
              </p>
            </Link>
          ))}
        </div>
      </section>
    ) : null,
    brands: theme.brands?.length ? (
      <section key="brands" className="w-full">
        {theme.brands.map((b) => (
          <Link
            key={b.label}
            href={b.href}
            className="group relative flex h-[33.333vh] min-h-[220px] w-full items-center overflow-hidden border-b border-white/10 bg-black last:border-b-0"
          >
            <Image
              src={b.image}
              alt=""
              fill
              sizes="100vw"
              priority={false}
              className="object-cover object-center transition-transform duration-700 ease-[var(--ease)] group-hover:scale-105"
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "linear-gradient(to right, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.52) 35%, rgba(10,10,10,0.05) 65%)" }}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{ boxShadow: "inset 0 0 0 1px rgba(184,137,74,0.55)" }}
            />
            <div className="relative z-10 px-8 text-white sm:px-12 md:px-16 lg:px-20">
              <p
                className="text-2xl leading-none sm:text-3xl md:text-4xl"
                style={{
                  fontFamily: b.font,
                  fontStyle: b.italic ? "italic" : "normal",
                  fontWeight: 600,
                  textShadow: "0 2px 16px rgba(0,0,0,0.45)",
                }}
              >
                {b.label}
              </p>
              <p className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/85 sm:text-[11px]">
                Explore collection
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </p>
            </div>
          </Link>
        ))}
      </section>
    ) : null,
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
        className="container-page grid gap-4 py-12 sm:grid-cols-3 sm:gap-6 md:py-16"
      >
        {theme.usps.map((u) => (
          <div
            key={u.title}
            className="flex items-start gap-4 rounded-token border border-token bg-card px-5 py-5 sm:flex-col sm:items-start sm:gap-3 sm:px-6 sm:py-7"
          >
            <span className="text-accent">
              <UspIconGlyph icon={u.icon} />
            </span>
            <div>
              <h3 className="text-sm font-medium uppercase tracking-[0.08em]">
                {u.title}
              </h3>
              <p className="mt-1 text-sm text-muted">{u.body}</p>
            </div>
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
