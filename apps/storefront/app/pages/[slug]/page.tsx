import { notFound } from "next/navigation"
import { themeFor } from "@/themes/registry"
import { headers } from "next/headers"

interface PolicySection { title: string; subtitle?: string; body: string[] }

const TOY_CONTENT: Record<string, { title: string; body: string[] }> = {
  about: { title: "Hello, we're PlayPuff.", body: ["A little play. A whole lot of joy. PlayPuff brings together toys for growing imaginations and collectibles worth keeping.", "Explore Baby & Toddler (0-2), Preschool (3-5), Kids (6-12), and Teens & Adults (13+). Each product has its own age recommendation: always read its details and warnings before choosing.", "Our Collectors 14+ collection is for older enthusiasts, with a space of its own. There's room for every kind of play."] },
  shipping: { title: "Shipping", body: ["PlayPuff is being prepared for customers in the United States. Available delivery options, charges and applicable taxes will be shown at checkout before payment.", "Our shipping policy is being finalized. Checkout will remain unavailable for live orders until delivery and support arrangements are ready."] },
  returns: { title: "Returns & refunds", body: ["Our returns policy and customer support details are being finalized before launch. Live checkout will remain unavailable until these details are published.", "Please check this page before placing an order. Product-specific age recommendations and warnings are listed on each product page."] },
  privacy: { title: "Privacy", body: ["Checkout uses your contact and delivery details to process your order. Payment card details are handled by Stripe, not stored in the PlayPuff storefront.", "Our full privacy notice and support contact will be published before live checkout opens."] },
  terms: { title: "Shopping with PlayPuff", body: ["Prices are displayed in USD. Availability, shipping charges and taxes are confirmed during checkout.", "Our store terms and business contact details are being finalized before launch. Live payments remain unavailable until the store is ready."] },
}

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
      "Phone & WhatsApp: 0889 719 967.",
      "Customer Care Hours: Monday – Saturday, 8:00 AM – 7:00 PM EST.",
      "Studio Support: LuxeShade Studio Logistics, United States.",
      "For urgent order modifications or address corrections, please email us with 'URGENT: Order #[Number]' in the subject line.",
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(CONTENT).map(slug => ({ slug }))
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const theme = themeFor((await headers()).get("host"))
  const page: PolicySection = theme.key === "toys" ? TOY_CONTENT[slug] : CONTENT[slug]
  if (!page) notFound()
  return <div className="container-page max-w-3xl py-16">
    <div className="border-b border-token pb-6 mb-8"><h1 className="text-3xl font-semibold mt-2">{page.title}</h1>{page.subtitle && <p className="text-muted text-base mt-2">{page.subtitle}</p>}</div>
    <div className="space-y-6 leading-relaxed text-sm md:text-base">{page.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
    {theme.supportEmail && <p className="mt-12 pt-8 border-t border-token text-sm">Questions? Email <a href={`mailto:${theme.supportEmail}`} className="underline">{theme.supportEmail}</a> and reference your order number.</p>}
  </div>
}
