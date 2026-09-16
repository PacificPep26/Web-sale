# Railway deploy notes

Goal: get the **Eyewear (Meridian Optic)** storefront live first — other 3
niches (Cases, Toys, Watches) later.

## Access
- GitHub repo (pushed, connected to Railway): https://github.com/PacificPep26/Web-sale.git
- Railway login: `tqn8886@gmail.com`
- Project ID: `d0520d1b-0197-4190-b0fc-ed8b67db72d4` (name: `illustrious-encouragement`)
- Environment ID: `0d67056c-b020-4618-ab3e-d072535264e0` (name: `production`)
- Relink CLI after any idle gap: `railway link -p d0520d1b-0197-4190-b0fc-ed8b67db72d4 -e 0d67056c-b020-4618-ab3e-d072535264e0`
- Account was on Free plan and hit a resource-provision limit; user upgraded
  (dashboard showed "30 days or $4.99 left" after).

## Services status (as of last check)
| Service | Role | Status | Domain |
|---|---|---|---|
| Postgres | managed db | ✅ running | (internal only) |
| Web-sale | Medusa **backend** (repurposed the auto-created GitHub service) | ❌ build FAILED | `web-sale-production.up.railway.app` |
| Redis | — | ⛔ **not yet created** — blocked earlier by free-plan limit, retry now that plan is upgraded | — |
| storefront (eyewear) | — | ⛔ **not yet created** | — |

## Web-sale (backend) config already set in dashboard
- Root Directory: `/` (repo root — required, Dockerfile's COPY paths assume this)
- Build → Dockerfile Path: `apps/backend/Dockerfile`
- Variables added: `JWT_SECRET`, `COOKIE_SECRET`, `MEDUSA_WORKER_MODE=shared`,
  `DATABASE_URL` (referenced from Postgres service), `ADMIN_CORS`,
  `AUTH_CORS`, `STORE_CORS` (all three currently = the backend's own domain —
  `STORE_CORS` needs to change to the storefront's domain once that exists)
- Networking → generated domain on **port 9000**: `web-sale-production.up.railway.app`
- **Still missing:** `REDIS_URL` (Redis service doesn't exist yet)

## Current blocker
Build failed at `RUN npx medusa build` (Dockerfile step 8/8). Railway's CLI
build-log output only shows:
```
[ERRO] [build 8/8] RUN npx medusa build
Build Failed: ... process "/bin/sh -c npx medusa build" did not complete successfully: exit code: 1
```
No fuller stack trace came through via `railway logs -s Web-sale -b`. Likely
cause to check first: `medusa build` probably needs `DATABASE_URL`/other env
vars available at **build** time too, or there's a real TS/build error —
needs the full log from the Railway dashboard's Deployments tab (build log
panel shows more than the CLI truncated version) to diagnose properly.

## Next steps (in order)
1. Open the failed deployment's **build log in the Railway dashboard**
   (Web-sale service → Deployments → click the failed one) to get the real
   error `medusa build` printed — CLI output was truncated.
2. Fix whatever that error is, redeploy.
3. Create Redis service now that the plan is upgraded:
   `railway add -d redis` (was blocked before by free-plan limit).
4. Add `REDIS_URL` to Web-sale variables (reference Redis service).
5. Once backend deploy succeeds: run migrations + seed against it. Options:
   - `railway run` locally against the linked service's env (pulls Railway's
     `DATABASE_URL`/etc into a local process) to run
     `medusa db:migrate`, the initial seed, `add-more-products.ts`,
     `fix-eyewear-images.ts`, `fix-heritage-images.ts`, and print the eyewear
     publishable key — same scripts already used locally throughout this
     project (see PROGRESS.md "Run it").
   - or `railway ssh` into the deployed service and run them there.
6. Create the **storefront** service (new Railway service, same GitHub repo):
   - Root Directory: `/`
   - Build → Dockerfile Path: `apps/storefront/Dockerfile` (already created
     this session, `output: "standalone"` set in `next.config.ts`)
   - Build-time ARGs / variables needed (Dockerfile declares these as ARGs,
     Railway passes matching service variables through automatically):
     `NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://web-sale-production.up.railway.app`,
     `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY_EYEWEAR=<from step 5>`,
     `NEXT_PUBLIC_DEFAULT_REGION=us`
   - Runtime: `SITE=eyewear` (already hardcoded in the Dockerfile too)
   - Networking → generate domain on port 3000
7. Go back and update backend's `STORE_CORS` to the storefront's real domain,
   redeploy backend.
8. Smoke test: storefront homepage, a PLP, a PDP, and the virtual try-on
   modal on `blue-light-filter-glasses` / `heritage-square-sunglasses`.

## Not done yet (separate from deploy)
- 10 original luxury-inspired eyewear products (user asked to replace real
  brand names/photos — refused for trademark reasons, agreed instead to
  original names + AI-generated images at Nano Banana Pro, $350 flat).
  1/10 generated so far: **Sovereign No. 7** (`apps/storefront/scripts/generate-luxury-eyewear.mjs`,
  list of all 10 concepts is in that file's `LUXURY_PRODUCTS` array). Still
  need: generate remaining 9 images, then create as Medusa products
  (Eyewear channel/category, $350 each) — a small backend script following
  the same pattern as `add-more-products.ts`/`fix-heritage-images.ts`.
