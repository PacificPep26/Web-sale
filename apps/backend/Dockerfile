# ── build ─────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS build
WORKDIR /repo

# repo-level manifests (Turborepo workspace)
COPY package.json package-lock.json turbo.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared-types packages/shared-types
RUN npm ci

# Ship shared helpers as JavaScript and declarations for both Medusa and Node.
RUN npx tsc packages/shared-types/index.ts --target ES2021 --module commonjs --declaration --skipLibCheck --outDir /shared-types \
    && node -e "const fs = require('fs'); const p = require('./packages/shared-types/package.json'); p.main = 'index.js'; p.types = 'index.d.ts'; fs.writeFileSync('/shared-types/package.json', JSON.stringify(p))" \
    && cp /shared-types/* packages/shared-types/ \
    && rm packages/shared-types/index.ts packages/shared-types/playpuff.ts

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
RUN npm install --omit=dev --no-package-lock --legacy-peer-deps && npm cache clean --force
COPY --from=build /shared-types ./node_modules/@dtc/shared-types

EXPOSE 9000
# MEDUSA_WORKER_MODE=server | worker | shared  (set per service)
# run DB migrations as a one-off/init job: `npx medusa db:migrate`
CMD ["npx", "medusa", "start"]
