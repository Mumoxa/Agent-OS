FROM node:20-alpine AS builder
WORKDIR /repo
COPY . .
RUN npm ci
RUN npm run build --workspace @agent-os/runtime

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache dumb-init
ENV NODE_ENV=production
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/package.json ./package.json
COPY --from=builder /repo/apps/runtime/package.json ./apps/runtime/package.json
COPY --from=builder /repo/apps/runtime/dist ./apps/runtime/dist
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://api:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1))"
ENTRYPOINT ["dumb-init", "node", "apps/runtime/dist/index.js"]
