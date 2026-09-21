import Link from "next/link";
import { headers } from "next/headers";
import { themeFor } from "@/themes/registry";

export const metadata = {
  title: "Brand Studio & Craftsmanship | Official Review Showcase",
  description:
    "Explore our dedicated design philosophy, quality assurance standards, and customer care commitments.",
};

export default async function StudioPage() {
  const host = (await headers()).get("host");
  const theme = themeFor(host);
  const isToys = theme.key === "toys";

  return (
    <div className="container-page max-w-4xl py-16">
      {/* Header Badge */}
      <div className="border-b border-border/40 pb-8">
        <span className="inline-block px-3 py-1 bg-accent/10 text-accent font-mono text-xs uppercase tracking-widest rounded-full mb-3">
          Verified Brand Standards
        </span>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
          {isToys ? "PlayPuff Creative Studio" : "LuxeShade Eyewear Studio"}
        </h1>
        <p className="mt-4 text-muted text-lg max-w-2xl leading-relaxed">
          {isToys
            ? "Dedicated to inspiring young minds with safe, eco-conscious toys, sensory plushes, and interactive family games."
            : "Hand-finished cellulose acetate frames and precision optical accessories engineered for discerning clients worldwide."}
        </p>
      </div>

      {/* Core Pillars */}
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        <div className="p-6 border border-border/60 rounded-xl bg-card">
          <div className="text-2xl font-mono text-accent mb-3">01</div>
          <h3 className="font-semibold text-lg mb-2">
            {isToys ? "Child-Safe Certified" : "Optical-Grade Materials"}
          </h3>
          <p className="text-sm text-muted leading-relaxed">
            {isToys
              ? "All products strictly comply with US ASTM F963-17 and CPSIA standards. BPA-free, lead-free, and thoroughly inspected."
              : "Handcrafted using Italian Mazzucchelli acetate, five-barrel German OBE hinges, and 100% UV400 Category 3 sun lenses."}
          </p>
        </div>

        <div className="p-6 border border-border/60 rounded-xl bg-card">
          <div className="text-2xl font-mono text-accent mb-3">02</div>
          <h3 className="font-semibold text-lg mb-2">
            Tracked US Delivery
          </h3>
          <p className="text-sm text-muted leading-relaxed">
            Orders are fulfilled with full tracking within 24–48 business hours via
            USPS Priority or DHL eCommerce. Real-time tracking notifications are sent directly to your inbox.
          </p>
        </div>

        <div className="p-6 border border-border/60 rounded-xl bg-card">
          <div className="text-2xl font-mono text-accent mb-3">03</div>
          <h3 className="font-semibold text-lg mb-2">
            30-Day Guarantee
          </h3>
          <p className="text-sm text-muted leading-relaxed">
            Every purchase includes our risk-free 30-day money-back guarantee. If you are
            not 100% delighted, return your items in original packaging for a prompt refund.
          </p>
        </div>
      </div>

      {/* Essential Legal Compliance Quick Links */}
      <div className="mt-16 p-8 border border-border/60 rounded-2xl bg-muted/10">
        <h2 className="text-xl font-semibold mb-2">Store Policies & Customer Support</h2>
        <p className="text-sm text-muted mb-6">
          We maintain transparent policies and responsive support to ensure a seamless purchasing experience.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm font-medium">
          <Link
            href="/pages/shipping"
            className="p-3 border border-border/50 rounded-lg hover:border-accent hover:text-accent transition-colors text-center"
          >
            Shipping Policy
          </Link>
          <Link
            href="/pages/returns"
            className="p-3 border border-border/50 rounded-lg hover:border-accent hover:text-accent transition-colors text-center"
          >
            Refund Policy
          </Link>
          <Link
            href="/pages/terms"
            className="p-3 border border-border/50 rounded-lg hover:border-accent hover:text-accent transition-colors text-center"
          >
            Terms of Service
          </Link>
          <Link
            href="/pages/contact"
            className="p-3 border border-border/50 rounded-lg hover:border-accent hover:text-accent transition-colors text-center"
          >
            Contact Support
          </Link>
        </div>
      </div>

      {/* Footer Support Info */}
      <div className="mt-12 text-center text-xs text-muted">
        <span>Customer Support Email: </span>
        <a
          href={`mailto:${theme.supportEmail || "luxeshadee@gmail.com"}`}
          className="underline font-medium text-foreground"
        >
          {theme.supportEmail || "luxeshadee@gmail.com"}
        </a>
        <span className="mx-2">·</span>
        <span>Standard Response Time: Under 24 Business Hours</span>
      </div>
    </div>
  );
}

