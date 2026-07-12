# Perfusio Web — Next.js 15 standalone build.
FROM node:20-alpine AS builder
WORKDIR /repo

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/clinical/package.json packages/clinical/
COPY packages/contracts/package.json packages/contracts/
COPY apps/web/package.json apps/web/
RUN npm install --no-audit --no-fund

COPY packages ./packages
COPY apps/web ./apps/web
RUN npm run build --workspace @perfusio/clinical \
 && npm run build --workspace @perfusio/contracts \
 && npm run build --workspace @perfusio/web

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Next standalone output bundles only what the server needs.
COPY --from=builder /repo/apps/web/.next/standalone ./
COPY --from=builder /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /repo/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
