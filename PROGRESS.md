# PROGRESS — Web Product Project

Living status + context doc. Full design rationale: `~/.claude/plans/t-i-ang-c-1-hashed-moore.md`.
Last updated: 2026-09-07.

---

## What this is

One **Medusa v2** backend serving **four independent single-niche storefronts**
(same Next.js codebase, different `SITE`), plus a **dropship hub** that routes
paid orders to suppliers (Printify / CJ Dropshipping), syncs tracking, handles
refunds, and reports contribution profit.

| Niche | Brand | Local URL | Sales channel |
|---|---|---|---|
| Phone/laptop cases | Casewin | http://localhost:3000 | `Cases` |
| Sunglasses / blue-light | Meridian Optic | http://localhost:3001 | `Eyewear` |
| Adult toys / puzzles / models | Odd Shelf | http://localhost:3002 | `Toys` |
| Watches | Kesten | http://localhost:3003 | `Watches` |
| — | Workspace hub | http://localhost:8080 | — |
| — | Medusa Admin | http://localhost:9000/app | — |

Admin login: `admin@dev.local` / `supersecret`.

---

## Milestones — status

| | Status |
|---|---|
| **M0** infra: Turborepo, Medusa on Redis, docker (pg/redis/minio), migrations, admin, Dockerfile, CI | ✅ |
| **M1** Stripe + email wiring, storefront (Home/PLP/PDP/Cart/Checkout/Order), theme #1 | ✅ |
| **M2** supplier + supplier-order + ad-spend modules, module links, routing / push / tracking / refund workflows, subscribers, cron jobs, Admin API + UI (Suppliers, Supplier orders, P&L, widgets), Printify + CJ + manual clients (with sandbox mode) | ✅ |
| **M3** theme #2+ verified token-only, Docker, GitHub Actions CI, Playwright scaffold | ✅ |
| **Post-M3** editorial redesign (maison style), mobile-first (drawer nav + sticky PDP bar), product search, 4th niche (watches), workspace hub, bag icon, webpack build fix | ✅ |
| **Deferred** product-import pipeline (paste supplier URL → auto product + markup), customer accounts/login, Meilisearch, real tax provider (Stripe Tax), live Stripe, `warehouse_3pl` supplier type | ⬜ |

---

## Layout

```
apps/backend/          Medusa v2.20.1 (@dtc/backend) + Admin extensions
  src/modules/         supplier · supplier-order · ad-spend · notification-resend
  src/workflows/       route-order-to-suppliers · push-supplier-order · sync-supplier-tracking · handle-refund-return
  src/subscribers/     order-placed · supplier-order-events · order-refunded
  src/jobs/            poll-supplier-tracking · detect-stuck-orders · reconcile-orders
  src/api/admin/       suppliers · supplier-orders · ad-spend · pnl · orders/[id]/refund-dropship
  src/admin/           widgets (order-supplier-status, product-supplier-mapping) + routes (suppliers, supplier-orders, pnl)
  src/lib/suppliers/   typed SupplierClient + printify-client + cj-client + manual-client (+ sandbox)
  src/migration-scripts/initial-data-seed.ts   ← the base data (region, channels, shipping, products, keys)
apps/storefront/       Next.js 16 (@dtc/storefront)
  themes/              tokens.base.css + {cases,eyewear,toys,watches}.css + registry.ts (brand/nav/hero/editorial per niche)
  lib/data/            regions · products · cart (server actions)
  components/          layout/ product/ cart/ checkout/ ui/
  app/                 / · collections/[handle] · products/[handle] · cart · checkout · order/[id] · search · pages/[slug] · api/revalidate
  e2e/                 Playwright smoke + visual (opt-in)
packages/shared-types/ dependency-free contracts
tools/hub/serve.mjs    workspace hub (:8080)
docker-compose.yml     postgres :5433 · redis :6379 · minio :9002/:9001
```

---

## Run it

```bash
# 1. infra
npm run infra:up

# 2. backend (first time: migrate + seed + admin user)
npm --workspace @dtc/backend exec medusa db:migrate       # prints 4 publishable keys
npm --workspace @dtc/backend exec medusa user -e admin@dev.local -p supersecret
#    → paste the 4 keys into apps/storefront/.env.local (NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY_*)
npm run backend:dev                                        # :9000  (Admin /app)

# 3. all four storefronts (builds once, then next start on 3000-3003)
npm run sites

# 4. workspace hub
npm run hub                                                # :8080

# re-print publishable keys any time:
npm --workspace @dtc/backend exec medusa exec ./src/scripts/print-publishable-keys.ts
```

Single-niche dev: `cd apps/storefront && SITE=eyewear npm run dev` (Next 16 dev
refuses two instances per dir → use `npm run sites` / `next start` for multiple).

---

## Gotchas (learned the hard way)

- **Money fields = `model.bigNumber()`**, not `model.number()` (which is an
  integer column — silently rounds 6.5 → 7).
- **Order line-item quantity** via `query.graph` is on `items.detail.quantity`
  (or `items.raw_quantity.value`), NOT `items.quantity` (undefined) →
  `undefined * cost = NaN` → Postgres `column "nan" does not exist`.
- **Payment guard**: route to suppliers once a `payment_collection.status` is
  `authorized`/`captured` — `order.payment_status` is a computed field and comes
  back `undefined` from `query.graph`.
- **Storefront build MUST use `--webpack`** (`next build --webpack`). Next
  16.3.4's Turbopack production build serves the CSS chunk with intermittent
  500s → unstyled pages. Dev (Turbopack) is fine.
- **`npm run sites` runs `npm run clean` first** (deletes `.next`) because
  `unstable_cache` persists a dead region id in `.next/cache` across a dev DB
  reset → "Region not found" 500s.
- **Local Postgres on 5432** on this machine → docker pg is on **5433**.
  **MinIO API on 9002** (Medusa owns 9000).
- **Node 24.7** here; Medusa wants `^20.19 || >=22.12` — works but off-piste.
- Suppliers created with **`config.sandbox: true`** (or no credentials) return
  deterministic fakes so the whole dropship pipeline runs with no real API keys.
- Launching `next start` from the wrong cwd (`apps/backend`) → "Could not find a
  production build" — must run from `apps/storefront`.
- Killing node on Windows: `taskkill //F //IM node.exe` (the PowerShell CIM
  filter with `$_` through git-bash is unreliable).

---

## Verified working (sandbox)

- Storefront: all 4 niches serve their own theme + brand + sales-channel-scoped
  products; Home/PLP/PDP/Cart/Checkout/Order/Search/policy pages 200; production
  build green; `tsc --noEmit` clean both apps.
- Full purchase: cart → address → shipping → payment (system provider) →
  complete → order; `order.placed` → confirmation email (notification-local) +
  Telegram (no-op w/o token) + routing.
- Dropship: order → route → `SupplierOrder` ready → push → `placed` (Printify &
  CJ sandbox); out-of-stock → `failed` (no auto-retry); Admin **Retry** →
  `placed`; tracking sync → `SupplierShipment` + core Fulfillment + order
  `shipped`; `/admin/pnl` returns contribution profit by day.
- Reconcile job re-routes a captured order that has no supplier order.

---

## Next up (pick one)

1. **Product-import pipeline** — Admin route: paste a supplier product URL/ID (or
   structured JSON) → pull title/images/variants/cost → create a **draft**
   product in a chosen sales channel + `supplier_variant` rows, priced by a
   markup rule (`cost × factor`, round `.99`). CJ-by-id path uses the CJ client
   when a CJ supplier has credentials. This is the headline dropship-tool feature.
2. **Customer accounts** — Medusa auth + storefront login/register, order history.
3. **Real images / photography** — current product images are Unsplash
   placeholders; swap per-product in Admin → Products, or extend the seed.
4. **Live Stripe** — set `STRIPE_API_KEY` + `NEXT_PUBLIC_STRIPE_PK`; needs a
   supported-country entity.

---

## Commit history (feature-level)

```
718a74a  header "Bag" text → shopping-bag icon + count badge
f984bdb  watches niche (Kesten) + workspace hub + classier hero images
2e5c289  build with webpack not Turbopack (fixes unstyled prod pages)
3184d17  product search
184c773  fix product images + run all four niche sites locally
1699d67  editorial redesign (maison style) + mobile-first + bigger catalog
bc00c16  M3: multi-theme verified, Docker, CI, Playwright scaffold
fbe70ca  M2: dropship pipeline — modules, workflows, admin, clients
8833ff7  M1: US multi-niche seed, Stripe/notification wiring, Next.js storefront
3ea98c7  M0: scaffold Turborepo + Medusa v2 backend on docker infra
```
