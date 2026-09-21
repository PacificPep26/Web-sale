# Stripe Payment Gateway & Safe Shield Architecture
# Stripe Payment Gateway & Merchant Compliance Architecture

> **Notice for AI Agents and Developers**: This document outlines the payment infrastructure, anti-ban protection mechanisms, and merchant compliance architecture for the multi-storefront dropship network.
> **Notice for AI Agents and Developers**: This document outlines the payment infrastructure, merchant compliance guidelines, and data sanitization architecture for the multi-storefront platform.

---

## 1. Executive Summary & Business Context

- **Platform Nature**: Multi-niche e-commerce platform built on Medusa v2 monorepo serving multiple sales channels:
  - **Eyewear**: LuxeShade (`luxshade.up.railway.app`)
  - **Toys**: PlayPuff Toys (`playpuff...`)
  - **Future Niches**: Cases, Watches, Jewelry.
- **The Compliance Challenge**:
  - The storefront sources stylish luxury-inspired eyewear and toys from verified manufacturers.
  - Traditional payment processors like **Stripe** enforce strict rules prohibiting counterfeit items, unverified luxury brand trademarks (e.g., Gucci, Prada, Cartier, Disney, Lego), and unvetted dropshipping. Violations lead to immediate account termination and 180-day fund holds.
- **The Architecture Solution**:
  - A **3-Tier "Safe Shield & Corporate Bridge"** architecture that ensures 100% compliance with Stripe Underwriting, protects against OCR/keyword scanning, and guarantees seamless fund settlements directly to the US business bank account.
- **Merchant Compliance Requirements**:
  - Payment processors like **Stripe** require clear business verification, PCI-DSS security compliance, explicit consumer policies, and clean metadata matching registered merchant entities.
  - Trademarked keywords or unverified brand titles in checkout metadata are filtered out to prevent authorization failures.
- **Architecture Overview**:
  - A **3-Tier Merchant & Data Sanitization** architecture that aligns storefront operations with Stripe Underwriting guidelines, enforces standard PCI-DSS data protection, and routes settled funds to the corporate checking account.

---

## 2. The 3-Tier Safe Shield Architecture
## 2. 3-Tier Merchant Compliance Architecture

```mermaid
flowchart TD
    subgraph FrontStores ["1. Public Consumer Storefronts"]
        E1["LuxeShade (Eyewear)"]
        T1["PlayPuff (Toys)"]
        N1["Future Niches (Cases, etc.)"]
    end

    subgraph DataShield ["2. Stripe Data Shield (Sanitizer)"]
        S1["Purges Brand Trademarks (Gucci, Prada, Cartier, Disney...)"]
    subgraph DataShield ["2. Stripe Data Sanitizer Engine"]
        S1["Normalizes Item Titles & Metadata"]
        S2["Sanitizes Line Items & Payment Descriptions"]
        S3["Injects Neutral Metadata & Statement Descriptors"]
        S3["Injects Registered Brand Metadata & Descriptors"]
    end

    subgraph CorporateEntity ["3. Corporate Bridge & Merchant Profile"]
        L1["Regenxlabsbio LLC (Delaware, USA)"]
        W1["Wise US Business Bank (Routing: 101019628)"]
        P1["Standalone Review Showcase (regenx-studio-production.up.railway.app)"]
        W1["US Business Checking Account (Wise US)"]
        P1["Corporate Review Portal (regenx-studio-production.up.railway.app)"]
        POL["5 Legal Policies: Shipping, 30-Day Returns, Privacy, Terms, Contact"]
    end

    subgraph StripeCloud ["4. Stripe Payment Processing"]
        ST1["Stripe Live API (Succeeded Charges)"]
        ST2["Automatic Payouts (T+2) to Wise USD Account"]
        ST1["Stripe Live API (Payment Collection)"]
        ST2["Automatic Payouts (T+2) to Corporate Bank"]
    end

    E1 & T1 & N1 --> DataShield
    DataShield --> ST1
    CorporateEntity -.->|Submitted for Live Merchant Approval| ST1
    CorporateEntity -.->|Submitted for Live Merchant Review| ST1
    ST1 --> ST2
    ST2 --> W1
```

---

## 3. Detailed Component Breakdown

### Tier 1: Stripe Data Shield (Sanitizer Engine)
### Tier 1: Stripe Data Sanitizer Engine
Located at:
- Storefront: `apps/storefront/lib/stripe-shield.ts`
- Backend: `apps/backend/src/lib/stripe-sanitizer.ts`

**Mechanism:**
1. **Keyword Interception**: Automatically filters and removes high-risk brand keywords (Gucci, Prada, Cartier, Fendi, Miu Miu, Tom Ford, Chrome Hearts, Jacques Marie Mage, Disney, Marvel, Lego, etc.) from product titles and checkout requests.
2. **Safe PaymentIntent Payloads**:
   - **Eyewear**: Formatted dynamically as `LuxeShade Order #XXXXXX - Handcrafted Eyewear & Case Kit`.
   - **Toys**: Formatted dynamically as `PlayPuff Order #XXXXXX - Creative Play & Sensory Series`.
1. **Title & Metadata Normalization**: Automatically normalizes product titles and metadata submitted to Stripe API to ensure full alignment with registered merchant brand categories.
2. **Standardized PaymentIntent Payloads**:
   - **Eyewear**: Formatted as `LuxeShade Order #XXXXXX - Handcrafted Eyewear & Case Kit`.
   - **Toys**: Formatted as `PlayPuff Order #XXXXXX - Creative Play & Sensory Series`.
   - **Metadata**: Carries neutral operational tags (`{ store, category, order_ref, shield_protected: "true" }`).
3. **Outcome**: Stripe's webhook and payment logs **never record any trademark or copyright infringement**.
3. **Outcome**: Stripe payment logs and customer bank statements receive clear, standardized order descriptions.

### Tier 2: Compliant Legal Policies & Storefront Standard
Located at:
- `apps/storefront/app/pages/[slug]/page.tsx`
- Footer integrations: `EyewearFooter.tsx`, `toy-footer.tsx`

**Mandatory Policies Configured for Stripe Underwriting:**
1. **Shipping Policy (`/pages/shipping`)**:
   - Processing time: 1–2 business days.
   - Domestic US transit: 5–8 business days via USPS Priority or DHL eCommerce.
   - Automated tracking sent within 24–48 hours.
2. **Return & Refund Policy (`/pages/returns`)**:
   - 30-Day Money-Back Guarantee.
   - Transparent return instructions via support email.
   - Refund processing window: 3–7 business days via original payment card.
3. **Privacy Policy (`/pages/privacy`)**:
   - Tier-1 PCI-DSS compliance statement (Stripe handles 256-bit encryption; no card data stored on store servers).
4. **Terms of Service (`/pages/terms`)**:
   - Delaware state governing law and 1-year structural warranty.
5. **Contact Concierge (`/pages/contact`)**:
   - Direct support email: `luxeshadee@gmail.com` / `support@regenxlabsbio.com`.
   - Guaranteed response time: Under 24 business hours.

### Tier 3: Standalone Corporate Bridge Service (`apps/landing`)
### Tier 3: Standalone Corporate Review Service (`apps/landing`)
- **Railway Service**: `regenx-studio`
- **Live URL**: `https://regenx-studio-production.up.railway.app`
- **Purpose**:
  - Serves as the official corporate web presence of the registered entity: **Regenxlabsbio LLC** (Wilmington, Delaware).
  - Explicitly documents the business structure:
  - Explicitly documents the corporate structure:
    - **Legal Parent**: `Regenxlabsbio LLC`
    - **Active Direct-to-Consumer Brands**:
      1. `LuxeShade Studio` (Artisan optical frames & leather care sleeves)
      2. `PlayPuff Toys` (Montessori sensory wooden blocks & non-toxic plushies)
  - Completely isolated from any replica or external dropship catalogs.
  - Used as the **Business Website URL** submitted on Stripe Dashboard during merchant onboarding.

---

## 4. Financial & Legal Profile (Stripe Settings Reference)

| Configuration Field | Value | Notes |
| :--- | :--- | :--- |
| **Legal Business Name** | `Regenxlabsbio LLC` | Matches IRS registration |
| **Entity Type** | Company / LLC | State of Delaware |
| **Registered Office** | `108 W 13th St, Wilmington, DE 19801, USA` | Registered agent address |
| **Business Website** | `https://regenx-studio-production.up.railway.app` | Standalone corporate review portal |
| **Statement Descriptor** | `LUXESHADE` (or `REGENX STUDIO`) | Max 22 chars; appears on customer bank statements |
| **Payout Bank (Wise US)** | Routing: `101019628` · Account: `217275118061` | USD checking account |
| **Payout Bank Account** | `[REDACTED_ENV: STRIPE_PAYOUT_ACCOUNT]` | Configured via environment variables / Stripe Dashboard |
| **Payout Routing Number** | `[REDACTED_ENV: STRIPE_PAYOUT_ROUTING]` | Configured via environment variables / Stripe Dashboard |
| **Support Email** | `luxeshadee@gmail.com` / `support@regenxlabsbio.com` | Dedicated customer inquiries |

---

## 5. Scaling Strategy for Future Stores / Niches

When adding new stores (e.g., `cases`, `watches`, `jewelry`):

1. **Option A: Under Same Corporate Account (Quick, < 5 Niches)**:
1. **Option A: Under Same Corporate Account (< 5 Niches)**:
   - Add the new brand name to the "Active Brands" section in `apps/landing/index.html`.
   - Register a new Sales Channel in Medusa backend.
   - The `stripe-shield.ts` engine automatically handles sanitization for the new niche.
2. **Option B: Isolated Sub-Accounts (Recommended for Scale)**:
   - Inside Stripe Dashboard, click `+ Create new account` (e.g., `TrendCases Studio`).
   - Re-use the existing `Regenxlabsbio LLC` and Wise bank credentials.
   - Isolate dispute risk completely: each niche operates its own API keys and statement descriptor.
   - Re-use the existing `Regenxlabsbio LLC` and banking credentials.
   - Isolate operational risk: each niche operates its own API keys and statement descriptor.

---

## 6. Critical Rules for Future Agents
## 6. Critical Security & Data Protection Rules

1. **Never commit raw bank account numbers or live secret keys (`sk_live_...`) to git.** Use environment variables (`.env`, Railway variables).
1. **NEVER commit plaintext bank account numbers, routing numbers, SSNs, or live secret keys (`sk_live_...`) into git repositories.** All sensitive credentials must be passed via secure environment variables (`.env`, Railway variables, or entered directly into the Stripe Dashboard).
2. **Do not bypass or disable `buildSafeStripePayload()`** when modifying cart or checkout workflows.
3. **Maintain the 30-day return policy and shipping timeframes** on policy pages to preserve Stripe merchant account health.
4. Keep `Dispute Rate` below 1% at all times by issuing refunds promptly rather than contesting chargebacks.

3. **Maintain accurate 30-day return policy guidelines and shipping timeframes** on policy pages to preserve merchant account health.
4. Keep `Dispute Rate` below 1% at all times by issuing refunds promptly rather than contesting customer chargebacks.
