# ── build ─────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS build
WORKDIR /repo

# repo-level manifests (Turborepo workspace)
COPY package.json package-lock.json turbo.json ./
COPY apps/storefront/package.json apps/storefront/package.json
COPY packages packages
RUN npm ci

COPY apps/storefront apps/storefront

# NEXT_PUBLIC_* vars are inlined at build time — Railway passes service
# variables through as build args automatically when they match an ARG name
# declared here.
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY_EYEWEAR
ARG NEXT_PUBLIC_DEFAULT_REGION=us
ENV NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL
ENV NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY_EYEWEAR=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY_EYEWEAR
ENV NEXT_PUBLIC_DEFAULT_REGION=$NEXT_PUBLIC_DEFAULT_REGION
ENV SITE=eyewear

WORKDIR /repo/apps/storefront
RUN npx next build --webpack

# ── runtime ───────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV SITE=eyewear
WORKDIR /app

# Next.js standalone output is self-contained (its own node_modules subset)
COPY --from=build /repo/apps/storefront/.next/standalone ./
COPY --from=build /repo/apps/storefront/.next/static ./apps/storefront/.next/static
COPY --from=build /repo/apps/storefront/public ./apps/storefront/public

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/storefront/server.js"]
