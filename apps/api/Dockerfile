# Perfusio API — multi-stage build.
# Stage 1 installs workspace deps and builds the API + its workspace packages.
FROM node:20-alpine AS builder
WORKDIR /repo

# Copy manifests first for layer caching.
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/clinical/package.json packages/clinical/
COPY packages/contracts/package.json packages/contracts/
COPY apps/api/package.json apps/api/
RUN npm install --no-audit --no-fund

# Copy sources and build.
COPY packages ./packages
COPY apps/api ./apps/api
RUN npm run build --workspace @perfusio/clinical \
 && npm run build --workspace @perfusio/contracts \
 && npm run build --workspace @perfusio/api

# Stage 2 — lean runtime image.
FROM node:20-alpine AS runner
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/packages ./packages
COPY --from=builder /repo/apps/api ./apps/api
COPY --from=builder /repo/package.json ./package.json

WORKDIR /repo/apps/api
EXPOSE 4000
# Apply pending migrations, then start.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
