# Web Product Project — multi-storefront dropship platform

One Medusa backend running several independent niche storefronts (**cases**,
**eyewear**, **toys** — extendable), with a dropship hub that routes paid orders
to suppliers (CJ Dropshipping, Printify), syncs tracking, handles refunds, and
reports **contribution profit**.

Design + milestone log: `~/.claude/plans/t-i-ang-c-1-hashed-moore.md`

## Layout (Turborepo · npm workspaces)

| Path | What |
|---|---|
| `apps/backend` | Medusa v2 backend + Admin (`@dtc/backend`) |
| `apps/storefront` | Next.js 16 storefront, token-based multi-theme (`@dtc/storefront`) |
| `packages/shared-types` | contracts shared backend ↔ storefront |
| `docker-compose.yml` | Postgres **5433**, Redis 6379, MinIO **9002** API / 9001 console |

> Postgres uses host port **5433** to dodge a machine-wide PostgreSQL on 5432.
> MinIO API is on **9002** because Medusa owns 9000.

## Dev quickstart

```bash
npm install
npm run infra:up                                   # postgres + redis + minio

cp .env.example apps/backend/.env                   # then fill secrets
npm --workspace @dtc/backend exec medusa db:migrate # migrates + seeds base data,
                                                    # prints 3 publishable keys
npm --workspace @dtc/backend exec medusa user -e admin@dev.local -p supersecret

# paste the printed keys into apps/storefront/.env.local, then:
npm run backend:dev        # http://localhost:9000  (Admin at /app)
npm --workspace @dtc/storefront run dev             # http://localhost:3000
```

Re-print publishable keys any time:

```bash
npm --workspace @dtc/backend exec medusa exec ./src/scripts/print-publishable-keys.ts
```

## Niches & themes

Each niche = a Medusa **Sales Channel** + a CSS-token file. A deploy serves one
niche, chosen by the `SITE` env var (`cases` | `eyewear` | `toys`), or by request
host in production (`themes/registry.ts`). Adding a niche:

1. create the sales channel + publishable key (extend `initial-data-seed.ts` or the Admin)
2. add `apps/storefront/themes/<niche>.css` + an entry in `themes/registry.ts`
3. new Vercel project, same repo, `SITE=<niche>` + that niche's publishable key

No component code changes — verified: `SITE=eyewear` yields the eyewear brand,
theme, and correctly scoped products with zero edits.

## Dropship pipeline

`order.placed` (payment authorized) → **route-order-to-suppliers** (group by
supplier, idempotent `SupplierOrder`) → **push-supplier-order** (stock check →
place, with reconcile-after-timeout to avoid dupes) → **sync-supplier-tracking**
(cron, creates core fulfillment + tracking email) → **handle-refund-return**
(cancel where possible, record loss where shipped).

Suppliers have a **sandbox mode** (`config.sandbox: true`, or no credentials) that
returns deterministic fakes, so the whole flow runs locally without real API keys.
Admin: **Suppliers**, **Supplier orders**, **P&L** routes + per-order / per-product
widgets.

## Deploy

- **Backend**: `apps/backend/Dockerfile` builds one image; run two services with
  `MEDUSA_WORKER_MODE=server` and `=worker`, plus a one-off `medusa db:migrate`.
  Needs managed Postgres + Redis. (Railway / Render / Fly.)
- **Storefront**: Vercel, one project per niche, `SITE` + publishable key per project.
- Secrets: `SUPPLIER_SECRET_KEY` (64 hex), `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `RESEND_API_KEY`, `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID`, DB/Redis URLs, `REVALIDATE_SECRET`.
- Stripe: the storefront checkout uses the Stripe Payment Element when
  `NEXT_PUBLIC_STRIPE_PK` is set and the backend has `STRIPE_API_KEY`; otherwise it
  falls back to the system provider (test/dev). Live Stripe needs a supported-country
  business entity.

## CI

`.github/workflows/ci.yml` — backend (typecheck + migrate + `medusa build` against
pg/redis services) and storefront (typecheck + lint + `next build`).
Storefront E2E/visual (`apps/storefront/e2e`, Playwright) is opt-in:
`npm --workspace @dtc/storefront exec playwright install --with-deps && … test`.

## Milestones

- **M0** infra, Medusa on Redis, migrations, admin ✅
- **M1** Stripe + email, storefront (Home/PLP/PDP/Cart/Checkout), theme #1 ✅
- **M2** supplier + supplier-order modules, routing/push/tracking/refund workflows,
  jobs, Admin API + UI, Printify/CJ clients ✅
- **M3** theme #2 (token-only) ✅ · Dockerfile + CI ✅ · Playwright scaffold ✅ ·
  Meilisearch / real tax provider / live Stripe / 3PL supplier type — deferred
