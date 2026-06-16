FROM node:20-alpine AS builder
WORKDIR /repo
COPY . .
RUN npm ci
RUN npm run build --workspace @agent-os/llm-router

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache dumb-init
ENV NODE_ENV=production
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/package.json ./package.json
COPY --from=builder /repo/apps/llm-router/package.json ./apps/llm-router/package.json
COPY --from=builder /repo/apps/llm-router/dist ./apps/llm-router/dist
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:4000/health').then(r => r.ok ? process.exit(0) : process.exit(1))"
ENTRYPOINT ["dumb-init", "node", "apps/llm-router/dist/index.js"]
