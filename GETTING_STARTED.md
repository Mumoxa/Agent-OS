# Getting Started with Agent OS

This guide helps you run the Agent OS MVP locally and deploy it to the free Oracle Cloud tier.

## Prerequisites

- Node.js 20+
- pnpm 9+ (`corepack enable && corepack prepare pnpm@latest --activate`)
- Docker + Docker Compose
- Git
- A domain name (for production with Cloudflare)
- Free accounts:
  - Oracle Cloud (Always Free VM)
  - Cloudflare
  - Neon (optional, for managed Postgres)
  - Google AI Studio (Gemini API key)
  - Groq (API key)
  - Clerk (or LogTo for auth)

## Local development

```bash
# 1. Clone or extract the repo
cd agent-os

# 2. Install dependencies
pnpm install

# 3. Copy environment template
cp .env.example .env

# 4. Fill in .env with your free API keys
# Minimum required:
# - DATABASE_URL (Neon URL or local Postgres)
# - REDIS_URL (redis://redis:6379)
# - NEO4J_PASSWORD
# - LLM_ROUTER_URL (http://llm-router:4000)
# - GEMINI_API_KEY or GROQ_API_KEY
# - JWT_SECRET

# 5. Start the stack
docker compose up -d

# 6. Pull a local LLM (optional but recommended)
docker exec -it agent-os-ollama ollama pull llama3.2

# 7. Verify services
curl http://localhost:3000/health      # API
curl http://localhost:4000/health      # LLM router

# 8. Start the PWA dev server
cd apps/web
pnpm dev
# Open http://localhost:5173
```

## Trigger the pipeline from the PWA

1. Open the dashboard at http://localhost:5173
2. Enter a feature request in the "Product Release Pipeline" card
3. Click "Start pipeline"
4. Watch stages update as agents run

## Trigger the pipeline from the API

```bash
curl http://localhost:3000/v1/workflows/product_release \
  -H "Content-Type: application/json" \
  -d '{"request":"Build a feature that exports daily briefings as PDF"}'
```

## Deploy to Oracle Cloud (free tier)

1. Configure Oracle Cloud credentials in `infra/oracle/terraform.tfvars`.
2. Run:

```bash
cd infra/oracle
terraform init
terraform apply
```

3. Update Cloudflare DNS A record to the VM IP.
4. Create Cloudflare Origin Certificate and upload to `infra/nginx/ssl/`.
5. Set GitHub Actions secrets:
   - `OCI_HOST`
   - `OCI_USER`
   - `OCI_SSH_KEY`
   - `ENV_FILE` (base64-encoded `.env`)
6. Push to `main` — GitHub Actions deploys automatically.

## Project structure

See `STRUCTURE.md` for the full file tree.

## Common commands

```bash
# Build everything
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint

# Run the product release workflow manually
cd apps/runtime
pnpm start:workflow
```

## Troubleshooting

| Issue | Solution |
|---|---|
| Oracle VM is slow | Restart the VM; check CPU steal |
| ARM Docker images missing | Build on the VM or use `linux/arm64` tags |
| LLM quota exhausted | Switch provider or use local Ollama |
| Neo4j password error | Set `NEO4J_PASSWORD` in `.env` |
| PWA not connecting | Check `VITE_` env and API health |

## Next steps

- Read the architecture docs in the workspace root.
- See `phase-*.md` files for implementation details.
- Customize agents in `agents/manifests/`.
- Add more agent implementations in `apps/runtime/src/agents/`.
