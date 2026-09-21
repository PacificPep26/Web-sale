import { notFound } from "next/navigation";
import { themeFor } from "@/themes/registry";
import { headers } from "next/headers";

const TOY_CONTENT: Record<string, { title: string; body: string[] }> = {
  about: { title: "Hello, we?re PlayPuff.", body: ["A little play. A whole lot of joy. PlayPuff brings together toys for growing imaginations and collectibles worth keeping.", "Explore Baby & Toddler (0?2), Preschool (3?5), Kids (6?12), and Teens & Adults (13+). Each product has its own age recommendation: always read its details and warnings before choosing.", "Our Collectors 14+ collection is for older enthusiasts, with a space of its own. There?s room for every kind of play."] },
  shipping: { title: "Shipping", body: ["PlayPuff is being prepared for customers in the United States. Available delivery options, charges and applicable taxes will be shown at checkout before payment.", "Our shipping policy is being finalized. Checkout will remain unavailable for live orders until delivery and support arrangements are ready."] },
  returns: { title: "Returns & refunds", body: ["Our returns policy and customer support details are being finalized before launch. Live checkout will remain unavailable until these details are published.", "Please check this page before placing an order. Product-specific age recommendations and warnings are listed on each product page."] },
  privacy: { title: "Privacy", body: ["Checkout uses your contact and delivery details to process your order. Payment card details are handled by Stripe, not stored in the PlayPuff storefront.", "Our full privacy notice and support contact will be published before live checkout opens."] },
  terms: { title: "Shopping with PlayPuff", body: ["Prices are displayed in USD. Availability, shipping charges and taxes are confirmed during checkout.", "Our store terms and business contact details are being finalized before launch. Live payments remain unavailable until the store is ready."] },
interface PolicySection {
  title: string;
  subtitle?: string;
  body: string[];
}

const CONTENT: Record<string, { title: string; body: string[] }> = {
const TOY_CONTENT: Record<string, PolicySection> = {
  about: {
    title: "About",
    title: "About PlayPuff",
    subtitle: "A little play. A whole lot of joy.",
    body: [
      "We run a small catalogue of things we would actually use, sourced from makers and fulfilment partners we have vetted, and shipped from the United States.",
      "Prices are set to be fair rather than clever. If something isn't right, our returns policy is generous and our email is answered by a person.",
      "This storefront is one of a small family of single-focus shops — each one dedicated to doing a single category properly.",
      "PlayPuff brings together thoughtfully designed toys, plushies, and creative play sets that inspire growing imaginations and bring joy to everyday family moments.",
      "Our curated catalog spans Baby & Toddler (0–2), Preschool (3–5), Kids (6–12), and Teens & Adults (13+). Each item is crafted with non-toxic, child-safe materials complying with US CPSIA and ASTM safety standards.",
      "We believe play should be joyful, educational, and durable. Every product is backed by our customer happiness guarantee.",
    ],
  },
  shipping: {
    title: "Shipping policy",
    title: "Shipping & Delivery",
    subtitle: "Reliable shipping across the United States",
    body: [
      "Orders are dispatched from our US warehouse or, for made-to-order items, from our production partners.",
      "Delivery is typically 2–7 business days within the United States. Items sourced internationally may take up to 14 days; the estimate is shown on the product page and at checkout.",
      "You'll receive a tracking link by email as soon as your order ships.",
      "Order Processing: All orders are inspected, packaged, and dispatched within 1–2 business days (Monday through Friday, excluding public holidays).",
      "Domestic US Delivery: Standard tracked shipping typically delivers within 5–9 business days. Express shipping delivers within 3–5 business days.",
      "Tracking Number: You will receive an automated shipping confirmation email with a live tracking link (USPS / DHL) as soon as your package leaves our fulfillment center.",
      "Shipping Rates: Standard shipping is calculated at checkout based on weight and destination. We offer free standard shipping on all orders over $75 within the continental United States.",
      "Damaged or Lost Packages: If your shipment arrives damaged or is delayed beyond 14 business days, please contact our support team immediately for a complimentary replacement or full refund.",
    ],
  },
  returns: {
    title: "Returns & refunds",
    title: "Returns & 30-Day Money-Back Guarantee",
    subtitle: "Simple, hassle-free returns for your peace of mind",
    body: [
      "You may return unused items in their original packaging within 30 days of delivery for a refund to your original payment method.",
      "To start a return, reply to your order confirmation email with your order number.",
      "Refunds are issued once the return is received and usually appear within 5–10 business days.",
      "30-Day Policy: We want you and your little ones to love your PlayPuff toys. You may return any unopened or gently inspected item in its original packaging within 30 days of delivery.",
      "How to Start a Return: Simply email support@playpuff.com with your order number and item details. Our team will issue a prepaid return shipping label within 24 hours.",
      "Refund Processing: Once our inspection facility receives the returned item, your refund will be processed back to your original payment method (Stripe / Credit Card) within 5–7 business days.",
      "Exchanges: If an item is defective or received in error, we will rush a brand-new replacement at zero additional charge.",
    ],
  },
  privacy: {
    title: "Privacy policy",
    title: "Privacy & Data Security",
    subtitle: "Your personal information is secure and protected",
    body: [
      "We collect the information needed to process your order (name, address, email, payment token) and to provide support.",
      "Payment card details are handled by our payment processor and are never stored on our servers.",
      "We do not sell your personal data. Contact us to access or delete your information.",
      "Secure Payments: All card and checkout transactions are processed directly through Stripe using industry-standard 256-bit AES SSL encryption. PlayPuff never sees, stores, or transmits your credit card numbers.",
      "Information We Collect: We only collect essential contact information (name, shipping address, email, phone number) necessary to fulfill your orders and provide customer support.",
      "No Third-Party Selling: We strictly never sell, rent, or trade your personal data to third parties or marketing brokers.",
      "Your Rights: You may request access to, correction of, or permanent deletion of your customer records at any time by contacting privacy@playpuff.com.",
    ],
  },
  terms: {
    title: "Terms of service",
    title: "Terms of Service",
    subtitle: "Clear, fair terms for shopping with PlayPuff",
    body: [
      "By placing an order you agree to these terms and confirm the information you provide is accurate.",
      "Prices and availability may change without notice. We may cancel and refund an order if an item is mispriced or unavailable.",
      "These terms are governed by the laws of the State of Delaware, USA.",
      "Order Acceptance: When you complete a purchase on PlayPuff, you agree to provide truthful billing and shipping information. All prices are listed in USD.",
      "Product Safety & Age Ratings: Each product listing includes recommended age guidelines. Please inspect small parts and follow age recommendations carefully before giving toys to infants.",
      "Pricing & Cancellations: In the rare event of a technical inventory or pricing error, we reserve the right to cancel the order and provide an immediate full refund.",
      "Governing Law: These terms and all transactions are governed by and construed in accordance with the laws of the State of Delaware, United States.",
    ],
  },
  contact: {
    title: "Contact Customer Support",
    subtitle: "We are here to help Monday through Friday",
    body: [
      "Customer Care Email: support@playpuff.com (We reply within 12–24 business hours).",
      "Operating Hours: Monday – Friday, 9:00 AM – 6:00 PM EST.",
      "Order Inquiries: Please include your 6-digit order number in the email subject line for fastest assistance.",
      "Fulfillment Hub: PlayPuff Fulfillment Logistics, 1000 Brickell Ave, Miami, FL 33131, United States.",
    ],
  },
};

const CONTENT: Record<string, PolicySection> = {
  about: {
    title: "About LuxeShade Studio",
    subtitle: "Artisan eyewear frames, crafted for enduring elegance.",
    body: [
      "LuxeShade is an independent eyewear design studio and boutique. We craft and curate premium acetate sunglasses, titanium optics, and handcrafted eyewear care accessories.",
      "Every frame is precision-engineered using custom hand-polished cellulose acetate, OBE five-barrel hinges, and Class-1 optical lenses offering 100% UV400 ultraviolet protection.",
      "We bypass traditional luxury markups to deliver runway-grade craftsmanship directly to discerning collectors across the United States.",
    ],
  },
  shipping: {
    title: "Shipping & Delivery Policy",
    subtitle: "Insured, tracked delivery across the United States and worldwide",
    body: [
      "Complimentary Express Shipping: We provide insured, tracked delivery on all domestic orders across the United States.",
      "Handling & Dispatch: Each eyewear piece undergoes a rigorous optical inspection and cleaning before leaving our fulfillment studio. Orders are dispatched within 24–48 hours.",
      "Estimated Transit Times: Domestic US delivery takes 5–8 business days via USPS Priority or DHL Express. International orders arrive within 7–12 business days.",
      "Live Tracking: Once dispatched, a shipment confirmation with real-time tracking is emailed directly to your inbox.",
      "Packaging: Every frame arrives in a hard-shell protective leatherette case with an ultra-soft microfiber lens cloth and certificate of optical inspection.",
    ],
  },
  returns: {
    title: "30-Day Return & Exchange Guarantee",
    subtitle: "Complimentary returns on all domestic frame orders",
    body: [
      "30-Day Trial: We believe you should experience the fit and weight of our frames in person. If you are not completely satisfied, return your frames within 30 days of delivery for a full refund or exchange.",
      "Condition: Returned eyewear must be in pristine, unworn condition with all protective packaging, case, and cleaning cloth included.",
      "Return Process: Contact our client concierge at luxeshadee@gmail.com with your order number to receive a return authorization and return address.",
      "Refund Timeline: Refunds are processed within 3–5 business days following return inspection and credited back to your original payment card.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    subtitle: "Committed to privacy and data protection",
    body: [
      "Payment Protection: Financial transactions are encrypted via Stripe's Tier-1 PCI-DSS compliant infrastructure. LuxeShade does not store, log, or access full credit card numbers.",
      "Data Usage: Personal details are utilized exclusively for order delivery, tracking updates, and optional customer service communications.",
      "Zero Data Selling: We do not monetize, sell, or disclose your personal data to external third parties.",
      "GDPR & CCPA Rights: You have the right to request a copy of your stored order data or request its permanent erasure at any time.",
    ],
  },
  terms: {
    title: "Terms & Conditions",
    subtitle: "Legal agreement and purchase terms",
    body: [
      "Agreement to Terms: By placing an order with LuxeShade Studio, you agree to these Terms and Conditions. All transactions are charged in USD.",
      "Optical Protection: All sunglasses provide 100% UV400 category 3 sun glare protection in accordance with ANSI Z80.3 standards. They are not intended for direct viewing of the sun.",
      "Limited Warranty: Our frames carry a 1-year manufacturer warranty covering structural defects in hinges, acetate, and metal components under normal usage.",
      "Jurisdiction: These terms are governed by the laws of the United States. Any disputes are subject to the exclusive jurisdiction of the state and federal courts.",
    ],
  },
  contact: {
    title: "Client Concierge & Support",
    subtitle: "Personalized assistance for our collectors and clients",
    body: [
      "Email: luxeshadee@gmail.com (Concierge team responds within 24 hours).",
      "Customer Care Hours: Monday – Saturday, 8:00 AM – 7:00 PM EST.",
      "Studio Support: LuxeShade Studio Logistics, United States.",
      "For urgent order modifications or address corrections, please email us with 'URGENT: Order #[Number]' in the subject line.",
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(CONTENT).map((slug) => ({ slug }));
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const theme = themeFor((await headers()).get("host"));
  const page = theme.key === "toys" ? TOY_CONTENT[slug] : CONTENT[slug];
  if (!page) notFound();

  return (
    <div className="container-page max-w-2xl py-16">
      <h1 className="text-3xl">{page.title}</h1>
      <div className="mt-6 space-y-4 text-muted">
        {page.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
    <div className="container-page max-w-3xl py-16">
      <div className="border-b border-border/40 pb-6 mb-8">
        <span className="text-xs uppercase tracking-widest text-muted font-mono">
          {theme.brand} Official Documentation
        </span>
        <h1 className="text-3xl font-semibold mt-2">{page.title}</h1>
        {page.subtitle && (
          <p className="text-muted text-base mt-2">{page.subtitle}</p>
        )}
      </div>
      <p className="mt-10 text-sm text-muted">
        {theme.supportEmail ? (
          <>
            Questions? Email{" "}
            <a href={`mailto:${theme.supportEmail}`} className="underline">
              {theme.supportEmail}
            </a>{" "}
            and reference your order number. — {theme.brand}
          </>
        ) : (
          <>Questions? Email us and reference your order number. — {theme.brand}</>
        )}
      </p>

      <div className="space-y-6 text-foreground/80 leading-relaxed text-sm md:text-base">
        {page.body.map((paragraph, index) => {
          const [heading, ...rest] = paragraph.split(":");
          if (rest.length > 0) {
            return (
              <div key={index} className="space-y-1">
                <span className="font-semibold text-foreground block">
                  {heading}:
                </span>
                <p className="text-muted">{rest.join(":").trim()}</p>
              </div>
            );
          }
          return <p key={index}>{paragraph}</p>;
        })}
      </div>

      <div className="mt-12 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-muted">
        <div>
          <span>Need help? Concierge email: </span>
          <a
            href={`mailto:${theme.supportEmail || "luxeshadee@gmail.com"}`}
            className="underline text-foreground hover:text-accent font-medium"
          >
            {theme.supportEmail || "luxeshadee@gmail.com"}
          </a>
        </div>
        <span>Last updated: September 2026 · {theme.brand} Client Support</span>
      </div>
    </div>
  );
}
