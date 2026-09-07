# Web Product Project — multi-storefront dropship platform

Self-hosted commerce platform running several independent niche storefronts
(cases, eyewear, toys, …) on one Medusa backend, with a dropship hub that routes
paid orders to suppliers (CJ Dropshipping, Printify), syncs tracking, and reports
contribution profit.

Full plan: `~/.claude/plans/t-i-ang-c-1-hashed-moore.md`

## Layout (Turborepo)

| Path | What |
|---|---|
| `apps/backend` | Medusa v2 backend + Admin (`@dtc/backend`) |
| `apps/storefront` | Next.js storefront, multi-theme (added in M1) |
| `packages/*` | shared code |
| `docker-compose.yml` | Postgres (5433), Redis (6379), MinIO (9002 API / 9001 console) |

> Local Postgres uses host port **5433** to avoid clashing with a machine-wide
> PostgreSQL install on 5432. MinIO API is on **9002** because Medusa owns 9000.

## Dev quickstart

```bash
npm install
npm run infra:up                       # start postgres + redis + minio
cp .env.example apps/backend/.env       # then fill secrets (already done locally)
npm --workspace @dtc/backend exec medusa db:migrate
npm --workspace @dtc/backend exec medusa user -e admin@dev.local -p supersecret
npm run backend:dev                     # http://localhost:9000 (admin at /app)
```

Health check: `curl http://localhost:9000/health` → `200`.

## Milestones

- **M0 Foundation** — infra, Medusa boots on Redis, migrations, admin user, CI ✅ (in progress)
- **M1 Commerce MVP** — Stripe, email, storefront (Home/PLP/PDP/Cart/Checkout), theme #1 (cases)
- **M2 Dropship MVP** — supplier + supplier-order modules, routing/push/tracking/refund workflows
- **M3 Production & scale** — theme #2 (eyewear), `/pnl`, visual regression, multi-domain, live Stripe
