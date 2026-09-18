import { notFound } from "next/navigation";
import { themeFor } from "@/themes/registry";
import { headers } from "next/headers";

const CONTENT: Record<string, { title: string; body: string[] }> = {
  about: {
    title: "About",
    body: [
      "We run a small catalogue of things we would actually use, sourced from makers and fulfilment partners we have vetted, and shipped from the United States.",
      "Prices are set to be fair rather than clever. If something isn't right, our returns policy is generous and our email is answered by a person.",
      "This storefront is one of a small family of single-focus shops — each one dedicated to doing a single category properly.",
    ],
  },
  shipping: {
    title: "Shipping policy",
    body: [
      "Orders are dispatched from our US warehouse or, for made-to-order items, from our production partners.",
      "Delivery is typically 2–7 business days within the United States. Items sourced internationally may take up to 14 days; the estimate is shown on the product page and at checkout.",
      "You'll receive a tracking link by email as soon as your order ships.",
    ],
  },
  returns: {
    title: "Returns & refunds",
    body: [
      "You may return unused items in their original packaging within 30 days of delivery for a refund to your original payment method.",
      "To start a return, reply to your order confirmation email with your order number.",
      "Refunds are issued once the return is received and usually appear within 5–10 business days.",
    ],
  },
  privacy: {
    title: "Privacy policy",
    body: [
      "We collect the information needed to process your order (name, address, email, payment token) and to provide support.",
      "Payment card details are handled by our payment processor and are never stored on our servers.",
      "We do not sell your personal data. Contact us to access or delete your information.",
    ],
  },
  terms: {
    title: "Terms of service",
    body: [
      "By placing an order you agree to these terms and confirm the information you provide is accurate.",
      "Prices and availability may change without notice. We may cancel and refund an order if an item is mispriced or unavailable.",
      "These terms are governed by the laws of the State of Delaware, USA.",
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
  const page = CONTENT[slug];
  if (!page) notFound();
  const theme = themeFor((await headers()).get("host"));

  return (
    <div className="container-page max-w-2xl py-16">
      <h1 className="text-3xl">{page.title}</h1>
      <div className="mt-6 space-y-4 text-muted">
        {page.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
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
    </div>
  );
}
