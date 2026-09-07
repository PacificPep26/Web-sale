# ── build ─────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS build
WORKDIR /repo

# repo-level manifests (Turborepo workspace)
COPY package.json package-lock.json turbo.json ./
COPY apps/backend/package.json apps/backend/package.json
RUN npm ci

COPY apps/backend apps/backend
WORKDIR /repo/apps/backend
RUN npx medusa build

# ── runtime ───────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# the compiled server is self-contained under .medusa/server
COPY --from=build /repo/apps/backend/.medusa/server ./
COPY --from=build /repo/apps/backend/package.json ./package.json
RUN npm ci --omit=dev && npm cache clean --force

EXPOSE 9000
# MEDUSA_WORKER_MODE=server | worker | shared  (set per service)
# run DB migrations as a one-off/init job: `npx medusa db:migrate`
CMD ["npx", "medusa", "start"]
